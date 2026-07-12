/* Les 8 catégories de cérémonies. `ornement` référence components/ornaments.js */

export const CATEGORIES = [
  {
    id: 'bapteme',
    nom: 'Baptême',
    ornement: 'coquille',
    accroche: 'Accueillir un enfant dans la lumière',
    description:
      "Un livret doux et lumineux pour accompagner l'entrée de votre enfant dans la communauté : "
      + "rite de l'eau, onction, vêtement blanc et cierge y trouvent naturellement leur place.",
  },
  {
    id: 'communion',
    nom: 'Première Communion',
    ornement: 'calice',
    accroche: 'Un premier rendez-vous avec l\'essentiel',
    description:
      "La messe de première communion, pas à pas : chants, lectures et temps forts, "
      + "pour que l'assemblée accompagne l'enfant dans ce moment fondateur.",
  },
  {
    id: 'profession-foi',
    nom: 'Profession de foi',
    ornement: 'lumiere',
    accroche: 'Dire sa foi à voix haute',
    description:
      "Un livret sobre et fervent pour la profession de foi : renouvellement des promesses "
      + "du baptême, credo et chants choisis par les jeunes.",
  },
  {
    id: 'confirmation',
    nom: 'Confirmation',
    ornement: 'flamme',
    accroche: 'Recevoir le souffle de l\'Esprit',
    description:
      "Pour la confirmation, un livret qui met en valeur l'appel des confirmands, "
      + "l'imposition des mains et l'onction du saint chrême.",
  },
  {
    id: 'mariage',
    nom: 'Mariage',
    ornement: 'anneaux',
    accroche: 'Deux prénoms, une promesse',
    description:
      "Le livret de votre célébration de mariage : accueil des invités, liturgie de la Parole, "
      + "échange des consentements, bénédiction des alliances et chants de fête.",
  },
  {
    id: 'funerailles',
    nom: 'Funérailles',
    ornement: 'rameau',
    accroche: 'Accompagner avec douceur',
    description:
      "Un livret digne et apaisant pour la célébration des funérailles : il guide l'assemblée, "
      + "porte les textes choisis et reste, après la cérémonie, comme un souvenir.",
  },
  {
    id: 'messe-anniversaire',
    nom: 'Messe anniversaire',
    ornement: 'etoile',
    accroche: 'Se souvenir, ensemble',
    description:
      "Pour une messe anniversaire ou du souvenir : un livret discret qui rassemble intentions, "
      + "lectures et chants autour de la mémoire d'un être cher.",
  },
  {
    id: 'jubile',
    nom: 'Jubilé',
    ornement: 'couronne',
    accroche: 'Rendre grâce pour le chemin parcouru',
    description:
      "Noces d'or, jubilé sacerdotal ou anniversaire de communauté : un livret d'action de grâce "
      + "à la hauteur des années célébrées.",
  },
];

export const categorieById = (id) => CATEGORIES.find((c) => c.id === id) || null;
