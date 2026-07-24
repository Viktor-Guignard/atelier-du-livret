/*
 * Base de connaissances de l'assistant (aucune IA : uniquement ces réponses).
 *
 * Chaque entrée : { id, cat, q, a, kw, suite? }
 *   q     — la question telle qu'on la propose au visiteur
 *   a     — LA réponse affichée (rien d'autre ne sera jamais dit)
 *   kw    — mots-clés de rattrapage (en plus des mots de `q`), sans accent requis
 *   suite — ids de questions proposées ensuite
 *
 * ⚠️ Les montants cités ici sont FIGÉS dans le texte : si la marge (TARIFS.marge
 * dans js/core/api.js), la grille Imprigraphic ou les frais de création changent,
 * il faut relire les réponses de la catégorie « prix ».
 */

export const FAQ_CATEGORIES = [
  { id: 'prix', label: 'Prix & devis' },
  { id: 'perso', label: 'Personnalisation' },
  { id: 'chants', label: 'Chants & textes' },
  { id: 'papier', label: 'Papiers & finition' },
  { id: 'commande', label: 'Commander' },
  { id: 'bat', label: 'Bon à tirer' },
  { id: 'livraison', label: 'Livraison' },
  { id: 'paiement', label: 'Paiement & facture' },
  { id: 'ceremonies', label: 'Cérémonies' },
  { id: 'pratique', label: 'Questions pratiques' },
];

