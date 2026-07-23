/*
 * LE CONFIGURATEUR — fonctionnalité centrale du site.
 * Panneau gauche : Informations / Pages / Chants / Style.
 * Zone droite : aperçu temps réel (édition, livre 3D, double page, page à page).
 * Toute mutation passe par ProjectStore, qui émet 'change' → rafraîchissement ciblé.
 */

import { qs, qsa, el, debounce, getParam, escapeHtml, fileToDataURL, clamp } from '../core/utils.js';
import { ProjectStore, loadProject, saveProject, listProjects, deleteProject } from '../core/store.js';
import { buildDefaultProject, modeleById, THEMES, FONTS, themeById, fontById } from '../data/modeles.js';
import { categorieById } from '../data/categories.js';
import { CATEGORIES_LITURGIQUES, chantById, searchChants, categorieLiturgique } from '../data/chants.js';
import { renderPage, renderPageThumb, renderAllPages } from '../components/pageRenderer.js';
import { createBook3D } from '../components/book3d.js';
import { showToast } from '../components/toast.js';
import { addToCart, cartItems } from '../core/cart.js';

/* ================================================================
   Chargement du projet
   ================================================================ */

function resolveProject() {
  const projetId = getParam('projet');
  if (projetId) {
    const saved = loadProject(projetId);
    if (saved) return saved;
    // Pas en localStorage : peut-être un livret repris depuis un panier (code,
    // autre appareil). On ré-hydrate le store depuis l'instantané du panier.
    const fromCart = cartItems().find((it) => it.projet?.id === projetId)?.projet;
    if (fromCart) { saveProject(fromCart); return fromCart; }
    showToast('Projet introuvable — un nouveau livret a été créé.', 'error');
  }
  const modeleId = getParam('modele');
  if (modeleId && !modeleById(modeleId)) {
    showToast('Modèle inconnu — modèle « Alliance » chargé.', 'error');
  }
  return buildDefaultProject(modeleId && modeleById(modeleId) ? modeleId : 'mariage-alliance');
}

const store = new ProjectStore(resolveProject());
const project = () => store.project;

let currentPageIndex = 0;
let selectedBlockId = null;
let view = 'edition';           // 'edition' | '3d' | 'double' | 'simple'
let book = null;
let editionZoom = 1;
let dirty = false;
let saveTimer = null;

/* ================================================================
   Barre supérieure : nom, statut, enregistrement
   ================================================================ */

const statusEl = qs('#cfg-status');
const nomInput = qs('#cfg-nom');
nomInput.value = project().nom;
nomInput.addEventListener('input', () => store.setNom(nomInput.value));

function setStatus(text, cls = '') {
  statusEl.textContent = text;
  statusEl.className = `cfg-status ${cls}`;
}

function markDirty() {
  dirty = true;
  setStatus('Modifications non enregistrées', 'is-dirty');
  clearTimeout(saveTimer);
  saveTimer = setTimeout(doSave, 2500);      // enregistrement automatique
}

function doSave() {
  clearTimeout(saveTimer);
  store.save();
  dirty = false;
  const h = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  setStatus(`Enregistré à ${h}`, 'is-saved');
  history.replaceState(null, '', `configurateur.html?projet=${project().id}`);
  qs('#cfg-commander').href = `commande.html?projet=${project().id}`;
}

qs('#cfg-save').addEventListener('click', () => { doSave(); showToast('Projet enregistré sur cet appareil.', 'success'); });
qs('#cfg-commander').addEventListener('click', doSave);
window.addEventListener('beforeunload', (e) => { if (dirty) { doSave(); } });

// Ajouter au panier : enregistre le livret puis l'ajoute (upsert par id).
const addCartBtn = qs('#cfg-add-cart');
addCartBtn.addEventListener('click', () => {
  doSave();
  if (!addToCart(project())) {
    showToast('Panier plein sur cet appareil — retirez un livret ou passez commande.', 'error');
    return;
  }
  showToast('Livret ajouté au panier.', 'success');
  const label = addCartBtn.innerHTML;
  addCartBtn.innerHTML = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg> Ajouté au panier';
  addCartBtn.disabled = true;
  setTimeout(() => { addCartBtn.innerHTML = label; addCartBtn.disabled = false; }, 1800);
});

/* ================================================================
   Aperçu — vue édition (page courante en grand)
   ================================================================ */

const canvas = qs('#cfg-page-canvas');

function checkOverflow(pageNode) {
  requestAnimationFrame(() => {
    const inner = pageNode.querySelector('.lv-page-inner');
    if (!inner) return;
    pageNode.classList.toggle('is-overflowing', inner.scrollHeight > inner.clientHeight + 2);
  });
}

function renderEdition() {
  currentPageIndex = clamp(currentPageIndex, 0, project().pages.length - 1);
  const page = project().pages[currentPageIndex];
  canvas.textContent = '';
  const node = renderPage(page, project(), { pageNumber: currentPageIndex + 1, totalPages: project().pages.length });
  node.removeAttribute('role');                       // interactif dans l'éditeur
  node.setAttribute('aria-label', `Page ${currentPageIndex + 1} — cliquez sur un élément pour le modifier`);
  canvas.append(node);
  checkOverflow(node);

  // Clic sur un bloc → ouvrir son éditeur.
  node.addEventListener('click', (e) => {
    const blockNode = e.target.closest('[data-block-id]');
    if (blockNode) selectBlock(page.id, blockNode.dataset.blockId);
  });
  if (selectedBlockId) {
    node.querySelector(`[data-block-id="${selectedBlockId}"]`)?.classList.add('is-selected');
  }
}

