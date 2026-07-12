/* Header + footer partagés, injectés sur toutes les pages. initSite({active}) */

import { el, qs } from '../core/utils.js';
import { CATEGORIES } from '../data/categories.js';

const BRAND_MARK =
  '<svg width="34" height="34" viewBox="0 0 48 48" fill="none" stroke="currentColor" ' +
  'stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
  '<path d="M24 13c-4-3-10-3.5-15-2v26c5-1.5 11-1 15 2 4-3 10-3.5 15-2V11c-5-1.5-11-1-15 2Z"/>' +
  '<path d="M24 13v26M24 5v4M21 7h6"/></svg>';

const NAV_LINKS = [
  { href: 'index.html', label: 'Accueil', id: 'accueil' },
  { href: 'categories.html', label: 'Cérémonies', id: 'categories' },
  { href: 'modeles.html', label: 'Modèles', id: 'modeles' },
  { href: 'index.html#fonctionnement', label: 'Comment ça marche', id: 'fonctionnement' },
];

export function initSite({ active = '' } = {}) {
  /* ---------------- Header ---------------- */
  const header = el('header', { class: 'site-header' }, [
    el('div', { class: 'container site-header-inner' }, [
      el('a', { class: 'brand', href: 'index.html', 'aria-label': "L'Atelier du Livret — accueil" }, [
        el('span', { class: 'brand-mark', html: BRAND_MARK }),
        el('span', {}, [
          el('span', { class: 'brand-name' }, "L'Atelier du Livret"),
          el('span', { class: 'brand-tagline' }, 'Livrets de messe personnalisés'),
        ]),
      ]),
      el('nav', { class: 'site-nav', id: 'site-nav', 'aria-label': 'Navigation principale' }, [
        ...NAV_LINKS.map((link) =>
          el('a', { href: link.href, class: active === link.id ? 'is-active' : null }, link.label)),
        el('a', { class: 'btn btn-gold btn-sm', href: 'categories.html' }, 'Créer mon livret'),
      ]),
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
            el('span', { class: 'brand-name' }, "L'Atelier du Livret"),
          ]),
          el('p', { class: 'small', style: 'margin-top:12px;max-width:34ch' },
            'Des livrets de célébration élégants, personnalisés en ligne et imprimés avec soin en France.'),
        ]),
        el('div', {}, [
          el('h4', {}, 'Cérémonies'),
          el('ul', {}, CATEGORIES.slice(0, 4).map((c) =>
            el('li', {}, [el('a', { href: `modeles.html?categorie=${c.id}` }, c.nom)]))),
        ]),
        el('div', {}, [
          el('h4', {}, ' '),
          el('ul', {}, CATEGORIES.slice(4).map((c) =>
            el('li', {}, [el('a', { href: `modeles.html?categorie=${c.id}` }, c.nom)]))),
        ]),
        el('div', {}, [
          el('h4', {}, 'Le service'),
          el('ul', {}, [
            el('li', {}, [el('a', { href: 'index.html#fonctionnement' }, 'Comment ça marche')]),
            el('li', {}, [el('a', { href: 'modeles.html' }, 'Tous les modèles')]),
            el('li', {}, [el('a', { href: 'categories.html' }, 'Créer mon livret')]),
            el('li', {}, [el('a', { href: 'commande.html' }, 'Demander un devis')]),
          ]),
        ]),
      ]),
      el('div', { class: 'footer-bottom' }, [
        el('span', {}, `© ${new Date().getFullYear()} L'Atelier du Livret — site de démonstration.`),
        el('span', {}, 'Textes liturgiques contemporains : à insérer selon votre licence SECLI.'),
      ]),
    ]),
  ]);
  document.body.append(footer);
}
