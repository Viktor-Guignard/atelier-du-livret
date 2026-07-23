/*
 * Rendu partagé des planches d'impression (fiche de fabrication + pages du
 * livret, fond perdu 3 mm, traits de coupe) — utilisé par atelier.html
 * (fichier chargé/collé) et admin.html (commande choisie dans Firestore).
 * Feuille : 160 × 222 mm = coupe A5 (148 × 210) + fond perdu 3 mm de marge.
 */

import { el, formatDateFr } from '../core/utils.js';
import { TARIFS, pagesImprimees, papierId } from '../core/api.js';
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

/* Planche PRODUCTION : 160×222 mm = coupe A5 + fond perdu 3 mm + traits de coupe.
   Destinée à l'imprimeur (pas de filigrane). data-mm-* lu par pdfExport. */
function productionSheet(contentNode, paperColor, extraClass = '') {
  const s = el('section', { class: `print-sheet ${extraClass}`.trim(), 'data-mm-w': '160', 'data-mm-h': '222' });
  if (paperColor) s.style.setProperty('--sheet-paper', paperColor);
  s.append(
    el('div', { class: 'print-bleed', 'aria-hidden': 'true' }),
    el('div', { class: 'print-trim' }, [contentNode]),
    ...cropMarks(),
  );
  return s;
}

/* Planche BAT : A5 propre (148×210 mm), SANS fond perdu ni traits de coupe.
   Destinée à la validation client — le filigrane reste (renderPage print:false). */
function batSheet(pageNode) {
  return el('section', { class: 'print-sheet print-sheet--bat', 'data-mm-w': '148', 'data-mm-h': '210' }, [pageNode]);
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
    ['Pages', `${p.pages.length} pages créées → imprimé en ${pagesImprimees(p.pages.length)} pages`
      + ` (cahiers de 4, piqûre métal 2 points) · coupe A5 148 × 210 mm · fond perdu 3 mm`],
    p.fields?.date ? ['Date de la cérémonie', formatDateFr(p.fields.date)] : null,
  ].filter(Boolean);

  if (c) {
    rows.push(
      ['Type', commande.intent === 'devis' ? 'Demande de devis' : 'Commande'],
      ['Quantité', `${c.quantite} exemplaires`],
      ['Format final', 'A5 (14,8 × 21 cm) à la française'],
      ['Papier', c.papier ? (TARIFS.papiers[papierId(c.papier)]?.nom || c.papier) + ' · couverture 250 g rainée' : '—'],
      ['BAT demandé', c.bat ? 'Oui — envoyer le BAT avant impression' : 'Non'],
      c.estimation ? ['Montant du devis', `${(c.estimation.total ?? 0).toFixed(2)} €${c.estimation.unitaire != null ? ` (${c.estimation.unitaire.toFixed(2)} €/ex.)` : ''}`] : null,
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
 * Construit la fiche (résumé écran, toujours) + les planches à imprimer.
 * mode 'production' (défaut) : fiche de fabrication + pages 160×222 avec fond
 *   perdu et traits de coupe, sans filigrane → fichier HD pour l'imprimeur.
 * mode 'bat' : uniquement les pages A5 propres (sans fiche interne, sans coupe
 *   ni fond perdu), filigrane conservé → PDF de validation à envoyer au client.
 * Renvoie { ficheNode, sheetsNode, pageCount, mode }.
 */
export function buildPrintKit(commande, { mode = 'production' } = {}) {
  const isBat = mode === 'bat';
  const projet = commande.projet;
  const theme = themeById(projet.themeId);
  const rows = ficheRows(commande);

  // Fiche à l'écran (repère atelier) — présente dans les deux modes.
  const ficheNode = el('div', {}, [
    el('h2', {}, 'Fiche de fabrication'),
    el('dl', { class: 'fiche-grid', style: 'margin:0' }, rows.map(([dt, dd]) =>
      el('div', { class: `fiche-item${dt.includes('Message') ? ' fiche-message' : ''}` }, [
        el('dt', {}, dt), el('dd', {}, dd),
      ]))),
  ]);

  const sheetsNode = el('div', {});

  // Fiche imprimée en tête : UNIQUEMENT en production (contient prix/contact,
  // à ne pas envoyer au client dans un BAT).
  if (!isBat) {
    const ficheTable = el('div', {}, [
      el('h2', {}, 'Livrets de messe — fiche de fabrication'),
      el('p', { class: 'fiche-sub' }, 'Document d\'impression — A5, fond perdu 3 mm, traits de coupe.'),
      el('table', {}, rows.map(([dt, dd]) => el('tr', {}, [el('td', {}, dt), el('td', {}, dd)]))),
    ]);
    sheetsNode.append(productionSheet(ficheTable, '#FFFFFF', 'print-sheet--fiche'));
  }

  projet.pages.forEach((page, i) => {
    const node = renderPage(page, projet, {
      pageNumber: i + 1,
      totalPages: projet.pages.length,
      print: !isBat,          // production → pas de filigrane ; BAT → filigrane
    });
    node.removeAttribute('role');
    sheetsNode.append(isBat ? batSheet(node) : productionSheet(node, theme.paper));
  });

  return { ficheNode, sheetsNode, pageCount: projet.pages.length, mode };
}