/* ================================================================
   Vignettes
   ================================================================ */

const thumbs = qs('#cfg-thumbs');

function renderThumbs() {
  thumbs.textContent = '';
  project().pages.forEach((page, i) => {
    const btn = el('button', {
      class: `cfg-thumb${i === currentPageIndex ? ' is-active' : ''}`,
      type: 'button',
      role: 'option',
      'aria-selected': String(i === currentPageIndex),
      'aria-label': `Aller à la page ${i + 1}`,
      onclick: () => { goToPageIndex(i); },
    }, [renderPageThumb(page, project(), { pageNumber: i + 1 }), el('span', { class: 'cfg-thumb-num' }, String(i + 1))]);
    thumbs.append(btn);
  });
  thumbs.querySelector('.is-active')?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
}

function goToPageIndex(i) {
  currentPageIndex = clamp(i, 0, project().pages.length - 1);
  selectedBlockId = null;
  renderEdition();
  renderThumbs();
  renderPagesPane();
  if (view !== 'edition' && book) book.goToPage(currentPageIndex);
}

qs('#page-prev').addEventListener('click', () => goToPageIndex(currentPageIndex - 1));
qs('#page-next').addEventListener('click', () => goToPageIndex(currentPageIndex + 1));
qs('#thumb-add').addEventListener('click', () => {
  const page = store.addPage(project().pages[currentPageIndex]?.id);
  goToPageIndex(project().pages.findIndex((p) => p.id === page.id));
  switchTab('pages');
  showToast('Page ajoutée.', 'success');
});

/* ================================================================
   Vue livre (3D / double / simple)
   ================================================================ */

const viewEdition = qs('#view-edition');
const viewBook = qs('#view-book');
const bookIndicator = qs('#book-indicator');

function ensureBook() {
  if (book) return book;
  book = createBook3D(qs('#cfg-book'), () => renderAllPages(project()), {
    mode: '3d',
    onChange: ({ page, pageCount }) => {
      bookIndicator.textContent = `page ${page} / ${pageCount}`;
    },
  });
  qs('#book-prev').addEventListener('click', () => book.prev());
  qs('#book-next').addEventListener('click', () => book.next());
  return book;
}

function setView(next) {
  view = next;
  qsa('.cfg-modes .chip').forEach((c) => {
    const active = c.dataset.view === next;
    c.classList.toggle('is-active', active);
    c.setAttribute('aria-pressed', String(active));
  });
  const isEdition = next === 'edition';
  viewEdition.hidden = !isEdition;
  viewEdition.style.display = isEdition ? '' : 'none';
  viewBook.hidden = isEdition;
  if (!isEdition) {
    ensureBook();
    book.refresh();
    book.setMode(next);
    book.goToPage(currentPageIndex);
  } else {
    renderEdition();
  }
}

qsa('.cfg-modes .chip').forEach((chip) =>
  chip.addEventListener('click', () => setView(chip.dataset.view)));

/* Zoom */
function applyEditionZoom() {
  canvas.style.width = `min(calc(46vh * ${editionZoom}), ${Math.round(560 * editionZoom)}px)`;
}
qs('#zoom-in').addEventListener('click', () => {
  if (view === 'edition') { editionZoom = clamp(editionZoom * 1.18, .5, 2.6); applyEditionZoom(); }
  else ensureBook().zoomIn();
});
qs('#zoom-out').addEventListener('click', () => {
  if (view === 'edition') { editionZoom = clamp(editionZoom / 1.18, .5, 2.6); applyEditionZoom(); }
  else ensureBook().zoomOut();
});
qs('#zoom-reset').addEventListener('click', () => {
  if (view === 'edition') { editionZoom = 1; canvas.style.width = ''; }
  else ensureBook().resetView();
});

/* ================================================================
   Rafraîchissement sur mutation du store
   ================================================================ */

const refreshPreview = debounce(() => {
  if (view === 'edition') renderEdition();
  else if (book) { book.refresh(); book.goToPage(currentPageIndex); }
  renderThumbs();
}, 90);

store.on(() => { markDirty(); refreshPreview(); });

/* ================================================================
   Onglets du panneau
   ================================================================ */

function switchTab(name) {
  qsa('.cfg-tab').forEach((t) => {
    const active = t.dataset.pane === name;
    t.classList.toggle('is-active', active);
    t.setAttribute('aria-selected', String(active));
  });
  qsa('.cfg-pane').forEach((p) => { p.hidden = p.id !== `pane-${name}`; p.classList.toggle('is-active', p.id === `pane-${name}`); });
}
qsa('.cfg-tab').forEach((t) => t.addEventListener('click', () => switchTab(t.dataset.pane)));

/* ================================================================
   Onglet INFORMATIONS
   ================================================================ */

const FIELD_DEFS = [
  ['prenom', 'Prénom'], ['nom', 'Nom'],
  ['prenom2', 'Prénom (2ᵉ personne)'], ['nom2', 'Nom (2ᵉ personne)'],
  ['date', 'Date de la cérémonie'], ['heure', 'Horaire'],
  ['lieu', 'Lieu (église)'], ['ville', 'Ville'], ['celebrant', 'Célébrant'],
];

