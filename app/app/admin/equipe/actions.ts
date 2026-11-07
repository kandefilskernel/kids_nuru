"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/auth";
import { addTeamUser, getTeamUserByUsername, setTeamUserActive, setTeamUserPassword } from "@/lib/db";
import { hashPassword, MIN_PASSWORD, normalizeUsername, validUsername } from "@/lib/passwords";

function text(f: FormData, k: string, max = 120) {
  return String(f.get(k) ?? "").trim().slice(0, max);
}

function back(msg: string): never {
  revalidatePath("/admin/equipe");
  redirect(`/admin/equipe?${msg}`);
}

/** Crée un membre de l'équipe (responsable uniquement). */
export async function createMemberAction(f: FormData) {
  if (!(await isAdmin())) redirect("/admin");
  const username = normalizeUsername(text(f, "username", 40));
  const name = text(f, "name", 80);
  const password = String(f.get("password") ?? "");
  if (!validUsername(username)) back("error=username");
  if (!name) back("error=name");
  if (password.length < MIN_PASSWORD) back("error=password");
  if (await getTeamUserByUsername(username)) back("error=exists");
  await addTeamUser({ username, name, passwordHash: await hashPassword(password) });
  back("saved=1");
}

/** Active ou désactive un membre : une désactivation coupe son accès immédiatement. */
export async function toggleMemberAction(f: FormData) {
  if (!(await isAdmin())) redirect("/admin");
  const id = text(f, "id", 20);
  if (!/^\d+$/.test(id)) back("error=id");
  await setTeamUserActive(id, f.get("active") === "1");
  back("saved=1");
}

/** Définit un nouveau mot de passe pour un membre. */
export async function resetPasswordAction(f: FormData) {
  if (!(await isAdmin())) redirect("/admin");
  const id = text(f, "id", 20);
  const password = String(f.get("password") ?? "");
  if (!/^\d+$/.test(id)) back("error=id");
  if (password.length < MIN_PASSWORD) back("error=password");
  await setTeamUserPassword(id, await hashPassword(password));
  back("saved=1");
}
