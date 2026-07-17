/* Page Commande : récap du projet, formulaire, estimation en direct, envoi. */

import { initSite } from '../components/nav.js';
import { el, qs, getParam, formatDateFr } from '../core/utils.js';
import { listProjects, loadProject } from '../core/store.js';
import { estimateOrder, submitOrder, downloadProjectJSON, downloadOrderJSON, devisNumber, TARIFS, CONTACT_EMAIL } from '../core/api.js';
import { saveOrder } from '../core/firebase.js';
import { categorieById } from '../data/categories.js';
import { renderPage } from '../components/pageRenderer.js';
import { ORNAMENTS } from '../components/ornaments.js';
import { showToast } from '../components/toast.js';

initSite({ active: '' });

/* ---------------- Charger le projet ---------------- */

const projetId = getParam('projet');
let projet = projetId ? loadProject(projetId) : null;
if (!projet) {
  const derniers = listProjects();
  if (derniers.length) projet = loadProject(derniers[0].id);
}

const recap = qs('#recap');
const main = qs('#commande-main');

if (!projet) {
  /* ---------------- État vide ---------------- */
  recap.remove();
  main.classList.add('commande-vide');
  main.append(
    el('span', { class: 'vide-icon', html: ORNAMENTS.livre }),
    el('h2', {}, 'Aucun livret en cours'),
    el('p', { class: 'lead', style: 'margin: 0 auto var(--sp-5)' },
      'Commencez par choisir un modèle : votre projet apparaîtra ici, prêt à être commandé.'),
    el('a', { class: 'btn btn-gold btn-lg', href: 'categories.html' }, 'Choisir un modèle'),
  );
} else {
  const categorie = categorieById(projet.categorieId);

  /* ---------------- Récapitulatif ---------------- */

  recap.append(
    el('div', { class: 'recap-cover' }, [renderPage(projet.pages[0], projet, { pageNumber: 1 })]),
    el('h2', {}, projet.nom),
    el('p', { class: 'recap-cat' }, [el('span', { class: 'badge' }, categorie?.nom || 'Cérémonie')]),
    el('div', { class: 'recap-specs' }, [
      el('div', { class: 'recap-spec' }, [el('span', {}, 'Pages'), el('strong', {}, `${projet.pages.length} pages A5`)]),
      projet.fields?.date ? el('div', { class: 'recap-spec' }, [el('span', {}, 'Date'), el('strong', {}, formatDateFr(projet.fields.date))]) : null,
      projet.fields?.lieu ? el('div', { class: 'recap-spec' }, [el('span', {}, 'Lieu'), el('strong', {}, `${projet.fields.lieu}${projet.fields.ville ? ', ' + projet.fields.ville : ''}`)]) : null,
      el('div', { class: 'recap-spec' }, [el('span', {}, 'Référence'), el('strong', {}, projet.id)]),
    ]),
    el('div', { class: 'recap-actions' }, [
      el('a', { class: 'btn btn-ghost btn-sm', href: `configurateur.html?projet=${projet.id}` }, 'Reprendre l\'édition'),
      el('button', {
        class: 'btn btn-light btn-sm', type: 'button',
        onclick: () => { downloadProjectJSON(projet); showToast('Projet téléchargé (.json).', 'success'); },
      }, 'Télécharger le projet (.json)'),
    ]),
  );

  /* ---------------- Formulaire ---------------- */

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
  const inQte = el('input', { type: 'number', min: String(TARIFS.minQuantite), max: '5000', step: '5', value: '100', inputmode: 'numeric' });
  const inFormat = el('select', {}, [
    el('option', { value: 'a5', selected: '' }, 'A5 (14,8 × 21 cm) — recommandé'),
    el('option', { value: 'a6' }, 'A6 (10,5 × 14,8 cm) — format poche'),
  ]);
  const inPapier = el('select', {}, Object.entries(TARIFS.papiers).map(([id, p], i) =>
    el('option', { value: id, selected: i === 0 ? '' : null }, p.nom)));
  const inBat = el('input', { type: 'checkbox', checked: '' });
  const optInputs = Object.entries(TARIFS.options).map(([id, o]) => ({
    id,
    nom: o.nom,
    parEx: o.parEx,
    input: el('input', { type: 'checkbox', 'data-option': id }),
  }));
  const selectedOptions = () => optInputs.filter((o) => o.input.checked).map((o) => o.id);
  const inMessage = el('textarea', {
    rows: '4',
    placeholder: 'Précisions sur la cérémonie, paroles de chants à insérer, délais particuliers…',
  });

  /* ---------------- Devis en ligne (instantané) ---------------- */

  const numeroDevis = devisNumber();
  const estimation = el('div', { class: 'estimation estimation--devis', role: 'status' });

  const euro = (n) => `${n.toFixed(2).replace('.', ',')} €`;

  function currentDevis() {
    return estimateOrder({
      format: inFormat.value,
      papier: inPapier.value,
      quantite: parseInt(inQte.value, 10) || 0,
      nbPages: projet.pages.length,
      options: selectedOptions(),
    });
  }

  function refreshEstimation() {
    const devis = currentDevis();
    estimation.textContent = '';
    estimation.append(
      el('div', { class: 'devis-head' }, [
        el('h3', {}, 'Votre devis en ligne'),
        el('span', { class: 'devis-num' }, `${numeroDevis} · valable ${TARIFS.validiteDevisJours} jours`),
      ]),
      el('div', { class: 'devis-lignes' }, devis.lignes.map((l) =>
        el('div', { class: `devis-ligne${l.montant < 0 ? ' devis-ligne--remise' : ''}` }, [
          el('span', {}, l.label),
          el('span', { class: 'devis-montant' }, l.montant === 0 ? 'offert' : euro(l.montant)),
        ]))),
      el('div', { class: 'devis-total-row' }, [
        el('span', {}, 'Total TTC'),
        el('span', { class: 'estimation-total' }, euro(devis.total)),
      ]),
      el('div', { class: 'estimation-detail' },
        `soit ${euro(devis.unitaire)} par livret · BAT et accompagnement inclus · ce devis vaut engagement de prix pendant ${TARIFS.validiteDevisJours} jours.`),
      el('button', { class: 'btn btn-light btn-sm', type: 'button', style: 'margin-top:12px', onclick: printDevis },
        'Télécharger ce devis (PDF)'),
    );
  }
  [inQte, inFormat, inPapier, ...optInputs.map((o) => o.input)]
    .forEach((i) => i.addEventListener('input', refreshEstimation));
  refreshEstimation();

  /* Document de devis imprimable (bouton → PDF via la boîte d'impression). */
  function printDevis() {
    document.getElementById('devis-print')?.remove();
    const devis = currentDevis();
    const client = [inPrenom.value, inNom.value].filter(Boolean).join(' ');
    const doc = el('div', { id: 'devis-print', 'aria-hidden': 'true' }, [
      el('header', {}, [
        el('div', { class: 'dp-brand' }, "L'Atelier du Livret"),
        el('div', { class: 'dp-sub' }, 'Livrets de cérémonie personnalisés — création, BAT & impression'),
      ]),
      el('div', { class: 'dp-meta' }, [
        el('div', {}, [el('strong', {}, `Devis ${numeroDevis}`), el('br'), `Émis le ${new Date().toLocaleDateString('fr-FR')} · valable ${TARIFS.validiteDevisJours} jours`]),
        el('div', {}, [
          el('strong', {}, client || 'Client : à compléter'), el('br'),
          inEmail.value || '', inTel.value ? ` · ${inTel.value}` : '',
        ]),
      ]),
      el('div', { class: 'dp-projet' }, [
        el('strong', {}, projet.nom), el('br'),
        `${projet.pages.length} pages · format ${inFormat.value.toUpperCase()} · ${TARIFS.papiers[inPapier.value]?.nom || ''}`,
        projet.fields?.date ? ` · cérémonie du ${formatDateFr(projet.fields.date)}` : '',
      ]),
      el('table', { class: 'dp-table' }, [
        el('thead', {}, [el('tr', {}, [el('th', {}, 'Prestation'), el('th', {}, 'Montant TTC')])]),
        el('tbody', {}, devis.lignes.map((l) => el('tr', {}, [
          el('td', {}, l.label),
          el('td', {}, l.montant === 0 ? 'Offert' : euro(l.montant)),
        ]))),
        el('tfoot', {}, [el('tr', {}, [el('td', {}, 'Total TTC'), el('td', {}, euro(devis.total))])]),
      ]),
      el('ul', { class: 'dp-mentions' }, [
        el('li', {}, 'Bon à tirer numérique inclus : aucune impression sans votre validation écrite.'),
        el('li', {}, 'Impression et façonnage en France — livraison 5 à 7 jours ouvrés après validation du BAT.'),
        el('li', {}, `Devis ferme pendant ${TARIFS.validiteDevisJours} jours. Pour l'accepter : bouton « Envoyer ma demande de commande » ou réponse à ${CONTACT_EMAIL}.`),
      ]),
    ]);
    document.body.append(doc);
    document.body.classList.add('print-devis');
    const cleanup = () => { document.body.classList.remove('print-devis'); doc.remove(); window.removeEventListener('afterprint', cleanup); };
    window.addEventListener('afterprint', cleanup);
    window.print();
  }

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
      el('legend', {}, 'Votre impression'),
      el('div', { class: 'form-row' }, [
        field('c-qte', 'Quantité (exemplaires)', inQte, { required: true, hint: `Minimum ${TARIFS.minQuantite} exemplaires. Tarifs dégressifs dès 75.`, error: `Minimum ${TARIFS.minQuantite} exemplaires.` }),
        field('c-format', 'Format', inFormat),
      ]),
      field('c-papier', 'Papier', inPapier),
      optInputs.length ? el('div', { class: 'field' }, [
        el('label', {}, 'Finitions'),
        ...optInputs.map((o) => el('label', { class: 'checkbox-row', style: 'margin-bottom:8px' }, [
          o.input,
          el('span', {}, [`${o.nom} `, el('span', { class: 'muted small' }, `(+ ${o.parEx.toFixed(2).replace('.', ',')} €/ex.)`)]),
        ])),
      ]) : null,
      el('label', { class: 'checkbox-row' }, [
        inBat,
        el('span', {}, 'Bon à tirer numérique avant impression (inclus, recommandé) — vous validez chaque page avant le lancement.'),
      ]),
    ]),
    el('fieldset', {}, [
      el('legend', {}, 'Informations complémentaires'),
      field('c-message', 'Votre message', inMessage),
    ]),
    estimation,
    el('div', { class: 'commande-submit' }, [
      el('button', { class: 'btn btn-ghost btn-lg', type: 'submit', 'data-intent': 'devis' }, 'Demander un devis'),
      el('button', { class: 'btn btn-gold btn-lg', type: 'submit', 'data-intent': 'commande' }, 'Envoyer ma demande de commande'),
    ]),
  ]);

  const ensuite = el('div', { class: 'ensuite' }, [
    el('h3', {}, 'Et ensuite ?'),
    el('ol', {}, [
      el('li', {}, `Votre devis en ligne est ferme ${TARIFS.validiteDevisJours} jours — nous confirmons la prise en charge sous 24 h ouvrées.`),
      el('li', {}, 'Vous recevez un BAT numérique de chaque page et validez (ou corrigez) tranquillement.'),
      el('li', {}, 'Impression et livraison soignées en 5 à 7 jours ouvrés après validation du BAT.'),
    ]),
  ]);

  main.append(form, ensuite);

  /* ---------------- Validation & envoi ---------------- */

  let lastIntent = 'commande';
  form.addEventListener('click', (e) => {
    const btn = e.target.closest('button[type="submit"]');
    if (btn) lastIntent = btn.dataset.intent;
  });

  function setError(input, hasError) {
    input.closest('.field')?.classList.toggle('has-error', hasError);
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    let firstInvalid = null;
    const check = (input, ok) => {
      setError(input, !ok);
      if (!ok && !firstInvalid) firstInvalid = input;
    };
    check(inPrenom, inPrenom.value.trim().length > 0);
    check(inNom, inNom.value.trim().length > 0);
    check(inEmail, /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(inEmail.value.trim()));
    check(inQte, (parseInt(inQte.value, 10) || 0) >= TARIFS.minQuantite);

    if (firstInvalid) {
      firstInvalid.focus();
      showToast('Merci de compléter les champs signalés.', 'error');
      return;
    }

    const quantite = parseInt(inQte.value, 10);
    const payload = {
      intent: lastIntent,
      projet,
      contact: {
        prenom: inPrenom.value.trim(),
        nom: inNom.value.trim(),
        email: inEmail.value.trim(),
        telephone: inTel.value.trim(),
      },
      commande: {
        quantite,
        format: inFormat.value,
        papier: inPapier.value,
        options: selectedOptions(),
        bat: inBat.checked,
        devisNumero: numeroDevis,
        estimation: currentDevis(),
      },
      message: inMessage.value.trim(),
    };

    /* État d'envoi */
    const submitBtns = [...form.querySelectorAll('button[type="submit"]')];
    submitBtns.forEach((b) => { b.disabled = true; });
    const goldBtn = submitBtns.find((b) => b.dataset.intent === lastIntent) || submitBtns[1];
    const btnLabel = goldBtn.textContent;
    goldBtn.textContent = 'Envoi en cours…';

    /* 1. Enregistrement dans l'espace privé (Firestore) — numéro de commande officiel. */
    let numero = null;
    try {
      numero = await saveOrder(payload);
    } catch (err) {
      console.error('Échec de l\'enregistrement de la commande dans Firestore :', err);
      // Pas bloquant : submitOrder() bascule alors sur un e-mail contenant le dossier complet.
    }
    const adminUrl = new URL('admin.html', location.href).href;

    /* 2. Notification par e-mail (courte si numero, complète en secours sinon). */
    const result = await submitOrder(payload, { numero, adminUrl });
    downloadOrderJSON(payload);
    if (result.method === 'mailto' && result.mailto) window.location.href = result.mailto;

    submitBtns.forEach((b) => { b.disabled = false; });
    goldBtn.textContent = btnLabel;

    /* Confirmation */
    const envoiReel = result.method === 'emailjs';
    form.replaceWith(el('div', { class: 'commande-confirm' }, [
      el('span', { class: 'confirm-icon', html: '<svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg>' }),
      el('h2', {}, envoiReel
        ? (lastIntent === 'devis' ? 'Votre demande de devis est envoyée' : 'Votre commande est envoyée')
        : (lastIntent === 'devis' ? 'Votre demande de devis est prête' : 'Votre demande de commande est prête')),
      numero ? el('p', { class: 'commande-numero' }, [el('span', {}, lastIntent === 'devis' ? 'Numéro de suivi' : 'Numéro de commande'), el('strong', {}, numero)]) : null,
      envoiReel
        ? el('p', { class: 'lead', style: 'margin: 0 auto var(--sp-4)' },
            `Nous avons bien reçu votre demande. Un accusé de réception vous est adressé à ${payload.contact.email}, ` +
            'et nous revenons vers vous sous 24 h ouvrées avec le devis, puis le BAT. ' +
            (numero ? 'Merci de conserver ce numéro dans vos échanges avec nous.' : 'Une copie de votre commande (.json) vient d\'être téléchargée — conservez-la.'))
        : el('p', { class: 'lead', style: 'margin: 0 auto var(--sp-4)' },
            'Votre messagerie s\'est ouverte avec le récapitulatif complet. ' +
            'Le fichier de commande (.json) vient d\'être téléchargé : joignez-le au message avant l\'envoi.'),
      envoiReel ? null : el('p', { class: 'small muted' }, [
        'Rien ne s\'est ouvert ? Écrivez-nous directement à ',
        el('a', { href: `mailto:${CONTACT_EMAIL}` }, CONTACT_EMAIL),
        ' en joignant le fichier téléchargé.',
      ]),
      el('p', { class: 'small muted' }, `Rappel : ${payload.commande.bat ? 'un BAT numérique vous sera envoyé avant toute impression — rien ne part sans votre validation.' : 'vous avez choisi de ne pas recevoir de BAT.'}`),
      el('a', { class: 'btn btn-ghost', href: 'index.html', style: 'margin-top: var(--sp-4)' }, 'Retour à l\'accueil'),
    ]));
    showToast(envoiReel ? 'Commande envoyée — merci !' : 'Demande préparée — merci !', 'success');
  });
}
