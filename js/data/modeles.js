/*
 * Modèles de livrets : palettes (THEMES), polices autorisées (FONTS),
 * les 25 modèles (MODELES) et la fabrique de projet buildDefaultProject().
 *
 * Chaque catégorie de cérémonie possède une structure liturgique par défaut
 * (PAGE_BUILDERS) dont les textes utilisent des placeholders {{prenom}},
 * {{date}}… résolus au rendu — modifier un champ met à jour tout le livret.
 */

import { uid, deepClone } from '../core/utils.js';
import { CATEGORIES, categorieById } from './categories.js';

/* ---------------- Palettes proposées ---------------- */

export const THEMES = [
  { id: 'ivoire-or',   nom: 'Ivoire & Or',      paper: '#FBF8F0', ink: '#3A352C', accent: '#A8853B', soft: '#EFE6D0' },
  { id: 'blanc-pur',   nom: 'Blanc pur',        paper: '#FFFFFF', ink: '#2E3440', accent: '#5C7185', soft: '#EDF1F5' },
  { id: 'bleu-nuit',   nom: 'Bleu nuit',        paper: '#F7F8FA', ink: '#22303E', accent: '#35506B', soft: '#E3EAF1' },
  { id: 'olivier',     nom: 'Vert olivier',     paper: '#FAF9F3', ink: '#3B4032', accent: '#6B7A4F', soft: '#E9ECDC' },
  { id: 'bordeaux',    nom: 'Bordeaux',         paper: '#FBF7F4', ink: '#42302E', accent: '#8E3B3B', soft: '#F3E3E0' },
  { id: 'rose-poudre', nom: 'Rose poudré',      paper: '#FCF8F6', ink: '#4A3B3B', accent: '#A96D6D', soft: '#F5E6E4' },
  { id: 'gris-perle',  nom: 'Gris perle',       paper: '#F8F8F7', ink: '#33363A', accent: '#6E7681', soft: '#EAECEE' },
  { id: 'terracotta',  nom: 'Terracotta',       paper: '#FBF6F0', ink: '#43362B', accent: '#B0653C', soft: '#F4E4D8' },
];

export const themeById = (id) => THEMES.find((t) => t.id === id) || THEMES[0];

/* ---------------- Polices autorisées ---------------- */

export const FONTS = [
  { id: 'cormorant',  nom: 'Cormorant Garamond', display: "'Cormorant Garamond', serif", body: "'Cormorant Garamond', serif" },
  { id: 'garamond',   nom: 'EB Garamond',        display: "'EB Garamond', serif",        body: "'EB Garamond', serif" },
  { id: 'playfair',   nom: 'Playfair Display',   display: "'Playfair Display', serif",   body: "'Lora', serif" },
  { id: 'lora',       nom: 'Lora',               display: "'Lora', serif",               body: "'Lora', serif" },
  { id: 'montserrat', nom: 'Montserrat (moderne)', display: "'Montserrat', sans-serif",  body: "'Lora', serif" },
];

export const fontById = (id) => FONTS.find((f) => f.id === id) || FONTS[0];

/* ---------------- Les modèles ---------------- */
/* coverStyle : 'ornement' | 'typographique' | 'botanique' | 'photo' */

