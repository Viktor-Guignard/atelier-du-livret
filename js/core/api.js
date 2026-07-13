/*
 * Couche d'envoi de commande — seule frontière avec l'extérieur.
 * Aujourd'hui (site statique GitHub Pages) : récapitulatif par e-mail (mailto)
 * + export du projet en JSON à joindre.
 * Demain : remplacer submitOrder() par un POST vers une API (panier, Stripe/
 * PayPal, espace client) sans toucher au reste du site.
 */

import { formatDateFr } from './utils.js';

export const CONTACT_EMAIL = 'viktor.guignard@gmail.com';

/*
 * COMMANDES RÉELLES — endpoint d'envoi (recommandé : Formspree, gratuit).
 * 1. Créez un formulaire sur https://formspree.io (2 min) avec votre adresse
 *    de réception, et activez dans ses réglages l'« auto-response » : c'est
 *    l'accusé de réception envoyé automatiquement au client.
 * 2. Collez l'URL du formulaire ci-dessous, ex. 'https://formspree.io/f/abcdwxyz'.
 * Tant que cette constante est vide, le site se replie sur l'ouverture d'un
 * e-mail pré-rempli (mailto) — le flux de démonstration.
 */
export const ORDER_ENDPOINT = 'https://formspree.io/f/xaqrwzzy';

/* Taille maximale de la pièce jointe .json (au-delà : trop lourd pour l'envoi direct). */
const MAX_ATTACHMENT_SIZE = 5_000_000;

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
 * Notifie l'atelier qu'une commande vient d'être passée.
 * - Voie normale : `numero` (et `adminUrl`) fournis — la commande est déjà
 *   enregistrée dans Firestore (voir js/core/firebase.js) ; l'e-mail reste
 *   COURT (numéro + résumé), le dossier complet et le PDF se consultent
 *   dans admin.html.
 * - Voie de secours : pas de `numero` (l'écriture en base a échoué, ex.
 *   hors ligne) — l'e-mail contient alors le dossier complet en texte, pour
 *   qu'aucune commande ne soit perdue (à copier dans atelier.html).
 * Retourne { ok, method: 'endpoint' | 'mailto', mailto? }.
 */
export async function submitOrder(payload, { numero, adminUrl } = {}) {
  const type = payload.intent === 'devis' ? 'Demande de devis' : 'Demande de commande';
  const subject = numero
    ? `${type} ${numero} — ${payload.projet.nom} (${payload.commande.quantite} ex.)`
    : `${type} — ${payload.projet.nom} (${payload.commande.quantite} ex.)`;

  if (ORDER_ENDPOINT) {
    try {
      const base = {
        _subject: subject,
        _replyto: payload.contact.email,
        email: payload.contact.email,
        nom: `${payload.contact.prenom} ${payload.contact.nom}`,
        telephone: payload.contact.telephone || '',
      };

      const body = numero
        ? {
            ...base,
            numero,
            recapitulatif: orderBodyShort(payload, numero, adminUrl),
            message_client: clientMessage(payload, numero),
          }
        : (() => {
            const fichier = JSON.stringify({
              type: 'commande-atelier-livret', version: 1, creeLe: new Date().toISOString(),
              intent: payload.intent, contact: payload.contact, commande: payload.commande,
              message: payload.message, projet: payload.projet,
            }, null, 2);
            const tropVolumineux = fichier.length > MAX_ATTACHMENT_SIZE;
            return {
              ...base,
              recapitulatif: orderBodyFull(payload),
              message_client: clientMessage(payload, null),
              fichier_commande_json: tropVolumineux
                ? '(Projet trop volumineux pour tenir dans l\'e-mail — redemandez-le au client, qui en a téléchargé une copie.)'
                : fichier,
            };
          })();

      const res = await fetch(ORDER_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(body),
      });
      if (res.ok) return { ok: true, method: 'endpoint' };
    } catch {
      /* réseau indisponible → repli mailto ci-dessous */
    }
  }

  const mailBody = numero ? orderBodyShort(payload, numero, adminUrl) : orderBodyFull(payload);
  const mailto = `mailto:${CONTACT_EMAIL}`
    + `?subject=${encodeURIComponent(subject)}`
    + `&body=${encodeURIComponent(mailBody)}`;
  return { ok: true, method: 'mailto', mailto };
}

/**
 * Prévient l'atelier qu'un client vient de valider son bon à tirer en ligne.
 * Envoi silencieux (best-effort) via l'endpoint e-mail ; n'interrompt jamais
 * le parcours client si l'envoi échoue.
 */
export async function notifyBatValidated({ numero, nom, adminUrl }) {
  if (!ORDER_ENDPOINT) return { ok: false, method: 'none' };
  const body = [
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
    const res = await fetch(ORDER_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        _subject: `BAT validé${numero ? ' — ' + numero : ''} — L'Atelier du Livret`,
        email: CONTACT_EMAIL,
        recapitulatif: body,
      }),
    });
    return { ok: res.ok, method: 'endpoint' };
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
