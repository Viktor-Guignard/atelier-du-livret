/*
 * Moteur de rendu du livret : transforme une page de projet (liste de blocs)
 * en élément DOM .lv-page. Utilisé partout où le livret apparaît : vignettes,
 * aperçu du configurateur, livre 3D, page modèle.
 */

import { el, escapeHtml, interpolate } from '../core/utils.js';
import { chantById, categorieLiturgique } from '../data/chants.js';
import { themeById, fontById } from '../data/modeles.js';
import { ornament, filetSVG, ORNAMENTS } from './ornaments.js';

/** Texte multi-lignes : placeholders résolus, HTML échappé, \n préservés (white-space: pre-line). */
const ml = (text, fields) => escapeHtml(interpolate(text, fields));

const hexToRgbArr = (hex) => {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return m ? [1, 2, 3].map((i) => parseInt(m[i], 16)) : [0, 0, 0];
};

/**
 * Mélange OPAQUE de deux couleurs hex (`ratio` = poids de `hex`, le reste de
 * `bgHex`) → 'rgb(r, g, b)', SANS alpha. Remplace toute transparence dans les
 * styles du livret : Chrome sérialise désormais les couleurs avec alpha
 * (même une rgba() littérale) en notation CSS Color 4 `color(srgb r g b / a)`
 * via getComputedStyle, que html2canvas (utilisé pour l'export PDF) ne sait
 * pas interpréter. Une couleur 100% opaque n'a pas ce problème. color-mix()
 * a le même souci et est donc banni des styles du livret.
 */
function blendHex(hex, bgHex, ratio) {
  const c1 = hexToRgbArr(hex);
  const c2 = hexToRgbArr(bgHex);
  const mix = c1.map((v, i) => Math.round(v * ratio + c2[i] * (1 - ratio)));
  return `rgb(${mix.join(', ')})`;
}

/** Applique la palette et les polices du projet sur un élément (variables --lv-*). */
export function applyProjectStyle(node, project) {
  const theme = themeById(project.themeId);
  const font = fontById(project.fontId);
  node.style.setProperty('--lv-paper', theme.paper);
  node.style.setProperty('--lv-ink', theme.ink);
  node.style.setProperty('--lv-accent', theme.accent);
  node.style.setProperty('--lv-accent-45', blendHex(theme.accent, theme.paper, .45));
  node.style.setProperty('--lv-accent-40', blendHex(theme.accent, theme.paper, .4));
  node.style.setProperty('--lv-soft', theme.soft);
  node.style.setProperty('--lv-display', font.display);
  node.style.setProperty('--lv-body', font.body);
}

/* ---------------- Rendu des blocs ---------------- */

function renderCover(block, project) {
  const f = project.fields;
  const variant = block.variant || 'ornement';
  const cover = el('div', { class: `lv-cover lv-cover--${variant}` });

  if (variant === 'botanique') {
    cover.append(
      el('span', { class: 'lv-corner lv-corner--tl', html: ORNAMENTS.rameau }),
      el('span', { class: 'lv-corner lv-corner--br', html: ORNAMENTS.rameau }),
    );
  }

  if (variant === 'photo') {
    const frame = el('div', { class: 'lv-photo lv-photo--arch', style: 'width:72%;margin-bottom:0' }, [
      el('div', { class: 'lv-photo-frame' },
        block.src
          ? [el('img', { src: block.src, alt: '' })]
          : [el('span', { class: 'lv-photo-placeholder', html: ornament(block.ornament || 'colombe') })]),
    ]);
    cover.append(frame);
  } else if (block.showOrnament !== false && variant !== 'typographique') {
    cover.append(el('span', { class: 'lv-cover-ornament', html: ornament(block.ornament || 'croix') }));
  }

  cover.append(
    el('p', { class: 'lv-cover-title', html: ml(block.title, f) }),
    el('p', { class: 'lv-cover-subtitle', html: ml(block.subtitle, f) }),
    el('span', { class: 'lv-cover-filet', html: filetSVG }),
    el('p', { class: 'lv-cover-meta', html:
      ml('{{date}} · {{heure}}', f) + '<br>' + ml('{{lieu}} — {{ville}}', f) }),
  );

  if (variant === 'typographique' && block.showOrnament !== false) {
    cover.append(el('span', { class: 'lv-cover-ornament', style: 'width:9cqw', html: ornament(block.ornament || 'croix') }));
  }
  return cover;
}

