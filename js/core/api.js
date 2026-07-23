/*
 * Couche d'envoi de commande — seule frontière avec l'extérieur.
 * Envoi des e-mails via EmailJS (client-side, gratuit 200 e-mails/mois) : à
 * chaque commande, DEUX e-mails partent — la notification à l'atelier ET
 * l'accusé de réception au client. Repli sur un e-mail pré-rempli (mailto)
 * si EmailJS échoue. Aucun serveur : compatible GitHub Pages.
 */

import emailjs from 'https://cdn.jsdelivr.net/npm/@emailjs/browser@4/+esm';
import { formatDateFr } from './utils.js';

export const CONTACT_EMAIL = 'viktor.guignard@gmail.com';

/*
 * Émetteur des factures : Imprigraphic (décision Viktor — la société encaisse
 * via Stripe et facture). Mentions reprises du devis n°0726-052812.
 */
export const FACTURE_EMETTEUR = {
  nom: 'ImpriGraphic',
  soustitre: 'De la création à l\'impression — service « Livrets de messe »',
  adresse: '9-13, rue de la Folie Regnault, 75011 Paris',
  tel: '01 44 93 26 30',
  email: 'contact@imprigraphic.fr',
  mentions: 'S.A.S au capital de 115 000 € · R.C. Paris B 319 772 695 · Siret 319 772 695 00031 · APE 1812 Z',
  tva: 'TVA intracommunautaire : FR 28319772695',
};

/*
 * EmailJS — identifiants publics (conçus pour être visibles côté client, comme
 * Firebase). Service Gmail connecté à CONTACT_EMAIL + un template générique
 * piloté par les variables to_email / reply_to / subject / message.
 * Pour changer de compte : remplacer ces trois valeurs.
 */
const EMAILJS = {
  publicKey: 'MwzwkkXRyTFfXZy_f',
  serviceId: 'service_r8cydnk',
  templateId: 'template_90sttdl',
};

/** Envoie un e-mail via le template générique EmailJS. Rejette si l'envoi échoue. */
async function sendEmail({ to_email, reply_to, subject, message }) {
  return emailjs.send(
    EMAILJS.serviceId,
    EMAILJS.templateId,
    { to_email, reply_to: reply_to || CONTACT_EMAIL, subject, message },
    { publicKey: EMAILJS.publicKey },
  );
}

/*
 * Grille tarifaire — CALÉE SUR LE DEVIS IMPRIGRAPHIC n°0726-052812 (20/07/2026) :
 * livrets A5 (14,8 × 21 à la française), quadri R°/V°, piqûre métal 2 points,
 * couverture 4 pages 250 g rainée. Un livret s'imprime en CAHIERS : le nombre
 * total de pages est toujours un MULTIPLE DE 4 (minimum 12 = cahier 8 p. +
 * couverture 4 p.). Prix de vente = coût réel TTC × MARGE + frais de création.
 * Toute la logique de prix vit ici : les pages ne calculent jamais elles-mêmes.
 */

/*
 * Coûts TTC Imprigraphic par palier de quantité (50 → 300 ex.), pour un livret
 * 12 pages et 16 pages. Entre les paliers : interpolation linéaire ; au-delà de
 * 300 ex. et de 16 pages : extrapolation (pente du dernier palier / +4 pages).
 * NB : « couché 16 pages » n'est pas au devis — estimé par le ratio 16/12 du
 * papier création (à recaler quand Imprigraphic fournira le chiffre exact).
 */
const QTE_PALIERS = [50, 100, 150, 200, 250, 300];
const COUTS_TTC = {
  couche:   { p12: [216, 264, 312, 360, 408, 456], p16: [246, 289, 369, 429, 499, 550] },
  creation: { p12: [264, 384, 456, 564, 648, 756], p16: [300, 420, 540, 672, 792, 912] },
};

export const TARIFS = {
  minQuantite: 50,                         // 1er palier du devis Imprigraphic
  marge: 1.8,                              // prix client = coût TTC × marge
  papiers: {
    'couche':   { nom: 'Couché demi-mat 150 g — Condat Silk' },
    'creation': { nom: 'Création 160 g Premium White — Old Mill' },
  },
  options: {},                             // finitions optionnelles — désactivées pour l'instant
  fraisCreation: 120,                      // mise en page personnalisée + BAT
  seuilFraisOfferts: 800,                  // frais de création offerts au-delà
  validiteDevisJours: 30,
};

