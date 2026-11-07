"use server";

import { revalidatePath } from "next/cache";
import { LINE_SLOTS } from "@/lib/business";
import { MAX_BLOCKS, parseSlots } from "@/lib/schedule";
import { normalizeUsername } from "@/lib/passwords";
import { verifyPassword } from "@/lib/passwords";
import { getTeamUserByUsername } from "@/lib/db";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import {
  checkPassword,
  clearAdminCookie,
  isAdmin,
  setAdminCookie,
} from "@/lib/auth";
import { saveFile } from "@/lib/storage";
import {
  addPayment,
  addReminder,
  cancelPayment,
  clearLoginFailures,
  loginLockMinutes,
  recordLoginFailure,
  removeRegistration,
  saveAttendance,
  setCapacity,
  addExpense,
  updateExpense,
  removeExpense,
  countExpenses,
  addGalleryItem,
  removeGalleryItem,
  saveSkillTest,
  setChildFlags,
  TEACHER_STATUSES,
  updateTeacherRequest,
  DOSSIER_STATUSES,
  updateDossier,
  setSetting,
  setParityTarget,
  type Level,
  type Phase,
  type SkillResult,
} from "@/lib/db";

async function clientIp() {
  // Derrière Caddy, X-Forwarded-For contient l'IP réelle ; on prend la dernière valeur ajoutée par le proxy.
  const h = await headers();
  const xff = h.get("x-forwarded-for");
  const ip = xff ? xff.split(",").pop()!.trim() : h.get("x-real-ip");
  return (ip || "inconnue").slice(0, 64);
}

export async function login(f: FormData) {
  const ip = await clientIp();
  const wait = await loginLockMinutes(ip);
  if (wait > 0) redirect(`/admin?error=locked&wait=${wait}`);

  const username = normalizeUsername(String(f.get("username") ?? ""));
  const password = String(f.get("password") ?? "");

  // Sans identifiant (ou « super ») : responsable. Sinon : membre de l'équipe.
  let who: { kind: "super" } | { kind: "user"; id: string } | null = null;
  if (!username || username === "super") {
    if (checkPassword(password)) who = { kind: "super" };
  } else {
    const user = await getTeamUserByUsername(username);
    if (user && user.active && (await verifyPassword(password, user.passwordHash))) {
      who = { kind: "user", id: user.id };
    }
  }

  if (!who) {
    await recordLoginFailure(ip);
    const after = await loginLockMinutes(ip);
    redirect(after > 0 ? `/admin?error=locked&wait=${after}` : "/admin?error=1");
  }
  await clearLoginFailures(ip);
  await setAdminCookie(who);
  redirect(who.kind === "user" ? "/admin/taches" : "/admin");
}

export async function logout() {
  await clearAdminCookie();
  redirect("/admin");
}

export async function recordPayment(f: FormData) {
  if (!(await isAdmin())) redirect("/admin");
  const registrationId = String(f.get("registrationId") ?? "");
  const amount = Number(f.get("amount"));
  const currency = f.get("currency") === "CDF" ? "CDF" : "USD";
  const month = String(f.get("month") ?? "");
  if (!registrationId || !(amount > 0) || !/^\d{4}-\d{2}$/.test(month)) return;
  const id = await addPayment({
    registrationId,
    amount,
    currency,
    month,
  });
  revalidatePath("/admin");
  redirect(`/admin/recu/${id}`);
}

export async function cancelPaymentAction(f: FormData) {
  if (!(await isAdmin())) redirect("/admin");
  const id = String(f.get("id") ?? "");
  const reason = String(f.get("reason") ?? "").trim().slice(0, 300);
  if (!id) return;
  if (reason.length < 3) redirect(`/admin/recu/${id}?error=reason`);
  await cancelPayment(id, reason);
  revalidatePath("/admin");
  redirect(`/admin/recu/${id}`);
}

