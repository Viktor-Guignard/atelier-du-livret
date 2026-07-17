/* Page Modèles : filtres par cérémonie (?categorie=) + grille de vraies couvertures. */

import { initSite } from '../components/nav.js';
import { el, getParam } from '../core/utils.js';
import { CATEGORIES, categorieById } from '../data/categories.js';
import { MODELES, buildDefaultProject, themeById, fontById } from '../data/modeles.js';
import { renderPageThumb } from '../components/pageRenderer.js';

initSite({ active: 'modeles' });

const grid = document.getElementById('modeles-grid');
const filtres = document.getElementById('filtres');

let active = getParam('categorie');
if (active && !categorieById(active)) active = null;

/* ---------------- Filtres ---------------- */

function renderFiltres() {
  filtres.textContent = '';
  const mk = (id, label) => {
    const chip = el('button', {
      class: `chip${active === id ? ' is-active' : ''}`,
      type: 'button',
      'aria-pressed': String(active === id),
    }, label);
    chip.addEventListener('click', () => {
      active = id;
      history.replaceState(null, '', id ? `modeles.html?categorie=${id}` : 'modeles.html');
      renderFiltres();
      renderGrid();
    });
    return chip;
  };
  filtres.append(mk(null, 'Tous les modèles'));
  for (const cat of CATEGORIES) filtres.append(mk(cat.id, cat.nom));
}

/* ---------------- Grille ---------------- */

function renderGrid() {
  grid.textContent = '';
  const liste = MODELES.filter((m) => !active || m.categorieId === active);

  if (!liste.length) {
    grid.append(el('p', { class: 'modeles-empty' }, 'Aucun modèle dans cette catégorie pour le moment.'));
    return;
  }

  for (const modele of liste) {
    const projet = buildDefaultProject(modele.id);
    const theme = themeById(modele.themeId);
    const font = fontById(modele.fontId);
    const cat = categorieById(modele.categorieId);

    grid.append(el('article', { class: 'card modele-card' }, [
      el('div', { class: 'modele-cover' }, [
        el('div', {}, [renderPageThumb(projet.pages[0], projet, { pageNumber: 1 })]),
      ]),
      el('div', { class: 'card-body' }, [
        el('span', { class: 'badge' }, cat?.nom || ''),
        el('h2', {}, `Modèle ${modele.nom}`),
        el('p', {}, modele.description),
        el('div', { class: 'modele-style' }, [
          el('span', { class: 'modele-dots', 'aria-hidden': 'true' }, [
            el('span', { style: `background:${theme.paper}` }),
            el('span', { style: `background:${theme.accent}` }),
            el('span', { style: `background:${theme.soft}` }),
          ]),
          el('span', {}, `${theme.nom} · ${font.nom}`),
        ]),
        el('div', { class: 'modele-actions' }, [
          el('a', { class: 'btn btn-ghost btn-sm', href: `modele.html?id=${modele.id}` }, 'Aperçu 3D'),
          el('a', { class: 'btn btn-gold btn-sm', href: `configurateur.html?modele=${modele.id}` }, 'Personnaliser'),
        ]),
      ]),
    ]));
  }
}

renderFiltres();
renderGrid();
