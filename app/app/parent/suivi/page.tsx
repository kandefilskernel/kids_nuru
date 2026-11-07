import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import PageIntro from "@/components/PageIntro";
import {
  getChildHistory,
  getGalleryForRegistration,
  getPaymentsForRegistrations,
  getRegistration,
  getSkillTests,
  receiptNumber,
  SKILLS,
} from "@/lib/db";
import { PARENT_COOKIE, readParentSession } from "@/lib/parent";
import { monthLabel } from "@/lib/whatsapp";
import { parentLogoutAction } from "../actions";

export const metadata = { title: "Suivi de mon enfant · Kids Tech-nuru Lab", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

const fmtDate = (d: string) =>
  new Date(`${d}T12:00:00Z`).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });

export default async function ParentSuiviPage() {
  // La session ne donne accès qu'à un seul enfant : celui de la connexion.
  const id = readParentSession((await cookies()).get(PARENT_COOKIE)?.value);
  if (!id) redirect("/parent");

  const r = await getRegistration(id);
  if (!r) notFound();

  const [history, tests, payments, projects] = await Promise.all([
    getChildHistory(id),
    getSkillTests().then((all) => all[id] ?? {}),
    getPaymentsForRegistrations([id]).then((all) => all[id] ?? []),
    getGalleryForRegistration(id),
  ]);

  const presentCount = history.filter((h) => h.present).length;
  const challenges = history.filter((h) => h.challenge).length;
  const helped = history.filter((h) => h.helped).length;
  const points = presentCount + challenges + helped;
  const firstName = r.childName.trim().split(/\s+/)[0];

  return (
    <div className="bg-dots-dark min-h-[calc(100vh-130px)] bg-sky/50">
      <div className="mx-auto max-w-4xl space-y-6 px-4 py-10">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <PageIntro eyebrow={`Pilote · ${r.level}`} title={`Le parcours de ${firstName}`}>
              Suivi depuis l&apos;inscription. Cette page n&apos;affiche que les informations de votre enfant.
            </PageIntro>
          </div>
          <form action={parentLogoutAction}>
            <button className="rounded-full bg-white px-4 py-2 text-sm font-semibold shadow-sm ring-1 ring-ink/15 hover:bg-sky">
              Se déconnecter
            </button>
          </form>
        </div>

        {/* Indicateurs */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label="Séances présent" value={`${presentCount}`} hint={`sur ${history.length} enregistrée(s)`} />
          <Stat label="Défis réussis" value={`${challenges}`} />
          <Stat label="Entraide" value={`${helped}`} hint="aide donnée à un camarade" />
          <Stat label="Points du bilan" value={`${points}`} />
        </div>

        {/* Compétences */}
        <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-ink/10">
          <h2 className="text-lg font-extrabold">Compétences</h2>
          <p className="mt-1 text-sm text-ink/60">Test d&apos;entrée au début du pilote, test de sortie à la fin.</p>
          <table className="mt-4 w-full text-sm">
            <thead>
              <tr className="border-b border-ink/15 text-left text-xs text-ink/60">
                <th className="py-2">Compétence</th>
                <th className="py-2 text-center">Entrée</th>
                <th className="py-2 text-center">Sortie</th>
              </tr>
            </thead>
            <tbody>
              {SKILLS.map((label, i) => (
                <tr key={label} className="border-b border-ink/10">
                  <td className="py-2">{label}</td>
                  <td className="py-2 text-center">{mark(tests.entree?.[i])}</td>
                  <td className="py-2 text-center">{mark(tests.sortie?.[i])}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        {/* Présences */}
        <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-ink/10">
          <h2 className="text-lg font-extrabold">Séances</h2>
          {history.length === 0 ? (
            <p className="mt-2 text-sm text-ink/60">Aucune séance enregistrée pour le moment.</p>
          ) : (
            <ul className="mt-3 divide-y divide-ink/10 text-sm">
              {[...history].reverse().map((h) => (
                <li key={h.date} className="flex flex-wrap items-center justify-between gap-2 py-2">
                  <span>{fmtDate(h.date)}</span>
                  <span className="flex flex-wrap gap-2 text-xs font-semibold">
                    <span className={h.present ? "text-[#0b7a63]" : "text-[#b3261e]"}>{h.present ? "Présent" : "Absent"}</span>
                    {h.challenge && <span className="rounded-full bg-accent/30 px-2 py-0.5 text-[#8a5a00]">Défi réussi</span>}
                    {h.helped && <span className="rounded-full bg-brand/10 px-2 py-0.5 text-brand">A aidé un camarade</span>}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Projets */}
        <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-ink/10">
          <h2 className="text-lg font-extrabold">Projets réalisés</h2>
          {projects.length === 0 ? (
            <p className="mt-2 text-sm text-ink/60">Les projets apparaîtront ici après la présentation finale.</p>
          ) : (
            <ul className="mt-3 space-y-3">
              {projects.map((p) => (
                <li key={p.id} className="rounded-xl bg-sky/50 p-4">
                  <p className="font-bold">{p.title}</p>
                  {p.description && <p className="mt-1 text-sm text-ink/70">{p.description}</p>}
                  {p.hasPhoto && p.photoConsent && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={`/galerie/photo/${p.id}`} alt={p.title} className="mt-3 max-h-64 rounded-xl object-cover" loading="lazy" />
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Paiements */}
        <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-ink/10">
          <h2 className="text-lg font-extrabold">Paiements</h2>
          {payments.length === 0 ? (
            <p className="mt-2 text-sm text-ink/60">Aucun paiement enregistré.</p>
          ) : (
            <ul className="mt-3 divide-y divide-ink/10 text-sm">
              {[...payments].reverse().map((p) => (
                <li key={p.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                  <span>
                    {monthLabel(p.month)} <span className="text-xs text-ink/55">· reçu {receiptNumber(p)}</span>
                  </span>
                  <span className="flex items-center gap-3">
                    <span className="font-bold tabular-nums">{p.amount.toLocaleString("fr-FR")} {p.currency}</span>
                    <span className={`text-xs font-semibold ${p.cancelledAt ? "text-ink/50 line-through" : "text-[#0b7a63]"}`}>
                      {p.cancelledAt ? "Annulé" : "Réglé"}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}

function mark(v: boolean | undefined) {
  if (v === undefined) return <span className="text-ink/35">—</span>;
  return v ? <span className="font-bold text-[#0b7a63]">✓ Réussi</span> : <span className="text-ink/50">En cours</span>;
}

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-ink/10">
      <p className="text-xs font-semibold text-ink/60">{label}</p>
      <p className="mt-1 text-2xl font-extrabold">{value}</p>
      {hint && <p className="mt-1 text-[11px] text-ink/55">{hint}</p>}
    </div>
  );
}
