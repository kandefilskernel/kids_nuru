"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/auth";
import { addApport, addFinanceur, removeApport, removeFinanceur } from "@/lib/db";
import type { FinanceurType, Nature } from "@/lib/finance";

const TYPES: FinanceurType[] = ["financeur", "actionnaire", "partenaire"];
const NATURES: Nature[] = ["capital", "don", "pret"];

function text(f: FormData, k: string, max = 200) {
  return String(f.get(k) ?? "").trim().slice(0, max);
}

function done(): never {
  revalidatePath("/admin/financement");
  redirect("/admin/financement?saved=1");
}

export async function addFinanceurAction(f: FormData) {
  if (!(await isAdmin())) redirect("/admin");
  const name = text(f, "name", 120);
  if (!name) redirect("/admin/financement?error=name");
  const type = text(f, "type") as FinanceurType;
  await addFinanceur({
    name,
    type: TYPES.includes(type) ? type : "financeur",
    contact: text(f, "contact", 160),
    note: text(f, "note", 300),
  });
  done();
}

export async function removeFinanceurAction(f: FormData) {
  if (!(await isAdmin())) redirect("/admin");
  const id = text(f, "id", 20);
  if (/^\d+$/.test(id)) await removeFinanceur(id);
  done();
}

export async function addApportAction(f: FormData) {
  if (!(await isAdmin())) redirect("/admin");
  const financeurId = text(f, "financeurId", 20);
  const amount = Number(f.get("amount"));
  if (!/^\d+$/.test(financeurId) || !Number.isFinite(amount) || amount <= 0) redirect("/admin/financement?error=apport");
  const currency = text(f, "currency") === "CDF" ? "CDF" : "USD";
  const nature = text(f, "nature") as Nature;
  const date = text(f, "date", 10);
  const expense = text(f, "expenseId", 20);
  await addApport({
    financeurId,
    amount: Math.round(amount * 100) / 100,
    currency,
    date: /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : new Date().toISOString().slice(0, 10),
    nature: NATURES.includes(nature) ? nature : "capital",
    expenseId: /^\d+$/.test(expense) ? expense : null,
    note: text(f, "note", 300),
  });
  done();
}

export async function removeApportAction(f: FormData) {
  if (!(await isAdmin())) redirect("/admin");
  const id = text(f, "id", 20);
  if (/^\d+$/.test(id)) await removeApport(id);
  done();
}
