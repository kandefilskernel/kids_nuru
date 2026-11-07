import PageIntro from "@/components/PageIntro";
import Link from "next/link";
import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/auth";
import { countByLevel, getCapacities, getParityTarget, type Level } from "@/lib/db";
import { saveCapacitiesAction, saveParityAction, saveScheduleAction } from "../actions";
import { MAX_BLOCKS, parseSchedule, timetable, totalMinutes } from "@/lib/schedule";
import { getSetting } from "@/lib/db";
import AdminNav from "../AdminNav";

export const metadata = { title: "Places · Kids Tech-nuru Lab", robots: { index: false } };
export const dynamic = "force-dynamic";

const LEVELS: Level[] = ["Éveil", "Explorateur", "Créateur"];

export default async function ReglagesPage({ searchParams }: { searchParams: Promise<{ saved?: string; schedule?: string }> }) {
  if (!(await isAdmin())) redirect("/admin");
  const { saved, schedule: schedSaved } = await searchParams;
  const [capacity, counts, parityTarget, schedule] = await Promise.all([
    getCapacities(),
    countByLevel(),
    getParityTarget(),
    getSetting("session_schedule").then((raw) => parseSchedule(raw)),
  ]);
  const rows = timetable(schedule);
  const blocksForm = Array.from({ length: MAX_BLOCKS }, (_, i) => schedule.blocks[i] ?? null);

  return (
    <div className="bg-dots-dark min-h-[calc(100vh-130px)] bg-sky/50">
      <div className="mx-auto max-w-3xl px-4 py-10">
        <Link href="/admin" className="text-sm font-semibold text-brand hover:underline">
          ← Espace équipe
        </Link>
        <AdminNav current="/admin/reglages" />
        <div className="mt-5">
          <PageIntro eyebrow="Espace équipe" title="Places par niveau" />
        </div>
        <p className="mt-2 text-sm text-ink/65">
          Quand un niveau est complet, le formulaire d&apos;inscription refuse les nouvelles inscriptions pour ce niveau.
          Le pilote prévoit 8 à 10 enfants au total, groupes de 8 au maximum.
        </p>

        {saved === "1" && (
          <p className="mt-4 rounded-xl bg-mint/15 p-3 text-sm font-semibold text-[#0b7a63] ring-1 ring-mint/40">
            Capacités enregistrées.
          </p>
        )}
        {schedSaved === "1" && (
          <p className="mt-4 rounded-xl bg-mint/15 p-3 text-sm font-semibold text-[#0b7a63] ring-1 ring-mint/40">
            Horaires enregistrés. Le programme, l&apos;accueil et le sondage les affichent désormais.
          </p>
        )}

        <form action={saveScheduleAction} className="mt-6 space-y-5 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-ink/10">
          <div>
            <h2 className="text-lg font-extrabold">Horaires de la séance</h2>
            <p className="mt-1 text-xs text-ink/60">
              Durée totale : {totalMinutes(schedule)} min. Renseignez l&apos;heure de début pour afficher les heures de chaque bloc.
            </p>
          </div>

          <label className="block text-sm">
            <span className="font-semibold">Heure de début</span>
            <input
              name="start"
              type="time"
              defaultValue={schedule.start ?? ""}
              className="mt-1.5 w-40 rounded-xl border border-ink/15 px-3 py-2 text-sm outline-none focus:border-brand focus:ring-4 focus:ring-brand/15"
            />
            <span className="mt-1 block text-xs text-ink/55">Laissez vide si l&apos;heure n&apos;est pas encore fixée.</span>
          </label>

          <div className="space-y-2">
            <p className="text-sm font-semibold">Blocs de la séance</p>
            {blocksForm.map((b, i) => (
              <div key={i} className="grid gap-2 sm:grid-cols-[2fr_1fr]">
                <input
                  name={`blockLabel${i}`}
                  defaultValue={b?.label ?? ""}
                  placeholder="Nom du bloc"
                  aria-label={`Nom du bloc ${i + 1}`}
                  className="rounded-xl border border-ink/15 px-3 py-2 text-sm outline-none focus:border-brand focus:ring-4 focus:ring-brand/15"
                />
                <input
                  name={`blockMin${i}`}
                  type="number"
                  min="1"
                  max="240"
                  defaultValue={b?.minutes ?? ""}
                  placeholder="Minutes"
                  aria-label={`Durée du bloc ${i + 1} en minutes`}
                  className="rounded-xl border border-ink/15 px-3 py-2 text-sm outline-none focus:border-brand focus:ring-4 focus:ring-brand/15"
                />
              </div>
            ))}
            <p className="text-xs text-ink/55">Vider un nom supprime le bloc. Jusqu&apos;à {MAX_BLOCKS} blocs.</p>
          </div>

          <label className="block text-sm">
            <span className="font-semibold">Créneaux proposés aux familles et aux écoles</span>
            <textarea
              name="slots"
              rows={5}
              defaultValue={schedule.slots.join("\n")}
              className="mt-1.5 w-full rounded-xl border border-ink/15 px-3 py-2 text-sm outline-none focus:border-brand focus:ring-4 focus:ring-brand/15"
            />
            <span className="mt-1 block text-xs text-ink/55">Un créneau par ligne.</span>
          </label>

          {rows.length > 0 && (
            <ol className="rounded-xl bg-sky/50 p-4 text-sm">
              {rows.map((r) => (
                <li key={r.label} className="flex justify-between gap-3 py-0.5">
                  <span>{r.label}</span>
                  <span className="tabular-nums text-ink/70">
                    {r.from && r.to ? `${r.from} – ${r.to}` : `${r.minutes} min`}
                  </span>
                </li>
              ))}
            </ol>
          )}

          <div className="flex justify-end">
            <button className="rounded-full bg-accent px-6 py-2.5 font-bold text-ink shadow-sm">Enregistrer les horaires</button>
          </div>
        </form>

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
