/*
 * Assistant « Une question ? » — bulle flottante présente sur toutes les pages.
 *
 * AUCUNE IA, aucun appel réseau : les réponses viennent exclusivement de
 * js/data/faq.js. L'assistant ne peut donc jamais inventer un prix, un délai
 * ou une promesse — il dit ce qui est écrit, ou il renvoie vers un e-mail.
 *
 * Injecté par initSite() (js/components/nav.js), sauf sur les pages internes
 * (espace privé, atelier) où il n'aurait pas de sens.
 */

import { el } from '../core/utils.js';
import { FAQ, FAQ_CATEGORIES, FAQ_SUGGESTIONS, FAQ_GREETING, searchFaq, faqById } from '../data/faq.js';

const CONTACT = 'viktor.guignard@gmail.com';
const CHAT_OPEN_KEY = 'ldm.chat.vu';   // mémorise que la bulle a déjà été ouverte

const ICON_CHAT =
  '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" '
  + 'stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'
  + '<path d="M21 11.5a8.4 8.4 0 0 1-9 8.4 9 9 0 0 1-3.6-.7L3 21l1.9-5A8.4 8.4 0 0 1 12 3a8.4 8.4 0 0 1 9 8.5Z"/></svg>';
const ICON_CLOSE =
  '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" '
  + 'stroke-width="1.9" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>';
const ICON_SEND =
  '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" '
  + 'stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'
  + '<path d="M4 12h15M13 6l6 6-6 6"/></svg>';

