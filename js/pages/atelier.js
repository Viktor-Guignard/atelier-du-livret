/*
 * ATELIER (interne) — transforme un fichier de commande du site en planches
 * prêtes à imprimer : A5 + fond perdu 3 mm + traits de coupe, sans filigrane.
 * Mode BAT : filigrane conservé + mention « BON À TIRER » sur chaque planche.
 * Export : bouton Imprimer → « Enregistrer au format PDF » (format exact 160×222 mm).
 */

import { qs, el, escapeHtml, formatDateFr } from '../core/utils.js';
import { TARIFS } from '../core/api.js';
import { themeById } from '../data/modeles.js';
import { categorieById } from '../data/categories.js';
import { renderPage } from '../components/pageRenderer.js';
import { showToast } from '../components/toast.js';

let commande = null;   // { intent, contact, commande, message, projet } | { projet } seul

/* ---------------- Chargement du fichier ---------------- */

const dropZone = qs('#drop-zone');
const fileInput = qs('#file-input');
const loadError = qs('#load-error');

function fail(msg) {
  loadError.textContent = msg;
  loadError.hidden = false;
}

function parsePayload(text) {
  let data;
  try { data = JSON.parse(text); }
  catch { return fail('Ce fichier n\'est pas un JSON valide.'); }

  if (data?.type === 'commande-atelier-livret' && data.projet?.pages) {
    commande = data;
  } else if (data?.pages && data?.fields) {
    commande = { projet: data };                     // projet seul (sans bon de commande)
  } else {
    return fail('Format inattendu — chargez un fichier « commande-….json » ou « livret-….json » du site.');
  }
  loadError.hidden = true;
  render();
}

dropZone.addEventListener('click', () => fileInput.click());
dropZone.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fileInput.click(); } });
fileInput.addEventListener('change', () => {
  const f = fileInput.files?.[0];
  if (f) f.text().then(parsePayload);
});
['dragover', 'dragenter'].forEach((t) => dropZone.addEventListener(t, (e) => { e.preventDefault(); dropZone.classList.add('is-over'); }));
['dragleave', 'drop'].forEach((t) => dropZone.addEventListener(t, (e) => { e.preventDefault(); dropZone.classList.remove('is-over'); }));
dropZone.addEventListener('drop', (e) => {
  const f = e.dataTransfer?.files?.[0];
  if (f) f.text().then(parsePayload);
});
qs('#paste-load').addEventListener('click', () => parsePayload(qs('#paste-input').value));

/* ---------------- Traits de coupe ---------------- */
/* Coupe : x/y ∈ {6mm, 154mm (=160−6), 216mm} — traits dans la marge externe de 3mm. */

function cropMarks() {
  const marks = [];
  const mk = (cls, style) => marks.push(el('span', { class: `crop ${cls}`, style, 'aria-hidden': 'true' }));
  for (const y of ['top:5.9mm', 'top:215.9mm']) {          // lignes horizontales de coupe
    mk('crop-h', `${y}; left:0;`);
    mk('crop-h', `${y}; right:0;`);
  }
  for (const x of ['left:5.9mm', 'left:153.9mm']) {        // lignes verticales de coupe
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

/* ---------------- Rendu ---------------- */

function ficheRows() {
  const p = commande.projet;
  const c = commande.commande;
  const rows = [
    ['Projet', `${p.nom} — réf. ${p.id}`],
    ['Cérémonie', categorieById(p.categorieId)?.nom || p.categorieId],
    ['Pages', `${p.pages.length} pages · coupe A5 148 × 210 mm · fond perdu 3 mm`],
    p.fields?.date ? ['Date de la cérémonie', formatDateFr(p.fields.date)] : null,
  ];
  if (c) {
    rows.push(
      ['Type', commande.intent === 'devis' ? 'Demande de devis' : 'Commande'],
      ['Quantité', `${c.quantite} exemplaires`],
      ['Format final', (c.format || 'a5').toUpperCase()],
      ['Papier', TARIFS.papiers[c.papier]?.nom || c.papier || '—'],
      ['BAT demandé', c.bat ? 'Oui — envoyer le BAT avant impression' : 'Non'],
      c.estimation ? ['Estimation annoncée', `${c.estimation.total.toFixed(2)} € (${c.estimation.unitaire.toFixed(2)} €/ex.)`] : null,
    );
  }
  if (commande.contact) {
    rows.push(['Client', `${commande.contact.prenom} ${commande.contact.nom} · ${commande.contact.email}${commande.contact.telephone ? ' · ' + commande.contact.telephone : ''}`]);
  }
  if (commande.message) rows.push(['Message du client', commande.message]);
  if (commande.creeLe) rows.push(['Commande reçue le', new Date(commande.creeLe).toLocaleString('fr-FR')]);
  return rows.filter(Boolean);
}

function render() {
  const projet = commande.projet;
  const theme = themeById(projet.themeId);
  const isBat = qs('#mode-bat').checked;
  document.querySelector('.atelier').classList.toggle('is-bat', isBat);

  /* Fiche écran */
  const fiche = qs('#fiche');
  fiche.hidden = false;
  fiche.textContent = '';
  fiche.append(
    el('h2', {}, 'Fiche de fabrication'),
    el('dl', { class: 'fiche-grid', style: 'margin:0' }, ficheRows().map(([dt, dd]) =>
      el('div', { class: `fiche-item${dt.includes('Message') ? ' fiche-message' : ''}` }, [
        el('dt', {}, dt), el('dd', {}, dd),
      ]))),
  );

  /* Planches */
  const sheets = qs('#sheets');
  sheets.textContent = '';

  // Planche 1 : la fiche (dans le PDF).
  const ficheTable = el('div', {}, [
    el('h2', {}, 'L\'Atelier du Livret — fiche de fabrication'),
    el('p', { class: 'fiche-sub' }, isBat
      ? 'BON À TIRER — document de validation, non destiné à l\'impression.'
      : 'Document d\'impression — A5, fond perdu 3 mm, traits de coupe.'),
    el('table', {}, ficheRows().map(([dt, dd]) =>
      el('tr', {}, [el('td', {}, dt), el('td', {}, dd)]))),
  ]);
  sheets.append(sheet(ficheTable, '#FFFFFF', 'print-sheet--fiche'));

  // Planches suivantes : les pages du livret (sans filigrane, sauf BAT).
  projet.pages.forEach((page, i) => {
    const node = renderPage(page, projet, {
      pageNumber: i + 1,
      totalPages: projet.pages.length,
      print: !isBat,
    });
    node.removeAttribute('role');
    sheets.append(sheet(node, theme.paper));
  });

  qs('#btn-print').disabled = false;
  showToast(`${projet.pages.length} planches prêtes${isBat ? ' (mode BAT)' : ''}.`, 'success');
}

qs('#mode-bat').addEventListener('change', () => { if (commande) render(); });
qs('#btn-print').addEventListener('click', () => window.print());
