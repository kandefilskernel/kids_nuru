"use server";

import { redirect } from "next/navigation";
import { addSurvey } from "@/lib/db";

function str(f: FormData, k: string, max = 200) {
  return String(f.get(k) ?? "").trim().slice(0, max);
}

export async function submitSurvey(f: FormData) {
  const childrenAges = str(f, "childrenAges", 100);
  const pilotInterest = str(f, "pilotInterest", 40);
  if (!childrenAges || !pilotInterest) redirect("/sondage?error=1");
  await addSurvey({
    childrenAges,
    neighborhood: str(f, "neighborhood", 120),
    interest: str(f, "interest", 60),
    acceptablePrice: str(f, "acceptablePrice", 60),
    maxPrice: str(f, "maxPrice", 60),
    paymentMode: str(f, "paymentMode", 60),
    bestSlot: str(f, "bestSlot", 60),
    pilotInterest,
    contact: f.get("recontact") === "on" ? str(f, "contact", 40) : "",
    comments: str(f, "comments", 500),
  });
  redirect("/sondage?merci=1");
}
