// Simulation économique sur 36 mois : trois scénarios, hypothèses saisies par l'équipe. Montants en USD.

export const SCENARIOS = ["Prudent", "Réaliste", "Optimiste"] as const;
export type ScenarioName = (typeof SCENARIOS)[number];
export const MONTHS = 36;
export const PROJ_SLOTS = 6;

export type ParamKey =
  | "start" | "newPerMonth" | "attrition" | "capGroup" | "groupsSite" | "site2" | "site3"
  | "fee" | "solidPct" | "reductionPct" | "regFee" | "schools" | "schoolStart" | "schoolFee"
  | "sponsor" | "sponsorStart"
  | "hours" | "sessions" | "rate" | "prepPct" | "coord" | "coordStart" | "siteResp"
  | "room" | "insurance" | "app" | "admin" | "mktPct" | "schoolCostPct" | "contingencyPct"
  | "capex0" | "capexGroup" | "capexSite" | "reservePct";

export type Params = Record<ParamKey, number>;
export type Line = { label: string; amount: number; start: number };
export type Scenario = { params: Params; revenues: Line[]; costs: Line[] };
export type Projection = Record<ScenarioName, Scenario>;

export type ParamDef = { key: ParamKey; label: string; unit: string; pct?: boolean; hint?: string };
export const GROUPS: { title: string; items: ParamDef[] }[] = [
  {
    title: "Demande et capacité",
    items: [
      { key: "start", label: "Enfants inscrits au mois 1", unit: "enfants" },
      { key: "newPerMonth", label: "Nouvelles inscriptions par mois", unit: "enfants/mois" },
      { key: "attrition", label: "Attrition mensuelle", unit: "%", pct: true, hint: "Enfants qui arrêtent chaque mois" },
      { key: "capGroup", label: "Enfants par groupe (1 animateur)", unit: "enfants" },
      { key: "groupsSite", label: "Groupes maximum par site", unit: "groupes" },
      { key: "site2", label: "Ouverture du site n°2 (mois)", unit: "mois", hint: "99 = jamais" },
      { key: "site3", label: "Ouverture du site n°3 (mois)", unit: "mois", hint: "99 = jamais" },
    ],
  },
  {
    title: "Prix et recettes",
    items: [
      { key: "fee", label: "Frais mensuel par enfant", unit: "USD/mois" },
      { key: "solidPct", label: "Part de places solidaires", unit: "%", pct: true },
      { key: "reductionPct", label: "Réduction sur place solidaire", unit: "%", pct: true },
      { key: "regFee", label: "Frais d'inscription (nouvel enfant)", unit: "USD" },
      { key: "schools", label: "Contrats avec des écoles", unit: "contrats" },
      { key: "schoolStart", label: "Début des contrats écoles (mois)", unit: "mois" },
      { key: "schoolFee", label: "Montant mensuel d'un contrat école", unit: "USD/mois" },
      { key: "sponsor", label: "Sponsors et subventions", unit: "USD/mois" },
      { key: "sponsorStart", label: "Début des soutiens (mois)", unit: "mois" },
    ],
  },
  {
    title: "Coûts d'exploitation",
    items: [
      { key: "hours", label: "Durée d'une séance", unit: "heures" },
      { key: "sessions", label: "Séances par mois et par groupe", unit: "séances" },
      { key: "rate", label: "Coût horaire d'un animateur", unit: "USD/h" },
      { key: "prepPct", label: "Préparation en plus des heures de séance", unit: "%", pct: true },
      { key: "coord", label: "Salaire du coordinateur", unit: "USD/mois" },
      { key: "coordStart", label: "Début du salaire (mois)", unit: "mois" },
      { key: "siteResp", label: "Responsable par site supplémentaire", unit: "USD/mois" },
      { key: "room", label: "Salle (par site)", unit: "USD/mois" },
      { key: "insurance", label: "Assurance (par site)", unit: "USD/mois" },
      { key: "app", label: "Application, hébergement, outils", unit: "USD/mois" },
      { key: "admin", label: "Communication et frais divers (fixes)", unit: "USD/mois" },
      { key: "mktPct", label: "Marketing variable", unit: "% des recettes", pct: true },
      { key: "schoolCostPct", label: "Coût direct d'un contrat école", unit: "% du contrat", pct: true },
      { key: "contingencyPct", label: "Imprévus", unit: "% des coûts", pct: true },
    ],
  },
  {
    title: "Investissements et financement",
    items: [
      { key: "capex0", label: "Lancement (affiches, outils, aménagement)", unit: "USD" },
      { key: "capexGroup", label: "Matériel par nouveau groupe", unit: "USD/groupe" },
      { key: "capexSite", label: "Ouverture d'un nouveau site", unit: "USD/site" },
      { key: "reservePct", label: "Marge de sécurité sur la levée", unit: "%", pct: true },
    ],
  },
];

