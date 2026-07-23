/*
 * POST /.netlify/functions/stripe-webhook
 * Appelée directement par Stripe (URL à coller dans le dashboard Stripe →
 * Développeurs → Webhooks). Vérifie la signature, puis marque la commande
 * payée + crée et envoie la facture — sans passer par l'admin.
 */

const Stripe = require('stripe');
const { initAdmin, markOrderPaid } = require('./_shared');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method not allowed' };

  const app = initAdmin();
  const admin = require('firebase-admin');
  const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

  const sig = event.headers['stripe-signature'];
  const raw = event.isBase64Encoded ? Buffer.from(event.body, 'base64') : event.body;

  let stripeEvent;
  try {
    stripeEvent = stripe.webhooks.constructEvent(raw, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Signature webhook Stripe invalide :', err.message);
    return { statusCode: 400, body: `Webhook Error: ${err.message}` };
  }

  if (stripeEvent.type === 'checkout.session.completed') {
    const session = stripeEvent.data.object;
    const numero = session.metadata?.numero;
    if (numero) {
      try {
        await markOrderPaid(admin.firestore(app), numero, session);
      } catch (err) {
        console.error('Échec markOrderPaid :', err);
      }
    }
  }

  return { statusCode: 200, body: JSON.stringify({ received: true }) };
};