/* Les anciens identifiants de papier (paniers/commandes déjà enregistrés) sont
   rabattus sur les papiers réels du devis. */
const PAPIER_ALIAS = { classique: 'couche', nacre: 'creation' };
export const papierId = (id) => (TARIFS.papiers[id] ? id : (PAPIER_ALIAS[id] || 'couche'));

/** Nombre de pages réellement imprimées : multiple de 4, minimum 12. */
export function pagesImprimees(nbPages) {
  return Math.max(12, Math.ceil((nbPages || 0) / 4) * 4);
}

/** Interpolation linéaire du coût sur la grille quantités. */
function coutPalier(grille, quantite) {
  const q = Math.max(QTE_PALIERS[0], quantite);
  const last = QTE_PALIERS.length - 1;
  if (q >= QTE_PALIERS[last]) {
    // Au-delà de 300 ex. : pente du dernier segment (€ / exemplaire).
    const pente = (grille[last] - grille[last - 1]) / (QTE_PALIERS[last] - QTE_PALIERS[last - 1]);
    return grille[last] + (q - QTE_PALIERS[last]) * pente;
  }
  const i = QTE_PALIERS.findIndex((p, j) => q >= p && q <= QTE_PALIERS[j + 1]);
  const t = (q - QTE_PALIERS[i]) / (QTE_PALIERS[i + 1] - QTE_PALIERS[i]);
  return grille[i] + t * (grille[i + 1] - grille[i]);
}

/** Coût TTC Imprigraphic pour (papier, pages imprimées, quantité). */
function coutTTC(papier, pages, quantite) {
  const g = COUTS_TTC[papierId(papier)];
  const c12 = coutPalier(g.p12, quantite);
  const c16 = coutPalier(g.p16, quantite);
  const deltaPar4 = c16 - c12;                       // coût d'un cahier de 4 pages en plus
  return c12 + Math.max(0, (pages - 12) / 4) * deltaPar4;
}

/**
 * Devis en ligne détaillé, TTC — le client voit le prix se recalculer à chaque
 * choix (papier, quantité, pages). Renvoie { lignes, sousTotal, fraisCreation,
 * total, unitaire, quantite, pagesFacturees, pagesBlanches } — total/unitaire
 * restent compatibles avec l'atelier et les récapitulatifs existants.
 */
export function estimateOrder({ papier = 'couche', quantite = 100, nbPages = 12, options = [] } = {}) {
  quantite = Math.max(TARIFS.minQuantite, quantite || 0);
  const idPapier = papierId(papier);
  const infoPapier = TARIFS.papiers[idPapier];
  const pagesFacturees = pagesImprimees(nbPages);
  const pagesBlanches = Math.max(0, pagesFacturees - (nbPages || 0));

  const lignes = [{
    label: `${quantite} livrets A5 · ${pagesFacturees} pages · ${infoPapier.nom}`
      + ` · couverture 250 g · piqûre métal`,
    montant: coutTTC(idPapier, pagesFacturees, quantite) * TARIFS.marge,
  }];
  for (const opt of options) {
    const o = TARIFS.options[opt];
    if (o) lignes.push({ label: `${o.nom} × ${quantite} ex.`, montant: o.parEx * quantite });
  }

  const sousTotal = lignes.reduce((s, l) => s + l.montant, 0);
  const fraisCreation = sousTotal >= TARIFS.seuilFraisOfferts ? 0 : TARIFS.fraisCreation;
  lignes.push({
    label: fraisCreation === 0
      ? 'Création personnalisée & BAT — offerts'
      : 'Création personnalisée & BAT',
    montant: fraisCreation,
  });

  const total = Math.round((sousTotal + fraisCreation) * 100) / 100;
  return {
    lignes: lignes.map((l) => ({ label: l.label, montant: Math.round(l.montant * 100) / 100 })),
    sousTotal: Math.round(sousTotal * 100) / 100,
    remisePct: 0,                          // remises volume désormais intégrées à la grille
    fraisCreation,
    quantite,
    pagesFacturees,
    pagesBlanches,
    total,
    unitaire: Math.round((total / quantite) * 100) / 100,
  };
}

/** Numéro de devis lisible, généré côté client. */
export function devisNumber() {
  const d = new Date();
  const ymd = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
  return `DEV-${ymd}-${String(Math.floor(Math.random() * 900) + 100)}`;
}