const BASE: Params = {
  start: 15, newPerMonth: 6, attrition: 0.03, capGroup: 8, groupsSite: 6, site2: 13, site3: 25,
  fee: 25, solidPct: 0.15, reductionPct: 0.5, regFee: 10, schools: 1, schoolStart: 7, schoolFee: 150,
  sponsor: 100, sponsorStart: 4,
  hours: 2, sessions: 4, rate: 5, prepPct: 0.5, coord: 300, coordStart: 1, siteResp: 100,
  room: 40, insurance: 20, app: 15, admin: 20, mktPct: 0.03, schoolCostPct: 0.4, contingencyPct: 0.05,
  capex0: 500, capexGroup: 200, capexSite: 800, reservePct: 0.2,
};

export const DEFAULTS: Record<ScenarioName, Partial<Params>> = {
  Prudent: {
    start: 10, newPerMonth: 3, attrition: 0.05, site2: 99, site3: 99, fee: 20, solidPct: 0.2, regFee: 5,
    schools: 0, schoolStart: 13, sponsor: 0, coord: 250,
  },
  "Réaliste": {},
  Optimiste: {
    start: 20, newPerMonth: 9, attrition: 0.02, site2: 10, site3: 19, fee: 30, schools: 2, schoolFee: 200,
    sponsor: 300, coord: 350,
  },
};

export function defaultScenario(name: ScenarioName): Scenario {
  return { params: { ...BASE, ...DEFAULTS[name] }, revenues: [], costs: [] };
}

export function defaultProjection(): Projection {
  return Object.fromEntries(SCENARIOS.map((s) => [s, defaultScenario(s)])) as Projection;
}

const num = (v: unknown, d: number) => (Number.isFinite(Number(v)) && v !== "" && v !== null ? Number(v) : d);

function parseLines(xs: unknown): Line[] {
  if (!Array.isArray(xs)) return [];
  return xs
    .filter((x) => x && typeof x.label === "string" && x.label.trim() && Number.isFinite(Number(x.amount)))
    .slice(0, PROJ_SLOTS)
    .map((x) => ({ label: String(x.label), amount: Number(x.amount), start: Math.max(1, Math.round(num(x.start, 1))) }));
}

/** Lit la configuration enregistrée (JSON) et complète avec les valeurs par défaut. */
export function parseProjection(raw: string | null): Projection {
  const out = defaultProjection();
  if (!raw) return out;
  try {
    const j = JSON.parse(raw);
    for (const s of SCENARIOS) {
      const src = j?.[s];
      if (!src) continue;
      for (const k of Object.keys(out[s].params) as ParamKey[]) {
        out[s].params[k] = num(src.params?.[k], out[s].params[k]);
      }
      out[s].revenues = parseLines(src.revenues);
      out[s].costs = parseLines(src.costs);
    }
  } catch {
    /* valeurs par défaut */
  }
  return out;
}

export type Month = {
  t: number;
  sites: number;
  capacity: number;
  children: number;
  newKids: number;
  solidaires: number;
  groups: number;
  revenue: number;
  cost: number;
  margin: number;
  capex: number;
  net: number;
  cum: number;
};

export type Year = { children: number; revenue: number; cost: number; margin: number; capex: number; net: number };

export type Result = {
  months: Month[];
  years: Year[];
  breakEvenMonth: number | null; // premier mois à partir duquel la marge reste positive
  paybackMonth: number | null; // premier mois à partir duquel la trésorerie cumulée reste positive
  need: number;
  ask: number;
  breakEvenChildren: number | null;
};