export const MODELES = [
  /* Baptême */
  { id: 'bapteme-source',   categorieId: 'bapteme', nom: 'Source',  themeId: 'ivoire-or',   fontId: 'cormorant',  coverStyle: 'ornement', ornement: 'coquille',
    description: "La coquille baptismale en fil d'or sur ivoire : le classique lumineux, intemporel." },
  { id: 'bapteme-colombe',  categorieId: 'bapteme', nom: 'Colombe', themeId: 'blanc-pur',   fontId: 'garamond',   coverStyle: 'typographique', ornement: 'colombe',
    description: "Blanc pur et grandes lettres : la sobriété d'un premier matin." },
  { id: 'bapteme-aurore',   categorieId: 'bapteme', nom: 'Aurore',  themeId: 'rose-poudre', fontId: 'playfair',   coverStyle: 'photo', ornement: 'colombe',
    description: "Une photographie de votre enfant sous une arche rosée, tout en douceur." },

  /* Première Communion */
  { id: 'communion-pain-de-vie', categorieId: 'communion', nom: 'Pain de Vie', themeId: 'ivoire-or', fontId: 'cormorant', coverStyle: 'ornement', ornement: 'calice',
    description: "Le calice et l'hostie dessinés d'un trait fin : la référence des premières communions." },
  { id: 'communion-lumiere',     categorieId: 'communion', nom: 'Lumière',     themeId: 'blanc-pur', fontId: 'playfair',  coverStyle: 'typographique', ornement: 'lumiere',
    description: "Épuré et solaire, le prénom de l'enfant en pleine page." },
  { id: 'communion-vigne',       categorieId: 'communion', nom: 'Vigne',       themeId: 'olivier',   fontId: 'garamond',  coverStyle: 'botanique', ornement: 'rameau',
    description: "Feuillages à l'encre verte, comme une treille au matin de la fête." },

  /* Profession de foi */
  { id: 'profession-credo',  categorieId: 'profession-foi', nom: 'Credo',   themeId: 'bleu-nuit', fontId: 'garamond',   coverStyle: 'ornement', ornement: 'lumiere',
    description: "Bleu profond et cierge allumé : dire sa foi avec gravité et joie." },
  { id: 'profession-chemin', categorieId: 'profession-foi', nom: 'Chemin',  themeId: 'olivier',   fontId: 'lora',       coverStyle: 'botanique', ornement: 'rameau',
    description: "Un rameau qui monte, sobre et végétal, pour une étape du chemin." },
  { id: 'profession-etoile', categorieId: 'profession-foi', nom: 'Étoile du matin', themeId: 'blanc-pur', fontId: 'montserrat', coverStyle: 'typographique', ornement: 'etoile',
    description: "Graphique et contemporain : l'étoile guide, la typographie affirme." },

  /* Confirmation */
  { id: 'confirmation-pentecote', categorieId: 'confirmation', nom: 'Pentecôte', themeId: 'terracotta', fontId: 'playfair',   coverStyle: 'ornement', ornement: 'flamme',
    description: "La flamme de l'Esprit sur terre cuite : chaleureux et habité." },
  { id: 'confirmation-souffle',   categorieId: 'confirmation', nom: 'Souffle',   themeId: 'blanc-pur',  fontId: 'montserrat', coverStyle: 'typographique', ornement: 'colombe',
    description: "Minimal, aéré, précis — le souffle plutôt que l'ornement." },
  { id: 'confirmation-sept-dons', categorieId: 'confirmation', nom: 'Sept dons', themeId: 'ivoire-or',  fontId: 'cormorant',  coverStyle: 'ornement', ornement: 'etoile',
    description: "Sept rayons d'or discrets pour les sept dons de l'Esprit." },

  /* Mariage */
  { id: 'mariage-alliance', categorieId: 'mariage', nom: 'Alliance', themeId: 'ivoire-or',   fontId: 'cormorant', coverStyle: 'ornement', ornement: 'anneaux',
    description: "Deux anneaux entrelacés au fil d'or : le grand classique des mariages d'église." },
  { id: 'mariage-jardin',   categorieId: 'mariage', nom: 'Jardin',   themeId: 'olivier',     fontId: 'garamond',  coverStyle: 'botanique', ornement: 'rameau',
    description: "Oliviers et feuillages : un mariage de plein air, élégant et naturel." },
  { id: 'mariage-promesse', categorieId: 'mariage', nom: 'Promesse', themeId: 'rose-poudre', fontId: 'playfair',  coverStyle: 'typographique', ornement: 'anneaux',
    description: "Vos deux prénoms en très grandes capitales romantiques." },
  { id: 'mariage-portrait', categorieId: 'mariage', nom: 'Portrait', themeId: 'blanc-pur',   fontId: 'lora',      coverStyle: 'photo', ornement: 'anneaux',
    description: "Votre photographie de couple sous une arche, encadrée de blanc." },

  /* Funérailles */
  { id: 'funerailles-in-paradisum', categorieId: 'funerailles', nom: 'In Paradisum', themeId: 'gris-perle', fontId: 'garamond',  coverStyle: 'ornement', ornement: 'croix',
    description: "Gris perle et croix fine : la dignité du dernier adieu." },
  { id: 'funerailles-rameau',       categorieId: 'funerailles', nom: 'Rameau',       themeId: 'olivier',    fontId: 'lora',      coverStyle: 'botanique', ornement: 'rameau',
    description: "Le rameau d'olivier, promesse de paix, sur un ivoire très doux." },
  { id: 'funerailles-lumiere-soir', categorieId: 'funerailles', nom: 'Lumière du soir', themeId: 'ivoire-or', fontId: 'cormorant', coverStyle: 'photo', ornement: 'lumiere',
    description: "Le portrait de l'être cher, entouré d'or pâle et de silence." },

  /* Messe anniversaire */
  { id: 'anniversaire-memoire',   categorieId: 'messe-anniversaire', nom: 'Mémoire',     themeId: 'gris-perle', fontId: 'lora',      coverStyle: 'ornement', ornement: 'etoile',
    description: "Une étoile discrète pour garder mémoire, année après année." },
  { id: 'anniversaire-ciel',      categorieId: 'messe-anniversaire', nom: 'Ciel étoilé', themeId: 'bleu-nuit',  fontId: 'garamond',  coverStyle: 'typographique', ornement: 'etoile',
    description: "Bleu nuit et lettres claires : se souvenir, ensemble, à voix basse." },
  { id: 'anniversaire-tendresse', categorieId: 'messe-anniversaire', nom: 'Tendresse',   themeId: 'rose-poudre', fontId: 'cormorant', coverStyle: 'photo', ornement: 'croix',
    description: "Une photographie aimée, un cadre rose pâle, une messe du souvenir." },

  /* Jubilé */
  { id: 'jubile-action-de-grace', categorieId: 'jubile', nom: 'Action de grâce', themeId: 'ivoire-or', fontId: 'cormorant',  coverStyle: 'ornement', ornement: 'couronne',
    description: "La couronne d'or des grands anniversaires : noces d'or, jubilés sacerdotaux." },
  { id: 'jubile-vendanges',       categorieId: 'jubile', nom: 'Vendanges',       themeId: 'bordeaux',  fontId: 'playfair',   coverStyle: 'botanique', ornement: 'rameau',
    description: "Bordeaux profond et feuillages : la joie mûrie du chemin parcouru." },
  { id: 'jubile-jubilate',        categorieId: 'jubile', nom: 'Jubilate',        themeId: 'blanc-pur', fontId: 'montserrat', coverStyle: 'typographique', ornement: 'couronne',
    description: "Contemporain et éclatant : JUBILATE en lettres capitales." },
];