function renderInfosPane() {
  const pane = qs('#pane-infos');
  pane.textContent = '';
  const duo = ['mariage', 'jubile'].includes(project().categorieId);

  pane.append(el('h3', {}, 'La cérémonie'));
  pane.append(el('p', { class: 'small muted', style: 'margin-bottom:16px' },
    'Ces informations remplissent automatiquement toutes les pages du livret.'));

  for (const [key, label] of FIELD_DEFS) {
    if (!duo && (key === 'prenom2' || key === 'nom2') && !project().fields[key]) continue;
    const id = `f-${key}`;
    const input = el('input', {
      id,
      type: key === 'date' ? 'date' : 'text',
      value: project().fields[key] ?? '',
      autocomplete: 'off',
    });
    input.addEventListener('input', () => store.setField(key, input.value));
    pane.append(el('div', { class: 'field' }, [el('label', { for: id }, label), input]));
  }

  /* Projets enregistrés */
  const saved = listProjects();
  if (saved.length) {
    pane.append(el('h3', {}, 'Mes projets enregistrés'));
    const list = el('div', { class: 'cfg-projects-list' });
    for (const p of saved) {
      const row = el('div', { class: 'cfg-project-row' }, [
        el('a', { href: `configurateur.html?projet=${p.id}`, title: p.nom }, p.nom),
        el('button', {
          class: 'btn-icon is-danger', type: 'button', 'aria-label': `Supprimer le projet ${p.nom}`,
          style: 'width:30px;height:30px;min-height:30px;border:none',
          html: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="M4 7h16M9 7V5h6v2M6 7l1 13h10l1-13M10 11v6M14 11v6"/></svg>',
          onclick: () => {
            if (!confirm(`Supprimer définitivement « ${p.nom} » ?`)) return;
            deleteProject(p.id);
            renderInfosPane();
            showToast('Projet supprimé.');
          },
        }),
      ]);
      list.append(row);
    }
    pane.append(list);
  }

  pane.append(el('div', { class: 'cfg-hint-box' },
    'Votre projet est conservé sur cet appareil et joint à votre demande de commande. ' +
    'Un BAT (bon à tirer) vous est envoyé avant toute impression.'));
}

/* ================================================================
   Onglet PAGES — liste des pages + blocs de la page courante
   ================================================================ */

const TYPE_LABELS = {
  cover: 'Couverture', heading: 'Titre', subheading: 'Sous-titre', text: 'Texte',
  chant: 'Chant', lecture: 'Lecture', priere: 'Prière', photo: 'Photo', logo: 'Logo',
  ornament: 'Ornement', spacer: 'Espace', deroulement: 'Déroulé', remerciement: 'Remerciements',
};

const ORNEMENT_OPTIONS = [
  ['croix', 'Croix'], ['colombe', 'Colombe'], ['rameau', 'Rameau'], ['anneaux', 'Anneaux'],
  ['coquille', 'Coquille'], ['calice', 'Calice'], ['lumiere', 'Cierge'], ['flamme', 'Flamme'],
  ['etoile', 'Étoile'], ['couronne', 'Couronne'], ['lys', 'Lys'], ['filet', 'Filet'],
];

function blockSummary(block) {
  switch (block.type) {
    case 'cover': return `${block.title || ''} ${block.subtitle || ''}`.trim();
    case 'chant': {
      const c = block.custom || chantById(block.chantId);
      return c ? c.titre : 'À choisir…';
    }
    case 'lecture': return block.titre || block.reference || '';
    case 'priere': return block.titre || '';
    case 'photo': return block.caption || (block.src ? 'Photo' : 'Photo à ajouter');
    case 'logo': return block.src ? 'Logo' : 'Logo à ajouter';
    case 'ornament': return (ORNEMENT_OPTIONS.find(([id]) => id === block.motif) || ['', 'Motif'])[1];
    case 'spacer': return ({ s: 'petit', m: 'moyen', l: 'grand' })[block.size] || '';
    case 'deroulement': return `${(block.items || []).length} étapes`;
    default: return (block.text || block.texte || '').split('\n')[0];
  }
}

function fieldRow(labelText, inputNode) {
  const id = inputNode.id || `in-${Math.random().toString(36).slice(2, 8)}`;
  inputNode.id = id;
  return el('div', { class: 'field' }, [el('label', { for: id }, labelText), inputNode]);
}

/** Champ texte/textarea/select branché sur updateBlock (aperçu instantané). */
function boundInput(pageId, block, key, kind = 'text', options = null) {
  let input;
  if (kind === 'select') {
    input = el('select', {}, options.map(([v, lbl]) =>
      el('option', { value: v, selected: block[key] === v ? '' : null }, lbl)));
    input.addEventListener('change', () => {
      store.updateBlock(pageId, block.id, { [key]: input.value });
      // La variante de couverture change les champs disponibles (photo…).
      if (key === 'variant') { renderPagesPane(); openBlockEditor(block.id); }
    });
  } else if (kind === 'textarea') {
    input = el('textarea', { rows: '4' });
    input.value = block[key] ?? '';
    input.addEventListener('input', () => store.updateBlock(pageId, block.id, { [key]: input.value }));
  } else {
    input = el('input', { type: 'text', value: block[key] ?? '', autocomplete: 'off' });
    input.addEventListener('input', () => store.updateBlock(pageId, block.id, { [key]: input.value }));
  }
  return input;
}

function photoField(pageId, block, key = 'src', labelText = 'Photo') {
  const wrap = el('div', { class: 'field' });
  const file = el('input', { type: 'file', accept: 'image/*', 'aria-label': `Choisir : ${labelText}` });
  file.addEventListener('change', async () => {
    const f = file.files?.[0];
    if (!f) return;
    try {
      const src = await fileToDataURL(f);
      store.updateBlock(pageId, block.id, { [key]: src });
      showToast(`${labelText} ajouté${labelText === 'Photo' ? 'e' : ''}.`, 'success');
      renderPagesPane();
      openBlockEditor(block.id);
    } catch { showToast('Impossible de lire cette image.', 'error'); }
  });
  wrap.append(el('label', {}, labelText), file);
  if (block[key]) {
    wrap.append(el('button', {
      class: 'btn btn-ghost btn-sm', type: 'button', style: 'margin-top:8px',
      onclick: () => {
        store.updateBlock(pageId, block.id, { [key]: null });
        renderPagesPane();
        openBlockEditor(block.id);
      },
    }, `Retirer (${labelText.toLowerCase()})`));
  }
  return wrap;
}

