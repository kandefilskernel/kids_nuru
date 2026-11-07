"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/auth";
import { getAllChildHistory, getAllPayments, getRegistrations, setSetting } from "@/lib/db";
import { buildRows, train } from "@/lib/risk";

/** Entraîne le modèle sur l'historique et ne l'enregistre que s'il bat la référence. */
export async function trainRiskModelAction() {
  if (!(await isAdmin())) redirect("/admin");
  const [regs, pays, hist] = await Promise.all([getRegistrations(), getAllPayments(), getAllChildHistory()]);
  const { past } = buildRows(
    regs.map((r) => ({ id: r.id, createdAt: r.createdAt, solidarity: r.solidarity })),
    pays.map((p) => ({ registrationId: p.registrationId, month: p.month, cancelled: p.cancelledAt !== null })),
    Object.entries(hist).flatMap(([registrationId, rows]) =>
      rows.map((h) => ({ registrationId, date: h.date, present: h.present })),
    ),
    new Date().toISOString().slice(0, 7),
  );
  const res = train(past);
  await setSetting("risk_model", res.model ? JSON.stringify(res.model) : "");
  await setSetting("risk_status", res.reason);
  revalidatePath("/admin/risque");
  redirect("/admin/risque?trained=1");
}
