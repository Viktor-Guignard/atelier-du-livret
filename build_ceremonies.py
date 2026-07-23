#!/usr/bin/env python3
"""
Génère les 8 pages cérémonie (SEO) : livret-messe-<slug>.html.
Contenu statique riche (crawlable) + FAQ (JSON-LD FAQPage) + grille de modèles
injectée par js/pages/ceremonie.js. Régénérer : python3 build_ceremonies.py
"""
import json
from pathlib import Path

ROOT = Path(__file__).parent
DOMAIN = "https://livretsdemesse.fr"

# Prix issus du moteur (js/core/api.js — devis Imprigraphic × marge 1,8 + création 120 €)
PRIX_50 = "508,80 € TTC les 50 exemplaires"      # 12 pages couché : 216×1,8+120
PRIX_100 = "595,20 € TTC les 100 exemplaires"    # 264×1,8+120

FAQ_COMMUNES = [
    ("Quel est le délai pour recevoir les livrets ?",
     "Comptez 5 à 7 jours ouvrés après validation de votre bon à tirer (BAT) numérique. "
     "Nous vous conseillons de commander 3 à 4 semaines avant la cérémonie pour rester serein."),
    ("Combien coûte un livret de messe ?",
     f"Un livret A5 de 12 pages en papier couché revient à {PRIX_50} — soit environ 10 € l'exemplaire — "
     f"et {PRIX_100}. Création personnalisée et BAT sont inclus, et le prix se calcule en direct "
     "sur le site selon vos choix (pages, papier, quantité)."),
    ("Comment se passe la validation avant impression ?",
     "Après votre commande, vous recevez un bon à tirer numérique : votre livret se feuillette en 3D, "
     "page par page, et vous le validez en un clic. Rien ne part à l'impression sans votre accord."),
]

