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
  getFirestore, doc, runTransaction, getDoc, getDocs, collection, query, orderBy, serverTimestamp,
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