export function simulate(sc: Scenario): Result {
  const p = sc.params;
  const months: Month[] = [];
  let prev: Month | null = null;
  for (let t = 1; t <= MONTHS; t++) {
    const sites = 1 + (t >= p.site2 ? 1 : 0) + (t >= p.site3 ? 1 : 0);
    const capacity = sites * p.groupsSite * p.capGroup;
    const kept = prev ? prev.children * (1 - p.attrition) : 0;
    const children = prev ? Math.min(capacity, kept + p.newPerMonth) : Math.min(capacity, p.start);
    const newKids = prev ? Math.max(0, children - kept) : children;
    const solidaires = Math.round(children * p.solidPct);
    const groups = children > 0 ? Math.ceil(children / Math.max(1, p.capGroup)) : 0;

    const fees = (children - solidaires) * p.fee + solidaires * p.fee * (1 - p.reductionPct);
    const school = t >= p.schoolStart ? p.schools * p.schoolFee : 0;
    const sponsor = t >= p.sponsorStart ? p.sponsor : 0;
    const freeRev = sc.revenues.filter((l) => t >= l.start).reduce((s, l) => s + l.amount, 0);
    const revenue = fees + newKids * p.regFee + school + sponsor + freeRev;

    const animateurs = groups * p.hours * p.sessions * p.rate * (1 + p.prepPct);
    const coord = (t >= p.coordStart ? p.coord : 0) + (sites - 1) * p.siteResp;
    const com = p.admin + p.mktPct * revenue;
    const base =
      animateurs + coord + sites * p.room + sites * p.insurance + p.app + com + p.schoolCostPct * school +
      sc.costs.filter((l) => t >= l.start).reduce((s, l) => s + l.amount, 0);
    const cost = base * (1 + p.contingencyPct);

    const capex =
      (t === 1 ? p.capex0 : 0) +
      Math.max(0, groups - (prev?.groups ?? 0)) * p.capexGroup +
      (t === p.site2 ? p.capexSite : 0) +
      (t === p.site3 ? p.capexSite : 0);
    const margin = revenue - cost;
    const net = margin - capex;
    const m: Month = {
      t, sites, capacity, children, newKids, solidaires, groups, revenue, cost, margin, capex, net,
      cum: (prev?.cum ?? 0) + net,
    };
    months.push(m);
    prev = m;
  }

  const years: Year[] = [0, 1, 2].map((y) => {
    const ms = months.slice(y * 12, y * 12 + 12);
    const sum = (f: (m: Month) => number) => ms.reduce((s, m) => s + f(m), 0);
    return {
      children: Math.round(ms[ms.length - 1].children),
      revenue: sum((m) => m.revenue),
      cost: sum((m) => m.cost),
      margin: sum((m) => m.margin),
      capex: sum((m) => m.capex),
      net: sum((m) => m.net),
    };
  });

  // Premier mois à partir duquel la condition reste vraie jusqu'au mois 36.
  const lasting = (ok: (m: Month) => boolean) => {
    let from: number | null = null;
    for (let i = months.length - 1; i >= 0; i--) {
      if (!ok(months[i])) break;
      from = months[i].t;
    }
    return from;
  };
  const need = Math.max(0, -Math.min(...months.map((m) => m.cum)));

  const avg = p.fee * (1 - p.solidPct * p.reductionPct);
  const varCost = (p.hours * p.sessions * p.rate * (1 + p.prepPct)) / Math.max(1, p.capGroup);
  const k = 1 + p.contingencyPct;
  const contrib = avg * (1 - p.mktPct) - varCost * k;
  const fixed = (p.coord + p.room + p.insurance + p.app + p.admin) * k;
  const breakEvenChildren = contrib > 0 ? Math.ceil(fixed / contrib) : null;

  return {
    months,
    years,
    breakEvenMonth: lasting((m) => m.margin >= 0),
    paybackMonth: lasting((m) => m.cum >= 0),
    need,
    ask: need * (1 + p.reservePct),
    breakEvenChildren,
  };
}
