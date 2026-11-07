import { redirect } from "next/navigation";
import PageIntro from "@/components/PageIntro";
import { currentSession } from "@/lib/auth";
import { getTeamUsers, listTasks, type Task } from "@/lib/db";
import AdminNav from "../AdminNav";
import { createTaskAction, removeTaskAction, setTaskStatusAction } from "./actions";
import { TASK_STATUSES } from "@/lib/tasks";

export const metadata = { title: "Tâches · Kids Tech-nuru Lab", robots: { index: false } };
export const dynamic = "force-dynamic";

const field = "rounded-xl border border-ink/15 bg-white px-3 py-2 text-sm outline-none focus:border-brand focus:ring-4 focus:ring-brand/15";

const ERRORS: Record<string, string> = {
  title: "Indiquez un titre pour la tâche.",
  status: "Statut invalide.",
  forbidden: "Vous ne pouvez modifier que vos propres tâches.",
};

const TONE: Record<string, string> = {
  "À faire": "bg-coral/15 text-[#b3261e]",
  "En cours": "bg-accent/30 text-[#8a5a00]",
  Fait: "bg-mint/20 text-[#0b7a63]",
};

export default async function TachesPage({ searchParams }: { searchParams: Promise<{ saved?: string; error?: string }> }) {
  const session = await currentSession();
  if (!session) redirect("/admin");
  const { saved, error } = await searchParams;
  const isBoss = session.kind === "super";

  const [tasks, members] = await Promise.all([
    listTasks(isBoss ? undefined : session.id),
    isBoss ? getTeamUsers() : Promise.resolve([]),
  ]);
  const open = tasks.filter((t) => t.status !== "Fait");

  return (
    <div className="bg-dots-dark min-h-[calc(100vh-130px)] bg-sky/50">
      <div className="mx-auto max-w-4xl px-4 py-10">
        {isBoss && <a href="/admin" className="text-sm font-semibold text-brand hover:underline">← Espace équipe</a>}
        <AdminNav current="/admin/taches" member={!isBoss} />
        <div className="mt-5">
          <PageIntro eyebrow={isBoss ? "Responsable" : "Mes tâches"} title={isBoss ? "Tâches de l'équipe" : `Bonjour ${session.name}`}>
            {open.length === 0 ? "Aucune tâche en cours." : `${open.length} tâche(s) à faire ou en cours.`}
          </PageIntro>
        </div>

        {saved === "1" && <p className="mb-4 rounded-xl bg-mint/15 p-3 text-sm font-semibold text-[#0b7a63] ring-1 ring-mint/40">Enregistré.</p>}
        {error && (
          <p className="mb-4 rounded-xl bg-coral/10 p-3 text-sm font-semibold text-[#b3261e] ring-1 ring-coral/40" role="alert">
            {ERRORS[error] ?? "Erreur."}
          </p>
        )}

        {isBoss && (
          <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-ink/10">
            <h2 className="text-lg font-extrabold">Nouvelle tâche</h2>
            <form action={createTaskAction} className="mt-4 grid gap-3 sm:grid-cols-2">
              <input name="title" required placeholder="Ce qu'il faut faire" className={`${field} sm:col-span-2`} aria-label="Titre" />
              <textarea name="description" rows={2} placeholder="Détails (facultatif)" className={`${field} sm:col-span-2`} aria-label="Détails" />
              <select name="assigneeId" defaultValue="" className={field} aria-label="Assigner à">
                <option value="">Non assignée</option>
                {members.filter((m) => m.active).map((m) => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
              <input name="dueDate" type="date" className={field} aria-label="Échéance" />
              <button className="rounded-full bg-accent px-5 py-2.5 font-bold text-ink shadow-sm sm:col-span-2 sm:justify-self-start">Créer la tâche</button>
            </form>
          </section>
        )}

        <section className="mt-6 space-y-3">
          {tasks.length === 0 ? (
            <p className="rounded-2xl bg-white p-8 text-center text-ink/60 ring-1 ring-ink/10">Aucune tâche.</p>
          ) : (
            tasks.map((t) => <TaskCard key={t.id} task={t} isBoss={isBoss} />)
          )}
        </section>
      </div>
    </div>
  );
}

function TaskCard({ task: t, isBoss }: { task: Task; isBoss: boolean }) {
  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-ink/10">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className={`font-bold ${t.status === "Fait" ? "text-ink/50 line-through" : ""}`}>{t.title}</p>
          {t.description && <p className="mt-1 text-sm text-ink/70">{t.description}</p>}
          <p className="mt-1 text-xs text-ink/55">
            {isBoss && <>Assignée à : {t.assigneeName ?? "personne"} · </>}
            {t.dueDate ? `Échéance ${new Date(`${t.dueDate}T12:00:00Z`).toLocaleDateString("fr-FR", { day: "numeric", month: "long", timeZone: "UTC" })}` : "Sans échéance"}
          </p>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-bold ${TONE[t.status] ?? "bg-ink/10"}`}>{t.status}</span>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-ink/10 pt-4">
        <form action={setTaskStatusAction} className="flex items-center gap-2">
          <input type="hidden" name="id" value={t.id} />
          <select name="status" defaultValue={t.status} className="rounded-xl border border-ink/15 bg-white px-3 py-1.5 text-sm" aria-label="Statut">
            {TASK_STATUSES.map((s) => <option key={s}>{s}</option>)}
          </select>
          <button className="rounded-full bg-ink px-4 py-1.5 text-xs font-bold text-white">Mettre à jour</button>
        </form>
        {isBoss && (
          <form action={removeTaskAction} className="ml-auto">
            <input type="hidden" name="id" value={t.id} />
            <button className="text-xs font-semibold text-[#b3261e] hover:underline">Supprimer</button>
          </form>
        )}
      </div>
    </div>
  );
}
