import Link from "next/link";
import { redirect } from "next/navigation";
import PageIntro from "@/components/PageIntro";
import { isAdmin } from "@/lib/auth";
import { countByLevel, getCapacities, getRegistration, getWaitlist, type Level } from "@/lib/db";
import { waitlistAckMessage, waitlistPlaceMessage, whatsappUrl } from "@/lib/whatsapp";
import AdminNav from "../AdminNav";
import { promoteAction, removeWaitlistAction } from "./actions";

export const metadata = { title: "Liste d'attente · Kids Tech-nuru Lab", robots: { index: false } };
export const dynamic = "force-dynamic";

const LEVELS: { name: Level; badge: string }[] = [
  { name: "Éveil", badge: "bg-mint/20 text-[#0b7a63]" },
  { name: "Explorateur", badge: "bg-brand/10 text-brand" },
  { name: "Créateur", badge: "bg-accent/30 text-[#8a5a00]" },
];

const ERRORS: Record<string, string> = {
  full: "Ce niveau est toujours complet : libérez une place ou augmentez la capacité (onglet Places).",
  missing: "Cette demande n'existe plus (déjà inscrite ou retirée).",
};

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric", timeZone: "Africa/Lubumbashi" });

export default async function AttentePage({
  searchParams,
}: {
  searchParams: Promise<{ promoted?: string; removed?: string; error?: string }>;
}) {
  if (!(await isAdmin())) redirect("/admin");
  const sp = await searchParams;

  const [waitlist, capacity, counts] = await Promise.all([getWaitlist(), getCapacities(), countByLevel()]);
  // Enfant que l'on vient d'inscrire : on propose de prévenir le parent.
  const promoted = sp.promoted && /^[0-9a-f-]{36}$/.test(sp.promoted) ? await getRegistration(sp.promoted) : null;
  const promotedUrl = promoted
    ? whatsappUrl(promoted.phone, waitlistPlaceMessage(promoted.parentName, promoted.childName, promoted.level))
    : null;

  return (
    <div className="bg-dots-dark min-h-[calc(100vh-130px)] bg-sky/50">
      <div className="mx-auto max-w-4xl px-4 py-10">
        <Link href="/admin" className="text-sm font-semibold text-brand hover:underline">
          ← Espace équipe
        </Link>
        <AdminNav current="/admin/attente" />

        <div className="mt-5">
          <PageIntro eyebrow="Espace équipe" title="Liste d'attente">
            Quand un niveau est complet, les nouvelles inscriptions arrivent ici, dans l&apos;ordre d&apos;arrivée.
            Dès qu&apos;une place se libère, inscrivez l&apos;enfant puis prévenez le parent sur WhatsApp.
          </PageIntro>
        </div>

        {promoted && (
          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-mint/15 p-4 text-sm ring-1 ring-mint/40" role="status">
            <span>
              <span className="font-bold">{promoted.childName}</span> est inscrit(e) au niveau {promoted.level}.
            </span>
            <span className="flex flex-wrap gap-2">
              {promotedUrl && (
                <a href={promotedUrl} target="_blank" rel="noopener noreferrer" className="rounded-full bg-[#0b7a63] px-4 py-1.5 font-bold text-white hover:opacity-90">
                  Prévenir le parent sur WhatsApp
                </a>
              )}
              <Link href={`/admin/fiche/${promoted.id}`} className="rounded-full bg-white px-4 py-1.5 font-semibold ring-1 ring-ink/15 hover:bg-sky">
                Fiche et code de suivi
              </Link>
            </span>
          </div>
        )}
        {sp.error && ERRORS[sp.error] && (
          <p className="mt-6 rounded-2xl bg-coral/10 p-4 text-sm font-semibold text-[#b3261e] ring-1 ring-coral/40" role="alert">
            {ERRORS[sp.error]}
          </p>
        )}
        {sp.removed === "1" && (
          <p className="mt-6 rounded-2xl bg-white p-4 text-sm font-semibold ring-1 ring-ink/10" role="status">Demande retirée.</p>
        )}

        <div className="mt-6 space-y-6">
          {LEVELS.map(({ name, badge }) => {
            const rows = waitlist.filter((w) => w.level === name);
            const free = Math.max(0, capacity[name] - counts[name]);
            return (
              <section key={name} className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-ink/10">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h2 className="flex items-center gap-2 text-lg font-extrabold">
                    <span className={`rounded-full px-3 py-1 text-xs font-bold ${badge}`}>{name}</span>
                    {rows.length} en attente
                  </h2>
                  <p className={`text-sm font-semibold ${free > 0 ? "text-[#0b7a63]" : "text-ink/60"}`}>
                    {counts[name]} / {capacity[name]} inscrits · {free > 0 ? `${free} place(s) libre(s)` : "complet"}
                  </p>
                </div>

                {rows.length === 0 ? (
                  <p className="mt-3 text-sm text-ink/60">Personne en attente pour ce niveau.</p>
                ) : (
                  <ol className="mt-4 divide-y divide-ink/10">
                    {rows.map((w, i) => {
                      const ack = whatsappUrl(w.phone, waitlistAckMessage(w.parentName, w.childName, w.level, i + 1));
                      return (
                        <li key={w.id} className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm">
                          <div className="min-w-0">
                            <p className="font-bold">
                              <span className="mr-2 text-ink/50">{i + 1}.</span>
                              {w.childName} <span className="font-normal text-ink/60">· {w.age} ans</span>
                              {w.solidarity && (
                                <span className="ml-2 rounded-full bg-accent/30 px-2 py-0.5 text-xs font-semibold text-[#8a5a00]">solidaire</span>
                              )}
                            </p>
                            <p className="text-ink/60">
                              {w.parentName} · {w.phone} · demandé le {fmtDate(w.createdAt)}
                            </p>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {ack && (
                              <a href={ack} target="_blank" rel="noopener noreferrer" className="rounded-full bg-white px-3 py-1.5 font-semibold ring-1 ring-ink/15 hover:bg-sky">
                                Confirmer l&apos;attente
                              </a>
                            )}
                            <form action={promoteAction}>
                              <input type="hidden" name="id" value={w.id} />
                              <button
                                disabled={free === 0}
                                title={free === 0 ? "Aucune place libre dans ce niveau" : undefined}
                                className="rounded-full bg-brand px-3 py-1.5 font-bold text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
                              >
                                Inscrire
                              </button>
                            </form>
                            <form action={removeWaitlistAction}>
                              <input type="hidden" name="id" value={w.id} />
                              <button className="rounded-full px-3 py-1.5 font-semibold text-[#b3261e] hover:bg-coral/10">Retirer</button>
                            </form>
                          </div>
                        </li>
                      );
                    })}
                  </ol>
                )}
              </section>
            );
          })}
        </div>
      </div>
    </div>
  );
}
