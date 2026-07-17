/*
 * Bon à tirer en ligne (public) — le client feuillette son livret en 3D et
 * le valide d'un clic. Le lien contient un jeton (?b=…) qui donne accès à un
 * instantané du projet (collection Firestore `bats`) sans exposer la commande.
 * La validation n'écrit que les champs de validation (voir firestore.rules).
 */

import { qs, el, getParam, describeDevice, getApproxLocation } from '../core/utils.js';
import { getBat, validateBat } from '../core/firebase.js';
import { notifyBatValidated, confirmBatToClient } from '../core/api.js';
import { renderAllPages, renderPageThumb } from '../components/pageRenderer.js';
import { createBook3D } from '../components/book3d.js';
import { categorieById } from '../data/categories.js';
import { showToast } from '../components/toast.js';

const token = getParam('b');

// Préchargé dès l'ouverture pour ne pas ralentir le clic « Je valide ».
const locationPromise = getApproxLocation();

function show(id) {
  ['bat-loading', 'bat-error', 'bat-view'].forEach((k) => { qs('#' + k).hidden = k !== id; });
}

function fmtDate(ts) {
  const d = ts?.toDate ? ts.toDate() : (ts ? new Date(ts) : null);
  return d ? d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : '';
}

async function main() {
  if (!token) { show('bat-error'); return; }
  let bat;
  try {
    bat = await getBat(token);
  } catch (err) {
    console.error(err);
    show('bat-error');
    return;
  }
  if (!bat || !bat.projet?.pages) { show('bat-error'); return; }
  render(bat);
}

function render(bat) {
  const projet = bat.projet;
  const categorie = categorieById(projet.categorieId);
  const view = qs('#bat-view');
  view.textContent = '';

  const prenom = bat.contactPrenom || projet.fields?.prenom || '';
  document.title = `Bon à tirer${bat.numero ? ' ' + bat.numero : ''} — L'Atelier du Livret`;

  /* --- En-tête --- */
  view.append(el('div', { class: 'bat-intro' }, [
    el('p', { class: 'eyebrow' }, 'Bon à tirer'),
    el('h1', {}, prenom ? `${prenom}, voici votre livret` : 'Votre livret'),
    el('p', { class: 'lead', style: 'margin-inline:auto' },
      'Feuilletez chaque page comme un vrai livret. S\'il vous convient, validez-le en bas de page : ' +
      'nous lancerons alors l\'impression. Le filigrane « aperçu » n\'apparaîtra pas sur l\'exemplaire imprimé.'),
    bat.numero ? el('p', { class: 'bat-ref' }, [el('span', { class: 'badge' }, categorie?.nom || 'Livret'), ` Réf. ${bat.numero}`]) : null,
  ]));

  /* --- Scène 3D + outils --- */
  const scene = el('div', { class: 'bat-scene', id: 'bat-scene' });
  const indicator = el('span', { class: 'bat-indicator', 'aria-live': 'polite' }, 'page 1');
  const thumbs = el('div', { class: 'bat-thumbs', 'aria-label': 'Aller à une page' });

  const iconBtn = (label, path, onclick) => el('button', {
    class: 'btn-icon', type: 'button', 'aria-label': label, title: label,
    html: `<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${path}"/></svg>`,
    onclick,
  });

  view.append(el('div', { class: 'bat-viewer' }, [
    scene,
    el('div', { class: 'bat-toolbar', role: 'toolbar', 'aria-label': 'Commandes' }, [
      el('div', { class: 'bat-tb-group' }, [
        iconBtn('Page précédente', 'M15 5l-7 7 7 7', () => book.prev()),
        indicator,
        iconBtn('Page suivante', 'M9 5l7 7-7 7', () => book.next()),
      ]),
      el('div', { class: 'bat-tb-group bat-modes', role: 'group', 'aria-label': 'Mode d\'affichage' }, [
        modeChip('Livre 3D', '3d', true),
        modeChip('Double page', 'double', false),
        modeChip('Page à page', 'simple', false),
      ]),
      el('div', { class: 'bat-tb-group', role: 'group', 'aria-label': 'Zoom' }, [
        iconBtn('Zoom arrière', 'M16.5 16.5 21 21M8 11h6', () => book.zoomOut()),
        iconBtn('Réinitialiser la vue', 'M3 12a9 9 0 1 0 3-6.7M3 4v5h5', () => book.resetView()),
        iconBtn('Zoom avant', 'M16.5 16.5 21 21M8 11h6M11 8v6', () => book.zoomIn()),
      ]),
    ]),
    el('p', { class: 'bat-hint small muted' }, 'Cliquez sur les pages pour feuilleter · glissez pour faire pivoter · molette pour zoomer'),
    thumbs,
  ]));

  /* --- Panneau de validation --- */
  const validationZone = el('div', { class: 'bat-validation', id: 'bat-validation' });
  view.append(validationZone);
  renderValidation(bat, validationZone);

  show('bat-view');

  /* Livre 3D */
  const book = createBook3D(scene, () => renderAllPages(projet), {
    mode: '3d',
    onChange: ({ page, pageCount }) => {
      indicator.textContent = `page ${page} / ${pageCount}`;
      [...thumbs.children].forEach((t, i) => t.classList.toggle('is-active', i === page - 1));
    },
  });

  function modeChip(labelText, mode, active) {
    const chip = el('button', { class: `chip${active ? ' is-active' : ''}`, type: 'button', 'aria-pressed': String(active) }, labelText);
    chip.addEventListener('click', () => {
      [...chip.parentElement.children].forEach((c) => { c.classList.toggle('is-active', c === chip); c.setAttribute('aria-pressed', String(c === chip)); });
      book.setMode(mode);
    });
    return chip;
  }

  projet.pages.forEach((page, i) => {
    thumbs.append(el('button', {
      class: `bat-thumb${i === 0 ? ' is-active' : ''}`, type: 'button',
      'aria-label': `Aller à la page ${i + 1}`,
      onclick: () => book.goToPage(i),
    }, [renderPageThumb(page, projet, { pageNumber: i + 1 }), el('span', { class: 'bat-thumb-num' }, String(i + 1))]));
  });
}

