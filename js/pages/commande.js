/*
 * Page Commande : une commande = TOUT le panier.
 * Colonne principale : livrets (options éditables par livret) + coordonnées.
 * Colonne latérale : total en direct, devis PDF, envoi.
 */

import { initSite } from '../components/nav.js';
import { el, qs, getParam } from '../core/utils.js';
import { loadProject, listProjects } from '../core/store.js';
import { estimateOrder, submitOrder, downloadOrderJSON, devisNumber, TARIFS, CONTACT_EMAIL } from '../core/api.js';
import { saveOrder } from '../core/firebase.js';
import { categorieById } from '../data/categories.js';
import { renderPageThumb } from '../components/pageRenderer.js';
import { ORNAMENTS } from '../components/ornaments.js';
import { showToast } from '../components/toast.js';
import { cartItems, addToCart, updateItem, removeItem, clearCart } from '../core/cart.js';

initSite({ active: '' });

const euro = (n) => `${(n || 0).toFixed(2).replace('.', ',')} €`;
const lineEstimate = (it) => estimateOrder({
  format: it.commande.format, papier: it.commande.papier, quantite: it.commande.quantite,
  nbPages: it.projet?.pages?.length || 8, options: it.commande.options || [],
});
const cartTotalNow = () => Math.round(cartItems().reduce((s, it) => s + (lineEstimate(it).total || 0), 0) * 100) / 100;

/* --- Constituer le panier de commande --- */
// Bouton « Commander » d'un livret → on l'ajoute au panier si absent (la commande
// porte toujours sur le panier). Sinon, panier vide → dernier projet enregistré.
const projetId = getParam('projet');
if (projetId && !cartItems().some((i) => i.projet?.id === projetId)) {
  const p = loadProject(projetId);
  if (p) addToCart(p);
}
if (!cartItems().length) {
  const derniers = listProjects();
  if (derniers.length) { const p = loadProject(derniers[0].id); if (p) addToCart(p); }
}

const numeroDevis = devisNumber();
const recap = qs('#recap');
const main = qs('#commande-main');

if (!cartItems().length) {
  /* ---------------- État vide ---------------- */
  recap.remove();
  main.classList.add('commande-vide');
  main.append(
    el('span', { class: 'vide-icon', html: ORNAMENTS.livre }),
    el('h2', {}, 'Votre panier est vide'),
    el('p', { class: 'lead', style: 'margin: 0 auto var(--sp-5)' },
      'Choisissez un modèle et personnalisez un livret : il apparaîtra ici, prêt à être commandé.'),
    el('a', { class: 'btn btn-gold btn-lg', href: 'categories.html' }, 'Choisir un modèle'),
  );
} else {
  buildOrderPage();
}

/* ================================================================ */

