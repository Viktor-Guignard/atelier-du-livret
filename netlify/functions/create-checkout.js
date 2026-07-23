/*
 * POST /.netlify/functions/create-checkout
 * Appelée depuis l'admin (bouton « Générer le lien de paiement »). Auth par
 * jeton Firebase (Authorization: Bearer <idToken>) — seul un compte connecté
 * à l'espace privé peut générer un lien. Reconstruit le panier exact de la
 * commande et crée une session Stripe Checkout.
 */

const Stripe = require('stripe');
const { initAdmin, factureLignes } = require('./_shared');

const ALLOWED_ORIGIN = 'https://livretsdemesse.fr';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
  'Access-Control-Allow-Headers': 'Authorization, Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: CORS_HEADERS, body: '' };
  if (event.httpMethod !== 'POST') return { statusCode: 405, headers: CORS_HEADERS, body: 'Method not allowed' };

  const app = initAdmin();
  const admin = require('firebase-admin');

  const authHeader = event.headers.authorization || event.headers.Authorization || '';
  const idToken = authHeader.replace(/^Bearer\s+/i, '');
  if (!idToken) return { statusCode: 401, headers: CORS_HEADERS, body: 'Non authentifié.' };
  try {
    await admin.auth(app).verifyIdToken(idToken);
  } catch {
    return { statusCode: 401, headers: CORS_HEADERS, body: 'Jeton invalide.' };
  }

  let numero;
  try { ({ numero } = JSON.parse(event.body || '{}')); } catch { /* body vide */ }
  if (!numero) return { statusCode: 400, headers: CORS_HEADERS, body: 'Numéro de commande manquant.' };

  const db = admin.firestore(app);
  const snap = await db.collection('commandes').where('numero', '==', numero).limit(1).get();
  if (snap.empty) return { statusCode: 404, headers: CORS_HEADERS, body: 'Commande introuvable.' };
  const orderDoc = snap.docs[0];
  const order = orderDoc.data();

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
