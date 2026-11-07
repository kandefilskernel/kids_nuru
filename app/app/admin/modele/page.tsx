import Link from "next/link";
import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/auth";
import { LINE_SLOTS } from "@/lib/business";
import { saveModelAction } from "../actions";
import AdminNav from "../AdminNav";
import AskModel from "./AskModel";
import { loadModel } from "./data";

export const metadata = { title: "Modèle économique · Kids Tech-nuru Lab", robots: { index: false } };
export const dynamic = "force-dynamic";

const fmt = (n: number) => Math.round(n).toLocaleString("fr-FR");

export default async function ModelePage({ searchParams }: { searchParams: Promise<{ saved?: string }> }) {
  if (!(await isAdmin())) redirect("/admin");
  const { saved } = await searchParams;
  const m = await loadModel();
  const a = m.model.assumptions;
  const { current, children, solidaires } = m;

  return (
    <div className="bg-dots-dark min-h-[calc(100vh-130px)] bg-sky/50">
      <div className="mx-auto max-w-6xl px-4 py-10">
        <Link href="/admin" className="text-sm font-semibold text-brand hover:underline">
          ← Espace équipe
        </Link>
        <AdminNav current="/admin/modele" />

        <div className="mt-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">Modèle économique</h1>
            <p className="text-sm text-ink/60">Montants en USD par mois. Les résultats se recalculent à l&apos;enregistrement.</p>
          </div>
          <Link
            href="/admin/modele/imprimer"
            target="_blank"
            className="rounded-full bg-ink px-5 py-2.5 text-sm font-bold text-white shadow-sm"
          >
            Ouvrir la fiche imprimable
          </Link>
        </div>

        {saved === "1" && (
          <p className="mt-4 rounded-xl bg-mint/15 p-3 text-sm font-semibold text-[#0b7a63] ring-1 ring-mint/40">
            Modèle enregistré.
          </p>
        )}

        {/* Résultats */}
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card
            label="Enfants retenus pour le calcul"
            value={String(children)}
            hint={`${m.isPlanned ? "hypothèse" : "inscrits réels"} · ${solidaires} solidaire(s) · ${m.actualChildren} inscrit(s) actuellement`}
          />
          <Card label="Recettes par mois" value={`${fmt(current.revenue)} USD`} hint="frais, soutiens et lignes libres" />
          <Card label="Coûts par mois" value={`${fmt(current.cost)} USD`} hint={`${current.groups} groupe(s) d'animateurs`} />
          <Card
            label="Marge par mois"
            value={`${fmt(current.margin)} USD`}
            hint={m.threshold === null ? "seuil non atteint" : `équilibre à partir de ${m.threshold} enfants`}
            tone={current.margin >= 0 ? "good" : "bad"}
          />
        </div>

        {/* Hypothèses */}
        <form action={saveModelAction} className="mt-8 space-y-6">
          <Section title="1. Hypothèses" hint="Les valeurs qui servent de base à tous les calculs.">
            <div className="mb-5 grid gap-3 rounded-xl bg-sky/40 p-4 sm:grid-cols-2">
              <Input
                name="prevEveil"
                label="Éveil (5-7 ans) prévus"
                value={a.prevusParNiveau.eveil}
                optional
                placeholder={`Vide : ${m.actualByLevel["Éveil"]} inscrit(s)`}
              />
              <Input
                name="prevExplorateur"
                label="Explorateur (8-10 ans) prévus"
                value={a.prevusParNiveau.explorateur}
                optional
                placeholder={`Vide : ${m.actualByLevel["Explorateur"]} inscrit(s)`}
              />
              <Input
                name="prevCreateur"
                label="Créateur (11-12 ans) prévus"
                value={a.prevusParNiveau.createur}
                optional
                placeholder={`Vide : ${m.actualByLevel["Créateur"]} inscrit(s)`}
              />
              <p className="text-sm sm:col-span-2">
                <span className="font-semibold">Total retenu : {children} enfant(s)</span>
                <span className="text-ink/60"> · {m.isPlanned ? "somme des niveaux prévus" : "inscrits réels, aucun niveau prévu"}</span>
              </p>
              <Input
                name="solidairesPrevues"
                label="Dont places solidaires prévues"
                value={a.solidairesPrevues}
                optional
                placeholder={`Vide : ${m.actualSolidaires} réel(le)(s)`}
              />
              <p className="text-xs text-ink/60 sm:col-span-2">
                Le calcul des recettes, des coûts et du seuil utilise ces effectifs. Laissez un champ vide pour utiliser les inscriptions réelles de ce niveau.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <Input name="fee" label="Frais mensuel par enfant (USD)" value={a.fee} />
              <Input name="reductionPct" label="Réduction places solidaires (%)" value={a.reductionPct} />
              <Input name="samedisParMois" label="Samedis par mois" value={a.samedisParMois} />
              <Input name="heuresSeance" label="Durée d'une séance (h)" value={a.heuresSeance} />
              <Input name="tauxAnimateur" label="Taux horaire animateur (USD)" value={a.tauxAnimateur} />
              <Input name="enfantsParAnimateur" label="Enfants par animateur" value={a.enfantsParAnimateur} />
              <Input name="salleMois" label="Salle par mois (USD)" value={a.salleMois} />
              <Input name="assuranceMois" label="Assurance par mois (USD)" value={a.assuranceMois} />
              <Input name="adminMois" label="Communication et frais par mois (USD)" value={a.adminMois} />
              <Input name="sponsorsMois" label="Soutien des partenaires par mois (USD)" value={a.sponsorsMois} />
              <Input name="amortissementMois" label="Amortissement du matériel (mois)" value={a.amortissementMois} />
            </div>
          </Section>

          <Section title="2. Recettes supplémentaires" hint={`Jusqu'à ${LINE_SLOTS} lignes par mois (inscriptions, ventes, subventions…). Modifiez libellé ou montant, cochez « Supprimer » pour retirer une ligne, puis enregistrez.`}>
            <Lines prefix="rev" lines={m.model.revenues} />
          </Section>

          <Section title="3. Coûts supplémentaires" hint={`Jusqu'à ${LINE_SLOTS} lignes par mois (transport, goûters, entretien…). Modifiez libellé ou montant, cochez « Supprimer » pour retirer une ligne, puis enregistrez.`}>
            <Lines prefix="cost" lines={m.model.costs} />
          </Section>

          <Section title="4. Explications" hint="Ces textes apparaissent sur la fiche imprimable pour les partenaires.">
            <div className="grid gap-4">
              <Text name="note_intro" label="Présentation du centre" value={m.model.notes.intro} />
              <Text name="note_revenues" label="D'où viennent les recettes" value={m.model.notes.revenues} />
              <Text name="note_costs" label="Où va l'argent" value={m.model.notes.costs} />
              <Text name="note_threshold" label="Seuil de rentabilité" value={m.model.notes.threshold} />
              <Text name="note_conclusion" label="Conclusion" value={m.model.notes.conclusion} />
            </div>
          </Section>

          <div className="sticky bottom-4 flex justify-end">
            <button className="rounded-full bg-accent px-8 py-3 font-bold text-ink shadow-lg transition hover:-translate-y-0.5">
              Enregistrer le modèle
            </button>
          </div>
        </form>

        {/* Détail des coûts et scénarios */}
        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-ink/10">
            <h2 className="text-lg font-extrabold">Détail des coûts (avec {children} enfant(s))</h2>
            <table className="mt-3 w-full text-sm">
              <tbody>
                <Row label="Animateurs" value={current.costAnimateurs} />
                <Row label="Salle" value={current.costSalle} />
                <Row label="Assurance" value={current.costAssurance} />
                <Row label="Communication et frais" value={current.costAdmin} />
                <Row label="Matériel (amorti)" value={current.costMateriel} />
                <Row label="Coûts supplémentaires" value={current.costOther} />
                <tr className="border-t border-ink/15 font-extrabold">
                  <td className="py-2">Total des coûts</td>
                  <td className="py-2 text-right">{fmt(current.cost)} USD</td>
                </tr>
              </tbody>
            </table>
          </section>

          <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-ink/10">
            <h2 className="text-lg font-extrabold">Scénarios</h2>
            <table className="mt-3 w-full text-sm">
              <thead>
                <tr className="border-b border-ink/15 text-left text-xs uppercase text-ink/55">
                  <th className="py-2">Enfants</th>
                  <th className="py-2 text-right">Recettes</th>
                  <th className="py-2 text-right">Coûts</th>
                  <th className="py-2 text-right">Marge</th>
                </tr>
              </thead>
              <tbody>
                {m.scenarios.map(({ n, r }) => (
                  <tr key={n} className="border-b border-ink/10">
                    <td className="py-2 font-semibold">{n}</td>
                    <td className="py-2 text-right">{fmt(r.revenue)}</td>
                    <td className="py-2 text-right">{fmt(r.cost)}</td>
                    <td className={`py-2 text-right font-bold ${r.margin >= 0 ? "text-[#0b7a63]" : "text-[#b3261e]"}`}>{fmt(r.margin)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </div>

        <AskModel />
      </div>
    </div>
  );
}

function Section({ title, hint, children }: { title: string; hint: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-ink/10">
      <h2 className="text-lg font-extrabold">{title}</h2>
      <p className="mt-1 text-xs text-ink/60">{hint}</p>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function Input({
  name,
  label,
  value,
  optional,
  placeholder,
}: {
  name: string;
  label: string;
  value: number | null;
  optional?: boolean;
  placeholder?: string;
}) {
  return (
    <label className="block text-sm">
      <span className="font-semibold">{label}</span>
      <input
        name={name}
        type="number"
        min="0"
        step={optional ? "1" : "any"}
        required={!optional}
        placeholder={placeholder}
        defaultValue={value ?? ""}
        className="mt-1.5 w-full rounded-xl border border-ink/15 px-3 py-2 text-sm outline-none focus:border-brand focus:ring-4 focus:ring-brand/15"
      />
    </label>
  );
}

function Lines({ prefix, lines }: { prefix: "rev" | "cost"; lines: { label: string; amount: number }[] }) {
  return (
    <div className="grid gap-2">
      {Array.from({ length: LINE_SLOTS }, (_, i) => (
        <div key={i} className="grid items-center gap-2 sm:grid-cols-[2fr_1fr_auto]">
          <input
            name={`${prefix}Label${i}`}
            defaultValue={lines[i]?.label ?? ""}
            placeholder="Libellé"
            aria-label={`Libellé ligne ${i + 1}`}
            className="rounded-xl border border-ink/15 px-3 py-2 text-sm outline-none focus:border-brand focus:ring-4 focus:ring-brand/15"
          />
          <input
            name={`${prefix}Amount${i}`}
            type="number"
            min="0"
            step="any"
            defaultValue={lines[i]?.amount ?? ""}
            placeholder="Montant (USD / mois)"
            aria-label={`Montant ligne ${i + 1}`}
            className="rounded-xl border border-ink/15 px-3 py-2 text-sm outline-none focus:border-brand focus:ring-4 focus:ring-brand/15"
          />
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

function Text({ name, label, value }: { name: string; label: string; value: string }) {
  return (
    <label className="block text-sm">
      <span className="font-semibold">{label}</span>
      <textarea
        name={name}
        defaultValue={value}
        rows={3}
        maxLength={1200}
        className="mt-1.5 w-full rounded-xl border border-ink/15 px-3 py-2 text-sm outline-none focus:border-brand focus:ring-4 focus:ring-brand/15"
      />
    </label>
  );
}

function Card({ label, value, hint, tone }: { label: string; value: string; hint: string; tone?: "good" | "bad" }) {
  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-ink/10">
      <p className="text-sm font-semibold">{label}</p>
      <p className={`mt-1 text-2xl font-extrabold ${tone === "bad" ? "text-[#b3261e]" : tone === "good" ? "text-[#0b7a63]" : ""}`}>{value}</p>
      <p className="mt-1 text-xs text-ink/55">{hint}</p>
    </div>
  );
}

function Row({ label, value }: { label: string; value: number }) {
  return (
    <tr className="border-b border-ink/10">
      <td className="py-2 text-ink/70">{label}</td>
      <td className="py-2 text-right font-semibold">{fmt(value)} USD</td>
    </tr>
  );
}
