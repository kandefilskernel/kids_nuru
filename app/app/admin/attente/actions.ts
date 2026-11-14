"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/auth";
import { promoteFromWaitlist, removeFromWaitlist } from "@/lib/db";

function id(f: FormData) {
  const v = String(f.get("id") ?? "").trim();
  return /^\d{1,18}$/.test(v) ? v : null;
}

/** Inscrit l'enfant s'il reste une place dans son niveau. */
export async function promoteAction(f: FormData) {
  if (!(await isAdmin())) redirect("/admin");
  const wid = id(f);
  if (!wid) redirect("/admin/attente?error=missing");
  const res = await promoteFromWaitlist(wid);
  revalidatePath("/admin");
  revalidatePath("/admin/attente");
  if (!res.ok) redirect(`/admin/attente?error=${res.reason}`);
  redirect(`/admin/attente?promoted=${res.registrationId}`);
}

/** Retire une demande de la liste d'attente (le parent a renoncé, doublon…). */
export async function removeWaitlistAction(f: FormData) {
  if (!(await isAdmin())) redirect("/admin");
  const wid = id(f);
  if (wid) await removeFromWaitlist(wid);
  revalidatePath("/admin/attente");
  redirect("/admin/attente?removed=1");
}