function chantEditor(pageId, block) {
  const body = el('div', {});
  const catSelect = el('select', {}, CATEGORIES_LITURGIQUES.map((c) =>
    el('option', { value: c.id, selected: block.categorieLiturgique === c.id ? '' : null }, c.nom)));
  catSelect.addEventListener('change', () =>
    store.updateBlock(pageId, block.id, { categorieLiturgique: catSelect.value }));
  body.append(fieldRow('Moment liturgique', catSelect));

  const source = block.custom || chantById(block.chantId);
  body.append(el('p', { class: 'small', style: 'margin:4px 0 12px' }, [
    el('strong', {}, source ? source.titre : 'Aucun chant choisi'),
    source && !block.custom && source.cote ? ` — cote ${source.cote}` : '',
  ]));

  const pickBtn = el('button', { class: 'btn btn-light btn-sm', type: 'button' }, 'Bibliothèque de chants');
  pickBtn.addEventListener('click', () => openChantPicker(pageId, block.id));
  body.append(el('div', { style: 'display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px' }, [pickBtn]));

  if (block.custom) {
    const titre = el('input', { type: 'text', value: block.custom.titre ?? '' });
    titre.addEventListener('input', () =>
      store.updateBlock(pageId, block.id, { custom: { ...block.custom, titre: titre.value } }));
    body.append(fieldRow('Titre du chant', titre));

    const paroles = el('textarea', { rows: '7' });
    paroles.value = block.custom.paroles ?? '';
    paroles.addEventListener('input', () =>
      store.updateBlock(pageId, block.id, { custom: { ...block.custom, paroles: paroles.value } }));
    body.append(fieldRow('Paroles', paroles));
  } else if (source) {
    const editBtn = el('button', { class: 'btn btn-ghost btn-sm', type: 'button' }, 'Modifier les paroles');
    editBtn.addEventListener('click', () => {
      store.updateBlock(pageId, block.id, { custom: { titre: source.titre, paroles: source.paroles || '' }, chantId: null });
      renderPagesPane();
      renderChantsPane();
      openBlockEditor(block.id);
    });
    body.append(editBtn);
    if (source.complet === false) {
      body.append(el('p', { class: 'small muted', style: 'margin-top:8px' },
        source.note || 'Chant sous droits : collez les paroles via « Modifier les paroles ».'));
    }
  }
  return body;
}

function deroulementEditor(pageId, block) {
  const body = el('div', {});
  const ta = el('textarea', { rows: '5', placeholder: '15 h 00 | Accueil des invités' });
  ta.value = (block.items || []).map((i) => `${i.heure} | ${i.label}`).join('\n');
  ta.addEventListener('input', () => {
    const items = ta.value.split('\n').filter((l) => l.trim()).map((line) => {
      const [heure, ...rest] = line.split('|');
      return { heure: (heure || '').trim(), label: rest.join('|').trim() };
    });
    store.updateBlock(pageId, block.id, { items });
  });
  body.append(fieldRow('Une étape par ligne — « horaire | intitulé »', ta));
  return body;
}

