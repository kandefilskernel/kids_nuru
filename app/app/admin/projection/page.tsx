import PageIntro from "@/components/PageIntro";
import Link from "next/link";
import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/auth";
import { getSetting } from "@/lib/db";
import {
  GROUPS,
  MONTHS,
  PROJ_SLOTS,
  SCENARIOS,
  parseProjection,
  simulate,
  type Line,
  type ScenarioName,
} from "@/lib/projection";
import { resetProjectionAction, saveProjectionAction } from "../actions";
import AdminNav from "../AdminNav";

export const metadata = { title: "Projection 3 ans · Kids Tech-nuru Lab", robots: { index: false } };
export const dynamic = "force-dynamic";

const fmt = (n: number) => Math.round(n).toLocaleString("fr-FR");
const month = (m: number | null) => (m === null ? "au-delà de 36" : `mois ${m}`);
const COLORS: Record<ScenarioName, string> = { Prudent: "#b3261e", "Réaliste": "#2563eb", Optimiste: "#0b7a63" };
const field =
  "mt-1.5 w-full rounded-xl border border-ink/15 px-3 py-2 text-sm outline-none focus:border-brand focus:ring-4 focus:ring-brand/15";

export default async function ProjectionPage({
  searchParams,
}: {
  searchParams: Promise<{ s?: string; saved?: string; reset?: string }>;
}) {
  if (!(await isAdmin())) redirect("/admin");
  const q = await searchParams;
  const current = (SCENARIOS as readonly string[]).includes(q.s ?? "") ? (q.s as ScenarioName) : "Réaliste";
  const proj = parseProjection(await getSetting("projection_3ans"));
  const res = Object.fromEntries(SCENARIOS.map((s) => [s, simulate(proj[s])])) as Record<ScenarioName, ReturnType<typeof simulate>>;
  const sc = proj[current];
  const r = res[current];

  return (
    <div className="bg-dots-dark min-h-[calc(100vh-130px)] bg-sky/50">
      <div className="mx-auto max-w-6xl px-4 py-10">
        <Link href="/admin" className="text-sm font-semibold text-brand hover:underline">
          ← Espace équipe
        </Link>
        <AdminNav current="/admin/projection" />

        <div className="mt-5">
          <PageIntro eyebrow="Espace équipe" title="Projection sur 3 ans">
            Trois scénarios sur 36 mois, calculés à partir des hypothèses que vous saisissez ci-dessous. Montants en USD.
          </PageIntro>
        </div>

        <div className="-mt-4 mb-2 flex justify-end">
          <Link
            href="/admin/projection/imprimer"
            target="_blank"
            className="rounded-full bg-ink px-5 py-2.5 text-sm font-bold text-white shadow-sm"
          >
            Ouvrir le dossier imprimable
          </Link>
        </div>

        {q.saved === "1" && <Notice>Hypothèses enregistrées. Les résultats sont recalculés.</Notice>}
        {q.reset === "1" && <Notice>Scénario remis aux valeurs d&apos;origine.</Notice>}

        {/* Comparaison des scénarios */}
        <section className="mt-6 overflow-x-auto rounded-2xl bg-white p-6 shadow-sm ring-1 ring-ink/10">
          <h2 className="text-lg font-extrabold">Résultats par scénario</h2>
          <table className="mt-4 w-full min-w-[520px] text-sm">
            <thead>
              <tr className="border-b border-ink/15 text-left">
                <th className="py-2" />
                {SCENARIOS.map((s) => (
                  <th key={s} className="py-2 text-right" style={{ color: COLORS[s] }}>
                    {s}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <Cmp label="Seuil de rentabilité (marge durablement positive)" f={(x) => month(x.breakEvenMonth)} res={res} strong />
              <Cmp label="Retour sur investissement (trésorerie cumulée ≥ 0)" f={(x) => month(x.paybackMonth)} res={res} strong />
              <Cmp label="Seuil en enfants (1 site, estimation)" f={(x) => (x.breakEvenChildren === null ? "n/a" : String(x.breakEvenChildren))} res={res} />
              <Cmp label="Besoin de financement maximal" f={(x) => `${fmt(x.need)} USD`} res={res} />
              <Cmp label="Levée recommandée (avec marge de sécurité)" f={(x) => `${fmt(x.ask)} USD`} res={res} strong />
              <Cmp label="Enfants en fin d'année 3" f={(x) => String(x.years[2].children)} res={res} />
              <Cmp label="Marge d'exploitation année 3" f={(x) => `${fmt(x.years[2].margin)} USD`} res={res} />
              <Cmp label="Trésorerie cumulée à 36 mois" f={(x) => `${fmt(x.months[MONTHS - 1].cum)} USD`} res={res} />
            </tbody>
          </table>
          <Chart res={res} />
        </section>

        {/* Choix du scénario */}
        <div className="mt-8 flex flex-wrap gap-2" role="tablist" aria-label="Scénario">
          {SCENARIOS.map((s) => (
            <Link
              key={s}
              href={`/admin/projection?s=${encodeURIComponent(s)}`}
              className={`rounded-full px-4 py-2 text-sm font-bold ${
                s === current ? "bg-brand text-white" : "bg-white ring-1 ring-ink/15 hover:bg-sky"
              }`}
            >
              Modifier : {s}
            </Link>
          ))}
        </div>

        {/* Détail par année du scénario choisi */}
        <section className="mt-4 overflow-x-auto rounded-2xl bg-white p-6 shadow-sm ring-1 ring-ink/10">
          <h2 className="text-lg font-extrabold">Détail par année : {current}</h2>
          <table className="mt-4 w-full min-w-[480px] text-sm">
            <thead>
              <tr className="border-b border-ink/15 text-right">
                <th className="py-2 text-left" />
                {[1, 2, 3].map((y) => (
                  <th key={y} className="py-2">
                    Année {y}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(
                [
                  ["Enfants en fin d'année", "children"],
                  ["Recettes", "revenue"],
                  ["Coûts d'exploitation", "cost"],
                  ["Marge d'exploitation", "margin"],
                  ["Investissements", "capex"],
                  ["Trésorerie nette", "net"],
                ] as const
              ).map(([label, k]) => (
                <tr key={k} className="border-b border-ink/10">
                  <td className="py-2 text-ink/70">{label}</td>
                  {r.years.map((y, i) => (
                    <td key={i} className={`py-2 text-right font-semibold ${y[k] < 0 ? "text-[#b3261e]" : ""}`}>
                      {fmt(y[k])}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        {/* Saisie des hypothèses */}
        <form action={saveProjectionAction} className="mt-6 space-y-6">
          <input type="hidden" name="scenario" value={current} />
          {GROUPS.map((g) => (
            <section key={g.title} className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-ink/10">
              <h2 className="text-lg font-extrabold">
                {g.title} <span className="text-sm font-semibold text-ink/50">({current})</span>
              </h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {g.items.map((it) => (
                  <label key={it.key} className="block text-sm">
                    <span className="font-semibold">{it.label}</span>
                    <span className="ml-1 text-xs text-ink/50">({it.unit})</span>
                    <input
                      name={it.key}
                      type="number"
                      min="0"
                      step="any"
                      required
                      defaultValue={it.pct ? Math.round(sc.params[it.key] * 10000) / 100 : sc.params[it.key]}
                      className={field}
                    />
                    {it.hint && <span className="mt-1 block text-xs text-ink/55">{it.hint}</span>}
                  </label>
                ))}
              </div>
            </section>
          ))}

          <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-ink/10">
            <h2 className="text-lg font-extrabold">Lignes libres de recettes</h2>
            <p className="mt-1 text-xs text-ink/60">
              Ex. stages de vacances, vente de kits. Montant par mois, à partir du mois indiqué. Cochez « Supprimer » pour retirer une ligne.
            </p>
            <Lines prefix="rev" lines={sc.revenues} />
          </section>
          <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-ink/10">
            <h2 className="text-lg font-extrabold">Lignes libres de coûts</h2>
            <p className="mt-1 text-xs text-ink/60">Ex. transport, formation des animateurs, loyer d&apos;un dépôt.</p>
            <Lines prefix="cost" lines={sc.costs} />
          </section>

          <div className="flex flex-wrap items-center gap-3">
            <button className="rounded-full bg-brand px-6 py-3 text-sm font-bold text-white shadow-sm">
              Enregistrer le scénario {current}
            </button>
          </div>
        </form>
        <form action={resetProjectionAction} className="mt-3">
          <input type="hidden" name="scenario" value={current} />
          <button className="rounded-full px-4 py-2 text-sm font-semibold text-[#b3261e] ring-1 ring-[#b3261e]/40 hover:bg-[#b3261e]/5">
            Remettre {current} aux valeurs d&apos;origine
          </button>
        </form>
      </div>
    </div>
  );
}

function Notice({ children }: { children: React.ReactNode }) {
  return (
    <p className="mt-4 rounded-xl bg-mint/15 p-3 text-sm font-semibold text-[#0b7a63] ring-1 ring-mint/40">{children}</p>
  );
}

function Cmp({
  label,
  f,
  res,
  strong,
}: {
  label: string;
  f: (r: ReturnType<typeof simulate>) => string;
  res: Record<ScenarioName, ReturnType<typeof simulate>>;
  strong?: boolean;
}) {
  return (
    <tr className="border-b border-ink/10">
      <td className="py-2 text-ink/70">{label}</td>
      {SCENARIOS.map((s) => (
        <td key={s} className={`py-2 text-right tabular-nums ${strong ? "font-extrabold" : "font-semibold"}`}>
          {f(res[s])}
        </td>
      ))}
    </tr>
  );
}

function Lines({ prefix, lines }: { prefix: "rev" | "cost"; lines: Line[] }) {
  return (
    <div className="mt-4 grid gap-2">
      {Array.from({ length: PROJ_SLOTS }, (_, i) => (
        <div key={i} className="grid items-center gap-2 sm:grid-cols-[2fr_1fr_1fr_auto]">
          <input name={`${prefix}Label${i}`} defaultValue={lines[i]?.label ?? ""} placeholder="Libellé" aria-label={`Libellé ligne ${i + 1}`} className={field.replace("mt-1.5 ", "")} />
          <input name={`${prefix}Amount${i}`} type="number" min="0" step="any" defaultValue={lines[i]?.amount ?? ""} placeholder="USD / mois" aria-label={`Montant ligne ${i + 1}`} className={field.replace("mt-1.5 ", "")} />
          <input name={`${prefix}Start${i}`} type="number" min="1" max="36" defaultValue={lines[i]?.start ?? 1} placeholder="Dès le mois" aria-label={`Mois de début ligne ${i + 1}`} className={field.replace("mt-1.5 ", "")} />
          {lines[i] ? (
            <label className="flex items-center gap-2 whitespace-nowrap text-sm text-[#b3261e]">
              <input type="checkbox" name={`${prefix}Del${i}`} className="h-4 w-4 accent-[#b3261e]" />
              Supprimer
            </label>
          ) : (
            <span />
          )}
        </div>
      ))}
    </div>
  );
}

function Chart({ res }: { res: Record<ScenarioName, ReturnType<typeof simulate>> }) {
  const W = 760, H = 260, L = 56, B = 28, T = 12, Rm = 12;
  const all = SCENARIOS.flatMap((s) => res[s].months.map((m) => m.cum));
  const min = Math.min(0, ...all), max = Math.max(1, ...all);
  const x = (t: number) => L + ((t - 1) / (MONTHS - 1)) * (W - L - Rm);
  const y = (v: number) => T + (1 - (v - min) / (max - min)) * (H - T - B);
  return (
    <div className="mt-6">
      <h3 className="text-sm font-extrabold">Trésorerie cumulée (USD)</h3>
      <svg viewBox={`0 0 ${W} ${H}`} className="mt-2 w-full" role="img" aria-label="Trésorerie cumulée sur 36 mois, trois scénarios">
        <line x1={L} x2={W - Rm} y1={y(0)} y2={y(0)} stroke="#999" strokeDasharray="4 3" />
        {[min, 0, max].map((v, i) => (
          <text key={i} x={L - 6} y={y(v) + 4} textAnchor="end" fontSize="11" fill="#555">
            {fmt(v)}
          </text>
        ))}
        {[1, 12, 24, 36].map((t) => (
          <text key={t} x={x(t)} y={H - 8} textAnchor="middle" fontSize="11" fill="#555">
            {t}
          </text>
        ))}
        {SCENARIOS.map((s) => (
          <polyline
            key={s}
            fill="none"
            stroke={COLORS[s]}
            strokeWidth="2.5"
            points={res[s].months.map((m) => `${x(m.t)},${y(m.cum)}`).join(" ")}
          />
        ))}
      </svg>
      <p className="mt-1 flex flex-wrap gap-4 text-xs font-semibold">
        {SCENARIOS.map((s) => (
          <span key={s} style={{ color: COLORS[s] }}>
            ● {s}
          </span>
        ))}
        <span className="text-ink/50">Axe horizontal : mois</span>
      </p>
    </div>
  );
}
