/*
 * Démo animée « votre livret se crée sous vos yeux » (accueil).
 * Fausse fenêtre du configurateur dans laquelle un curseur se déplace, clique
 * et tape tout seul : prénoms, chant, style, papier, ajout au panier — en
 * boucle. Aucune vidéo : tout est DOM + CSS, léger et toujours dans la DA.
 * L'animation ne tourne que lorsque la démo est visible à l'écran, et se
 * réduit à l'état final si l'utilisateur préfère les animations réduites.
 */

import { el } from '../core/utils.js';

const DEMO_CURSOR_SVG =
  '<svg width="26" height="26" viewBox="0 0 24 24" aria-hidden="true">'
  + '<path d="M5.5 3.2 19 12.1l-6.2 1.2 3.4 6.3-2.6 1.4-3.4-6.3-4.2 4.7Z" '
  + 'fill="#1F2933" stroke="#fff" stroke-width="1.4" stroke-linejoin="round"/></svg>';

export function initDemoTuto(mount) {
  if (!mount) return;

  /* ---------------- Construction du décor ---------------- */

  const nomsVal = el('span', { class: 'demo-input-val' });
  const nomsCaret = el('span', { class: 'demo-caret' });
  const champNoms = el('div', { class: 'demo-field' }, [
    el('span', { class: 'demo-field-label' }, 'Prénoms'),
    el('span', { class: 'demo-input' }, [nomsVal, nomsCaret]),
  ]);
  const dateVal = el('span', { class: 'demo-input-val' });
  const champDate = el('div', { class: 'demo-field' }, [
    el('span', { class: 'demo-field-label' }, 'Date de la cérémonie'),
    el('span', { class: 'demo-input' }, [dateVal]),
  ]);

  const chantRows = ['Qu’exulte tout l’univers', 'Je vous salue Marie', 'Ave verum corpus'].map((nom, i) =>
    el('div', { class: 'demo-chant' }, [
      el('span', {}, nom),
      el('span', { class: 'demo-chant-add', 'data-i': String(i) }, '+'),
    ]));

  const swatches = [
    { id: 'or', c: '#A8853B' }, { id: 'bleu', c: '#33506B' }, { id: 'bordeaux', c: '#7C3A43' },
  ].map((s) => el('button', { class: 'demo-swatch', 'data-c': s.c, style: `background:${s.c}`, type: 'button', tabindex: '-1', 'aria-hidden': 'true' }));

  const papiers = [
    el('div', { class: 'demo-papier is-active' }, [el('span', { class: 'demo-papier-chip demo-papier-chip-lisse' }), 'Condat Silk']),
    el('div', { class: 'demo-papier' }, [el('span', { class: 'demo-papier-chip demo-papier-chip-grain' }), 'Old Mill']),
  ];

  const tabs = ['Infos', 'Chants', 'Style', 'Papier'].map((t, i) =>
    el('span', { class: `demo-tab${i === 0 ? ' is-active' : ''}`, 'data-tab': String(i) }, t));

  const panes = [
    el('div', { class: 'demo-pane is-active' }, [champNoms, champDate]),
    el('div', { class: 'demo-pane' }, chantRows),
    el('div', { class: 'demo-pane' }, [el('div', { class: 'demo-swatches' }, swatches)]),
    el('div', { class: 'demo-pane' }, papiers),
  ];

  const addBtn = el('span', { class: 'demo-add' }, 'Ajouter au panier');

  /* Mini livret (couverture) qui se remplit en direct. */
  const pageNoms = el('div', { class: 'demo-lv-noms' }, ' ');
  const pageDate = el('div', { class: 'demo-lv-date' }, ' ');
  const pageChant = el('div', { class: 'demo-lv-chant' });
  const livret = el('div', { class: 'demo-livret' }, [
    el('div', { class: 'demo-lv-orn' }, '❧'),
    el('div', { class: 'demo-lv-titre' }, 'Célébration du mariage'),
    pageNoms, el('div', { class: 'demo-lv-filet' }), pageDate, pageChant,
  ]);

  const cursor = el('div', { class: 'demo-cursor', html: DEMO_CURSOR_SVG });
  const toast = el('div', { class: 'demo-toast' }, '✓ Livret ajouté au panier');
  const caption = el('p', { class: 'demo-caption' }, ' ');

  const win = el('div', { class: 'demo-window' }, [
    el('div', { class: 'demo-chrome' }, [
      el('span', { class: 'demo-dot' }), el('span', { class: 'demo-dot' }), el('span', { class: 'demo-dot' }),
      el('span', { class: 'demo-url' }, 'livretsdemesse.fr/configurateur'),
    ]),
    el('div', { class: 'demo-body' }, [
      el('div', { class: 'demo-panel' }, [el('div', { class: 'demo-tabs' }, tabs), ...panes, addBtn]),
      el('div', { class: 'demo-scene' }, [livret]),
    ]),
    cursor, toast,
  ]);
  mount.append(win, caption);

  /* ---------------- Moteur d'animation ---------------- */

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  let visible = false;
  let running = false;

  const setTab = (i) => {
    tabs.forEach((t, j) => t.classList.toggle('is-active', i === j));
    panes.forEach((p, j) => p.classList.toggle('is-active', i === j));
  };

  const finalState = () => {
    nomsVal.textContent = 'Claire & Antoine';
    dateVal.textContent = '12 septembre 2026';
    pageNoms.textContent = 'Claire & Antoine';
    pageDate.textContent = 'samedi 12 septembre 2026';
    pageChant.textContent = '♪ Qu’exulte tout l’univers';
    livret.style.setProperty('--demo-accent', '#A8853B');
    caption.textContent = 'Prénoms, chants, style, papier : tout se règle en quelques clics.';
    cursor.style.display = 'none';
  };

  if (reduced) { finalState(); return; }

  /** Déplace le curseur au centre de `target` (durée ∝ distance), puis petit clic. */
  async function clickOn(target, { press = true } = {}) {
    const w = win.getBoundingClientRect();
    const t = target.getBoundingClientRect();
    const x = t.left - w.left + t.width / 2;
    const y = t.top - w.top + t.height / 2;
    const prev = cursor._pos || { x: w.width * 0.6, y: w.height * 0.75 };
    const dist = Math.hypot(x - prev.x, y - prev.y);
    const dur = Math.min(900, Math.max(350, dist * 2.2));
    cursor.style.transition = `transform ${dur}ms cubic-bezier(.33,1,.68,1)`;
    cursor.style.transform = `translate(${x}px, ${y}px)`;
    cursor._pos = { x, y };
    await sleep(dur + 80);
    if (press) {
      cursor.classList.add('is-press');
      await sleep(160);
      cursor.classList.remove('is-press');
      await sleep(120);
    }
  }

  async function typeInto(inputVal, mirror, text, { perChar = 65 } = {}) {
    for (const ch of text) {
      if (!visible) return;
      inputVal.textContent += ch;
      if (mirror) mirror.textContent = inputVal.textContent;
      await sleep(perChar + Math.random() * 45);
    }
  }

  const setCaption = (txt) => {
    caption.classList.remove('is-in');
    caption.textContent = txt;
    requestAnimationFrame(() => caption.classList.add('is-in'));
  };

  const reset = () => {
    nomsVal.textContent = ''; dateVal.textContent = '';
    pageNoms.innerHTML = '&nbsp;'; pageDate.innerHTML = '&nbsp;'; pageChant.textContent = '';
    chantRows.forEach((r) => r.classList.remove('is-added'));
    chantRows.forEach((r) => { r.querySelector('.demo-chant-add').textContent = '+'; });
    swatches.forEach((s) => s.classList.remove('is-active'));
    papiers[0].classList.add('is-active'); papiers[1].classList.remove('is-active');
    livret.classList.remove('demo-livret-grain');
    livret.style.setProperty('--demo-accent', '#33506B');
    addBtn.classList.remove('is-done'); addBtn.textContent = 'Ajouter au panier';
    toast.classList.remove('is-in');
    setTab(0);
  };

  async function scenario() {
    reset();
    setCaption('1 · Renseignez votre cérémonie — tout s’affiche en direct.');
    await sleep(600);

    await clickOn(champNoms.querySelector('.demo-input'));
    nomsCaret.classList.add('is-on');
    await typeInto(nomsVal, pageNoms, 'Claire & Antoine');
    nomsCaret.classList.remove('is-on');
    await sleep(300);

    await clickOn(champDate.querySelector('.demo-input'));
    await typeInto(dateVal, null, '12 septembre 2026', { perChar: 45 });
    pageDate.textContent = 'samedi 12 septembre 2026';
    await sleep(500);

    if (!visible) return;
    setCaption('2 · Choisissez vos chants dans la bibliothèque.');
    await clickOn(tabs[1]); setTab(1);
    await sleep(350);
    await clickOn(chantRows[0].querySelector('.demo-chant-add'));
    chantRows[0].classList.add('is-added');
    chantRows[0].querySelector('.demo-chant-add').textContent = '✓';
    pageChant.textContent = '♪ Qu’exulte tout l’univers';
    await sleep(650);

    if (!visible) return;
    setCaption('3 · Accordez le style à votre célébration.');
    await clickOn(tabs[2]); setTab(2);
    await sleep(350);
    await clickOn(swatches[0]);
    swatches[0].classList.add('is-active');
    livret.style.setProperty('--demo-accent', '#A8853B');
    await sleep(650);

    if (!visible) return;
    setCaption('4 · Touchez le papier des yeux — Condat Silk ou Old Mill.');
    await clickOn(tabs[3]); setTab(3);
    await sleep(350);
    await clickOn(papiers[1]);
    papiers[0].classList.remove('is-active'); papiers[1].classList.add('is-active');
    livret.classList.add('demo-livret-grain');
    await sleep(700);

    if (!visible) return;
    setCaption('5 · Ajoutez au panier — le BAT vous attend avant impression.');
    await clickOn(addBtn);
    addBtn.classList.add('is-done'); addBtn.textContent = '✓ Ajouté';
    toast.classList.add('is-in');
    await sleep(1800);
    toast.classList.remove('is-in');
    await sleep(700);
  }

  async function loop() {
    if (running) return;
    running = true;
    while (visible) {
      try { await scenario(); } catch { /* jamais bloquant */ }
      await sleep(400);
    }
    running = false;
  }

  new IntersectionObserver((entries) => {
    visible = entries[0].isIntersecting;
    if (visible) loop();
  }, { threshold: 0.35 }).observe(win);
}
