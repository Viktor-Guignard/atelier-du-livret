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
  collection, query, orderBy, serverTimestamp,
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
  const year = new Date().getFullYear();
  const counterRef = doc(db, 'counters', String(year));

  return runTransaction(db, async (tx) => {
    const snap = await tx.get(counterRef);
    const next = (snap.exists() ? snap.data().n : 0) + 1;
    const numero = `CMD-${year}-${String(next).padStart(4, '0')}`;

    tx.set(counterRef, { n: next });
    tx.set(doc(db, 'commandes', numero), {
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
  const snap = await getDoc(doc(db, 'commandes', numero));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
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
export async function createBatShare(order) {
  const token = randomToken();
  const projet = order.projet;

  // Firestore limite un document à 1 Mo. Un projet lourd en photos peut le
  // dépasser : on prévient clairement plutôt que d'échouer de façon cryptique.
  if (JSON.stringify(projet).length > 900_000) {
    throw new Error('PROJET_TROP_LOURD');
  }

  await setDoc(doc(db, 'bats', token), {
    token,
    numero: order.numero || null,
    contactPrenom: order.contact?.prenom || '',
    contactNom: order.contact?.nom || '',
    contactEmail: order.contact?.email || '',   // pour l'accusé de validation au client
    projet,                       // instantané figé (pages, thème, police, champs)
    valide: false,
    valideLe: null,
    valideParNom: null,
    creeLe: serverTimestamp(),
  });
  // Mémoriser le jeton sur la commande (pour retrouver le statut côté atelier).
  if (order.numero) {
    try { await updateDoc(doc(db, 'commandes', order.numero), { batToken: token }); } catch { /* non bloquant */ }
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
