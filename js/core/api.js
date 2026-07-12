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

/* Taille maximale du projet joint au POST (au-delà : fichier à transmettre en réponse). */
const MAX_INLINE_PROJECT = 150_000;

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
  options: {
    'dorure': { nom: 'Dorure à chaud sur couverture', parEx: 1.9 },
    'coins':  { nom: 'Coins arrondis', parEx: 0.35 },
  },
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

function orderBody(payload) {
  const { projet, contact, commande, message } = payload;
  const lignes = [
    `${payload.intent === 'devis' ? 'DEMANDE DE DEVIS' : 'DEMANDE DE COMMANDE'} — L'Atelier du Livret`,
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
    '— Le fichier .json du projet est joint à ce message (ou envoyé à la suite). —',
  ].filter((l) => l !== null);
  return lignes.join('\n');
}

/**
 * Envoie la demande de commande.
 * - ORDER_ENDPOINT configuré → POST réel : vous recevez la commande par e-mail
 *   (avec le projet en JSON) et le client reçoit l'accusé de réception
 *   automatique du service. Retourne { ok, method: 'endpoint' }.
 * - Sinon (ou si le réseau échoue) → repli : e-mail pré-rempli.
 *   Retourne { ok, method: 'mailto', mailto }.
 */
export async function submitOrder(payload) {
  const type = payload.intent === 'devis' ? 'Demande de devis' : 'Demande de commande';
  const subject = `${type} — ${payload.projet.nom} (${payload.commande.quantite} ex.)`;

  if (ORDER_ENDPOINT) {
    try {
      const projetJson = JSON.stringify({
        type: 'commande-atelier-livret',
        version: 1,
        intent: payload.intent,
        contact: payload.contact,
        commande: payload.commande,
        message: payload.message,
        projet: payload.projet,
      });
      const res = await fetch(ORDER_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          _subject: subject,
          _replyto: payload.contact.email,
          email: payload.contact.email,
          nom: `${payload.contact.prenom} ${payload.contact.nom}`,
          telephone: payload.contact.telephone || '',
          recapitulatif: orderBody(payload),
          fichier_commande_json: projetJson.length <= MAX_INLINE_PROJECT
            ? projetJson
            : '(Projet trop volumineux pour l\'envoi direct — le client a téléchargé le fichier .json : le demander en réponse.)',
        }),
      });
      if (res.ok) return { ok: true, method: 'endpoint' };
    } catch {
      /* réseau indisponible → repli mailto ci-dessous */
    }
  }

  const mailto = `mailto:${CONTACT_EMAIL}`
    + `?subject=${encodeURIComponent(subject)}`
    + `&body=${encodeURIComponent(orderBody(payload))}`;
  return { ok: true, method: 'mailto', mailto };
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
  a.download = `commande-${(payload.projet.nom || 'livret').toLowerCase().replace(/[^a-z0-9]+/gi, '-')}.json`;
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
