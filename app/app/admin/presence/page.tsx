import Link from "next/link";
import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/auth";
import { getAttendance, getRegistrations, type Level, type Registration } from "@/lib/db";
import { saveAttendanceAction } from "../actions";
import AdminNav from "../AdminNav";

export const metadata = { title: "Présence · Kids Tech-nuru Lab", robots: { index: false } };
export const dynamic = "force-dynamic";

const LEVELS: { name: Level; badge: string }[] = [
  { name: "Éveil", badge: "bg-mint/20 text-[#0b7a63]" },
  { name: "Explorateur", badge: "bg-brand/10 text-brand" },
  { name: "Créateur", badge: "bg-accent/30 text-[#8a5a00]" },
];

/** Samedi le plus récent (ou aujourd'hui si c'est un samedi), fuseau de Lubumbashi. */
function defaultSaturday(): string {
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Lubumbashi" }).format(new Date());
  const [y, m, d] = today.split("-").map(Number);
  const dow = new Date(Date.UTC(y, m - 1, d)).getUTCDay(); // 0 = dimanche ... 6 = samedi
  const back = (dow + 1) % 7; // jours écoulés depuis le dernier samedi
  return new Date(Date.UTC(y, m - 1, d - back)).toISOString().slice(0, 10);
}

function formatDate(date: string) {
  return new Date(`${date}T12:00:00Z`).toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

export default async function PresencePage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string; saved?: string }>;
}) {
  if (!(await isAdmin())) redirect("/admin");

  const { date: dateParam, saved } = await searchParams;
  const date = dateParam && /^\d{4}-\d{2}-\d{2}$/.test(dateParam) ? dateParam : defaultSaturday();

  const [registrations, attendance] = await Promise.all([getRegistrations(), getAttendance(date)]);
  const presentCount = registrations.filter((r) => attendance[r.id]?.present).length;

  return (
    <div className="bg-dots-dark min-h-[calc(100vh-130px)] bg-sky/50">
      <div className="mx-auto max-w-4xl px-4 py-10">
        <Link href="/admin" className="text-sm font-semibold text-brand hover:underline">
          ← Espace équipe
        </Link>
        <AdminNav current="/admin/presence" />

        <div className="mt-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">Registre de présence</h1>
            <p className="text-sm capitalize text-ink/60">{formatDate(date)}</p>
          </div>
          <p className="rounded-full bg-white px-4 py-2 text-sm font-bold shadow-sm ring-1 ring-ink/10">
            {presentCount} / {registrations.length} présents
          </p>
        </div>

        <form className="mt-6 flex flex-wrap items-center gap-2 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-ink/10">
          <label className="text-sm font-semibold" htmlFor="date">
            Séance du
          </label>
          <input
            id="date"
            name="date"
            type="date"
            defaultValue={date}
            required
            className="rounded-xl border border-ink/15 px-3 py-2 text-sm outline-none focus:border-brand focus:ring-4 focus:ring-brand/15"
          />
          <button className="rounded-full bg-ink px-4 py-2 text-sm font-semibold text-white">Afficher</button>
        </form>

        {saved === "1" && (
          <p className="mt-4 rounded-xl bg-mint/15 p-3 text-sm font-semibold text-[#0b7a63] ring-1 ring-mint/40" role="status">
            Présence enregistrée.
          </p>
        )}

        <p className="mt-4 text-xs text-ink/60">
          Bilan de la séance : présence (1 point), défi terminé et aide à un camarade (1 point chacun).
          Les points ne comptent que pour les enfants présents.
        </p>

        {registrations.length === 0 ? (
          <p className="mt-8 rounded-2xl bg-white p-8 text-center text-ink/60 ring-1 ring-ink/10">
            Aucune inscription pour le moment.
          </p>
        ) : (
          <form action={saveAttendanceAction} className="mt-6 space-y-6">
            <input type="hidden" name="date" value={date} />

            {LEVELS.map((l) => {
              const group = registrations.filter((r) => r.level === l.name);
              if (group.length === 0) return null;
              const n = group.filter((r) => attendance[r.id]?.present).length;
              return (
                <section key={l.name} className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-ink/10">
                  <div className="flex items-center justify-between">
                    <h2 className="flex items-center gap-2 text-lg font-extrabold">
                      <span className={`rounded-full px-3 py-1 text-xs font-bold ${l.badge}`}>{l.name}</span>
                    </h2>
                    <span className="text-sm font-semibold text-ink/60">
                      {n} / {group.length}
                    </span>
                  </div>
                  <ul className="mt-4 divide-y divide-ink/10">
                    {group.map((r) => (
                      <ChildRow key={r.id} r={r} row={attendance[r.id]} />
                    ))}
                  </ul>
                </section>
              );
            })}

            <div className="sticky bottom-4 flex justify-end">
              <button className="rounded-full bg-accent px-6 py-3 font-bold text-ink shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl">
                Enregistrer la séance
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

function ChildRow({ r, row }: { r: Registration; row?: { present: boolean; challenge: boolean; helped: boolean } }) {
  return (
    <li className="py-3">
      <div className="flex items-start gap-3">
        <input
          type="checkbox"
          name="present"
          value={r.id}
          defaultChecked={row?.present === true}
          aria-label={`${r.childName} présent(e)`}
          className="mt-1 h-5 w-5 shrink-0 accent-brand"
        />
        <div className="flex-1">
          <p className="font-semibold">{r.childName}</p>
          <p className="text-sm text-ink/60">
            {r.age} ans{r.school && ` · ${r.school}`}
          </p>
          {r.health && (
            <span className="mt-1 inline-block rounded-md bg-coral/10 px-2 py-0.5 text-xs font-semibold text-[#b3261e]">
              Santé : {r.health}
            </span>
          )}
          <div className="mt-2 flex flex-wrap gap-4 text-sm">
            <label className="flex items-center gap-2">
              <input type="checkbox" name="challenge" value={r.id} defaultChecked={row?.challenge === true} className="h-4 w-4 accent-brand" />
              Défi terminé
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" name="helped" value={r.id} defaultChecked={row?.helped === true} className="h-4 w-4 accent-brand" />
              A aidé un camarade
            </label>
          </div>
        </div>
      </div>
    </li>
  );
}