CEREMONIES = {
    "bapteme": {
        "slug": "livret-messe-bapteme",
        "nom": "Baptême",
        "titre_seo": "Livret de messe de baptême personnalisé — création en ligne",
        "description": "Créez le livret de baptême de votre enfant : déroulé de la célébration, chants, "
                       "photos et prénom personnalisés. Aperçu 3D en direct, BAT avant impression, imprimé en France.",
        "h1": "Le livret de baptême qui accompagne son premier jour d'Église",
        "intro": [
            "Le baptême d'un enfant rassemble deux familles, des amis de tous horizons — et souvent des invités "
            "qui ne connaissent pas le déroulement d'une célébration. Le livret de baptême est là pour cela : "
            "il guide chacun, du signe de croix d'accueil jusqu'au cierge allumé, et permet à toute l'assemblée "
            "de participer, de répondre et de chanter d'une seule voix.",
            "C'est aussi le premier souvenir imprimé de votre enfant : son prénom en couverture, la date, "
            "l'église, les parrain et marraine, une photo si vous le souhaitez. Un objet que l'on garde, "
            "que l'on glisse dans l'album de famille et que l'on retrouve des années plus tard.",
        ],
        "deroule_titre": "Ce que contient un livret de baptême",
        "deroule": [
            ("L'accueil", "signe de croix sur le front de l'enfant, mot d'accueil du célébrant."),
            ("La liturgie de la Parole", "lectures choisies par la famille et psaume."),
            ("Le rite baptismal", "bénédiction de l'eau, profession de foi des parents, parrain et marraine, "
             "baptême, onction du saint chrême."),
            ("Les signes", "vêtement blanc et cierge allumé au cierge pascal — la lumière transmise."),
            ("La prière et l'envoi", "Notre Père, prière à Marie, bénédiction finale."),
        ],
        "chants": ["Dieu nous a tous appelés", "Tu es devenu enfant de Dieu", "Je vous salue Marie",
                   "Couronnée d'étoiles"],
        "conseils": [
            "8 à 12 pages suffisent largement pour un baptême — le nôtre s'imprime en cahiers de 4 pages.",
            "Ajoutez les prénoms des parrain et marraine : c'est un clin d'œil qui leur fait toujours plaisir.",
            "Une photo de l'enfant en dernière page transforme le livret en carte de remerciement.",
        ],
        "faq_extra": [
            ("Peut-on personnaliser les textes et les prières ?",
             "Oui, tout est modifiable dans le configurateur : lectures, prières, remerciements — et chaque "
             "modification s'affiche en temps réel sur l'aperçu 3D du livret."),
        ],
    },
    "communion": {
        "slug": "livret-messe-communion",
        "nom": "Première Communion",
        "titre_seo": "Livret de messe de première communion — création en ligne",
        "description": "Un livret de première communion clair et élégant : messe pas à pas, chants, prénom de "
                       "l'enfant. Personnalisation en ligne avec aperçu 3D, BAT numérique, impression en France.",
        "h1": "Le livret de première communion, pas à pas",
        "intro": [
            "La première communion est une messe entière, souvent longue pour les plus jeunes invités : le livret "
            "y devient un fil conducteur précieux. Il annonce chaque temps de la célébration, donne les paroles "
            "des chants et des réponses de l'assemblée, et met le prénom de l'enfant à l'honneur.",
            "Pour une communion célébrée à plusieurs enfants, le livret peut lister tous les communiants — "
            "ou être personnalisé pour votre famille avec ses remerciements propres.",
        ],
        "deroule_titre": "Ce que contient un livret de première communion",
        "deroule": [
            ("L'accueil et le Gloria", "chant d'entrée, mot d'accueil, Gloire à Dieu."),
            ("La liturgie de la Parole", "lectures, psaume, Alléluia et Évangile."),
            ("La liturgie eucharistique", "offertoire, Sanctus, prière eucharistique, Agneau de Dieu."),
            ("La première communion", "les enfants s'avancent — chant de communion et action de grâce."),
            ("L'envoi", "bénédiction et chant final."),
        ],
        "chants": ["Panis angelicus", "Gloria de Lourdes", "Ubi caritas et amor", "Peuple de Dieu, marche joyeux"],
        "conseils": [
            "12 à 16 pages : la messe est complète, prévoyez la place des chants en entier.",
            "Vérifiez auprès de la paroisse les chants retenus pour la célébration commune.",
            "Un médaillon photo de l'enfant en couverture rend chaque livret unique.",
        ],
        "faq_extra": [
            ("Peut-on faire un livret commun à plusieurs familles ?",
             "Oui : le livret peut lister tous les enfants communiants, et chaque famille peut commander la "
             "quantité dont elle a besoin — le devis se calcule en direct selon la quantité."),
        ],
    },
    "profession-foi": {
        "slug": "livret-messe-profession-de-foi",
        "nom": "Profession de foi",
        "titre_seo": "Livret de messe de profession de foi — création en ligne",
        "description": "Livret de profession de foi personnalisé : renouvellement des promesses du baptême, "
                       "remise de la lumière, chants choisis par les jeunes. Aperçu 3D, BAT, imprimé en France.",
        "h1": "Un livret sobre et fervent pour la profession de foi",
        "intro": [
            "La profession de foi est le moment où le jeune redit, à voix haute et devant l'assemblée, les "
            "promesses de son baptême. Le livret accompagne ce temps fort : il porte le Credo, les promesses "
            "renouvelées, la remise de la lumière — et les chants que les jeunes ont souvent choisis eux-mêmes.",
            "C'est un livret volontiers sobre, lumineux, où le prénom du jeune et la date prennent place "
            "sur une couverture épurée.",
        ],
        "deroule_titre": "Ce que contient un livret de profession de foi",
        "deroule": [
            ("L'entrée", "procession des jeunes, souvent cierge en main."),
            ("La liturgie de la Parole", "lectures et psaume choisis avec l'aumônerie."),
            ("Le renouvellement des promesses du baptême", "renonciation et profession de foi — le cœur de la célébration."),
            ("La remise de la lumière", "chaque jeune reçoit la flamme du cierge pascal."),
            ("L'eucharistie et l'envoi", "communion, action de grâce, chant final."),
        ],
        "chants": ["Veni Creator Spiritus", "Peuple de Dieu, marche joyeux", "Couronnée d'étoiles"],
        "conseils": [
            "Impliquez le jeune dans le choix des chants et de la couverture : c'est SA profession de foi.",
            "12 pages suffisent en général ; le Credo mérite une page entière.",
            "Coordonnez-vous avec l'aumônerie : la célébration est souvent commune à plusieurs jeunes.",
        ],
        "faq_extra": [
            ("Le livret peut-il servir à toute l'aumônerie ?",
             "Oui — un seul livret peut lister tous les jeunes, et les quantités s'adaptent (à partir de "
             "50 exemplaires, tarifs dégressifs intégrés)."),
        ],
    },
    "confirmation": {
        "slug": "livret-messe-confirmation",
        "nom": "Confirmation",
        "titre_seo": "Livret de messe de confirmation — création en ligne",
        "description": "Livret de confirmation personnalisé : appel des confirmands, imposition des mains, "
                       "onction du saint chrême, Veni Creator. Création en ligne, aperçu 3D, BAT avant impression.",
        "h1": "Le livret de confirmation, sous le signe de l'Esprit",
        "intro": [
            "Célébrée le plus souvent par l'évêque, la confirmation est une liturgie riche en gestes forts : "
            "l'appel de chaque confirmand par son nom, l'imposition des mains, l'onction du saint chrême. "
            "Le livret permet à l'assemblée de suivre ces rites — et d'y répondre au bon moment.",
            "La flamme, symbole de l'Esprit de Pentecôte, inspire naturellement la couverture ; notre modèle "
            "« Pentecôte » en fait un motif élégant, à personnaliser librement.",
        ],
        "deroule_titre": "Ce que contient un livret de confirmation",
        "deroule": [
            ("L'accueil et l'appel des confirmands", "chaque jeune est appelé par son nom."),
            ("La liturgie de la Parole", "lectures et homélie de l'évêque."),
            ("Le renouvellement des promesses du baptême", "profession de foi de toute l'assemblée."),
            ("L'imposition des mains et l'onction", "le saint chrême — « Sois marqué de l'Esprit Saint, le don de Dieu »."),
            ("L'eucharistie et l'envoi", "communion et bénédiction solennelle."),
        ],
        "chants": ["Veni Creator Spiritus", "Gloria VIII « de Angelis »", "Ubi caritas et amor"],
        "conseils": [
            "Listez les confirmands avec leur paroisse d'origine si la célébration est doyennale.",
            "Le Veni Creator gagne à figurer en entier — latin et traduction française.",
            "Prévoyez un mot de remerciement à l'évêque et aux accompagnateurs en dernière page.",
        ],
        "faq_extra": [
            ("Faut-il faire valider le livret par la paroisse ?",
             "C'est recommandé : votre BAT numérique se partage par un simple lien — le prêtre ou l'équipe "
             "liturgique peut le relire avant impression."),
        ],
    },
    "mariage": {
        "slug": "livret-messe-mariage",
        "nom": "Mariage",
        "titre_seo": "Livret de messe de mariage personnalisé — création en ligne",
        "description": "Créez votre livret de messe de mariage : consentements, alliances, chants et prénoms "
                       "personnalisés. Aperçu 3D en temps réel, BAT numérique, impression soignée en France.",
        "h1": "Le livret de messe de mariage, à vos deux prénoms",
        "intro": [
            "Le livret de mariage est devenu un incontournable des cérémonies religieuses : il accueille vos "
            "invités, les guide de l'entrée des mariés à la sortie triomphale, donne les paroles des chants "
            "et explique les temps forts à ceux qui connaissent peu la messe.",
            "C'est aussi un objet de papeterie à part entière, assorti à vos faire-part : vos deux prénoms en "
            "couverture, vos couleurs, vos polices. Nos modèles se personnalisent entièrement en ligne, avec "
            "un aperçu 3D qui se feuillette comme le vrai livret.",
        ],
        "deroule_titre": "Ce que contient un livret de mariage",
        "deroule": [
            ("L'accueil des mariés", "entrée, mot du célébrant, chant d'ouverture."),
            ("La liturgie de la Parole", "vos lectures choisies, psaume, Évangile."),
            ("L'échange des consentements", "le cœur de la célébration — dialogue et engagement."),
            ("La bénédiction et la remise des alliances", "suivies de la bénédiction nuptiale."),
            ("La signature des registres et l'envoi", "chant final et sortie des mariés."),
        ],
        "chants": ["Peuple de Dieu, marche joyeux", "Gloria de Lourdes", "Ubi caritas et amor",
                   "Panis angelicus", "Couronnée d'étoiles"],
        "conseils": [
            "Comptez 12 à 16 pages avec eucharistie, 8 à 12 sans — l'impression se fait en cahiers de 4.",
            "Faites relire le déroulé au prêtre ou au diacre : chaque paroisse a ses usages.",
            "Commandez 10 % d'exemplaires de plus que le nombre d'invités assis : certains le gardent en souvenir.",
        ],
        "faq_extra": [
            ("Peut-on assortir le livret à nos faire-part ?",
             "Oui : palettes de couleurs, polices et ornements se choisissent librement dans le configurateur, "
             "et vous pouvez ajouter monogramme ou photo en couverture."),
        ],
    },
    "funerailles": {
        "slug": "livret-messe-funerailles",
        "nom": "Funérailles",
        "titre_seo": "Livret de messe de funérailles — création rapide en ligne",
        "description": "Un livret de funérailles digne et apaisant, créé en ligne en quelques heures : textes, "
                       "chants, photo et hommage. BAT numérique immédiat, impression rapide en France.",
        "h1": "Un livret digne pour accompagner l'adieu",
        "intro": [
            "Dans les jours resserrés qui précèdent des funérailles, le livret est une attention précieuse : "
            "il guide une assemblée souvent nombreuse et peu habituée de la liturgie, porte les textes et les "
            "chants choisis pour le défunt, et reste ensuite aux proches comme un souvenir de la célébration.",
            "Notre configurateur permet de composer un livret complet en une heure, à plusieurs si besoin — "
            "et le bon à tirer numérique se valide en un clic, pour une impression sans délai superflu.",
        ],
        "deroule_titre": "Ce que contient un livret de funérailles",
        "deroule": [
            ("L'accueil", "accueil du corps, lumière du cierge pascal, mot d'accueil."),
            ("La liturgie de la Parole", "lectures choisies par la famille, psaume — souvent le psaume 22, "
             "« Le Seigneur est mon berger »."),
            ("L'homélie et la prière universelle", "intentions portées par les proches."),
            ("L'eucharistie", "si la famille la souhaite — offertoire, Sanctus, communion."),
            ("Le dernier adieu", "aspersion et encensement, chant d'adieu, In paradisum."),
        ],
        "chants": ["Sur le seuil de sa maison", "Le Seigneur est mon berger (psaume 22)", "Anima Christi",
                   "Je vous salue Marie"],
        "conseils": [
            "8 à 12 pages suffisent ; l'essentiel est la clarté du déroulé pour l'assemblée.",
            "Une photo du défunt en couverture ou en dernière page personnalise l'hommage avec pudeur.",
            "Les pompes funèbres ou la paroisse peuvent relire le BAT via un simple lien partagé.",
        ],
        "faq_extra": [
            ("Quels sont les délais pour des funérailles ?",
             "Le livret se compose en ligne en quelques heures et le BAT est immédiat. Contactez-nous dès la "
             "commande passée : nous faisons le maximum pour tenir les délais d'une célébration proche."),
        ],
    },
    "messe-anniversaire": {
        "slug": "livret-messe-anniversaire",
        "nom": "Messe anniversaire",
        "titre_seo": "Livret de messe anniversaire (du souvenir) — création en ligne",
        "description": "Livret pour une messe anniversaire ou du souvenir : intentions, lectures et chants autour "
                       "de la mémoire d'un proche. Création en ligne, aperçu 3D, impression en France.",
        "h1": "Se souvenir ensemble : le livret de la messe anniversaire",
        "intro": [
            "Un an, dix ans après — la messe anniversaire rassemble à nouveau famille et amis autour de la "
            "mémoire d'un être cher. Un livret discret y trouve toute sa place : il annonce les intentions, "
            "porte les lectures et les chants, et redonne à chacun les mots de la prière commune.",
            "C'est souvent un livret court et soigné, où une photo, une citation ou quelques lignes de "
            "souvenir suffisent à dire l'essentiel.",
        ],
        "deroule_titre": "Ce que contient un livret de messe anniversaire",
        "deroule": [
            ("L'accueil et l'intention", "la messe est célébrée à la mémoire du défunt, nommé dès l'ouverture."),
            ("La liturgie de la Parole", "lectures et psaume choisis par la famille."),
            ("La prière universelle", "intentions pour le défunt, la famille, les défunts de l'assemblée."),
            ("L'eucharistie", "offertoire, Sanctus, communion, action de grâce."),
            ("L'envoi", "prière à Marie ou chant du souvenir, bénédiction."),
        ],
        "chants": ["Sur le seuil de sa maison", "Je vous salue Marie", "Magnificat"],
        "conseils": [
            "8 pages suffisent souvent : c'est la sobriété qui touche.",
            "Une citation ou une photo en couverture personnalise le souvenir sans l'alourdir.",
            "Le même livret peut resservir de trame les années suivantes : votre projet reste enregistré.",
        ],
        "faq_extra": [
            ("Peut-on reprendre le livret des funérailles ?",
             "Oui — si vous aviez créé le livret des funérailles chez nous, votre projet est réutilisable : "
             "dupliquez-le, adaptez les textes, et commandez la nouvelle quantité."),
        ],
    },
    "jubile": {
        "slug": "livret-messe-jubile",
        "nom": "Jubilé",
        "titre_seo": "Livret de messe de jubilé — noces d'or, jubilé sacerdotal",
        "description": "Livret d'action de grâce pour un jubilé : noces d'or ou d'argent, jubilé sacerdotal, "
                       "anniversaire de communauté. Création en ligne, aperçu 3D, impression soignée en France.",
        "h1": "Rendre grâce : le livret des grands anniversaires",
        "intro": [
            "Noces d'or, noces d'argent, jubilé sacerdotal, anniversaire d'une communauté : le jubilé est une "
            "messe d'action de grâce pour le chemin parcouru. Le livret en garde la trace — il raconte les "
            "années, porte le renouvellement des engagements et les chants de louange.",
            "C'est un livret que l'on offre autant qu'on l'utilise : les invités le remportent comme un "
            "souvenir des jubilaires.",
        ],
        "deroule_titre": "Ce que contient un livret de jubilé",
        "deroule": [
            ("L'accueil des jubilaires", "entrée solennelle, mot d'accueil, chant de louange."),
            ("La liturgie de la Parole", "lectures faisant écho au chemin parcouru."),
            ("Le renouvellement des engagements", "consentements redits pour des noces, promesses pour un "
             "jubilé sacerdotal — suivi d'une bénédiction."),
            ("L'eucharistie et l'action de grâce", "Magnificat ou Te Deum, communion."),
            ("L'envoi", "bénédiction et chant final de fête."),
        ],
        "chants": ["Magnificat", "Peuple de Dieu, marche joyeux", "Couronnée d'étoiles", "Gloria de Lourdes"],
        "conseils": [
            "Racontez : quelques dates clés des jubilaires en avant-dernière page touchent toujours l'assemblée.",
            "La couronne d'or de notre modèle « Action de grâce » est pensée pour les noces d'or.",
            "Pensez aux photos d'époque — le contraste avec aujourd'hui fait la beauté du livret.",
        ],
        "faq_extra": [
            ("Peut-on mêler photos anciennes et récentes ?",
             "Oui, le configurateur accepte vos photos (formats jpg/png) sur n'importe quelle page, en "
             "médaillon, arche ou pleine largeur."),
        ],
    },
}


