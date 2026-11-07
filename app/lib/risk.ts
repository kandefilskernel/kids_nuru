// Prévision du retard de paiement d'une famille.
// Une ligne = un enfant et un mois. Étiquette : l'enfant a-t-il payé ce mois-là ?
// Variables calculées uniquement à partir du passé (pas de fuite d'information du mois prédit).
// Modèle : régression logistique entraînée dans l'application (sans service externe).
// Tant qu'il n'y a pas assez de données, on utilise un score de règles de départ.

export type Reg = { id: string; createdAt: string; solidarity: boolean };
export type Pay = { registrationId: string; month: string; cancelled: boolean };
export type Att = { registrationId: string; date: string; present: boolean };

export const FEATURE_NAMES = ["Part des mois payés", "A payé le mois précédent", "Taux de présence", "Place solidaire"] as const;

export type Model = {
  bias: number;
  weights: number[]; // une par variable, dans l'ordre de FEATURE_NAMES
  trainedOn: number; // nombre de lignes d'entraînement
  accuracy: number | null; // précision sur la période de test
  baselineAccuracy: number | null; // précision du score de règles sur la même période
  trainedAt: string | null;
};

/** Score de règles de départ : utilisé tant que le modèle n'est pas entraîné. */
export const BASELINE: Model = {
  bias: -0.4,
  weights: [2.0, 1.0, 1.0, -0.2],
  trainedOn: 0,
  accuracy: null,
  baselineAccuracy: null,
  trainedAt: null,
};

const idx = (m: string) => {
  const [y, mo] = m.split("-").map(Number);
  return y * 12 + (mo - 1);
};
const monthOf = (d: string) => d.slice(0, 7);
const sigmoid = (z: number) => 1 / (1 + Math.exp(-z));
const pct = (x: number | null) => (x === null ? "—" : `${Math.round(x * 100)} %`);

export type Row = { registrationId: string; month: string; x: number[]; y: number | null; priorMonths: number };

/** Variables d'un enfant pour un mois donné, à partir de son historique antérieur. */
export function featuresFor(reg: Reg, month: string, pays: Pay[], atts: Att[]): { x: number[]; priorMonths: number } {
  const start = idx(monthOf(reg.createdAt));
  const m = idx(month);
  const prior = Math.max(0, m - start);
  const paidMonths = new Set(pays.filter((p) => !p.cancelled).map((p) => idx(p.month)));
  let paidPrior = 0;
  for (let k = start; k < m; k++) if (paidMonths.has(k)) paidPrior++;
  const paidRate = prior > 0 ? paidPrior / prior : 0.5;
  const paidLast = prior > 0 ? (paidMonths.has(m - 1) ? 1 : 0) : 0.5;
  const before = atts.filter((a) => idx(monthOf(a.date)) < m);
  const attendance = before.length > 0 ? before.filter((a) => a.present).length / before.length : 0.5;
  return { x: [paidRate, paidLast, attendance, reg.solidarity ? 1 : 0], priorMonths: prior };
}

/** Lignes pour les mois passés (entraînement) et pour le mois courant (prévision). */
export function buildRows(regs: Reg[], pays: Pay[], atts: Att[], currentMonth: string): { past: Row[]; current: Row[] } {
  const past: Row[] = [];
  const current: Row[] = [];
  const cur = idx(currentMonth);
  for (const r of regs) {
    const rp = pays.filter((p) => p.registrationId === r.id);
    const ra = atts.filter((a) => a.registrationId === r.id);
    const paidIdx = new Set(rp.filter((p) => !p.cancelled).map((p) => idx(p.month)));
    for (let k = idx(monthOf(r.createdAt)); k <= cur; k++) {
      const month = `${Math.floor(k / 12)}-${String((k % 12) + 1).padStart(2, "0")}`;
      const f = featuresFor(r, month, rp, ra);
      if (k === cur) current.push({ registrationId: r.id, month, ...f, y: null });
      else past.push({ registrationId: r.id, month, ...f, y: paidIdx.has(k) ? 1 : 0 });
    }
  }
  return { past, current };
}

/** Probabilité de payer le mois (0 à 1). */
export function probability(model: Model, x: number[]): number {
  return sigmoid(model.bias + x.reduce((s, v, i) => s + v * model.weights[i], 0));
}

