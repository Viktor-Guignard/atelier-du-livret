/* Page Panier : plusieurs livrets, options par ligne, code de reprise, devis groupé. */

import { initSite } from '../components/nav.js';
import { el, qs } from '../core/utils.js';
import { estimateOrder, pagesImprimees, papierId, TARIFS } from '../core/api.js';
import { renderPageThumb } from '../components/pageRenderer.js';
import { categorieById } from '../data/categories.js';
import { ORNAMENTS } from '../components/ornaments.js';
import { showToast } from '../components/toast.js';
import { cartItems, updateItem, removeItem, clearCart, recoverCart, cartCode } from '../core/cart.js';

initSite({ active: 'panier' });

const root = qs('#panier-root');
const euro = (n) => `${(n || 0).toFixed(2).replace('.', ',')} €`;

const lineEstimate = (item) => estimateOrder({
  format: item.commande.format,
  papier: item.commande.papier,
  quantite: item.commande.quantite,
  nbPages: item.projet?.pages?.length || 8,
  options: item.commande.options || [],
});

const cartTotal = () => cartItems().reduce((s, it) => s + (lineEstimate(it).total || 0), 0);

/* ---------------- Rendu ---------------- */

function render() {
  root.textContent = '';
  const items = cartItems();

  if (!items.length) {
    root.append(
      el('div', { class: 'panier-vide' }, [
        el('span', { class: 'vide-icon', html: ORNAMENTS.livre }),
        el('h2', {}, 'Votre panier est vide'),
        el('p', { class: 'lead', style: 'margin:0 auto var(--sp-5)' },
          'Choisissez un modèle et personnalisez votre premier livret : il apparaîtra ici, prêt à être commandé.'),
        el('a', { class: 'btn btn-gold btn-lg', href: 'categories.html' }, 'Choisir un modèle'),
      ]),
      recoverBox(),
    );
    return;
  }

  const grid = el('div', { class: 'panier-grid' });
  const totalEl = el('strong', { class: 'panier-total-val' }, euro(cartTotal()));
  const refreshTotal = () => { totalEl.textContent = euro(cartTotal()); };

  items.forEach((item) => grid.append(renderItem(item, refreshTotal)));

  root.append(
    el('div', { class: 'panier-layout' }, [
      el('div', {}, [
        el('div', { class: 'panier-count small muted' },
          `${items.length} livret${items.length > 1 ? 's' : ''} dans votre panier`),
        grid,
      ]),
      el('aside', { class: 'panier-summary' }, [
        el('h2', {}, 'Récapitulatif'),
        el('div', { class: 'panier-total' }, [el('span', {}, 'Total estimé TTC'), totalEl]),
        el('p', { class: 'small muted', style: 'margin:0 0 var(--sp-4)' },
          `BAT et accompagnement inclus · devis ferme ${TARIFS.validiteDevisJours} jours. Le montant définitif figure sur votre devis.`),
        el('a', { class: 'btn btn-gold btn-lg', href: 'commande.html', style: 'width:100%' }, 'Demander un devis groupé'),
        el('a', { class: 'btn btn-ghost btn-sm', href: 'categories.html', style: 'width:100%;margin-top:var(--sp-3)' }, 'Continuer ma sélection'),
        el('button', {
          class: 'btn btn-light btn-sm panier-vider', type: 'button', style: 'width:100%;margin-top:var(--sp-3)',
          onclick: () => {
            if (!confirm('Vider tout le panier ? Cette action retire tous les livrets.')) return;
            clearCart();
            showToast('Panier vidé.', 'success');
            render();
          },
        }, 'Vider le panier'),
        codeBox(),
      ]),
    ]),
    recoverBox(),
  );
}