function blockEditorBody(pageId, block) {
  const b = el('div', {});
  switch (block.type) {
    case 'cover':
      b.append(
        fieldRow('Titre', boundInput(pageId, block, 'title')),
        fieldRow('Sous-titre (noms)', boundInput(pageId, block, 'subtitle')),
        fieldRow('Style de couverture', boundInput(pageId, block, 'variant', 'select', [
          ['ornement', 'Ornement classique'], ['typographique', 'Typographique'],
          ['botanique', 'Botanique'], ['photo', 'Photographie'],
        ])),
        fieldRow('Motif', boundInput(pageId, block, 'ornament', 'select', ORNEMENT_OPTIONS)),
      );
      if (block.variant === 'photo') b.append(photoField(pageId, block, 'src'));
      break;
    case 'heading': b.append(fieldRow('Titre de section', boundInput(pageId, block, 'text'))); break;
    case 'subheading': b.append(fieldRow('Sous-titre', boundInput(pageId, block, 'text'))); break;
    case 'text':
      b.append(
        fieldRow('Texte', boundInput(pageId, block, 'text', 'textarea')),
        fieldRow('Alignement', boundInput(pageId, block, 'align', 'select', [['center', 'Centré'], ['left', 'À gauche']])),
      );
      break;
    case 'chant': b.append(chantEditor(pageId, block)); break;
    case 'lecture':
      b.append(
        fieldRow('Référence (ex. Première lecture)', boundInput(pageId, block, 'reference')),
        fieldRow('Titre du texte', boundInput(pageId, block, 'titre')),
        fieldRow('Extrait (facultatif)', boundInput(pageId, block, 'extrait', 'textarea')),
      );
      break;
    case 'priere':
      b.append(
        fieldRow('Titre', boundInput(pageId, block, 'titre')),
        fieldRow('Texte de la prière', boundInput(pageId, block, 'texte', 'textarea')),
      );
      break;
    case 'photo':
      b.append(
        photoField(pageId, block),
        fieldRow('Légende', boundInput(pageId, block, 'caption')),
        fieldRow('Forme', boundInput(pageId, block, 'shape', 'select', [
          ['arch', 'Arche'], ['oval', 'Médaillon'], ['full', 'Pleine largeur'],
        ])),
      );
      break;
    case 'logo':
      b.append(
        photoField(pageId, block, 'src', 'Logo'),
        fieldRow('Taille', boundInput(pageId, block, 'size', 'select', [
          ['s', 'Petit'], ['m', 'Moyen'], ['l', 'Grand'],
        ])),
        fieldRow('Description (accessibilité)', boundInput(pageId, block, 'alt')),
      );
      break;
    case 'ornament': b.append(fieldRow('Motif', boundInput(pageId, block, 'motif', 'select', ORNEMENT_OPTIONS))); break;
    case 'spacer': b.append(fieldRow('Hauteur', boundInput(pageId, block, 'size', 'select', [['s', 'Petite'], ['m', 'Moyenne'], ['l', 'Grande']]))); break;
    case 'deroulement': b.append(deroulementEditor(pageId, block)); break;
    case 'remerciement': b.append(fieldRow('Texte', boundInput(pageId, block, 'texte', 'textarea'))); break;
    default: b.append(el('p', { class: 'small muted' }, 'Bloc non modifiable.'));
  }

  /* Outils communs : déplacer / supprimer */
  const tools = el('div', { class: 'cfg-blocktools' }, [
    el('button', {
      class: 'btn-icon', type: 'button', 'aria-label': 'Monter le bloc', title: 'Monter',
      html: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 19V5M5 12l7-7 7 7"/></svg>',
      onclick: () => { store.moveBlock(pageId, block.id, -1); renderPagesPane(); openBlockEditor(block.id); },
    }),
    el('button', {
      class: 'btn-icon', type: 'button', 'aria-label': 'Descendre le bloc', title: 'Descendre',
      html: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 5v14M5 12l7 7 7-7"/></svg>',
      onclick: () => { store.moveBlock(pageId, block.id, 1); renderPagesPane(); openBlockEditor(block.id); },
    }),
    el('button', {
      class: 'btn-icon is-danger', type: 'button', 'aria-label': 'Supprimer le bloc', title: 'Supprimer',
      html: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="M4 7h16M9 7V5h6v2M6 7l1 13h10l1-13"/></svg>',
      onclick: () => {
        if (!confirm('Supprimer ce bloc ?')) return;
        store.removeBlock(pageId, block.id);
        selectedBlockId = null;
        renderPagesPane();
        renderChantsPane();
      },
    }),
  ]);
  b.append(tools);
  return b;
}

const ADDABLE_TYPES = [
  ['heading', 'Titre de section'], ['subheading', 'Sous-titre'], ['text', 'Texte libre'],
  ['chant', 'Chant'], ['lecture', 'Lecture'], ['priere', 'Prière'], ['photo', 'Photo'],
  ['logo', 'Logo (paroisse, monogramme…)'],
  ['ornament', 'Ornement'], ['spacer', 'Espace'], ['deroulement', 'Déroulé horaire'],
  ['remerciement', 'Remerciements'],
];

function defaultBlock(type) {
  switch (type) {
    case 'heading': return { type, text: 'Nouveau titre' };
    case 'subheading': return { type, text: 'Sous-titre' };
    case 'text': return { type, text: 'Votre texte…', align: 'center' };
    case 'chant': return { type, categorieLiturgique: 'entree', chantId: null, custom: null };
    case 'lecture': return { type, reference: 'Lecture', titre: 'Titre du texte', extrait: '' };
    case 'priere': return { type, titre: 'Prière', texte: '' };
    case 'photo': return { type, src: null, caption: '', shape: 'arch' };
    case 'logo': return { type, src: null, size: 'm', alt: '' };
    case 'ornament': return { type, motif: 'croix' };
    case 'spacer': return { type, size: 'm' };
    case 'deroulement': return { type, items: [{ heure: '15 h 00', label: 'Accueil' }] };
    case 'remerciement': return { type, texte: 'Merci de votre présence.' };
    default: return { type: 'text', text: '' };
  }
}

