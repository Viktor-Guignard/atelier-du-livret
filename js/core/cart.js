/*
 * Panier — plusieurs livrets commandés ensemble, SANS compte.
 *
 * - Persisté en localStorage (`ldm.panier`) : fermer/rouvrir l'onglet ne perd rien.
 * - Code de reprise « PAN-XXXXXX » : dès qu'un livret est ajouté, le panier reçoit
 *   un code et une copie est écrite dans Firestore (`paniers/{code}`). Le client
 *   note ce code pour retrouver son panier ailleurs / après vidage du cache.
 * - Chaque ligne = { id, projet, commande:{quantite,format,papier,options,bat} }
 *   — MÊME forme que le payload de commande, pour que la chaîne aval (BAT, PDF,
 *   printKit) n'ait pas à changer.
 *
 * Firebase n'est chargé QUE de façon paresseuse (import dynamique) : les pages
 * vitrine qui affichent juste le compteur du panier ne tirent pas le SDK.
 */

import { uid, deepClone } from './utils.js';

const CART_KEY = 'ldm.panier';
const listeners = new Set();

/* Alphabet sans caractères ambigus (pas de O/0, I/1, etc.) pour un code dicté/recopié sans erreur. */
const CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

function newCode() {
  const bytes = crypto.getRandomValues(new Uint8Array(6));
  return 'PAN-' + Array.from(bytes, (b) => CODE_ALPHABET[b % CODE_ALPHABET.length]).join('');
}

function read() {
  try { return JSON.parse(localStorage.getItem(CART_KEY)) || { items: [], code: null }; }
  catch { return { items: [], code: null }; }
}

/** Écrit le panier. Renvoie true si OK, false si le quota localStorage est dépassé. */
function write(cart) {
  try {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
  } catch (err) {
    console.error('Panier : écriture localStorage impossible (quota dépassé ?).', err);
    return false;
  }
  listeners.forEach((fn) => { try { fn(cart); } catch { /* isolé */ } });
  return true;
}

/* ---------------- Lecture ---------------- */

export function cartItems() { return read().items; }
export function itemCount() { return read().items.length; }
export function cartCode() { return read().code; }

/** S'abonner aux changements du panier (met à jour le badge, la page panier…). Renvoie une fonction de désabonnement. */
export function onCartChange(fn) {
  listeners.add(fn);
  // Un autre onglet qui modifie le panier déclenche aussi une mise à jour.
  const onStorage = (e) => { if (e.key === CART_KEY) fn(read()); };
  window.addEventListener('storage', onStorage);
  return () => { listeners.delete(fn); window.removeEventListener('storage', onStorage); };
}

/** Options de commande par défaut d'un nouveau livret ajouté au panier. */
export function defaultCommande() {
  return { quantite: 100, format: 'a5', papier: 'couche', options: [], bat: true };
}

/* ---------------- Mutations ---------------- */

/**
 * Ajoute un livret au panier (instantané figé). Upsert par projet.id : rééditer
 * puis réajouter le même livret met à jour sa ligne (mêmes options) au lieu de
 * créer un doublon. Renvoie l'id de la ligne.
 */
export function addToCart(projet, commande = null) {
  const cart = read();
  const codeWasNew = !cart.code;
  if (!cart.code) cart.code = newCode();           // code créé dès le 1er livret
  const existing = projet.id ? cart.items.find((i) => i.projet?.id === projet.id) : null;
  if (existing) {
    existing.projet = deepClone(projet);           // options de commande conservées
    if (!write(cart)) return null;                 // quota dépassé → échec explicite
    syncCloud(codeWasNew);
    return existing.id;
  }
  const item = { id: uid('l'), projet: deepClone(projet), commande: commande || defaultCommande() };
  cart.items.push(item);
  if (!write(cart)) return null;
  syncCloud(codeWasNew);                            // 1re fois : sync immédiat (le code doit exister au cloud)
  return item.id;
}

/** Met à jour les options de commande d'une ligne (quantité, format, papier, options, bat). */
export function updateItem(lineId, patch) {
  const cart = read();
  const it = cart.items.find((i) => i.id === lineId);
  if (!it) return;
  Object.assign(it.commande, patch);
  write(cart);
  syncCloud();
}

/** Retire une ligne du panier. */
export function removeItem(lineId) {
  const cart = read();
  cart.items = cart.items.filter((i) => i.id !== lineId);
  write(cart);
  syncCloud();
}

/** Vide entièrement le panier (garde le code, qui pointera vers un panier vide). */
export function clearCart() {
  const cart = read();
  cart.items = [];
  write(cart);
  syncCloud();
}

/** Remplace le contenu du panier après reprise par code. */
export function restoreCart(items, code) {
  write({ items: Array.isArray(items) ? items : [], code: code || newCode() });
}

/* ---------------- Reprise / sauvegarde par code (Firestore, paresseux) ---------------- */

let syncTimer = null;

/**
 * Écrit le panier dans Firestore (best-effort). localStorage reste la source de
 * vérité. `immediate` force une écriture sans délai — utilisé à la 1re création
 * du code, pour qu'un code affiché ait toujours une copie cloud même si le client
 * navigue aussitôt (sinon le débounce de 600 ms pourrait être perdu).
 */
function syncCloud(immediate = false) {
  const cart = read();
  if (!cart.code) return;
  clearTimeout(syncTimer);
  const run = async () => {
    try {
      const { saveCart } = await import('./firebase.js');
      await saveCart(cart.code, { items: cart.items });
    } catch (err) {
      console.warn('Panier : synchro cloud impossible (le panier reste sur cet appareil).', err);
    }
  };
  if (immediate) run();
  else syncTimer = setTimeout(run, 600);
}

/**
 * Reprend un panier depuis son code. Renvoie { ok, items } ou { ok:false, reason }.
 * reason ∈ 'introuvable' | 'erreur'.
 */
export async function recoverCart(rawCode) {
  const code = (rawCode || '').trim().toUpperCase();
  if (!code) return { ok: false, reason: 'introuvable' };
  try {
    const { getCart: getCloudCart } = await import('./firebase.js');
    const data = await getCloudCart(code);
    if (!data || !Array.isArray(data.items)) return { ok: false, reason: 'introuvable' };
    restoreCart(data.items, code);
    return { ok: true, items: data.items };
  } catch (err) {
    console.error('Reprise du panier impossible :', err);
    return { ok: false, reason: 'erreur' };
  }
}