function buildOrderPage() {
  /* ----- Colonne latérale : total en direct + devis PDF ----- */
  const totalEl = el('strong', { class: 'commande-total-val' }, euro(cartTotalNow()));
  const refreshTotal = () => { totalEl.textContent = euro(cartTotalNow()); };

  recap.append(
    el('div', { class: 'commande-summary' }, [
      el('h2', {}, 'Votre commande'),
      el('div', { class: 'commande-total' }, [el('span', {}, 'Total estimé TTC'), totalEl]),
      el('p', { class: 'small muted', style: 'margin:0 0 var(--sp-4)' },
        `BAT et accompagnement inclus · devis ferme ${TARIFS.validiteDevisJours} jours. Montant définitif sur le devis.`),
      el('button', { class: 'btn btn-light btn-sm', type: 'button', style: 'width:100%', onclick: printDevis },
        'Télécharger le devis (PDF)'),
      el('a', { class: 'btn btn-ghost btn-sm', href: 'panier.html', style: 'width:100%;margin-top:var(--sp-3)' },
        'Modifier mon panier'),
    ]),
  );

  /* ----- Livrets (options éditables par livret) ----- */
  const livretsWrap = el('div', { class: 'commande-livrets' });
  const livretsSection = el('div', {}, [
    el('h2', { class: 'commande-h' }, `Vos livrets (${cartItems().length})`),
    livretsWrap,
  ]);
  cartItems().forEach((item) => livretsWrap.append(renderLivret(item, refreshTotal, livretsWrap, livretsSection)));

  /* ----- Formulaire de coordonnées ----- */
  const field = (id, label, input, { required = false, hint = '', error = '' } = {}) => {
    input.id = id;
    if (required) input.setAttribute('required', '');
    return el('div', { class: 'field', 'data-field': id }, [
      el('label', { for: id }, [label, required ? el('span', { class: 'req' }, ' *') : null]),
      input,
      hint ? el('span', { class: 'hint' }, hint) : null,
      el('span', { class: 'error-msg' }, error || 'Ce champ est requis.'),
    ]);
  };

  const inPrenom = el('input', { type: 'text', autocomplete: 'given-name' });
  const inNom = el('input', { type: 'text', autocomplete: 'family-name' });
  const inEmail = el('input', { type: 'email', autocomplete: 'email', placeholder: 'vous@exemple.fr' });
  const inTel = el('input', { type: 'tel', autocomplete: 'tel', placeholder: '06 12 34 56 78' });
  const inMessage = el('textarea', {
    rows: '4',
    placeholder: 'Précisions sur les cérémonies, paroles de chants à insérer, délais particuliers…',
  });

  const form = el('form', { class: 'commande-form', novalidate: '' }, [
    el('fieldset', {}, [
      el('legend', {}, 'Vos coordonnées'),
      el('div', { class: 'form-row' }, [
        field('c-prenom', 'Prénom', inPrenom, { required: true }),
        field('c-nom', 'Nom', inNom, { required: true }),
      ]),
      el('div', { class: 'form-row' }, [
        field('c-email', 'Adresse e-mail', inEmail, { required: true, error: 'Une adresse e-mail valide est requise.' }),
        field('c-tel', 'Téléphone', inTel, { hint: 'Facultatif — pour les questions urgentes sur votre BAT.' }),
      ]),
    ]),
    el('fieldset', {}, [
      el('legend', {}, 'Informations complémentaires'),
      field('c-message', 'Votre message', inMessage),
    ]),
    el('div', { class: 'commande-submit' }, [
      el('button', { class: 'btn btn-ghost btn-lg', type: 'submit', 'data-intent': 'devis' }, 'Demander un devis'),
      el('button', { class: 'btn btn-gold btn-lg', type: 'submit', 'data-intent': 'commande' }, 'Envoyer ma commande'),
    ]),
  ]);

  const ensuite = el('div', { class: 'ensuite' }, [
    el('h3', {}, 'Et ensuite ?'),
    el('ol', {}, [
      el('li', {}, `Votre devis en ligne est ferme ${TARIFS.validiteDevisJours} jours — nous confirmons la prise en charge sous 24 h ouvrées.`),
      el('li', {}, 'Vous recevez un BAT numérique de chaque livret et validez (ou corrigez) tranquillement.'),
      el('li', {}, 'Impression et livraison soignées en 5 à 7 jours ouvrés après validation des BAT.'),
    ]),
  ]);

  main.append(livretsSection, form, ensuite);

  /* ---------------- Validation & envoi ---------------- */

  let lastIntent = 'commande';
  form.addEventListener('click', (e) => {
    const btn = e.target.closest('button[type="submit"]');
    if (btn) lastIntent = btn.dataset.intent;
  });

  const setError = (input, hasError) => input.closest('.field')?.classList.toggle('has-error', hasError);

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    // Soumission clavier (Entrée) : e.submitter donne le vrai bouton ; sinon le
    // dernier cliqué. Évite qu'une validation au clavier soit traitée en « commande ».
    lastIntent = e.submitter?.dataset.intent || lastIntent;
    if (!cartItems().length) { showToast('Votre panier est vide.', 'error'); return; }

    let firstInvalid = null;
    const check = (input, ok) => { setError(input, !ok); if (!ok && !firstInvalid) firstInvalid = input; };
    check(inPrenom, inPrenom.value.trim().length > 0);
    check(inNom, inNom.value.trim().length > 0);
    check(inEmail, /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(inEmail.value.trim()));
    if (firstInvalid) {
      firstInvalid.focus();
      showToast('Merci de compléter les champs signalés.', 'error');
      return;
    }

    const payload = {
      intent: lastIntent,
      contact: {
        prenom: inPrenom.value.trim(), nom: inNom.value.trim(),
        email: inEmail.value.trim(), telephone: inTel.value.trim(),
      },
      items: cartItems().map((it) => ({
        projet: it.projet,
        commande: {
          quantite: it.commande.quantite, format: it.commande.format, papier: it.commande.papier,
          options: it.commande.options || [], bat: it.commande.bat,
          estimation: lineEstimate(it),
        },
      })),
      montantTotal: cartTotalNow(),
      devisNumero: numeroDevis,
      message: inMessage.value.trim(),
    };

    const submitBtns = [...form.querySelectorAll('button[type="submit"]')];
    submitBtns.forEach((b) => { b.disabled = true; });
    const goldBtn = submitBtns.find((b) => b.dataset.intent === lastIntent) || submitBtns[1];
    const btnLabel = goldBtn.textContent;
    goldBtn.textContent = 'Envoi en cours…';

    /* 1. Enregistrement Firestore (numéro officiel). */
    let numero = null;
    try { numero = await saveOrder(payload); }
    catch (err) { console.error('Échec de l\'enregistrement Firestore :', err); }
    const adminUrl = new URL('admin.html', location.href).href;

    /* 2. E-mails (court si numero, complet en secours). */
    const result = await submitOrder(payload, { numero, adminUrl });
    downloadOrderJSON(payload);
    if (result.method === 'mailto' && result.mailto) window.location.href = result.mailto;

    submitBtns.forEach((b) => { b.disabled = false; });
    goldBtn.textContent = btnLabel;

    // On ne vide le panier QUE si la commande est réellement enregistrée en base
    // (numero attribué). Si l'enregistrement a échoué (ex. commande trop lourde),
    // on conserve le panier pour ne pas perdre le travail du client.
    if (result.method === 'emailjs' && numero) clearCart();

    /* Confirmation */
    const envoiReel = result.method === 'emailjs';
    const nb = payload.items.length;
    document.querySelector('.commande-layout')?.replaceWith(el('div', { class: 'container' }, [
      el('div', { class: 'commande-confirm' }, [
        el('span', { class: 'confirm-icon', html: '<svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg>' }),
        el('h2', {}, envoiReel
          ? (lastIntent === 'devis' ? 'Votre demande de devis est envoyée' : 'Votre commande est envoyée')
          : (lastIntent === 'devis' ? 'Votre demande de devis est prête' : 'Votre demande de commande est prête')),
        numero ? el('p', { class: 'commande-numero' }, [el('span', {}, lastIntent === 'devis' ? 'Numéro de suivi' : 'Numéro de commande'), el('strong', {}, numero)]) : null,
        el('p', { class: 'small muted' }, `${nb} livret${nb > 1 ? 's' : ''} · ${euro(payload.montantTotal)} TTC`),
        // Cas dégradé : e-mail parti mais enregistrement en base échoué (numero null).
        (envoiReel && !numero) ? el('p', { class: 'commande-warn', style: 'margin: var(--sp-3) auto var(--sp-4);max-width:56ch' },
          '⚠ Votre demande nous est bien parvenue par e-mail, mais son enregistrement automatique n\'a pas abouti ' +
          '(dossier volumineux, par ex. beaucoup de photos). Votre panier est conservé et le fichier de commande (.json) ' +
          `vient d'être téléchargé — au besoin, renvoyez-le à ${CONTACT_EMAIL}. Nous vous recontactons sous 24 h.`) : null,
        envoiReel
          ? el('p', { class: 'lead', style: 'margin: var(--sp-3) auto var(--sp-4)' },
              `Nous avons bien reçu votre demande. Un accusé de réception vous est adressé à ${payload.contact.email}, ` +
              'et nous revenons vers vous sous 24 h ouvrées avec le devis, puis les BAT. ' +
              (numero ? 'Merci de conserver ce numéro dans vos échanges avec nous.' : ''))
          : el('p', { class: 'lead', style: 'margin: var(--sp-3) auto var(--sp-4)' },
              'Votre messagerie s\'est ouverte avec le récapitulatif complet. ' +
              'Le fichier de commande (.json) vient d\'être téléchargé : joignez-le au message avant l\'envoi.'),
        envoiReel ? null : el('p', { class: 'small muted' }, [
          'Rien ne s\'est ouvert ? Écrivez-nous à ',
          el('a', { href: `mailto:${CONTACT_EMAIL}` }, CONTACT_EMAIL),
          ' en joignant le fichier téléchargé.',
        ]),
        el('a', { class: 'btn btn-ghost', href: 'index.html', style: 'margin-top: var(--sp-4)' }, 'Retour à l\'accueil'),
      ]),
    ]));
    showToast(envoiReel ? 'Commande envoyée — merci !' : 'Demande préparée — merci !', 'success');
  });
}

