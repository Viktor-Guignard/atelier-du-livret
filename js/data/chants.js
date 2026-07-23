/*
 * Bibliothèque de chants, organisée par catégories liturgiques.
 *
 * Droits : les textes latins/grégoriens et les prières traditionnelles sont dans
 * le domaine public → paroles complètes (complet: true). Les chants contemporains
 * (cotes SECLI) sont référencés par titre, cote et incipit (complet: false) :
 * la paroisse ou la famille, titulaire de la licence, colle les paroles dans le
 * configurateur.
 */

export const CATEGORIES_LITURGIQUES = [
  { id: 'entree',       nom: "Chant d'entrée" },
  { id: 'kyrie',        nom: 'Kyrie' },
  { id: 'gloria',       nom: 'Gloria' },
  { id: 'psaume',       nom: 'Psaume' },
  { id: 'alleluia',     nom: 'Alléluia' },
  { id: 'offertoire',   nom: 'Offertoire' },
  { id: 'sanctus',      nom: 'Sanctus' },
  { id: 'agneau',       nom: 'Agneau de Dieu' },
  { id: 'communion',    nom: 'Communion' },
  { id: 'action-grace', nom: 'Action de grâce' },
  { id: 'final',        nom: 'Chant final' },
];

export const categorieLiturgique = (id) =>
  CATEGORIES_LITURGIQUES.find((c) => c.id === id) || null;

