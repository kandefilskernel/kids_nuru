// Financement du centre : financeurs et actionnaires, leurs apports rattachés au plan,
// bénéfice estimé et répartition entre actionnaires.
// Montants en USD. Seuls les apports « capital » en USD donnent des parts.

export type FinanceurType = "financeur" | "actionnaire" | "partenaire";
export type Nature = "capital" | "don" | "pret";

export type Financeur = {
  id: string;
  name: string;
  type: FinanceurType;
  contact: string;
  note: string;
};

export type Apport = {
  id: string;
  financeurId: string;
  amount: number;
  currency: "USD" | "CDF";
  date: string; // YYYY-MM-DD
  nature: Nature;
  expenseId: string | null; // poste du budget (plan) financé
  note: string;
};

export const TYPE_LABEL: Record<FinanceurType, string> = {
  financeur: "Financeur",
  actionnaire: "Actionnaire",
  partenaire: "Partenaire",
};

export const NATURE_LABEL: Record<Nature, string> = {
  capital: "Capital (en parts)",
  don: "Don (sans contrepartie)",
  pret: "Prêt (à rembourser)",
};

export type Holding = {
  financeurId: string;
  name: string;
  type: FinanceurType;
  capital: number; // apports en capital, USD
  share: number; // part du capital, 0 à 1
};

/** Parts du capital : chaque actionnaire détient son apport en capital / total du capital (USD). */
export function holdings(financeurs: Financeur[], apports: Apport[]): Holding[] {
  const capitalUsd = apports.filter((a) => a.nature === "capital" && a.currency === "USD");
  const total = capitalUsd.reduce((s, a) => s + a.amount, 0);
  return financeurs
    .map((f) => {
      const capital = capitalUsd.filter((a) => a.financeurId === f.id).reduce((s, a) => s + a.amount, 0);
      return { financeurId: f.id, name: f.name, type: f.type, capital, share: total > 0 ? capital / total : 0 };
    })
    .filter((h) => h.capital > 0)
    .sort((a, b) => b.capital - a.capital);
}

export type Profit = {
  monthly: number; // bénéfice mensuel (recettes − coûts), USD
  months: number;
  cumulative: number; // bénéfice cumulé estimé sur la période, USD
  distributable: number; // part distribuable aux actionnaires (0 si perte)
};

/** Bénéfice estimé sur une période. Une perte n'est pas distribuée. */
export function profit(monthlyMargin: number, months: number, distributionRate = 1): Profit {
  const cumulative = monthlyMargin * months;
  const distributable = cumulative > 0 ? cumulative * distributionRate : 0;
  return { monthly: monthlyMargin, months, cumulative, distributable };
}

/** Répartit la somme distribuable au prorata des parts. */
export function distribute(amount: number, holdingsList: Holding[]): { financeurId: string; name: string; amount: number; share: number }[] {
  return holdingsList.map((h) => ({
    financeurId: h.financeurId,
    name: h.name,
    share: h.share,
    amount: amount * h.share,
  }));
}

/** Couverture d'un poste du plan : montant prévu, financé et restant (dans la devise du poste). */
export function coverage(planned: number, funded: number) {
  const remaining = Math.max(0, planned - funded);
  return { planned, funded, remaining, pct: planned > 0 ? Math.min(100, Math.round((funded / planned) * 100)) : 0 };
}
