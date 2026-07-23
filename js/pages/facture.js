/*
 * Facture en ligne (publique par jeton, comme le BAT) — le client consulte sa
 * facture et l'enregistre en PDF via la boîte d'impression (texte vectoriel,
 * pas de rastérisation). Émise par Imprigraphic (FACTURE_EMETTEUR).
 */

import { qs, el, getParam } from '../core/utils.js';
import { getFacture } from '../core/firebase.js';
import { FACTURE_EMETTEUR } from '../core/api.js';

const token = getParam('f');
const euro = (n) => `${(n || 0).toFixed(2).replace('.', ',')} €`;

function show(id) {
  ['fac-loading', 'fac-error', 'fac-view'].forEach((k) => { qs('#' + k).hidden = k !== id; });
}

function fmtDate(ts) {
  const d = ts?.toDate ? ts.toDate() : (ts ? new Date(ts) : null);
  return d ? d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : '';
}

function render(fac) {
  document.title = `Facture ${fac.numero} — Livrets de messe`;
  const E = FACTURE_EMETTEUR;

  qs('#fac-sheet').append(
    /* --- En-tête émetteur / numéro --- */
    el('header', { class: 'fac-head' }, [
      el('div', {}, [
        el('div', { class: 'fac-brand' }, E.nom),
        el('div', { class: 'fac-sub' }, E.soustitre),
        el('div', { class: 'fac-coords small' }, [
          E.adresse, el('br'), `Tél. ${E.tel} · ${E.email}`,
        ]),
      ]),
      el('div', { class: 'fac-meta' }, [
        el('div', { class: 'fac-title' }, 'FACTURE'),
        el('div', { class: 'fac-num' }, fac.numero),
        el('div', { class: 'small' }, `Émise le ${fmtDate(fac.creeLe)}`),
        fac.commandeNumero ? el('div', { class: 'small' }, `Commande ${fac.commandeNumero}`) : null,
      ]),
    ]),

    /* --- Client --- */
    el('div', { class: 'fac-client' }, [
      el('div', { class: 'fac-label' }, 'Facturé à'),
      el('div', {}, [el('strong', {}, `${fac.client?.prenom || ''} ${fac.client?.nom || ''}`.trim() || '—')]),
      fac.client?.email ? el('div', { class: 'small' }, fac.client.email) : null,
    ]),

    /* --- Lignes --- */
    el('table', { class: 'fac-table' }, [
      el('thead', {}, [el('tr', {}, [el('th', {}, 'Désignation'), el('th', {}, 'Montant TTC')])]),
      el('tbody', {}, (fac.lignes || []).map((l) => el('tr', {}, [
        el('td', {}, l.label),
        el('td', {}, euro(l.ttc)),
      ]))),
    ]),

    /* --- Totaux --- */
    el('div', { class: 'fac-totaux' }, [
      el('div', {}, [el('span', {}, 'Total HT'), el('strong', {}, euro(fac.totalHT))]),
      el('div', {}, [el('span', {}, 'TVA 20 %'), el('strong', {}, euro(fac.tva))]),
      el('div', { class: 'fac-ttc' }, [el('span', {}, 'Total TTC'), el('strong', {}, euro(fac.totalTTC))]),
    ]),

    /* --- Acquittement --- */
    el('p', { class: 'fac-acquit' },
      `Facture acquittée le ${fmtDate(fac.payeeLe)} — règlement par carte bancaire (Stripe). ` +
      'Nous vous remercions de votre confiance.'),

    /* --- Pied légal --- */
    el('footer', { class: 'fac-footer small' }, [
      el('div', {}, `${E.nom} — ${E.mentions}`),
      el('div', {}, E.tva),
      el('div', { class: 'muted' }, '« Livrets de messe » — service imaginé et imprimé par Imprigraphic, créé par VIKTO LABS · livretsdemesse.fr'),
    ]),
  );

  qs('#fac-download').addEventListener('click', () => window.print());
  show('fac-view');
}

async function main() {
  if (!token) { show('fac-error'); return; }
  try {
    const fac = await getFacture(token);
    if (!fac || !fac.numero) { show('fac-error'); return; }
    render(fac);
  } catch (err) {
    console.error(err);
    show('fac-error');
  }
}

main();
