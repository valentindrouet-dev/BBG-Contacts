/* ═══════════════════════════════════════════════════
   BBG CONTACTS — DONNÉES D'EXEMPLE
   Modifiez / supprimez ces entrées selon vos besoins.
   Les données sont ensuite persistées dans localStorage.
═══════════════════════════════════════════════════ */

const SEED_CONTACTS = [
  {
    id: "c1",
    name: "Sophie Martel",
    category: "illustrateur",
    company: "Atelier Martel",
    email: "sophie@ateliermartel.fr",
    phone: "+33 6 12 34 56 78",
    website: "https://ateliermartel.fr",
    notes: "Spécialisée fantasy et illustration de personnages. Très réactive, livraisons toujours dans les délais.",
    tasks: [
      { id: "t-c1-1", text: "Envoyer brief illustrations Nebula Quest v2", urgency: "urgent", done: false }
    ],
    games: [
      { title: "Nebula Quest", statut: "Prototype", notes: "Illustration principale" },
      { title: "Archipel", statut: "Jeu Édité", notes: "Illustration complète" }
    ],
    createdAt: "2024-09-15"
  },
  {
    id: "c2",
    name: "Thomas Lebrun",
    category: "auteur",
    company: "",
    email: "tlebrun@mail.com",
    phone: "+33 6 98 76 54 32",
    website: "",
    notes: "Co-designer sur Nebula Quest. Très créatif, aime les mécaniques de draft.",
    tasks: [
      { id: "t-c2-1", text: "Valider règles v5 Marchands de Rome", urgency: "normal", done: false },
      { id: "t-c2-2", text: "Planifier session playtest Nebula Quest", urgency: "faible", done: true }
    ],
    games: [
      { title: "Nebula Quest", statut: "Prototype", notes: "Co-design" },
      { title: "Marchands de Rome", statut: "Prototype", notes: "Co-design mécanique principale" }
    ],
    createdAt: "2024-10-02"
  },
  {
    id: "c3",
    name: "Éditions Lunaire",
    category: "editeur",
    company: "Éditions Lunaire SAS",
    email: "contact@editionslunaire.fr",
    phone: "+33 1 45 67 89 00",
    website: "https://editionslunaire.fr",
    notes: "Distributeur France & Belgique. Catalogue orienté jeux familiaux. RDV prévu au Festival de Cannes.",
    tasks: [
      { id: "t-c3-1", text: "Relancer pour accord distribution Archipel extension", urgency: "critique", done: false }
    ],
    games: [
      { title: "Archipel", statut: "Jeu Édité", notes: "Distribution France" }
    ],
    createdAt: "2025-01-10"
  },
  {
    id: "c4",
    name: "GamePrint Factory",
    category: "fabricant",
    company: "GPF Europe Ltd.",
    email: "quotes@gameprintfactory.eu",
    phone: "",
    website: "https://gameprintfactory.eu",
    notes: "Fabricant en Tchéquie. Délais 8–12 semaines. Minimum 500 unités. Prix compétitifs pour tirage moyen.",
    tasks: [],
    games: [
      { title: "Marchands de Rome", statut: "Prototype", notes: "Devis fabrication" }
    ],
    createdAt: "2025-02-20"
  },
  {
    id: "c5",
    name: "Camille Royer",
    category: "illustrateur",
    company: "Freelance",
    email: "camille.royer@proton.me",
    phone: "+33 7 23 45 67 89",
    website: "https://camilleroyerart.com",
    notes: "Style graphique épuré, très bon pour cartes et icônes. Portfolio impressionnant.",
    tasks: [
      { id: "t-c5-1", text: "Récupérer illustrations Forêt des Anciens — plateau", urgency: "urgent", done: false }
    ],
    games: [
      { title: "Forêt des Anciens", statut: "Prototype", notes: "Illustrations en cours" }
    ],
    createdAt: "2025-03-01"
  },
  {
    id: "c6",
    name: "Jeux Déployés",
    category: "distributeur",
    company: "Jeux Déployés SARL",
    email: "pro@jeuxdeploys.com",
    phone: "+33 4 56 78 90 12",
    website: "https://jeuxdeploys.com",
    notes: "Ne distribue plus de nouveaux éditeurs pour l'instant. Reprendre contact en 2026.",
    tasks: [],
    games: [],
    createdAt: "2024-06-05"
  }
];

