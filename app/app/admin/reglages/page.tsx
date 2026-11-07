import Link from "next/link";
import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/auth";
import { countByLevel, getCapacities, getParityTarget, type Level } from "@/lib/db";
import { saveCapacitiesAction, saveParityAction } from "../actions";
import AdminNav from "../AdminNav";

export const metadata = { title: "Places · Kids Tech-nuru Lab", robots: { index: false } };
export const dynamic = "force-dynamic";

const LEVELS: Level[] = ["Éveil", "Explorateur", "Créateur"];

export default async function ReglagesPage({ searchParams }: { searchParams: Promise<{ saved?: string }> }) {
  if (!(await isAdmin())) redirect("/admin");
  const { saved } = await searchParams;
  const [capacity, counts, parityTarget] = await Promise.all([getCapacities(), countByLevel(), getParityTarget()]);

  return (
    <div className="bg-dots-dark min-h-[calc(100vh-130px)] bg-sky/50">
      <div className="mx-auto max-w-3xl px-4 py-10">
        <Link href="/admin" className="text-sm font-semibold text-brand hover:underline">
          ← Espace équipe
        </Link>
        <AdminNav current="/admin/reglages" />
        <h1 className="mt-5 text-3xl font-extrabold tracking-tight">Places par niveau</h1>
        <p className="mt-2 text-sm text-ink/65">
          Quand un niveau est complet, le formulaire d&apos;inscription refuse les nouvelles inscriptions pour ce niveau.
          Le pilote prévoit 8 à 10 enfants au total, groupes de 8 au maximum.
        </p>

        {saved === "1" && (
          <p className="mt-4 rounded-xl bg-mint/15 p-3 text-sm font-semibold text-[#0b7a63] ring-1 ring-mint/40">
            Capacités enregistrées.
          </p>
        )}

        <form action={saveParityAction} className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-ink/10">
          <label className="flex items-center gap-3 text-sm">
            <span>
              <span className="block font-bold">Objectif de filles</span>
              <span className="text-xs text-ink/55">en pourcentage des inscrits</span>
            </span>
          </label>
          <span className="flex items-center gap-2 text-sm">
            <input
              name="parityTarget"
              type="number"
              min="0"
              max="100"
              required
              defaultValue={parityTarget}
              aria-label="Objectif de filles en pourcentage"
              className="w-24 rounded-xl border border-ink/15 px-3 py-2 text-sm outline-none focus:border-brand focus:ring-4 focus:ring-brand/15"
            />
            %
            <button className="rounded-full bg-accent px-5 py-2 font-bold text-ink shadow-sm">Enregistrer</button>
          </span>
        </form>

        <form action={saveCapacitiesAction} className="mt-6 space-y-3 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-ink/10">
          {LEVELS.map((l) => (
            <label key={l} className="flex flex-wrap items-center justify-between gap-3 border-b border-ink/10 pb-3 last:border-0 last:pb-0">
              <span>
                <span className="block font-bold">{l}</span>
                <span className="text-xs text-ink/55">{counts[l]} inscrit(s)</span>
              </span>
              <span className="flex items-center gap-2 text-sm">
                Places
                <input
                  name={`capacity:${l}`}
                  type="number"
                  min="1"
                  max="100"
                  required
                  defaultValue={capacity[l]}
                  className="w-24 rounded-xl border border-ink/15 px-3 py-2 text-sm outline-none focus:border-brand focus:ring-4 focus:ring-brand/15"
                />
              </span>
            </label>
          ))}
          <div className="flex justify-end pt-2">
            <button className="rounded-full bg-accent px-6 py-2.5 font-bold text-ink shadow-sm">Enregistrer</button>
          </div>
        </form>
      </div>
    </div>
  );
}