/** Note qu'une relance WhatsApp vient d'être ouverte (l'envoi est fait à la main par l'équipe). */
export async function logReminder(registrationId: string, month: string) {
  if (!(await isAdmin())) return;
  if (!/^\d{4}-\d{2}$/.test(month)) return;
  await addReminder(registrationId, month);
  revalidatePath("/admin");
}

export async function deleteRegistration(f: FormData) {
  if (!(await isAdmin())) redirect("/admin");
  await removeRegistration(String(f.get("id") ?? ""));
  revalidatePath("/admin");
}

/** Enregistre la présence d'une séance (les cases cochées sont présentes, les autres absentes). */
export async function saveAttendanceAction(f: FormData) {
  if (!(await isAdmin())) redirect("/admin");
  const date = String(f.get("date") ?? "");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) redirect("/admin/presence");
  const present = f.getAll("present").map(String);
  const challenge = f.getAll("challenge").map(String);
  const helped = f.getAll("helped").map(String);
  await saveAttendance(date, present, challenge, helped);
  revalidatePath("/admin/presence");
  redirect(`/admin/presence?date=${date}&saved=1`);
}

const LEVEL_NAMES: Level[] = ["Éveil", "Explorateur", "Créateur"];

/** Enregistre les horaires de la séance : heure de début, blocs et créneaux proposés. */
export async function saveScheduleAction(f: FormData) {
  if (!(await isAdmin())) redirect("/admin");
  const blocks = Array.from({ length: MAX_BLOCKS }, (_, i) => ({
    label: text(f, `blockLabel${i}`, 80),
    minutes: Math.round(Number(f.get(`blockMin${i}`))),
  })).filter((b) => b.label && Number.isFinite(b.minutes) && b.minutes >= 1 && b.minutes <= 240);
  const start = String(f.get("start") ?? "").trim();
  await setSetting(
    "session_schedule",
    JSON.stringify({
      start: /^([01]\d|2[0-3]):[0-5]\d$/.test(start) ? start : null,
      blocks,
      slots: parseSlots(String(f.get("slots") ?? "")),
    }),
  );
  revalidatePath("/");
  revalidatePath("/programme");
  revalidatePath("/sondage");
  revalidatePath("/admin/reglages");
  redirect("/admin/reglages?schedule=1");
}

export async function saveCapacitiesAction(f: FormData) {
  if (!(await isAdmin())) redirect("/admin");
  for (const level of LEVEL_NAMES) {
    const n = Math.floor(Number(f.get(`capacity:${level}`)));
    if (n >= 1 && n <= 100) await setCapacity(level, n);
  }
  revalidatePath("/admin");
  redirect("/admin/reglages?saved=1");
}

function text(f: FormData, k: string, max = 200) {
  return String(f.get(k) ?? "").trim().slice(0, max);
}

export async function addExpenseAction(f: FormData) {
  if (!(await isAdmin())) redirect("/admin");
  const label = text(f, "label");
  if (!label) redirect("/admin/budget");
  const unit = String(f.get("unitPrice") ?? "").trim();
  await addExpense({
    label,
    quantity: Math.max(0, Number(f.get("quantity")) || 1),
    unitPrice: unit === "" ? null : Number(unit),
    currency: f.get("currency") === "CDF" ? "CDF" : "USD",
    supplier: text(f, "supplier"),
    status: text(f, "status", 60) || "À demander",
  });
  revalidatePath("/admin/budget");
  redirect("/admin/budget");
}

export async function updateExpenseAction(f: FormData) {
  if (!(await isAdmin())) redirect("/admin");
  const id = text(f, "id", 20);
  const unit = String(f.get("unitPrice") ?? "").trim();
  await updateExpense(id, {
    quantity: Math.max(0, Number(f.get("quantity")) || 0),
    unitPrice: unit === "" ? null : Number(unit),
    currency: f.get("currency") === "CDF" ? "CDF" : "USD",
    supplier: text(f, "supplier"),
    status: text(f, "status", 60),
  });
  revalidatePath("/admin/budget");
  redirect("/admin/budget");
}

