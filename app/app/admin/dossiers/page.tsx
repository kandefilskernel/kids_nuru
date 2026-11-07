import PageIntro from "@/components/PageIntro";
import Link from "next/link";
import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/auth";
import { DOSSIER_STATUSES, getDossiers } from "@/lib/db";
import { updateDossierAction } from "../actions";
import AdminNav from "../AdminNav";

export const metadata = { title: "Dossiers déposés · Kids Tech-nuru Lab", robots: { index: false } };
export const dynamic = "force-dynamic";

const inputCls =
  "w-full rounded-lg border border-ink/15 bg-white px-2.5 py-1.5 text-sm outline-none focus:border-brand focus:ring-4 focus:ring-brand/15";

export default async function DossiersPage({ searchParams }: { searchParams: Promise<{ saved?: string }> }) {
  if (!(await isAdmin())) redirect("/admin");
  const { saved } = await searchParams;
  const dossiers = await getDossiers();
  const todo = dossiers.filter((d) => d.status === "À traiter").length;

  return (
    <div className="bg-dots-dark min-h-[calc(100vh-130px)] bg-sky/50">
      <div className="mx-auto max-w-5xl px-4 py-10">
        <Link href="/admin" className="text-sm font-semibold text-brand hover:underline">
          ← Espace équipe
        </Link>
        <AdminNav current="/admin/dossiers" />
        <div className="mt-5">
          <PageIntro eyebrow="Espace équipe" title="Dossiers déposés" />
        </div>
        <div className="-mt-4 mb-6 flex flex-wrap items-center justify-end gap-3">
          <p className="rounded-full bg-white px-4 py-2 text-sm font-bold shadow-sm ring-1 ring-ink/10">{todo} à traiter</p>
        </div>
        <p className="mt-2 text-sm text-ink/65">
          Les dossiers sont déposés depuis <code>/depot</code>. Seule l&apos;équipe peut les télécharger.
        </p>

        {saved === "1" && (
          <p className="mt-4 rounded-xl bg-mint/15 p-3 text-sm font-semibold text-[#0b7a63] ring-1 ring-mint/40">Dossier mis à jour.</p>
        )}

        {dossiers.length === 0 ? (
          <p className="mt-8 rounded-2xl bg-white p-8 text-center text-ink/60 ring-1 ring-ink/10">Aucun dossier déposé pour le moment.</p>
        ) : (
          <ul className="mt-6 space-y-4">
            {dossiers.map((d) => (
              <li key={d.id} className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-ink/10">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-extrabold">{d.name}</p>
                    <p className="text-sm text-ink/65">
                      {d.phone} · {d.category}
                    </p>
                  </div>
                  <span className="rounded-full bg-brand/10 px-3 py-1 text-xs font-bold text-brand">{d.status}</span>
                </div>
                {d.description && <p className="mt-2 text-sm">{d.description}</p>}
                <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
                  <a href={`/admin/dossiers/file/${d.id}`} className="rounded-full bg-accent px-4 py-1.5 font-bold text-ink shadow-sm">
                    Télécharger « {d.fileName} »
                  </a>
                  <span className="text-xs text-ink/55">
                    {(d.fileSize / 1024).toFixed(0)} Ko · reçu le{" "}
                    {new Date(d.createdAt).toLocaleDateString("fr-FR", { timeZone: "Africa/Lubumbashi" })}
                  </span>
                </div>

                <form action={updateDossierAction} className="mt-4 grid gap-2 border-t border-ink/10 pt-4 md:grid-cols-[1fr_2fr_auto]">
                  <input type="hidden" name="id" value={d.id} />
                  <select name="status" defaultValue={d.status} aria-label="Statut" className={inputCls}>
                    {DOSSIER_STATUSES.map((s) => (
                      <option key={s}>{s}</option>
                    ))}
                  </select>
                  <input name="note" defaultValue={d.note} placeholder="Note interne" aria-label="Note" className={inputCls} />
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
