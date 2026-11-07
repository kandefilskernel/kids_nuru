"use server";

import { redirect } from "next/navigation";
import { addDossier, getDossierStatusFor } from "@/lib/db";
import { saveFile } from "@/lib/storage";

const TYPES = ["application/pdf", "image/jpeg", "image/png"];
const MAX_SIZE = 5 * 1024 * 1024;

function str(f: FormData, k: string, max = 200) {
  return String(f.get(k) ?? "").trim().slice(0, max);
}

export async function submitDossier(f: FormData) {
  const name = str(f, "name", 120);
  const phone = str(f, "phone", 30);
  const category = str(f, "category", 60);
  const file = f.get("file");
  if (!name || !/^[+\d][\d\s-]{6,}$/.test(phone) || !category) redirect("/depot?error=fields");
  if (!(file instanceof File) || file.size === 0) redirect("/depot?error=file");
  if (!TYPES.includes(file.type) || file.size > MAX_SIZE) redirect("/depot?error=file");

  const bytes = Buffer.from(await file.arrayBuffer());
  const storageKey = await saveFile("dossiers", bytes, file.type);
  const id = await addDossier({
    name,
    phone,
    category,
    description: str(f, "description", 600),
    fileName: file.name.replace(/[^\w.\- ]/g, "_").slice(0, 120),
    fileType: file.type,
    fileSize: bytes.length,
    storageKey,
  });
  redirect(`/depot?merci=${id}`);
}

export type StatusState = { found?: { status: string; createdAt: string; category: string }; error?: string };

/** Le demandeur consulte le statut de son dossier avec son numéro et son téléphone. */
export async function lookupDossier(_prev: StatusState, f: FormData): Promise<StatusState> {
  const ref = str(f, "ref", 12).replace(/\D/g, "");
  const phone = str(f, "phone", 30);
  if (!ref || !phone) return { error: "Indiquez votre numéro de dossier et votre téléphone." };
  const found = await getDossierStatusFor(ref, phone);
  if (!found) return { error: "Aucun dossier ne correspond à ces informations." };
  return { found };
}
