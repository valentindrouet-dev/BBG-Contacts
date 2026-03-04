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
    status: "actif",
    notes: "Spécialisée fantasy et illustration de personnages. Très réactive, livraisons toujours dans les délais.",
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
    status: "actif",
    notes: "Co-designer sur Nebula Quest. Très créatif, aime les mécaniques de draft.",
    createdAt: "2024-10-02"
  },
  {
    id: "c3",
    name: "Éditions Lunaire",
    category: "distributeur",
    company: "Éditions Lunaire SAS",
    email: "contact@editionslunaire.fr",
    phone: "+33 1 45 67 89 00",
    website: "https://editionslunaire.fr",
    status: "prospect",
    notes: "Distributeur France & Belgique. Catalogue orienté jeux familiaux. RDV prévu au Festival de Cannes.",
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
    status: "actif",
    notes: "Fabricant en Tchéquie. Délais 8–12 semaines. Minimum 500 unités. Prix compétitifs pour tirage moyen.",
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
    status: "actif",
    notes: "Style graphique épuré, très bon pour cartes et icônes. Portfolio impressionnant.",
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
    status: "inactif",
    notes: "Ne distribue plus de nouveaux éditeurs pour l'instant. Reprendre contact en 2026.",
    createdAt: "2024-06-05"
  }
];

const SEED_PROTOTYPES = [
  {
    id: "p1",
    title: "Nebula Quest",
    status: "test",
    genre: "Exploration spatiale • Deck-building",
    players: "2–4",
    duration: "60–90 min",
    age: "12+",
    description: "Les joueurs construisent leur flotte pour explorer des nébuleuses inconnues. Chaque carte découverte modifie le plateau de façon permanente, créant une expérience unique à chaque partie.",
    contacts: "Thomas Lebrun (auteur), Sophie Martel (illustration)",
    notes: "Playtest #7 prévu le 15 mars. Besoin d'équilibrer les cartes de fin de partie.",
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
    description: "Protégez la forêt enchantée contre des envahisseurs en gérant intelligemment vos ressources. Jeu coopératif à tension croissante avec un mode solo complet.",
    contacts: "Camille Royer (illustrations en cours)",
    notes: "Illustrations en cours de finalisation. Règles v4 à relire.",
    createdAt: "2024-11-22"
  },
  {
    id: "p3",
    title: "Marchands de Rome",
    status: "finalisation",
    genre: "Stratégie • Routes commerciales",
    players: "3–5",
    duration: "90–120 min",
    age: "14+",
    description: "Tissez votre réseau commercial à travers l'Empire romain. Gérez contrats, alliances et trahisons pour devenir le marchand le plus influent de l'époque.",
    contacts: "Thomas Lebrun (co-design), GamePrint Factory (devis en cours)",
    notes: "Devis fabrication reçu. En attente accord distributeur. Viser Spiel 2025.",
    createdAt: "2024-05-03"
  },
  {
    id: "p4",
    title: "Pixel Dungeon",
    status: "concept",
    genre: "Dungeon crawler • Rétro",
    players: "2–6",
    duration: "30 min",
    age: "10+",
    description: "Un dungeon crawler rapide et coloré inspiré des jeux vidéo rétro. Chaque donjon est généré aléatoirement par les tuiles.",
    contacts: "",
    notes: "Idée initiale, pas encore de prototype physique. Chercher un illustrateur pixel-art.",
    createdAt: "2025-02-14"
  },
  {
    id: "p5",
    title: "Archipel",
    status: "publié",
    genre: "Famille • Construction d'îles",
    players: "2–4",
    duration: "30–45 min",
    age: "7+",
    description: "Construisez l'archipel le plus prospère en plaçant intelligemment vos tuiles. Jeu de famille accessible et coloré, disponible depuis octobre 2024.",
    contacts: "Sophie Martel (illustration), Éditions Lunaire (distribution)",
    notes: "Publié en oct. 2024. Bonne réception presse spécialisée. Réflexion sur une extension.",
    createdAt: "2023-03-20"
  }
];
