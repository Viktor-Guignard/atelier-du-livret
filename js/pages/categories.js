/* Page Cérémonies : les 8 catégories en grandes cartes. */

import { initSite } from '../components/nav.js';
import { el } from '../core/utils.js';
import { CATEGORIES } from '../data/categories.js';
import { modelesByCategorie } from '../data/modeles.js';
import { ornament } from '../components/ornaments.js';

initSite({ active: 'categories' });

const grid = document.getElementById('cat-grid');

for (const cat of CATEGORIES) {
  const count = modelesByCategorie(cat.id).length;
  grid.append(el('article', { class: 'card catpage-card' }, [
    el('div', { class: 'card-body' }, [
      el('span', { class: 'catpage-medaillon', html: ornament(cat.ornement) }),
      el('h2', {}, cat.nom),
      el('p', { class: 'catpage-accroche' }, cat.accroche),
      el('p', { class: 'catpage-desc' }, cat.description),
      el('p', { class: 'catpage-count' }, `${count} modèle${count > 1 ? 's' : ''}`),
      el('a', { class: 'btn btn-ghost btn-sm', href: `modeles.html?categorie=${cat.id}` }, 'Voir les modèles'),
    ]),
  ]));
}
