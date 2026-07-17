#!/usr/bin/env python3
"""
Construit la version AUTONOME du site : chaque page HTML embarque ses CSS et
tout son JavaScript (modules concaténés, imports/exports retirés).
Résultat dans standalone/ — double-cliquer index.html suffit (file:// ok).
"""

import re
from pathlib import Path

ROOT = Path(__file__).parent
OUT = ROOT / "standalone"
OUT.mkdir(exist_ok=True)

# Ordre de concaténation des modules partagés (dépendances d'abord).
SHARED_MODULES = [
    "js/core/utils.js",
    "js/core/store.js",
    "js/core/api.js",
    "js/core/firebase.js",
    "js/data/categories.js",
    "js/data/chants.js",
    "js/data/modeles.js",
    "js/components/ornaments.js",
    "js/components/pageRenderer.js",
    "js/components/printKit.js",
    "js/components/pdfExport.js",
    "js/components/book3d.js",
    "js/components/toast.js",
    "js/components/nav.js",
]

PAGES = [
    "index.html", "categories.html", "modeles.html",
    "modele.html", "configurateur.html", "commande.html",
    "atelier.html", "admin.html", "bat.html", "confidentialite.html",
]

# Seuls les imports RELATIFS (./ ou ../) sont retirés : js/core/firebase.js
# importe le SDK Firebase depuis gstatic.com (URL absolue) et doit le garder
# (les déclarations import sont de toute façon hoistées par le module ES,
# peu importe où elles se trouvent après concaténation).
IMPORT_RE = re.compile(r"^import\s.*?from\s+['\"]\.{1,2}/.*?['\"]\s*;\s*$", re.M)
EXPORT_RE = re.compile(r"^export\s+", re.M)
LINK_RE = re.compile(r'<link rel="stylesheet" href="(css/[^"]+)">')
SCRIPT_RE = re.compile(r'<script type="module" src="(js/pages/[^"]+)"></script>')


def strip_module(src: str) -> str:
    src = IMPORT_RE.sub("", src)
    src = EXPORT_RE.sub("", src)
    return src.strip()


def bundle_js(page_module: str) -> str:
    parts = []
    for mod in SHARED_MODULES + [page_module]:
        code = (ROOT / mod).read_text(encoding="utf-8")
        parts.append(f"/* ===== {mod} ===== */\n{strip_module(code)}")
    return "\n\n".join(parts)


for page in PAGES:
    html = (ROOT / page).read_text(encoding="utf-8")

    # CSS → inline (dans l'ordre des <link>)
    def inline_css(m):
        css = (ROOT / m.group(1)).read_text(encoding="utf-8")
        return f"<style>\n{css}\n</style>"
    html = LINK_RE.sub(inline_css, html)

    # JS → bundle inline
    def inline_js(m):
        return "<script type=\"module\">\n" + bundle_js(m.group(1)) + "\n</script>"
    html = SCRIPT_RE.sub(inline_js, html)

    (OUT / page).write_text(html, encoding="utf-8")
    print(f"OK {page} -> standalone/{page} ({len(html)//1024} ko)")

print("Terminé.")