const RULE = '─'.repeat(38);

/* --- Helpers multi-livrets (une commande = un panier de livrets) --- */

/** Liste des livrets de la commande (compat mono-livret des anciennes commandes). */
function orderItems(payload) {
  if (Array.isArray(payload.items) && payload.items.length) return payload.items;
  if (payload.projet) return [{ projet: payload.projet, commande: payload.commande || {} }];
  return [];
}
/** Montant total TTC de la commande. */
function orderTotal(payload) {
  if (typeof payload.montantTotal === 'number') return payload.montantTotal;
  return Math.round(orderItems(payload).reduce((s, it) => s + (it.commande?.estimation?.total || 0), 0) * 100) / 100;
}
const papierNom = (id) => TARIFS.papiers[id]?.nom || id;

/** Récapitulatif COURT, à votre usage (voie normale) : la commande est déjà en base. */
function orderBodyShort(payload, numero, adminUrl) {
  const { contact } = payload;
  const items = orderItems(payload);
  const lignes = [
    RULE,
    `  ${payload.intent === 'devis' ? 'NOUVELLE DEMANDE DE DEVIS' : 'NOUVELLE COMMANDE'}`,
    RULE,
    '',
    `Numéro          ${numero}`,
    `Client          ${contact.prenom} ${contact.nom}`,
    `Contact         ${contact.email}${contact.telephone ? ' · ' + contact.telephone : ''}`,
    '',
    `${items.length} livret${items.length > 1 ? 's' : ''} commandé${items.length > 1 ? 's' : ''} :`,
  ];
  items.forEach((it, i) => {
    const c = it.commande || {};
    lignes.push(
      `  ${i + 1}. ${it.projet?.nom || 'Livret'} — ${it.projet?.pages?.length || '?'} pages`,
      `      ${c.quantite} ex. · ${(c.format || 'a5').toUpperCase()} · ${papierNom(c.papier)}${c.bat ? ' · BAT' : ''} · ${(c.estimation?.total ?? 0).toFixed(2)} € TTC`,
    );
  });
  lignes.push('', `MONTANT TOTAL TTC   ${orderTotal(payload).toFixed(2)} €`, '');
  if (adminUrl) lignes.push(`${RULE}\nDossier complet & BAT/PDF par livret → ${adminUrl}`);
  return lignes.filter((l) => l !== null).join('\n');
}

/** Message chaleureux destiné au CLIENT — à coller dans Formspree (Autoresponse) via {{message_client}}. */
function clientMessage(payload, numero) {
  const { contact } = payload;
  const items = orderItems(payload);
  const lignes = [
    `Bonjour ${contact.prenom},`,
    '',
    payload.intent === 'devis'
      ? 'Nous avons bien reçu votre demande de devis — merci de votre confiance.'
      : 'Nous avons bien reçu votre commande — merci de votre confiance.',
    '',
    RULE,
    numero ? `  Numéro de suivi   ${numero}` : null,
    `  ${items.length} livret${items.length > 1 ? 's' : ''} :`,
  ];
  items.forEach((it) => {
    const c = it.commande || {};
    lignes.push(`   • ${it.projet?.nom || 'Livret'} — ${c.quantite} ex. (${(c.estimation?.total ?? 0).toFixed(2)} €)`);
  });
  lignes.push(
    `  Montant total TTC ${orderTotal(payload).toFixed(2)} €`,
    RULE,
    '',
    items.some((it) => it.commande?.bat)
      ? 'Un bon à tirer (BAT) numérique vous sera envoyé pour chaque livret avant toute impression : rien ne part sans votre validation.'
      : null,
    'Nous revenons vers vous sous 24 h ouvrées.',
    '',
    'À très bientôt,',
    'Livrets de messe · créé par VIKTO LABS · imaginé et imprimé par Imprigraphic',
  );
  return lignes.filter((l) => l !== null).join('\n');
}