/* ---------------- Validation ---------------- */

function renderValidation(bat, zone) {
  zone.textContent = '';

  if (bat.valide) {
    zone.classList.add('is-done');
    zone.append(
      el('span', { class: 'bat-check', html: '<svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg>' }),
      el('h2', {}, 'Bon à tirer validé'),
      el('p', { class: 'lead', style: 'margin-inline:auto' },
        (bat.valideParNom ? `Merci ${bat.valideParNom}.` : 'Merci.') +
        ` Votre bon à tirer a été validé ${fmtDate(bat.valideLe) ? 'le ' + fmtDate(bat.valideLe) : 'ce jour'} — ` +
        'l\'impression peut être lancée. Nous revenons vers vous pour la suite.'),
    );
    return;
  }

  const nomInput = el('input', {
    type: 'text', id: 'bat-nom', autocomplete: 'name',
    value: `${bat.contactPrenom || ''} ${bat.contactNom || ''}`.trim(),
    placeholder: 'Votre nom',
  });

  const confirmCheck = el('input', { type: 'checkbox', id: 'bat-confirm' });

  const validateBtn = el('button', { class: 'btn btn-gold btn-lg', type: 'button', disabled: '' }, 'Je valide ce bon à tirer');
  confirmCheck.addEventListener('change', () => { validateBtn.disabled = !confirmCheck.checked; });

  validateBtn.addEventListener('click', async () => {
    validateBtn.disabled = true;
    validateBtn.textContent = 'Validation…';
    try {
      const appareil = describeDevice();
      // Lieu préchargé ; on l'attend au plus 2,5 s de plus pour ne pas bloquer.
      const lieu = await Promise.race([
        locationPromise,
        new Promise((r) => setTimeout(() => r(''), 2500)),
      ]);
      await validateBat(bat.token, nomInput.value.trim(), appareil, lieu);
      // Notifs (best-effort, sans bloquer) : l'atelier ET le client.
      notifyBatValidated({
        numero: bat.numero,
        nom: nomInput.value.trim(),
        appareil,
        lieu,
        adminUrl: new URL('admin.html', location.href).href,
      });
      confirmBatToClient({
        email: bat.contactEmail,
        prenom: bat.contactPrenom,
        numero: bat.numero,
      });
      const fresh = { ...bat, valide: true, valideParNom: nomInput.value.trim(), valideLe: new Date() };
      renderValidation(fresh, zone);
      zone.scrollIntoView({ behavior: 'smooth', block: 'center' });
      showToast('Bon à tirer validé — merci !', 'success');
    } catch (err) {
      console.error(err);
      validateBtn.disabled = false;
      validateBtn.textContent = 'Je valide ce bon à tirer';
      showToast('La validation n\'a pas pu être enregistrée — réessayez.', 'error');
    }
  });

  zone.append(
    el('h2', {}, 'Tout est parfait ?'),
    el('p', { class: 'muted', style: 'max-width:52ch;margin:0 auto var(--sp-4)' },
      'Vérifiez les prénoms, dates, lieux, textes et chants. En validant, vous nous autorisez à imprimer ' +
      'ce livret exactement tel qu\'il apparaît ici.'),
    el('div', { class: 'field', style: 'max-width:340px;margin:0 auto var(--sp-3)' }, [
      el('label', { for: 'bat-nom' }, 'Validé par'),
      nomInput,
    ]),
    el('label', { class: 'checkbox-row', style: 'max-width:420px;margin:0 auto var(--sp-4);text-align:left' }, [
      confirmCheck,
      el('span', {}, 'J\'ai relu mon livret et je confirme le bon à tirer.'),
    ]),
    validateBtn,
  );
}

main();
