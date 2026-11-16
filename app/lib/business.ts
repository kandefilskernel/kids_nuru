// Modèle économique du pilote : hypothèses, lignes libres et calculs mensuels.
// Montants en USD. Les valeurs par défaut sont des points de départ à ajuster.

export type Assumptions = {
  fee: number; // frais mensuel par enfant
  reductionPct: number; // réduction accordée aux places solidaires (%)
  samedisParMois: number;
  heuresSeance: number;
  tauxAnimateur: number; // coût horaire d'un animateur
  salleMois: number; // location de salle (par mois)
  assuranceMois: number;
  adminMois: number; // communication, frais divers
  sponsorsMois: number; // soutien des partenaires
  amortissementMois: number; // durée d'amortissement du matériel
  enfantsParAnimateur: number;
  // Hypothèse de calcul : nombre d'enfants et de places solidaires retenus. Vide (null) = inscriptions réelles.
  solidairesPrevues: number | null;
  prevusParNiveau: { eveil: number | null; explorateur: number | null; createur: number | null };
};

export type Line = { label: string; amount: number };

export type Notes = {
  intro: string;
  revenues: string;
  costs: string;
  threshold: string;
  conclusion: string;
};

export type ModelData = {
  assumptions: Assumptions;
  revenues: Line[]; // recettes libres, par mois
  costs: Line[]; // coûts libres, par mois
  notes: Notes;
};

export const LINE_SLOTS = 8;

export const DEFAULT_ASSUMPTIONS: Assumptions = {
  fee: 25,
  reductionPct: 50,
  samedisParMois: 4,
  heuresSeance: 2,
  tauxAnimateur: 5,
  salleMois: 40,
  assuranceMois: 20,
  adminMois: 20,
  sponsorsMois: 0,
  amortissementMois: 12,
  enfantsParAnimateur: 8,
  solidairesPrevues: null,
  prevusParNiveau: { eveil: null, explorateur: null, createur: null },
};

export const DEFAULT_NOTES: Notes = {
  intro:
    "Kids Tech-nuru Lab forme les enfants de 5 à 12 ans à la programmation, à la robotique et à l'intelligence artificielle, par le jeu et par projets. Ce document présente le fonctionnement économique du pilote et les hypothèses retenues.",
  revenues:
    "Les familles paient des frais mensuels. Les places solidaires bénéficient d'une réduction. Les soutiens des partenaires couvrent une partie des coûts.",
  costs:
    "Les coûts principaux sont les animateurs (un pour 8 enfants au plus), la salle, l'assurance et le matériel, amorti sur plusieurs mois.",
  threshold:
    "Le seuil de rentabilité est le nombre d'enfants à partir duquel les recettes couvrent les coûts chaque mois.",
  conclusion:
    "Les montants seront ajustés avec les devis réels et suivis chaque mois dans l'espace équipe.",
};

export type Result = {
  children: number;
  solidaires: number;
  groups: number;
  revenueFees: number;
  revenueSponsors: number;
  revenueOther: number;
  revenue: number;
  costAnimateurs: number;
  costSalle: number;
  costAssurance: number;
  costAdmin: number;
  costMateriel: number;
  costOther: number;
  cost: number;
  margin: number;
};

const sum = (xs: Line[]) => xs.reduce((s, x) => s + (Number.isFinite(x.amount) ? x.amount : 0), 0);

/** Calcul mensuel pour un nombre d'enfants donné. */
export function monthly(m: ModelData, children: number, solidaires: number, materielTotal: number): Result {
  const a = m.assumptions;
  const payants = Math.max(0, children - solidaires);
  const revenueFees = payants * a.fee + solidaires * a.fee * (1 - a.reductionPct / 100);
  const groups = children > 0 ? Math.ceil(children / a.enfantsParAnimateur) : 0;
  const costAnimateurs = groups * a.heuresSeance * a.samedisParMois * a.tauxAnimateur;
  const costSalle = children > 0 ? a.salleMois : 0;
  const costAssurance = children > 0 ? a.assuranceMois : 0;
  const costAdmin = children > 0 ? a.adminMois : 0;
  // materielTotal ne contient que le matériel à la charge du Lab (hors matériel apporté par les familles 8-12 ans).
  const costMateriel = a.amortissementMois > 0 ? materielTotal / a.amortissementMois : 0;
  const revenueOther = sum(m.revenues);
  const costOther = sum(m.costs);
  const revenue = revenueFees + a.sponsorsMois + revenueOther;
  const cost = costAnimateurs + costSalle + costAssurance + costAdmin + costMateriel + costOther;
  return {
    children,
    solidaires,
    groups,
    revenueFees,
    revenueSponsors: a.sponsorsMois,
    revenueOther,
    revenue,
    costAnimateurs,
    costSalle,
    costAssurance,
    costAdmin,
    costMateriel,
    costOther,
    cost,
    margin: revenue - cost,
  };
}

/** Plus petit nombre d'enfants pour lequel la marge est positive (ou null au-delà de 300). */
export function breakEven(m: ModelData, solidaireRatio: number, materielTotal: number): number | null {
  for (let n = 1; n <= 300; n++) {
    const s = Math.round(n * solidaireRatio);
    if (monthly(m, n, s, materielTotal).margin >= 0) return n;
  }
  return null;
}

/** Lit la configuration enregistrée (JSON) et complète avec les valeurs par défaut. */
export function parseModel(raw: string | null): ModelData {
  const base: ModelData = { assumptions: DEFAULT_ASSUMPTIONS, revenues: [], costs: [], notes: DEFAULT_NOTES };
  if (!raw) return base;
  try {
    const j = JSON.parse(raw);
    const lines = (xs: unknown): Line[] =>
      Array.isArray(xs)
        ? xs
            .filter((x) => x && typeof x.label === "string" && x.label.trim() && Number.isFinite(Number(x.amount)))
            .map((x) => ({ label: String(x.label), amount: Number(x.amount) }))
        : [];
    return {
      assumptions: { ...DEFAULT_ASSUMPTIONS, ...(j.assumptions ?? {}) },
      revenues: lines(j.revenues),
      costs: lines(j.costs),
      notes: { ...DEFAULT_NOTES, ...(j.notes ?? {}) },
    };
  } catch {
    return base;
  }
}
