/*
 * Pages cérémonie (SEO) — le contenu est statique dans le HTML ; ce script
 * ajoute la navigation et une vitrine de 3 modèles de la catégorie
 * (vraies couvertures, comme la page Modèles).
 */

import { initSite } from '../components/nav.js';
import { el } from '../core/utils.js';
import { categorieById } from '../data/categories.js';
import { MODELES, buildDefaultProject, themeById, fontById } from '../data/modeles.js';
import { renderPageThumb } from '../components/pageRenderer.js';

initSite({ active: 'categories' });

const cid = document.body.dataset.categorie;
const grid = document.getElementById('ceremonie-modeles');
const categorie = categorieById(cid);

if (grid && categorie) {
  for (const modele of MODELES.filter((m) => m.categorieId === cid).slice(0, 3)) {
    const projet = buildDefaultProject(modele.id);
    const theme = themeById(modele.themeId);
    const font = fontById(modele.fontId);
    grid.append(el('article', { class: 'card modele-card' }, [
      el('div', { class: 'modele-cover' }, [
        el('div', {}, [renderPageThumb(projet.pages[0], projet, { pageNumber: 1 })]),
      ]),
      el('div', { class: 'card-body' }, [
        el('span', { class: 'badge' }, categorie.nom),
        el('h3', {}, `Modèle ${modele.nom}`),
        el('p', {}, modele.description),
        el('p', { class: 'small muted', style: 'flex:none' }, `${theme.nom} · ${font.nom}`),
        el('div', { class: 'modele-actions' }, [
          el('a', { class: 'btn btn-ghost btn-sm', href: `modele.html?id=${modele.id}` }, 'Aperçu 3D'),
          el('a', { class: 'btn btn-gold btn-sm', href: `configurateur.html?modele=${modele.id}` }, 'Personnaliser'),
        ]),
      ]),
    ]));
  }
}
