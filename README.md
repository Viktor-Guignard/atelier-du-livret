# L'Atelier du Livret — Livrets de messe personnalisés

Site statique (HTML/CSS/JS modules natifs, zéro build, zéro dépendance) permettant de
choisir un modèle de livret de messe, de le **personnaliser en ligne avec aperçu temps
réel** (feuilletage 3D réaliste), de gérer les **chants liturgiques**, et d'**envoyer une
demande de commande**. Compatible GitHub Pages tel quel.

## Lancer en local

```bash
python3 -m http.server 4173
# puis http://localhost:4173/
```

(Les modules ES exigent un serveur HTTP — ne pas ouvrir les fichiers en `file://`.)

## Pages

| Fichier | Rôle |
|---|---|
| `index.html` | Accueil : promesse, fonctionnement en 4 étapes, catégories, exemples, avis, CTA |
| `categories.html` | Les 8 catégories de cérémonies |
| `modeles.html?categorie=<id>` | Modèles d'une catégorie (ou tous) |
| `modele.html?id=<id>` | Présentation d'un modèle : **aperçu 3D**, feuilletage, rotation, zoom, page à page |
| `configurateur.html?modele=<id>` ou `?projet=<id>` | **Le configurateur** (fonctionnalité centrale) |
| `commande.html?projet=<id>` | Récapitulatif, devis, demande de commande, BAT |

## Architecture

```
css/
  tokens.css          Design tokens (couleurs, typo, espacements, ombres, z-index)
  base.css            Reset, typo globale, utilitaires layout (.container, .grid…)
  components.css      Header/footer, boutons, cartes, formulaires, badges, modales, toast
  livret.css          Rendu des PAGES DU LIVRET (classes .lv-page, .lv-block-*)
  book3d.css          Livre 3D (perspective, feuilles, tranche, ombres)
  pages/<page>.css    Styles propres à chaque page du site
js/
  core/utils.js       qs/qsa, el(), uid(), interpolate(), escapeHtml(), getParam(), formatDateFr(), debounce()
  core/store.js       Persistance localStorage + ProjectStore (EventTarget) pour le configurateur
  core/api.js         Adaptateur commande (mailto + export JSON aujourd'hui ; backend demain)
  data/categories.js  CATEGORIES (8 cérémonies)
  data/chants.js      CATEGORIES_LITURGIQUES (11) + CHANTS (bibliothèque) + recherche
  data/modeles.js     THEMES (palettes), FONTS (polices autorisées), MODELES (24), buildDefaultProject()
  components/ornaments.js  SVG line-art (croix, colombe, rameau, anneaux, coquille, lys…)
  components/pageRenderer.js  renderPage(page, project) → élément .lv-page (aspect A5)
  components/book3d.js     createBook3D(container, pagesProvider, opts) → API feuilletage/rotation/zoom/modes
  components/nav.js        initSite({active}) — header + footer + menu mobile injectés
  components/toast.js      showToast(message, type)
  pages/<page>.js     Contrôleur de chaque page
```

## Contrats de données (source de vérité)

### Projet (persisté en localStorage, clé `ldm.projet.<id>`)

```js
{
  id, nom, modeleId, categorieId,
  themeId,           // clé dans THEMES
  fontId,            // clé dans FONTS
  fields: { prenom, nom, prenom2, nom2, date, heure, lieu, ville, celebrant },
  pages: [ { id, blocks: [Block, …] }, … ],
  updatedAt
}
```

Les textes des blocs contiennent des **placeholders** `{{prenom}}`, `{{date}}`… résolus
par `interpolate()` au rendu → modifier un champ met à jour tout le livret.

### Blocs (`pageRenderer` sait tous les rendre)

```
cover        { title, subtitle, showOrnament, ornament }
heading      { text }            subheading { text }
text         { text, align }     priere     { titre, texte }
lecture      { reference, titre, extrait }
chant        { chantId } OU { custom:{ titre, paroles } , chantId:null } + { categorieLiturgique }
photo        { src (dataURL|null), caption, shape:'arch'|'oval'|'full' }
ornament     { motif }           spacer     { size:'s'|'m'|'l' }
deroulement  { items:[{heure,label}] }
remerciement { texte }
```

## Direction artistique (à respecter partout)

- **Ton** : élégant, épuré, rassurant. Papeterie haut de gamme. Beaucoup d'air.
- **Palette site** : fond ivoire `--paper`, encre bleu nuit `--ink`, accent or discret
  `--gold`, surfaces blanches. JAMAIS de couleurs criardes.
- **Typo site** : Cormorant Garamond (titres, serif), Inter (UI/texte).
- **Icônes** : uniquement SVG inline (traits fins 1.5px) — jamais d'emoji.
- Interactions douces 150–300 ms, `prefers-reduced-motion` respecté.
- Boutons : `.btn .btn-primary|.btn-ghost|.btn-gold`, cartes `.card`, etc. (components.css).
- Responsive mobile-first : 375 / 768 / 1024 / 1440. Touch targets ≥ 44px.

## Commandes réelles & flux BAT

1. **Activer l'envoi réel** : créez un formulaire gratuit sur [formspree.io](https://formspree.io)
   avec votre adresse de réception, activez son option *auto-response* (c'est l'accusé de
   réception envoyé au client), puis collez l'URL du formulaire dans `ORDER_ENDPOINT`
   (`js/core/api.js`). Sans endpoint, le site se replie sur un e-mail pré-rempli (démo).
2. **Réception** : chaque commande vous arrive par e-mail avec le récapitulatif et le
   projet complet en JSON ; le client télécharge aussi sa copie `commande-….json`
   et reçoit l'accusé de réception automatique.
3. **BAT** : ouvrez `atelier.html` (page interne, non référencée, absente de la
   navigation), chargez le JSON de la commande, cochez **Mode BAT** → PDF filigrané
   avec mention « BON À TIRER » à envoyer au client pour validation.
4. **Impression** : après validation, décochez le mode BAT → PDF final **sans
   filigrane**, coupe A5 148 × 210 mm, **fond perdu 3 mm, traits de coupe**
   (feuille 160 × 222 mm), précédé d'une fiche de fabrication (quantité, papier,
   format, contact). Export : bouton Imprimer → « Enregistrer au format PDF ».

Un filigrane « APERÇU · ATELIER DU LIVRET » protège tous les rendus à l'écran
(configurateur, 3D, vignettes) ; seul l'atelier produit des pages propres.

## Évolution prévue

`core/api.js` isole l'envoi de commande : remplacer `submitOrder()` par un POST
(Stripe/PayPal/espace client) sans toucher au reste. Les données (`js/data/*.js`)
sont des modules purs → migrables vers une API/CMS en changeant une seule couche.

## Droits des chants

Les textes latins/grégoriens et prières traditionnelles sont dans le domaine public et
fournis en entier. Les chants contemporains (cotes SECLI) sont référencés (titre, cote,
incipit) : les paroles complètes sont à insérer par la paroisse/famille titulaire de la
licence SECLI. Le configurateur permet de coller les paroles librement.
