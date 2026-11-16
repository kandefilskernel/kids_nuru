// RAG léger pour l'espace équipe : indexe les documents de référence et le modèle économique,
// retrouve les passages pertinents (BM25, sans service externe) et, si ANTHROPIC_API_KEY est défini,
// fait rédiger une explication sourcée par Claude. Sans clé, seuls les passages trouvés sont affichés.

import { readdir, readFile } from "fs/promises";
import path from "path";
import type { ModelData, Result } from "@/lib/business";

export type Chunk = { source: string; title: string; text: string };

export type Hit = Chunk & { score: number };

/** Dossier des documents de référence (par défaut : ../complements depuis le dossier app). */
export const DOCS_DIR = process.env.DOCS_DIR ?? path.join(process.cwd(), "..", "complements");

const STOP = new Set([
  "les", "des", "une", "un", "est", "et", "que", "qui", "pour", "par", "sur", "dans", "avec", "sans",
  "the", "ses", "son", "sa", "aux", "plus", "moins", "pas", "ont", "sont", "ce", "cet", "cette", "ces",
  "comment", "quel", "quelle", "quels", "quelles", "quoi", "pourquoi", "combien", "faut", "peut",
  "vous", "nous", "elle", "ils", "elles", "leur", "leurs", "mon", "ton", "notre", "votre", "tout", "tous",
]);

/** Minuscules, sans accents, mots de 3 lettres ou plus, sans mots vides. */
export function tokenize(s: string): string[] {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length >= 3 && !STOP.has(t));
}

