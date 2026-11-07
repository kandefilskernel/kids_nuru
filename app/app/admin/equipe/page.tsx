import { redirect } from "next/navigation";
import PageIntro from "@/components/PageIntro";
import { isAdmin } from "@/lib/auth";
import { getTeamUsers } from "@/lib/db";
import { MIN_PASSWORD } from "@/lib/passwords";
import AdminNav from "../AdminNav";
import { createMemberAction, resetPasswordAction, toggleMemberAction } from "./actions";

export const metadata = { title: "Équipe · Kids Tech-nuru Lab", robots: { index: false } };
export const dynamic = "force-dynamic";

const field = "rounded-xl border border-ink/15 bg-white px-3 py-2 text-sm outline-none focus:border-brand focus:ring-4 focus:ring-brand/15";

const ERRORS: Record<string, string> = {
  username: "Identifiant invalide : 3 à 32 caractères (lettres, chiffres, point, tiret), et pas « super ».",
  name: "Indiquez le nom du membre.",
  password: `Le mot de passe doit comporter au moins ${MIN_PASSWORD} caractères.`,
  exists: "Cet identifiant existe déjà.",
  id: "Membre introuvable.",
};

export default async function EquipePage({ searchParams }: { searchParams: Promise<{ saved?: string; error?: string }> }) {
  if (!(await isAdmin())) redirect("/admin");
  const { saved, error } = await searchParams;
  const members = await getTeamUsers();

  return (
    <div className="bg-dots-dark min-h-[calc(100vh-130px)] bg-sky/50">
      <div className="mx-auto max-w-4xl px-4 py-10">
        <a href="/admin" className="text-sm font-semibold text-brand hover:underline">← Espace équipe</a>
        <AdminNav current="/admin/equipe" />
        <div className="mt-5">
          <PageIntro eyebrow="Responsable" title="Équipe">
            Créez les comptes des membres de l&apos;équipe et désactivez-les quand ils ne font plus partie du projet.
            Chaque membre n&apos;accède qu&apos;à ses tâches.
          </PageIntro>
        </div>

        {saved === "1" && <p className="mb-4 rounded-xl bg-mint/15 p-3 text-sm font-semibold text-[#0b7a63] ring-1 ring-mint/40">Enregistré.</p>}
        {error && (
          <p className="mb-4 rounded-xl bg-coral/10 p-3 text-sm font-semibold text-[#b3261e] ring-1 ring-coral/40" role="alert">
            {ERRORS[error] ?? "Erreur."}
          </p>
        )}

        <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-ink/10">
          <h2 className="text-lg font-extrabold">Ajouter un membre</h2>
          <form action={createMemberAction} className="mt-4 grid gap-3 sm:grid-cols-3">
            <input name="name" required placeholder="Nom et prénom" className={field} aria-label="Nom" />
            <input name="username" required placeholder="Identifiant (ex : marie.k)" autoComplete="off" className={field} aria-label="Identifiant" />
            <input name="password" type="password" required minLength={MIN_PASSWORD} autoComplete="new-password" placeholder={`Mot de passe (${MIN_PASSWORD} caractères min.)`} className={field} aria-label="Mot de passe initial" />
            <button className="rounded-full bg-accent px-5 py-2.5 font-bold text-ink shadow-sm sm:col-span-3 sm:justify-self-start">Créer le compte</button>
          </form>
          <p className="mt-3 text-xs text-ink/55">Transmettez le mot de passe au membre par un moyen sûr, puis demandez-lui de le garder pour lui.</p>
        </section>

        <section className="mt-6 space-y-4">
          {members.length === 0 ? (
            <p className="rounded-2xl bg-white p-8 text-center text-ink/60 ring-1 ring-ink/10">Aucun membre pour le moment.</p>
          ) : (
            members.map((m) => (
              <div key={m.id} className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-ink/10">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-extrabold">
                      {m.name} <span className="text-sm font-normal text-ink/55">· {m.username}</span>
                    </p>
                    <p className="text-xs text-ink/55">Ajouté le {new Date(m.createdAt).toLocaleDateString("fr-FR", { timeZone: "Africa/Lubumbashi" })}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`rounded-full px-3 py-1 text-xs font-bold ${m.active ? "bg-mint/20 text-[#0b7a63]" : "bg-ink/10 text-ink/60"}`}>
                      {m.active ? "Actif" : "Désactivé"}
                    </span>
                    <form action={toggleMemberAction}>
                      <input type="hidden" name="id" value={m.id} />
                      <input type="hidden" name="active" value={m.active ? "0" : "1"} />
                      <button className="rounded-full bg-white px-4 py-1.5 text-xs font-bold ring-1 ring-ink/15 hover:bg-sky">
                        {m.active ? "Désactiver" : "Réactiver"}
                      </button>
                    </form>
                  </div>
                </div>
                <form action={resetPasswordAction} className="mt-4 flex flex-wrap items-center gap-2 border-t border-ink/10 pt-4">
                  <input type="hidden" name="id" value={m.id} />
                  <input name="password" type="password" minLength={MIN_PASSWORD} required autoComplete="new-password" placeholder="Nouveau mot de passe" className={`${field} flex-1`} aria-label={`Nouveau mot de passe pour ${m.name}`} />
                  <button className="rounded-full bg-ink px-4 py-2 text-xs font-bold text-white">Changer le mot de passe</button>
                </form>
              </div>
            ))
          )}
        </section>
      </div>
    </div>
  );
}
