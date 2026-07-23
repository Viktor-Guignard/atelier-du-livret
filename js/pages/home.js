/* Accueil : héros (vraies couvertures), catégories, exemples, avis. */

import { initSite, CEREMONIE_PAGES } from '../components/nav.js';
import { el } from '../core/utils.js';
import { CATEGORIES } from '../data/categories.js';
import { buildDefaultProject, modeleById } from '../data/modeles.js';
import { renderPageThumb } from '../components/pageRenderer.js';
import { ornament } from '../components/ornaments.js';

initSite({ active: 'accueil' });

/* ---------------- Héros : éventail de trois vraies couvertures ---------------- */

const HERO_MODELES = ['bapteme-source', 'mariage-alliance', 'communion-vigne'];
const heroBooks = document.getElementById('hero-books');

for (const modeleId of HERO_MODELES) {
  const projet = buildDefaultProject(modeleId);
  const cover = renderPageThumb(projet.pages[0], projet, { pageNumber: 1 });
  heroBooks.append(el('div', { class: 'hero-book' }, [cover]));
}

/* ---------------- Catégories ---------------- */

const catGrid = document.getElementById('home-categories');
for (const cat of CATEGORIES) {
  catGrid.append(el('a', { class: 'card cat-card', href: CEREMONIE_PAGES[cat.id] || `modeles.html?categorie=${cat.id}` }, [
    el('div', { class: 'card-body' }, [
      el('span', { class: 'cat-card-medaillon', html: ornament(cat.ornement) }),
      el('h3', {}, cat.nom),
      el('p', {}, cat.accroche),
    ]),
  ]));
}

/* ---------------- Exemples de livrets ---------------- */

const EXEMPLES = ['mariage-jardin', 'communion-pain-de-vie', 'funerailles-in-paradisum'];
const exGrid = document.getElementById('home-exemples');

for (const modeleId of EXEMPLES) {
  const modele = modeleById(modeleId);
  if (!modele) continue;
  const projet = buildDefaultProject(modeleId);
  const cat = CATEGORIES.find((c) => c.id === modele.categorieId);
  exGrid.append(el('article', { class: 'card exemple-card' }, [
    el('div', { class: 'exemple-cover' }, [
      el('div', {}, [renderPageThumb(projet.pages[0], projet, { pageNumber: 1 })]),
    ]),
    el('div', { class: 'card-body' }, [
      el('span', { class: 'badge' }, cat?.nom || ''),
      el('h3', {}, `Modèle ${modele.nom}`),
      el('p', {}, modele.description),
      el('div', { class: 'exemple-actions' }, [
        el('a', { class: 'btn btn-ghost btn-sm', href: `modele.html?id=${modele.id}` }, 'Aperçu 3D'),
        el('a', { class: 'btn btn-gold btn-sm', href: `configurateur.html?modele=${modele.id}` }, 'Personnaliser'),
      ]),
    ]),
  ]));
}

/* ---------------- Avis clients ---------------- */

const AVIS = [
  {
    texte: 'Nous avons composé le livret de notre mariage un dimanche soir, en une heure. Voir chaque changement en direct, page par page, est incroyablement rassurant.',
    auteur: 'Claire & Antoine', contexte: 'Mariage — Annecy',
  },
  {
    texte: 'Pour les funérailles de maman, tout était doux, digne et simple. Le BAT reçu le lendemain nous a permis de corriger un prénom avant l\'impression.',
    auteur: 'Hélène R.', contexte: 'Funérailles — Lyon',
  },
  {
    texte: 'La bibliothèque de chants classés par moment de la messe nous a fait gagner un temps précieux. La paroisse a gardé un exemplaire en modèle !',
    auteur: 'François B.', contexte: 'Première communion — Versailles',
  },
];

const STAR = '<svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" stroke="none" aria-hidden="true"><path d="M12 2.6l2.8 5.9 6.4.8-4.7 4.4 1.2 6.3-5.7-3.1-5.7 3.1 1.2-6.3L2.8 9.3l6.4-.8z"/></svg>';

const avisGrid = document.getElementById('home-avis');
for (const avis of AVIS) {
  avisGrid.append(el('figure', { class: 'card avis-card', style: 'margin:0' }, [
    el('div', { class: 'card-body' }, [
      el('span', { class: 'stars', html: STAR.repeat(5), role: 'img', 'aria-label': '5 étoiles sur 5' }),
      el('blockquote', {}, `« ${avis.texte} »`),
      el('figcaption', {}, [el('strong', {}, avis.auteur), ` — ${avis.contexte}`]),
    ]),
  ]));
}
