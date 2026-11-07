"use server";

import { addRegistration, countByLevel, getCapacities, levelForAge } from "@/lib/db";

export type FormState = { ok: boolean; error?: string; message?: string };

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

  const [capacity, counts] = await Promise.all([getCapacities(), countByLevel()]);
  if (counts[level] >= capacity[level]) {
    return {
      ok: false,
      error: `Le niveau ${level} est complet pour le moment. Contactez-nous sur WhatsApp pour la liste d'attente.`,
    };
  }

  await addRegistration({
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
  });

  return {
    ok: true,
    message: `Inscription enregistrée : ${childName} est inscrit(e) au niveau ${level}. Nous vous contacterons sur WhatsApp.`,
  };
}
