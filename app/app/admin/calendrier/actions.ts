"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/auth";
import { cleanDates, MAX_SESSIONS, weeklyDates } from "@/lib/calendar";
import { setSetting } from "@/lib/db";

async function save(dates: string[]) {
  await setSetting("pilot_dates", JSON.stringify(cleanDates(dates)));
  revalidatePath("/admin/calendrier");
  revalidatePath("/programme");
  revalidatePath("/parent/suivi");
}

/** Enregistre les dates saisies une à une (champs vides ignorés). */
export async function saveDatesAction(f: FormData) {
  if (!(await isAdmin())) redirect("/admin");
  const dates = Array.from({ length: MAX_SESSIONS }, (_, i) => String(f.get(`date${i}`) ?? ""));
  await save(dates);
  redirect("/admin/calendrier?saved=1");
}

/** Remplit le calendrier : une séance par semaine à partir d'une date. */
export async function generateDatesAction(f: FormData) {
  if (!(await isAdmin())) redirect("/admin");
  const dates = weeklyDates(String(f.get("start") ?? ""), Number(f.get("count")) || 6);
  if (dates.length === 0) redirect("/admin/calendrier?error=start");
  await save(dates);
  redirect("/admin/calendrier?saved=1");
}