export async function deleteExpenseAction(f: FormData) {
  if (!(await isAdmin())) redirect("/admin");
  await removeExpense(text(f, "id", 20));
  revalidatePath("/admin/budget");
  redirect("/admin/budget");
}

/** Importe le CSV du budget (une seule fois : refusé si des lignes existent déjà). */
export async function importBudgetAction(f: FormData) {
  if (!(await isAdmin())) redirect("/admin");
  const file = f.get("file");
  if (!(file instanceof File) || file.size === 0 || file.size > 200_000) redirect("/admin/budget?import=invalid");
  if ((await countExpenses()) > 0) redirect("/admin/budget?import=exists");

  const lines = (await file.text()).split(/\r?\n/).slice(1);
  let imported = 0;
  for (const line of lines) {
    const [poste = "", qte = "", unit = "", , supplier = "", statut = ""] = line.split(";").map((c) => c.trim());
    if (!poste || /^total/i.test(poste)) continue;
    await addExpense({
      label: poste.slice(0, 200),
      quantity: Math.max(0, Number(qte.replace(",", ".")) || 1),
      unitPrice: unit === "" ? null : Number(unit.replace(",", ".")) || null,
      currency: "USD",
      supplier: supplier.slice(0, 200),
      status: statut.slice(0, 60) || "À demander",
    });
    imported++;
  }
  revalidatePath("/admin/budget");
  redirect(`/admin/budget?import=ok&n=${imported}`);
}

const PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp"];
const PHOTO_MAX = 2 * 1024 * 1024;

export async function addGalleryAction(f: FormData) {
  if (!(await isAdmin())) redirect("/admin");
  const title = text(f, "title", 120);
  if (!title) redirect("/admin/galerie?error=title");
  const regId = text(f, "registrationId", 64);
  const file = f.get("photo");
  let storageKey: string | null = null;
  let photoType: string | null = null;
  if (file instanceof File && file.size > 0) {
    if (!PHOTO_TYPES.includes(file.type) || file.size > PHOTO_MAX) redirect("/admin/galerie?error=photo");
    storageKey = await saveFile("gallery", Buffer.from(await file.arrayBuffer()), file.type);
    photoType = file.type;
  }
  await addGalleryItem({
    registrationId: regId || null,
    title,
    description: text(f, "description", 500),
    photoType,
    storageKey,
  });
  revalidatePath("/admin/galerie");
  redirect("/admin/galerie?saved=1");
}

export async function updateChildFlagsAction(f: FormData) {
  if (!(await isAdmin())) redirect("/admin");
  const id = text(f, "id", 64);
  if (!id) redirect("/admin");
  const g = f.get("gender");
  const gender = g === "Fille" || g === "Garçon" ? g : "";
  await setChildFlags(id, gender, f.get("solidarity") === "on");
  revalidatePath("/admin");
  redirect(`/admin/fiche/${id}?saved=1`);
}

const MODEL_FIELDS = [
  "fee", "reductionPct", "samedisParMois", "tauxAnimateur", "salleMois",
  "assuranceMois", "adminMois", "sponsorsMois", "amortissementMois", "enfantsParAnimateur",
] as const;

const NOTE_FIELDS = ["intro", "revenues", "costs", "threshold", "conclusion"] as const;

