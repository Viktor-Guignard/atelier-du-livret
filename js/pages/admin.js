/*
 * Espace privé — connexion (Firebase Authentication), liste des commandes
 * reçues (Firestore), génération du PDF d'impression (fond perdu, traits de
 * coupe) directement depuis le dossier choisi. Voir js/core/firebase.js pour
 * la connexion aux services et firestore.rules pour ce qui protège cet accès.
 */

import { qs, el } from '../core/utils.js';
import { onAuthChange, signIn, signOutAdmin, listOrders, createBatShare, getBat } from '../core/firebase.js';
import { buildPrintKit } from '../components/printKit.js';
import { exportSheetsToPDF } from '../components/pdfExport.js';
import { showToast } from '../components/toast.js';

const loginView = qs('#login-view');
const adminView = qs('#admin-view');
const loginForm = qs('#login-form');
const loginError = qs('#login-error');

let orders = [];
let activeNumero = null;

/* ---------------- Connexion ---------------- */

loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  loginError.hidden = true;
  const email = qs('#login-email').value.trim();
  const password = qs('#login-password').value;
  const btn = loginForm.querySelector('button[type="submit"]');
  btn.disabled = true;
  btn.textContent = 'Connexion…';
  try {
    await signIn(email, password);
  } catch (err) {
    loginError.textContent = 'Adresse e-mail ou mot de passe incorrect.';
    loginError.hidden = false;
  } finally {
    btn.disabled = false;
    btn.textContent = 'Se connecter';
  }
});

qs('#btn-logout').addEventListener('click', () => signOutAdmin());

onAuthChange((user) => {
  loginView.hidden = !!user;
  adminView.hidden = !user;
  if (user) {
    qs('#admin-whoami').textContent = `Connecté en tant que ${user.email}`;
    loadOrders();
  }
});

/* ---------------- Chargement des commandes ---------------- */

async function loadOrders() {
  const list = qs('#orders-list');
  list.textContent = '';
  list.append(el('p', { class: 'small muted' }, 'Chargement…'));
  try {
    orders = await listOrders();
  } catch (err) {
    console.error(err);
    list.textContent = '';
    list.append(el('p', { class: 'small', style: 'color:var(--danger)' },
      'Impossible de charger les commandes. Vérifiez les règles de sécurité Firestore (firestore.rules) ou votre connexion.'));
    return;
  }
  renderOrderList();
}

function orderDate(o) {
  const d = o.creeLe?.toDate ? o.creeLe.toDate() : (o.creeLe ? new Date(o.creeLe) : null);
  return d ? d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }) : '';
}

function renderOrderList() {
  const list = qs('#orders-list');
  const empty = qs('#orders-empty');
  const filtre = (qs('#admin-search').value || '').toLowerCase().trim();

  const filtered = orders.filter((o) => {
    if (!filtre) return true;
    const hay = `${o.numero} ${o.contact?.prenom} ${o.contact?.nom} ${o.contact?.email} ${o.projet?.nom}`.toLowerCase();
    return hay.includes(filtre);
  });

  list.textContent = '';
  empty.hidden = orders.length > 0;
  if (!filtered.length && orders.length) {
    list.append(el('p', { class: 'small muted' }, 'Aucune commande ne correspond à cette recherche.'));
    return;
  }

  for (const o of filtered) {
    const montant = o.commande?.estimation?.total;
    const item = el('button', {
      class: `admin-order${o.numero === activeNumero ? ' is-active' : ''}`,
      type: 'button', role: 'listitem',
      onclick: () => selectOrder(o.numero),
    }, [
      el('div', { class: 'admin-order-top' }, [
        el('span', { class: 'admin-order-numero' }, o.numero),
        el('span', { class: `admin-order-intent${o.intent === 'devis' ? ' is-devis' : ''}` },
          o.intent === 'devis' ? 'Devis' : 'Commande'),
      ]),
      el('div', { class: 'admin-order-client' }, `${o.contact?.prenom || ''} ${o.contact?.nom || ''}`.trim() || '—'),
      el('div', { class: 'admin-order-meta' }, [
        el('span', {}, orderDate(o)),
        el('span', { class: 'admin-order-montant' }, montant != null ? `${montant.toFixed(2).replace('.', ',')} €` : ''),
      ]),
    ]);
    list.append(item);
  }
}

qs('#admin-search').addEventListener('input', renderOrderList);

/* ---------------- Détail + PDF ---------------- */

function selectOrder(numero) {
  activeNumero = numero;
  renderOrderList();
  const order = orders.find((o) => o.numero === numero);
  if (!order) return;

  qs('#detail-panel').hidden = false;
  renderBatShare(order);
  renderPrint(order);
}

/* ---------------- BAT 3D partageable ---------------- */

function batLink(token) {
  return new URL(`bat.html?b=${token}`, location.href).href;
}

