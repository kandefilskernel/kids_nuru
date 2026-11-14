import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { isAdmin } from "@/lib/auth";
import {
  getChildHistory,
  getGalleryForRegistration,
  getPaymentsForRegistrations,
  getAccessCode,
  getRegistration,
  getSkillTests,
  SKILLS,
} from "@/lib/db";
import { updateChildFlagsAction } from "../../actions";
import PrintButton from "./PrintButton";
import Badges from "@/components/Badges";
import { computeBadges } from "@/lib/badges";

export const metadata = { title: "Fiche enfant · Kids Tech-nuru Lab", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function FichePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string }>;
}) {
  if (!(await isAdmin())) redirect("/admin");
  const { id } = await params;
  const sp = await searchParams;
  const r = await getRegistration(id);
  if (!r) notFound();

  const [history, tests, paymentsById, projects] = await Promise.all([
    getChildHistory(r.id),
    getSkillTests().then((all) => all[r.id] ?? {}),
    getPaymentsForRegistrations([r.id]),
    getGalleryForRegistration(r.id),
  ]);
  const mine = paymentsById[r.id] ?? [];
  const badges = computeBadges({ history, tests, projects: projects.length });
  const accessCode = await getAccessCode(r.id);
  const points = history.reduce((s, h) => s + (h.present ? 1 : 0) + (h.challenge ? 1 : 0) + (h.helped ? 1 : 0), 0);
  const fmtDate = (d: string) =>
    new Date(`${d}T12:00:00Z`).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 print:max-w-none print:p-0">
      <div className="mb-6 flex items-center justify-between print:hidden">
        <Link href="/admin" className="text-sm underline">← Espace équipe</Link>
        <span className="flex items-center gap-3">
          <Link href={`/admin/attestation/${r.id}`} className="text-sm font-semibold underline">Attestation de fin</Link>
          <PrintButton />
        </span>
      </div>

      <h1 className="text-2xl font-extrabold">Fiche enfant — Kids Tech-nuru Lab</h1>
      <p className="text-sm text-ink/60">Pilote · {r.level}</p>
      <p className="mt-2 text-sm print:hidden">
        <span className="text-ink/60">Code de suivi parent :</span>{" "}
        <span className="font-mono font-bold tracking-widest">{accessCode ?? "—"}</span>
        <span className="ml-2 text-xs text-ink/50">(à transmettre au parent, avec son téléphone, pour suivre l&apos;évolution sur /parent)</span>
      </p>

      <form action={updateChildFlagsAction} className="mt-6 flex flex-wrap items-end gap-3 border border-black/20 p-4 text-sm print:hidden">
        <input type="hidden" name="id" value={r.id} />
        <label>
          <span className="block font-bold">Genre</span>
          <select name="gender" defaultValue={r.gender} className="rounded border border-black/30 px-2 py-1">
            <option value="">Non renseigné</option>
            <option>Fille</option>
            <option>Garçon</option>
          </select>
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" name="solidarity" defaultChecked={r.solidarity} className="h-4 w-4" />
          Place solidaire
        </label>
        <button className="rounded bg-black px-3 py-1 font-semibold text-white">Enregistrer</button>
        {sp.saved === "1" && <span className="font-semibold text-[#0b7a63]">Enregistré.</span>}
      </form>

      <section className="mt-6 border border-black/20 p-4">
        <h2 className="font-bold">Enfant</h2>
        <dl className="mt-2 grid grid-cols-[9rem_1fr] gap-y-1 text-sm">
          <dt className="text-ink/60">Nom</dt><dd className="font-semibold">{r.childName}</dd>
          <dt className="text-ink/60">Âge</dt><dd>{r.age} ans</dd>
          <dt className="text-ink/60">École</dt><dd>{r.school || "—"}</dd>
          <dt className="text-ink/60">Santé / allergies</dt><dd>{r.health || "Aucune information"}</dd>
          <dt className="text-ink/60">Photos</dt><dd>{r.photoConsent ? "Autorisées" : "Non autorisées"}</dd>
        </dl>
      </section>

      <section className="mt-4 border border-black/20 p-4">
        <h2 className="font-bold">Parent et urgence</h2>
        <dl className="mt-2 grid grid-cols-[9rem_1fr] gap-y-1 text-sm">
          <dt className="text-ink/60">Parent / tuteur</dt><dd className="font-semibold">{r.parentName}</dd>
          <dt className="text-ink/60">Téléphone</dt><dd>{r.phone}</dd>
          <dt className="text-ink/60">Mobile money</dt><dd>{r.momoNumber || "—"}</dd>
          <dt className="text-ink/60">Contact d&apos;urgence</dt><dd>{r.emergencyContact || "—"}</dd>
        </dl>
      </section>

      <section className="mt-4 border border-black/20 p-4">
        <h2 className="font-bold">Bilan des séances</h2>
        {history.length === 0 ? (
          <p className="mt-2 text-sm text-ink/60">Aucune séance enregistrée pour le moment.</p>
        ) : (
          <>
            <table className="mt-2 w-full text-sm">
              <thead>
                <tr className="border-b border-black/20 text-left">
                  <th className="py-1">Séance</th>
                  <th className="py-1">Présent</th>
                  <th className="py-1">Défi terminé</th>
                  <th className="py-1">Entraide</th>
                  <th className="py-1 text-right">Points</th>
                </tr>
              </thead>
              <tbody>
                {history.map((h) => (
                  <tr key={h.date} className="border-b border-black/10">
                    <td className="py-1">{fmtDate(h.date)}</td>
                    <td className="py-1">{h.present ? "✓" : "—"}</td>
                    <td className="py-1">{h.present && h.challenge ? "✓" : "—"}</td>
                    <td className="py-1">{h.present && h.helped ? "✓" : "—"}</td>
                    <td className="py-1 text-right">{(h.present ? 1 : 0) + (h.present && h.challenge ? 1 : 0) + (h.present && h.helped ? 1 : 0)} / 3</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="mt-2 text-sm font-semibold">Total : {points} point(s) sur {history.length * 3}</p>
          </>
        )}
      </section>

      <section className="mt-4 border border-black/20 p-4 print:hidden">
        <h2 className="font-bold">Badges</h2>
        <div className="mt-2">
          <Badges badges={badges} compact />
        </div>
      </section>

      <section className="mt-4 border border-black/20 p-4">
        <h2 className="font-bold">Progression (tests d&apos;entrée et de sortie)</h2>
        <table className="mt-2 w-full text-sm">
          <thead>
            <tr className="border-b border-black/20 text-left">
              <th className="py-1">Compétence</th>
              <th className="py-1 text-center">Entrée</th>
              <th className="py-1 text-center">Sortie</th>
            </tr>
          </thead>
          <tbody>
            {SKILLS.map((s, i) => (
              <tr key={s} className="border-b border-black/10">
                <td className="py-1">{s}</td>
                <td className="py-1 text-center">{tests.entree ? (tests.entree[i] ? "✓" : "—") : "·"}</td>
                <td className="py-1 text-center">{tests.sortie ? (tests.sortie[i] ? "✓" : "—") : "·"}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="mt-2 text-xs text-ink/55">· = test non fait</p>
      </section>

      <section className="mt-4 border border-black/20 p-4">
        <h2 className="font-bold">Paiements</h2>
        {mine.length === 0 ? (
          <p className="mt-2 text-sm text-ink/60">Aucun paiement enregistré.</p>
        ) : (
          <ul className="mt-2 space-y-1 text-sm">
            {mine.map((p) => (
              <li key={p.id} className={p.cancelledAt ? "line-through text-ink/50" : ""}>
                {p.month} · {p.amount.toLocaleString("fr-FR")} {p.currency} · reçu n° {p.receiptNo}
                {p.cancelledAt && " (annulé)"}
              </li>
            ))}
          </ul>
        )}
      </section>

      <p className="mt-6 text-xs text-ink/55">
        Document interne. Ne pas diffuser sans l&apos;accord du parent. Édité le{" "}
        {new Date().toLocaleDateString("fr-FR", { timeZone: "Africa/Lubumbashi" })}.
      </p>
    </div>
  );
}