/** Enregistre le modèle économique : hypothèses, lignes libres et textes d'explication. */
export async function saveModelAction(f: FormData) {
  if (!(await isAdmin())) redirect("/admin");

  const assumptions: Record<string, unknown> = {};
  for (const k of MODEL_FIELDS) {
    const n = Number(f.get(k));
    assumptions[k] = Number.isFinite(n) && n >= 0 ? n : 0;
  }
  assumptions.reductionPct = Math.min(100, assumptions.reductionPct as number);
  assumptions.enfantsParAnimateur = Math.max(1, assumptions.enfantsParAnimateur as number);
  assumptions.amortissementMois = Math.max(1, assumptions.amortissementMois as number);

  // Effectifs prévus : champ vide = utiliser les inscriptions réelles.
  const optionalCount = (k: string) => {
    const raw = String(f.get(k) ?? "").trim();
    if (raw === "") return null;
    const n = Number(raw);
    return Number.isFinite(n) && n >= 0 ? Math.round(n) : null;
  };
  const par = {
    eveil: optionalCount("prevEveil"),
    explorateur: optionalCount("prevExplorateur"),
    createur: optionalCount("prevCreateur"),
  };
  assumptions.prevusParNiveau = par;
  assumptions.solidairesPrevues = optionalCount("solidairesPrevues");

  // Une ligne est supprimée si la case « Supprimer » est cochée, ou si son libellé ou son montant est vide.
  const lines = (prefix: "rev" | "cost") =>
    Array.from({ length: LINE_SLOTS }, (_, i) => ({
      label: text(f, `${prefix}Label${i}`, 120),
      amount: Number(f.get(`${prefix}Amount${i}`)) || 0,
      deleted: f.get(`${prefix}Del${i}`) === "on",
    }))
      .filter((l) => !l.deleted && l.label && l.amount > 0)
      .map(({ label, amount }) => ({ label, amount }));

  const notes: Record<string, string> = {};
  for (const k of NOTE_FIELDS) notes[k] = text(f, `note_${k}`, 1200);

  await setSetting(
    "business_model",
    JSON.stringify({ assumptions, revenues: lines("rev"), costs: lines("cost"), notes }),
  );
  revalidatePath("/admin/modele");
  redirect("/admin/modele?saved=1");
}

export async function updateDossierAction(f: FormData) {
  if (!(await isAdmin())) redirect("/admin");
  const id = text(f, "id", 20);
  const status = text(f, "status", 40);
  if (!id || !(DOSSIER_STATUSES as readonly string[]).includes(status)) redirect("/admin/dossiers");
  await updateDossier(id, status, text(f, "note", 500));
  revalidatePath("/admin/dossiers");
  redirect("/admin/dossiers?saved=1");
}

export async function updateTeacherRequestAction(f: FormData) {
  if (!(await isAdmin())) redirect("/admin");
  const id = text(f, "id", 20);
  const status = text(f, "status", 40);
  if (!id || !(TEACHER_STATUSES as readonly string[]).includes(status)) redirect("/admin/enseignants");
  await updateTeacherRequest(id, status, text(f, "note", 500));
  revalidatePath("/admin/enseignants");
  redirect("/admin/enseignants?saved=1");
}

export async function saveParityAction(f: FormData) {
  if (!(await isAdmin())) redirect("/admin");
  const pct = Math.floor(Number(f.get("parityTarget")));
  if (pct >= 0 && pct <= 100) await setParityTarget(pct);
  revalidatePath("/admin");
  redirect("/admin/reglages?saved=1");
}

/** Enregistre le test d'entrée ou de sortie d'un enfant (4 compétences). */
export async function saveSkillTestAction(f: FormData) {
  if (!(await isAdmin())) redirect("/admin");
  const id = text(f, "id", 64);
  const phase: Phase = f.get("phase") === "sortie" ? "sortie" : "entree";
  if (!id) redirect("/admin/tests");
  const s = [1, 2, 3, 4].map((i) => f.get(`s${i}`) === "on") as SkillResult;
  await saveSkillTest(id, phase, s);
  revalidatePath("/admin/tests");
  redirect(`/admin/tests?saved=${phase}`);
}

export async function deleteGalleryAction(f: FormData) {
  if (!(await isAdmin())) redirect("/admin");
  await removeGalleryItem(text(f, "id", 20));
  revalidatePath("/admin/galerie");
  redirect("/admin/galerie");
}