export const FAQ = [

  /* ============================ PRIX & DEVIS ============================ */

  {
    id: 'prix-combien', cat: 'prix',
    q: 'Combien coûte un livret ?',
    a: 'Le prix dépend du nombre d\'exemplaires, du nombre de pages et du papier. À titre d\'exemple : <strong>100 livrets A5 de 12 pages sur Condat Silk reviennent à 595,20 € TTC</strong>, soit environ 5,95 € le livret (création personnalisée et bon à tirer compris).<br><br>Le configurateur calcule votre prix exact en direct, à chaque modification — c\'est lui qui fait foi.',
    kw: ['prix', 'cout', 'tarif', 'combien', 'cher', 'budget', 'ca coute', 'montant'],
    suite: ['prix-degressif', 'prix-inclus', 'prix-devis'],
  },
  {
    id: 'prix-degressif', cat: 'prix',
    q: 'Le prix baisse-t-il si j\'en commande plus ?',
    a: 'Oui, nettement. Sur un livret de 12 pages en Condat Silk :<br>• 50 ex. → environ 10,18 € le livret<br>• 100 ex. → environ 5,95 €<br>• 300 ex. → environ 2,74 €<br><br>Plus la quantité monte, plus le coût fixe de calage se répartit — d\'où l\'écart important entre 50 et 300 exemplaires.',
    kw: ['degressif', 'quantite', 'plus', 'moins cher', 'reduction', 'remise', 'volume', 'gros'],
    suite: ['prix-combien', 'commande-minimum'],
  },
  {
    id: 'prix-inclus', cat: 'prix',
    q: 'Qu\'est-ce qui est compris dans le prix ?',
    a: 'Tout, sauf la livraison :<br>• la création personnalisée de votre livret<br>• le bon à tirer numérique et vos corrections<br>• l\'impression sur le papier choisi, couverture 250 g rainée<br>• l\'assemblage et la piqûre métal<br><br>La livraison se choisit au moment de commander (retrait gratuit, Paris, ou Chronopost).',
    kw: ['inclus', 'compris', 'comprend', 'contient', 'sans supplement', 'cache'],
    suite: ['prix-creation', 'livraison-modes'],
  },
  {
    id: 'prix-creation', cat: 'prix',
    q: 'Y a-t-il des frais de création ?',
    a: 'Les frais de création personnalisée et de bon à tirer sont de <strong>120 € TTC</strong>, et ils sont <strong>offerts dès 800 € de commande</strong>. Sur une commande de 300 exemplaires, par exemple, ils ne s\'appliquent pas.',
    kw: ['frais', 'creation', 'mise en page', 'supplement', 'offert', '120'],
    suite: ['prix-combien', 'prix-inclus'],
  },
  {
    id: 'prix-devis', cat: 'prix',
    q: 'Puis-je avoir un devis écrit ?',
    a: 'Oui, immédiatement et sans nous écrire : dans le configurateur et sur la page de commande, le bouton <strong>« Télécharger le devis (PDF) »</strong> génère un devis complet et daté, prêt à présenter à votre paroisse ou à votre famille.',
    kw: ['devis', 'pdf', 'ecrit', 'papier', 'justificatif', 'estimation'],
    suite: ['prix-validite', 'prix-combien'],
  },
  {
    id: 'prix-validite', cat: 'prix',
    q: 'Combien de temps le devis est-il valable ?',
    a: 'Le devis est <strong>ferme pendant 30 jours</strong>. Au-delà, les tarifs papier peuvent avoir évolué : régénérez simplement un devis depuis le site, c\'est instantané.',
    kw: ['validite', 'valable', 'combien de temps', 'expire', '30 jours', 'ferme'],
    suite: ['prix-devis'],
  },
  {
    id: 'prix-tva', cat: 'prix',
    q: 'Les prix sont-ils TTC ou HT ?',
    a: 'Tous les prix affichés sur le site sont <strong>TTC</strong> (TVA 20 % comprise). Le détail HT / TVA figure sur votre facture.',
    kw: ['tva', 'ttc', 'ht', 'taxe', 'hors taxe', 'toutes taxes'],
    suite: ['paiement-facture'],
  },
  {
    id: 'prix-pages', cat: 'prix',
    q: 'Le nombre de pages change-t-il le prix ?',
    a: 'Oui : l\'impression se fait en cahiers de 4 pages, et chaque cahier supplémentaire a un coût. Passer de 12 à 16 pages augmente donc le prix, mais de façon mesurée. Le configurateur recalcule tout en direct dès que vous ajoutez une page.',
    kw: ['pages', 'nombre de pages', 'plus de pages', 'cahier', 'epais'],
    suite: ['perso-pages', 'perso-multiple4'],
  },
  {
    id: 'prix-comparaison-papier', cat: 'prix',
    q: 'Quel papier est le moins cher ?',
    a: 'Le <strong>Condat Silk</strong> (couché demi-mat 150 g) est le plus économique. Le <strong>Old Mill Premium White</strong>, papier de création 160 g, est plus haut de gamme : comptez environ 35 % de plus. Pour 100 livrets de 12 pages : 595,20 € en Condat Silk contre 811,20 € en Old Mill.',
    kw: ['papier moins cher', 'economique', 'difference prix papier', 'old mill prix', 'condat prix'],
    suite: ['papier-lequel', 'papier-difference'],
  },
  {
    id: 'prix-acompte', cat: 'prix',
    q: 'Faut-il verser un acompte ?',
    a: 'Non. Vous ne payez qu\'une fois votre projet arrêté : soit dès la commande si vous le souhaitez, soit après avoir validé votre bon à tirer. Rien ne vous est débité avant.',
    kw: ['acompte', 'arrhes', 'avance', 'avant', 'prepaiement', 'caution'],
    suite: ['paiement-quand', 'bat-cest-quoi'],
  },
  {
    id: 'prix-paroisse', cat: 'prix',
    q: 'Faites-vous un tarif pour les paroisses ?',
    a: 'Les tarifs dégressifs s\'appliquent à tout le monde, et une paroisse commande souvent en volume — donc au meilleur prix de la grille. Pour un besoin récurrent (plusieurs célébrations dans l\'année), écrivez-nous : nous étudierons la demande.',
    kw: ['paroisse', 'eglise', 'association', 'tarif special', 'professionnel', 'recurrent'],
    suite: ['pratique-contact', 'prix-degressif'],
  },
  {
    id: 'prix-modification', cat: 'prix',
    q: 'Les corrections sont-elles payantes ?',
    a: 'Non. Vous modifiez votre livret autant de fois que vous le voulez avant de commander, et les corrections demandées sur le bon à tirer sont comprises. C\'est le principe : rien ne part à l\'impression tant que ce n\'est pas exactement ce que vous voulez.',
    kw: ['correction', 'modification', 'changer', 'retouche', 'payant', 'gratuit'],
    suite: ['bat-corriger', 'commande-modifier'],
  },

  /* ========================= PERSONNALISATION ========================= */

  {
    id: 'perso-comment', cat: 'perso',
    q: 'Comment personnaliser mon livret ?',
    a: 'Choisissez une cérémonie, puis un modèle : le configurateur s\'ouvre. Vous y réglez les prénoms, la date, le lieu, les textes, les chants, les couleurs, la police, les photos et le papier — et vous voyez le résultat se transformer en direct, page par page.<br><br>Aucun compte n\'est nécessaire, votre travail est sauvegardé automatiquement.',
    kw: ['personnaliser', 'modifier', 'creer', 'comment faire', 'configurateur', 'editer'],
    suite: ['perso-competence', 'perso-sauvegarde', 'ceremonies-liste'],
  },
  {
    id: 'perso-competence', cat: 'perso',
    q: 'Faut-il savoir se servir d\'un ordinateur ?',
    a: 'Si vous savez écrire un e-mail, vous saurez faire votre livret. On tape dans des cases, on coche des chants, on clique sur une couleur — il n\'y a aucun logiciel à installer et rien à télécharger.<br><br>Et si vous préférez, écrivez-nous : nous pouvons composer le livret pour vous à partir de vos textes.',
    kw: ['difficile', 'complique', 'savoir', 'competence', 'informatique', 'age', 'facile', 'aide'],
    suite: ['perso-a-ma-place', 'perso-comment'],
  },
  {
    id: 'perso-a-ma-place', cat: 'perso',
    q: 'Pouvez-vous faire le livret à ma place ?',
    a: 'Oui. Envoyez-nous vos textes (même dans un simple document Word ou un e-mail) en précisant la cérémonie et la date, et nous composons le livret pour vous. Vous recevrez ensuite un bon à tirer à valider, comme pour toute commande.',
    kw: ['a ma place', 'pour moi', 'vous faites', 'sous traitance', 'deleguer', 'pas le temps'],
    suite: ['pratique-contact', 'bat-cest-quoi'],
  },
  {
    id: 'perso-sauvegarde', cat: 'perso',
    q: 'Mon travail est-il sauvegardé si je ferme la page ?',
    a: 'Oui. Votre livret est enregistré automatiquement sur votre appareil : vous pouvez fermer l\'onglet et revenir plus tard, tout sera là. Pour retrouver votre panier sur un autre ordinateur ou téléphone, notez le <strong>code panier « PAN-XXXXXX »</strong> affiché sur la page Panier.',
    kw: ['sauvegarde', 'enregistre', 'perdre', 'fermer', 'revenir', 'plus tard', 'brouillon'],
    suite: ['pratique-code-panier', 'pratique-autre-appareil'],
  },
  {
    id: 'perso-photo', cat: 'perso',
    q: 'Puis-je mettre une photo ?',
    a: 'Oui. Vous pouvez ajouter vos propres photos dans le livret — une photo de couverture, un portrait, une image de la paroisse. Utilisez des fichiers nets et bien éclairés : une photo prise au téléphone récent convient parfaitement.',
    kw: ['photo', 'image', 'portrait', 'illustration', 'ajouter photo', 'jpeg', 'png'],
    suite: ['perso-logo', 'perso-qualite-photo'],
  },
  {
    id: 'perso-qualite-photo', cat: 'perso',
    q: 'Quelle qualité de photo faut-il ?',
    a: 'Une photo d\'au moins 1 500 pixels de large donne un très bon résultat imprimé. Évitez les images récupérées sur les réseaux sociaux (souvent trop compressées) et les captures d\'écran. Dans le doute, nous vous le signalons au moment du bon à tirer.',
    kw: ['qualite photo', 'resolution', 'pixel', 'dpi', 'flou', 'nette', 'taille image'],
    suite: ['perso-photo', 'bat-cest-quoi'],
  },
  {
    id: 'perso-logo', cat: 'perso',
    q: 'Puis-je ajouter le logo de ma paroisse ?',
    a: 'Oui, un bloc « Logo » est prévu dans le configurateur, avec trois tailles au choix. Il accepte aussi bien un logo de paroisse qu\'un monogramme ou un blason familial. Un fichier sur fond transparent (PNG) donne le plus beau rendu.',
    kw: ['logo', 'blason', 'monogramme', 'embleme', 'armoiries', 'paroisse'],
    suite: ['perso-photo', 'prix-paroisse'],
  },
  {
    id: 'perso-couleurs', cat: 'perso',
    q: 'Puis-je changer les couleurs et la police ?',
    a: 'Oui, dans l\'onglet <strong>Style</strong> du configurateur. Plusieurs harmonies de couleurs et plusieurs polices sont proposées, toutes choisies pour rester lisibles et dignes d\'une célébration. Le livret se met à jour instantanément.',
    kw: ['couleur', 'police', 'typographie', 'style', 'charte', 'font', 'design'],
    suite: ['perso-comment', 'perso-modele-libre'],
  },
  {
    id: 'perso-pages', cat: 'perso',
    q: 'Puis-je ajouter ou supprimer des pages ?',
    a: 'Oui, autant que vous voulez : le bouton <strong>+ Page</strong> sous les vignettes en ajoute une, et chaque page peut être supprimée. Le prix se recalcule aussitôt, par cahiers de 4 pages.',
    kw: ['ajouter page', 'supprimer page', 'nombre de pages', 'plus de pages', 'enlever'],
    suite: ['perso-multiple4', 'prix-pages'],
  },
  {
    id: 'perso-multiple4', cat: 'perso',
    q: 'Pourquoi mon livret est-il imprimé en 12 pages alors que j\'en ai créé 6 ?',
    a: 'Parce qu\'un livret agrafé est fait de feuilles pliées : le total imprimé est toujours un <strong>multiple de 4</strong>, avec un minimum de 12 pages. Les pages en trop restent blanches — c\'est normal et cela ne se voit pas, elles servent souvent de page de garde ou de page de notes.',
    kw: ['multiple de 4', '12 pages', 'pages blanches', 'pourquoi 12', 'cahier', 'arrondi'],
    suite: ['perso-pages', 'papier-reliure'],
  },
  {
    id: 'perso-format', cat: 'perso',
    q: 'Quels formats proposez-vous ?',
    a: 'Le format est le <strong>A5 (148 × 210 mm)</strong>, refermé — le format de référence du livret de célébration : assez grand pour être lu sans lunettes, assez compact pour tenir en main pendant tout l\'office.',
    kw: ['format', 'taille', 'a5', 'a4', 'dimension', 'grandeur', 'cm'],
    suite: ['papier-reliure', 'perso-multiple4'],
  },
  {
    id: 'perso-modele-libre', cat: 'perso',
    q: 'Suis-je obligé de suivre le modèle choisi ?',
    a: 'Pas du tout. Le modèle est un point de départ : vous pouvez remplacer chaque texte, changer l\'ordre des pages, en ajouter, changer les couleurs. Deux livrets partis du même modèle peuvent être méconnaissables.',
    kw: ['modele', 'obligé', 'contrainte', 'liberte', 'changer modele', 'modifier structure'],
    suite: ['perso-couleurs', 'perso-changer-modele'],
  },
  {
    id: 'perso-changer-modele', cat: 'perso',
    q: 'Puis-je changer de modèle en cours de route ?',
    a: 'Le plus simple est de créer un nouveau livret à partir de l\'autre modèle : vos textes déjà saisis restent dans le premier, que vous pouvez garder ouvert dans un autre onglet pour les recopier. Vos deux projets restent enregistrés.',
    kw: ['changer modele', 'autre modele', 'recommencer', 'switcher'],
    suite: ['perso-modele-libre', 'perso-sauvegarde'],
  },
  {
    id: 'perso-plusieurs-livrets', cat: 'perso',
    q: 'Puis-je commander plusieurs livrets différents ?',
    a: 'Oui : chaque livret que vous créez s\'ajoute à votre panier, avec sa propre quantité, son papier et ses options. Une seule commande, un seul règlement, mais un bon à tirer par livret.',
    kw: ['plusieurs', 'deux livrets', 'differents', 'panier', 'multiple', 'plusieurs ceremonies'],
    suite: ['commande-panier', 'bat-plusieurs'],
  },

  /* =========================== CHANTS & TEXTES =========================== */

  {
    id: 'chants-bibliotheque', cat: 'chants',
    q: 'Proposez-vous une bibliothèque de chants ?',
    a: 'Oui, environ <strong>70 chants</strong> classés par moment de la célébration (entrée, Gloria, psaume, offertoire, communion, envoi…). Vous les parcourez, vous cliquez, ils s\'insèrent dans le livret avec leur mise en page.',
    kw: ['chants', 'bibliotheque', 'liste', 'repertoire', 'cantiques', 'musique', 'combien de chants'],
    suite: ['chants-perso', 'chants-droits', 'chants-classement'],
  },
  {
    id: 'chants-perso', cat: 'chants',
    q: 'Puis-je ajouter un chant qui n\'est pas dans la liste ?',
    a: 'Oui, sans limite : le bouton « Chant personnalisé » vous laisse saisir le titre et les paroles de votre choix, avec la même mise en page que les autres. Pratique pour un chant propre à votre paroisse ou une composition familiale.',
    kw: ['ajouter chant', 'chant personnalise', 'pas dans la liste', 'mon chant', 'autre chant'],
    suite: ['chants-bibliotheque', 'chants-droits'],
  },
  {
    id: 'chants-droits', cat: 'chants',
    q: 'Les paroles des chants sont-elles libres de droits ?',
    a: 'Les chants du domaine public sont fournis <strong>en intégralité</strong>. Les chants liturgiques contemporains restent protégés : nous n\'en affichons qu\'un extrait, et il vous appartient de les reproduire dans le cadre de la <strong>licence SECLI</strong> de votre paroisse (la plupart des paroisses en disposent — demandez à votre curé ou à l\'équipe liturgique).',
    kw: ['droits', 'secli', 'droit auteur', 'copyright', 'licence', 'legal', 'tronque', 'extrait'],
    suite: ['chants-secli-comment', 'chants-perso'],
  },
  {
    id: 'chants-secli-comment', cat: 'chants',
    q: 'Comment fonctionne la licence SECLI ?',
    a: 'La SECLI gère les droits des chants liturgiques francophones. Beaucoup de paroisses ont un contrat annuel qui les autorise à reproduire les paroles dans leurs supports de célébration. Renseignez-vous auprès de votre paroisse : si elle est couverte, vous pouvez saisir les paroles complètes dans un chant personnalisé.',
    kw: ['secli', 'licence', 'contrat', 'autorisation', 'reproduire', 'paroisse droits'],
    suite: ['chants-droits', 'chants-perso'],
  },
  {
    id: 'chants-classement', cat: 'chants',
    q: 'Les chants sont-ils classés par moment de la messe ?',
    a: 'Oui, exactement : entrée, Kyrie, Gloria, psaume, acclamation, offertoire, Sanctus, Agnus Dei, communion, action de grâce, envoi, et les chants mariaux. Vous suivez le déroulé de la célébration sans rien oublier.',
    kw: ['classement', 'moment', 'ordre', 'categorie', 'entree', 'communion', 'envoi', 'deroule'],
    suite: ['chants-bibliotheque', 'ceremonies-structure'],
  },
  {
    id: 'chants-partitions', cat: 'chants',
    q: 'Imprimez-vous les partitions ?',
    a: 'Non, le livret contient les <strong>paroles</strong>, pas les portées musicales : c\'est ce qu\'attend l\'assemblée. Si vous tenez à une partition (pour la chorale, par exemple), insérez-la comme une image dans une page.',
    kw: ['partition', 'portee', 'musique', 'notes', 'solfege', 'accords'],
    suite: ['perso-photo', 'chants-bibliotheque'],
  },
  {
    id: 'chants-prieres', cat: 'chants',
    q: 'Les prières sont-elles fournies en entier ?',
    a: 'Oui : Notre Père, Je vous salue Marie, Credo, Confiteor, prière universelle… sont proposés dans leur texte intégral, dans leur traduction liturgique en usage. Vous pouvez bien sûr les adapter.',
    kw: ['priere', 'notre pere', 'credo', 'je vous salue', 'texte liturgique', 'complet', 'entier'],
    suite: ['chants-lectures', 'chants-droits'],
  },
  {
    id: 'chants-lectures', cat: 'chants',
    q: 'Puis-je mettre les lectures et l\'Évangile ?',
    a: 'Oui, saisissez-les dans une page de texte. Beaucoup de familles préfèrent n\'indiquer que la référence (« Première lettre aux Corinthiens 12, 31 – 13, 8 ») pour alléger le livret, et laisser la lecture se faire à voix haute — les deux se défendent.',
    kw: ['lecture', 'evangile', 'epitre', 'premiere lecture', 'psaume', 'reference biblique'],
    suite: ['chants-prieres', 'perso-comment'],
  },
  {
    id: 'chants-latin', cat: 'chants',
    q: 'Gérez-vous le latin ou une autre langue ?',
    a: 'Oui, vous pouvez saisir n\'importe quel texte : latin (Ave verum, Salve Regina, Pater noster), mais aussi une autre langue si votre célébration est bilingue. Les polices du site gèrent les accents et les caractères spéciaux.',
    kw: ['latin', 'langue', 'bilingue', 'anglais', 'gregorien', 'ave verum', 'etranger'],
    suite: ['chants-perso', 'perso-couleurs'],
  },
  {
    id: 'chants-relecture', cat: 'chants',
    q: 'Vérifiez-vous mes textes ?',
    a: 'Nous relisons la mise en page et signalons ce qui saute aux yeux (coquille visible, prénom incohérent, texte qui déborde). En revanche, le contenu liturgique reste sous votre responsabilité et celle de votre paroisse : c\'est votre célébration, pas la nôtre.',
    kw: ['relecture', 'verification', 'faute', 'orthographe', 'corriger texte', 'controle'],
    suite: ['bat-cest-quoi', 'bat-corriger'],
  },

  /* ========================= PAPIERS & FINITION ========================= */

  {
    id: 'papier-lequel', cat: 'papier',
    q: 'Quels papiers proposez-vous ?',
    a: 'Deux papiers, choisis avec notre imprimeur :<br>• <strong>Condat Silk 150 g</strong>, couché demi-mat : surface lisse et lumineuse, idéale avec des photos.<br>• <strong>Old Mill Premium White 160 g</strong>, papier de création : toucher feutré, grain sensible sous les doigts — le choix haut de gamme.<br><br>La couverture est imprimée dans le même papier, en 250 g rainé.',
    kw: ['papier', 'quel papier', 'condat', 'old mill', 'grammage', 'support', 'matiere'],
    suite: ['papier-difference', 'papier-voir', 'prix-comparaison-papier'],
  },
  {
    id: 'papier-difference', cat: 'papier',
    q: 'Quelle différence entre les deux papiers ?',
    a: 'Le <strong>Condat Silk</strong> est lisse et légèrement satiné : les photos y sont éclatantes, les couleurs franches. L\'<strong>Old Mill</strong> est mat et texturé : la lumière l\'accroche différemment, l\'encre s\'y pose plus doucement, et il donne au livret un caractère de faire-part. Pour un mariage ou un jubilé, l\'Old Mill fait souvent la différence.',
    kw: ['difference', 'comparer', 'lequel choisir', 'mieux', 'texture', 'toucher', 'rendu'],
    suite: ['papier-voir', 'prix-comparaison-papier'],
  },
  {
    id: 'papier-voir', cat: 'papier',
    q: 'Puis-je voir le papier avant de commander ?',
    a: 'Oui : la page <a href="papiers.html">Nos papiers</a> montre chaque matière en photo haute définition, et le configurateur simule directement le grain du papier choisi en fond de votre livret. Vous jugez avant d\'imprimer.',
    kw: ['voir papier', 'echantillon', 'photo papier', 'apercu', 'texture', 'toucher avant'],
    suite: ['papier-echantillon', 'papier-difference'],
  },
  {
    id: 'papier-echantillon', cat: 'papier',
    q: 'Envoyez-vous des échantillons papier ?',
    a: 'Pas de façon systématique, mais pour une commande importante ou si le choix vous bloque, écrivez-nous : nous pouvons vous faire parvenir un échantillon des deux papiers, ou vous les faire toucher à l\'atelier à Paris.',
    kw: ['echantillon', 'nuancier', 'toucher', 'recevoir papier', 'essai', 'gratuit'],
    suite: ['papier-voir', 'livraison-retrait'],
  },
  {
    id: 'papier-reliure', cat: 'papier',
    q: 'Comment le livret est-il relié ?',
    a: 'En <strong>piqûre métal</strong> (deux agrafes dans le pli), la reliure classique du livret de célébration : elle s\'ouvre à plat, reste souple en main et ne se déchire pas quand on tourne les pages debout.',
    kw: ['reliure', 'agrafe', 'piqure', 'attache', 'colle', 'dos carre', 'brochure'],
    suite: ['perso-multiple4', 'perso-format'],
  },
  {
    id: 'papier-couverture', cat: 'papier',
    q: 'La couverture est-elle plus épaisse ?',
    a: 'Oui : la couverture est imprimée dans le <strong>même papier en 250 g</strong>, et elle est rainée (pré-pliée mécaniquement) pour que le pli soit net et ne casse pas les fibres. C\'est ce qui donne au livret sa tenue.',
    kw: ['couverture', 'epaisse', '250', 'raine', 'carton', 'rigide', 'pli'],
    suite: ['papier-reliure', 'papier-lequel'],
  },
  {
    id: 'papier-recto-verso', cat: 'papier',
    q: 'L\'impression est-elle recto-verso ?',
    a: 'Oui, en quadrichromie recto-verso sur toutes les pages. Le grammage choisi (150 ou 160 g) évite que le texte du dos ne transparaisse.',
    kw: ['recto verso', 'double face', 'transparence', 'quadri', 'couleur', 'noir et blanc'],
    suite: ['papier-lequel', 'papier-couleurs-fidelite'],
  },
  {
    id: 'papier-couleurs-fidelite', cat: 'papier',
    q: 'Les couleurs imprimées seront-elles identiques à l\'écran ?',
    a: 'Très proches, mais jamais rigoureusement identiques : un écran émet de la lumière, un papier la reflète. Les teintes du site ont été choisies pour bien se comporter à l\'impression, et le bon à tirer vous permet de vérifier l\'ensemble avant le lancement.',
    kw: ['couleur ecran', 'fidelite', 'different', 'rendu couleur', 'ecran', 'cmjn', 'rvb'],
    suite: ['bat-cest-quoi', 'papier-voir'],
  },
  {
    id: 'papier-ecologie', cat: 'papier',
    q: 'Les papiers sont-ils écologiques ?',
    a: 'Nos deux papiers viennent de papeteries européennes engagées dans des filières forestières gérées durablement, et l\'impression est réalisée à Paris — pas à l\'autre bout du monde. Nous imprimons par ailleurs à la demande, sans stock ni surplus jeté.',
    kw: ['ecologie', 'ecologique', 'recycle', 'fsc', 'pefc', 'environnement', 'durable'],
    suite: ['papier-lequel', 'pratique-ou-imprime'],
  },
  {
    id: 'papier-changer', cat: 'papier',
    q: 'Puis-je changer de papier après avoir commencé ?',
    a: 'Oui, à tout moment avant le règlement : l\'onglet <strong>Papier</strong> du configurateur bascule d\'un papier à l\'autre, le fond du livret change à l\'écran et le prix se met à jour dans votre panier.',
    kw: ['changer papier', 'modifier papier', 'apres', 'trop tard'],
    suite: ['papier-lequel', 'commande-modifier'],
  },

  /* ============================== COMMANDER ============================== */

  {
    id: 'commande-comment', cat: 'commande',
    q: 'Comment passer commande ?',
    a: 'Quatre étapes :<br>1. Créez votre livret dans le configurateur.<br>2. Ajoutez-le au panier.<br>3. Sur la page Commande, choisissez la livraison et renseignez vos coordonnées.<br>4. Cliquez <strong>Commander</strong>.<br><br>Vous recevez aussitôt un accusé de réception avec votre numéro de commande.',
    kw: ['commander', 'commande', 'passer commande', 'acheter', 'valider', 'comment'],
    suite: ['commande-minimum', 'paiement-quand', 'bat-cest-quoi'],
  },
  {
    id: 'commande-minimum', cat: 'commande',
    q: 'Y a-t-il un minimum de commande ?',
    a: 'Oui, <strong>50 exemplaires</strong>. En dessous, le coût de calage de la machine rendrait le prix unitaire déraisonnable. Pour une toute petite célébration, sachez qu\'entre 50 et 80 exemplaires l\'écart de prix est faible : mieux vaut souvent en avoir quelques-uns d\'avance.',
    kw: ['minimum', 'moins de 50', 'petite quantite', '50', '10 exemplaires', 'combien minimum'],
    suite: ['prix-degressif', 'commande-combien-prevoir'],
  },
  {
    id: 'commande-combien-prevoir', cat: 'commande',
    q: 'Combien d\'exemplaires dois-je prévoir ?',
    a: 'Comptez le nombre d\'invités, puis ajoutez environ 15 % : il y a toujours des invités de dernière minute, des livrets emportés en souvenir, et il en faut pour le célébrant, la chorale et les lecteurs. Pour 100 personnes attendues, 120 exemplaires sont confortables.',
    kw: ['combien exemplaires', 'quantite', 'prevoir', 'invites', 'assez', 'nombre'],
    suite: ['commande-minimum', 'prix-degressif'],
  },
  {
    id: 'commande-panier', cat: 'commande',
    q: 'Comment fonctionne le panier ?',
    a: 'Chaque livret que vous créez peut être ajouté au panier, avec sa quantité et son papier. Vous pouvez en réunir plusieurs et tout commander d\'un coup. Le panier se conserve sur votre appareil, et un <strong>code « PAN-XXXXXX »</strong> permet de le retrouver ailleurs.',
    kw: ['panier', 'ajouter au panier', 'plusieurs', 'corbeille', 'cart'],
    suite: ['pratique-code-panier', 'perso-plusieurs-livrets'],
  },
  {
    id: 'commande-compte', cat: 'commande',
    q: 'Dois-je créer un compte ?',
    a: 'Non, jamais. Pas d\'inscription, pas de mot de passe : votre travail est conservé sur votre appareil, et le code panier suffit à le retrouver ailleurs. Nous ne demandons vos coordonnées qu\'au moment de la commande.',
    kw: ['compte', 'inscription', 'mot de passe', 'connexion', 'login', 's inscrire'],
    suite: ['pratique-code-panier', 'pratique-donnees'],
  },
  {
    id: 'commande-modifier', cat: 'commande',
    q: 'Puis-je modifier ma commande après l\'avoir envoyée ?',
    a: 'Oui, tant que l\'impression n\'est pas lancée — et elle ne l\'est jamais avant votre validation du bon à tirer. Écrivez-nous avec votre numéro de commande, nous ajustons ce qu\'il faut.',
    kw: ['modifier commande', 'changer', 'apres commande', 'erreur', 'corriger commande'],
    suite: ['commande-annuler', 'bat-corriger', 'pratique-contact'],
  },
  {
    id: 'commande-annuler', cat: 'commande',
    q: 'Puis-je annuler ma commande ?',
    a: 'Oui sans frais tant que l\'impression n\'a pas démarré (c\'est-à-dire tant que vous n\'avez pas validé votre bon à tirer). Une fois le livret imprimé, il ne peut plus l\'être : c\'est un objet personnalisé, fabriqué pour vous seul.',
    kw: ['annuler', 'annulation', 'rembourser', 'retracter', 'retractation', 'renoncer'],
    suite: ['paiement-remboursement', 'bat-cest-quoi'],
  },
  {
    id: 'commande-urgent', cat: 'commande',
    q: 'Je suis pressé, pouvez-vous aller plus vite ?',
    a: 'Souvent, oui. Comptez normalement 5 à 7 jours ouvrés après validation du bon à tirer. Si votre célébration approche, dites-le nous dès la commande (en précisant la date) : nous regardons ce qu\'il est possible de faire avec l\'atelier.',
    kw: ['urgent', 'vite', 'rapide', 'presse', 'delai court', 'demain', 'cette semaine'],
    suite: ['livraison-delai', 'pratique-contact'],
  },
  {
    id: 'commande-suivi', cat: 'commande',
    q: 'Comment suivre ma commande ?',
    a: 'Votre numéro de commande (au format <strong>CMD-2026-0001</strong>) figure dans l\'accusé de réception. Rappelez-le dans vos messages : il nous permet de retrouver votre dossier instantanément. Vous recevez un e-mail à chaque étape : réception, bon à tirer, règlement, expédition.',
    kw: ['suivi', 'suivre', 'ou en est', 'numero commande', 'statut', 'avancement', 'tracking'],
    suite: ['pratique-contact', 'livraison-suivi'],
  },
  {
    id: 'commande-confirmation', cat: 'commande',
    q: 'Je n\'ai pas reçu d\'e-mail de confirmation',
    a: 'Regardez d\'abord dans vos courriers indésirables (spam) : c\'est la cause dans neuf cas sur dix. Si vous ne trouvez rien, écrivez-nous en indiquant la date et le nom sur la commande — nous vérifions tout de suite qu\'elle est bien arrivée.',
    kw: ['pas recu', 'mail', 'confirmation', 'accuse', 'spam', 'rien recu', 'email'],
    suite: ['pratique-contact', 'commande-suivi'],
  },
  {
    id: 'commande-devis-avant', cat: 'commande',
    q: 'Puis-je avoir un devis sans commander ?',
    a: 'Bien sûr : téléchargez le devis PDF depuis le configurateur ou la page de commande, sans rien envoyer ni laisser vos coordonnées. Vous ne vous engagez à rien tant que vous n\'avez pas cliqué « Commander ».',
    kw: ['devis sans commander', 'sans engagement', 'juste un prix', 'estimation', 'gratuit'],
    suite: ['prix-devis', 'prix-validite'],
  },
  {
    id: 'commande-facture-paroisse', cat: 'commande',
    q: 'La facture peut-elle être au nom de la paroisse ?',
    a: 'Oui. Indiquez-le dans le champ « Votre message » au moment de la commande, avec le nom exact et l\'adresse de la paroisse ou de l\'association : nous établirons la facture à ce nom.',
    kw: ['facture paroisse', 'nom facture', 'association', 'adresse facturation', 'organisme'],
    suite: ['paiement-facture', 'prix-paroisse'],
  },

  /* ============================ BON À TIRER ============================ */

  {
    id: 'bat-cest-quoi', cat: 'bat',
    q: 'Qu\'est-ce qu\'un bon à tirer (BAT) ?',
    a: 'C\'est votre dernière vérification avant impression. Nous vous envoyons un lien vers votre livret complet, que vous pouvez <strong>feuilleter en 3D</strong> comme s\'il était entre vos mains. Rien ne part à l\'impression sans votre validation — c\'est notre garantie contre la faute qu\'on ne voit qu\'après.',
    kw: ['bat', 'bon a tirer', 'validation', 'verifier', 'avant impression', 'epreuve'],
    suite: ['bat-corriger', 'bat-delai', 'bat-obligatoire'],
  },
  {
    id: 'bat-corriger', cat: 'bat',
    q: 'Que faire si je vois une erreur sur le BAT ?',
    a: 'Ne validez pas : répondez simplement à l\'e-mail en nous indiquant ce qu\'il faut corriger (« page 3, le prénom s\'écrit Mathéo »). Nous corrigeons et vous renvoyons un nouveau bon à tirer. C\'est gratuit et sans limite de nombre.',
    kw: ['erreur', 'faute', 'corriger bat', 'modifier bat', 'coquille', 'refuser'],
    suite: ['bat-cest-quoi', 'prix-modification'],
  },
  {
    id: 'bat-delai', cat: 'bat',
    q: 'Sous combien de temps reçoit-on le BAT ?',
    a: 'Sous 24 heures ouvrées après votre commande, en général plus vite. Si votre célébration est proche, signalez-le : nous traitons les dossiers urgents en priorité.',
    kw: ['delai bat', 'quand bat', 'combien de temps', 'reception bat', 'attente'],
    suite: ['bat-cest-quoi', 'commande-urgent'],
  },
  {
    id: 'bat-obligatoire', cat: 'bat',
    q: 'Le BAT est-il obligatoire ?',
    a: 'Il est vivement recommandé, et coché par défaut. Vous pouvez le décocher pour gagner un jour, mais vous renoncez alors au filet de sécurité : une coquille imprimée en 150 exemplaires ne se rattrape pas. Nous vous le déconseillons.',
    kw: ['obligatoire', 'sauter', 'sans bat', 'decocher', 'gagner du temps', 'necessaire'],
    suite: ['bat-cest-quoi', 'commande-urgent'],
  },
  {
    id: 'bat-valider', cat: 'bat',
    q: 'Comment valider mon bon à tirer ?',
    a: 'Ouvrez le lien reçu par e-mail, feuilletez le livret jusqu\'au bout, cochez la case de confirmation, indiquez votre nom et cliquez <strong>« Je valide ce bon à tirer »</strong>. L\'impression est lancée dans la foulée, et vous recevez une confirmation.',
    kw: ['valider', 'accepter bat', 'comment valider', 'bouton', 'confirmer'],
    suite: ['bat-cest-quoi', 'livraison-delai'],
  },
  {
    id: 'bat-partager', cat: 'bat',
    q: 'Puis-je faire relire le BAT par quelqu\'un d\'autre ?',
    a: 'Oui, et c\'est une bonne idée : transférez simplement le lien à votre conjoint, à vos parents ou au curé. Le lien fonctionne sur téléphone comme sur ordinateur, et n\'importe qui peut le consulter sans compte — seule la validation vous revient.',
    kw: ['partager', 'relire', 'montrer', 'envoyer lien', 'famille', 'cure', 'plusieurs personnes'],
    suite: ['bat-cest-quoi', 'bat-valider'],
  },
  {
    id: 'bat-plusieurs', cat: 'bat',
    q: 'J\'ai commandé plusieurs livrets, comment se passent les BAT ?',
    a: 'Chaque livret a son propre bon à tirer, avec son lien. Vous les validez indépendamment, à votre rythme : l\'impression de chacun démarre dès que le sien est validé.',
    kw: ['plusieurs bat', 'deux livrets', 'chaque livret', 'separement'],
    suite: ['perso-plusieurs-livrets', 'bat-valider'],
  },
  {
    id: 'bat-apres-validation', cat: 'bat',
    q: 'Puis-je encore corriger après avoir validé le BAT ?',
    a: 'Non : la validation lance l\'impression, c\'est précisément son rôle. Prenez le temps de tout relire — les prénoms, les dates, l\'heure et le lieu surtout — avant de cliquer. En cas d\'urgence absolue, appelez-nous immédiatement : si la machine n\'a pas démarré, nous pouvons parfois intervenir.',
    kw: ['apres validation', 'trop tard', 'annuler bat', 'revenir', 'regret'],
    suite: ['bat-valider', 'pratique-contact'],
  },

  /* ============================== LIVRAISON ============================== */

  {
    id: 'livraison-modes', cat: 'livraison',
    q: 'Quels sont les modes de livraison ?',
    a: 'Trois possibilités, à choisir au moment de commander :<br>• <strong>Retrait à l\'atelier</strong> (Paris 11ᵉ) — gratuit<br>• <strong>Livraison à Paris</strong> — 50 €<br>• <strong>Chronopost France métropolitaine</strong> — selon le poids du colis (environ 20 à 32 €)<br><br>Le tarif exact s\'affiche dès que vous sélectionnez l\'option.',
    kw: ['livraison', 'expedition', 'envoi', 'mode', 'options', 'recevoir', 'frais de port'],
    suite: ['livraison-delai', 'livraison-retrait', 'livraison-prix'],
  },
  {
    id: 'livraison-prix', cat: 'livraison',
    q: 'Combien coûte la livraison ?',
    a: 'Le retrait à l\'atelier est <strong>gratuit</strong>. La livraison dans Paris est à <strong>50 €</strong>. Pour le reste de la France, le tarif Chronopost dépend du poids du colis : comptez environ 20 € pour un petit volume et jusqu\'à une trentaine d\'euros pour 300 livrets.',
    kw: ['prix livraison', 'frais de port', 'combien livraison', 'cout envoi', 'port'],
    suite: ['livraison-modes', 'livraison-gratuite'],
  },
  {
    id: 'livraison-gratuite', cat: 'livraison',
    q: 'La livraison peut-elle être gratuite ?',
    a: 'Oui, en choisissant le <strong>retrait à l\'atelier</strong>, dans le 11ᵉ arrondissement de Paris. C\'est aussi l\'occasion de voir votre livret sortir de presse — et beaucoup de clients apprécient ce moment.',
    kw: ['gratuit', 'offert', 'sans frais', 'franco', 'gratuite'],
    suite: ['livraison-retrait', 'livraison-modes'],
  },
  {
    id: 'livraison-retrait', cat: 'livraison',
    q: 'Où puis-je retirer ma commande ?',
    a: 'À l\'atelier <strong>Imprigraphic, 9-13 rue de la Folie Regnault, 75011 Paris</strong>, aux heures d\'ouverture. Nous vous prévenons par e-mail dès que les livrets sont prêts — inutile de vous déplacer avant.',
    kw: ['retrait', 'adresse', 'atelier', 'sur place', 'chercher', 'ou', 'imprigraphic', 'paris'],
    suite: ['livraison-modes', 'pratique-contact'],
  },
  {
    id: 'livraison-delai', cat: 'livraison',
    q: 'Quel est le délai de livraison ?',
    a: '<strong>5 à 7 jours ouvrés</strong> après la validation de votre bon à tirer, livraison comprise. Le compte à rebours ne démarre donc pas à la commande, mais à votre validation : plus vous validez tôt, plus vous recevez tôt.',
    kw: ['delai', 'combien de temps', 'quand', 'jours', 'recevoir', 'rapidite', 'attente'],
    suite: ['commande-urgent', 'livraison-quand-commander'],
  },
  {
    id: 'livraison-quand-commander', cat: 'livraison',
    q: 'Combien de temps avant la cérémonie dois-je commander ?',
    a: 'Prévoyez <strong>trois semaines</strong> pour être serein : une pour composer et faire relire, une pour le bon à tirer et d\'éventuelles corrections, une pour l\'impression et la livraison. C\'est faisable en dix jours si tout est prêt, mais autant ne pas ajouter du stress à une période qui en a déjà.',
    kw: ['avant ceremonie', 'anticiper', 'quand commander', 'combien avant', 'delai ideal', 's y prendre'],
    suite: ['livraison-delai', 'commande-urgent'],
  },
  {
    id: 'livraison-suivi', cat: 'livraison',
    q: 'Puis-je suivre mon colis ?',
    a: 'Oui, pour les envois Chronopost : le numéro de suivi vous est communiqué par e-mail dès l\'expédition, et vous le suivez sur chronopost.fr. Chronopost livre en général le lendemain de la prise en charge.',
    kw: ['suivi colis', 'tracking', 'numero suivi', 'ou est mon colis', 'chronopost'],
    suite: ['livraison-delai', 'commande-suivi'],
  },
  {
    id: 'livraison-etranger', cat: 'livraison',
    q: 'Livrez-vous à l\'étranger ?',
    a: 'Le site ne propose en ligne que la France métropolitaine. Pour la Belgique, la Suisse, le Luxembourg, les DOM-TOM ou ailleurs, écrivez-nous avec l\'adresse exacte et la quantité : nous vous ferons un devis d\'expédition sur mesure.',
    kw: ['etranger', 'international', 'belgique', 'suisse', 'dom tom', 'outre mer', 'hors france'],
    suite: ['pratique-contact', 'livraison-modes'],
  },
  {
    id: 'livraison-adresse-differente', cat: 'livraison',
    q: 'Puis-je faire livrer à une autre adresse que la mienne ?',
    a: 'Oui, sans problème : indiquez l\'adresse de livraison souhaitée (la paroisse, la salle de réception, un proche) dans le champ « Votre message » au moment de commander.',
    kw: ['autre adresse', 'adresse differente', 'livrer chez', 'paroisse', 'destinataire'],
    suite: ['livraison-modes', 'commande-comment'],
  },
  {
    id: 'livraison-emballage', cat: 'livraison',
    q: 'Comment les livrets sont-ils emballés ?',
    a: 'En cartons calés, par paquets, pour qu\'aucun angle ne se corne pendant le transport. Si un colis vous parvenait abîmé, prenez-le en photo avant de tout déballer et écrivez-nous : nous réimprimons ce qui doit l\'être.',
    kw: ['emballage', 'carton', 'abime', 'casse', 'protege', 'corne', 'endommage'],
    suite: ['pratique-contact', 'livraison-suivi'],
  },

  /* ========================= PAIEMENT & FACTURE ========================= */

  {
    id: 'paiement-moyens', cat: 'paiement',
    q: 'Quels moyens de paiement acceptez-vous ?',
    a: 'La <strong>carte bancaire</strong>, par un lien de paiement sécurisé Stripe (avec Apple Pay et Google Pay sur mobile). Pour un virement ou un règlement par mandat administratif — courant pour les paroisses —, écrivez-nous, c\'est possible.',
    kw: ['paiement', 'payer', 'carte', 'cb', 'virement', 'cheque', 'moyen', 'stripe', 'especes'],
    suite: ['paiement-quand', 'paiement-securite'],
  },
  {
    id: 'paiement-quand', cat: 'paiement',
    q: 'Quand dois-je payer ?',
    a: 'Comme vous préférez : un lien de paiement vous est proposé <strong>dès la confirmation de commande</strong> si vous voulez régler tout de suite, et le même lien vous est renvoyé automatiquement <strong>après validation de votre bon à tirer</strong> si vous préférez attendre de voir le résultat.',
    kw: ['quand payer', 'moment', 'avant apres', 'reglement', 'echeance', 'tout de suite'],
    suite: ['prix-acompte', 'paiement-moyens'],
  },
  {
    id: 'paiement-securite', cat: 'paiement',
    q: 'Le paiement est-il sécurisé ?',
    a: 'Oui. Le règlement se fait sur les serveurs de <strong>Stripe</strong>, l\'un des acteurs les plus sérieux du paiement en ligne, avec l\'authentification 3-D Secure de votre banque. Nous ne voyons jamais votre numéro de carte et ne le stockons nulle part.',
    kw: ['securise', 'securite', 'confiance', 'arnaque', 'donnees bancaires', 'ssl', '3d secure'],
    suite: ['paiement-moyens', 'pratique-donnees'],
  },
  {
    id: 'paiement-facture', cat: 'paiement',
    q: 'Recevrai-je une facture ?',
    a: 'Oui, automatiquement. Dès le paiement confirmé, une <strong>facture PDF</strong> numérotée vous est envoyée par e-mail, avec un lien permanent pour la retrouver et la télécharger à tout moment. Elle est établie par Imprigraphic.',
    kw: ['facture', 'recu', 'justificatif', 'pdf', 'comptabilite', 'note'],
    suite: ['commande-facture-paroisse', 'prix-tva'],
  },
  {
    id: 'paiement-facture-perdue', cat: 'paiement',
    q: 'J\'ai perdu ma facture, comment la récupérer ?',
    a: 'Le lien reçu par e-mail reste valable indéfiniment : retrouvez le message et rouvrez-le. Si vous l\'avez supprimé, écrivez-nous avec votre numéro de commande, nous vous le renvoyons.',
    kw: ['facture perdue', 'retrouver', 'renvoyer', 'duplicata', 'copie facture'],
    suite: ['paiement-facture', 'pratique-contact'],
  },
  {
    id: 'paiement-remboursement', cat: 'paiement',
    q: 'Êtes-vous remboursé en cas d\'annulation ?',
    a: 'Si vous annulez avant d\'avoir validé le bon à tirer, vous êtes intégralement remboursé. Une fois l\'impression lancée, le livret étant personnalisé à votre seul usage, il ne peut plus être repris — c\'est l\'exception légale prévue pour les biens confectionnés sur mesure.',
    kw: ['remboursement', 'rembourse', 'annulation', 'retractation', 'retour', 'droit'],
    suite: ['commande-annuler', 'bat-cest-quoi'],
  },
  {
    id: 'paiement-echec', cat: 'paiement',
    q: 'Mon paiement a échoué, que faire ?',
    a: 'Le lien de paiement reste valable : réessayez, éventuellement depuis un autre appareil ou avec une autre carte. Les refus viennent le plus souvent du plafond de la carte ou de l\'authentification bancaire non terminée. Si cela persiste, écrivez-nous, nous trouverons une autre solution.',
    kw: ['echec', 'refuse', 'marche pas', 'erreur paiement', 'probleme', 'bloque', 'plafond'],
    suite: ['paiement-moyens', 'pratique-contact'],
  },
  {
    id: 'paiement-plusieurs-fois', cat: 'paiement',
    q: 'Puis-je payer en plusieurs fois ?',
    a: 'Ce n\'est pas proposé automatiquement, mais pour une commande importante, écrivez-nous : un règlement échelonné peut s\'envisager, en particulier avec une paroisse ou une association.',
    kw: ['plusieurs fois', 'echelonne', 'fractionne', '3x', 'credit', 'facilite'],
    suite: ['pratique-contact', 'paiement-moyens'],
  },
  {
    id: 'paiement-qui-encaisse', cat: 'paiement',
    q: 'Qui encaisse le paiement ?',
    a: '<strong>Imprigraphic</strong>, l\'imprimerie parisienne qui fabrique vos livrets (SAS, 9-13 rue de la Folie Regnault, 75011 Paris). C\'est elle qui établit la facture. Le site, lui, a été conçu et développé par VIKTO LABS.',
    kw: ['qui encaisse', 'qui', 'societe', 'entreprise', 'imprigraphic', 'vikto', 'derriere'],
    suite: ['pratique-qui-etes-vous', 'paiement-facture'],
  },
  {
    id: 'paiement-devis-mandat', cat: 'paiement',
    q: 'Acceptez-vous les mandats administratifs ?',
    a: 'Oui, c\'est fréquent avec les paroisses et les établissements. Indiquez-le au moment de la commande : nous établirons une facture conforme, réglable par virement selon vos procédures.',
    kw: ['mandat', 'administratif', 'tresorerie', 'bon de commande', 'virement', 'collectivite'],
    suite: ['commande-facture-paroisse', 'paiement-moyens'],
  },

  /* ============================= CÉRÉMONIES ============================= */

  {
    id: 'ceremonies-liste', cat: 'ceremonies',
    q: 'Quelles cérémonies proposez-vous ?',
    a: 'Huit : <strong>baptême, première communion, profession de foi, confirmation, mariage, funérailles, messe anniversaire et jubilé</strong>. Chacune a ses modèles, sa structure liturgique et ses chants — vingt-cinq modèles au total.',
    kw: ['ceremonies', 'quelles', 'liste', 'types', 'occasions', 'evenements', 'modeles'],
    suite: ['ceremonies-structure', 'ceremonies-autre'],
  },
  {
    id: 'ceremonies-structure', cat: 'ceremonies',
    q: 'Le déroulé liturgique est-il déjà prêt ?',
    a: 'Oui : chaque modèle arrive avec la structure de sa célébration déjà en place — accueil, liturgie de la Parole, liturgie eucharistique, envoi — avec les prières et les emplacements de chants aux bons endroits. Vous n\'avez plus qu\'à personnaliser.',
    kw: ['structure', 'deroule', 'liturgie', 'ordre', 'messe', 'plan', 'trame', 'pret'],
    suite: ['ceremonies-liste', 'chants-classement'],
  },
  {
    id: 'ceremonies-autre', cat: 'ceremonies',
    q: 'Et si ma cérémonie n\'est pas dans la liste ?',
    a: 'Partez du modèle le plus proche et adaptez-le : tout est modifiable, y compris les titres de pages. Pour une célébration particulière (renouvellement de vœux, action de grâce, ordination…), écrivez-nous, nous vous orienterons vers le meilleur point de départ.',
    kw: ['autre ceremonie', 'pas dans la liste', 'special', 'particulier', 'ordination', 'voeux'],
    suite: ['ceremonies-liste', 'pratique-contact'],
  },
  {
    id: 'ceremonies-funerailles', cat: 'ceremonies',
    q: 'Faites-vous les livrets de funérailles rapidement ?',
    a: 'Oui, et c\'est le cas où nous mettons le plus d\'attention à aller vite. Écrivez-nous dès la commande en indiquant la date des obsèques : ces dossiers passent en priorité absolue, et nous nous adaptons à vos délais.',
    kw: ['funerailles', 'obseques', 'deces', 'enterrement', 'urgent', 'rapide', 'deuil'],
    suite: ['commande-urgent', 'perso-a-ma-place'],
  },
  {
    id: 'ceremonies-mariage', cat: 'ceremonies',
    q: 'Que met-on dans un livret de mariage ?',
    a: 'Une couverture avec vos prénoms et la date, l\'accueil, la liturgie de la Parole (lectures choisies par vos soins), l\'échange des consentements et des alliances, la prière universelle, la communion, et souvent un mot de remerciement en dernière page. Le modèle vous propose tout cela d\'emblée.',
    kw: ['mariage', 'noces', 'maries', 'alliance', 'consentement', 'que mettre'],
    suite: ['ceremonies-structure', 'chants-lectures'],
  },
  {
    id: 'ceremonies-bapteme', cat: 'ceremonies',
    q: 'Que met-on dans un livret de baptême ?',
    a: 'L\'accueil de l\'enfant et la signation, la liturgie de la Parole, le rite de l\'eau, l\'onction du saint chrême, le vêtement blanc et le cierge, puis le Notre Père et la bénédiction. Le prénom de l\'enfant, la date et le nom des parrain et marraine y trouvent naturellement leur place.',
    kw: ['bapteme', 'bebe', 'enfant', 'parrain', 'marraine', 'que mettre', 'eau'],
    suite: ['ceremonies-structure', 'perso-photo'],
  },
  {
    id: 'ceremonies-communion', cat: 'ceremonies',
    q: 'Peut-on faire un livret pour plusieurs enfants ?',
    a: 'Oui, c\'est même fréquent pour une première communion ou une profession de foi célébrée en groupe : le modèle permet de lister tous les enfants, ou de personnaliser un livret par famille si vous préférez.',
    kw: ['plusieurs enfants', 'groupe', 'communion', 'liste enfants', 'classe', 'ensemble'],
    suite: ['ceremonies-liste', 'perso-plusieurs-livrets'],
  },
  {
    id: 'ceremonies-non-catholique', cat: 'ceremonies',
    q: 'Faites-vous des livrets pour d\'autres confessions ?',
    a: 'Les modèles suivent la liturgie catholique romaine. Cela dit, tout étant modifiable, un livret protestant ou œcuménique se compose très bien à partir d\'un modèle existant — écrivez-nous, nous vous aiderons à le structurer.',
    kw: ['protestant', 'orthodoxe', 'oecumenique', 'laic', 'civil', 'autre religion', 'confession'],
    suite: ['ceremonies-autre', 'pratique-contact'],
  },

  /* ========================= QUESTIONS PRATIQUES ========================= */

  {
    id: 'pratique-contact', cat: 'pratique',
    q: 'Comment vous contacter ?',
    a: 'Par e-mail à <a href="mailto:viktor.guignard@gmail.com">viktor.guignard@gmail.com</a> — c\'est le plus efficace, et nous répondons sous 24 h ouvrées. Pour l\'atelier d\'impression : <strong>Imprigraphic, 01 44 93 26 30</strong>, 9-13 rue de la Folie Regnault, 75011 Paris.<br><br>Pensez à rappeler votre numéro de commande s\'il y en a un.',
    kw: ['contact', 'contacter', 'telephone', 'mail', 'email', 'joindre', 'parler', 'appeler', 'adresse'],
    suite: ['pratique-horaires', 'commande-suivi'],
  },
  {
    id: 'pratique-horaires', cat: 'pratique',
    q: 'Quels sont vos horaires ?',
    a: 'Le site fonctionne 24 h/24 : vous pouvez créer votre livret et commander à n\'importe quelle heure. Les réponses aux e-mails et l\'atelier suivent les horaires de bureau, du lundi au vendredi.',
    kw: ['horaires', 'ouvert', 'heures', 'week end', 'samedi', 'dimanche', 'quand joindre'],
    suite: ['pratique-contact'],
  },
  {
    id: 'pratique-qui-etes-vous', cat: 'pratique',
    q: 'Qui êtes-vous ?',
    a: '« Livrets de messe » est né de la rencontre entre un imprimeur parisien et un designer. Le service a été <strong>imaginé et il est imprimé par Imprigraphic</strong>, imprimerie du 11ᵉ arrondissement de Paris fondée en 1980, et le site a été <strong>créé par VIKTO LABS</strong>.',
    kw: ['qui', 'vous etes', 'entreprise', 'societe', 'histoire', 'a propos', 'equipe', 'imprigraphic'],
    suite: ['pratique-ou-imprime', 'paiement-qui-encaisse'],
  },
  {
    id: 'pratique-ou-imprime', cat: 'pratique',
    q: 'Où sont imprimés les livrets ?',
    a: 'À <strong>Paris</strong>, dans l\'atelier Imprigraphic du 11ᵉ arrondissement. Rien n\'est sous-traité à l\'étranger : vos livrets sont fabriqués à quelques kilomètres de chez vous, sur des machines que nous connaissons.',
    kw: ['ou imprime', 'fabrique', 'france', 'paris', 'local', 'etranger', 'made in'],
    suite: ['pratique-qui-etes-vous', 'livraison-retrait'],
  },
  {
    id: 'pratique-code-panier', cat: 'pratique',
    q: 'À quoi sert le code panier PAN-XXXXXX ?',
    a: 'Il vous permet de retrouver votre panier sur un autre appareil, sans créer de compte. Notez-le (ou envoyez-le vous par e-mail), puis saisissez-le dans « Reprendre un panier » en bas de la page Panier : votre sélection réapparaît.',
    kw: ['code panier', 'pan', 'retrouver', 'autre appareil', 'code', 'reprendre'],
    suite: ['pratique-autre-appareil', 'commande-panier'],
  },
  {
    id: 'pratique-autre-appareil', cat: 'pratique',
    q: 'Puis-je continuer sur un autre ordinateur ou téléphone ?',
    a: 'Oui, grâce au code panier. Notez le code « PAN-XXXXXX » sur le premier appareil, puis saisissez-le sur le second dans « Reprendre un panier ». Attention : c\'est le panier qui voyage, pas les brouillons non ajoutés — pensez à ajouter votre livret au panier avant de changer d\'appareil.',
    kw: ['autre ordinateur', 'telephone', 'mobile', 'changer appareil', 'continuer ailleurs', 'synchroniser'],
    suite: ['pratique-code-panier', 'perso-sauvegarde'],
  },
  {
    id: 'pratique-mobile', cat: 'pratique',
    q: 'Le site fonctionne-t-il sur téléphone ?',
    a: 'Oui, entièrement. Cela dit, pour composer un livret de plusieurs pages, un ordinateur ou une tablette reste plus confortable : on voit la page en grand pendant qu\'on tape. Le téléphone est parfait pour relire ou valider un bon à tirer.',
    kw: ['mobile', 'telephone', 'smartphone', 'tablette', 'ipad', 'responsive', 'application',
      'marche sur mobile', 'marche sur telephone', 'depuis mon telephone'],
    suite: ['pratique-navigateur', 'bat-valider'],
  },
  {
    id: 'pratique-navigateur', cat: 'pratique',
    q: 'Quel navigateur faut-il utiliser ?',
    a: 'N\'importe quel navigateur récent : Chrome, Safari, Firefox ou Edge. Aucune installation n\'est nécessaire. Si l\'aperçu 3D se comporte étrangement, mettez votre navigateur à jour — c\'est presque toujours la cause.',
    kw: ['navigateur', 'chrome', 'safari', 'firefox', 'edge', 'internet explorer', 'compatible'],
    suite: ['pratique-bug', 'pratique-mobile'],
  },
  {
    id: 'pratique-bug', cat: 'pratique',
    q: 'Le site ne fonctionne pas correctement, que faire ?',
    a: 'Rechargez d\'abord la page en forçant l\'actualisation (<strong>Cmd + Maj + R</strong> sur Mac, <strong>Ctrl + F5</strong> sur PC) : cela règle la grande majorité des cas. Si le problème persiste, écrivez-nous en décrivant ce que vous faisiez et sur quel appareil — nous corrigeons vite.',
    kw: ['bug', 'probleme', 'marche pas', 'erreur', 'plante', 'bloque', 'affiche mal'],
    suite: ['pratique-contact', 'pratique-navigateur'],
  },
  {
    id: 'pratique-donnees', cat: 'pratique',
    q: 'Que faites-vous de mes données personnelles ?',
    a: 'Le strict minimum : votre nom, votre e-mail et votre téléphone servent à traiter votre commande, rien d\'autre. Aucune revente, aucune publicité, aucun traçage publicitaire. Votre livret reste sur votre appareil tant que vous ne commandez pas. Le détail est sur la page <a href="confidentialite.html">Confidentialité & données</a>.',
    kw: ['donnees', 'rgpd', 'vie privee', 'confidentialite', 'personnel', 'cookies', 'traçage'],
    suite: ['pratique-supprimer-donnees', 'paiement-securite'],
  },
  {
    id: 'pratique-supprimer-donnees', cat: 'pratique',
    q: 'Puis-je faire supprimer mes données ?',
    a: 'Oui, à tout moment : écrivez-nous et nous supprimons votre dossier, sous réserve des factures que la loi nous oblige à conserver dix ans. Pour effacer votre travail en cours, il suffit de vider votre panier sur le site.',
    kw: ['supprimer donnees', 'effacer', 'oubli', 'rgpd', 'droit', 'retirer'],
    suite: ['pratique-donnees', 'pratique-contact'],
  },
  {
    id: 'pratique-fichier-pdf', cat: 'pratique',
    q: 'Puis-je récupérer le PDF de mon livret ?',
    a: 'Le PDF haute définition destiné à l\'impression est produit par l\'atelier. Si vous souhaitez l\'obtenir (pour l\'archiver ou le projeter pendant la célébration), demandez-le nous après votre commande, nous vous l\'enverrons.',
    kw: ['pdf', 'fichier', 'recuperer', 'telecharger livret', 'imprimer moi meme', 'numerique'],
    suite: ['pratique-imprimer-ailleurs', 'pratique-contact'],
  },
  {
    id: 'pratique-imprimer-ailleurs', cat: 'pratique',
    q: 'Puis-je créer le livret ici et l\'imprimer ailleurs ?',
    a: 'Le service est pensé comme un tout : la création est offerte parce que l\'impression suit. Si vous ne voulez que le fichier, écrivez-nous — c\'est envisageable, mais les frais de création s\'appliquent alors pleinement.',
    kw: ['imprimer ailleurs', 'autre imprimeur', 'juste le fichier', 'sans impression', 'moi meme'],
    suite: ['pratique-fichier-pdf', 'prix-creation'],
  },
  {
    id: 'pratique-exemplaire-supplementaire', cat: 'pratique',
    q: 'Puis-je recommander des exemplaires plus tard ?',
    a: 'Oui, mais une réimpression est une nouvelle commande avec son propre calage : commander 30 exemplaires supplémentaires après coup coûte plus cher que de les avoir prévus dès le départ. Mieux vaut voir large la première fois.',
    kw: ['recommander', 'reimpression', 'supplementaire', 'en plus', 'refaire', 'plus tard'],
    suite: ['commande-combien-prevoir', 'prix-degressif'],
  },
  {
    id: 'pratique-conserver-projet', cat: 'pratique',
    q: 'Gardez-vous mon livret pour une prochaine fois ?',
    a: 'Votre commande est conservée dans notre espace de travail : si vous revenez l\'an prochain pour une célébration semblable, nous pouvons repartir de votre livret précédent. Signalez-le nous simplement, avec votre ancien numéro de commande.',
    kw: ['garder', 'conserver', 'archive', 'prochaine fois', 'annee prochaine', 'reutiliser'],
    suite: ['pratique-exemplaire-supplementaire', 'pratique-contact'],
  },
];