export const modeleById = (id) => MODELES.find((m) => m.id === id) || null;
export const modelesByCategorie = (categorieId) => MODELES.filter((m) => m.categorieId === categorieId);

/* ---------------- Champs par défaut (exemples réalistes, remplacés par le client) ---------------- */

const DEFAULT_FIELDS = {
  'bapteme':            { prenom: 'Louise', nom: 'Martin', prenom2: '', nom2: '', date: '2026-09-13', heure: '11 h 00', lieu: 'Église Saint-Sulpice', ville: 'Paris', celebrant: 'Père Étienne Morel' },
  'communion':          { prenom: 'Jules', nom: 'Fontaine', prenom2: '', nom2: '', date: '2026-06-07', heure: '10 h 30', lieu: 'Église Notre-Dame', ville: 'Versailles', celebrant: 'Père Jacques Renard' },
  'profession-foi':     { prenom: 'Camille', nom: 'Perrin', prenom2: '', nom2: '', date: '2026-05-24', heure: '10 h 30', lieu: 'Église Saint-Martin', ville: 'Tours', celebrant: 'Père Luc Berthier' },
  'confirmation':       { prenom: 'Raphaël', nom: 'Garnier', prenom2: '', nom2: '', date: '2026-06-14', heure: '16 h 00', lieu: 'Cathédrale Saint-Étienne', ville: 'Toulouse', celebrant: 'Monseigneur A. de Vaux' },
  'mariage':            { prenom: 'Claire', nom: 'Dubois', prenom2: 'Antoine', nom2: 'Lefèvre', date: '2026-09-12', heure: '15 h 00', lieu: 'Église Saint-Julien', ville: 'Annecy', celebrant: 'Père Bernard Chapuis' },
  'funerailles':        { prenom: 'Marie', nom: 'Rousseau', prenom2: '', nom2: '', date: '2026-07-08', heure: '14 h 30', lieu: 'Église Sainte-Croix', ville: 'Lyon', celebrant: 'Père Paul Girard' },
  'messe-anniversaire': { prenom: 'Jean', nom: 'Moreau', prenom2: '', nom2: '', date: '2026-10-04', heure: '18 h 30', lieu: 'Église Saint-Pierre', ville: 'Bordeaux', celebrant: 'Père Henri Lacoste' },
  'jubile':             { prenom: 'Anne', nom: 'Vasseur', prenom2: 'Pierre', nom2: 'Vasseur', date: '2026-08-30', heure: '11 h 00', lieu: 'Abbatiale Saint-Ouen', ville: 'Rouen', celebrant: 'Père Dominique Fabre' },
};

