/*
 * Cloud Functions — pont entre le panier (Firestore) et Stripe.
 *
 *  - createCheckoutSession : appelée depuis l'admin (Firebase Auth requis).
 *    Lit la commande dans Firestore, reconstruit les lignes exactement comme
 *    l'admin les affiche (voir factureLignes, dupliqué de js/pages/admin.js —
 *    à garder synchronisé si la logique de facturation change côté site) et
 *    crée une session Stripe Checkout avec le VRAI panier (un livret = une
 *    ligne). Le lien généré est enregistré sur la commande (paiementLien),
 *    exactement comme le lien collé à la main aujourd'hui — rien d'autre ne
 *    change côté admin.js.
 *
 *  - stripeWebhook : appelée par Stripe dès qu'un paiement passe
 *    (checkout.session.completed). Marque la commande payée, crée la facture
 *    et l'envoie au client — sans action manuelle dans l'admin. Idempotente
 *    (Stripe peut livrer le même événement plusieurs fois).
 *
 * Secrets requis (voir functions/README.md) : STRIPE_SECRET_KEY,
 * STRIPE_WEBHOOK_SECRET. Le reste (EmailJS, config Firebase) est public par
 * conception, comme dans le reste du site.
 */

const { onCall, onRequest, HttpsError } = require('firebase-functions/v2/https');
const { defineSecret } = require('firebase-functions/params');
const { setGlobalOptions } = require('firebase-functions/v2');
const admin = require('firebase-admin');
const crypto = require('crypto');

admin.initializeApp();
const db = admin.firestore();

setGlobalOptions({ region: 'europe-west1' });

const stripeSecretKey = defineSecret('STRIPE_SECRET_KEY');
const stripeWebhookSecret = defineSecret('STRIPE_WEBHOOK_SECRET');

const SITE_URL = 'https://livretsdemesse.fr';
const CONTACT_EMAIL = 'viktor.guignard@gmail.com';
// Identifiants publics EmailJS — mêmes valeurs que js/core/api.js (EMAILJS).
const EMAILJS = {
  publicKey: 'MwzwkkXRyTFfXZy_f',
  serviceId: 'service_r8cydnk',
  templateId: 'template_90sttdl',
};

/* ---------------- Helpers communs (repris de js/pages/admin.js & firebase.js) ---------------- */

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
  const bytes = crypto.randomBytes(len);
  return Array.from(bytes, (b) => chars[b % chars.length]).join('');
}

async function nextFactureNumber() {
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

/* ---------------- 1. Créer la session de paiement (appelée depuis l'admin) ---------------- */

exports.createCheckoutSession = onCall({ secrets: [stripeSecretKey] }, async (request) => {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Connexion à l\'espace privé requise.');

  const numero = request.data?.numero;
  if (!numero) throw new HttpsError('invalid-argument', 'Numéro de commande manquant.');

  const snap = await db.collection('commandes').where('numero', '==', numero).limit(1).get();
  if (snap.empty) throw new HttpsError('not-found', 'Commande introuvable.');
  const orderDoc = snap.docs[0];
  const order = orderDoc.data();

  const { lignes, totalTTC } = factureLignes(order);
  if (!lignes.length || totalTTC <= 0) throw new HttpsError('failed-precondition', 'Montant de commande invalide.');

  const stripe = require('stripe')(stripeSecretKey.value());
  const line_items = lignes.map((l) => ({
    price_data: {
      currency: 'eur',
      product_data: { name: l.label.slice(0, 500) },
      unit_amount: Math.round(l.ttc * 100),
    },
    quantity: 1,
  }));

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    line_items,
    customer_email: order.contact?.email || undefined,
    metadata: { numero, commandeId: orderDoc.id },
    success_url: `${SITE_URL}/commande.html?paiement=ok&numero=${encodeURIComponent(numero)}`,
    cancel_url: `${SITE_URL}/commande.html?paiement=annule&numero=${encodeURIComponent(numero)}`,
  });

  await orderDoc.ref.update({
    paiementLien: session.url,
    paiementSessionId: session.id,
    paiementStatut: order.paiementStatut || 'en_attente',
  });

  return { url: session.url };
});

/* ---------------- 2. Webhook Stripe : paiement confirmé → facture auto ---------------- */

async function markOrderPaid(numero, session) {
  const snap = await db.collection('commandes').where('numero', '==', numero).limit(1).get();
  if (snap.empty) { console.warn(`Webhook : commande ${numero} introuvable.`); return; }
  const orderDoc = snap.docs[0];
  const order = orderDoc.data();
  if (order.paiementStatut === 'payee') return; // idempotent — Stripe peut renvoyer l'événement

  const { lignes, totalTTC } = factureLignes(order);
  const token = randomToken();
  const numeroFacture = await nextFactureNumber();
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
    // La facture existe et la commande est marquée payée dans tous les cas :
    // un échec d'e-mail se rattrape depuis l'admin (le lien de facture y est visible).
    console.error(`Facture ${numeroFacture} créée mais e-mail non envoyé :`, err);
  }
}

exports.stripeWebhook = onRequest({ secrets: [stripeSecretKey, stripeWebhookSecret] }, async (req, res) => {
  const stripe = require('stripe')(stripeSecretKey.value());
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.rawBody, req.headers['stripe-signature'], stripeWebhookSecret.value());
  } catch (err) {
    console.error('Signature webhook Stripe invalide :', err.message);
    res.status(400).send(`Webhook Error: ${err.message}`);
    return;
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const numero = session.metadata?.numero;
    if (numero) {
      try { await markOrderPaid(numero, session); } catch (err) { console.error('Échec markOrderPaid :', err); }
    }
  }

  res.json({ received: true });
});
