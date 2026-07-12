/* Persistance des projets (localStorage) + magasin réactif du configurateur. */

import { uid, deepClone } from './utils.js';

const INDEX_KEY = 'ldm.projets';
const PROJECT_KEY = (id) => `ldm.projet.${id}`;

function readIndex() {
  try { return JSON.parse(localStorage.getItem(INDEX_KEY)) || []; }
  catch { return []; }
}

function writeIndex(index) {
  localStorage.setItem(INDEX_KEY, JSON.stringify(index));
}

/** Liste des projets enregistrés, du plus récent au plus ancien. */
export function listProjects() {
  return readIndex().sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
}

export function loadProject(id) {
  try { return JSON.parse(localStorage.getItem(PROJECT_KEY(id))); }
  catch { return null; }
}

export function saveProject(project) {
  project.updatedAt = Date.now();
  localStorage.setItem(PROJECT_KEY(project.id), JSON.stringify(project));
  const index = readIndex().filter((p) => p.id !== project.id);
  index.push({
    id: project.id,
    nom: project.nom,
    modeleId: project.modeleId,
    categorieId: project.categorieId,
    updatedAt: project.updatedAt,
  });
  writeIndex(index);
  return project;
}

export function deleteProject(id) {
  localStorage.removeItem(PROJECT_KEY(id));
  writeIndex(readIndex().filter((p) => p.id !== id));
}

/**
 * Magasin réactif utilisé par le configurateur.
 * Émet 'change' (detail: {scope}) à chaque mutation ; scope ∈
 * 'fields' | 'block' | 'pages' | 'style' | 'meta' — permet des rendus ciblés.
 */
export class ProjectStore extends EventTarget {
  constructor(project) {
    super();
    this.project = project;
  }

  emit(scope, detail = {}) {
    this.dispatchEvent(new CustomEvent('change', { detail: { scope, ...detail } }));
  }

  on(handler) {
    this.addEventListener('change', handler);
    return () => this.removeEventListener('change', handler);
  }

  setField(key, value) {
    this.project.fields[key] = value;
    this.emit('fields', { key });
  }

  setStyle(patch) {           // { themeId?, fontId? }
    Object.assign(this.project, patch);
    this.emit('style');
  }

  setNom(nom) {
    this.project.nom = nom;
    this.emit('meta');
  }

  getPage(pageId) {
    return this.project.pages.find((p) => p.id === pageId) || null;
  }

  getBlock(pageId, blockId) {
    return this.getPage(pageId)?.blocks.find((b) => b.id === blockId) || null;
  }

  updateBlock(pageId, blockId, patch) {
    const block = this.getBlock(pageId, blockId);
    if (!block) return;
    Object.assign(block, patch);
    this.emit('block', { pageId, blockId });
  }

  addBlock(pageId, block, index = null) {
    const page = this.getPage(pageId);
    if (!page) return null;
    block.id = block.id || uid('b');
    if (index == null) page.blocks.push(block);
    else page.blocks.splice(index, 0, block);
    this.emit('block', { pageId, blockId: block.id });
    return block;
  }

  removeBlock(pageId, blockId) {
    const page = this.getPage(pageId);
    if (!page) return;
    page.blocks = page.blocks.filter((b) => b.id !== blockId);
    this.emit('block', { pageId });
  }

  moveBlock(pageId, blockId, dir) {
    const page = this.getPage(pageId);
    if (!page) return;
    const i = page.blocks.findIndex((b) => b.id === blockId);
    const j = i + dir;
    if (i < 0 || j < 0 || j >= page.blocks.length) return;
    [page.blocks[i], page.blocks[j]] = [page.blocks[j], page.blocks[i]];
    this.emit('block', { pageId });
  }

  addPage(afterPageId = null) {
    const page = { id: uid('page'), blocks: [] };
    const i = this.project.pages.findIndex((p) => p.id === afterPageId);
    if (i < 0) this.project.pages.push(page);
    else this.project.pages.splice(i + 1, 0, page);
    this.emit('pages', { pageId: page.id });
    return page;
  }

  duplicatePage(pageId) {
    const page = this.getPage(pageId);
    if (!page) return null;
    const copy = deepClone(page);
    copy.id = uid('page');
    copy.blocks.forEach((b) => { b.id = uid('b'); });
    const i = this.project.pages.findIndex((p) => p.id === pageId);
    this.project.pages.splice(i + 1, 0, copy);
    this.emit('pages', { pageId: copy.id });
    return copy;
  }

  removePage(pageId) {
    if (this.project.pages.length <= 1) return false;
    this.project.pages = this.project.pages.filter((p) => p.id !== pageId);
    this.emit('pages');
    return true;
  }

  movePage(pageId, dir) {
    const pages = this.project.pages;
    const i = pages.findIndex((p) => p.id === pageId);
    const j = i + dir;
    if (i < 0 || j < 0 || j >= pages.length) return;
    [pages[i], pages[j]] = [pages[j], pages[i]];
    this.emit('pages', { pageId });
  }

  save() {
    return saveProject(this.project);
  }
}
