/*
 * POST /.netlify/functions/create-checkout-public
 * Version PUBLIQUE (aucune authentification) de create-checkout : appelée
 * directement depuis le tunnel de commande (commande.js) juste après
 * l'enregistrement de la commande, pour que le client puisse payer
 * immédiatement s'il le souhaite — puis à nouveau depuis bat.js, une fois le
 * bon à tirer validé, s'il n'a pas payé tout de suite.
 *
 * Volontairement limitée : refuse les devis (intent='devis', pas encore de
 * montant ferme) et les commandes déjà payées. Ne renvoie que l'URL Stripe —
 * aucune donnée privée de la commande n'est exposée à l'appelant.
 */

const Stripe = require('stripe');
const { initAdmin, factureLignes } = require('./_shared');

const ALLOWED_ORIGIN = 'https://livretsdemesse.fr';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: CORS_HEADERS, body: '' };
  if (event.httpMethod !== 'POST') return { statusCode: 405, headers: CORS_HEADERS, body: 'Method not allowed' };

  const app = initAdmin();
  const admin = require('firebase-admin');

  let numero;
  try { ({ numero } = JSON.parse(event.body || '{}')); } catch { /* body vide */ }
  if (!numero) return { statusCode: 400, headers: CORS_HEADERS, body: 'Numéro de commande manquant.' };

  const db = admin.firestore(app);
  const snap = await db.collection('commandes').where('numero', '==', numero).limit(1).get();
  if (snap.empty) return { statusCode: 404, headers: CORS_HEADERS, body: 'Commande introuvable.' };
  const orderDoc = snap.docs[0];
  const order = orderDoc.data();

  if (order.intent === 'devis') return { statusCode: 422, headers: CORS_HEADERS, body: 'Un devis n\'a pas de montant ferme à payer.' };
  if (order.paiementStatut === 'payee') return { statusCode: 409, headers: CORS_HEADERS, body: 'Commande déjà payée.' };

  const { lignes, totalTTC } = factureLignes(order);
  if (!lignes.length || totalTTC <= 0) return { statusCode: 422, headers: CORS_HEADERS, body: 'Montant de commande invalide.' };

  const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
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
    success_url: `https://livretsdemesse.fr/commande.html?paiement=ok&numero=${encodeURIComponent(numero)}`,
    cancel_url: `https://livretsdemesse.fr/commande.html?paiement=annule&numero=${encodeURIComponent(numero)}`,
  });

  await orderDoc.ref.update({
    paiementLien: session.url,
    paiementSessionId: session.id,
    paiementStatut: order.paiementStatut || 'en_attente',
  });

  return {
    statusCode: 200,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    body: JSON.stringify({ url: session.url }),
  };
};