/* ---------------- Textes liturgiques réutilisés (domaine public / traditionnels) ---------------- */

const NOTRE_PERE =
  "Notre Père, qui es aux cieux,\nque ton nom soit sanctifié,\nque ton règne vienne,\nque ta volonté soit faite\nsur la terre comme au ciel.\nDonne-nous aujourd'hui\nnotre pain de ce jour.\nPardonne-nous nos offenses,\ncomme nous pardonnons aussi\nà ceux qui nous ont offensés.\nEt ne nous laisse pas entrer en tentation,\nmais délivre-nous du Mal.\nAmen.";

const CREDO_APOTRES =
  "Je crois en Dieu, le Père tout-puissant,\ncréateur du ciel et de la terre.\nEt en Jésus Christ, son Fils unique, notre Seigneur,\nqui a été conçu du Saint-Esprit,\nest né de la Vierge Marie,\na souffert sous Ponce Pilate,\na été crucifié, est mort et a été enseveli,\nest descendu aux enfers,\nle troisième jour est ressuscité des morts,\nest monté aux cieux,\nest assis à la droite de Dieu le Père tout-puissant,\nd'où il viendra juger les vivants et les morts.\nJe crois en l'Esprit Saint,\nà la sainte Église catholique,\nà la communion des saints,\nà la rémission des péchés,\nà la résurrection de la chair,\nà la vie éternelle.\nAmen.";

/* ---------------- Petites fabriques de blocs ---------------- */

const cover   = (title, subtitle) => ({ type: 'cover', title, subtitle, showOrnament: true });
const heading = (text) => ({ type: 'heading', text });
const sub     = (text) => ({ type: 'subheading', text });
const txt     = (text, align = 'center') => ({ type: 'text', text, align });
const chant   = (categorieLiturgique, chantId) => ({ type: 'chant', categorieLiturgique, chantId, custom: null });
const lecture = (reference, titre, extrait = '') => ({ type: 'lecture', reference, titre, extrait });
const priere  = (titre, texte) => ({ type: 'priere', titre, texte });
const photo   = (caption = '', shape = 'arch') => ({ type: 'photo', src: null, caption, shape });
const orn     = (motif) => ({ type: 'ornament', motif });
const spacer  = (size = 'm') => ({ type: 'spacer', size });
const merci   = (texte) => ({ type: 'remerciement', texte });
const derou   = (items) => ({ type: 'deroulement', items });

/* ---------------- Structures par défaut, par cérémonie ---------------- */
/* Chaque builder renvoie un tableau de pages = tableaux de blocs. */