function renderChant(block, project) {
  const source = block.custom || chantById(block.chantId);
  const label = categorieLiturgique(block.categorieLiturgique)?.nom || 'Chant';
  const wrapper = el('div', { class: 'lv-chant' }, [
    el('div', { class: 'lv-chant-label', html: escapeHtml(label) }),
  ]);
  if (!source) {
    wrapper.append(el('div', { class: 'lv-chant-note' }, 'Choisir un chant dans la bibliothèque…'));
    return wrapper;
  }
  wrapper.append(el('div', { class: 'lv-chant-titre', html: ml(source.titre, project.fields) }));
  if (source.paroles) {
    wrapper.append(el('div', { class: 'lv-chant-paroles', html: ml(source.paroles, project.fields) }));
  }
  if (!block.custom && source.complet === false) {
    wrapper.append(el('div', { class: 'lv-chant-note' },
      source.note || 'Paroles complètes à insérer dans le configurateur.'));
  }
  return wrapper;
}

const BLOCK_RENDERERS = {
  cover: renderCover,
  chant: renderChant,

  heading: (block, project) => el('div', {}, [
    el('h3', { class: 'lv-heading', html: ml(block.text, project.fields) }),
    el('div', { class: 'lv-heading-filet', html: filetSVG }),
  ]),

  subheading: (block, project) =>
    el('p', { class: 'lv-subheading', html: ml(block.text, project.fields) }),

  text: (block, project) =>
    el('p', { class: `lv-text${block.align === 'left' ? ' lv-text--left' : ''}`, html: ml(block.text, project.fields) }),

  lecture: (block, project) => el('div', { class: 'lv-lecture' }, [
    el('div', { class: 'lv-lecture-ref', html: ml(block.reference, project.fields) }),
    el('div', { class: 'lv-lecture-titre', html: ml(block.titre, project.fields) }),
    block.extrait ? el('div', { class: 'lv-lecture-extrait', html: ml(block.extrait, project.fields) }) : null,
  ]),

  priere: (block, project) => el('div', { class: 'lv-priere' }, [
    el('div', { class: 'lv-priere-titre', html: ml(block.titre, project.fields) }),
    el('div', { class: 'lv-priere-texte', html: ml(block.texte, project.fields) }),
  ]),

  photo: (block, project) => el('figure', { class: `lv-photo lv-photo--${block.shape || 'arch'}`, style: 'margin-inline:auto' }, [
    el('div', { class: 'lv-photo-frame' },
      block.src
        ? [el('img', { src: block.src, alt: escapeHtml(block.caption || 'Photographie') })]
        : [el('span', { class: 'lv-photo-placeholder', html: ORNAMENTS.livre })]),
    block.caption ? el('figcaption', { class: 'lv-photo-caption', html: ml(block.caption, project.fields) }) : null,
  ]),

  ornament: (block) =>
    el('div', { class: 'lv-ornament', html: ornament(block.motif) }),

  spacer: (block) =>
    el('div', { class: `lv-spacer--${block.size || 'm'}`, 'aria-hidden': 'true' }),

  deroulement: (block, project) => el('div', { class: 'lv-deroulement' },
    (block.items || []).map((item) => el('div', { class: 'lv-deroulement-item' }, [
      el('span', { class: 'lv-deroulement-heure', html: ml(item.heure, project.fields) }),
      el('span', { html: ml(item.label, project.fields) }),
    ]))),

  remerciement: (block, project) =>
    el('p', { class: 'lv-remerciement', html: ml(block.texte, project.fields) }),
};

/** Rend un bloc isolé (utilisé par le configurateur pour les mises à jour ciblées). */
export function renderBlock(block, project) {
  const renderer = BLOCK_RENDERERS[block.type];
  const node = renderer
    ? renderer(block, project)
    : el('p', { class: 'lv-text' }, `[bloc inconnu : ${block.type}]`);
  node.dataset.blockId = block.id;
  node.dataset.blockType = block.type;
  return node;
}

