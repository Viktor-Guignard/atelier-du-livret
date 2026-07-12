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
const RIBBON_RGB = [179, 57, 47];   // rouge du ruban BAT (--danger), voir atelier.css .bat-ribbon

/** Mélange OPAQUE de `rgb` sur `bg` (mêmes ratios que le rgba() d'origine du ruban) — voir pageRenderer.js:blendHex. */
function blendOpaque(rgb, bg, ratio) {
  return `rgb(${rgb.map((c, i) => Math.round(c * ratio + bg[i] * (1 - ratio))).join(', ')})`;
}

function parseRgb(str) {
  const m = /rgba?\(([\d.]+),\s*([\d.]+),\s*([\d.]+)/.exec(str || '');
  return m ? [+m[1], +m[2], +m[3]] : [255, 255, 255];
}

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
      // pageRenderer.js). On enlève les ombres (purement décoratives) et on
      // remplace la transparence du ruban BAT par un mélange opaque de même
      // ratio sur le fond réel de la planche — même rendu qu'à l'écran,
      // au lieu d'un rouge plein qui casserait la discrétion du filigrane.
      onclone: (clonedDoc, clonedEl) => {
        clonedEl.style.boxShadow = 'none';
        clonedDoc.querySelectorAll('*').forEach((node) => { node.style.boxShadow = 'none'; });
        clonedDoc.querySelectorAll('.print-sheet').forEach((sheetEl) => {
          const ribbon = sheetEl.querySelector('.bat-ribbon');
          if (!ribbon) return;
          const bleed = sheetEl.querySelector('.print-bleed');
          const bg = parseRgb(bleed ? getComputedStyle(bleed).backgroundColor : '');
          ribbon.style.color = blendOpaque(RIBBON_RGB, bg, .28);
          ribbon.style.borderColor = blendOpaque(RIBBON_RGB, bg, .22);
        });
      },
    });
    const img = canvas.toDataURL('image/jpeg', 0.92);
    if (i > 0) doc.addPage([MM_W, MM_H], 'portrait');
    doc.addImage(img, 'JPEG', 0, 0, MM_W, MM_H, undefined, 'FAST');
  }

  doc.save(filename);
}
