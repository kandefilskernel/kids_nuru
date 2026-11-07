import { isAdmin } from "@/lib/auth";
import { getAllChildHistory, getAllPayments, getRegistrations, getSkillTests } from "@/lib/db";

export const dynamic = "force-dynamic";

/** Échappe une cellule CSV (séparateur ;). */
function cell(v: string | number | boolean) {
  const s = typeof v === "boolean" ? (v ? "oui" : "non") : String(v);
  return /[;"\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export async function GET() {
  if (!(await isAdmin())) return new Response("Accès refusé", { status: 403 });

  // Trois requêtes au total, quel que soit le nombre d'enfants (pas une par enfant).
  const [registrations, payments, histories, tests] = await Promise.all([
    getRegistrations(),
    getAllPayments(),
    getAllChildHistory(),
    getSkillTests(),
  ]);
  const score = (v?: boolean[]) => (v ? `${v.filter(Boolean).length}/4` : "");
  const header = [
    "Enfant", "Âge", "Genre", "Niveau", "École", "Santé", "Parent", "Téléphone", "Mobile money",
    "Contact d'urgence", "Accord photos", "Place solidaire", "Payé (USD)", "Payé (CDF)",
    "Séances présent", "Défis terminés", "Entraide", "Points bilan",
    "Test entrée", "Test sortie",
    "Inscrit le",
  ];

  const lines = [header.map(cell).join(";")];
  for (const r of registrations) {
    const mine = payments.filter((p) => p.registrationId === r.id && !p.cancelledAt);
    const sum = (c: string) => mine.filter((p) => p.currency === c).reduce((s, p) => s + p.amount, 0);
    const history = histories[r.id] ?? [];
    const present = history.filter((h) => h.present).length;
    const challenges = history.filter((h) => h.challenge).length;
    const helped = history.filter((h) => h.helped).length;
    lines.push(
      [
        r.childName, r.age, r.gender, r.level, r.school, r.health, r.parentName, r.phone, r.momoNumber,
        r.emergencyContact, r.photoConsent, r.solidarity, sum("USD"), sum("CDF"),
        present, challenges, helped, present + challenges + helped,
        score(tests[r.id]?.entree), score(tests[r.id]?.sortie),
        new Date(r.createdAt).toLocaleDateString("fr-FR", { timeZone: "Africa/Lubumbashi" }),
      ]
        .map(cell)
        .join(";"),
    );
  }

  const date = new Date().toISOString().slice(0, 10);
  return new Response("﻿" + lines.join("\r\n") + "\r\n", {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="inscrits-${date}.csv"`,
    },
  });
}
