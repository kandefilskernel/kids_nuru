"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { getRegistrationByCode, parentLockMinutes, recordParentFailure } from "@/lib/db";
import { normalizeCode, PARENT_COOKIE, PARENT_SESSION_HOURS, signParentSession } from "@/lib/parent";
import { normalizePhone } from "@/lib/whatsapp";

async function clientIp(): Promise<string> {
  const h = await headers();
  const xff = h.get("x-forwarded-for");
  const ip = xff ? xff.split(",").pop()!.trim() : h.get("x-real-ip");
  return (ip || "inconnue").slice(0, 64);
}

/** Connexion parent : code de suivi + téléphone du parent, qui doit correspondre à l'inscription. */
export async function parentLoginAction(f: FormData) {
  const ip = await clientIp();
  const wait = await parentLockMinutes(ip);
  if (wait > 0) redirect(`/parent?error=locked&wait=${wait}`);

  const code = normalizeCode(String(f.get("code") ?? ""));
  const phone = normalizePhone(String(f.get("phone") ?? ""));
  const reg = code.length >= 6 && phone ? await getRegistrationByCode(code) : null;
  const registered = reg ? normalizePhone(reg.phone) : null;

  // Même message dans tous les cas d'échec : on ne révèle pas si le code existe.
  if (!reg || !phone || registered !== phone) {
    await recordParentFailure(ip);
    const after = await parentLockMinutes(ip);
    redirect(after > 0 ? `/parent?error=locked&wait=${after}` : "/parent?error=1");
  }

  (await cookies()).set(PARENT_COOKIE, signParentSession(reg.id), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: PARENT_SESSION_HOURS * 3600,
  });
  redirect("/parent/suivi");
}

export async function parentLogoutAction() {
  (await cookies()).delete(PARENT_COOKIE);
  redirect("/parent");
}