/** Récapitulatif COMPLET, à votre usage (voie de secours, si l'enregistrement en base a échoué). */
function orderBodyFull(payload) {
  const { contact, message } = payload;
  const items = orderItems(payload);
  const lignes = [
    RULE,
    `  ${payload.intent === 'devis' ? 'DEMANDE DE DEVIS' : 'DEMANDE DE COMMANDE'}`,
    RULE,
    '',
    '⚠ L\'enregistrement dans l\'espace privé a échoué : ce message contient donc le dossier complet en secours.',
    '',
    `Contact : ${contact.prenom} ${contact.nom}`,
    `E-mail : ${contact.email}`,
    contact.telephone ? `Téléphone : ${contact.telephone}` : null,
    '',
    `${items.length} livret${items.length > 1 ? 's' : ''} :`,
  ];
  items.forEach((it, i) => {
    const p = it.projet || {};
    const c = it.commande || {};
    lignes.push(
      '',
      `— Livret ${i + 1} —`,
      `Projet : ${p.nom} (réf. ${p.id})`,
      `Modèle : ${p.modeleId} — cérémonie : ${p.categorieId} — ${p.pages?.length || '?'} pages`,
      p.fields?.date ? `Date : ${formatDateFr(p.fields.date)}` : null,
      p.fields?.lieu ? `Lieu : ${p.fields.lieu}${p.fields.ville ? ', ' + p.fields.ville : ''}` : null,
      `Quantité : ${c.quantite} ex. · Format ${(c.format || 'a5').toUpperCase()} · ${papierNom(c.papier)}`,
      `BAT avant impression : ${c.bat ? 'oui' : 'non'}`,
      `Montant : ${(c.estimation?.total ?? 0).toFixed(2)} € TTC`,
    );
  });
  lignes.push(
    '',
    RULE,
    `MONTANT TOTAL TTC : ${orderTotal(payload).toFixed(2)} €`,
    payload.devisNumero ? `Devis en ligne : ${payload.devisNumero}` : null,
    RULE,
    '',
    message ? `Informations complémentaires :\n${message}` : null,
    '',
    '— Le dossier complet (JSON) vient d\'être téléchargé sur votre appareil : copiez son contenu dans atelier.html pour préparer l\'impression. —',
  );
  return lignes.filter((l) => l !== null).join('\n');
}

function orderFileName(projet) {
  return `commande-${((projet?.nom) || 'livret').toLowerCase().replace(/[^a-z0-9]+/gi, '-')}.json`;
}

/**
 * Envoie la demande de commande. DEUX e-mails via EmailJS :
 *  1. À l'ATELIER (CONTACT_EMAIL) — récapitulatif court si la commande est en
 *     base (numero fourni), complet en secours sinon.
 *  2. Au CLIENT — accusé de réception personnalisé.
 * Si EmailJS échoue (réseau, quota), repli sur un e-mail pré-rempli (mailto)
 * vers l'atelier, pour ne jamais perdre la demande.
 * Retourne { ok, method: 'emailjs' | 'mailto', mailto? }.
 */
export async function submitOrder(payload, { numero, adminUrl } = {}) {
  const type = payload.intent === 'devis' ? 'Demande de devis' : 'Demande de commande';
  const nb = orderItems(payload).length;
  const resume = `${nb} livret${nb > 1 ? 's' : ''} · ${orderTotal(payload).toFixed(2)} €`;
  const subjectAtelier = numero ? `${type} ${numero} — ${resume}` : `${type} — ${resume}`;
  const messageAtelier = numero ? orderBodyShort(payload, numero, adminUrl) : orderBodyFull(payload);

  // 1. Notification à l'ATELIER — c'est l'envoi CRITIQUE. Si LUI échoue, on
  //    bascule sur un e-mail pré-rempli (mailto) pour ne jamais perdre la demande.
  try {
    await sendEmail({
      to_email: CONTACT_EMAIL,
      reply_to: payload.contact.email,
      subject: subjectAtelier,
      message: messageAtelier,
    });
  } catch (err) {
    console.error('Envoi EmailJS (atelier) impossible, repli mailto :', err);
    const mailto = `mailto:${CONTACT_EMAIL}`
      + `?subject=${encodeURIComponent(subjectAtelier)}`
      + `&body=${encodeURIComponent(messageAtelier)}`;
    return { ok: true, method: 'mailto', mailto };
  }

  // 2. Accusé de réception au CLIENT — best-effort : un échec ici (quota,
  //    adresse rejetée par le service) ne doit PAS rejouer tout le flux : la
  //    commande est déjà transmise à l'atelier (et enregistrée en base).
  try {
    await sendEmail({
      to_email: payload.contact.email,
      reply_to: CONTACT_EMAIL,
      subject: `${payload.intent === 'devis' ? 'Votre demande de devis' : 'Votre commande'} — Livrets de messe`,
      message: clientMessage(payload, numero),
    });
  } catch (err) {
    console.warn('Accusé de réception client non envoyé (best-effort) :', err);
  }
  return { ok: true, method: 'emailjs' };
}

