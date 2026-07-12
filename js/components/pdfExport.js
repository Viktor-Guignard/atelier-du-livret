/*
 * Export direct en PDF (téléchargement, sans passer par la fenêtre
 * d'impression du système) — chaque planche .print-sheet est capturée en
 * haute résolution puis assemblée dans un PDF au format exact 160×222 mm
 * (coupe A5 148×210 + fond perdu 3 mm), fidèle à l'aperçu (traits de coupe,
 * filigrane BAT le cas échéant).
 *
 * jsPDF + html2canvas : librairies clientes, aucun serveur nécessaire.
 */

import { jsPDF } from 'https://cdn.jsdelivr.net/npm/jspdf@2.5.2/+esm';
import html2canvas from 'https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/+esm';

const MM_W = 160;
const MM_H = 222;

/**
 * Génère et télécharge le PDF à partir d'un conteneur de planches (.print-sheet).
 * onProgress(i, total) est appelé avant la capture de chaque planche.
 */
export async function exportSheetsToPDF(sheetsContainer, filename, { onProgress } = {}) {
  const sheets = [...sheetsContainer.querySelectorAll('.print-sheet')];
  if (!sheets.length) throw new Error('Aucune planche à exporter.');

  const doc = new jsPDF({ unit: 'mm', format: [MM_W, MM_H], compress: true });

  for (let i = 0; i < sheets.length; i++) {
    onProgress?.(i + 1, sheets.length);
    const canvas = await html2canvas(sheets[i], {
      scale: 3,
      backgroundColor: '#ffffff',
      useCORS: true,
      logging: false,
      // Neutralise toute couleur transparente dans le clone capturé : Chrome
      // sérialise les couleurs avec alpha (rgba/box-shadow…) en notation
      // CSS Color 4 `color(srgb …)` via getComputedStyle, qu'html2canvas ne
      // sait pas interpréter (indépendant de nos propres styles — voir
      // pageRenderer.js). On enlève les ombres (purement décoratives, sans
      // utilité sur une planche imprimée) et on rend le ruban BAT opaque.
      onclone: (clonedDoc, clonedEl) => {
        clonedEl.style.boxShadow = 'none';
        clonedDoc.querySelectorAll('*').forEach((node) => { node.style.boxShadow = 'none'; });
        clonedDoc.querySelectorAll('.bat-ribbon').forEach((node) => {
          node.style.color = 'rgb(179, 57, 47)';
          node.style.borderColor = 'rgb(179, 57, 47)';
        });
      },
    });
    const img = canvas.toDataURL('image/jpeg', 0.92);
    if (i > 0) doc.addPage([MM_W, MM_H], 'portrait');
    doc.addImage(img, 'JPEG', 0, 0, MM_W, MM_H, undefined, 'FAST');
  }

  doc.save(filename);
}