def esc(t):
    return t.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")


def page_html(cid, c):
    url = f"{DOMAIN}/{c['slug']}.html"
    faq = FAQ_COMMUNES + c["faq_extra"]
    faq_ld = json.dumps({
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": [
            {"@type": "Question", "name": q,
             "acceptedAnswer": {"@type": "Answer", "text": a}} for q, a in faq
        ],
    }, ensure_ascii=False, indent=2)

    autres = [(k, v) for k, v in CEREMONIES.items() if k != cid]
    liens_autres = " · ".join(
        f'<a href="{v["slug"]}.html">{esc(v["nom"])}</a>' for k, v in autres)

    deroule_html = "\n".join(
        f'          <li><strong>{esc(t)}</strong> — {esc(d)}</li>' for t, d in c["deroule"])
    chants_html = "\n".join(
        f'          <li>{esc(ch)}</li>' for ch in c["chants"])
    conseils_html = "\n".join(
        f'          <li>{esc(co)}</li>' for co in c["conseils"])
    intro_html = "\n".join(f'        <p class="lead-left">{esc(p)}</p>' for p in c["intro"])
    faq_html = "\n".join(
        f'''        <details class="faq-item">
          <summary>{esc(q)}</summary>
          <p>{esc(a)}</p>
        </details>''' for q, a in faq)

    return f'''<!-- © 2026 VIKTO LABS — Tous droits réservés. Code propriétaire, réutilisation interdite (voir LICENSE). Contact : viktor.guignard@gmail.com -->
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>{esc(c["titre_seo"])} | Livrets de messe</title>
  <meta name="author" content="VIKTO LABS">
  <meta name="copyright" content="© 2026 VIKTO LABS — Tous droits réservés">
  <link rel="canonical" href="{url}">
  <meta property="og:site_name" content="Livrets de messe">
  <meta property="og:type" content="website">
  <meta property="og:locale" content="fr_FR">
  <meta property="og:url" content="{url}">
  <meta property="og:title" content="{esc(c["titre_seo"])}">
  <meta property="og:description" content="{esc(c["description"])}">
  <meta property="og:image" content="https://livretsdemesse.fr/assets/og.png">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="description" content="{esc(c["description"])}">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400;1,600&family=EB+Garamond:ital,wght@0,400;0,600;1,400&family=Inter:wght@400;500;600&family=Lora:ital,wght@0,400;0,600;1,400&family=Montserrat:wght@400;500;600&family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="css/tokens.css">
  <link rel="stylesheet" href="css/base.css">
  <link rel="stylesheet" href="css/components.css">
  <link rel="stylesheet" href="css/livret.css">
  <link rel="stylesheet" href="css/pages/modeles.css">
  <link rel="stylesheet" href="css/pages/ceremonie.css">
  <script type="application/ld+json">
{faq_ld}
  </script>
</head>
<body data-categorie="{cid}">
  <main id="main">

    <section class="section page-head ceremonie-head">
      <div class="container">
        <p class="eyebrow">{esc(c["nom"])}</p>
        <h1>{esc(c["h1"])}</h1>
{intro_html}
        <div class="hero-ctas">
          <a class="btn btn-gold btn-lg" href="modeles.html?categorie={cid}">Voir les modèles {esc(c["nom"].lower())}</a>
          <a class="btn btn-ghost btn-lg" href="configurateur.html">Créer mon livret</a>
        </div>
      </div>
    </section>

    <section class="section section-alt">
      <div class="container ceremonie-cols">
        <div>
          <h2>{esc(c["deroule_titre"])}</h2>
          <ul class="ceremonie-liste">
{deroule_html}
          </ul>
        </div>
        <div>
          <h2>Des chants souvent choisis</h2>
          <p class="small muted">Tous disponibles — avec leurs paroles — dans la bibliothèque du configurateur.</p>
          <ul class="ceremonie-liste ceremonie-chants">
{chants_html}
          </ul>
          <h2 style="margin-top: var(--sp-5)">Nos conseils</h2>
          <ul class="ceremonie-liste">
{conseils_html}
          </ul>
        </div>
      </div>
    </section>

    <section class="section">
      <div class="container">
        <div class="text-center">
          <p class="eyebrow">Modèles</p>
          <h2>Des modèles pensés pour {'les funérailles' if cid == 'funerailles' else 'cette célébration'}</h2>
          <p class="lead">Chaque modèle se personnalise entièrement : textes, chants, photos, couleurs et polices.</p>
        </div>
        <div class="grid grid-3" id="ceremonie-modeles"></div>
        <p class="text-center" style="margin-top: var(--sp-6)">
          <a class="btn btn-ghost" href="modeles.html?categorie={cid}">Tous les modèles {esc(c["nom"].lower())}</a>
        </p>
      </div>
    </section>

    <section class="section section-alt">
      <div class="container ceremonie-faq">
        <div class="text-center"><p class="eyebrow">Questions fréquentes</p>
        <h2>Livret de {esc(c["nom"].lower())} : vos questions</h2></div>
{faq_html}
      </div>
    </section>

    <section class="section section-night home-final">
      <div class="container text-center">
        <p class="home-final-quote">Votre livret, prêt en quelques minutes —<br>imprimé avec soin en France.</p>
        <a class="btn btn-gold btn-lg" href="modeles.html?categorie={cid}">Commencer mon livret</a>
        <p class="small ceremonie-autres">Autres cérémonies : {liens_autres}</p>
      </div>
    </section>

  </main>
  <script type="module" src="js/pages/ceremonie.js"></script>
</body>
</html>
'''


for cid, c in CEREMONIES.items():
    out = ROOT / f"{c['slug']}.html"
    out.write_text(page_html(cid, c), encoding="utf-8")
    print(f"OK {out.name}")
print("Terminé.")
