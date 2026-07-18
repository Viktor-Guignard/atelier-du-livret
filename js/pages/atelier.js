/*
 * ATELIER (interne, accès direct par fichier) — transforme un fichier de
 * commande (chargé ou collé) en planches prêtes à imprimer : A5 + fond
 * perdu 3 mm + traits de coupe, sans filigrane.
 * Mode BAT : pages A5 propres, filigrane conservé, sans fond perdu ni traits
 * de coupe (planche 148×210) — destinées à la validation client.
 * Export : « Télécharger le PDF » (jsPDF) ou impression système.
 *
 * Depuis l'ajout de Firebase, la voie normale de réception d'une commande
 * est admin.html (espace privé, liste triée, pas de copier-coller). Cette
 * page reste utile en secours (fichier .json téléchargé par un client si
 * l'enregistrement en base a échoué) — voir js/components/printKit.js pour
 * le moteur de rendu, partagé avec admin.html.
 */

import { qs, el } from '../core/utils.js';
import { buildPrintKit } from '../components/printKit.js';
import { exportSheetsToPDF } from '../components/pdfExport.js';
import { showToast } from '../components/toast.js';

let commande = null;   // v2 { items:[{projet,commande}], … } | v1 { projet,… } | { projet } seul
let activeItemIndex = 0;

/* Un fichier de commande = un ou plusieurs livrets. Compat mono-livret. */
const atelierItems = (c) => (c?.items?.length ? c.items : (c?.projet ? [{ projet: c.projet, commande: c.commande }] : []));
/* Vue « livret actif » : projet/commande du livret i, pour buildPrintKit sans le modifier. */
const viewFor = (c, i) => { const it = atelierItems(c)[i] || {}; return { ...c, projet: it.projet, commande: it.commande }; };

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

  if (data?.type === 'commande-atelier-livret' && (Array.isArray(data.items) ? data.items.length : data.projet?.pages)) {
    commande = data;                                 // v2 (items[]) ou v1 (projet racine)
  } else if (data?.pages && data?.fields) {
    commande = { projet: data };                     // projet seul (sans bon de commande)
  } else {
    return fail('Format inattendu — chargez un fichier « commande-….json » ou « livret-….json » du site.');
  }
  activeItemIndex = 0;
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

/* ---------------- Rendu ---------------- */

/* Sélecteur de livret (commandes multi-livrets) inséré avant la fiche. */
function renderItemSwitcher(items) {
  let zone = qs('#atelier-items');
  if (!zone) { zone = el('div', { id: 'atelier-items', style: 'margin:0 0 var(--sp-4)' }); qs('#fiche').before(zone); }
  zone.textContent = '';
  if (items.length <= 1) { zone.hidden = true; return; }
  zone.hidden = false;
  zone.append(
    el('p', { class: 'small muted', style: 'margin:0 0 8px' }, `${items.length} livrets — préparez chacun :`),
    el('div', { style: 'display:flex;flex-wrap:wrap;gap:8px' }, items.map((it, i) =>
      el('button', {
        class: `chip${i === activeItemIndex ? ' is-active' : ''}`, type: 'button',
        onclick: () => { activeItemIndex = i; render(); },
      }, `${i + 1}. ${it.projet?.nom || 'Livret'}`))),
  );
}

function render() {
  const isBat = qs('#mode-bat').checked;
  const items = atelierItems(commande);
  renderItemSwitcher(items);

  const { ficheNode, sheetsNode } = buildPrintKit(viewFor(commande, activeItemIndex), { mode: isBat ? 'bat' : 'production' });

  const fiche = qs('#fiche');
  fiche.hidden = false;
  fiche.textContent = '';
  fiche.append(ficheNode);

  const sheets = qs('#sheets');
  sheets.textContent = '';
  sheets.append(sheetsNode);

  qs('#btn-print').disabled = false;
  qs('#btn-download-pdf').disabled = false;
  const nb = sheets.querySelectorAll('.print-sheet').length;
  showToast(`${nb} planche${nb > 1 ? 's' : ''} prête${nb > 1 ? 's' : ''}${isBat ? ' (mode BAT)' : ''}.`, 'success');
}

qs('#mode-bat').addEventListener('change', () => { if (commande) render(); });
qs('#btn-print').addEventListener('click', () => window.print());

/* ---------------- Téléchargement direct du PDF ---------------- */

const downloadBtn = qs('#btn-download-pdf');
const progress = qs('#pdf-progress');

downloadBtn.addEventListener('click', async () => {
  if (!commande) return;
  const isBat = qs('#mode-bat').checked;
  const items = atelierItems(commande);
  const nom = items[activeItemIndex]?.projet?.nom;
  const base = (commande.numero || nom || 'livret').toLowerCase().replace(/[^a-z0-9]+/gi, '-');
  const suffixLivret = items.length > 1 ? `-livret${activeItemIndex + 1}` : '';
  const filename = `${base}${suffixLivret}-${isBat ? 'BAT' : 'impression'}.pdf`;

  downloadBtn.disabled = true;
  const label = downloadBtn.textContent;
  progress.hidden = false;

  try {
    await exportSheetsToPDF(qs('#sheets'), filename, {
      onProgress: (i, total) => {
        downloadBtn.textContent = `Génération… ${i}/${total}`;
        progress.textContent = `Planche ${i} sur ${total}…`;
      },
    });
    showToast('PDF téléchargé.', 'success');
  } catch (err) {
    console.error(err);
    showToast('Échec de la génération du PDF — réessayez.', 'error');
  } finally {
    downloadBtn.disabled = false;
    downloadBtn.textContent = label;
    progress.hidden = true;
  }
});
