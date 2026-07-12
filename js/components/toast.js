/* Notifications légères (coin bas de l'écran). showToast('Enregistré', 'success') */

import { el } from '../core/utils.js';

let zone = null;

export function showToast(message, type = 'info', duration = 3200) {
  if (!zone) {
    zone = el('div', { class: 'toast-zone', 'aria-live': 'polite', role: 'status' });
    document.body.append(zone);
  }
  const toast = el('div', { class: `toast${type !== 'info' ? ` toast-${type}` : ''}` }, message);
  zone.append(toast);
  setTimeout(() => {
    toast.classList.add('is-leaving');
    setTimeout(() => toast.remove(), 320);
  }, duration);
}