const SEED_PROTOTYPES = [
  {
    id: "p1",
    title: "Nebula Quest",
    status: "proto",
    genre: "Exploration spatiale • Deck-building",
    players: "2–4",
    duration: "60–90 min",
    age: "12+",
    interest: 5,
    description: "Les joueurs construisent leur flotte pour explorer des nébuleuses inconnues. Chaque carte découverte modifie le plateau de façon permanente, créant une expérience unique à chaque partie.",
    contactLinks: [
      { contactId: "c2", role: "auteur" },
      { contactId: "c1", role: "illustration" }
    ],
    notes: "Playtest #7 prévu le 15 mars. Besoin d'équilibrer les cartes de fin de partie.",
    tasks: [
      { id: "t-p1-1", text: "Préparer dossier éditeur Spiel 2025", urgency: "urgent", done: false },
      { id: "t-p1-2", text: "Équilibrer cartes de fin de partie", urgency: "normal", done: false }
    ],
    createdAt: "2024-08-10"
  },
  {
    id: "p2",
    title: "Forêt des Anciens",
    status: "développement",
    genre: "Coopératif • Gestion de ressources",
    players: "1–5",
    duration: "45 min",
    age: "8+",
    interest: 4,
    description: "Protégez la forêt enchantée contre des envahisseurs en gérant intelligemment vos ressources. Jeu coopératif à tension croissante avec un mode solo complet.",
    contactLinks: [
      { contactId: "c5", role: "illustrations" }
    ],
    notes: "Illustrations en cours de finalisation. Règles v4 à relire.",
    tasks: [
      { id: "t-p2-1", text: "Relire règles v4 et intégrer corrections", urgency: "normal", done: false }
    ],
    createdAt: "2024-11-22"
  },
  {
    id: "p3",
    title: "Marchands de Rome",
    status: "production",
    genre: "Stratégie • Routes commerciales",
    players: "3–5",
    duration: "90–120 min",
    age: "14+",
    interest: 4,
    description: "Tissez votre réseau commercial à travers l'Empire romain. Gérez contrats, alliances et trahisons pour devenir le marchand le plus influent de l'époque.",
    contactLinks: [
      { contactId: "c2", role: "co-design" },
      { contactId: "c4", role: "fabricant" }
    ],
    notes: "Devis fabrication reçu. En attente accord distributeur. Viser Spiel 2025.",
    tasks: [
      { id: "t-p3-1", text: "Signer contrat fabrication GamePrint", urgency: "critique", done: false },
      { id: "t-p3-2", text: "Contacter distributeurs pour accords", urgency: "urgent", done: false }
    ],
    createdAt: "2024-05-03"
  },
  {
    id: "p4",
    title: "Pixel Dungeon",
    status: "proto",
    genre: "Dungeon crawler • Rétro",
    players: "2–6",
    duration: "30 min",
    age: "10+",
    interest: 3,
    description: "Un dungeon crawler rapide et coloré inspiré des jeux vidéo rétro. Chaque donjon est généré aléatoirement par les tuiles.",
    contactLinks: [],
    notes: "Idée initiale, pas encore de prototype physique. Chercher un illustrateur pixel-art.",
    tasks: [
      { id: "t-p4-1", text: "Trouver illustrateur pixel-art", urgency: "faible", done: false }
    ],
    createdAt: "2025-02-14"
  },
  {
    id: "p5",
    title: "Archipel",
    status: "sorti",
    genre: "Famille • Construction d'îles",
    players: "2–4",
    duration: "30–45 min",
    age: "7+",
    interest: 4,
    description: "Construisez l'archipel le plus prospère en plaçant intelligemment vos tuiles. Jeu de famille accessible et coloré, disponible depuis octobre 2024.",
    contactLinks: [
      { contactId: "c1", role: "illustration" },
      { contactId: "c3", role: "distribution" }
    ],
    notes: "Publié en oct. 2024. Bonne réception presse spécialisée. Réflexion sur une extension.",
    tasks: [],
    createdAt: "2023-03-20"
  }
];
