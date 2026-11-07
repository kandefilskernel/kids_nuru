import { breakEven, monthly, parseModel, type ModelData } from "@/lib/business";
import { countByLevel, getChildCounts, getMaterielTotal, getSetting } from "@/lib/db";
import { parseSchedule, totalMinutes } from "@/lib/schedule";

/**
 * Charge le modèle, les effectifs et le matériel, puis calcule les résultats.
 * Par niveau, l'effectif retenu est la valeur prévue si elle est renseignée, sinon le nombre
 * réel d'inscrits de ce niveau. Le total est la somme des niveaux. Sans aucune valeur prévue,
 * le calcul part des inscriptions réelles.
 */
export async function loadModel() {
  const [rawModel, actual, byLevel, materiel, schedule] = await Promise.all([
    getSetting("business_model").then((raw) => parseModel(raw)),
    getChildCounts(),
    countByLevel(),
    getMaterielTotal(),
    getSetting("session_schedule").then((raw) => parseSchedule(raw)),
  ]);
  // La durée d'une séance vient des horaires définis dans Réglages (somme des blocs).
  const model = {
    ...rawModel,
    assumptions: { ...rawModel.assumptions, heuresSeance: totalMinutes(schedule) / 60 },
  };

  const a = model.assumptions;
  const p = a.prevusParNiveau;
  const isPlanned = [p.eveil, p.explorateur, p.createur].some((v) => v !== null);
  const retenuParNiveau = {
    "Éveil": p.eveil ?? byLevel["Éveil"],
    "Explorateur": p.explorateur ?? byLevel["Explorateur"],
    "Créateur": p.createur ?? byLevel["Créateur"],
  };
  const children = isPlanned
    ? retenuParNiveau["Éveil"] + retenuParNiveau["Explorateur"] + retenuParNiveau["Créateur"]
    : actual.children;
  const solidaires = Math.min(children, a.solidairesPrevues ?? actual.solidaires);
  const ratio = children ? solidaires / children : 0;
  const current = monthly(model, children, solidaires, materiel);
  const scenarios = [8, 16, 24, 32].map((n) => ({
    n,
    r: monthly(model, n, Math.round(n * ratio), materiel),
  }));
  const threshold = breakEven(model, ratio, materiel);

  return {
    model: model as ModelData,
    children,
    solidaires,
    isPlanned,
    retenuParNiveau,
    actualChildren: actual.children,
    actualSolidaires: actual.solidaires,
    actualByLevel: byLevel,
    materiel,
    current,
    scenarios,
    threshold,
  };
}