/* ---------------- Carte d'un livret (options éditables) ---------------- */

function renderLivret(item, refreshTotal, livretsWrap, livretsSection) {
  const projet = item.projet;
  const categorie = categorieById(projet.categorieId);
  const priceEl = el('strong', { class: 'commande-livret-price' }, euro(lineEstimate(item).total));
  const onChange = () => { priceEl.textContent = euro(lineEstimate(item).total); refreshTotal(); };

  const qte = el('input', {
    type: 'number', min: String(TARIFS.minQuantite), max: '5000', step: '5',
    value: String(item.commande.quantite), inputmode: 'numeric', 'aria-label': 'Quantité',
  });
  qte.addEventListener('input', () => {
    const v = Math.max(TARIFS.minQuantite, parseInt(qte.value, 10) || 0);
    updateItem(item.id, { quantite: v }); item.commande.quantite = v; onChange();
  });

  const format = el('select', { 'aria-label': 'Format' }, [
    el('option', { value: 'a5', selected: item.commande.format === 'a5' ? '' : null }, 'A5 (14,8 × 21 cm)'),
    el('option', { value: 'a6', selected: item.commande.format === 'a6' ? '' : null }, 'A6 (format poche)'),
  ]);
  format.addEventListener('change', () => { updateItem(item.id, { format: format.value }); item.commande.format = format.value; onChange(); });

  const papier = el('select', { 'aria-label': 'Papier' },
    Object.entries(TARIFS.papiers).map(([id, p]) =>
      el('option', { value: id, selected: item.commande.papier === id ? '' : null }, p.nom)));
  papier.addEventListener('change', () => { updateItem(item.id, { papier: papier.value }); item.commande.papier = papier.value; onChange(); });

  const bat = el('input', { type: 'checkbox', ...(item.commande.bat ? { checked: '' } : {}) });
  bat.addEventListener('change', () => { updateItem(item.id, { bat: bat.checked }); item.commande.bat = bat.checked; });

  const card = el('article', { class: 'commande-livret' }, [
    el('div', { class: 'commande-livret-cover' }, [renderPageThumb(projet.pages[0], projet, { pageNumber: 1 })]),
    el('div', { class: 'commande-livret-body' }, [
      el('div', { class: 'commande-livret-head' }, [
        el('div', {}, [
          el('span', { class: 'badge' }, categorie?.nom || 'Cérémonie'),
          el('h3', {}, projet.nom),
          el('p', { class: 'small muted' }, `${projet.pages.length} page${projet.pages.length > 1 ? 's' : ''}`),
        ]),
        priceEl,
      ]),
      el('div', { class: 'commande-livret-opts' }, [
        el('label', {}, ['Quantité', qte]),
        el('label', {}, ['Format', format]),
        el('label', {}, ['Papier', papier]),
      ]),
      el('label', { class: 'checkbox-row commande-livret-bat' }, [bat, el('span', {}, 'Bon à tirer avant impression (recommandé)')]),
      el('div', { class: 'commande-livret-actions' }, [
        el('a', { class: 'btn btn-ghost btn-sm', href: `configurateur.html?projet=${projet.id}` }, 'Modifier le contenu'),
        el('button', {
          class: 'btn-link-danger', type: 'button',
          onclick: () => {
            removeItem(item.id);
            card.remove();
            refreshTotal();
            const remaining = cartItems().length;
            livretsSection.querySelector('.commande-h').textContent = `Vos livrets (${remaining})`;
            showToast('Livret retiré.', 'success');
            // Panier vide : afficher l'état vide SANS recharger (un reload
            // re-remplirait le panier depuis ?projet= ou le dernier projet).
            if (!remaining) {
              document.querySelector('.commande-layout')?.replaceWith(el('div', { class: 'container' }, [
                el('div', { class: 'commande-vide', style: 'text-align:center;padding:var(--sp-7) var(--sp-4)' }, [
                  el('span', { class: 'vide-icon', html: ORNAMENTS.livre }),
                  el('h2', {}, 'Votre panier est vide'),
                  el('p', { class: 'lead', style: 'margin:0 auto var(--sp-5)' }, 'Choisissez un modèle pour composer un nouveau livret.'),
                  el('a', { class: 'btn btn-gold btn-lg', href: 'categories.html' }, 'Choisir un modèle'),
                ]),
              ]));
            }
          },
        }, 'Retirer'),
      ]),
    ]),
  ]);
  return card;
}

