import Link from "next/link";
import { redirect } from "next/navigation";
import PageIntro from "@/components/PageIntro";
import { isAdmin } from "@/lib/auth";
import {
  formatLongDate,
  MAX_SESSIONS,
  nextSession,
  parsePilotDates,
  sessionReminderMessage,
  sessionTheme,
  todayLubumbashi,
  ucfirst,
} from "@/lib/calendar";
import { getRegistrations, getSetting } from "@/lib/db";
import { parseSchedule } from "@/lib/schedule";
import { whatsappUrl } from "@/lib/whatsapp";
import AdminNav from "../AdminNav";
import { generateDatesAction, saveDatesAction } from "./actions";

export const metadata = { title: "Calendrier · Kids Tech-nuru Lab", robots: { index: false } };
export const dynamic = "force-dynamic";

const input =
  "rounded-xl border border-ink/15 bg-white px-3 py-2 text-sm shadow-sm outline-none focus:border-brand focus:ring-4 focus:ring-brand/15";

export default async function CalendrierPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string; saved?: string; error?: string }>;
}) {
  if (!(await isAdmin())) redirect("/admin");
  const sp = await searchParams;

  const [rawDates, rawSchedule, registrations] = await Promise.all([
    getSetting("pilot_dates"),
    getSetting("session_schedule"),
    getRegistrations(),
  ]);
  const dates = parsePilotDates(rawDates);
  const start = parseSchedule(rawSchedule).start;
  const today = todayLubumbashi();
  const next = nextSession(dates, today);

  // Séance pour laquelle on prépare les rappels : celle choisie, sinon la prochaine.
  const chosen = sp.date && dates.includes(sp.date) ? sp.date : next?.date ?? null;
  const n = chosen ? dates.indexOf(chosen) + 1 : 0;

  return (
    <div className="bg-dots-dark min-h-[calc(100vh-130px)] bg-sky/50">
      <div className="mx-auto max-w-4xl px-4 py-10">
        <Link href="/admin" className="text-sm font-semibold text-brand hover:underline">
          ← Espace équipe
        </Link>
        <AdminNav current="/admin/calendrier" />

        <div className="mt-5">
          <PageIntro eyebrow="Espace équipe" title="Calendrier du pilote">
            Les dates des séances s&apos;affichent sur la page Programme et dans l&apos;espace parent. La veille de chaque
            séance, envoyez un rappel WhatsApp aux parents en un clic.
          </PageIntro>
        </div>
        {sp.saved === "1" && (
          <p className="mt-6 rounded-2xl bg-mint/15 p-4 text-sm font-semibold ring-1 ring-mint/40" role="status">
            Calendrier enregistré.
          </p>
        )}
        {sp.error === "start" && (
          <p className="mt-6 rounded-2xl bg-coral/10 p-4 text-sm font-semibold text-[#b3261e] ring-1 ring-coral/40" role="alert">
            Choisissez la date de la première séance.
          </p>
        )}

        {/* Dates */}
        <section className="mt-6 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-ink/10">
          <h2 className="text-lg font-extrabold">Dates des séances</h2>
          {dates.length === 0 ? (
            <p className="mt-2 text-sm text-ink/60">Aucune date pour le moment. Remplissez le calendrier ci-dessous.</p>
          ) : (
            <ol className="mt-3 flex flex-wrap gap-2 text-sm">
              {dates.map((d, i) => (
                <li key={d}>
                  <Link
                    href={`/admin/calendrier?date=${d}`}
                    className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 font-semibold ring-1 ${
                      d === chosen
                        ? "bg-brand text-white ring-brand"
                        : d < today
                          ? "bg-ink/5 text-ink/50 ring-ink/10"
                          : "bg-white ring-ink/15 hover:bg-sky"
                    }`}
                  >
                    <span className="text-xs opacity-75">S{i + 1}</span>
                    <span>{ucfirst(formatLongDate(d))}</span>
                  </Link>
                </li>
              ))}
            </ol>
          )}

          <form action={generateDatesAction} className="mt-5 flex flex-wrap items-end gap-3 rounded-xl bg-sky/50 p-4 text-sm">
            <label>
              <span className="block font-semibold">Première séance</span>
              <input type="date" name="start" defaultValue={dates[0] ?? ""} className={`mt-1 ${input}`} />
            </label>
            <label>
              <span className="block font-semibold">Nombre de séances</span>
              <input
                type="number"
                name="count"
                min={1}
                max={MAX_SESSIONS}
                defaultValue={dates.length || 6}
                className={`mt-1 w-28 ${input}`}
              />
            </label>
            <button className="rounded-full bg-brand px-4 py-2 font-bold text-white hover:opacity-90">Une séance par semaine</button>
          </form>

          <details className="mt-3 text-sm">
            <summary className="cursor-pointer font-semibold text-brand">
              Modifier les dates une à une (séance reportée, jour férié…)
            </summary>
            <form action={saveDatesAction} className="mt-3 grid gap-3 sm:grid-cols-4">
              {Array.from({ length: MAX_SESSIONS }, (_, i) => (
                <label key={i}>
                  <span className="block text-xs font-semibold text-ink/60">Séance {i + 1}</span>
                  <input type="date" name={`date${i}`} defaultValue={dates[i] ?? ""} className={`mt-1 w-full ${input}`} />
                </label>
              ))}
              <div className="sm:col-span-4">
                <button className="rounded-full bg-ink px-4 py-2 font-bold text-white hover:opacity-90">Enregistrer les dates</button>
              </div>
            </form>
          </details>
        </section>

        {/* Rappels */}
        <section className="mt-6 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-ink/10">
          <h2 className="text-lg font-extrabold">Rappels aux parents</h2>
          {!chosen ? (
            <p className="mt-2 text-sm text-ink/60">
              {dates.length ? "Toutes les séances sont passées." : "Ajoutez les dates des séances pour préparer les rappels."}
            </p>
          ) : (
            <>
              <p className="mt-1 text-sm text-ink/70">
                Séance {n}, <span className="font-semibold">{formatLongDate(chosen)}</span>
                {start ? ` à ${start.replace(":", "h")}` : " (heure de début à fixer dans l'onglet Places)"}. Chaque bouton
                ouvre WhatsApp avec le message prêt à envoyer.
              </p>
              {registrations.length === 0 ? (
                <p className="mt-3 text-sm text-ink/60">Aucun enfant inscrit.</p>
              ) : (
                <ul className="mt-4 divide-y divide-ink/10 text-sm">
                  {registrations.map((r) => {
                    const url = whatsappUrl(
                      r.phone,
                      sessionReminderMessage({
                        parentName: r.parentName,
                        childName: r.childName,
                        level: r.level,
                        date: chosen,
                        n,
                        start,
                      }),
                    );
                    const theme = sessionTheme(r.level, n);
                    return (
                      <li key={r.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5">
                        <span>
                          <span className="font-bold">{r.childName}</span>{" "}
                          <span className="text-ink/60">
                            · {r.level}
                            {theme ? ` · « ${theme} »` : ""} · {r.parentName}
                          </span>
                        </span>
                        {url ? (
                          <a
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="rounded-full bg-[#0b7a63] px-3 py-1.5 font-bold text-white hover:opacity-90"
                          >
                            Rappel WhatsApp
                          </a>
                        ) : (
                          <span className="text-xs text-[#b3261e]">Numéro invalide</span>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </>
          )}
        </section>
      </div>
    </div>
  );
}
