import PageIntro from "@/components/PageIntro";
import Link from "next/link";
import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/auth";
import { getTeacherRequests, TEACHER_STATUSES } from "@/lib/db";
import { teacherRef, teacherReceiptUrl } from "@/lib/whatsapp";
import { updateTeacherRequestAction } from "../actions";
import AdminNav from "../AdminNav";

export const metadata = { title: "Demandes des enseignants · Kids Tech-nuru Lab", robots: { index: false } };
export const dynamic = "force-dynamic";

const inputCls =
  "w-full rounded-lg border border-ink/15 bg-white px-2.5 py-1.5 text-sm outline-none focus:border-brand focus:ring-4 focus:ring-brand/15";

export default async function EnseignantsAdminPage({ searchParams }: { searchParams: Promise<{ saved?: string }> }) {
  if (!(await isAdmin())) redirect("/admin");
  const { saved } = await searchParams;
  const requests = await getTeacherRequests();
  const open = requests.filter((r) => r.status === "Nouvelle").length;

  return (
    <div className="bg-dots-dark min-h-[calc(100vh-130px)] bg-sky/50">
      <div className="mx-auto max-w-5xl px-4 py-10">
        <Link href="/admin" className="text-sm font-semibold text-brand hover:underline">
          ← Espace équipe
        </Link>
        <AdminNav current="/admin/enseignants" />
        <div className="mt-5">
          <PageIntro eyebrow="Espace équipe" title="Demandes des enseignants" />
        </div>
        <div className="-mt-4 mb-6 flex flex-wrap items-center justify-end gap-3">
          <p className="rounded-full bg-white px-4 py-2 text-sm font-bold shadow-sm ring-1 ring-ink/10">
            {open} nouvelle(s) demande(s)
          </p>
        </div>

        {saved === "1" && (
          <p className="mt-4 rounded-xl bg-mint/15 p-3 text-sm font-semibold text-[#0b7a63] ring-1 ring-mint/40">Demande mise à jour.</p>
        )}

        {requests.length === 0 ? (
          <p className="mt-8 rounded-2xl bg-white p-8 text-center text-ink/60 ring-1 ring-ink/10">
            Aucune demande pour le moment. Partagez le lien <code>/enseignants</code> aux écoles.
          </p>
        ) : (
          <ul className="mt-6 space-y-4">
            {requests.map((r) => (
              <li key={r.id} className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-ink/10">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-extrabold">
                      {r.name} <span className="text-sm font-normal text-ink/55">· {r.role || "fonction non précisée"}</span>
                    </p>
                    <p className="text-sm text-ink/65">
                      {r.school || "École non précisée"} · {r.phone}
                    </p>
                  </div>
                  <span className="rounded-full bg-brand/10 px-3 py-1 text-xs font-bold text-brand">{r.status}</span>
                </div>

                <dl className="mt-3 grid grid-cols-[7rem_1fr] gap-y-1 text-sm">
                  <dt className="text-ink/55">Format</dt>
                  <dd className="font-semibold">{r.format}</dd>
                  <dt className="text-ink/55">Niveaux</dt>
                  <dd>{r.levels || "non précisé"}</dd>
                  <dt className="text-ink/55">Élèves</dt>
                  <dd>{r.pupils || "non précisé"}</dd>
                  <dt className="text-ink/55">Créneau</dt>
                  <dd>{r.slot || "non précisé"}</dd>
                  {r.fileName && (
                    <>
                      <dt className="text-ink/55">Dossier</dt>
                      <dd>
                        <a href={`/admin/enseignants/file/${r.id}`} className="font-semibold text-brand hover:underline">
                          Télécharger « {r.fileName} »
                        </a>
                      </dd>
                    </>
                  )}
                  {r.message && (
                    <>
                      <dt className="text-ink/55">Précisions</dt>
                      <dd>{r.message}</dd>
                    </>
                  )}
                  <dt className="text-ink/55">Reçue le</dt>
                  <dd>{new Date(r.createdAt).toLocaleDateString("fr-FR", { timeZone: "Africa/Lubumbashi" })}</dd>
                </dl>

                {r.status === "Acceptée" && (
                  <div className="mt-4 flex flex-wrap items-center gap-2 rounded-xl bg-mint/10 p-3 text-sm ring-1 ring-mint/30">
                    <span className="font-semibold text-[#0b7a63]">Demande acceptée</span>
                    <Link
                      href={`/admin/enseignants/recepisse/${r.id}`}
                      target="_blank"
                      className="rounded-full bg-white px-3 py-1 text-xs font-bold text-brand ring-1 ring-ink/15 hover:bg-sky"
                    >
                      Ouvrir le récépissé (PDF)
                    </Link>
                    {teacherReceiptUrl(r.phone, r.name, r.school, teacherRef(r.id, r.createdAt)) ? (
                      <a
                        href={teacherReceiptUrl(r.phone, r.name, r.school, teacherRef(r.id, r.createdAt))!}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-full bg-[#25d366] px-3 py-1 text-xs font-bold text-white"
                      >
                        Envoyer le message WhatsApp
                      </a>
                    ) : (
                      <span className="text-xs text-ink/55">Numéro non exploitable pour WhatsApp.</span>
                    )}
                    <span className="w-full text-xs text-ink/55">
                      Le message ne part qu&apos;à votre envoi : joignez le PDF du récépissé dans WhatsApp avant d&apos;envoyer.
                    </span>
                  </div>
                )}

                <form action={updateTeacherRequestAction} className="mt-4 grid gap-2 border-t border-ink/10 pt-4 md:grid-cols-[1fr_2fr_auto]">
                  <input type="hidden" name="id" value={r.id} />
                  <select name="status" defaultValue={r.status} aria-label="Statut" className={inputCls}>
                    {TEACHER_STATUSES.map((s) => (
                      <option key={s}>{s}</option>
                    ))}
                  </select>
                  <input name="note" defaultValue={r.note} placeholder="Note interne (date de rappel, devis…)" aria-label="Note" className={inputCls} />
                  <button className="rounded-full bg-ink px-4 py-1.5 text-xs font-bold text-white">Mettre à jour</button>
                </form>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
