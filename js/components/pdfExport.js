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

/** Dimensions mm d'une planche (data-mm-w / data-mm-h posés par printKit ; défaut 160×222). */
function sheetDims(el) {
  return [Number(el.dataset.mmW) || 160, Number(el.dataset.mmH) || 222];
}

/**
 * Génère et télécharge le PDF à partir d'un conteneur de planches (.print-sheet).
 * Chaque planche est mise à sa taille réelle (160×222 en production, 148×210 en
 * BAT), lue sur data-mm-*. onProgress(i, total) avant la capture de chaque planche.
 */
export async function exportSheetsToPDF(sheetsContainer, filename, { onProgress } = {}) {
  const sheets = [...sheetsContainer.querySelectorAll('.print-sheet')];
  if (!sheets.length) throw new Error('Aucune planche à exporter.');

  const [w0, h0] = sheetDims(sheets[0]);
  const doc = new jsPDF({ unit: 'mm', format: [w0, h0], compress: true });

  for (let i = 0; i < sheets.length; i++) {
    onProgress?.(i + 1, sheets.length);
    const [w, h] = sheetDims(sheets[i]);
    const canvas = await html2canvas(sheets[i], {
      scale: 3,
      backgroundColor: '#ffffff',
      useCORS: true,
      logging: false,
      // Neutralise les ombres dans le clone capturé : Chrome sérialise les
      // couleurs avec alpha (rgba/box-shadow…) en notation CSS Color 4
      // `color(srgb …)` via getComputedStyle, qu'html2canvas ne sait pas
      // interpréter (indépendant de nos propres styles — voir pageRenderer.js).
      onclone: (clonedDoc, clonedEl) => {
        clonedEl.style.boxShadow = 'none';
        clonedDoc.querySelectorAll('*').forEach((node) => { node.style.boxShadow = 'none'; });
      },
    });
    const img = canvas.toDataURL('image/jpeg', 0.92);
    if (i > 0) doc.addPage([w, h], 'portrait');
    doc.addImage(img, 'JPEG', 0, 0, w, h, undefined, 'FAST');
  }

  doc.save(filename);
}
