// Programme détaillé de l'atelier pilote (6 samedis par niveau).
// Source : complements/01-programme-pilote-6-samedis.md

export type Session = {
  n: number;
  theme: string;
  activity: string;
  tools: string;
  offline?: "oui" | "non" | "partiel";
};

export type Track = {
  name: "Éveil" | "Explorateur" | "Créateur";
  ages: string;
  slogan: string;
  sessions: Session[];
  variant?: string;
};

export const SESSION_STRUCTURE = [
  { label: "Accueil et rappel", minutes: 10 },
  { label: "Découverte", minutes: 20 },
  { label: "Pratique en équipe", minutes: 60 },
  { label: "Pause", minutes: 10 },
  { label: "Défi et partage", minutes: 15 },
  { label: "Rangement et inventaire du matériel", minutes: 5 },
];

export const TRACKS: Track[] = [
  {
    name: "Éveil",
    ages: "5-7 ans",
    slogan: "Je commande un robot",
    sessions: [
      { n: 1, theme: "Donner un ordre", activity: "Jeu « le robot humain » : un enfant guide un camarade avec des flèches", tools: "Cartes flèches, ruban adhésif au sol", offline: "oui" },
      { n: 2, theme: "Séquences", activity: "Écrire un chemin avec des cartes, le faire exécuter", tools: "Cartes de codage, grille au sol", offline: "oui" },
      { n: 3, theme: "Trouver l'erreur", activity: "Chasse au « bug » dans des séquences truquées", tools: "Cartes, fiches de défi", offline: "oui" },
      { n: 4, theme: "Premier robot", activity: "Programmer un robot au sol sur un parcours court", tools: "Robots au sol type Bee-Bot", offline: "non" },
      { n: 5, theme: "Lumières et sons", activity: "Reconnaître capteur, lumière, son (atelier tournant)", tools: "Lampes, instruments, kit micro:bit en démo", offline: "partiel" },
      { n: 6, theme: "Projet final", activity: "Faire traverser un labyrinthe à un robot, présentation aux parents", tools: "Labyrinthe en carton", offline: "non" },
    ],
  },
  {
    name: "Explorateur",
    ages: "8-10 ans",
    slogan: "Je crée avec Scratch et micro:bit",
    sessions: [
      { n: 1, theme: "Premiers blocs", activity: "Faire bouger et parler un personnage", tools: "Scratch" },
      { n: 2, theme: "Boucles", activity: "Dessiner une figure avec une boucle, danse animée", tools: "Scratch" },
      { n: 3, theme: "Conditions", activity: "Jeu « attrape les étoiles » : si touché alors…", tools: "Scratch" },
      { n: 4, theme: "Variables", activity: "Ajouter un score et des vies au jeu", tools: "Scratch" },
      { n: 5, theme: "Du code au circuit", activity: "Allumer une LED, lire un bouton ou un capteur", tools: "micro:bit" },
      { n: 6, theme: "Projet final", activity: "Jeu Scratch ou alarme de porte micro:bit, démo aux parents", tools: "Scratch / micro:bit" },
    ],
  },
  {
    name: "Créateur",
    ages: "11-12 ans",
    slogan: "Code, électronique et IA",
    sessions: [
      { n: 1, theme: "Python, premiers pas", activity: "Afficher, demander un nom, calculer", tools: "Python (hors ligne possible)" },
      { n: 2, theme: "Décisions et boucles", activity: "Mini-quiz et jeu de devinette", tools: "Python" },
      { n: 3, theme: "Arduino : la LED", activity: "Faire clignoter une LED, changer le rythme", tools: "Arduino" },
      { n: 4, theme: "Capteur et moteur", activity: "Lire un capteur de distance, piloter un moteur", tools: "Arduino" },
      { n: 5, theme: "L'IA qui reconnaît", activity: "Entraîner un modèle avec ses propres images", tools: "Teachable Machine" },
      { n: 6, theme: "Projet final", activity: "Voiture robot ou système qui reconnaît des objets, présentation aux parents", tools: "Arduino / Teachable Machine" },
    ],
    variant: "Variante 4 samedis : fusionner les samedis 1-2 et 3-4 de chaque tranche.",
  },
];

export const PLAN_B = [
  "Avoir toujours une activité sans écran prête par tranche d'âge (cartes, jeux de rôle, dessins de circuits).",
  "Télécharger Scratch, l'éditeur Python et le matériel de Teachable Machine avant la séance (versions hors ligne).",
  "Prévoir batteries externes et piles de rechange.",
];

export const EVALUATION =
  "À la fin de chaque séance, l'animateur coche 3 points par enfant : a participé, a terminé le défi, a aidé un camarade. Un test d'entrée (1re séance) et un test de sortie (6e séance) mesurent les progrès sur 4 compétences. Un bilan d'une page est remis avec le projet final.";
