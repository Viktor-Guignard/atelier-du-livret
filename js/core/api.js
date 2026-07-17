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
 * Grille tarifaire — positionnement haut de gamme (grandes célébrations).
 * Toute la logique de prix vit ici : les pages ne calculent jamais elles-mêmes.
 */
export const TARIFS = {
  minQuantite: 20,
  base: { a5: 6.9, a6: 5.4 },              // €/exemplaire, 8 pages incluses
  pageSupp: 0.45,                          // €/exemplaire par page au-delà de 8
  papiers: {
    'classique':  { nom: 'Édition mate 135 g', coef: 1 },
    'creation':   { nom: 'Création ivoire 170 g', coef: 1.2 },
    'nacre':      { nom: 'Nacré grand luxe 250 g', coef: 1.45 },
  },
  options: {},                             // finitions optionnelles (dorure, coins…) — désactivées pour l'instant
  fraisCreation: 120,                      // mise en page personnalisée + BAT
  seuilFraisOfferts: 800,                  // frais de création offerts au-delà
  remises: [ [300, .88], [150, .92], [75, .96] ],   // [quantité mini, coefficient]
  validiteDevisJours: 30,
};

/**
 * Devis en ligne détaillé, TTC.
 * Renvoie { lignes: [{label, montant}], sousTotal, remisePct, fraisCreation,
 *           total, unitaire, quantite } — total/unitaire restent compatibles
 * avec l'atelier et les récapitulatifs existants.
 */
