import PageIntro from "@/components/PageIntro";
import Link from "next/link";
import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/auth";
import { countExpenses, getCollectedTotals, getExpenses } from "@/lib/db";
import { addExpenseAction, deleteExpenseAction, importBudgetAction, updateExpenseAction } from "../actions";
import AdminNav from "../AdminNav";

export const metadata = { title: "Budget · Kids Tech-nuru Lab", robots: { index: false } };
export const dynamic = "force-dynamic";

const STATUSES = ["À demander", "Devis reçu", "Commandé", "Payé", "Reçu", "À décider", "À définir"];

const fmt = (n: number) => n.toLocaleString("fr-FR", { maximumFractionDigits: 2 });

export default async function BudgetPage({
  searchParams,
}: {
  searchParams: Promise<{ import?: string; n?: string }>;
}) {
  if (!(await isAdmin())) redirect("/admin");
  const { import: imp, n } = await searchParams;

  const [expenses, total, collected] = await Promise.all([getExpenses(), countExpenses(), getCollectedTotals()]);

  // Dépenses prévues par devise (lignes dont le prix est renseigné)
  const planned: Record<string, number> = {};
  for (const e of expenses) {
    if (e.unitPrice !== null) planned[e.currency] = (planned[e.currency] ?? 0) + e.quantity * e.unitPrice;
  }
  // Encaissé : paiements non annulés (calculé en base)
  const currencies = [...new Set([...Object.keys(planned), ...Object.keys(collected)])];
  const unpriced = expenses.filter((e) => e.unitPrice === null).length;

  return (
    <div className="bg-dots-dark min-h-[calc(100vh-130px)] bg-sky/50">
      <div className="mx-auto max-w-6xl px-4 py-10">
        <Link href="/admin" className="text-sm font-semibold text-brand hover:underline">
          ← Espace équipe
        </Link>
        <AdminNav current="/admin/budget" />
        <div className="mt-5">
          <PageIntro eyebrow="Espace équipe" title="Budget du pilote" />
        </div>

        {imp === "ok" && (
          <p className="mt-4 rounded-xl bg-mint/15 p-3 text-sm font-semibold text-[#0b7a63] ring-1 ring-mint/40">
            {n} lignes importées. Renseignez les prix au fur et à mesure des devis.
          </p>
        )}
        {imp === "exists" && (
          <p className="mt-4 rounded-xl bg-accent/20 p-3 text-sm font-semibold ring-1 ring-accent/50">
            Le budget contient déjà des lignes : l&apos;import n&apos;est fait qu&apos;une seule fois.
          </p>
        )}
        {imp === "invalid" && (
          <p className="mt-4 rounded-xl bg-coral/10 p-3 text-sm font-semibold text-[#b3261e] ring-1 ring-coral/40">
            Fichier invalide (CSV, 200 Ko maximum).
          </p>
        )}

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-ink/10">
            <p className="text-sm font-semibold">Dépenses prévues</p>
            <p className="mt-1 text-2xl font-extrabold">
              {currencies.length ? Object.entries(planned).map(([c, v]) => `${fmt(v)} ${c}`).join(" + ") : "—"}
            </p>
            <p className="mt-1 text-xs text-ink/55">{unpriced} ligne(s) sans prix</p>
          </div>
          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-ink/10">
            <p className="text-sm font-semibold">Encaissé (frais)</p>
            <p className="mt-1 text-2xl font-extrabold">
              {Object.keys(collected).length ? Object.entries(collected).map(([c, v]) => `${fmt(v)} ${c}`).join(" + ") : "—"}
            </p>
          </div>
          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-ink/10">
            <p className="text-sm font-semibold">Solde (encaissé − prévu)</p>
            <p className="mt-1 text-2xl font-extrabold">
              {currencies.length
                ? currencies.map((c) => `${fmt((collected[c] ?? 0) - (planned[c] ?? 0))} ${c}`).join(" + ")
                : "—"}
            </p>
          </div>
        </div>

        {total === 0 ? (
          <form action={importBudgetAction} className="mt-6 flex flex-wrap items-center gap-3 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-ink/10">
            <div className="flex-1">
              <p className="font-semibold">Importer le budget de départ</p>
              <p className="text-sm text-ink/60">Fichier <code>04-budget-et-suivi-des-paiements.csv</code> (séparateur ;)</p>
            </div>
            <input type="file" name="file" accept=".csv,text/csv" required className="text-sm" />
            <button className="rounded-full bg-brand px-5 py-2.5 font-bold text-white shadow-md">Importer</button>
          </form>
        ) : (
          <div className="mt-6 space-y-3">
            <div className="hidden grid-cols-[2fr_0.7fr_1fr_0.8fr_1.2fr_1fr_auto] gap-2 px-4 text-xs font-bold uppercase tracking-wide text-ink/55 md:grid">
              <span>Poste</span>
              <span>Qté</span>
              <span>Prix unitaire</span>
              <span>Devise</span>
              <span>Fournisseur / devis</span>
              <span>Statut</span>
              <span />
            </div>
            {expenses.map((e) => (
              <div key={e.id} className="flex flex-col gap-2 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-ink/10 md:flex-row md:items-center">
                <form id={`exp-${e.id}`} action={updateExpenseAction} className="grid flex-1 gap-2 md:grid-cols-[2fr_0.7fr_1fr_0.8fr_1.2fr_1fr]">
                  <input type="hidden" name="id" value={e.id} />
                  <p className="self-center font-semibold">{e.label}</p>
                  <input name="quantity" type="number" min="0" step="any" defaultValue={e.quantity} aria-label="Quantité" className={inputCls} />
                  <input name="unitPrice" type="number" min="0" step="any" defaultValue={e.unitPrice ?? ""} placeholder="Prix" aria-label="Prix unitaire" className={inputCls} />
                  <select name="currency" defaultValue={e.currency} aria-label="Devise" className={inputCls}>
                    <option>USD</option>
                    <option>CDF</option>
                  </select>
                  <input name="supplier" defaultValue={e.supplier} placeholder="Fournisseur" aria-label="Fournisseur" className={inputCls} />
                  <select name="status" defaultValue={e.status} aria-label="Statut" className={inputCls}>
                    {[...new Set([...STATUSES, e.status])].map((s) => (
                      <option key={s}>{s}</option>
                    ))}
                  </select>
                </form>
                <div className="flex items-center gap-2">
                  <button form={`exp-${e.id}`} className="rounded-full bg-ink px-3 py-1.5 text-xs font-bold text-white">
                    Enregistrer
                  </button>
                  <form action={deleteExpenseAction}>
                    <input type="hidden" name="id" value={e.id} />
                    <button className="rounded-full px-3 py-1.5 text-xs font-bold text-[#b3261e] hover:bg-coral/10">Supprimer</button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        )}

        <form action={addExpenseAction} className="mt-6 grid gap-2 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-ink/10 md:grid-cols-[2fr_0.7fr_1fr_0.8fr_1.2fr_1fr_auto]">
          <input name="label" required placeholder="Nouvelle dépense" aria-label="Poste" className={inputCls} />
          <input name="quantity" type="number" min="0" step="any" defaultValue={1} aria-label="Quantité" className={inputCls} />
          <input name="unitPrice" type="number" min="0" step="any" placeholder="Prix" aria-label="Prix unitaire" className={inputCls} />
          <select name="currency" aria-label="Devise" className={inputCls}>
            <option>USD</option>
            <option>CDF</option>
          </select>
          <input name="supplier" placeholder="Fournisseur" aria-label="Fournisseur" className={inputCls} />
          <select name="status" aria-label="Statut" className={inputCls}>
            {STATUSES.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
          <button className="rounded-full bg-accent px-4 py-2 font-bold text-ink shadow-sm">Ajouter</button>
        </form>
      </div>
    </div>
  );
}

const inputCls =
  "w-full rounded-lg border border-ink/15 bg-white px-2.5 py-1.5 text-sm outline-none focus:border-brand focus:ring-4 focus:ring-brand/15";
