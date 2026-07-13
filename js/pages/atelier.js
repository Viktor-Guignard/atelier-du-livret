/*
 * ATELIER (interne, accès direct par fichier) — transforme un fichier de
 * commande (chargé ou collé) en planches prêtes à imprimer : A5 + fond
 * perdu 3 mm + traits de coupe, sans filigrane.
 * Mode BAT : filigrane conservé + mention « BON À TIRER » sur chaque planche.
 * Export : bouton Imprimer → « Enregistrer au format PDF » (feuille 160×222 mm).
 *
 * Depuis l'ajout de Firebase, la voie normale de réception d'une commande
 * est admin.html (espace privé, liste triée, pas de copier-coller). Cette
 * page reste utile en secours (fichier .json téléchargé par un client si
 * l'enregistrement en base a échoué) — voir js/components/printKit.js pour
 * le moteur de rendu, partagé avec admin.html.
 */

import { qs } from '../core/utils.js';
import { buildPrintKit } from '../components/printKit.js';
import { exportSheetsToPDF } from '../components/pdfExport.js';
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

/* ---------------- Rendu ---------------- */

function render() {
  const isBat = qs('#mode-bat').checked;
  document.querySelector('.atelier').classList.toggle('is-bat', isBat);

  const { ficheNode, sheetsNode, pageCount } = buildPrintKit(commande, { mode: isBat ? 'bat' : 'production' });

  const fiche = qs('#fiche');
  fiche.hidden = false;
  fiche.textContent = '';
  fiche.append(ficheNode);

  const sheets = qs('#sheets');
  sheets.textContent = '';
  sheets.append(sheetsNode);

  qs('#btn-print').disabled = false;
  qs('#btn-download-pdf').disabled = false;
  showToast(`${pageCount} planches prêtes${isBat ? ' (mode BAT)' : ''}.`, 'success');
}

qs('#mode-bat').addEventListener('change', () => { if (commande) render(); });
qs('#btn-print').addEventListener('click', () => window.print());

/* ---------------- Téléchargement direct du PDF ---------------- */

const downloadBtn = qs('#btn-download-pdf');
const progress = qs('#pdf-progress');

downloadBtn.addEventListener('click', async () => {
  if (!commande) return;
  const isBat = qs('#mode-bat').checked;
  const base = (commande.numero || commande.projet.nom || 'livret').toLowerCase().replace(/[^a-z0-9]+/gi, '-');
  const filename = `${base}-${isBat ? 'BAT' : 'impression'}.pdf`;

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