/* Questions mises en avant à l'ouverture de l'assistant. */
export const FAQ_SUGGESTIONS = [
  'prix-combien', 'livraison-delai', 'bat-cest-quoi',
  'papier-lequel', 'commande-minimum', 'perso-competence',
];

export const FAQ_GREETING =
  'Bonjour ! Je réponds aux questions courantes sur les livrets : prix, papiers, '
  + 'délais, bon à tirer, livraison… Posez votre question ou choisissez ci-dessous.';

/* Retire accents, ponctuation et met en minuscules — pour comparer « Délai » et « delai ». */
export function normalizeFaqText(str) {
  return (str || '')
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/['’]/g, ' ')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/* Mots trop courants pour départager quoi que ce soit. */
const FAQ_STOP_WORDS = new Set([
  'le', 'la', 'les', 'un', 'une', 'des', 'de', 'du', 'a', 'au', 'aux', 'et', 'ou',
  'est', 'sont', 'ce', 'cet', 'cette', 'ces', 'je', 'j', 'tu', 'il', 'elle', 'on',
  'nous', 'vous', 'ils', 'mon', 'ma', 'mes', 'votre', 'vos', 'que', 'qui', 'quoi',
  'pour', 'par', 'en', 'dans', 'sur', 'avec', 'sans', 'y', 'se', 'ne', 'pas', 'plus',
  'si', 'me', 'mais', 'donc', 'car', 'faut', 'il', 'y', 'avoir', 'etre', 'fait',
  'puis', 'peut', 'peux', 'dois', 'doit', 'comment', 'quel', 'quelle', 'quels', 'quelles',
]);

const motsUtiles = (txt) =>
  new Set(normalizeFaqText(txt).split(' ').filter((m) => m.length > 2 && !FAQ_STOP_WORDS.has(m)));

/*
 * Index de recherche. On distingue volontairement les mots-clés (`kw`, écrits à
 * la main pour capter l'intention) des mots de la question affichée : un mot-clé
 * qui tombe juste est un signal bien plus fort qu'un mot croisé par hasard.
 */
const faqIndex = FAQ.map((item) => ({
  item,
  kwSet: motsUtiles(item.kw.join(' ')),
  kwPhrases: item.kw.map(normalizeFaqText),
  qSet: motsUtiles(item.q),
  qNorm: normalizeFaqText(item.q),
}));

/** Retrouve une entrée par son id. */
export const faqById = (id) => FAQ.find((f) => f.id === id) || null;

/**
 * Cherche les réponses les plus proches d'une question libre.
 *
 * Le score combine trois signaux, du plus fort au plus faible : la question
 * entière retrouvée telle quelle, les mots-clés rédigés à la main, puis les
 * mots de la question affichée. Il est ensuite pondéré par la COUVERTURE
 * (part des mots de la question réellement reconnus), pour qu'une fiche qui
 * ne comprend qu'un mot sur cinq ne devance jamais celle qui les comprend tous.
 * Renvoie au plus `limit` entrées — vide si rien n'est probant.
 */
export function searchFaq(question, limit = 3) {
  const q = normalizeFaqText(question);
  if (q.length < 2) return [];
  const motsQ = [...new Set(q.split(' ').filter((m) => m.length > 2 && !FAQ_STOP_WORDS.has(m)))];
  if (!motsQ.length) return [];

  const scored = faqIndex.map(({ item, kwSet, kwPhrases, qSet, qNorm }) => {
    let score = 0;
    let reconnus = 0;

    // 1. La formulation entière est un mot-clé, ou figure dans la question affichée.
    if (kwPhrases.includes(q)) score += 14;
    else if (q.length >= 6 && (qNorm.includes(q) || kwPhrases.some((k) => k.includes(q)))) score += 9;

    // 2. Mot à mot, du signal le plus sûr au plus flou.
    for (const m of motsQ) {
      if (kwSet.has(m)) { score += 5; reconnus++; }
      else if (qSet.has(m)) { score += 3; reconnus++; }
      else if (m.length > 4 && kwPhrases.some((k) => k.includes(m))) { score += 2; reconnus++; }
      else if (m.length > 4 && [...kwSet, ...qSet].some((k) => k.length > 4 && (k.startsWith(m.slice(0, 5)) || m.startsWith(k.slice(0, 5))))) {
        score += 1.5; reconnus++;                                   // radical commun (« livraison » ↔ « livrer »)
      }
    }

    // 3. Pondération par la couverture de la question.
    const couverture = reconnus / motsQ.length;
    return { item, score: score * (0.45 + 0.55 * couverture) };
  }).filter((r) => r.score >= 3);

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, limit).map((r) => r.item);
}