/**
 * Envoie au CLIENT sa facture (lien sécurisé par jeton, PDF téléchargeable sur
 * la page). Appelé depuis l'admin après « Marquer payée ». Rejette si échec,
 * pour que l'admin puisse signaler et réessayer.
 */
export async function sendFactureToClient({ email, prenom, numeroFacture, numeroCommande, montantTTC, url }) {
  const message = [
    `Bonjour ${(prenom || '').trim()},`.replace(' ,', ','),
    '',
    'Merci pour votre règlement — voici votre facture.',
    '',
    RULE,
    `  Facture               ${numeroFacture}`,
    numeroCommande ? `  Commande              ${numeroCommande}` : null,
    `  Montant réglé TTC     ${montantTTC.toFixed(2)} €`,
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
  return sendEmail({
    to_email: email,
    reply_to: CONTACT_EMAIL,
    subject: `Votre facture ${numeroFacture} — Livrets de messe`,
    message,
  });
}

/**
 * Prévient l'atelier qu'un client vient de valider son bon à tirer en ligne.
 * Envoi silencieux (best-effort) ; n'interrompt jamais le parcours client.
 */
export async function notifyBatValidated({ numero, nom, appareil, lieu, adminUrl }) {
  const message = [
    RULE,
    '  BON À TIRER VALIDÉ PAR LE CLIENT',
    RULE,
    '',
    numero ? `Commande : ${numero}` : null,
    `Validé par : ${nom || '(nom non précisé)'}`,
    appareil ? `Appareil : ${appareil}` : null,
    lieu ? `Lieu (approx.) : ${lieu}` : null,
    '',
    'Vous pouvez lancer l\'impression.',
    adminUrl ? `\nEspace privé → ${adminUrl}` : null,
  ].filter((l) => l !== null).join('\n');
  try {
    await sendEmail({
      to_email: CONTACT_EMAIL,
      subject: `BAT validé${numero ? ' — ' + numero : ''} — Livrets de messe`,
      message,
    });
    return { ok: true, method: 'emailjs' };
  } catch {
    return { ok: false, method: 'none' };
  }
}

/**
 * Accusé de validation envoyé AU CLIENT après qu'il a validé son bon à tirer
 * (sa preuve à lui). Best-effort ; sans e-mail connu, ne fait rien.
 */
export async function confirmBatToClient({ email, prenom, numero }) {
  if (!email) return { ok: false, method: 'none' };
  const message = [
    `Bonjour ${(prenom || '').trim()},`.replace(' ,', ','),
    '',
    'Merci — vous venez de valider votre bon à tirer.',
    numero ? `Commande : ${numero}` : null,
    '',
    'Votre livret part maintenant à l\'impression, exactement tel que vous l\'avez validé.',
    'Nous revenons vers vous pour la livraison.',
    '',
    'À très bientôt,',
    'Livrets de messe · créé par VIKTO LABS · imaginé et imprimé par Imprigraphic',
  ].filter((l) => l !== null).join('\n');
  try {
    await sendEmail({
      to_email: email,
      reply_to: CONTACT_EMAIL,
      subject: 'Bon à tirer validé — Livrets de messe',
      message,
    });
    return { ok: true, method: 'emailjs' };
  } catch {
    return { ok: false, method: 'none' };
  }
}

/**
 * Fichier de commande complet (contact + fabrication + projet) : la copie du
 * client, et le fichier que l'atelier charge dans atelier.html pour produire
 * le PDF d'impression (traits de coupe, fond perdu, sans filigrane).
 */
export function downloadOrderJSON(payload) {
  const items = orderItems(payload);
  const data = {
    type: 'commande-atelier-livret',
    version: 2,
    creeLe: new Date().toISOString(),
    intent: payload.intent,
    contact: payload.contact,
    devisNumero: payload.devisNumero || null,
    montantTotal: orderTotal(payload),
    message: payload.message,
    items,
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = orderFileName(items[0]?.projet);
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

/** Export du projet en fichier .json (sauvegarde locale / pièce jointe). */
export function downloadProjectJSON(projet) {
  const blob = new Blob([JSON.stringify(projet, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `livret-${(projet.nom || 'projet').toLowerCase().replace(/[^a-z0-9]+/gi, '-')}.json`;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}
