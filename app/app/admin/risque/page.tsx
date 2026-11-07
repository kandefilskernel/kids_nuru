import { redirect } from "next/navigation";
import PageIntro from "@/components/PageIntro";
import { isAdmin } from "@/lib/auth";
import { getAllChildHistory, getAllPayments, getRegistrations, getSetting } from "@/lib/db";
import { BASELINE, buildRows, contributions, FEATURE_NAMES, parseStoredModel, probability } from "@/lib/risk";
import { monthLabel } from "@/lib/whatsapp";
import AdminNav from "../AdminNav";
import { trainRiskModelAction } from "./actions";

export const metadata = { title: "Risque de retard · Kids Tech-nuru Lab", robots: { index: false } };
export const dynamic = "force-dynamic";

const pct = (x: number | null) => (x === null ? "—" : `${Math.round(x * 100)} %`);

export default async function RisquePage({ searchParams }: { searchParams: Promise<{ trained?: string }> }) {
  if (!(await isAdmin())) redirect("/admin");
  const { trained } = await searchParams;

  const [regs, pays, hist, rawModel, status] = await Promise.all([
    getRegistrations(),
    getAllPayments(),
    getAllChildHistory(),
    getSetting("risk_model"),
    getSetting("risk_status"),
  ]);
  const model = parseStoredModel(rawModel);
  const usingLearned = model !== BASELINE && model.trainedOn > 0;
  const month = new Date().toISOString().slice(0, 7);

  const { current } = buildRows(
    regs.map((r) => ({ id: r.id, createdAt: r.createdAt, solidarity: r.solidarity })),
    pays.map((p) => ({ registrationId: p.registrationId, month: p.month, cancelled: p.cancelledAt !== null })),
    Object.entries(hist).flatMap(([registrationId, rows]) => rows.map((h) => ({ registrationId, date: h.date, present: h.present }))),
    month,
  );
  const byId = new Map(regs.map((r) => [r.id, r]));
  const paidNow = new Set(pays.filter((p) => p.month === month && p.cancelledAt === null).map((p) => p.registrationId));

  const rows = current
    .filter((c) => !paidNow.has(c.registrationId))
    .map((c) => {
      const p = probability(model, c.x);
      return { id: c.registrationId, name: byId.get(c.registrationId)?.childName ?? "—", p, factors: contributions(model, c.x) };
    })
    .sort((a, b) => a.p - b.p);

  return (
    <div className="bg-dots-dark min-h-[calc(100vh-130px)] bg-sky/50">
      <div className="mx-auto max-w-5xl px-4 py-10">
        <a href="/admin" className="text-sm font-semibold text-brand hover:underline">← Espace équipe</a>
        <AdminNav current="/admin/risque" />
        <div className="mt-5">
          <PageIntro eyebrow="Espace équipe" title="Risque de retard de paiement">
            Pour chaque enfant qui n&apos;a pas encore réglé {monthLabel(month)}, une estimation de la probabilité de paiement.
            Sert à décider qui relancer en premier. N&apos;exclut jamais un enfant.
          </PageIntro>
        </div>

        {trained === "1" && (
          <p className="mb-4 rounded-xl bg-mint/15 p-3 text-sm font-semibold text-[#0b7a63] ring-1 ring-mint/40">Entraînement terminé.</p>
        )}

        {/* État du modèle */}
        <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-ink/10">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-extrabold">Modèle utilisé</h2>
              <p className="mt-1 text-sm">
                {usingLearned ? (
                  <>Régression logistique entraînée sur {model.trainedOn} mois-enfants. Précision de test : <b>{pct(model.accuracy)}</b>, référence : {pct(model.baselineAccuracy)}.</>
                ) : (
                  <>Score de règles de départ : le modèle appris n&apos;est pas encore retenu.</>
                )}
              </p>
              {status && <p className="mt-2 text-xs text-ink/60">{status}</p>}
            </div>
            <form action={trainRiskModelAction}>
              <button className="rounded-full bg-ink px-5 py-2.5 text-sm font-bold text-white shadow-sm">Entraîner le modèle</button>
            </form>
          </div>
          <p className="mt-4 text-xs text-ink/55">
            Le modèle ne se remplace que s&apos;il fait nettement mieux que la référence sur des mois qu&apos;il n&apos;a pas vus.
            Il faut au moins 60 mois-enfants d&apos;historique.
          </p>
        </section>

        {/* Liste */}
        <section className="mt-6 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-ink/10">
          <h2 className="text-lg font-extrabold">À relancer pour {monthLabel(month)}</h2>
          {rows.length === 0 ? (
            <p className="mt-2 text-sm text-ink/60">Tous les enfants ont réglé ce mois-ci, ou aucun inscrit.</p>
          ) : (
            <ul className="mt-4 divide-y divide-ink/10">
              {rows.map((r) => {
                const level = r.p < 0.4 ? "Risque élevé" : r.p < 0.6 ? "Risque moyen" : "Risque faible";
                const tone = r.p < 0.4 ? "bg-coral/15 text-[#b3261e]" : r.p < 0.6 ? "bg-accent/30 text-[#8a5a00]" : "bg-mint/20 text-[#0b7a63]";
                const top = [...r.factors].sort((a, b) => Math.abs(b.effect) - Math.abs(a.effect)).slice(0, 2);
                return (
                  <li key={r.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                    <div>
                      <p className="font-bold">{r.name}</p>
                      <p className="text-xs text-ink/60">
                        {top.map((f) => `${f.name.toLowerCase()} (${f.value.toFixed(2)})`).join(" · ")}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm tabular-nums text-ink/70">paie : {pct(r.p)}</span>
                      <span className={`rounded-full px-3 py-1 text-xs font-bold ${tone}`}>{level}</span>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
          <p className="mt-4 text-xs text-ink/55">
            Variables utilisées : {FEATURE_NAMES.join(", ").toLowerCase()}.
          </p>
        </section>
      </div>
    </div>
  );
}
