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
    relationStatus: "actif",
    notes: "Spécialisée fantasy et illustration de personnages. Très réactive, livraisons toujours dans les délais.",
    socials: [
      { type: "Instagram", url: "https://instagram.com/sophiemartelart" },
      { type: "Site web", url: "https://ateliermartel.fr" }
    ],
    exchanges: [
      { id: "e-c1-1", date: "2025-01-15", type: "rencontre", note: "Festival Angoulême — très bon contact, intéressée par Nebula Quest" },
      { id: "e-c1-2", date: "2025-03-01", type: "email", note: "Envoi du brief illustrations v2" }
    ],
    tasks: [
      { id: "t-c1-1", text: "Envoyer brief illustrations Nebula Quest v2", urgency: "urgent", done: false, dueDate: "2026-03-20", note: "Inclure la planche de couleurs approuvée" }
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
    relationStatus: "actif",
    notes: "Co-designer sur Nebula Quest. Très créatif, aime les mécaniques de draft.",
    socials: [
      { type: "BGG", url: "https://boardgamegeek.com/user/tlebrun" }
    ],
    exchanges: [
      { id: "e-c2-1", date: "2025-02-10", type: "appel", note: "Appel de 45 min sur l'équilibrage des cartes fin de partie" },
      { id: "e-c2-2", date: "2024-12-05", type: "rencontre", note: "Playtest #6 — très bonnes pistes sur la mécanique de draft" }
    ],
    tasks: [
      { id: "t-c2-1", text: "Valider règles v5 Marchands de Rome", urgency: "normal", done: false, dueDate: "2026-04-01", note: "" },
      { id: "t-c2-2", text: "Planifier session playtest Nebula Quest", urgency: "faible", done: true, dueDate: "", note: "Session planifiée le 15 mars" }
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
    relationStatus: "en-pause",
    notes: "Distributeur France & Belgique. Catalogue orienté jeux familiaux. RDV prévu au Festival de Cannes.",
    socials: [
      { type: "LinkedIn", url: "https://linkedin.com/company/editionslunaire" }
    ],
    exchanges: [
      { id: "e-c3-1", date: "2025-01-10", type: "salon", note: "Festival Paris — présentation du catalogue, intéressés par Archipel extension" }
    ],
    tasks: [
      { id: "t-c3-1", text: "Relancer pour accord distribution Archipel extension", urgency: "critique", done: false, dueDate: "2026-03-15", note: "Rappeler le RDV Cannes" }
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
    relationStatus: "actif",
    notes: "Fabricant en Tchéquie. Délais 8–12 semaines. Minimum 500 unités. Prix compétitifs pour tirage moyen.",
    socials: [],
    exchanges: [
      { id: "e-c4-1", date: "2025-02-20", type: "email", note: "Devis reçu pour Marchands de Rome — 500 et 1000 unités" }
    ],
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
    relationStatus: "actif",
    notes: "Style graphique épuré, très bon pour cartes et icônes. Portfolio impressionnant.",
    socials: [
      { type: "Instagram", url: "https://instagram.com/camilleroyerart" },
      { type: "Site web", url: "https://camilleroyerart.com" }
    ],
    exchanges: [
      { id: "e-c5-1", date: "2025-03-01", type: "message", note: "Envoi des premières illustrations plateau — très satisfaisant" }
    ],
    tasks: [
      { id: "t-c5-1", text: "Récupérer illustrations Forêt des Anciens — plateau", urgency: "urgent", done: false, dueDate: "2026-03-25", note: "Format SVG + PNG 300dpi" }
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
    relationStatus: "inactif",
    notes: "Ne distribue plus de nouveaux éditeurs pour l'instant. Reprendre contact en 2026.",
    socials: [],
    exchanges: [
      { id: "e-c6-1", date: "2024-06-05", type: "appel", note: "Refus distribution nouveaux éditeurs jusqu'à 2026" }
    ],
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
    tags: ["deck-building", "exploration", "science-fiction"],
    description: "Les joueurs construisent leur flotte pour explorer des nébuleuses inconnues. Chaque carte découverte modifie le plateau de façon permanente, créant une expérience unique à chaque partie.",
    contactLinks: [
      { contactId: "c2", role: "auteur" },
      { contactId: "c1", role: "illustration" }
    ],
    notes: "Playtest #7 prévu le 15 mars. Besoin d'équilibrer les cartes de fin de partie.",
    devLog: [
      { id: "dl-p1-1", date: "2025-03-01", note: "Playtest #6 concluant — la mécanique de draft fonctionne bien mais fin de partie trop longue" },
      { id: "dl-p1-2", date: "2025-01-20", note: "Rééquilibrage des cartes Nébuleuse — ajout d'un compteur de tours maximum" }
    ],
    photos: [],
    tasks: [
      { id: "t-p1-1", text: "Préparer dossier éditeur Spiel 2025", urgency: "urgent", done: false, dueDate: "2026-04-15", note: "Inclure vidéo de présentation" },
      { id: "t-p1-2", text: "Équilibrer cartes de fin de partie", urgency: "normal", done: false, dueDate: "", note: "" }
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
    tags: ["coopératif", "gestion", "familial"],
    description: "Protégez la forêt enchantée contre des envahisseurs en gérant intelligemment vos ressources. Jeu coopératif à tension croissante avec un mode solo complet.",
    contactLinks: [
      { contactId: "c5", role: "illustrations" }
    ],
    notes: "Illustrations en cours de finalisation. Règles v4 à relire.",
    devLog: [
      { id: "dl-p2-1", date: "2025-02-15", note: "Version 4 des règles — simplification du système de ressources, meilleur pour le public familial" }
    ],
    photos: [],
    tasks: [
      { id: "t-p2-1", text: "Relire règles v4 et intégrer corrections", urgency: "normal", done: false, dueDate: "2026-03-30", note: "" }
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
    tags: ["stratégie", "placement", "historique", "négoce"],
    description: "Tissez votre réseau commercial à travers l'Empire romain. Gérez contrats, alliances et trahisons pour devenir le marchand le plus influent de l'époque.",
    contactLinks: [
      { contactId: "c2", role: "co-design" },
      { contactId: "c4", role: "fabricant" }
    ],
    notes: "Devis fabrication reçu. En attente accord distributeur. Viser Spiel 2025.",
    devLog: [
      { id: "dl-p3-1", date: "2025-02-20", note: "Devis GPF reçu — 500u = 8500€, 1000u = 13000€. Option 1000u retenue" },
      { id: "dl-p3-2", date: "2024-12-10", note: "Règles v5 validées après playtest final — jeu prêt pour production" }
    ],
    photos: [],
    tasks: [
      { id: "t-p3-1", text: "Signer contrat fabrication GamePrint", urgency: "critique", done: false, dueDate: "2026-03-10", note: "Vérifier clause de révision des quantités" },
      { id: "t-p3-2", text: "Contacter distributeurs pour accords", urgency: "urgent", done: false, dueDate: "2026-04-01", note: "" }
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
    tags: ["dungeon-crawler", "rétro", "hasard"],
    description: "Un dungeon crawler rapide et coloré inspiré des jeux vidéo rétro. Chaque donjon est généré aléatoirement par les tuiles.",
    contactLinks: [],
    notes: "Idée initiale, pas encore de prototype physique. Chercher un illustrateur pixel-art.",
    devLog: [
      { id: "dl-p4-1", date: "2025-02-14", note: "Concept initial posé — système de tuiles inspiré des roguelikes" }
    ],
    photos: [],
    tasks: [
      { id: "t-p4-1", text: "Trouver illustrateur pixel-art", urgency: "faible", done: false, dueDate: "", note: "BGG et ArtStation à explorer" }
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
    tags: ["familial", "tuiles", "construction"],
    description: "Construisez l'archipel le plus prospère en plaçant intelligemment vos tuiles. Jeu de famille accessible et coloré, disponible depuis octobre 2024.",
    contactLinks: [
      { contactId: "c1", role: "illustration" },
      { contactId: "c3", role: "distribution" }
    ],
    notes: "Publié en oct. 2024. Bonne réception presse spécialisée. Réflexion sur une extension.",
    devLog: [
      { id: "dl-p5-1", date: "2024-10-01", note: "Sortie officielle — 500 exemplaires distribués en France et Belgique" },
      { id: "dl-p5-2", date: "2024-11-15", note: "Première critique positive dans Plateau Magazine — 4/5 étoiles" }
    ],
    photos: [],
    tasks: [],
    createdAt: "2023-03-20"
  }
];
