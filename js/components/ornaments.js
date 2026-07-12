/*
 * Ornements SVG line-art (trait 1.5, currentColor) — utilisés sur le site
 * (icônes de catégories) et DANS les livrets (motifs de couverture, filets).
 */

const wrap = (inner, viewBox = '0 0 48 48') =>
  `<svg viewBox="${viewBox}" fill="none" stroke="currentColor" stroke-width="1.5" ` +
  `stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${inner}</svg>`;

export const ORNAMENTS = {
  croix: wrap(
    '<path d="M24 8v32M14 18h20"/>' +
    '<path d="M24 16.2l1.8 1.8-1.8 1.8-1.8-1.8z" fill="currentColor" stroke="none"/>'
  ),

  colombe: wrap(
    '<path d="M9 27c3-7 12-10 18-7l13-8c-3 8-7 12-11 14 1.5 5-2 11-9 11.5C13 38 8 33 9 27Z"/>' +
    '<path d="M18 24c3-3.5 8-4 11.5-2M9 27l-4 1.5 4.5 1.5"/>'
  ),

  rameau: wrap(
    '<path d="M10 39C19 32 29 21 38 9"/>' +
    '<path d="M16 34c-1-4 1-7 4-8 1 4-1 7-4 8ZM24 26c-1-4 1-7 4-8 1 4-1 7-4 8ZM31 18c-1-4 1-7 4-8 1 4-1 7-4 8ZM19 37c4 1 7-1 8-4-4-1-7 1-8 4ZM27 29c4 1 7-1 8-4-4-1-7 1-8 4Z"/>'
  ),

  anneaux: wrap(
    '<circle cx="19.5" cy="27" r="9.5"/><circle cx="28.5" cy="21" r="9.5"/>'
  ),

  coquille: wrap(
    '<path d="M8 21a16 16 0 0 1 32 0L24 41Z"/>' +
    '<path d="M24 41 12 17M24 41 18 12M24 41V10M24 41l6-29M24 41l12-24"/>'
  ),

  calice: wrap(
    '<circle cx="24" cy="9" r="4.5"/><path d="M21.5 9h5M24 6.5v5"/>' +
    '<path d="M14 17h20c0 8-4.5 12-10 12s-10-4-10-12ZM24 29v7M17 40h14M20 36.5h8"/>'
  ),

  lumiere: wrap(
    '<path d="M20 22h8v18h-8zM24 8c3 3.2 3 7-0 9-3-2-3-5.8 0-9Z"/>' +
    '<path d="M24 22v-3M14 40h20"/>'
  ),

  flamme: wrap(
    '<path d="M24 6c7 8 9.5 14 9.5 21a9.5 9.5 0 0 1-19 0C14.5 20 17 14 24 6Z"/>' +
    '<path d="M24 20c2.8 3.5 4 6 4 9a4 4 0 0 1-8 0c0-3 1.2-5.5 4-9Z"/>'
  ),

  etoile: wrap(
    '<path d="M24 7l2.6 14.4L41 24l-14.4 2.6L24 41l-2.6-14.4L7 24l14.4-2.6Z"/>'
  ),

  couronne: wrap(
    '<path d="M11 35V21l8 6 5-11 5 11 8-6v14Z"/><path d="M11 39h26"/>' +
    '<circle cx="11" cy="17.5" r="1.4"/><circle cx="24" cy="12.5" r="1.4"/><circle cx="37" cy="17.5" r="1.4"/>'
  ),

  lys: wrap(
    '<path d="M24 7c3.5 6 3.5 13 0 19-3.5-6-3.5-13 0-19Z"/>' +
    '<path d="M13 15c-2 8 2 12 9 13M35 15c2 8-2 12-9 13"/>' +
    '<path d="M17 30h14M24 30v9M20 39h8"/>'
  ),

  livre: wrap(
    '<path d="M24 12c-4-3-10-3.5-15-2v27c5-1.5 11-1 15 2 4-3 10-3.5 15-2V10c-5-1.5-11-1-15 2Z"/>' +
    '<path d="M24 12v27"/>'
  ),

  filet: wrap(
    '<path d="M4 24h14M30 24h14"/><path d="M24 20l4 4-4 4-4-4Z"/>'
  ),
};

/** Filet horizontal décoratif (ligne — losange — ligne), largeur libre. */
export const filetSVG =
  '<svg viewBox="0 0 120 16" fill="none" stroke="currentColor" stroke-width="1.2" ' +
  'aria-hidden="true" focusable="false" preserveAspectRatio="xMidYMid meet">' +
  '<path d="M4 8h44M72 8h44" stroke-linecap="round"/>' +
  '<path d="M60 3.5 64.5 8 60 12.5 55.5 8Z"/></svg>';

/** Renvoie l'ornement `id` sous forme de chaîne SVG (ou la croix par défaut). */
export function ornament(id) {
  return ORNAMENTS[id] || ORNAMENTS.croix;
}
