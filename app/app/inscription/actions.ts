"use server";

import { addRegistration, addToWaitlist, countByLevel, getCapacities, levelForAge, type Registration } from "@/lib/db";

export type FormState = { ok: boolean; waitlisted?: boolean; error?: string; message?: string };

function str(f: FormData, k: string, max = 200) {
  return String(f.get(k) ?? "").trim().slice(0, max);
}

export async function register(_prev: FormState, f: FormData): Promise<FormState> {
  const childName = str(f, "childName");
  const parentName = str(f, "parentName");
  const phone = str(f, "phone", 30);
  const age = Number(str(f, "age", 3));
  const level = levelForAge(age);

  if (!childName || !parentName || !phone) {
    return { ok: false, error: "Merci de remplir les champs obligatoires." };
  }
  if (!/^[+\d][\d\s-]{6,}$/.test(phone)) {
    return { ok: false, error: "Numéro de téléphone invalide." };
  }
  if (!level) {
    return { ok: false, error: "L'atelier accueille les enfants de 5 à 12 ans." };
  }
  if (f.get("parentalConsent") !== "on") {
    return { ok: false, error: "L'autorisation parentale est obligatoire." };
  }
  const genderRaw = str(f, "gender", 10);
  if (genderRaw !== "Fille" && genderRaw !== "Garçon") {
    return { ok: false, error: "Merci d'indiquer si l'enfant est une fille ou un garçon." };
  }

  const child: Omit<Registration, "id" | "createdAt"> = {
    childName,
    age,
    level,
    school: str(f, "school"),
    health: str(f, "health", 500),
    parentName,
    phone,
    momoNumber: str(f, "momoNumber", 30),
    emergencyContact: str(f, "emergencyContact"),
    photoConsent: f.get("photoConsent") === "on",
    gender: genderRaw,
    solidarity: f.get("solidarity") === "on",
  };

  // Niveau complet : l'enfant passe en liste d'attente au lieu d'être refusé.
  const [capacity, counts] = await Promise.all([getCapacities(), countByLevel()]);
  if (counts[level] >= capacity[level]) {
    const position = await addToWaitlist(child);
    return {
      ok: true,
      waitlisted: true,
      message:
        `Le niveau ${level} est complet pour le moment : ${childName} est inscrit(e) sur la liste d'attente ` +
        `(position ${position}). Nous vous contacterons sur WhatsApp dès qu'une place se libère.`,
    };
  }

  await addRegistration(child);

  return {
    ok: true,
    message: `Inscription enregistrée : ${childName} est inscrit(e) au niveau ${level}. Nous vous contacterons sur WhatsApp.`,
  };
}