const PAGE_BUILDERS = {
  'bapteme': () => [
    [cover('Baptême de', '{{prenom}}')],
    [heading('Accueil'), txt("« Laissez venir à moi les petits enfants. »\n— Évangile selon saint Marc"),
     spacer('m'), chant('entree', 'entree-dieu-nous-a-tous-appeles')],
    [heading('Liturgie de la Parole'),
     lecture('Première lecture', 'Lettre de saint Paul aux Romains', ''),
     chant('psaume', 'psaume-22'),
     lecture('Évangile', 'Évangile de Jésus Christ selon saint Marc', '')],
    [heading('Le rite du baptême'),
     sub("Bénédiction de l'eau"),
     txt("Le célébrant bénit l'eau du baptême, source de vie nouvelle."),
     sub('Le baptême'),
     txt("« {{prenom}}, je te baptise au nom du Père,\net du Fils, et du Saint-Esprit. »"),
     sub('Onction du saint chrême · vêtement blanc · cierge allumé')],
    [heading('Prière'), priere('Notre Père', NOTRE_PERE),
     chant('action-grace', 'grace-je-vous-salue')],
    [heading('Envoi'), chant('final', 'final-chez-nous'),
     spacer('m'), orn('colombe'),
     merci("La famille de {{prenom}} vous remercie de l'avoir entourée\nen ce jour de baptême.\n\n{{lieu}}, {{ville}} — {{date}}")],
  ],

  'communion': () => [
    [cover('Première communion de', '{{prenom}}')],
    [heading('Ouverture de la célébration'),
     chant('entree', 'entree-peuple-de-dieu'),
     chant('kyrie', 'kyrie-dialogue'),
     chant('gloria', 'gloria-lourdes')],
    [heading('Liturgie de la Parole'),
     lecture('Première lecture', 'Livre de l\'Exode', ''),
     chant('psaume', 'psaume-33'),
     chant('alleluia', 'alleluia-irlandais'),
     lecture('Évangile', 'Évangile de Jésus Christ selon saint Jean', '« Je suis le pain de la vie. »')],
    [heading('Liturgie eucharistique'),
     chant('offertoire', 'offertoire-ubi-caritas'),
     chant('sanctus', 'sanctus-xviii'),
     priere('Notre Père', NOTRE_PERE)],
    [heading('Communion'),
     chant('agneau', 'agnus-francais'),
     txt("{{prenom}} communie pour la première fois\nau Corps du Christ."),
     chant('communion', 'communion-panis-angelicus')],
    [heading('Envoi'),
     chant('action-grace', 'grace-magnificat'),
     chant('final', 'final-quexulte'),
     merci("Merci d'avoir accompagné {{prenom}}\nen ce jour de première communion.\n\n{{lieu}}, {{ville}} — {{date}}")],
  ],

  'profession-foi': () => [
    [cover('Profession de foi de', '{{prenom}}')],
    [heading('Accueil'),
     chant('entree', 'entree-dieu-nous-a-tous-appeles'),
     chant('kyrie', 'kyrie-trinite'),
     chant('gloria', 'gloria-saint-boniface')],
    [heading('Liturgie de la Parole'),
     lecture('Lecture', 'Lettre de saint Paul aux Éphésiens', ''),
     chant('psaume', 'psaume-33'),
     chant('alleluia', 'alleluia-irlandais'),
     lecture('Évangile', 'Évangile de Jésus Christ selon saint Matthieu', '')],
    [heading('Profession de foi'),
     txt('Les jeunes renouvellent, à voix haute,\nles promesses de leur baptême, cierge en main.'),
     priere('Symbole des Apôtres', CREDO_APOTRES)],
    [heading('Liturgie eucharistique'),
     chant('sanctus', 'sanctus-saint-severin'),
     priere('Notre Père', NOTRE_PERE),
     chant('agneau', 'agnus-francais'),
     chant('communion', 'communion-demeure')],
    [heading('Envoi'),
     chant('final', 'final-couronnee'),
     orn('lumiere'),
     merci("Merci de votre présence et de vos prières\nautour de {{prenom}}.\n\n{{lieu}}, {{ville}} — {{date}}")],
  ],

  'confirmation': () => [
    [cover('Confirmation de', '{{prenom}}')],
    [heading('Ouverture'),
     chant('entree', 'entree-veni-creator'),
     chant('gloria', 'gloria-viii')],
    [heading('Liturgie de la Parole'),
     lecture('Première lecture', 'Livre du prophète Isaïe', ''),
     chant('psaume', 'psaume-33'),
     lecture('Évangile', 'Évangile de Jésus Christ selon saint Jean', '« L\'Esprit de vérité vous conduira dans la vérité tout entière. »')],
    [heading('Sacrement de confirmation'),
     sub('Appel des confirmands'),
     sub('Imposition des mains'),
     txt("L'évêque étend les mains sur les confirmands\net invoque le don de l'Esprit Saint."),
     sub('Onction du saint chrême'),
     txt("« {{prenom}}, sois marqué de l'Esprit Saint,\nle don de Dieu. »")],
    [heading('Liturgie eucharistique'),
     chant('sanctus', 'sanctus-xviii'),
     priere('Notre Père', NOTRE_PERE),
     chant('agneau', 'agnus-xviii'),
     chant('communion', 'communion-adoro-te')],
    [heading('Envoi'),
     chant('final', 'final-quexulte'),
     orn('flamme'),
     merci("Merci d'avoir entouré {{prenom}}\nen ce jour de confirmation.\n\n{{lieu}}, {{ville}} — {{date}}")],
  ],

  'mariage': () => [
    [cover('Célébration du mariage', '{{prenom}} & {{prenom2}}')],
    [heading('Accueil'),
     txt("{{prenom}} et {{prenom2}} sont heureux de vous accueillir\npour célébrer leur mariage devant Dieu.\n\n{{lieu}} — {{ville}}"),
     chant('entree', 'entree-peuple-de-dieu'),
     chant('gloria', 'gloria-lourdes')],
    [heading('Liturgie de la Parole'),
     lecture('Première lecture', 'Cantique des cantiques', '« L\'amour est fort comme la mort ; ses flammes sont des flammes brûlantes. »'),
     chant('psaume', 'psaume-127'),
     chant('alleluia', 'alleluia-irlandais'),
     lecture('Évangile', 'Évangile de Jésus Christ selon saint Jean', '« Aimez-vous les uns les autres comme je vous ai aimés. »')],
    [heading('Échange des consentements'),
     txt("« {{prenom}}, veux-tu être ma femme ? »\n« {{prenom2}}, veux-tu être mon mari ? »", 'center'),
     sub('Bénédiction et remise des alliances'),
     txt("« {{prenom}}, reçois cette alliance,\nsigne de mon amour et de ma fidélité. »"),
     orn('anneaux')],
    [heading('Liturgie eucharistique'),
     chant('offertoire', 'offertoire-instrumental'),
     chant('sanctus', 'sanctus-saint-severin'),
     priere('Notre Père', NOTRE_PERE),
     chant('agneau', 'agnus-francais'),
     chant('communion', 'communion-devenez')],
    [heading('Signature des registres'),
     chant('action-grace', 'grace-ave-maria-lourdes'),
     txt('Pendant la signature, un temps de musique\nvous est offert pour la prière et le recueillement.')],
    [heading('Envoi'),
     chant('final', 'final-quexulte'),
     merci("{{prenom}} & {{prenom2}}\nvous remercient de tout cœur de votre présence.\n\n{{lieu}}, {{ville}} — {{date}}")],
    [orn('anneaux'), spacer('l'),
     txt('« Ce que Dieu a uni,\nque l\'homme ne le sépare pas. »', 'center'),
     spacer('l'), photo('Un souvenir de nos fiançailles', 'oval')],
  ],

  'funerailles': () => [
    [cover('À la mémoire de', '{{prenom}} {{nom}}')],
    [heading('Accueil'),
     txt("La famille de {{prenom}} vous remercie\nde votre présence en ce jour d'adieu."),
     chant('entree', 'entree-seuil-maison'),
     sub('Aspersion et lumière'),
     txt("Le cercueil est béni et le cierge pascal allumé,\nsigne de la Résurrection.")],
    [heading('Liturgie de la Parole'),
     lecture('Lecture', 'Lettre de saint Paul aux Romains', '« Rien ne pourra nous séparer de l\'amour de Dieu. »'),
     chant('psaume', 'psaume-22'),
     lecture('Évangile', 'Évangile de Jésus Christ selon saint Jean', '« Je suis la résurrection et la vie. »')],
    [heading('Prière'),
     priere('Notre Père', NOTRE_PERE),
     chant('action-grace', 'grace-je-vous-salue'),
     chant('communion', 'communion-anima-christi')],
    [heading('Dernier adieu'),
     txt("Chacun est invité à s'avancer\npour un geste d'adieu et de bénédiction."),
     chant('final', 'final-in-paradisum')],
    [orn('rameau'),
     txt('« Je suis la résurrection et la vie.\nCelui qui croit en moi, même s\'il meurt, vivra. »', 'center'),
     spacer('l'),
     merci("La famille remercie chaleureusement\ntoutes les personnes qui s'associent à sa peine.\n\n{{lieu}}, {{ville}} — {{date}}")],
  ],

  'messe-anniversaire': () => [
    [cover('Messe anniversaire', 'en mémoire de {{prenom}} {{nom}}')],
    [heading('Accueil'),
     txt("Un an déjà. Nous nous rassemblons pour prier\net rendre grâce pour la vie de {{prenom}}."),
     chant('entree', 'entree-seuil-maison'),
     chant('kyrie', 'kyrie-xviii')],
    [heading('Liturgie de la Parole'),
     lecture('Lecture', 'Livre de la Sagesse', '« Les âmes des justes sont dans la main de Dieu. »'),
     chant('psaume', 'psaume-22'),
     lecture('Évangile', 'Évangile de Jésus Christ selon saint Luc', '')],
    [heading('Liturgie eucharistique'),
     chant('sanctus', 'sanctus-xviii'),
     priere('Notre Père', NOTRE_PERE),
     chant('agneau', 'agnus-xviii'),
     chant('communion', 'communion-panis-angelicus')],
    [heading('Envoi'),
     chant('final', 'final-salve-regina'),
     orn('etoile'),
     merci("Merci de vous être unis à notre prière.\n\n{{lieu}}, {{ville}} — {{date}}")],
    [spacer('l'), photo('{{prenom}} {{nom}}', 'oval'), spacer('m'),
     txt('« Ce qui est semé périssable\nressuscite impérissable. »', 'center')],
  ],

  'jubile': () => [
    [cover('Jubilé · action de grâce', '{{prenom}} & {{prenom2}}')],
    [heading('Accueil'),
     txt("Entourés de leur famille et de leurs amis,\n{{prenom}} et {{prenom2}} rendent grâce\npour les années de leur alliance."),
     chant('entree', 'entree-peuple-de-dieu'),
     chant('gloria', 'gloria-viii')],
    [heading('Liturgie de la Parole'),
     lecture('Lecture', 'Lettre de saint Paul aux Colossiens', '« Par-dessus tout, revêtez-vous de l\'amour. »'),
     chant('psaume', 'psaume-127'),
     lecture('Évangile', 'Évangile de Jésus Christ selon saint Jean', '« Demeurez dans mon amour. »')],
    [heading('Renouvellement des engagements'),
     txt("{{prenom}} et {{prenom2}} renouvellent devant Dieu\nles promesses échangées il y a cinquante ans."),
     orn('couronne'),
     chant('action-grace', 'grace-magnificat')],
    [heading('Liturgie eucharistique'),
     chant('sanctus', 'sanctus-xviii'),
     priere('Notre Père', NOTRE_PERE),
     chant('communion', 'communion-devenez')],
    [heading('Envoi'),
     chant('final', 'final-quexulte'),
     merci("Merci d'avoir partagé cette action de grâce.\n\n{{lieu}}, {{ville}} — {{date}}")],
  ],
};