function renderPagesPane() {
  const pane = qs('#pane-pages');
  pane.textContent = '';
  const pages = project().pages;

  /* --- Liste des pages --- */
  pane.append(el('h3', {}, `Pages du livret (${pages.length})`));

  // Impression en cahiers piqués : toujours un multiple de 4 pages, minimum 12
  // (même règle que le moteur de devis — pagesImprimees dans core/api.js ;
  // recalculé ici pour ne pas charger le module e-mail dans le configurateur).
  const nbImprime = Math.max(12, Math.ceil(pages.length / 4) * 4);
  if (nbImprime !== pages.length) {
    pane.append(el('p', { class: 'small muted', style: 'margin:-6px 0 10px' },
      `Imprimé en ${nbImprime} pages — cahiers de 4 (${nbImprime - pages.length} page${nbImprime - pages.length > 1 ? 's' : ''} `
      + 'blanche' + (nbImprime - pages.length > 1 ? 's' : '') + ' en fin de livret, ou ajoutez des pages).'));
  }
  const list = el('div', { class: 'cfg-pagelist' });
  pages.forEach((page, i) => {
    const first = page.blocks[0];
    const item = el('div', {
      class: `cfg-pageitem${i === currentPageIndex ? ' is-active' : ''}`,
      role: 'button', tabindex: '0',
      onclick: (e) => { if (!e.target.closest('.cfg-pageitem-tools')) goToPageIndex(i); },
      onkeydown: (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); goToPageIndex(i); } },
    }, [
      el('span', { class: 'cfg-pageitem-num' }, String(i + 1)),
      el('span', { class: 'cfg-pageitem-label' },
        first ? `${TYPE_LABELS[first.type] || ''} — ${blockSummary(first)}` : 'Page vide'),
      el('span', { class: 'cfg-pageitem-tools' }, [
        iconBtn('Monter la page', 'M12 19V5M5 12l7-7 7 7', () => { store.movePage(page.id, -1); syncAfterPagesOp(page.id); }),
        iconBtn('Descendre la page', 'M12 5v14M5 12l7 7 7-7', () => { store.movePage(page.id, 1); syncAfterPagesOp(page.id); }),
        iconBtn('Dupliquer la page', 'M8 8h12v12H8zM4 16V4h12', () => {
          const copy = store.duplicatePage(page.id);
          if (copy) { syncAfterPagesOp(copy.id); showToast('Page dupliquée.', 'success'); }
        }),
        iconBtn('Supprimer la page', 'M4 7h16M9 7V5h6v2M6 7l1 13h10l1-13', () => {
          if (pages.length <= 1) { showToast('Le livret doit garder au moins une page.', 'error'); return; }
          if (!confirm(`Supprimer la page ${i + 1} ?`)) return;
          store.removePage(page.id);
          currentPageIndex = clamp(currentPageIndex, 0, project().pages.length - 1);
          syncAfterPagesOp(project().pages[currentPageIndex].id);
          showToast('Page supprimée.');
        }, true),
      ]),
    ]);
    list.append(item);
  });
  pane.append(list);

  const addPageBtn = el('button', { class: 'btn btn-ghost btn-sm', type: 'button' }, 'Ajouter une page');
  addPageBtn.addEventListener('click', () => {
    const page = store.addPage(pages[currentPageIndex]?.id);
    goToPageIndex(project().pages.findIndex((p) => p.id === page.id));
  });
  pane.append(addPageBtn);

  /* --- Blocs de la page courante --- */
  const page = pages[currentPageIndex];
  if (!page) return;
  pane.append(el('h3', {}, `Contenu de la page ${currentPageIndex + 1}`));
  pane.append(el('p', { class: 'small muted', style: 'margin-bottom:12px' },
    'Astuce : cliquez directement sur un élément dans l\'aperçu pour l\'ouvrir ici.'));

  const blockList = el('div', { class: 'cfg-blocklist' });
  page.blocks.forEach((block) => {
    const item = el('div', { class: 'cfg-blockitem', 'data-editor-block': block.id });
    const head = el('button', { class: 'cfg-blockhead', type: 'button', 'aria-expanded': 'false' }, [
      el('span', { class: 'cfg-blockhead-type' }, TYPE_LABELS[block.type] || block.type),
      el('span', { class: 'cfg-blockhead-label' }, blockSummary(block)),
      el('span', { class: 'cfg-blockhead-caret', html: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>' }),
    ]);
    head.addEventListener('click', () => {
      const isOpen = item.classList.contains('is-open');
      qsa('.cfg-blockitem.is-open', blockList).forEach((n) => { n.classList.remove('is-open'); n.querySelector('.cfg-blockbody')?.remove(); n.querySelector('.cfg-blockhead')?.setAttribute('aria-expanded', 'false'); });
      if (!isOpen) {
        item.classList.add('is-open');
        head.setAttribute('aria-expanded', 'true');
        item.append(el('div', { class: 'cfg-blockbody' }, [blockEditorBody(page.id, block)]));
        selectedBlockId = block.id;
        renderEdition();
      } else {
        selectedBlockId = null;
        renderEdition();
      }
    });
    item.append(head);
    blockList.append(item);
  });
  pane.append(blockList);

  /* Ajouter un bloc */
  const typeSelect = el('select', { 'aria-label': 'Type de bloc à ajouter' },
    ADDABLE_TYPES.map(([v, lbl]) => el('option', { value: v }, lbl)));
  const addBtn = el('button', { class: 'btn btn-gold btn-sm', type: 'button' }, 'Ajouter');
  addBtn.addEventListener('click', () => {
    const block = store.addBlock(page.id, defaultBlock(typeSelect.value));
    renderPagesPane();
    renderChantsPane();
    if (block) openBlockEditor(block.id);
  });
  pane.append(el('div', { class: 'cfg-addblock', style: 'display:flex;gap:8px' }, [typeSelect, addBtn]));
}

function iconBtn(label, path, onclick, danger = false) {
  return el('button', {
    class: `btn-icon${danger ? ' is-danger' : ''}`, type: 'button', 'aria-label': label, title: label,
    html: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${path}"/></svg>`,
    onclick: (e) => { e.stopPropagation(); onclick(); },
  });
}

function syncAfterPagesOp(focusPageId) {
  const i = project().pages.findIndex((p) => p.id === focusPageId);
  if (i >= 0) currentPageIndex = i;
  renderEdition();
  renderThumbs();
  renderPagesPane();
  renderChantsPane();
}

/** Ouvre l'éditeur d'un bloc dans l'onglet Pages (et le fait défiler en vue). */
function openBlockEditor(blockId) {
  switchTab('pages');
  const item = qs(`[data-editor-block="${blockId}"]`);
  if (!item) return;
  if (!item.classList.contains('is-open')) item.querySelector('.cfg-blockhead')?.click();
  item.scrollIntoView({ block: 'center', behavior: 'smooth' });
}

function selectBlock(pageId, blockId) {
  selectedBlockId = blockId;
  renderEdition();
  openBlockEditor(blockId);
}

/* ================================================================
   Onglet CHANTS
   ================================================================ */

function renderChantsPane() {
  const pane = qs('#pane-chants');
  pane.textContent = '';
  pane.append(el('h3', {}, 'Les chants du livret'));
  pane.append(el('p', { class: 'small muted', style: 'margin-bottom:12px' },
    'Remplacez chaque chant depuis la bibliothèque, modifiez ses paroles ou ajoutez un chant personnalisé.'));

  const entries = [];
  project().pages.forEach((page, pageIndex) => {
    page.blocks.forEach((block) => {
      if (block.type === 'chant') entries.push({ page, pageIndex, block });
    });
  });

  if (!entries.length) {
    pane.append(el('p', { class: 'small muted' }, 'Aucun chant pour le moment.'));
  }

  for (const { page, pageIndex, block } of entries) {
    const source = block.custom || chantById(block.chantId);
    const titreEl = el('div', { class: 'cfg-chant-entry-titre' }, source ? source.titre : 'À choisir dans la bibliothèque');
    const entry = el('div', { class: 'cfg-chant-entry' }, [
      el('div', { class: 'cfg-chant-entry-cat' }, categorieLiturgique(block.categorieLiturgique)?.nom || 'Chant'),
      titreEl,
      el('div', { class: 'cfg-chant-entry-page' }, `Page ${pageIndex + 1}${block.custom ? ' · personnalisé' : (source?.cote ? ` · cote ${source.cote}` : '')}`),
      el('div', { class: 'cfg-chant-entry-actions' }, [
        el('button', { class: 'btn btn-light btn-sm', type: 'button', onclick: () => openChantPicker(page.id, block.id) }, 'Remplacer'),
        el('button', {
          class: 'btn btn-ghost btn-sm', type: 'button',
          onclick: (e) => toggleParolesEditor(e.currentTarget, entry, page, block, titreEl),
        }, 'Modifier titre & paroles'),
        el('button', {
          class: 'btn btn-ghost btn-sm', type: 'button',
          onclick: () => { goToPageIndex(pageIndex); },
        }, 'Voir la page'),
      ]),
    ]);
    pane.append(entry);
  }

  const addChant = el('button', { class: 'btn btn-gold btn-sm', type: 'button', style: 'margin-top:8px' }, 'Ajouter un chant à la page courante');
  addChant.addEventListener('click', () => {
    const page = project().pages[currentPageIndex];
    const block = store.addBlock(page.id, defaultBlock('chant'));
    renderPagesPane();
    renderChantsPane();
    if (block) openChantPicker(page.id, block.id);
  });
  pane.append(addChant);
}

/** Éditeur de paroles en place, dans l'onglet Chants (toute édition passe le chant en personnalisé). */
function toggleParolesEditor(btn, entry, page, block, titreEl) {
  const existing = entry.querySelector('.cfg-chant-inline');
  if (existing) { existing.remove(); btn.setAttribute('aria-expanded', 'false'); return; }

  const source = block.custom || chantById(block.chantId);
  const titreIn = el('input', { type: 'text', value: block.custom?.titre ?? source?.titre ?? '', 'aria-label': 'Titre du chant' });
  const parolesIn = el('textarea', { rows: '7', 'aria-label': 'Paroles du chant', placeholder: 'Collez ou écrivez les paroles ici…' });
  parolesIn.value = block.custom?.paroles ?? source?.paroles ?? '';

  const applyCustom = () => {
    store.updateBlock(page.id, block.id, {
      custom: { titre: titreIn.value, paroles: parolesIn.value },
      chantId: null,
    });
    titreEl.textContent = titreIn.value || 'Chant personnalisé';
  };
  titreIn.addEventListener('input', applyCustom);
  parolesIn.addEventListener('input', applyCustom);

  entry.append(el('div', { class: 'cfg-chant-inline' }, [
    el('div', { class: 'field', style: 'margin:0' }, [el('label', {}, 'Titre'), titreIn]),
    el('div', { class: 'field', style: 'margin:0' }, [el('label', {}, 'Paroles'), parolesIn]),
    el('p', { class: 'small muted', style: 'margin:0' },
      'Chaque modification apparaît immédiatement dans le livret.'),
  ]));
  btn.setAttribute('aria-expanded', 'true');
}

/* ---------------- Modale : sélecteur de chants ---------------- */

let modalNode = null;

function closeModal() {
  const node = modalNode;
  modalNode = null;
  document.removeEventListener('keydown', escClose);
  if (!node) return;
  node.classList.remove('is-open');
  setTimeout(() => node.remove(), 280);
}
function escClose(e) { if (e.key === 'Escape') closeModal(); }

function openModal(title, body, footer = []) {
  closeModal();
  modalNode = el('div', { class: 'modal-backdrop', role: 'dialog', 'aria-modal': 'true', 'aria-label': title }, [
    el('div', { class: 'modal' }, [
      el('div', { class: 'modal-header' }, [
        el('h3', {}, title),
        el('button', {
          class: 'btn-icon', type: 'button', 'aria-label': 'Fermer',
          html: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>',
          onclick: closeModal,
        }),
      ]),
      el('div', { class: 'modal-body' }, [body]),
      footer.length ? el('div', { class: 'modal-footer' }, footer) : null,
    ]),
  ]);
  modalNode.addEventListener('click', (e) => { if (e.target === modalNode) closeModal(); });
  document.addEventListener('keydown', escClose);
  document.body.append(modalNode);
  requestAnimationFrame(() => modalNode.classList.add('is-open'));
}

function openChantPicker(pageId, blockId) {
  const block = store.getBlock(pageId, blockId);
  if (!block) return;
  let activeCat = block.categorieLiturgique || null;

  const results = el('div', {});
  const search = el('input', { type: 'search', placeholder: 'Rechercher un titre, une cote, des paroles…', 'aria-label': 'Rechercher un chant' });
  const cats = el('div', { class: 'chantpicker-cats' });

  const renderCats = () => {
    cats.textContent = '';
    const allChip = el('button', { class: `chip${activeCat === null ? ' is-active' : ''}`, type: 'button' }, 'Tous');
    allChip.addEventListener('click', () => { activeCat = null; renderCats(); renderResults(); });
    cats.append(allChip);
    for (const c of CATEGORIES_LITURGIQUES) {
      const chip = el('button', { class: `chip${activeCat === c.id ? ' is-active' : ''}`, type: 'button' }, c.nom);
      chip.addEventListener('click', () => { activeCat = c.id; renderCats(); renderResults(); });
      cats.append(chip);
    }
  };

  const renderResults = () => {
    results.textContent = '';
    const found = searchChants(search.value, activeCat);
    if (!found.length) {
      results.append(el('div', { class: 'chantpicker-empty' }, 'Aucun chant trouvé — essayez un autre mot, ou créez un chant personnalisé.'));
      return;
    }
    for (const chant of found) {
      const item = el('button', { class: 'chantpicker-item', type: 'button' }, [
        el('div', { class: 'chantpicker-item-titre' }, chant.titre),
        el('div', { class: 'chantpicker-item-meta' },
          `${categorieLiturgique(chant.categorie)?.nom || ''}${chant.origine ? ' · ' + chant.origine : ''}${chant.cote ? ' · cote ' + chant.cote : ''}`),
        chant.paroles ? el('div', { class: 'chantpicker-item-extrait' }, chant.paroles.split('\n').slice(0, 2).join(' / ')) : null,
      ]);
      item.addEventListener('click', () => {
        store.updateBlock(pageId, blockId, { chantId: chant.id, custom: null });
        renderPagesPane();
        renderChantsPane();
        closeModal();
        showToast(`« ${chant.titre} » ajouté au livret.`, 'success');
      });
      results.append(item);
    }
  };

  search.addEventListener('input', debounce(renderResults, 120));
  renderCats();
  renderResults();

  const customBtn = el('button', { class: 'btn btn-ghost', type: 'button' }, 'Chant personnalisé');
  customBtn.addEventListener('click', () => {
    store.updateBlock(pageId, blockId, { chantId: null, custom: { titre: 'Mon chant', paroles: '' } });
    renderPagesPane();
    renderChantsPane();
    closeModal();
    const i = project().pages.findIndex((p) => p.id === pageId);
    if (i >= 0) goToPageIndex(i);
    openBlockEditor(blockId);
  });

  const body = el('div', {}, [
    el('div', { class: 'chantpicker-search' }, [search, cats]),
    results,
  ]);
  openModal('Bibliothèque de chants', body, [customBtn]);
}

/* ================================================================
   Onglet STYLE
   ================================================================ */

function renderStylePane() {
  const pane = qs('#pane-style');
  pane.textContent = '';

  pane.append(el('h3', {}, 'Palette de couleurs'));
  const sw = el('div', { class: 'cfg-swatches' });
  for (const theme of THEMES) {
    const btn = el('button', {
      class: `cfg-swatch${project().themeId === theme.id ? ' is-active' : ''}`,
      type: 'button', 'aria-pressed': String(project().themeId === theme.id),
    }, [
      el('span', { class: 'cfg-swatch-dots' }, [
        el('span', { style: `background:${theme.paper}` }),
        el('span', { style: `background:${theme.accent}` }),
        el('span', { style: `background:${theme.soft}` }),
      ]),
      el('span', {}, theme.nom),
    ]);
    btn.addEventListener('click', () => { store.setStyle({ themeId: theme.id }); renderStylePane(); });
    sw.append(btn);
  }
  pane.append(sw);

  pane.append(el('h3', {}, 'Police du livret'));
  const fl = el('div', { class: 'cfg-fontlist' });
  const duo = ['mariage', 'jubile'].includes(project().categorieId);
  const sample = duo
    ? `${project().fields.prenom || 'Claire'} & ${project().fields.prenom2 || 'Antoine'}`
    : (project().fields.prenom || 'Louise');
  for (const font of FONTS) {
    const btn = el('button', {
      class: `cfg-font${project().fontId === font.id ? ' is-active' : ''}`,
      type: 'button', 'aria-pressed': String(project().fontId === font.id),
    }, [
      el('span', { class: 'cfg-font-preview', style: `font-family:${font.display}` }, sample),
      el('span', { class: 'cfg-font-name' }, font.nom),
    ]);
    btn.addEventListener('click', () => { store.setStyle({ fontId: font.id }); renderStylePane(); });
    fl.append(btn);
  }
  pane.append(fl);

  pane.append(el('div', { class: 'cfg-hint-box' },
    'Les palettes et polices proposées sont accordées à chaque modèle et garanties à l\'impression. ' +
    'Le motif de couverture se règle dans Pages → Couverture.'));
}

/* ================================================================
   Démarrage
   ================================================================ */

renderInfosPane();
renderPagesPane();
renderChantsPane();
renderStylePane();
renderEdition();
renderThumbs();
setStatus(getParam('projet') ? 'Projet chargé' : 'Nouveau projet — enregistrement automatique activé');
qs('#cfg-commander').href = `commande.html?projet=${project().id}`;
document.title = `${project().nom} — Configurateur — Livrets de messe`;