/* ---------------- Devis imprimable (PDF via la boîte d'impression) ---------------- */

function printDevis() {
  document.getElementById('devis-print')?.remove();
  const items = cartItems();
  const total = cartTotalNow();
  const prenom = qs('#c-prenom')?.value || '';
  const nom = qs('#c-nom')?.value || '';
  const email = qs('#c-email')?.value || '';
  const tel = qs('#c-tel')?.value || '';

  const rows = items.map((it, i) => {
    const c = it.commande;
    const est = lineEstimate(it);
    return el('tr', {}, [
      el('td', {}, [el('strong', {}, `${i + 1}. ${it.projet.nom}`), el('br'),
        el('span', { class: 'dp-small' }, `${c.quantite} ex. · ${c.format.toUpperCase()} · ${TARIFS.papiers[c.papier]?.nom || c.papier} · ${it.projet.pages.length} pages`)]),
      el('td', {}, euro(est.total)),
    ]);
  });

  const doc = el('div', { id: 'devis-print', 'aria-hidden': 'true' }, [
    el('header', {}, [
      el('div', { class: 'dp-brand' }, 'Livrets de messe'),
      el('div', { class: 'dp-sub' }, 'Livrets de cérémonie personnalisés — création, BAT & impression'),
    ]),
    el('div', { class: 'dp-meta' }, [
      el('div', {}, [el('strong', {}, `Devis ${numeroDevis}`), el('br'), `Émis le ${new Date().toLocaleDateString('fr-FR')} · valable ${TARIFS.validiteDevisJours} jours`]),
      el('div', {}, [
        el('strong', {}, `${prenom} ${nom}`.trim() || 'Client : à compléter'), el('br'),
        email || '', tel ? ` · ${tel}` : '',
      ]),
    ]),
    el('table', { class: 'dp-table' }, [
      el('thead', {}, [el('tr', {}, [el('th', {}, 'Livret'), el('th', {}, 'Montant TTC')])]),
      el('tbody', {}, rows),
      el('tfoot', {}, [el('tr', {}, [el('td', {}, `Total — ${items.length} livret${items.length > 1 ? 's' : ''}`), el('td', {}, euro(total))])]),
    ]),
    el('ul', { class: 'dp-mentions' }, [
      el('li', {}, 'Bon à tirer numérique inclus pour chaque livret : aucune impression sans votre validation écrite.'),
      el('li', {}, 'Impression et façonnage en France — livraison 5 à 7 jours ouvrés après validation des BAT.'),
      el('li', {}, `Devis ferme pendant ${TARIFS.validiteDevisJours} jours. Pour l'accepter : bouton « Envoyer ma commande » ou réponse à ${CONTACT_EMAIL}.`),
      el('li', {}, '« Livrets de messe » — créé par VIKTO LABS · imaginé et imprimé par Imprigraphic.'),
    ]),
  ]);
  document.body.append(doc);
  document.body.classList.add('print-devis');
  const cleanup = () => { document.body.classList.remove('print-devis'); doc.remove(); window.removeEventListener('afterprint', cleanup); };
  window.addEventListener('afterprint', cleanup);
  window.print();
}