function renderItem(item, refreshTotal) {
  const projet = item.projet;
  const categorie = categorieById(projet.categorieId);
  const priceEl = el('strong', { class: 'panier-item-price' }, euro(lineEstimate(item).total));

  const onChange = () => { priceEl.textContent = euro(lineEstimate(item).total); refreshTotal(); };

  const qte = el('input', {
    type: 'number', min: String(TARIFS.minQuantite), max: '5000', step: '5',
    value: String(item.commande.quantite), inputmode: 'numeric', 'aria-label': 'Quantité',
  });
  qte.addEventListener('input', () => {
    const v = Math.max(TARIFS.minQuantite, parseInt(qte.value, 10) || 0);
    item.commande.quantite = v;
    updateItem(item.id, { quantite: v });
    onChange();
  });

  // A5 uniquement (format du devis Imprigraphic) — l'impression se fait en
  // cahiers piqués : toujours un multiple de 4 pages, minimum 12.
  const nbImprime = pagesImprimees(projet.pages.length);
  const impression = el('div', { class: 'panier-item-print', 'aria-label': 'Impression' },
    `A5 · ${nbImprime} pages`);

  const papierActuel = papierId(item.commande.papier);
  const papier = el('select', { 'aria-label': 'Papier' },
    Object.entries(TARIFS.papiers).map(([id, p]) =>
      el('option', { value: id, selected: papierActuel === id ? '' : null }, p.nom)));

  // Voir le papier choisi : vignette de la texture réelle + lien vers la page matière.
  const papierSwatch = el('span', { class: 'papier-swatch-mini', 'aria-hidden': 'true' });
  const majPapierSwatch = () => { papierSwatch.style.backgroundImage = `url("${TARIFS.papiers[papier.value].photo}")`; };
  majPapierSwatch();
  const papierLiens = el('div', { class: 'papier-apercu' }, [
    papierSwatch,
    el('a', { class: 'small', href: 'papiers.html' }, 'Voir la matière de près'),
  ]);
  papier.addEventListener('change', () => { item.commande.papier = papier.value; updateItem(item.id, { papier: papier.value }); majPapierSwatch(); onChange(); });

  const bat = el('input', { type: 'checkbox', ...(item.commande.bat ? { checked: '' } : {}) });
  bat.addEventListener('change', () => { item.commande.bat = bat.checked; updateItem(item.id, { bat: bat.checked }); });

  return el('article', { class: 'panier-item' }, [
    el('div', { class: 'panier-item-cover' }, [renderPageThumb(projet.pages[0], projet, { pageNumber: 1 })]),
    el('div', { class: 'panier-item-body' }, [
      el('div', { class: 'panier-item-head' }, [
        el('div', {}, [
          el('span', { class: 'badge' }, categorie?.nom || 'Cérémonie'),
          el('h3', {}, projet.nom),
          el('p', { class: 'small muted' }, `${projet.pages.length} page${projet.pages.length > 1 ? 's' : ''} créée${projet.pages.length > 1 ? 's' : ''}`
            + (nbImprime > projet.pages.length ? ` · imprimé en ${nbImprime} pages (cahiers de 4)` : '')
            + ` · réf. ${projet.id}`),
        ]),
        priceEl,
      ]),
      el('div', { class: 'panier-item-opts' }, [
        el('label', {}, ['Quantité', qte]),
        el('label', {}, ['Papier', papier]),
        el('label', {}, ['Impression', impression]),
      ]),
      papierLiens,
      el('label', { class: 'checkbox-row panier-item-bat' }, [bat, el('span', {}, 'Bon à tirer avant impression (recommandé)')]),
      el('div', { class: 'panier-item-actions' }, [
        el('a', { class: 'btn btn-ghost btn-sm', href: `configurateur.html?projet=${projet.id}` }, 'Modifier le contenu'),
        el('button', {
          class: 'btn-link-danger', type: 'button',
          onclick: () => {
            removeItem(item.id);
            showToast('Livret retiré du panier.', 'success');
            render();
          },
        }, 'Retirer'),
      ]),
    ]),
  ]);
}

/* ---------------- Code de reprise ---------------- */

function codeBox() {
  const code = cartCode();
  if (!code) return null;
  return el('div', { class: 'panier-code' }, [
    el('p', { class: 'small', style: 'margin:0 0 6px' }, [el('strong', {}, 'Votre code panier')]),
    el('div', { class: 'panier-code-row' }, [
      el('code', { class: 'panier-code-val' }, code),
      el('button', {
        class: 'btn btn-light btn-sm', type: 'button',
        onclick: async () => {
          try { await navigator.clipboard.writeText(code); showToast('Code copié.', 'success'); }
          catch { showToast('Copie impossible — notez le code à la main.', 'error'); }
        },
      }, 'Copier'),
    ]),
    el('p', { class: 'small muted', style: 'margin:8px 0 0' },
      'Notez ce code : il vous permet de retrouver ce panier sur un autre appareil, sans créer de compte.'),
  ]);
}

function recoverBox() {
  const input = el('input', { type: 'text', placeholder: 'PAN-XXXXXX', 'aria-label': 'Code panier', autocapitalize: 'characters', spellcheck: 'false' });
  const btn = el('button', { class: 'btn btn-ghost btn-sm', type: 'button' }, 'Reprendre ce panier');
  btn.addEventListener('click', async () => {
    const val = input.value.trim();
    if (!val) { input.focus(); return; }
    // Reprendre REMPLACE le panier courant : confirmer s'il n'est pas vide (comme « Vider »).
    if (cartItems().length && !confirm('Reprendre ce panier remplacera les livrets actuellement dans votre panier. Continuer ?')) return;
    btn.disabled = true; const label = btn.textContent; btn.textContent = 'Recherche…';
    const res = await recoverCart(val);
    btn.disabled = false; btn.textContent = label;
    if (res.ok) {
      showToast(`Panier repris : ${res.items.length} livret${res.items.length > 1 ? 's' : ''}.`, 'success');
      render();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      showToast(res.reason === 'introuvable' ? 'Aucun panier pour ce code.' : 'Reprise impossible — réessayez.', 'error');
    }
  });
  input.addEventListener('keydown', (e) => { if (e.key === 'Enter') btn.click(); });

  return el('div', { class: 'panier-recover' }, [
    el('h3', {}, 'Reprendre un panier'),
    el('p', { class: 'small muted', style: 'margin:0 auto var(--sp-3);max-width:46ch' },
      'Vous avez un code panier ? Saisissez-le pour retrouver votre sélection.'),
    el('div', { class: 'panier-recover-row' }, [input, btn]),
  ]);
}

render();

// Un AUTRE onglet modifie le panier (l'event 'storage' ne se déclenche pas dans
// l'onglet auteur) → on resynchronise l'affichage sans perdre le focus courant.
window.addEventListener('storage', (e) => { if (e.key === 'ldm.panier') render(); });