async function renderBatShare(order) {
  const zone = qs('#bat-share');
  zone.textContent = '';
  zone.append(el('h3', { class: 'admin-bat-title' }, 'Bon à tirer 3D à envoyer au client'));

  if (!order.batToken) {
    const btn = el('button', { class: 'btn btn-gold btn-sm', type: 'button' }, 'Créer le lien du BAT 3D');
    btn.addEventListener('click', async () => {
      btn.disabled = true; btn.textContent = 'Création…';
      try {
        const token = await createBatShare(order);
        order.batToken = token;                    // maj locale immédiate
        showToast('Lien du BAT créé.', 'success');
        renderBatShare(order);
      } catch (err) {
        console.error(err);
        btn.disabled = false; btn.textContent = 'Créer le lien du BAT 3D';
        showToast(err.message === 'PROJET_TROP_LOURD'
          ? 'Projet trop lourd (photos) pour le BAT 3D — utilisez le PDF ci-dessous.'
          : 'Impossible de créer le BAT — vérifiez les règles Firestore.', 'error');
      }
    });
    zone.append(
      el('p', { class: 'small muted', style: 'margin:0 0 12px' },
        'Génère un lien privé où le client feuillette son livret en 3D et clique « Je valide ». Vous êtes prévenu dès validation.'),
      btn,
    );
    return;
  }

  const link = batLink(order.batToken);
  const linkRow = el('div', { class: 'admin-bat-linkrow' }, [
    el('input', { type: 'text', readonly: '', value: link, 'aria-label': 'Lien du BAT', onclick: (e) => e.target.select() }),
    el('button', {
      class: 'btn btn-light btn-sm', type: 'button',
      onclick: async () => { try { await navigator.clipboard.writeText(link); showToast('Lien copié.', 'success'); } catch { showToast('Copie impossible — sélectionnez le lien.', 'error'); } },
    }, 'Copier'),
  ]);

  const prenom = order.contact?.prenom || '';
  const mailBody = `Bonjour ${prenom},\n\nVotre bon à tirer est prêt. Feuilletez votre livret en 3D et validez-le en un clic ici :\n${link}\n\nÀ très bientôt,\nL'Atelier du Livret`;
  const mailtoHref = `mailto:${order.contact?.email || ''}?subject=${encodeURIComponent('Votre bon à tirer — L\'Atelier du Livret')}&body=${encodeURIComponent(mailBody)}`;

  const statusEl = el('p', { class: 'admin-bat-status small' }, 'Vérification du statut…');

  zone.append(
    el('p', { class: 'small muted', style: 'margin:0 0 10px' }, 'Lien privé à envoyer au client :'),
    linkRow,
    el('div', { class: 'admin-bat-actions' }, [
      el('a', { class: 'btn btn-gold btn-sm', href: mailtoHref }, 'Préparer l\'e-mail au client'),
      el('a', { class: 'btn btn-ghost btn-sm', href: link, target: '_blank', rel: 'noopener' }, 'Ouvrir le BAT'),
    ]),
    statusEl,
  );

  try {
    const bat = await getBat(order.batToken);
    if (bat?.valide) {
      const d = bat.valideLe?.toDate ? bat.valideLe.toDate() : (bat.valideLe ? new Date(bat.valideLe) : null);
      statusEl.className = 'admin-bat-status small is-valide';
      statusEl.textContent = `✓ Validé par ${bat.valideParNom || 'le client'}${d ? ' le ' + d.toLocaleDateString('fr-FR') : ''} — impression possible.`;
    } else {
      statusEl.className = 'admin-bat-status small is-attente';
      statusEl.textContent = '⏳ En attente de validation du client.';
    }
  } catch {
    statusEl.textContent = '';
  }
}

function renderPrint(order) {
  const isBat = qs('#mode-bat').checked;
  document.querySelector('.atelier').classList.toggle('is-bat', isBat);

  const { ficheNode, sheetsNode, pageCount } = buildPrintKit(order, { mode: isBat ? 'bat' : 'production' });

  const fiche = qs('#fiche');
  fiche.hidden = false;
  fiche.textContent = '';
  fiche.append(ficheNode);

  const sheets = qs('#sheets');
  sheets.textContent = '';
  sheets.append(sheetsNode);

  showToast(`${pageCount} planches prêtes${isBat ? ' (mode BAT)' : ''}.`, 'success');
}

qs('#mode-bat').addEventListener('change', () => {
  const order = orders.find((o) => o.numero === activeNumero);
  if (order) renderPrint(order);
});
qs('#btn-print').addEventListener('click', () => {
  if (!activeNumero) { showToast('Choisissez une commande à imprimer.', 'error'); return; }
  window.print();
});

/* ---------------- Téléchargement direct du PDF ---------------- */

const downloadBtn = qs('#btn-download-pdf');
const progress = qs('#pdf-progress');

downloadBtn.addEventListener('click', async () => {
  if (!activeNumero) { showToast('Choisissez une commande à télécharger.', 'error'); return; }
  const isBat = qs('#mode-bat').checked;
  const suffix = isBat ? 'BAT' : 'impression';
  const filename = `${activeNumero}-${suffix}.pdf`;

  downloadBtn.disabled = true;
  const label = downloadBtn.textContent;
  progress.hidden = false;

  try {
    await exportSheetsToPDF(qs('#sheets'), filename, {
      onProgress: (i, total) => {
        downloadBtn.textContent = `Génération… ${i}/${total}`;
        progress.textContent = `Planche ${i} sur ${total}…`;
      },
    });
    showToast('PDF téléchargé.', 'success');
  } catch (err) {
    console.error(err);
    showToast('Échec de la génération du PDF — réessayez.', 'error');
  } finally {
    downloadBtn.disabled = false;
    downloadBtn.textContent = label;
    progress.hidden = true;
  }
});