export const CHANTS = [
  /* ---------------- Chant d'entrée ---------------- */
  {
    id: 'entree-veni-creator', titre: 'Veni Creator Spiritus', categorie: 'entree',
    origine: 'Hymne grégorienne (IXᵉ s.)', cote: null, complet: true,
    paroles: "Veni, creátor Spíritus,\nmentes tuórum vísita,\nimple supérna grátia,\nquae tu creásti péctora.\n\nQui díceris Paráclitus,\ndonum Dei altíssimi,\nfons vivus, ignis, cáritas,\net spiritális únctio.\n\nTu septifórmis múnere,\ndéxterae Dei tu dígitus,\ntu rite promíssum Patris,\nsermóne ditans gúttura.\n\nAccénde lumen sénsibus,\ninfúnde amórem córdibus,\ninfírma nostri córporis\nvirtúte firmans pérpeti.\n\nHostem repéllas lóngius\npacémque dones prótinus ;\nductóre sic te praévio\nvitémus omne nóxium.\n\nPer te sciámus da Patrem,\nnoscámus atque Fílium,\nte utriúsque Spíritum\ncredámus omni témpore.\n\nDeo Patri sit glória,\net Fílio, qui a mórtuis\nsurréxit, ac Paráclito,\nin saeculórum saécula. Amen.",
  },
  {
    id: 'entree-peuple-de-dieu', titre: 'Peuple de Dieu, marche joyeux', categorie: 'entree',
    origine: 'D. Rimaud / J. Berthier', cote: 'K 180', complet: false,
    paroles: "R/ Peuple de Dieu, marche joyeux,\nAlléluia, Alléluia !\n…",
    note: 'Paroles complètes à insérer (licence SECLI de votre paroisse).',
  },
  {
    id: 'entree-dieu-nous-a-tous-appeles', titre: 'Dieu nous a tous appelés', categorie: 'entree',
    origine: 'D. Rimaud / J. Berthier', cote: 'A 14-56-1', complet: false,
    paroles: "R/ Nous sommes le corps du Christ,\nchacun de nous est un membre de ce corps…\n…",
    note: 'Paroles complètes à insérer (licence SECLI de votre paroisse).',
  },
  {
    id: 'entree-seuil-maison', titre: 'Sur le seuil de sa maison', categorie: 'entree',
    origine: 'D. Rimaud / J. Gelineau', cote: 'S 44', complet: false,
    paroles: "Sur le seuil de sa maison,\nnotre Père t'attend…\n…",
    note: "Chant d'accueil traditionnel des funérailles. Paroles complètes à insérer.",
  },

  {
    id: 'entree-ecoute-la-voix', titre: 'Écoute la voix du Seigneur', categorie: 'entree',
    origine: 'D. Rimaud / J. Berthier', cote: 'A 548', complet: false,
    paroles: "Écoute la voix du Seigneur,\nprête l'oreille de ton cœur…\n…",
    note: 'Paroles complètes à insérer (licence SECLI de votre paroisse).',
  },
  {
    id: 'entree-jubilez', titre: 'Jubilez ! Criez de joie', categorie: 'entree',
    origine: 'Communauté du Chemin Neuf', cote: null, complet: false,
    paroles: "R/ Jubilez ! Criez de joie !\nAcclamez le Dieu trois fois Saint !…\n…",
    note: 'Paroles complètes à insérer (licence SECLI de votre paroisse).',
  },
  {
    id: 'entree-venez-chantons', titre: 'Venez, chantons notre Dieu', categorie: 'entree',
    origine: 'Communauté de l\'Emmanuel', cote: null, complet: false,
    paroles: "R/ Venez, chantons notre Dieu,\nlui, le Roi des cieux…\n…",
    note: 'Paroles complètes à insérer (licence SECLI de votre paroisse).',
  },
  {
    id: 'entree-chantez-priez', titre: 'Chantez, priez, célébrez le Seigneur', categorie: 'entree',
    origine: 'Contemporain', cote: null, complet: false,
    paroles: "R/ Chantez, priez, célébrez le Seigneur,\nDieu nous accueille, peuple du monde…\n…",
    note: 'Paroles complètes à insérer (licence SECLI de votre paroisse).',
  },
  {
    id: 'entree-si-le-pere', titre: 'Si le Père vous appelle', categorie: 'entree',
    origine: 'D. Rimaud / J. Berthier', cote: null, complet: false,
    paroles: "Si le Père vous appelle à aimer comme il vous aime…\nR/ Tressaillez de joie ! Tressaillez de joie !…\n…",
    note: 'Paroles complètes à insérer (licence SECLI de votre paroisse).',
  },
  {
    id: 'entree-enfant-de-dieu', titre: 'Tu es devenu enfant de Dieu', categorie: 'entree',
    origine: 'Contemporain — baptême', cote: null, complet: false,
    paroles: "Tu es devenu enfant de Dieu\net frère de Jésus, alléluia !…\n…",
    note: 'Chant de baptême. Paroles complètes à insérer (licence SECLI de votre paroisse).',
  },
  {
    id: 'entree-viens-esprit-saintete', titre: 'Viens, Esprit de sainteté', categorie: 'entree',
    origine: 'Communauté de l\'Emmanuel — confirmation', cote: null, complet: false,
    paroles: "R/ Viens, Esprit de sainteté,\nviens, Esprit de lumière,\nviens, Esprit de feu,\nviens nous embraser.\n…",
    note: 'Paroles complètes à insérer (licence SECLI de votre paroisse).',
  },
  {
    id: 'entree-souffle-imprevisible', titre: 'Souffle imprévisible', categorie: 'entree',
    origine: 'C. Singer / J. Berthier — confirmation', cote: 'K 28-44', complet: false,
    paroles: "Souffle imprévisible, Esprit de Dieu,\nvent qui fait revivre, Esprit de Dieu…\n…",
    note: 'Paroles complètes à insérer (licence SECLI de votre paroisse).',
  },

  /* ---------------- Kyrie ---------------- */
  {
    id: 'kyrie-xviii', titre: 'Kyrie XVIII (grégorien)', categorie: 'kyrie',
    origine: 'Grégorien', cote: null, complet: true,
    paroles: "Kýrie, eléison. (bis)\nChriste, eléison. (bis)\nKýrie, eléison. (bis)",
  },
  {
    id: 'kyrie-dialogue', titre: 'Kyrie (dialogue en français)', categorie: 'kyrie',
    origine: 'Texte liturgique', cote: null, complet: true,
    paroles: "Seigneur, prends pitié.\n— Seigneur, prends pitié.\nÔ Christ, prends pitié.\n— Ô Christ, prends pitié.\nSeigneur, prends pitié.\n— Seigneur, prends pitié.",
  },
  {
    id: 'kyrie-trinite', titre: 'Kyrie — Messe de la Trinité', categorie: 'kyrie',
    origine: 'Communauté de l\'Emmanuel', cote: null, complet: false,
    paroles: "Kyrie eleison, Kyrie eleison…\n…",
    note: 'Paroles complètes à insérer (licence SECLI de votre paroisse).',
  },

  {
    id: 'kyrie-taize', titre: 'Kyrie eleison (Taizé)', categorie: 'kyrie',
    origine: 'Communauté de Taizé', cote: null, complet: false,
    paroles: "Kýrie eléison, Kýrie eléison…\n…",
    note: 'Partition et texte complets auprès de votre paroisse (© Ateliers et Presses de Taizé).',
  },

  /* ---------------- Gloria ---------------- */
  {
    id: 'gloria-viii', titre: 'Gloria VIII « de Angelis » (grégorien)', categorie: 'gloria',
    origine: 'Grégorien', cote: null, complet: true,
    paroles: "Glória in excélsis Deo\net in terra pax homínibus bonae voluntátis.\nLaudámus te, benedícimus te,\nadorámus te, glorificámus te,\ngrátias ágimus tibi propter magnam glóriam tuam,\nDómine Deus, Rex caeléstis,\nDeus Pater omnípotens.\nDómine Fili unigénite, Iesu Christe,\nDómine Deus, Agnus Dei, Fílius Patris,\nqui tollis peccáta mundi, miserére nobis ;\nqui tollis peccáta mundi, súscipe deprecatiónem nostram.\nQui sedes ad déxteram Patris, miserére nobis.\nQuóniam tu solus Sanctus, tu solus Dóminus,\ntu solus Altíssimus, Iesu Christe,\ncum Sancto Spíritu : in glória Dei Patris.\nAmen.",
  },
  {
    id: 'gloria-lourdes', titre: 'Gloria de Lourdes', categorie: 'gloria',
    origine: 'J.-P. Lécot', cote: 'C 242-1', complet: false,
    paroles: "R/ Gloria, gloria, in excelsis Deo ! (bis)\n…",
    note: 'Couplets (texte liturgique français) à insérer selon votre licence.',
  },
  {
    id: 'gloria-saint-boniface', titre: 'Gloire à Dieu — Messe de Saint-Boniface', categorie: 'gloria',
    origine: 'N. Tarralle', cote: null, complet: false,
    paroles: "Gloire à Dieu au plus haut des cieux…\n…",
    note: 'Paroles complètes à insérer (licence SECLI de votre paroisse).',
  },

  {
    id: 'gloria-trinite', titre: 'Gloire à Dieu — Messe de la Trinité', categorie: 'gloria',
    origine: 'Communauté de l\'Emmanuel', cote: null, complet: false,
    paroles: "Gloire à Dieu au plus haut des cieux\net paix sur la terre aux hommes qu'il aime !…\n…",
    note: 'Paroles complètes à insérer (licence SECLI de votre paroisse).',
  },

  /* ---------------- Psaume ---------------- */
  {
    id: 'psaume-22', titre: 'Psaume 22 — « Le Seigneur est mon berger »', categorie: 'psaume',
    origine: 'Psautier', cote: null, complet: false,
    paroles: "R/ Le Seigneur est mon berger,\nrien ne saurait me manquer.\n\n(Strophes selon la traduction liturgique en usage.)",
    note: 'Adapter le texte des strophes à la traduction liturgique retenue par le célébrant.',
  },
  {
    id: 'psaume-33', titre: 'Psaume 33 — « Je bénirai le Seigneur »', categorie: 'psaume',
    origine: 'Psautier', cote: null, complet: false,
    paroles: "R/ Je bénirai le Seigneur en tout temps.\n\n(Strophes selon la traduction liturgique en usage.)",
    note: 'Adapter le texte des strophes à la traduction liturgique retenue par le célébrant.',
  },
  {
    id: 'psaume-127', titre: 'Psaume 127 — « Heureux qui craint le Seigneur »', categorie: 'psaume',
    origine: 'Psautier — souvent choisi pour les mariages', cote: null, complet: false,
    paroles: "R/ Heureux qui craint le Seigneur !\n\n(Strophes selon la traduction liturgique en usage.)",
    note: 'Adapter le texte des strophes à la traduction liturgique retenue par le célébrant.',
  },

  {
    id: 'psaume-26', titre: 'Psaume 26 — « Le Seigneur est ma lumière »', categorie: 'psaume',
    origine: 'Psautier', cote: null, complet: false,
    paroles: "R/ Le Seigneur est ma lumière et mon salut.\n\n(Strophes selon la traduction liturgique en usage.)",
    note: 'Adapter le texte des strophes à la traduction liturgique retenue par le célébrant.',
  },
  {
    id: 'psaume-102', titre: 'Psaume 102 — « Le Seigneur est tendresse et pitié »', categorie: 'psaume',
    origine: 'Psautier', cote: null, complet: false,
    paroles: "R/ Le Seigneur est tendresse et pitié.\n\n(Strophes selon la traduction liturgique en usage.)",
    note: 'Adapter le texte des strophes à la traduction liturgique retenue par le célébrant.',
  },
  {
    id: 'psaume-115', titre: 'Psaume 115 — « Je marcherai en présence du Seigneur »', categorie: 'psaume',
    origine: 'Psautier — souvent choisi pour les funérailles', cote: null, complet: false,
    paroles: "R/ Je marcherai en présence du Seigneur\nsur la terre des vivants.\n\n(Strophes selon la traduction liturgique en usage.)",
    note: 'Adapter le texte des strophes à la traduction liturgique retenue par le célébrant.',
  },
  {
    id: 'psaume-129', titre: 'Psaume 129 — « Des profondeurs, je crie vers toi »', categorie: 'psaume',
    origine: 'Psautier — funérailles et temps de l\'attente', cote: null, complet: false,
    paroles: "R/ Je mets mon espoir dans le Seigneur,\nje suis sûr de sa parole.\n\n(Strophes selon la traduction liturgique en usage.)",
    note: 'Adapter le texte des strophes à la traduction liturgique retenue par le célébrant.',
  },

  /* ---------------- Alléluia ---------------- */
  {
    id: 'alleluia-irlandais', titre: 'Alléluia irlandais', categorie: 'alleluia',
    origine: 'Mélodie traditionnelle irlandaise', cote: null, complet: true,
    paroles: "Alléluia, alléluia, alléluia ! (bis)",
  },
  {
    id: 'alleluia-magnificat', titre: 'Alléluia — Messe du peuple de Dieu', categorie: 'alleluia',
    origine: 'Contemporain', cote: null, complet: false,
    paroles: "Alléluia ! Alléluia ! Alléluia !\n…",
    note: "Verset de l'Évangile proclamé par le célébrant ou la chorale.",
  },

  {
    id: 'alleluia-taize', titre: 'Alléluia (Taizé)', categorie: 'alleluia',
    origine: 'Communauté de Taizé', cote: null, complet: false,
    paroles: "Allelúia, allelúia, allelúia…\n…",
    note: 'Partition et texte complets auprès de votre paroisse (© Ateliers et Presses de Taizé).',
  },

  /* ---------------- Offertoire ---------------- */
  {
    id: 'offertoire-ubi-caritas', titre: 'Ubi caritas et amor', categorie: 'offertoire',
    origine: 'Antienne grégorienne', cote: null, complet: true,
    paroles: "Ubi cáritas et amor, Deus ibi est.\n\nCongregávit nos in unum Christi amor.\nExsultémus et in ipso iucundémur.\nTimeámus et amémus Deum vivum.\nEt ex corde diligámus nos sincéro.",
  },
  {
    id: 'offertoire-abandon', titre: 'Mon Père, je m\'abandonne à toi', categorie: 'offertoire',
    origine: 'Prière de Charles de Foucauld', cote: null, complet: true,
    paroles: "Mon Père, je m'abandonne à toi :\nfais de moi ce qu'il te plaira.\nQuoi que tu fasses de moi, je te remercie.\nJe suis prêt à tout, j'accepte tout,\npourvu que ta volonté se fasse en moi,\nen toutes tes créatures :\nje ne désire rien d'autre, mon Dieu.\n\nJe remets mon âme entre tes mains,\nje te la donne, mon Dieu,\navec tout l'amour de mon cœur,\nparce que je t'aime,\net que ce m'est un besoin d'amour de me donner,\nde me remettre entre tes mains, sans mesure,\navec une infinie confiance,\ncar tu es mon Père.",
  },
  {
    id: 'offertoire-instrumental', titre: 'Pièce instrumentale (orgue, violoncelle…)', categorie: 'offertoire',
    origine: 'Musique', cote: null, complet: true,
    paroles: "— Temps de musique et de recueillement —\n(Indiquer ici l'œuvre et l'interprète si vous le souhaitez.)",
  },

  {
    id: 'offertoire-humblement', titre: 'Humblement, dans le silence', categorie: 'offertoire',
    origine: 'Communauté de l\'Emmanuel', cote: null, complet: false,
    paroles: "R/ Humblement, dans le silence de mon cœur,\nje me donne à toi, mon Seigneur.\n…",
    note: 'Paroles complètes à insérer (licence SECLI de votre paroisse).',
  },
  {
    id: 'offertoire-je-viens-vers-toi', titre: 'Je viens vers toi, Jésus', categorie: 'offertoire',
    origine: 'Communauté de l\'Emmanuel', cote: null, complet: false,
    paroles: "R/ Je viens vers toi, Jésus. (×4)\n…",
    note: 'Paroles complètes à insérer (licence SECLI de votre paroisse).',
  },

  /* ---------------- Sanctus ---------------- */
  {
    id: 'sanctus-xviii', titre: 'Sanctus XVIII (grégorien)', categorie: 'sanctus',
    origine: 'Grégorien', cote: null, complet: true,
    paroles: "Sanctus, Sanctus, Sanctus\nDóminus Deus Sábaoth.\nPleni sunt caeli et terra glória tua.\nHosánna in excélsis.\nBenedíctus qui venit in nómine Dómini.\nHosánna in excélsis.",
  },
  {
    id: 'sanctus-saint-severin', titre: 'Sanctus — Messe de Saint-Séverin', categorie: 'sanctus',
    origine: 'M. Wackenheim', cote: null, complet: false,
    paroles: "Saint ! Saint ! Saint, le Seigneur, Dieu de l'univers !\n…",
    note: 'Paroles complètes à insérer (licence SECLI de votre paroisse).',
  },

  {
    id: 'sanctus-trinite', titre: 'Sanctus — Messe de la Trinité', categorie: 'sanctus',
    origine: 'Communauté de l\'Emmanuel', cote: null, complet: false,
    paroles: "Saint, Saint, Saint le Seigneur,\nle Dieu de l'univers !…\n…",
    note: 'Paroles complètes à insérer (licence SECLI de votre paroisse).',
  },

  /* ---------------- Agneau de Dieu ---------------- */
  {
    id: 'agnus-xviii', titre: 'Agnus Dei XVIII (grégorien)', categorie: 'agneau',
    origine: 'Grégorien', cote: null, complet: true,
    paroles: "Agnus Dei, qui tollis peccáta mundi,\nmiserére nobis. (bis)\n\nAgnus Dei, qui tollis peccáta mundi,\ndona nobis pacem.",
  },
  {
    id: 'agnus-francais', titre: 'Agneau de Dieu (français)', categorie: 'agneau',
    origine: 'Texte liturgique', cote: null, complet: true,
    paroles: "Agneau de Dieu, qui enlèves les péchés du monde,\nprends pitié de nous. (bis)\n\nAgneau de Dieu, qui enlèves les péchés du monde,\ndonne-nous la paix.",
  },

  {
    id: 'agnus-trinite', titre: 'Agneau de Dieu — Messe de la Trinité', categorie: 'agneau',
    origine: 'Communauté de l\'Emmanuel', cote: null, complet: false,
    paroles: "Agneau de Dieu, envoyé par le Père…\n…",
    note: 'Paroles complètes à insérer (licence SECLI de votre paroisse).',
  },

  /* ---------------- Communion ---------------- */
  {
    id: 'communion-panis-angelicus', titre: 'Panis angelicus', categorie: 'communion',
    origine: 'Saint Thomas d\'Aquin — musique de C. Franck', cote: null, complet: true,
    paroles: "Panis angélicus fit panis hóminum ;\ndat panis caélicus figúris términum.\nO res mirábilis : mandúcat Dóminum\npauper, servus et húmilis.",
  },
  {
    id: 'communion-adoro-te', titre: 'Adoro te devote', categorie: 'communion',
    origine: 'Saint Thomas d\'Aquin', cote: null, complet: true,
    paroles: "Adóro te devóte, latens Déitas,\nquae sub his figúris vere látitas ;\ntibi se cor meum totum súbiicit,\nquia te contémplans totum déficit.\n\nVisus, tactus, gustus in te fállitur,\nsed audítu solo tuto créditur.\nCredo quidquid dixit Dei Fílius :\nnil hoc verbo veritátis vérius.\n\nIn cruce latébat sola Déitas,\nat hic latet simul et humánitas ;\nambo tamen credens atque cónfitens,\npeto quod petívit latro paénitens.\n\nPlagas, sicut Thomas, non intúeor ;\nDeum tamen meum te confíteor.\nFac me tibi semper magis crédere,\nin te spem habére, te dilígere.\n\nO memoriále mortis Dómini !\npanis vivus, vitam praestans hómini !\nPraesta meae menti de te vívere\net te illi semper dulce sápere.\n\nPie pellicáne, Iesu Dómine,\nme immúndum munda tuo sánguine ;\ncuius una stilla salvum fácere\ntotum mundum quit ab omni scélere.\n\nIesu, quem velátum nunc aspício,\noro fiat illud quod tam sítio :\nut te reveláta cernens fácie,\nvisu sim beátus tuae glóriae. Amen.",
  },
  {
    id: 'communion-anima-christi', titre: 'Anima Christi', categorie: 'communion',
    origine: 'Prière (XIVᵉ s.)', cote: null, complet: true,
    paroles: "Anima Christi, sanctífica me.\nCorpus Christi, salva me.\nSanguis Christi, inébria me.\nAqua láteris Christi, lava me.\nPássio Christi, confórta me.\nO bone Iesu, exáudi me.\nIntra tua vúlnera abscónde me.\nNe permíttas me separári a te.\nAb hoste malígno defénde me.\nIn hora mortis meae voca me,\net iube me veníre ad te,\nut cum Sanctis tuis laudem te\nin saécula saeculórum. Amen.",
  },
  {
    id: 'communion-demeure', titre: 'Tu fais ta demeure en nous', categorie: 'communion',
    origine: 'Communauté de l\'Emmanuel', cote: 'D 56-49', complet: false,
    paroles: "R/ Tu es là présent, livré pour nous…\n…",
    note: 'Paroles complètes à insérer (licence SECLI de votre paroisse).',
  },
  {
    id: 'communion-devenez', titre: 'Devenez ce que vous recevez', categorie: 'communion',
    origine: 'Communauté du Verbe de Vie', cote: 'D 68-39', complet: false,
    paroles: "R/ Devenez ce que vous recevez,\ndevenez le corps du Christ…\n…",
    note: 'Paroles complètes à insérer (licence SECLI de votre paroisse).',
  },

  {
    id: 'communion-ave-verum', titre: 'Ave verum corpus', categorie: 'communion',
    origine: 'Motet eucharistique (XIVᵉ s.)', cote: null, complet: true,
    paroles: "Ave, verum corpus natum\nde María Vírgine,\nvere passum, immolátum\nin cruce pro hómine,\ncuius latus perforátum\nfluxit aqua et sánguine :\nesto nobis praegustátum\nin mortis exámine.\nO Iesu dulcis, o Iesu pie,\no Iesu, fili Maríae.",
  },
  {
    id: 'communion-o-salutaris', titre: 'O salutaris Hostia', categorie: 'communion',
    origine: 'Saint Thomas d\'Aquin', cote: null, complet: true,
    paroles: "O salutáris Hóstia,\nquae caeli pandis óstium :\nbella premunt hostília,\nda robur, fer auxílium.\n\nUni trinóque Dómino\nsit sempitérna glória,\nqui vitam sine término\nnobis donet in pátria. Amen.",
  },
  {
    id: 'communion-tantum-ergo', titre: 'Tantum ergo', categorie: 'communion',
    origine: 'Saint Thomas d\'Aquin — hymne Pange lingua', cote: null, complet: true,
    paroles: "Tantum ergo Sacraméntum\nvenerémur cérnui :\net antíquum documéntum\nnovo cedat rítui ;\npraestet fides suppleméntum\nsénsuum deféctui.\n\nGenitóri Genitóque\nlaus et iubilátio,\nsalus, honor, virtus quoque\nsit et benedíctio ;\nprocedénti ab utróque\ncompar sit laudátio. Amen.",
  },
  {
    id: 'communion-approchons', titre: 'Venez, approchons-nous de la table', categorie: 'communion',
    origine: 'Communauté de l\'Emmanuel', cote: null, complet: false,
    paroles: "R/ Venez, approchons-nous de la table du Christ…\n…",
    note: 'Paroles complètes à insérer (licence SECLI de votre paroisse).',
  },
  {
    id: 'communion-recevez', titre: 'Recevez le Christ', categorie: 'communion',
    origine: 'Communauté de l\'Emmanuel', cote: null, complet: false,
    paroles: "R/ Recevez le Christ doux et humble,\nDieu caché en cette hostie…\n…",
    note: 'Paroles complètes à insérer (licence SECLI de votre paroisse).',
  },
  {
    id: 'communion-voici-le-corps', titre: 'Voici le Corps et le Sang du Seigneur', categorie: 'communion',
    origine: 'Contemporain', cote: 'D 44-80', complet: false,
    paroles: "R/ Voici le Corps et le Sang du Seigneur,\nla coupe du salut et le pain de la vie…\n…",
    note: 'Paroles complètes à insérer (licence SECLI de votre paroisse).',
  },

  /* ---------------- Action de grâce ---------------- */
  {
    id: 'grace-magnificat', titre: 'Magnificat (grégorien)', categorie: 'action-grace',
    origine: 'Cantique de Marie — Lc 1, 46-55', cote: null, complet: true,
    paroles: "Magníficat ánima mea Dóminum,\net exsultávit spíritus meus\nin Deo salutári meo.\n\nQuia respéxit humilitátem ancíllae suae ;\necce enim ex hoc beátam me dicent\nomnes generatiónes.\n\nQuia fecit mihi magna qui potens est,\net sanctum nomen eius.\nEt misericórdia eius a progénie in progénies\ntiméntibus eum.\n\nFecit poténtiam in bráchio suo ;\ndispérsit supérbos mente cordis sui.\nDepósuit poténtes de sede,\net exaltávit húmiles.\n\nEsuriéntes implévit bonis,\net dívites dimísit inánes.\nSuscépit Israel púerum suum,\nrecordátus misericórdiae suae.\n\nSicut locútus est ad patres nostros,\nAbraham et sémini eius in saécula.\n\nGlória Patri et Fílio\net Spirítui Sancto,\nsicut erat in princípio et nunc et semper,\net in saécula saeculórum. Amen.",
  },
  {
    id: 'grace-ave-maria-lourdes', titre: 'Ave Maria de Lourdes', categorie: 'action-grace',
    origine: 'Cantique traditionnel (1873)', cote: null, complet: true,
    paroles: "R/ Ave, ave, ave María !\nAve, ave, ave María !\n\n1. Ô Vierge Marie,\nle peuple chrétien\nà Lourdes vous prie,\nchez vous il revient.\n\n2. Le fond de la roche\ns'éclaire à l'instant ;\nla Dame s'approche,\nfait signe à l'enfant.\n\n3. Venez, je vous prie,\nici quinze fois,\navec vos amies,\nentendre ma voix.\n\n(Parmi la soixantaine de couplets du cantique — ajoutez ceux de votre choix.)",
  },
  {
    id: 'grace-je-vous-salue', titre: 'Je vous salue, Marie (prière)', categorie: 'action-grace',
    origine: 'Prière traditionnelle', cote: null, complet: true,
    paroles: "Je vous salue, Marie, pleine de grâce.\nLe Seigneur est avec vous.\nVous êtes bénie entre toutes les femmes,\net Jésus, le fruit de vos entrailles, est béni.\nSainte Marie, Mère de Dieu,\npriez pour nous, pauvres pécheurs,\nmaintenant et à l'heure de notre mort.\nAmen.",
  },

  {
    id: 'grace-premiere-en-chemin', titre: 'La première en chemin', categorie: 'action-grace',
    origine: 'Sr M.-C. Guédon / G. Lefebvre', cote: 'V 565', complet: false,
    paroles: "La première en chemin, Marie, tu nous entraînes…\nR/ Marche avec nous, Marie…\n…",
    note: 'Paroles complètes à insérer (licence SECLI de votre paroisse).',
  },
  {
    id: 'grace-vierge-sainte', titre: 'Vierge Sainte, Dieu t\'a choisie', categorie: 'action-grace',
    origine: 'J.-P. Lécot', cote: 'V 136', complet: false,
    paroles: "Vierge Sainte, Dieu t'a choisie…\nR/ Ave, ave, ave María.\n…",
    note: 'Paroles complètes à insérer (licence SECLI de votre paroisse).',
  },
  {
    id: 'grace-regarde-etoile', titre: 'Regarde l\'étoile', categorie: 'action-grace',
    origine: 'Communauté de l\'Emmanuel — d\'après saint Bernard', cote: null, complet: false,
    paroles: "R/ Regarde l'étoile, invoque Marie,\nsi tu la suis, tu ne crains rien…\n…",
    note: 'Paroles complètes à insérer (licence SECLI de votre paroisse).',
  },
  {
    id: 'grace-que-ma-bouche', titre: 'Que ma bouche chante ta louange', categorie: 'action-grace',
    origine: 'Communauté de l\'Emmanuel', cote: null, complet: false,
    paroles: "R/ Que ma bouche chante ta louange…\n…",
    note: 'Paroles complètes à insérer (licence SECLI de votre paroisse).',
  },

  /* ---------------- Chant final ---------------- */
  {
    id: 'final-salve-regina', titre: 'Salve Regina (grégorien)', categorie: 'final',
    origine: 'Antienne mariale (XIᵉ s.)', cote: null, complet: true,
    paroles: "Salve, Regína, mater misericórdiae ;\nvita, dulcédo et spes nostra, salve.\nAd te clamámus, éxsules fílii Hevae.\nAd te suspirámus, geméntes et flentes\nin hac lacrimárum valle.\nEia ergo, advocáta nostra,\nillos tuos misericórdes óculos\nad nos convérte.\nEt Iesum, benedíctum fructum ventris tui,\nnobis post hoc exsílium osténde.\nO clemens, o pia, o dulcis Virgo María.",
  },
  {
    id: 'final-in-paradisum', titre: 'In paradisum (grégorien)', categorie: 'final',
    origine: 'Antienne des funérailles', cote: null, complet: true,
    paroles: "In paradísum dedúcant te ángeli ;\nin tuo advéntu suscípiant te mártyres,\net perdúcant te in civitátem sanctam Ierúsalem.\nChorus angelórum te suscípiat,\net cum Lázaro quondam páupere\naetérnam hábeas réquiem.",
  },
  {
    id: 'final-chez-nous', titre: 'Chez nous, soyez Reine', categorie: 'final',
    origine: 'Cantique traditionnel', cote: null, complet: true,
    paroles: "R/ Chez nous, soyez Reine,\nnous sommes à vous ;\nrégnez en souveraine,\nchez nous, chez nous !\nSoyez la Madone\nqu'on prie à genoux,\nqui sourit et pardonne,\nchez nous, chez nous !\n\n1. Vous êtes notre Mère,\ndaignez à votre Fils\noffrir l'humble prière\nde vos enfants chéris.\n\n2. Gardez, ô Vierge pure,\nô Cœur doux entre tous,\nnos âmes sans souillure,\nnos cœurs vaillants et doux.\n\n(Autres couplets au choix de la paroisse.)",
  },
  {
    id: 'final-couronnee', titre: 'Couronnée d\'étoiles', categorie: 'final',
    origine: 'Communauté de l\'Emmanuel', cote: 'V 44-58', complet: false,
    paroles: "R/ Nous te saluons, ô toi, Notre Dame…\n…",
    note: 'Paroles complètes à insérer (licence SECLI de votre paroisse).',
  },
  {
    id: 'final-quexulte', titre: 'Qu\'exulte tout l\'univers', categorie: 'final',
    origine: 'Communauté de l\'Emmanuel', cote: 'DEV 44-72', complet: false,
    paroles: "R/ Qu'exulte tout l'univers,\nque soit chantée en tous lieux\nla puissance de Dieu…\n…",
    note: 'Paroles complètes à insérer (licence SECLI de votre paroisse).',
  },
  {
    id: 'final-pie-jesu', titre: 'Pie Jesu', categorie: 'final',
    origine: 'Conclusion de la séquence Dies irae — funérailles', cote: null, complet: true,
    paroles: "Pie Iesu Dómine,\ndona eis réquiem. (bis)\n\nPie Iesu Dómine,\ndona eis réquiem sempitérnam.",
  },
  {
    id: 'final-allez-dire', titre: 'Allez dire à tous les hommes', categorie: 'final',
    origine: 'D. Rimaud / J. Berthier', cote: null, complet: false,
    paroles: "R/ Allez dire à tous les hommes :\nle Royaume est parmi vous…\n…",
    note: 'Paroles complètes à insérer (licence SECLI de votre paroisse).',
  },
  {
    id: 'final-christ-appelle', titre: 'Christ aujourd\'hui nous appelle', categorie: 'final',
    origine: 'M. Scouarnec / J. Akepsimas', cote: 'T 176', complet: false,
    paroles: "R/ Christ aujourd'hui nous appelle,\nChrist aujourd'hui nous envoie…\n…",
    note: 'Paroles complètes à insérer (licence SECLI de votre paroisse).',
  },
  {
    id: 'final-rendons-gloire', titre: 'Rendons gloire à notre Dieu', categorie: 'final',
    origine: 'Communauté de l\'Emmanuel', cote: null, complet: false,
    paroles: "R/ Rendons gloire à notre Dieu,\nlui qui fit des merveilles !…\n…",
    note: 'Paroles complètes à insérer (licence SECLI de votre paroisse).',
  },
  {
    id: 'final-peuple-de-freres', titre: 'Peuple de frères', categorie: 'final',
    origine: 'G. de Courrèges', cote: 'T 122', complet: false,
    paroles: "R/ Peuple de frères, peuple du partage,\nporte l'Évangile et la paix de Dieu…\n…",
    note: 'Paroles complètes à insérer (licence SECLI de votre paroisse).',
  },
];

export const chantById = (id) => CHANTS.find((c) => c.id === id) || null;

const normalize = (s) =>
  String(s ?? '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

/** Recherche plein-texte (titre, origine, cote, paroles), filtrable par catégorie. */
export function searchChants(query = '', categorie = null) {
  const q = normalize(query).trim();
  return CHANTS.filter((chant) => {
    if (categorie && chant.categorie !== categorie) return false;
    if (!q) return true;
    return [chant.titre, chant.origine, chant.cote, chant.paroles]
      .some((field) => normalize(field).includes(q));
  });
}