export function estimateOrder({ format = 'a5', papier = 'classique', quantite = 100, nbPages = 8, options = [] }) {
  quantite = Math.max(TARIFS.minQuantite, quantite || 0);
  const infoPapier = TARIFS.papiers[papier] ?? TARIFS.papiers.classique;
  const base = (TARIFS.base[format] ?? TARIFS.base.a5) * infoPapier.coef;
  const pagesSupp = Math.max(0, nbPages - 8);

  const lignes = [
    { label: `${quantite} livrets ${format.toUpperCase()} · ${infoPapier.nom} (8 pages)`, montant: base * quantite },
  ];
  if (pagesSupp > 0) {
    lignes.push({ label: `${pagesSupp} page${pagesSupp > 1 ? 's' : ''} supplémentaire${pagesSupp > 1 ? 's' : ''} × ${quantite} ex.`, montant: pagesSupp * TARIFS.pageSupp * quantite });
  }
  for (const opt of options) {
    const o = TARIFS.options[opt];
    if (o) lignes.push({ label: `${o.nom} × ${quantite} ex.`, montant: o.parEx * quantite });
  }

  let sousTotal = lignes.reduce((s, l) => s + l.montant, 0);
  const coefRemise = (TARIFS.remises.find(([min]) => quantite >= min) || [0, 1])[1];
  const remise = sousTotal * (1 - coefRemise);
  if (remise > 0) lignes.push({ label: `Remise volume (−${Math.round((1 - coefRemise) * 100)} %)`, montant: -remise });
  sousTotal -= remise;

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
    remisePct: Math.round((1 - coefRemise) * 100),
    fraisCreation,
    quantite,
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

/** Récapitulatif COURT, à votre usage (voie normale) : la commande est déjà en base. */
function orderBodyShort(payload, numero, adminUrl) {
  const { projet, contact, commande } = payload;
  const lignes = [
    RULE,
    `  ${payload.intent === 'devis' ? 'NOUVELLE DEMANDE DE DEVIS' : 'NOUVELLE COMMANDE'}`,
    RULE,
    '',
    `Numéro          ${numero}`,
    `Client          ${contact.prenom} ${contact.nom}`,
    `Contact         ${contact.email}${contact.telephone ? ' · ' + contact.telephone : ''}`,
    '',
    'PROJET',
    `  ${projet.nom}`,
    `  ${projet.pages.length} pages`,
    '',
    'IMPRESSION',
    `  Quantité       ${commande.quantite} exemplaires`,
    `  Format         ${(commande.format || 'a5').toUpperCase()} · ${TARIFS.papiers[commande.papier]?.nom || commande.papier}`,
    `  Montant TTC    ${commande.estimation.total.toFixed(2)} €`,
    commande.bat ? '  BAT numérique demandé avant impression' : null,
    '',
    adminUrl ? `${RULE}\nDossier complet & PDF d'impression → ${adminUrl}` : null,
  ].filter((l) => l !== null);
  return lignes.join('\n');
}

/** Message chaleureux destiné au CLIENT — à coller dans Formspree (Autoresponse) via {{message_client}}. */
function clientMessage(payload, numero) {
  const { projet, contact, commande } = payload;
  const lignes = [
    `Bonjour ${contact.prenom},`,
    '',
    payload.intent === 'devis'
      ? 'Nous avons bien reçu votre demande de devis — merci de votre confiance.'
      : 'Nous avons bien reçu votre commande — merci de votre confiance.',
    '',
    RULE,
    `  Votre livret          ${projet.nom}`,
    numero ? `  Numéro de suivi       ${numero}` : null,
    `  Quantité              ${commande.quantite} exemplaires`,
    `  Montant TTC           ${commande.estimation.total.toFixed(2)} €`,
    RULE,
    '',
    commande.bat
      ? 'Un bon à tirer (BAT) numérique vous sera envoyé avant toute impression : rien ne part sans votre validation.'
      : null,
    'Nous revenons vers vous sous 24 h ouvrées.',
    '',
    'À très bientôt,',
    'L\'Atelier du Livret',
  ].filter((l) => l !== null);
  return lignes.join('\n');
}

/** Récapitulatif COMPLET, à votre usage (voie de secours, si l'enregistrement en base a échoué). */
function orderBodyFull(payload) {
  const { projet, contact, commande, message } = payload;
  const lignes = [
    RULE,
    `  ${payload.intent === 'devis' ? 'DEMANDE DE DEVIS' : 'DEMANDE DE COMMANDE'}`,
    RULE,
    '',
    '⚠ L\'enregistrement dans l\'espace privé a échoué : ce message contient donc le dossier complet en secours.',
    '',
    `Projet : ${projet.nom} (réf. ${projet.id})`,
    `Modèle : ${projet.modeleId} — cérémonie : ${projet.categorieId}`,
    `Pages : ${projet.pages.length}`,
    projet.fields?.date ? `Date de la cérémonie : ${formatDateFr(projet.fields.date)}` : null,
    projet.fields?.lieu ? `Lieu : ${projet.fields.lieu}${projet.fields.ville ? ', ' + projet.fields.ville : ''}` : null,
    '',
    commande.devisNumero ? `Devis en ligne : ${commande.devisNumero}` : null,
    `Quantité : ${commande.quantite} exemplaires`,
    `Format : ${commande.format.toUpperCase()} — papier : ${TARIFS.papiers[commande.papier]?.nom || commande.papier}`,
    commande.options?.length ? `Finitions : ${commande.options.map((o) => TARIFS.options[o]?.nom || o).join(', ')}` : null,
    `Montant du devis : ${commande.estimation.total.toFixed(2)} € TTC (${commande.estimation.unitaire.toFixed(2)} €/ex.)`,
    `BAT numérique avant impression : ${commande.bat ? 'oui' : 'non'}`,
    '',
    `Contact : ${contact.prenom} ${contact.nom}`,
    `E-mail : ${contact.email}`,
    contact.telephone ? `Téléphone : ${contact.telephone}` : null,
    '',
    message ? `Informations complémentaires :\n${message}` : null,
    '',
    '— Le projet complet (JSON) figure plus bas dans ce message : copiez-le dans atelier.html pour préparer l\'impression. —',
  ].filter((l) => l !== null);
  return lignes.join('\n');
}

function orderFileName(projet) {
  return `commande-${(projet.nom || 'livret').toLowerCase().replace(/[^a-z0-9]+/gi, '-')}.json`;
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
  const subjectAtelier = numero
    ? `${type} ${numero} — ${payload.projet.nom} (${payload.commande.quantite} ex.)`
    : `${type} — ${payload.projet.nom} (${payload.commande.quantite} ex.)`;
  const messageAtelier = numero ? orderBodyShort(payload, numero, adminUrl) : orderBodyFull(payload);

  try {
    // 1. Notification à l'atelier (réponse → e-mail du client).
    await sendEmail({
      to_email: CONTACT_EMAIL,
      reply_to: payload.contact.email,
      subject: subjectAtelier,
      message: messageAtelier,
    });
    // 2. Accusé de réception au client (réponse → atelier).
    await sendEmail({
      to_email: payload.contact.email,
      reply_to: CONTACT_EMAIL,
      subject: `${payload.intent === 'devis' ? 'Votre demande de devis' : 'Votre commande'} — L'Atelier du Livret`,
      message: clientMessage(payload, numero),
    });
    return { ok: true, method: 'emailjs' };
  } catch (err) {
    console.error('Envoi EmailJS impossible, repli mailto :', err);
    const mailto = `mailto:${CONTACT_EMAIL}`
      + `?subject=${encodeURIComponent(subjectAtelier)}`
      + `&body=${encodeURIComponent(messageAtelier)}`;
    return { ok: true, method: 'mailto', mailto };
  }
}

/**
 * Prévient l'atelier qu'un client vient de valider son bon à tirer en ligne.
 * Envoi silencieux (best-effort) ; n'interrompt jamais le parcours client.
 */
export async function notifyBatValidated({ numero, nom, adminUrl }) {
  const message = [
    RULE,
    '  BON À TIRER VALIDÉ PAR LE CLIENT',
    RULE,
    '',
    numero ? `Commande : ${numero}` : null,
    `Validé par : ${nom || '(nom non précisé)'}`,
    '',
    'Vous pouvez lancer l\'impression.',
    adminUrl ? `\nEspace privé → ${adminUrl}` : null,
  ].filter((l) => l !== null).join('\n');
  try {
    await sendEmail({
      to_email: CONTACT_EMAIL,
      subject: `BAT validé${numero ? ' — ' + numero : ''} — L'Atelier du Livret`,
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
    'L\'Atelier du Livret',
  ].filter((l) => l !== null).join('\n');
  try {
    await sendEmail({
      to_email: email,
      reply_to: CONTACT_EMAIL,
      subject: 'Bon à tirer validé — L\'Atelier du Livret',
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
  const data = {
    type: 'commande-atelier-livret',
    version: 1,
    creeLe: new Date().toISOString(),
    intent: payload.intent,
    contact: payload.contact,
    commande: payload.commande,
    message: payload.message,
    projet: payload.projet,
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = orderFileName(payload.projet);
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