export function initChatbot() {
  if (document.getElementById('ldm-chat')) return;   // déjà monté

  /* ---------------- Structure ---------------- */

  const flux = el('div', { class: 'chat-flux', id: 'chat-flux', role: 'log', 'aria-live': 'polite' });

  const champ = el('input', {
    type: 'text', class: 'chat-champ', id: 'chat-champ',
    placeholder: 'Votre question…', autocomplete: 'off',
    'aria-label': 'Posez votre question',
  });
  const envoyer = el('button', {
    class: 'chat-envoyer', type: 'submit', 'aria-label': 'Envoyer la question', html: ICON_SEND,
  });
  const form = el('form', { class: 'chat-saisie' }, [champ, envoyer]);

  const panneau = el('div', {
    class: 'chat-panneau', id: 'chat-panneau', role: 'dialog',
    'aria-label': 'Assistant — questions fréquentes', 'aria-modal': 'false', hidden: '',
  }, [
    el('div', { class: 'chat-entete' }, [
      el('div', {}, [
        el('strong', {}, 'Une question ?'),
        el('span', { class: 'chat-sous' }, 'Réponses immédiates · sans robot bavard'),
      ]),
      el('button', {
        class: 'chat-fermer', type: 'button', 'aria-label': 'Fermer l’assistant',
        html: ICON_CLOSE, onclick: () => basculer(false),
      }),
    ]),
    flux,
    form,
  ]);

  const bulle = el('button', {
    class: 'chat-bulle', id: 'chat-bulle', type: 'button',
    'aria-expanded': 'false', 'aria-controls': 'chat-panneau',
    'aria-label': 'Ouvrir l’assistant — questions fréquentes',
  }, [
    el('span', { class: 'chat-bulle-icone', html: ICON_CHAT }),
    el('span', { class: 'chat-bulle-texte' }, 'Une question ?'),
  ]);

  document.body.append(el('div', { class: 'chat-racine', id: 'ldm-chat' }, [panneau, bulle]));

  /* ---------------- Rendu des messages ---------------- */

  const defiler = () => { flux.scrollTop = flux.scrollHeight; };

  function bulleMessage(cote, contenuHTML) {
    const node = el('div', { class: `chat-msg chat-msg-${cote}` });
    node.innerHTML = contenuHTML;                     // contenu maîtrisé (faq.js), jamais saisi par l'utilisateur
    flux.append(node);
    defiler();
    return node;
  }

  /** Message du visiteur — texte échappé, il n'est jamais interprété comme du HTML. */
  function messageVisiteur(texte) {
    const node = el('div', { class: 'chat-msg chat-msg-visiteur' }, texte);
    flux.append(node);
    defiler();
  }

  /** Rangée de boutons de questions (suggestions, suites, résultats multiples). */
  function propositions(ids, titre) {
    const items = ids.map(faqById).filter(Boolean);
    if (!items.length) return;
    const wrap = el('div', { class: 'chat-props' },
      titre ? [el('p', { class: 'chat-props-titre' }, titre)] : []);
    items.forEach((item) => {
      wrap.append(el('button', {
        class: 'chat-chip', type: 'button',
        onclick: () => { messageVisiteur(item.q); repondre(item); },
      }, item.q));
    });
    flux.append(wrap);
    defiler();
  }

  /** Affiche LA réponse d'une fiche, puis ses questions de suite. */
  function repondre(item) {
    typing(() => {
      bulleMessage('bot', item.a);
      if (item.suite?.length) propositions(item.suite, 'Sur le même sujet :');
    });
  }

  /** Petite pause + points animés : rend l'échange lisible plutôt qu'instantané. */
  function typing(apres) {
    const node = bulleMessage('bot', '<span class="chat-points"><i></i><i></i><i></i></span>');
    node.classList.add('is-typing');
    setTimeout(() => { node.remove(); apres(); }, 420);
  }

  /** Aucune réponse trouvée : on l'assume et on renvoie vers un humain. */
  function repondreInconnu(question) {
    typing(() => {
      bulleMessage('bot',
        'Je n’ai pas de réponse toute prête à cette question — je préfère vous le dire '
        + 'plutôt que d’inventer.<br><br>Écrivez-nous à <a href="mailto:' + CONTACT
        + '?subject=' + encodeURIComponent('Question depuis le site')
        + '&body=' + encodeURIComponent(question ? `Bonjour,\n\n${question}\n\n` : '')
        + '">' + CONTACT + '</a> : nous répondons sous 24 h ouvrées.');
      montrerCategories();
    });
  }

  /** Sommaire par thème — le visiteur explore quand il ne sait pas quoi demander. */
  function montrerCategories() {
    const wrap = el('div', { class: 'chat-props' }, [
      el('p', { class: 'chat-props-titre' }, 'Ou parcourez par thème :'),
    ]);
    FAQ_CATEGORIES.forEach((cat) => {
      wrap.append(el('button', {
        class: 'chat-chip chat-chip-cat', type: 'button',
        onclick: () => { messageVisiteur(cat.label); montrerCategorie(cat); },
      }, cat.label));
    });
    flux.append(wrap);
    defiler();
  }

  function montrerCategorie(cat) {
    const ids = FAQ.filter((f) => f.cat === cat.id).map((f) => f.id);
    typing(() => {
      bulleMessage('bot', `<strong>${cat.label}</strong> — voici les questions les plus posées :`);
      propositions(ids);
    });
  }

  /* ---------------- Traitement d'une question libre ---------------- */

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const question = champ.value.trim();
    if (!question) return;
    champ.value = '';
    messageVisiteur(question);

    const trouvees = searchFaq(question, 3);
    if (!trouvees.length) { repondreInconnu(question); return; }

    repondre(trouvees[0]);
    // Les suivantes ne sont proposées que si elles sont vraiment plausibles.
    const autres = trouvees.slice(1).map((f) => f.id);
    if (autres.length) setTimeout(() => propositions(autres, 'Vouliez-vous plutôt dire :'), 460);
  });

  /* ---------------- Ouverture / fermeture ---------------- */

  let ouvert = false;
  let amorce = false;

  function basculer(vers) {
    ouvert = vers ?? !ouvert;
    panneau.hidden = !ouvert;
    bulle.setAttribute('aria-expanded', String(ouvert));
    bulle.classList.toggle('is-ouvert', ouvert);
    document.getElementById('ldm-chat').classList.toggle('is-ouvert', ouvert);

    if (ouvert) {
      if (!amorce) {
        amorce = true;
        bulleMessage('bot', FAQ_GREETING);
        propositions(FAQ_SUGGESTIONS);
        montrerCategories();
        try { localStorage.setItem(CHAT_OPEN_KEY, '1'); } catch { /* navigation privée */ }
      }
      // Sur mobile, on évite d'ouvrir le clavier d'emblée : le visiteur clique souvent une suggestion.
      if (window.matchMedia('(min-width: 720px)').matches) champ.focus();
    } else {
      bulle.focus();
    }
  }

  bulle.addEventListener('click', () => basculer());
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && ouvert) basculer(false); });

  // Le libellé « Une question ? » n'est déployé que pour un nouveau visiteur ;
  // ensuite la bulle reste discrète, réduite à son icône.
  try {
    if (localStorage.getItem(CHAT_OPEN_KEY)) bulle.classList.add('is-discret');
  } catch { /* navigation privée : on garde le libellé */ }
}