/* ---------------- Fabrique de projet ---------------- */

/** Construit un projet complet et prêt à éditer à partir d'un modèle. */
export function buildDefaultProject(modeleId) {
  const modele = modeleById(modeleId) || MODELES[0];
  const categorie = categorieById(modele.categorieId) || CATEGORIES[0];
  const builder = PAGE_BUILDERS[modele.categorieId] || PAGE_BUILDERS['mariage'];

  const pages = builder().map((blocks) => ({
    id: uid('page'),
    blocks: blocks.map((b) => ({ id: uid('b'), ...deepClone(b) })),
  }));

  // La couverture porte le style du modèle (variante + motif).
  const coverBlock = pages[0]?.blocks.find((b) => b.type === 'cover');
  if (coverBlock) {
    coverBlock.variant = modele.coverStyle;
    coverBlock.ornament = modele.ornement;
  }

  return {
    id: uid('prj'),
    nom: `${categorie.nom} — modèle ${modele.nom}`,
    modeleId: modele.id,
    categorieId: modele.categorieId,
    themeId: modele.themeId,
    fontId: modele.fontId,
    papier: 'couche',                 // papier par défaut (choisi dans le configurateur)
    fields: deepClone(DEFAULT_FIELDS[modele.categorieId] || DEFAULT_FIELDS['mariage']),
    pages,
    updatedAt: Date.now(),
  };
}
