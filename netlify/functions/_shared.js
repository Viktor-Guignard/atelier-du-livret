/*
 * Aide partagée par les deux fonctions Netlify (create-checkout, stripe-webhook).
 * Logique de facturation dupliquée de js/pages/admin.js + js/core/firebase.js —
 * à garder synchronisée si la façon de calculer une commande change côté site.
 */

const admin = require('firebase-admin');

function initAdmin() {
  if (admin.apps.length) return admin.app();
  const json = JSON.parse(Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_B64, 'base64').toString('utf8'));
  return admin.initializeApp({ credential: admin.credential.cert(json) });
}

const SITE_URL = 'https://livretsdemesse.fr';
const CONTACT_EMAIL = 'viktor.guignard@gmail.com';
// Identifiants publics EmailJS — mêmes valeurs que js/core/api.js (EMAILJS).
const EMAILJS = {
  publicKey: 'MwzwkkXRyTFfXZy_f',
  serviceId: 'service_r8cydnk',
  templateId: 'template_90sttdl',
};

const orderItemsOf = (o) => (o.items?.length ? o.items : [{ projet: o.projet, commande: o.commande }]);

/** Lignes de facture d'une commande : un livret = une ligne, TTC. Doit rester identique à admin.js. */
function factureLignes(order) {
  const items = orderItemsOf(order);
  const lignes = items.map((it) => {
    const c = it.commande || {};
    const est = c.estimation || {};
    return {
      label: `${it.projet?.nom || 'Livret'} — ${c.quantite || '?'} ex. · A5 · `
        + `${est.pagesFacturees || it.projet?.pages?.length || '?'} pages · création, BAT & impression`,
      ttc: est.total ?? 0,
    };
  });
  const totalTTC = order.montantTotal ?? lignes.reduce((s, l) => s + l.ttc, 0);
  return { lignes, totalTTC };
}

function randomToken(len = 22) {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  const bytes = require('crypto').randomBytes(len);
  return Array.from(bytes, (b) => chars[b % chars.length]).join('');
}

async function nextFactureNumber(db) {
  const year = new Date().getFullYear();
  const ref = db.collection('counters').doc(`factures-${year}`);
  return db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const next = (snap.exists ? snap.data().n : 0) + 1;
    tx.set(ref, { n: next });
    return `LDM-${year}-${String(next).padStart(4, '0')}`;
  });
}

async function sendFactureEmail({ email, prenom, numeroFacture, numeroCommande, totalTTC, url }) {
  if (!email) return;
  const RULE = '─'.repeat(38);
  const message = [
    `Bonjour ${(prenom || '').trim()},`.replace(' ,', ','),
    '',
    'Merci pour votre règlement — voici votre facture.',
    '',
    RULE,
    `  Facture               ${numeroFacture}`,
    numeroCommande ? `  Commande              ${numeroCommande}` : null,
    `  Montant réglé TTC     ${totalTTC.toFixed(2)} €`,
    RULE,
    '',
    'Consultez et téléchargez votre facture (PDF) ici :',
    url,
    '',
    'Conservez ce lien : il reste accessible à tout moment.',
    'Votre commande part en fabrication — nous revenons vers vous pour la livraison.',
    '',
    'À très bientôt,',
    'Livrets de messe · créé par VIKTO LABS · imaginé et imprimé par Imprigraphic',
  ].filter((l) => l !== null).join('\n');

  const resp = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      service_id: EMAILJS.serviceId,
      template_id: EMAILJS.templateId,
      user_id: EMAILJS.publicKey,
      template_params: {
        to_email: email,
        reply_to: CONTACT_EMAIL,
        subject: `Votre facture ${numeroFacture} — Livrets de messe`,
        message,
      },
    }),
  });
  if (!resp.ok) throw new Error(`EmailJS ${resp.status} : ${await resp.text()}`);
}

/** Marque une commande payée, crée sa facture et l'envoie. Idempotent. */
async function markOrderPaid(db, numero, session) {
  const snap = await db.collection('commandes').where('numero', '==', numero).limit(1).get();
  if (snap.empty) { console.warn(`Webhook : commande ${numero} introuvable.`); return; }
  const orderDoc = snap.docs[0];
  const order = orderDoc.data();
  if (order.paiementStatut === 'payee') return; // idempotent — Stripe peut renvoyer l'événement

  const { lignes, totalTTC } = factureLignes(order);
  const token = randomToken();
  const numeroFacture = await nextFactureNumber(db);
  const totalHT = Math.round((totalTTC / 1.2) * 100) / 100;

  await db.collection('factures').doc(token).set({
    token,
    numero: numeroFacture,
    commandeNumero: numero,
    client: {
      prenom: order.contact?.prenom || '',
      nom: order.contact?.nom || '',
      email: order.contact?.email || '',
    },
    lignes,
    totalTTC: Math.round(totalTTC * 100) / 100,
    totalHT,
    tva: Math.round((totalTTC - totalHT) * 100) / 100,
    payeeLe: admin.firestore.FieldValue.serverTimestamp(),
    creeLe: admin.firestore.FieldValue.serverTimestamp(),
    stripeSessionId: session.id,
    stripePaymentIntent: session.payment_intent || null,
  });

  await orderDoc.ref.update({
    paiementStatut: 'payee',
    paiementLe: admin.firestore.FieldValue.serverTimestamp(),
    factureToken: token,
    factureNumero: numeroFacture,
  });

  try {
    await sendFactureEmail({
      email: order.contact?.email,
      prenom: order.contact?.prenom,
      numeroFacture,
      numeroCommande: numero,
      totalTTC,
      url: `${SITE_URL}/facture.html?f=${token}`,
    });
  } catch (err) {
    console.error(`Facture ${numeroFacture} créée mais e-mail non envoyé :`, err);
  }
}

module.exports = { initAdmin, admin, SITE_URL, factureLignes, markOrderPaid };