/** Découpe un document Markdown en sections (une par titre ##), ou un CSV en un seul passage. */
function chunkDocument(source: string, raw: string): Chunk[] {
  if (source.endsWith(".csv")) {
    return [{ source, title: `Tableau : ${path.basename(source)}`, text: raw.trim() }];
  }
  const docTitle = raw.match(/^#\s+(.+)$/m)?.[1]?.trim() ?? path.basename(source);
  const parts = raw.split(/^(?=##\s)/m);
  return parts
    .map((p) => p.trim())
    .filter((p) => p.length > 0)
    .map((p) => {
      const h = p.match(/^##\s+(.+)$/m)?.[1]?.trim();
      return { source, title: h ? `${docTitle} : ${h}` : docTitle, text: p.replace(/^#.*$/m, "").trim() };
    })
    .filter((c) => c.text.length > 0);
}

let cache: { dir: string; chunks: Chunk[] } | null = null;

/** Charge les documents de référence (mis en cache pour le processus). */
export async function loadCorpus(dir = DOCS_DIR): Promise<Chunk[]> {
  if (cache && cache.dir === dir) return cache.chunks;
  const files = (await readdir(dir)).filter((f) => /\.(md|csv)$/i.test(f)).sort();
  const chunks: Chunk[] = [];
  for (const f of files) {
    const raw = await readFile(path.join(dir, f), "utf8");
    chunks.push(...chunkDocument(f, raw));
  }
  cache = { dir, chunks };
  return chunks;
}

const fmt = (n: number) => Math.round(n).toLocaleString("fr-FR");

/** Passages décrivant le modèle économique courant (hypothèses, résultats, notes). */
export function modelChunks(m: {
  model: ModelData;
  current: Result;
  threshold: number | null;
  children: number;
  solidaires: number;
  actualChildren: number;
  isPlanned: boolean;
}): Chunk[] {
  const a = m.model.assumptions;
  const c = m.current;
  const src = "modele-economique (espace équipe)";
  const hyp = [
    `Frais mensuel par enfant : ${a.fee} USD.`,
    `Réduction pour les places solidaires : ${a.reductionPct} %.`,
    `Samedis par mois : ${a.samedisParMois}, durée d'une séance : ${a.heuresSeance} h.`,
    `Taux horaire d'un animateur : ${a.tauxAnimateur} USD ; un animateur pour ${a.enfantsParAnimateur} enfants au plus.`,
    `Location de salle : ${a.salleMois} USD par mois ; assurance : ${a.assuranceMois} USD par mois ; communication et frais divers : ${a.adminMois} USD par mois.`,
    `Soutien des partenaires : ${a.sponsorsMois} USD par mois ; amortissement du matériel sur ${a.amortissementMois} mois ; le matériel des 8-12 ans est apporté par les familles (non compté), celui des 5-7 ans est fourni par le Lab.`,
  ].join("\n");
  const res = [
    `Enfants retenus pour le calcul : ${m.children} dont ${m.solidaires} en place solidaire (${m.isPlanned ? "effectif prévu par l'équipe" : "inscrits réels"}). Inscrits actuellement : ${m.actualChildren}.`,
    `Recettes par mois : ${fmt(c.revenue)} USD (frais des familles ${fmt(c.revenueFees)} USD, partenaires ${fmt(c.revenueSponsors)} USD, autres ${fmt(c.revenueOther)} USD).`,
    `Coûts par mois : ${fmt(c.cost)} USD (animateurs ${fmt(c.costAnimateurs)}, salle ${fmt(c.costSalle)}, assurance ${fmt(c.costAssurance)}, communication ${fmt(c.costAdmin)}, matériel amorti ${fmt(c.costMateriel)}, autres ${fmt(c.costOther)}).`,
    `Marge par mois : ${fmt(c.margin)} USD.`,
    m.threshold === null
      ? "Seuil de rentabilité : non atteint avec ces hypothèses."
      : `Seuil de rentabilité : équilibre à partir de ${m.threshold} enfant(s) inscrits.`,
  ].join("\n");
  const notes = Object.values(m.model.notes).join("\n");
  return [
    { source: src, title: "Modèle : hypothèses", text: hyp },
    { source: src, title: "Modèle : résultats mensuels", text: res },
    { source: src, title: "Modèle : notes", text: notes },
  ];
}

/** Recherche BM25 : renvoie les k passages les plus pertinents pour la question. */
export function retrieve(chunks: Chunk[], question: string, k = 4): Hit[] {
  const qTerms = [...new Set(tokenize(question))];
  if (qTerms.length === 0 || chunks.length === 0) return [];
  const docs = chunks.map((c) => tokenize(`${c.title} ${c.text}`));
  const avgLen = docs.reduce((s, d) => s + d.length, 0) / docs.length || 1;
  const df = new Map<string, number>();
  for (const d of docs) for (const t of new Set(d)) df.set(t, (df.get(t) ?? 0) + 1);
  const N = docs.length;
  const K1 = 1.5;
  const B = 0.75;
  const scored: Hit[] = chunks.map((c, i) => {
    const tf = new Map<string, number>();
    for (const t of docs[i]) tf.set(t, (tf.get(t) ?? 0) + 1);
    let score = 0;
    for (const q of qTerms) {
      const f = tf.get(q) ?? 0;
      if (!f) continue;
      const idf = Math.log(1 + (N - (df.get(q) ?? 0) + 0.5) / ((df.get(q) ?? 0) + 0.5));
      score += idf * ((f * (K1 + 1)) / (f + K1 * (1 - B + (B * docs[i].length) / avgLen)));
    }
    return { ...c, score };
  });
  return scored
    .filter((h) => h.score > 0)
    .sort((x, y) => y.score - x.score)
    .slice(0, k);
}

export type Answer = {
  text: string | null; // null si la génération n'est pas configurée
  sources: { title: string; source: string }[];
  passages: Hit[];
  model: string | null;
};

const SYSTEM = `Tu es l'assistant de l'équipe de Kids Tech-nuru Lab, un centre de formation extrascolaire à Lubumbashi.
Tu expliques le modèle économique du pilote de façon claire, pédagogique et en français simple, pour des membres de l'équipe non spécialistes de la finance.
Règles :
- Appuie-toi uniquement sur les passages fournis. Si l'information manque, dis-le au lieu de l'inventer.
- Ne fais jamais de calcul qui ne soit pas visible dans les passages ; si tu calcules, montre l'opération.
- Donne les montants en USD par mois, avec le nom des postes.
- Propose, quand c'est utile, une piste concrète d'amélioration (prix, effectifs, coûts) sans décider à la place de l'équipe.
- Reste court : des paragraphes courts ou une liste à puces.`;

/** Répond à la question. Sans ANTHROPIC_API_KEY, renvoie seulement les passages pertinents. */
export async function answerQuestion(question: string, chunks: Chunk[]): Promise<Answer> {
  const passages = retrieve(chunks, question, 4);
  // Le résumé du modèle courant est toujours fourni : c'est le sujet principal.
  const modelPart = chunks.filter((c) => c.source.startsWith("modele-economique"));
  const context = [...modelPart, ...passages.filter((p) => !p.source.startsWith("modele-economique"))];
  const sources = context.map((c) => ({ title: c.title, source: c.source }));

  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return { text: null, sources, passages, model: null };

  const model = process.env.ANTHROPIC_MODEL ?? "claude-sonnet-5-5";
  const prompt = [
    "Passages de référence :",
    ...context.map((c, i) => `[${i + 1}] ${c.title} (${c.source})\n${c.text}`),
    "",
    `Question de l'équipe : ${question}`,
  ].join("\n\n");

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": key,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model,
      max_tokens: 900,
      system: SYSTEM,
      messages: [{ role: "user", content: prompt }],
    }),
  });
  if (!res.ok) throw new Error(`Génération indisponible (HTTP ${res.status})`);
  const data = (await res.json()) as { content?: { type: string; text?: string }[] };
  const text = data.content?.filter((b) => b.type === "text").map((b) => b.text ?? "").join("\n").trim() ?? "";
  return { text: text || null, sources, passages, model };
}
