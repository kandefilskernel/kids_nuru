import Link from "next/link";
import { redirect } from "next/navigation";
import PageIntro from "@/components/PageIntro";
import { isAdmin } from "@/lib/auth";
import { getApports, getExpenses, getFinanceurs } from "@/lib/db";
import { coverage, distribute, holdings, NATURE_LABEL, profit, TYPE_LABEL, type Nature } from "@/lib/finance";
import { addApportAction, addFinanceurAction, removeApportAction, removeFinanceurAction } from "./actions";
import AdminNav from "../AdminNav";
import { loadModel } from "../modele/data";

export const metadata = { title: "Financement · Kids Tech-nuru Lab", robots: { index: false } };
export const dynamic = "force-dynamic";

const fmt = (n: number) => Math.round(n).toLocaleString("fr-FR");
const pct = (x: number) => `${(x * 100).toFixed(1).replace(".", ",")} %`;

const field = "w-full rounded-xl border border-ink/15 bg-white px-3 py-2 text-sm outline-none focus:border-brand focus:ring-4 focus:ring-brand/15";

export default async function FinancementPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; error?: string; mois?: string }>;
}) {
  if (!(await isAdmin())) redirect("/admin");
  const { saved, error, mois } = await searchParams;
  const months = Math.min(120, Math.max(1, Math.round(Number(mois)) || 12));

  const [m, financeurs, apports, expenses] = await Promise.all([
    loadModel(),
    getFinanceurs(),
    getApports(),
    getExpenses(),
  ]);

  const hold = holdings(financeurs, apports);
  const p = profit(m.current.margin, months);
  const parts = distribute(p.distributable, hold);
  const nameOf = new Map(financeurs.map((f) => [f.id, f.name]));
  const expenseLabel = new Map(expenses.map((e) => [e.id, e.label]));
  const capitalTotal = hold.reduce((s, h) => s + h.capital, 0);

  return (
    <div className="bg-dots-dark min-h-[calc(100vh-130px)] bg-sky/50">
      <div className="mx-auto max-w-6xl px-4 py-10">
        <Link href="/admin" className="text-sm font-semibold text-brand hover:underline">← Espace équipe</Link>
        <AdminNav current="/admin/financement" />
        <div className="mt-5">
          <PageIntro eyebrow="Espace équipe" title="Financement et bénéfice">
            Enregistrez les financeurs et actionnaires, leurs apports rattachés aux postes du plan, et suivez le bénéfice
            estimé et sa répartition. Montants en USD.
          </PageIntro>
        </div>

        {saved === "1" && (
          <p className="mb-4 rounded-xl bg-mint/15 p-3 text-sm font-semibold text-[#0b7a63] ring-1 ring-mint/40">Enregistré.</p>
        )}
        {error && (
          <p className="mb-4 rounded-xl bg-coral/10 p-3 text-sm font-semibold text-[#b3261e] ring-1 ring-coral/40" role="alert">
            {error === "apport" ? "Choisissez un financeur et un montant supérieur à 0." : "Indiquez un nom."}
          </p>
        )}

        {/* Bénéfice et répartition */}
        <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-ink/10">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="text-lg font-extrabold">Bénéfice estimé</h2>
              <p className="mt-1 text-sm text-ink/60">
                Bénéfice mensuel du modèle économique : {fmt(p.monthly)} USD par mois
                {m.isPlanned ? " (effectifs prévus)" : " (inscrits réels)"}.
              </p>
            </div>
            <form className="flex items-end gap-2 text-sm" method="get">
              <label>
                <span className="block text-xs font-semibold text-ink/60">Mois d&apos;exploitation</span>
                <input name="mois" type="number" min="1" max="120" defaultValue={months} className="mt-1 w-28 rounded-xl border border-ink/15 px-3 py-2" />
              </label>
              <button className="rounded-full bg-ink px-4 py-2 font-bold text-white">Calculer</button>
            </form>
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl bg-sky/60 p-4">
              <p className="text-xs font-semibold text-ink/60">Bénéfice cumulé ({p.months} mois)</p>
              <p className={`mt-1 text-2xl font-extrabold ${p.cumulative >= 0 ? "text-[#0b7a63]" : "text-[#b3261e]"}`}>{fmt(p.cumulative)} USD</p>
            </div>
            <div className="rounded-xl bg-sky/60 p-4">
              <p className="text-xs font-semibold text-ink/60">Distribuable aux actionnaires</p>
              <p className="mt-1 text-2xl font-extrabold">{fmt(p.distributable)} USD</p>
              {p.cumulative < 0 && <p className="mt-1 text-xs text-ink/55">Perte : rien n&apos;est distribué.</p>}
            </div>
            <div className="rounded-xl bg-sky/60 p-4">
              <p className="text-xs font-semibold text-ink/60">Capital apporté</p>
              <p className="mt-1 text-2xl font-extrabold">{fmt(capitalTotal)} USD</p>
            </div>
          </div>

          <h3 className="mt-6 text-sm font-extrabold uppercase tracking-wide text-ink/60">Parts et répartition</h3>
          {hold.length === 0 ? (
            <p className="mt-2 text-sm text-ink/60">Aucun apport en capital pour le moment. Les parts apparaîtront après l&apos;enregistrement d&apos;un apport « Capital ».</p>
          ) : (
            <table className="mt-2 w-full text-sm">
              <thead>
                <tr className="border-b border-ink/15 text-left text-xs text-ink/60">
                  <th className="py-2">Actionnaire</th>
                  <th className="py-2 text-right">Capital (USD)</th>
                  <th className="py-2 text-right">Part</th>
                  <th className="py-2 text-right">Part du bénéfice distribuable</th>
                </tr>
              </thead>
              <tbody>
                {parts.map((x) => (
                  <tr key={x.financeurId} className="border-b border-ink/10">
                    <td className="py-2 font-semibold">{x.name}</td>
                    <td className="py-2 text-right tabular-nums">{fmt(hold.find((h) => h.financeurId === x.financeurId)?.capital ?? 0)}</td>
                    <td className="py-2 text-right tabular-nums">{pct(x.share)}</td>
                    <td className="py-2 text-right font-bold tabular-nums">{fmt(x.amount)} USD</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <p className="mt-3 text-xs text-ink/55">
            Les parts ne sont calculées que sur les apports « Capital » en USD. Dons et prêts n&apos;ouvrent pas de droit aux bénéfices.
          </p>
        </section>

        {/* Couverture du plan */}
        <section className="mt-6 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-ink/10">
          <h2 className="text-lg font-extrabold">Couverture du plan</h2>
          <p className="mt-1 text-sm text-ink/60">Chaque poste du budget, avec la part déjà financée par les apports qui lui sont rattachés.</p>
          {expenses.length === 0 ? (
            <p className="mt-3 text-sm text-ink/60">Aucun poste de budget. Ajoutez-les dans l&apos;espace Budget.</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {expenses.map((e) => {
                const planned = e.unitPrice === null ? 0 : e.quantity * e.unitPrice;
                const funded = apports
                  .filter((a) => a.expenseId === e.id && a.currency === e.currency)
                  .reduce((s, a) => s + a.amount, 0);
                const c = coverage(planned, funded);
                return (
                  <li key={e.id} className="rounded-xl ring-1 ring-ink/10 p-3">
                    <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                      <span className="font-semibold">{e.label}</span>
                      <span className="tabular-nums text-ink/70">
                        {e.unitPrice === null ? "prix non renseigné" : `${fmt(planned)} ${e.currency} prévus · ${fmt(funded)} financés · reste ${fmt(c.remaining)}`}
                      </span>
                    </div>
                    {e.unitPrice !== null && (
                      <div className="mt-2 h-2 overflow-hidden rounded-full bg-sky">
                        <div className="h-full rounded-full bg-mint" style={{ width: `${c.pct}%` }} />
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {/* Apports */}
        <section className="mt-6 grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-ink/10">
            <h2 className="text-lg font-extrabold">Enregistrer un apport</h2>
            {financeurs.length === 0 ? (
              <p className="mt-2 text-sm text-ink/60">Ajoutez d&apos;abord un financeur ou un actionnaire.</p>
            ) : (
              <form action={addApportAction} className="mt-4 grid gap-3 sm:grid-cols-2">
                <select name="financeurId" required className={field} aria-label="Financeur">
                  {financeurs.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
                </select>
                <select name="nature" defaultValue="capital" className={field} aria-label="Nature de l'apport">
                  {(Object.keys(NATURE_LABEL) as Nature[]).map((n) => <option key={n} value={n}>{NATURE_LABEL[n]}</option>)}
                </select>
                <input name="amount" type="number" min="0.01" step="0.01" required placeholder="Montant" className={field} aria-label="Montant" />
                <select name="currency" defaultValue="USD" className={field} aria-label="Devise">
                  <option value="USD">USD</option>
                  <option value="CDF">CDF</option>
                </select>
                <input name="date" type="date" className={field} aria-label="Date de l'apport" />
                <select name="expenseId" defaultValue="" className={field} aria-label="Poste du plan">
                  <option value="">Aucun poste (capital général)</option>
                  {expenses.map((e) => <option key={e.id} value={e.id}>{e.label}</option>)}
                </select>
                <input name="note" placeholder="Note (facultatif)" className={`${field} sm:col-span-2`} aria-label="Note" />
                <button className="rounded-full bg-accent px-5 py-2.5 font-bold text-ink shadow-sm sm:col-span-2">Enregistrer l&apos;apport</button>
              </form>
            )}
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-ink/10">
            <h2 className="text-lg font-extrabold">Apports enregistrés</h2>
            {apports.length === 0 ? (
              <p className="mt-2 text-sm text-ink/60">Aucun apport.</p>
            ) : (
              <ul className="mt-3 divide-y divide-ink/10 text-sm">
                {[...apports].reverse().map((a) => (
                  <li key={a.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                    <span>
                      <span className="font-semibold">{nameOf.get(a.financeurId) ?? "—"}</span>{" "}
                      <span className="text-ink/60">· {NATURE_LABEL[a.nature]} · {a.date}</span>
                      {a.expenseId && <span className="block text-xs text-ink/55">Poste : {expenseLabel.get(a.expenseId) ?? "supprimé"}</span>}
                    </span>
                    <span className="flex items-center gap-3">
                      <span className="font-bold tabular-nums">{fmt(a.amount)} {a.currency}</span>
                      <form action={removeApportAction}>
                        <input type="hidden" name="id" value={a.id} />
                        <button className="text-xs font-semibold text-[#b3261e] hover:underline">Supprimer</button>
                      </form>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        {/* Financeurs */}
        <section className="mt-6 grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-ink/10">
            <h2 className="text-lg font-extrabold">Ajouter un financeur ou un actionnaire</h2>
            <form action={addFinanceurAction} className="mt-4 grid gap-3 sm:grid-cols-2">
              <input name="name" required placeholder="Nom" className={`${field} sm:col-span-2`} aria-label="Nom" />
              <select name="type" defaultValue="actionnaire" className={field} aria-label="Type">
                {(Object.keys(TYPE_LABEL) as (keyof typeof TYPE_LABEL)[]).map((t) => <option key={t} value={t}>{TYPE_LABEL[t]}</option>)}
              </select>
              <input name="contact" placeholder="Contact (facultatif)" className={field} aria-label="Contact" />
              <input name="note" placeholder="Note (facultatif)" className={`${field} sm:col-span-2`} aria-label="Note" />
              <button className="rounded-full bg-accent px-5 py-2.5 font-bold text-ink shadow-sm sm:col-span-2">Ajouter</button>
            </form>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-ink/10">
            <h2 className="text-lg font-extrabold">Financeurs et actionnaires</h2>
            {financeurs.length === 0 ? (
              <p className="mt-2 text-sm text-ink/60">Aucun pour le moment.</p>
            ) : (
              <ul className="mt-3 divide-y divide-ink/10 text-sm">
                {financeurs.map((f) => (
                  <li key={f.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                    <span>
                      <span className="font-semibold">{f.name}</span>{" "}
                      <span className="text-ink/60">· {TYPE_LABEL[f.type]}</span>
                      {f.contact && <span className="block text-xs text-ink/55">{f.contact}</span>}
                    </span>
                    <form action={removeFinanceurAction}>
                      <input type="hidden" name="id" value={f.id} />
                      <button className="text-xs font-semibold text-[#b3261e] hover:underline">Supprimer</button>
                    </form>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
