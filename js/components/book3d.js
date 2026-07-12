/*
 * Livre 3D interactif.
 *   createBook3D(container, pagesProvider, opts) → api
 *
 * - pagesProvider() renvoie les éléments .lv-page (déjà stylés) dans l'ordre.
 * - Feuilletage : clic sur une page (droite → suivante, gauche → précédente),
 *   flèches clavier, ou API next()/prev()/goToPage().
 * - Rotation : glisser (drag) sur la scène. Double-clic : réinitialise la vue.
 * - Zoom : molette / pincement (trackpad) ou setZoom().
 * - Modes : '3d' (livre), 'double' (planche à plat), 'simple' (page à page).
 */

import { el, clamp } from '../core/utils.js';

const FLIP_MS = 900;

export function createBook3D(container, pagesProvider, opts = {}) {
  const state = {
    mode: opts.mode || '3d',
    spread: opts.startSpread || 0,   // nombre de feuilles tournées (0 = fermé)
    page: 0,                         // page courante en mode 'simple'
    zoom: 1,
    rotX: 12,
    rotY: -14,
    leaves: [],
    pageCount: 0,
    destroyed: false,
  };

  /* ---------------- Structure DOM ---------------- */

  const world = el('div', { class: 'book3d-world' });
  const book = el('div', { class: 'book3d-book' });
  const flat = el('div', { class: 'book3d-flat' }, [el('div', { class: 'book3d-flat-inner' })]);
  const flatInner = flat.firstChild;
  const stage = el('div', {
    class: 'book3d-stage',
    'data-mode': state.mode,
    tabindex: '0',
    role: 'group',
    'aria-label': 'Aperçu interactif du livret — utilisez les flèches pour feuilleter',
  }, [world, flat]);
  world.append(book);
  container.append(stage);

  /* Taille du livre : ~72 % de la hauteur de la scène, bornée. */
  function sizeBook() {
    const h = stage.clientHeight;
    if (h > 0) book.style.height = `${Math.round(clamp(h * .72, 220, 620))}px`;
  }
  const resizeObserver = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(sizeBook) : null;
  resizeObserver?.observe(stage);

  const emit = () => opts.onChange?.({
    spread: state.spread,
    spreadCount: state.leaves.length,
    page: currentPageNumber(),
    pageCount: state.pageCount,
    mode: state.mode,
    zoom: state.zoom,
  });

  /* ---------------- Construction des feuilles ---------------- */

  function build() {
    sizeBook();
    const pages = pagesProvider();
    state.pageCount = pages.length;

    // Nombre pair de pages : la dernière feuille a toujours un verso.
    if (pages.length % 2 === 1) {
      const blank = el('article', { class: 'lv-page', 'aria-hidden': 'true' });
      if (pages[0]) blank.style.cssText = pages[0].style.cssText;
      pages.push(blank);
    }

    book.querySelectorAll('.book3d-leaf, .book3d-edge').forEach((n) => n.remove());
    state.leaves = [];

    for (let i = 0; i < pages.length / 2; i++) {
      const leaf = el('div', { class: `book3d-leaf${i === 0 ? ' book3d-leaf--cover' : ''}`, 'data-leaf': i }, [
        el('div', { class: 'book3d-face book3d-face--front' }, [pages[2 * i]]),
        el('div', { class: 'book3d-face book3d-face--back' }, [pages[2 * i + 1]]),
      ]);
      book.append(leaf);
      state.leaves.push(leaf);
    }

    // Tranche du bloc de pages, visible livre fermé.
    const edge = el('div', { class: 'book3d-edge' });
    book.append(edge);
    state.edge = edge;

    state.spread = clamp(state.spread, 0, state.leaves.length);
    state.page = clamp(state.page, 0, state.pageCount - 1);
    applySpread(true);
    renderFlat();
    applyWorld();
  }

  /* ---------------- Mode 3D : positions ---------------- */

  function applySpread(instant = false) {
    const n = state.leaves.length;
    state.leaves.forEach((leaf, i) => {
      const flipped = i < state.spread;
      if (instant) {
        const t = leaf.style.transition;
        leaf.style.transition = 'none';
        leaf.classList.toggle('is-flipped', flipped);
        void leaf.offsetWidth;
        leaf.style.transition = t;
      } else {
        leaf.classList.toggle('is-flipped', flipped);
      }
      // Empilement : feuilles non tournées au-dessus à droite, tournées à gauche.
      leaf.style.zIndex = flipped ? (i + 1) : (n - i);
      // Légère épaisseur du bloc.
      leaf.style.transform = leaf.classList.contains('is-flipped')
        ? `rotateY(-180deg) translateZ(${(state.spread - i) * .5}px)`
        : `translateZ(${(i - state.spread) * -.5}px)`;
    });

    // Livre fermé → décalé pour rester centré ; ouvert en fin → inversement.
    const shift = state.spread === 0 ? -25 : (state.spread === n ? 25 : 0);
    book.style.transform = `translateX(${shift}%)`;
    state.edge?.classList.toggle('is-visible', state.spread === 0 && n > 1);
  }

  function raiseDuring(leaf) {
    leaf.style.zIndex = state.leaves.length + 2;
    setTimeout(() => { if (!state.destroyed) applySpread(); }, FLIP_MS + 40);
  }

  function goToSpread(s) {
    s = clamp(s, 0, state.leaves.length);
    if (s === state.spread) return;
    const leaf = state.leaves[Math.min(s, state.spread)];
    state.spread = s;
    applySpread();
    if (leaf) raiseDuring(leaf);
    emit();
  }

  /* ---------------- Modes à plat ---------------- */

  function renderFlat() {
    flatInner.textContent = '';
    if (state.mode === 'double') {
      // Planches : couverture seule, puis doubles pages (2-3, 4-5…).
      const pages = pagesProvider();
      const start = state.spread === 0 ? 0 : state.spread * 2 - 1;
      const shown = state.spread === 0
        ? [pages[0]]
        : [pages[start], pages[start + 1]].filter(Boolean);
      flatInner.append(...shown);
    } else if (state.mode === 'simple') {
      const pages = pagesProvider();
      if (pages[state.page]) flatInner.append(pages[state.page]);
    }
    flatInner.style.transform = `scale(${state.zoom})`;
  }

  /* ---------------- Vue (rotation / zoom) ---------------- */

  function applyWorld() {
    world.style.transform =
      `scale(${state.zoom}) rotateX(${state.rotX}deg) rotateY(${state.rotY}deg)`;
  }

  function setZoom(z) {
    state.zoom = clamp(z, .5, 2.6);
    if (state.mode === '3d') applyWorld();
    else flatInner.style.transform = `scale(${state.zoom})`;
    emit();
  }

  function resetView() {
    state.rotX = 12; state.rotY = -14; state.zoom = 1;
    applyWorld();
    if (state.mode !== '3d') renderFlat();
    emit();
  }

  /* ---------------- Navigation ---------------- */

  function currentPageNumber() {
    if (state.mode === 'simple') return state.page + 1;
    return state.spread === 0 ? 1 : Math.min(state.spread * 2, state.pageCount);
  }

  function next() {
    if (state.mode === 'simple') { state.page = clamp(state.page + 1, 0, state.pageCount - 1); renderFlat(); emit(); }
    else if (state.mode === 'double') { state.spread = clamp(state.spread + 1, 0, state.leaves.length); renderFlat(); emit(); }
    else goToSpread(state.spread + 1);
  }

  function prev() {
    if (state.mode === 'simple') { state.page = clamp(state.page - 1, 0, state.pageCount - 1); renderFlat(); emit(); }
    else if (state.mode === 'double') { state.spread = clamp(state.spread - 1, 0, state.leaves.length); renderFlat(); emit(); }
    else goToSpread(state.spread - 1);
  }

  function goToPage(index) {
    index = clamp(index, 0, state.pageCount - 1);
    state.page = index;
    const spread = index === 0 ? 0 : Math.floor((index + 1) / 2);
    if (state.mode === '3d') goToSpread(spread);
    else { state.spread = spread; renderFlat(); emit(); }
  }

  function setMode(mode) {
    if (!['3d', 'double', 'simple'].includes(mode) || mode === state.mode) return;
    // Conserver la position de lecture entre les modes.
    const page = currentPageNumber() - 1;
    state.mode = mode;
    stage.dataset.mode = mode;
    if (mode === 'simple') state.page = page;
    if (mode === '3d') { applySpread(true); applyWorld(); }
    else renderFlat();
    emit();
  }

  /* ---------------- Interactions ---------------- */

  let pointer = null;

  stage.addEventListener('pointerdown', (e) => {
    if (state.mode !== '3d') return;
    pointer = { x: e.clientX, y: e.clientY, rotX: state.rotX, rotY: state.rotY, dragged: false, target: e.target };
    stage.setPointerCapture(e.pointerId);
  });

  stage.addEventListener('pointermove', (e) => {
    if (!pointer) return;
    const dx = e.clientX - pointer.x;
    const dy = e.clientY - pointer.y;
    if (!pointer.dragged && Math.hypot(dx, dy) < 7) return;
    pointer.dragged = true;
    stage.classList.add('is-dragging');
    state.rotY = clamp(pointer.rotY + dx * .3, -60, 60);
    state.rotX = clamp(pointer.rotX - dy * .3, -10, 45);
    applyWorld();
  });

  stage.addEventListener('pointerup', (e) => {
    if (!pointer) return;
    const wasDrag = pointer.dragged;
    const target = pointer.target;
    pointer = null;
    stage.classList.remove('is-dragging');
    if (wasDrag || state.mode !== '3d') return;
    // Clic simple : tourner la page (droite = suivante, gauche = précédente).
    const leaf = target.closest?.('.book3d-leaf');
    if (!leaf) return;
    leaf.classList.contains('is-flipped') ? prev() : next();
  });

  stage.addEventListener('pointercancel', () => { pointer = null; stage.classList.remove('is-dragging'); });

  stage.addEventListener('wheel', (e) => {
    // À plat, la molette sert au défilement naturel (zoom via Ctrl+molette ou boutons).
    if (state.mode !== '3d' && !e.ctrlKey) return;
    e.preventDefault();
    setZoom(state.zoom * (e.deltaY > 0 ? .92 : 1.08));
  }, { passive: false });

  stage.addEventListener('dblclick', resetView);

  stage.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') { e.preventDefault(); next(); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); prev(); }
  });

  /* ---------------- API ---------------- */

  build();
  emit();

  return {
    next, prev, goToPage, goToSpread, setMode, setZoom, resetView,
    getState: () => ({ ...state, leaves: undefined, edge: undefined }),
    refresh() {
      build();
      emit();
    },
    zoomIn: () => setZoom(state.zoom * 1.18),
    zoomOut: () => setZoom(state.zoom / 1.18),
    destroy() {
      state.destroyed = true;
      resizeObserver?.disconnect();
      stage.remove();
    },
  };
}
