/* Page Aperçu 3D : le modèle en vrai livret — feuilletage, rotation, zoom, modes. */

import { initSite } from '../components/nav.js';
import { el, qs, qsa, getParam } from '../core/utils.js';
import { categorieById } from '../data/categories.js';
import { modeleById, buildDefaultProject, themeById, fontById } from '../data/modeles.js';
import { renderPage, renderAllPages } from '../components/pageRenderer.js';
import { createBook3D } from '../components/book3d.js';

initSite({ active: 'modeles' });

const id = getParam('id') || 'mariage-alliance';
const modele = modeleById(id);
const layout = qs('#viewer-layout');

if (!modele) {
  layout.innerHTML = '';
  layout.append(el('div', { class: 'viewer-notfound' }, [
    el('h1', {}, 'Modèle introuvable'),
    el('p', { class: 'lead', style: 'margin-inline:auto' }, 'Ce modèle n\'existe pas ou n\'est plus proposé.'),
    el('a', { class: 'btn btn-gold', href: 'modeles.html', style: 'margin-top:16px' }, 'Voir tous les modèles'),
  ]));
} else {
  const projet = buildDefaultProject(modele.id);
  const categorie = categorieById(modele.categorieId);
  const theme = themeById(modele.themeId);
  const font = fontById(modele.fontId);
  document.title = `Modèle ${modele.nom} (${categorie?.nom || ''}) — L'Atelier du Livret`;

  /* ---------------- Panneau ---------------- */

  const panel = qs('#v-panel');
  panel.append(
    el('span', { class: 'badge' }, categorie?.nom || ''),
    el('h1', {}, `Modèle ${modele.nom}`),
    el('p', { class: 'desc' }, modele.description),
    el('div', { class: 'viewer-specs' }, [
      el('div', { class: 'viewer-spec' }, [
        el('span', {}, 'Palette'),
        el('span', { style: 'display:inline-flex;align-items:center;gap:8px' }, [
          el('span', { class: 'modele-dots', 'aria-hidden': 'true' }, [
            el('span', { style: `background:${theme.paper}` }),
            el('span', { style: `background:${theme.accent}` }),
            el('span', { style: `background:${theme.soft}` }),
          ]),
          el('strong', {}, theme.nom),
        ]),
      ]),
      el('div', { class: 'viewer-spec' }, [el('span', {}, 'Police'), el('strong', {}, font.nom)]),
      el('div', { class: 'viewer-spec' }, [el('span', {}, 'Pages proposées'), el('strong', {}, `${projet.pages.length} pages A5`)]),
      el('div', { class: 'viewer-spec' }, [el('span', {}, 'Personnalisation'), el('strong', {}, 'Textes · chants · photos · couleurs')]),
    ]),
    el('a', { class: 'btn btn-gold btn-lg', href: `configurateur.html?modele=${modele.id}` }, 'Personnaliser ce modèle'),
    el('a', { class: 'viewer-retour', href: `modeles.html?categorie=${modele.categorieId}` },
      `← Tous les modèles ${categorie ? categorie.nom.toLowerCase() : ''}`),
  );

  /* ---------------- Livre 3D ---------------- */

  const indicator = qs('#v-indicator');
  const thumbs = qs('#v-thumbs');
  let currentPage = 1;

  const book = createBook3D(qs('#scene'), () => renderAllPages(projet), {
    mode: '3d',
    onChange: ({ page, pageCount }) => {
      currentPage = page;
      indicator.textContent = `page ${page} / ${pageCount}`;
      qsa('.viewer-thumb', thumbs).forEach((t, i) =>
        t.classList.toggle('is-active', i === page - 1));
    },
  });

  qs('#v-prev').addEventListener('click', () => book.prev());
  qs('#v-next').addEventListener('click', () => book.next());
  qs('#v-zoom-in').addEventListener('click', () => book.zoomIn());
  qs('#v-zoom-out').addEventListener('click', () => book.zoomOut());
  qs('#v-reset').addEventListener('click', () => book.resetView());

  qsa('.viewer-modes .chip').forEach((chip) => {
    chip.addEventListener('click', () => {
      qsa('.viewer-modes .chip').forEach((c) => {
        const active = c === chip;
        c.classList.toggle('is-active', active);
        c.setAttribute('aria-pressed', String(active));
      });
      book.setMode(chip.dataset.mode);
    });
  });

  /* Vignettes */
  projet.pages.forEach((page, i) => {
    const btn = el('button', {
      class: `viewer-thumb${i === 0 ? ' is-active' : ''}`,
      type: 'button',
      'aria-label': `Aller à la page ${i + 1}`,
      onclick: () => book.goToPage(i),
    }, [renderPage(page, projet, { pageNumber: i + 1 }), el('span', { class: 'viewer-thumb-num' }, String(i + 1))]);
    thumbs.append(btn);
  });

  /* Petite invite : entrouvrir la couverture, puis revenir. */
  if (!matchMedia('(prefers-reduced-motion: reduce)').matches) {
    setTimeout(() => { book.next(); }, 900);
    setTimeout(() => { book.goToSpread(0); }, 2300);
  }
}
