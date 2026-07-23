/*
 * Firebase — Firestore (commandes) + Authentication (espace privé de l'atelier).
 *
 * La config ci-dessous n'est PAS secrète (c'est ainsi que fonctionnent les
 * applications web Firebase : ces identifiants sont visibles dans le code de
 * n'importe quel site qui les utilise). La vraie protection vient des règles
 * de sécurité Firestore (fichier firestore.rules à la racine du projet,
 * à coller dans Firebase Console → Firestore Database → Règles) : n'importe
 * qui peut CRÉER une commande (passer commande), mais seul un compte connecté
 * (le vôtre) peut LIRE, MODIFIER ou SUPPRIMER les commandes existantes.
 */

import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import {
  getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut,
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
import {
  getFirestore, doc, runTransaction, getDoc, getDocs, setDoc, updateDoc,
  collection, query, where, limit, orderBy, serverTimestamp,
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

const firebaseConfig = {
  apiKey: 'AIzaSyBmEcAAkKSLtb54P7jHFWkBaET_fU6k8UQ',
  authDomain: 'livret-de-messe.firebaseapp.com',
  projectId: 'livret-de-messe',
  storageBucket: 'livret-de-messe.firebasestorage.app',
  messagingSenderId: '647018008247',
  appId: '1:647018008247:web:61dbf39efcf9b827460732',
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// Fonctions serveur hébergées sur Netlify (gratuit, sans Firebase Blaze) —
// voir netlify/functions/. À adapter si le nom du site Netlify change.
const NETLIFY_FUNCTIONS_URL = 'https://livretsdemesse-stripe.netlify.app/.netlify/functions';

/* ---------------- Authentification (espace privé) ---------------- */

export const signIn = (email, password) => signInWithEmailAndPassword(auth, email, password);
export const signOutAdmin = () => signOut(auth);
export const onAuthChange = (callback) => onAuthStateChanged(auth, callback);

/* ---------------- Commandes ---------------- */

/**
 * Enregistre une commande et renvoie son numéro (ex. "CMD-2026-0001"),
 * attribué de façon atomique via un compteur annuel — deux commandes passées
 * en même temps ne peuvent jamais recevoir le même numéro.
 */
export async function saveOrder(orderData) {
  // Garde de taille : Firestore limite un document à 1 Mo. Une commande multi-
  // livrets avec photos peut le dépasser → on prévient clairement (l'appelant
  // bascule alors sur un e-mail de secours) plutôt que d'échouer en silence.
  if (JSON.stringify(orderData).length > 900_000) throw new Error('COMMANDE_TROP_LOURDE');

  const year = new Date().getFullYear();
  const counterRef = doc(db, 'counters', String(year));
  // ID de document ALÉATOIRE (non devinable) : empêche un tiers de pré-créer le
  // prochain numéro pour bloquer définitivement la transaction de numérotation.
  // Le numéro lisible (CMD-AAAA-NNNN) reste un CHAMP du document.
  const orderRef = doc(collection(db, 'commandes'));

  return runTransaction(db, async (tx) => {
    const snap = await tx.get(counterRef);
    const next = (snap.exists() ? snap.data().n : 0) + 1;
    const numero = `CMD-${year}-${String(next).padStart(4, '0')}`;

    tx.set(counterRef, { n: next });
    tx.set(orderRef, {
      ...orderData,
      numero,
      creeLe: serverTimestamp(),
    });
    return numero;
  });
}

/** Liste des commandes, la plus récente en premier (réservé aux comptes connectés). */
export async function listOrders() {
  const q = query(collection(db, 'commandes'), orderBy('creeLe', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

/** Une commande précise, par son numéro (réservé aux comptes connectés). */
export async function getOrder(numero) {
  // Le numéro est un champ (l'ID du document est aléatoire) → recherche par champ.
  const snap = await getDocs(query(collection(db, 'commandes'), where('numero', '==', numero), limit(1)));
  return snap.empty ? null : { id: snap.docs[0].id, ...snap.docs[0].data() };
}

/* ---------------- BAT en ligne (bon à tirer 3D partageable) ---------------- */

/** Jeton aléatoire long et non devinable (le lien du BAT en dépend entièrement). */
function randomToken(len = 22) {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  const bytes = crypto.getRandomValues(new Uint8Array(len));
  return Array.from(bytes, (b) => chars[b % chars.length]).join('');
}

/**
 * Crée un BAT partageable pour une commande : écrit un instantané du projet
 * dans `bats/{token}` (lisible publiquement UNIQUEMENT si l'on connaît le
 * jeton) et retourne le jeton. Réservé au compte atelier (règles Firestore).
 * L'instantané rend le BAT consultable par le client sans lui donner accès à
 * la commande elle-même (contact, prix… restent privés).
 */
export async function createBatShare(order, itemIndex = 0) {
  const token = randomToken();
  // Commande multi-livrets : chaque livret a son propre BAT. Repli sur order.projet
  // pour les anciennes commandes (mono-livret) enregistrées avant le panier.
  const projet = order.items?.[itemIndex]?.projet || order.projet;
  if (!projet) throw new Error('PROJET_INTROUVABLE');

  // Firestore limite un document à 1 Mo. Un projet lourd en photos peut le
  // dépasser : on prévient clairement plutôt que d'échouer de façon cryptique.
  if (JSON.stringify(projet).length > 900_000) {
    throw new Error('PROJET_TROP_LOURD');
  }

  await setDoc(doc(db, 'bats', token), {
    token,
    numero: order.numero || null,
    itemIndex,
    livretNom: projet.nom || '',
    contactPrenom: order.contact?.prenom || '',
    contactNom: order.contact?.nom || '',
    contactEmail: order.contact?.email || '',   // pour l'accusé de validation au client
    projet,                       // instantané figé (pages, thème, police, champs)
    valide: false,
    valideLe: null,
    valideParNom: null,
    creeLe: serverTimestamp(),
  });
  // Mémoriser le jeton sur la commande, par livret (batTokens.{i}) — pour retrouver
  // le statut côté atelier. On garde aussi batToken pour le livret 0 (compat).
  if (order.id || order.numero) {
    const patch = { [`batTokens.${itemIndex}`]: token };
    if (itemIndex === 0) patch.batToken = token;
    // order.id = ID (aléatoire) du document ; repli sur numero pour d'anciennes commandes.
    try { await updateDoc(doc(db, 'commandes', order.id || order.numero), patch); } catch { /* non bloquant */ }
  }
  return token;
}

/** Lit un BAT par son jeton (accès public : il faut connaître le jeton). */
export async function getBat(token) {
  const snap = await getDoc(doc(db, 'bats', token));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

/**
 * Valide un BAT (action du client). N'affecte que les champs de validation ;
 * les règles Firestore interdisent toute autre modification et empêchent de
 * re-valider un BAT déjà validé.
 */
export async function validateBat(token, nom, appareil, lieu) {
  await updateDoc(doc(db, 'bats', token), {
    valide: true,
    valideLe: serverTimestamp(),
    valideParNom: nom || '',
    valideAppareil: appareil || '',   // navigateur/appareil (traçabilité)
    valideLieu: lieu || '',           // lieu approximatif (ville/région/pays)
  });
}

/* ---------------- Factures (payées via Stripe, consultables par jeton) ---------------- */

/**
 * Numéro de facture séquentiel « LDM-AAAA-NNNN » (série dédiée au service,
 * distincte de la numérotation interne d'Imprigraphic — séries multiples
 * autorisées en France). Compteur transactionnel, comme les commandes.
 */
async function nextFactureNumber() {
  const year = new Date().getFullYear();
  const ref = doc(db, 'counters', `factures-${year}`);
  return runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    const next = (snap.exists() ? snap.data().n : 0) + 1;
    tx.set(ref, { n: next });
    return `LDM-${year}-${String(next).padStart(4, '0')}`;
  });
}

/**
 * Crée la facture d'une commande payée : numéro séquentiel + document
 * `factures/{token}` (lisible uniquement avec le jeton, comme les BAT) +
 * marquage de la commande (statut payé, jeton, numéro). Réservé au compte
 * atelier. Renvoie { token, numero }.
 */
export async function createFacture(order, { lignes, totalTTC }) {
  const token = randomToken();
  const numero = await nextFactureNumber();
  const totalHT = Math.round((totalTTC / 1.2) * 100) / 100;

  await setDoc(doc(db, 'factures', token), {
    token,
    numero,
    commandeNumero: order.numero || null,
    client: {
      prenom: order.contact?.prenom || '',
      nom: order.contact?.nom || '',
      email: order.contact?.email || '',
    },
    lignes,                                   // [{ label, ttc }]
    totalTTC: Math.round(totalTTC * 100) / 100,
    totalHT,
    tva: Math.round((totalTTC - totalHT) * 100) / 100,
    payeeLe: serverTimestamp(),
    creeLe: serverTimestamp(),
  });
  if (order.id || order.numero) {
    try {
      await updateDoc(doc(db, 'commandes', order.id || order.numero), {
        paiementStatut: 'payee',
        paiementLe: serverTimestamp(),
        factureToken: token,
        factureNumero: numero,
      });
    } catch { /* non bloquant */ }
  }
  return { token, numero };
}

/** Lit une facture par son jeton (accès public : il faut connaître le jeton). */
export async function getFacture(token) {
  const snap = await getDoc(doc(db, 'factures', token));
  return snap.exists() ? snap.data() : null;
}

/** Mémorise le lien de paiement Stripe collé dans l'admin (réservé atelier). */
export async function savePaymentLink(order, lien) {
  await updateDoc(doc(db, 'commandes', order.id || order.numero), {
    paiementLien: lien,
    paiementStatut: order.paiementStatut || 'en_attente',
  });
}

/**
 * Génère automatiquement un lien de paiement Stripe pour la commande (fonction
 * Netlify `create-checkout`, voir netlify/functions/) : le panier exact (un
 * livret = une ligne) est repris depuis Firestore, plus besoin de créer le
 * lien à la main dans le tableau de bord Stripe. Réservé au compte atelier —
 * authentifié par le jeton du compte Firebase connecté.
 */
export async function createStripeCheckout(numero) {
  if (!auth.currentUser) throw new Error('NON_CONNECTE');
  const idToken = await auth.currentUser.getIdToken();
  const resp = await fetch(`${NETLIFY_FUNCTIONS_URL}/create-checkout`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
    body: JSON.stringify({ numero }),
  });
  if (!resp.ok) throw new Error(`create-checkout ${resp.status} : ${await resp.text()}`);
  const { url } = await resp.json();
  return url;
}

/* ---------------- Panier partageable (reprise par code, sans compte) ---------------- */

/**
 * Écrit/écrase un panier sous son code (« PAN-XXXXXX »). Le client détient le
 * code : c'est une URL-capacité, comme les BAT. Aucune donnée personnelle n'est
 * stockée (uniquement des livrets), et les règles Firestore limitent la taille.
 */
export async function saveCart(code, data) {
  if (JSON.stringify(data.items || []).length > 900_000) throw new Error('PANIER_TROP_LOURD');
  await setDoc(doc(db, 'paniers', code), {
    items: data.items || [],
    majLe: serverTimestamp(),
  });
}

/** Lit un panier par son code (accès public : il faut connaître le code). */
export async function getCart(code) {
  const snap = await getDoc(doc(db, 'paniers', code));
  return snap.exists() ? snap.data() : null;
}