/** Contribution de chaque variable à la prévision (positif = aide à payer). */
export function contributions(model: Model, x: number[]) {
  return x.map((v, i) => ({ name: FEATURE_NAMES[i], value: v, effect: v * model.weights[i] }));
}

/** Régression logistique par descente de gradient, avec régularisation L2. */
function fit(rows: Row[], iterations = 800, lr = 0.5, l2 = 0.01): { bias: number; weights: number[] } {
  const n = FEATURE_NAMES.length;
  let bias = 0;
  let weights = new Array(n).fill(0);
  const data = rows.filter((r) => r.y !== null);
  for (let it = 0; it < iterations; it++) {
    let gb = 0;
    const gw = new Array(n).fill(0);
    for (const r of data) {
      const err = sigmoid(bias + r.x.reduce((s, v, i) => s + v * weights[i], 0)) - (r.y as number);
      gb += err;
      for (let i = 0; i < n; i++) gw[i] += err * r.x[i];
    }
    bias -= (lr * gb) / data.length;
    weights = weights.map((w, i) => w - lr * (gw[i] / data.length + l2 * w));
  }
  return { bias, weights };
}

function accuracy(predict: (x: number[]) => number, rows: Row[]): number {
  const data = rows.filter((r) => r.y !== null);
  if (data.length === 0) return 0;
  const ok = data.filter((r) => (predict(r.x) >= 0.5 ? 1 : 0) === r.y).length;
  return ok / data.length;
}

/**
 * Entraîne le modèle sur les mois passés, dans l'ordre chronologique (70 % entraînement, 30 % test).
 * Ne renvoie un modèle que s'il bat le score de règles sur la période de test et si les données suffisent.
 */
export function train(past: Row[], now = new Date()): { model: Model | null; reason: string } {
  const usable = past.filter((r) => r.priorMonths > 0 && r.y !== null);
  if (usable.length < 60) return { model: null, reason: `Pas assez de données : ${usable.length} mois-enfants sur 60 nécessaires.` };
  const positives = usable.filter((r) => r.y === 1).length;
  if (positives < 10 || usable.length - positives < 10) return { model: null, reason: "Trop peu d'exemples de paiements ou de retards pour apprendre." };

  const sorted = [...usable].sort((a, b) => (a.month < b.month ? -1 : a.month > b.month ? 1 : 0));
  const cut = Math.floor(sorted.length * 0.7);
  const trainRows = sorted.slice(0, cut);
  const testRows = sorted.slice(cut);
  const { bias, weights } = fit(trainRows);
  const candidate: Model = {
    bias,
    weights,
    trainedOn: trainRows.length,
    accuracy: accuracy((x) => sigmoid(bias + x.reduce((s, v, i) => s + v * weights[i], 0)), testRows),
    baselineAccuracy: accuracy((x) => probability(BASELINE, x), testRows),
    trainedAt: now.toISOString(),
  };
  // Référence naïve : toujours prédire la classe la plus fréquente de la période de test.
  const testPaid = testRows.filter((r) => r.y === 1).length / testRows.length;
  const majority = Math.max(testPaid, 1 - testPaid);
  const bar = Math.max(candidate.baselineAccuracy ?? 0, majority) + 0.02;
  if ((candidate.accuracy ?? 0) < bar) {
    return {
      model: null,
      reason: `Le modèle (${pct(candidate.accuracy)}) ne fait pas nettement mieux que la référence (${pct(Math.max(candidate.baselineAccuracy ?? 0, majority))}) : on garde les règles.`,
    };
  }
  return { model: candidate, reason: `Modèle entraîné et retenu (précision ${pct(candidate.accuracy)}).` };
}

/** Lit le modèle enregistré ; repli sur le score de règles si la valeur est absente ou invalide. */
export function parseStoredModel(raw: string | null): Model {
  if (!raw) return BASELINE;
  try {
    const j = JSON.parse(raw) as Partial<Model>;
    const ok = typeof j.bias === "number" && Array.isArray(j.weights) && j.weights.length === FEATURE_NAMES.length && j.weights.every((w) => typeof w === "number" && Number.isFinite(w));
    return ok ? { ...BASELINE, ...(j as Model) } : BASELINE;
  } catch {
    return BASELINE;
  }
}
