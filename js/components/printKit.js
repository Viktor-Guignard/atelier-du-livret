/*
 * Rendu partagé des planches d'impression (fiche de fabrication + pages du
 * livret, fond perdu 3 mm, traits de coupe) — utilisé par atelier.html
 * (fichier chargé/collé) et admin.html (commande choisie dans Firestore).
 * Feuille : 160 × 222 mm = coupe A5 (148 × 210) + fond perdu 3 mm de marge.
 */

import { el, formatDateFr } from '../core/utils.js';
import { TARIFS } from '../core/api.js';
import { themeById } from '../data/modeles.js';
import { categorieById } from '../data/categories.js';
import { renderPage } from './pageRenderer.js';

/* ---------------- Traits de coupe ---------------- */

function cropMarks() {
  const marks = [];
  const mk = (cls, style) => marks.push(el('span', { class: `crop ${cls}`, style, 'aria-hidden': 'true' }));
  for (const y of ['top:5.9mm', 'top:215.9mm']) {
    mk('crop-h', `${y}; left:0;`);
    mk('crop-h', `${y}; right:0;`);
  }
  for (const x of ['left:5.9mm', 'left:153.9mm']) {
    mk('crop-v', `${x}; top:0;`);
    mk('crop-v', `${x}; bottom:0;`);
  }
  return marks;
}

function sheet(contentNode, paperColor, extraClass = '') {
  const s = el('section', { class: `print-sheet ${extraClass}`.trim() });
  if (paperColor) s.style.setProperty('--sheet-paper', paperColor);
  s.append(
    el('div', { class: 'print-bleed', 'aria-hidden': 'true' }),
    el('div', { class: 'print-trim' }, [contentNode]),
    ...cropMarks(),
    el('span', { class: 'bat-ribbon' }, 'BON À TIRER'),
  );
  return s;
}

/* ---------------- Fiche de fabrication ---------------- */

/** commande : { intent?, contact?, commande?, message?, projet, creeLe?, numero? } */
export function ficheRows(commande) {
  const p = commande.projet;
  const c = commande.commande;
  const rows = [
    commande.numero ? ['Numéro de commande', commande.numero] : null,
    ['Projet', `${p.nom} — réf. ${p.id}`],
    ['Cérémonie', categorieById(p.categorieId)?.nom || p.categorieId],
    ['Pages', `${p.pages.length} pages · coupe A5 148 × 210 mm · fond perdu 3 mm`],
    p.fields?.date ? ['Date de la cérémonie', formatDateFr(p.fields.date)] : null,
  ].filter(Boolean);

  if (c) {
    rows.push(
      ['Type', commande.intent === 'devis' ? 'Demande de devis' : 'Commande'],
      ['Quantité', `${c.quantite} exemplaires`],
      ['Format final', (c.format || 'a5').toUpperCase()],
      ['Papier', TARIFS.papiers[c.papier]?.nom || c.papier || '—'],
      ['BAT demandé', c.bat ? 'Oui — envoyer le BAT avant impression' : 'Non'],
      c.estimation ? ['Montant du devis', `${c.estimation.total.toFixed(2)} € (${c.estimation.unitaire.toFixed(2)} €/ex.)`] : null,
    );
  }
  if (commande.contact) {
    rows.push(['Client', `${commande.contact.prenom} ${commande.contact.nom} · ${commande.contact.email}${commande.contact.telephone ? ' · ' + commande.contact.telephone : ''}`]);
  }
  if (commande.message) rows.push(['Message du client', commande.message]);
  if (commande.creeLe) {
    const date = commande.creeLe.toDate ? commande.creeLe.toDate() : new Date(commande.creeLe);
    rows.push(['Commande reçue le', date.toLocaleString('fr-FR')]);
  }
  return rows.filter(Boolean);
}

/**
 * Construit la fiche (résumé écran) + les planches (fiche imprimée + pages).
 * Renvoie { ficheNode, sheetsNode, pageCount }.
 */
export function buildPrintKit(commande, { isBat = false } = {}) {
  const projet = commande.projet;
  const theme = themeById(projet.themeId);
  const rows = ficheRows(commande);

  const ficheNode = el('div', {}, [
    el('h2', {}, 'Fiche de fabrication'),
    el('dl', { class: 'fiche-grid', style: 'margin:0' }, rows.map(([dt, dd]) =>
      el('div', { class: `fiche-item${dt.includes('Message') ? ' fiche-message' : ''}` }, [
        el('dt', {}, dt), el('dd', {}, dd),
      ]))),
  ]);

  const sheetsNode = el('div', {});

  const ficheTable = el('div', {}, [
    el('h2', {}, 'L\'Atelier du Livret — fiche de fabrication'),
    el('p', { class: 'fiche-sub' }, isBat
      ? 'BON À TIRER — document de validation, non destiné à l\'impression.'
      : 'Document d\'impression — A5, fond perdu 3 mm, traits de coupe.'),
    el('table', {}, rows.map(([dt, dd]) => el('tr', {}, [el('td', {}, dt), el('td', {}, dd)]))),
  ]);
  sheetsNode.append(sheet(ficheTable, '#FFFFFF', 'print-sheet--fiche'));

  projet.pages.forEach((page, i) => {
    const node = renderPage(page, projet, {
      pageNumber: i + 1,
      totalPages: projet.pages.length,
      print: !isBat,
    });
    node.removeAttribute('role');
    sheetsNode.append(sheet(node, theme.paper));
  });

  return { ficheNode, sheetsNode, pageCount: projet.pages.length };
}
