/* Header + footer partagés, injectés sur toutes les pages. initSite({active}) */

import { el, qs } from '../core/utils.js';
import { CATEGORIES } from '../data/categories.js';
import { itemCount, onCartChange } from '../core/cart.js';

const BRAND_MARK =
  '<svg width="34" height="34" viewBox="0 0 48 48" fill="none" stroke="currentColor" ' +
  'stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
  '<path d="M24 13c-4-3-10-3.5-15-2v26c5-1.5 11-1 15 2 4-3 10-3.5 15-2V11c-5-1.5-11-1-15 2Z"/>' +
  '<path d="M24 13v26M24 5v4M21 7h6"/></svg>';

const CART_ICON =
  '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
  'stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
  '<path d="M6 8h12l-1 12H7L6 8Z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/></svg>';

/* Pages cérémonie (SEO) — cibles des liens du pied de page et de l'accueil. */
export const CEREMONIE_PAGES = {
  'bapteme': 'livret-messe-bapteme.html',
  'communion': 'livret-messe-communion.html',
  'profession-foi': 'livret-messe-profession-de-foi.html',
  'confirmation': 'livret-messe-confirmation.html',
  'mariage': 'livret-messe-mariage.html',
  'funerailles': 'livret-messe-funerailles.html',
  'messe-anniversaire': 'livret-messe-anniversaire.html',
  'jubile': 'livret-messe-jubile.html',
};

const NAV_LINKS = [
  { href: 'index.html', label: 'Accueil', id: 'accueil' },
  { href: 'categories.html', label: 'Cérémonies', id: 'categories' },
  { href: 'modeles.html', label: 'Modèles', id: 'modeles' },
  { href: 'index.html#fonctionnement', label: 'Comment ça marche', id: 'fonctionnement' },
];

/** Lien « Panier » avec pastille de compteur, réactif aux changements du panier. */
function cartLink(active) {
  const label = (n) => `Panier — ${n} livret${n > 1 ? 's' : ''}`;
  const n0 = itemCount();
  const badge = el('span', { class: 'cart-badge', 'aria-hidden': 'true' }, String(n0));
  const link = el('a', {
    class: 'cart-link' + (active === 'panier' ? ' is-active' : '') + (n0 ? ' has-items' : ''),
    href: 'panier.html', 'aria-label': label(n0),
  }, [el('span', { class: 'cart-icon', html: CART_ICON }), badge]);

  onCartChange((cart) => {
    const n = cart.items.length;
    badge.textContent = String(n);
    link.classList.toggle('has-items', n > 0);
    link.setAttribute('aria-label', label(n));
  });
  return link;
}

export function initSite({ active = '' } = {}) {
  /* ---------------- Header ---------------- */
  const header = el('header', { class: 'site-header' }, [
    el('div', { class: 'container site-header-inner' }, [
      el('a', { class: 'brand', href: 'index.html', 'aria-label': 'Livrets de messe — accueil' }, [
        el('span', { class: 'brand-mark', html: BRAND_MARK }),
        el('span', {}, [
          el('span', { class: 'brand-name' }, 'Livrets de messe'),
          el('span', { class: 'brand-tagline' }, 'Personnalisés · imprimés en France'),
        ]),
      ]),
      el('div', { class: 'site-header-right' }, [
        el('nav', { class: 'site-nav', id: 'site-nav', 'aria-label': 'Navigation principale' }, [
          ...NAV_LINKS.map((link) =>
            el('a', { href: link.href, class: active === link.id ? 'is-active' : null }, link.label)),
          el('a', { class: 'btn btn-gold btn-sm', href: 'categories.html' }, 'Créer mon livret'),
        ]),
        cartLink(active),
        el('button', {
          class: 'nav-toggle', 'aria-expanded': 'false', 'aria-controls': 'site-nav',
          'aria-label': 'Ouvrir le menu',
          html: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16"/></svg>',
          onclick: (e) => {
            const nav = qs('#site-nav');
            const open = nav.classList.toggle('is-open');
            e.currentTarget.setAttribute('aria-expanded', String(open));
            e.currentTarget.setAttribute('aria-label', open ? 'Fermer le menu' : 'Ouvrir le menu');
          },
        }),
      ]),
    ]),
  ]);

  const skip = el('a', { class: 'skip-link', href: '#main' }, 'Aller au contenu');
  document.body.prepend(skip, header);

  // Fermer le menu mobile au clic sur un lien.
  header.addEventListener('click', (e) => {
    if (e.target.closest('.site-nav a')) {
      qs('#site-nav').classList.remove('is-open');
      qs('.nav-toggle').setAttribute('aria-expanded', 'false');
    }
  });

  /* ---------------- Footer ---------------- */
  const footer = el('footer', { class: 'site-footer' }, [
    el('div', { class: 'container' }, [
      el('div', { class: 'footer-grid' }, [
        el('div', { class: 'footer-brand' }, [
          el('span', { class: 'brand', style: 'color:#F5F1E6' }, [
            el('span', { class: 'brand-mark', html: BRAND_MARK }),
            el('span', { class: 'brand-name' }, 'Livrets de messe'),
          ]),
          el('p', { class: 'small', style: 'margin-top:12px;max-width:34ch' },
            'Des livrets de célébration élégants, personnalisés en ligne et imprimés avec soin en France.'),
        ]),
        el('div', {}, [
          el('h4', {}, 'Cérémonies'),
          el('ul', {}, CATEGORIES.slice(0, 4).map((c) =>
            el('li', {}, [el('a', { href: CEREMONIE_PAGES[c.id] || `modeles.html?categorie=${c.id}` }, c.nom)]))),
        ]),
        el('div', {}, [
          el('h4', {}, ' '),
          el('ul', {}, CATEGORIES.slice(4).map((c) =>
            el('li', {}, [el('a', { href: CEREMONIE_PAGES[c.id] || `modeles.html?categorie=${c.id}` }, c.nom)]))),
        ]),
        el('div', {}, [
          el('h4', {}, 'Le service'),
          el('ul', {}, [
            el('li', {}, [el('a', { href: 'index.html#fonctionnement' }, 'Comment ça marche')]),
            el('li', {}, [el('a', { href: 'modeles.html' }, 'Tous les modèles')]),
            el('li', {}, [el('a', { href: 'papiers.html' }, 'Nos papiers')]),
            el('li', {}, [el('a', { href: 'categories.html' }, 'Créer mon livret')]),
            el('li', {}, [el('a', { href: 'commande.html' }, 'Demander un devis')]),
          ]),
        ]),
      ]),
      el('div', { class: 'footer-bottom' }, [
        el('span', {}, `© ${new Date().getFullYear()} Livrets de messe — créé par VIKTO LABS · imaginé et imprimé par Imprigraphic`),
        el('a', { href: 'confidentialite.html' }, 'Confidentialité & données'),
        el('span', {}, 'Textes liturgiques contemporains : à insérer selon votre licence SECLI.'),
      ]),
    ]),
  ]);
  document.body.append(footer);
}
