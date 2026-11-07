"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { currentSession, isAdmin } from "@/lib/auth";
import { addTask, getTask, removeTask, setTaskStatus } from "@/lib/db";

import { TASK_STATUSES } from "@/lib/tasks";

function text(f: FormData, k: string, max = 300) {
  return String(f.get(k) ?? "").trim().slice(0, max);
}

function refresh(): never {
  revalidatePath("/admin/taches");
  redirect("/admin/taches?saved=1");
}

/** Le responsable crée une tâche et l'assigne à un membre (ou à personne). */
export async function createTaskAction(f: FormData) {
  if (!(await isAdmin())) redirect("/admin");
  const title = text(f, "title", 160);
  if (!title) redirect("/admin/taches?error=title");
  const assignee = text(f, "assigneeId", 20);
  const due = text(f, "dueDate", 10);
  await addTask({
    title,
    description: text(f, "description", 800),
    assigneeId: /^\d+$/.test(assignee) ? assignee : null,
    dueDate: /^\d{4}-\d{2}-\d{2}$/.test(due) ? due : null,
  });
  refresh();
}

/** Mise à jour du statut : le responsable, ou le membre à qui la tâche est assignée. */
export async function setTaskStatusAction(f: FormData) {
  const session = await currentSession();
  if (!session) redirect("/admin");
  const id = text(f, "id", 20);
  const status = text(f, "status", 20);
  if (!/^\d+$/.test(id) || !(TASK_STATUSES as readonly string[]).includes(status)) redirect("/admin/taches?error=status");
  const task = await getTask(id);
  if (!task) redirect("/admin/taches?error=status");
  const allowed = session.kind === "super" || (session.kind === "user" && task.assigneeId === session.id);
  if (!allowed) redirect("/admin/taches?error=forbidden");
  await setTaskStatus(id, status);
  refresh();
}

/** Suppression : responsable uniquement. */
export async function removeTaskAction(f: FormData) {
  if (!(await isAdmin())) redirect("/admin");
  const id = text(f, "id", 20);
  if (/^\d+$/.test(id)) await removeTask(id);
  refresh();
}
