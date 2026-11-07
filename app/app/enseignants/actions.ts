"use server";

import { redirect } from "next/navigation";
import { addTeacherRequest } from "@/lib/db";
import { saveFile } from "@/lib/storage";

const TYPES = ["application/pdf", "image/jpeg", "image/png"];
const MAX_SIZE = 5 * 1024 * 1024;

function str(f: FormData, k: string, max = 200) {
  return String(f.get(k) ?? "").trim().slice(0, max);
}

export async function submitTeacherRequest(f: FormData) {
  const name = str(f, "name", 120);
  const phone = str(f, "phone", 30);
  const format = str(f, "format", 120);
  if (!name || !phone || !format || !/^[+\d][\d\s-]{6,}$/.test(phone)) {
    redirect("/enseignants?error=1");
  }
  const levels = f.getAll("levels").map(String).filter((l) => ["Éveil", "Explorateur", "Créateur"].includes(l));

  // Pièce jointe facultative : PDF, JPEG ou PNG, 5 Mo maximum.
  const file = f.get("file");
  let attachment: { name: string; type: string; size: number; storageKey: string } | null = null;
  if (file instanceof File && file.size > 0) {
    if (!TYPES.includes(file.type) || file.size > MAX_SIZE) redirect("/enseignants?error=file");
    const bytes = Buffer.from(await file.arrayBuffer());
    attachment = {
      name: file.name.replace(/[^\w.\- ]/g, "_").slice(0, 120),
      type: file.type,
      size: bytes.length,
      storageKey: await saveFile("enseignants", bytes, file.type),
    };
  }

  await addTeacherRequest({
    file: attachment,
    name,
    school: str(f, "school", 160),
    role: str(f, "role", 80),
    phone,
    levels: levels.join(", "),
    pupils: str(f, "pupils", 20),
    format,
    slot: str(f, "slot", 120),
    message: str(f, "message", 800),
  });
  redirect("/enseignants?merci=1");
}