/**
 * Rend une page complète du livret.
 * opts : { pageNumber, totalPages, interactive } — interactive ajoute les
 * data-attributes utilisés par le configurateur pour l'édition au clic.
 */
export function renderPage(page, project, opts = {}) {
  const node = el('article', {
    class: 'lv-page',
    'data-page-id': page.id,
    role: 'img',
    'aria-label': `Page ${opts.pageNumber || ''} du livret`,
  });
  applyProjectStyle(node, project);

  const inner = el('div', { class: 'lv-page-inner' });
  if (!page.blocks.length) {
    inner.append(el('div', { class: 'lv-page-vide', html: ORNAMENTS.filet }));
  }
  for (const block of page.blocks) inner.append(renderBlock(block, project));
  node.append(inner);

  const isCover = page.blocks.some((b) => b.type === 'cover');
  if (opts.pageNumber && opts.pageNumber > 1 && !isCover) {
    node.append(el('div', { class: 'lv-folio' }, String(opts.pageNumber)));
  }

  // Filigrane anti-copie sur tous les aperçus écran ; opts.print le retire
  // (atelier d'impression uniquement).
  if (!opts.print) {
    node.append(el('div', { class: 'lv-watermark', 'aria-hidden': 'true' }));
  }
  return node;
}

/** Rend toutes les pages du projet (tableau d'éléments .lv-page). */
export function renderAllPages(project, opts = {}) {
  return project.pages.map((page, i) =>
    renderPage(page, project, { ...opts, pageNumber: i + 1, totalPages: project.pages.length }));
}

/**
 * Vignette d'une page : rend le livret à une largeur de RÉFÉRENCE (320 px, où
 * les polices ont une taille normale) puis le réduit par `transform: scale()`
 * pour remplir son conteneur. Le texte suit la mise à l'échelle SANS être
 * bloqué par un éventuel « minimum font size » du navigateur (Safari) — ce que
 * les unités container (cqw) ne garantissent pas sur toutes les tailles.
 * Le conteneur définit la largeur ; la vignette s'y adapte (ResizeObserver).
 */
const THUMB_REF = 600;   // largeur de rendu de référence : polices assez grandes pour jamais être bloquées
export function renderPageThumb(page, project, opts = {}) {
  const pageNode = renderPage(page, project, opts);
  pageNode.style.width = `${THUMB_REF}px`;
  pageNode.style.flex = 'none';

  const inner = el('div', {}, [pageNode]);
  inner.style.cssText = 'position:absolute;top:0;left:0;transform-origin:top left;will-change:transform;';

  const wrap = el('div', { class: 'lv-thumb' }, [inner]);
  wrap.style.cssText = 'position:relative;overflow:hidden;width:100%;aspect-ratio:148 / 210;';

  // getBoundingClientRect().width est fiable ici (contrairement à clientWidth,
  // qui peut renvoyer 0 avec aspect-ratio + enfant en position absolue).
  // Déclencheurs multiples (ResizeObserver + rAF + timeouts + load) pour que le
  // scale s'applique quel que soit le navigateur/timing — sinon la page 600px
  // s'afficherait à taille réelle, rognée.
  let done = false;
  const apply = (w) => {
    const width = w || wrap.getBoundingClientRect().width;
    if (width) { inner.style.transform = `scale(${width / THUMB_REF})`; done = true; }
  };
  if (typeof ResizeObserver !== 'undefined') {
    new ResizeObserver((entries) => apply(entries[0]?.contentRect?.width)).observe(wrap);
  }
  requestAnimationFrame(() => apply());
  [0, 120, 400].forEach((d) => setTimeout(() => { if (!done) apply(); }, d));
  window.addEventListener('load', () => { if (!done) apply(); }, { once: true });
  return wrap;
}

/** Toutes les pages en vignettes (transform-scale) — pour les bandeaux de miniatures. */
export function renderAllThumbs(project, opts = {}) {
  return project.pages.map((page, i) =>
    renderPageThumb(page, project, { ...opts, pageNumber: i + 1, totalPages: project.pages.length }));
}
