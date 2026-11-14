// Badges de progression : calculés à partir des présences, défis, entraide, tests et projets.
// Aucune donnée en plus n'est stockée : un badge apparaît dès que l'équipe enregistre ce qui le débloque.

export type BadgeInput = {
  history: { present: boolean; challenge: boolean; helped: boolean }[];
  tests: { entree?: boolean[]; sortie?: boolean[] };
  projects: number;
};

export type Badge = {
  id: string;
  icon: string;
  label: string;
  description: string;
  earned: boolean;
  /** Avancement vers le badge : valeur actuelle et objectif. */
  progress: { value: number; goal: number };
};

const score = (s?: boolean[]) => (s ? s.filter(Boolean).length : 0);

export function computeBadges({ history, tests, projects }: BadgeInput): Badge[] {
  const present = history.filter((h) => h.present).length;
  // Un défi ou une entraide ne compte que si l'enfant était présent.
  const challenges = history.filter((h) => h.present && h.challenge).length;
  const helped = history.filter((h) => h.present && h.helped).length;
  const entree = score(tests.entree);
  const sortie = score(tests.sortie);
  const hasBoth = !!tests.entree && !!tests.sortie;

  const b = (
    id: string,
    icon: string,
    label: string,
    description: string,
    value: number,
    goal: number,
  ): Badge => ({ id, icon, label, description, earned: value >= goal, progress: { value: Math.min(value, goal), goal } });

  return [
    b("premier-pas", "🚀", "Premier pas", "Première séance à l'atelier", present, 1),
    b("assidu", "📅", "Assidu", "Présent à 3 séances", present, 3),
    b("toujours-la", "🏅", "Toujours là", "Présent à 6 séances", present, 6),
    b("defis", "🧩", "Relève les défis", "3 défis réussis", challenges, 3),
    b("camarade", "🤝", "Bon camarade", "A aidé un camarade 2 fois", helped, 2),
    b("progres", "📈", "En progrès", "Plus de compétences au test de sortie qu'à l'entrée", hasBoth && sortie > entree ? 1 : 0, 1),
    b("maitre", "💡", "Maître du code", "Les 4 compétences réussies au test de sortie", sortie, 4),
    b("createur", "🛠️", "Créateur", "Un projet présenté et publié dans la galerie", projects, 1),
  ];
}
