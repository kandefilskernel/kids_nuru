import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { getTeamUser } from "@/lib/db";

const COOKIE = "nuru_admin";
const HOURS = 8;

export type Session =
  | { kind: "super" }
  | { kind: "user"; id: string; username: string; name: string };

function secret(): string {
  const pw = process.env.ADMIN_PASSWORD;
  if (!pw) throw new Error("ADMIN_PASSWORD n'est pas défini");
  return pw;
}

function sign(payload: string): string {
  return createHmac("sha256", secret()).update(`nuru-admin-session:${payload}`).digest("hex");
}

export function adminConfigured() {
  return !!process.env.ADMIN_PASSWORD;
}

/** Vérifie le mot de passe du responsable (super admin). */
export function checkPassword(input: string) {
  const pw = process.env.ADMIN_PASSWORD;
  if (!pw) return false;
  // Comparaison en temps constant de deux empreintes de même longueur.
  const a = createHmac("sha256", "compare").update(input).digest();
  const b = createHmac("sha256", "compare").update(pw).digest();
  return timingSafeEqual(a, b);
}

/** Ouvre une session. Un membre est identifié par son id ; le responsable par « super ». */
export async function setAdminCookie(who: { kind: "super" } | { kind: "user"; id: string }) {
  const exp = Date.now() + HOURS * 3600_000;
  const payload = who.kind === "super" ? `super.${exp}` : `user.${who.id}.${exp}`;
  (await cookies()).set(COOKIE, `${payload}.${sign(payload)}`, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: HOURS * 3600,
  });
}

export async function clearAdminCookie() {
  (await cookies()).delete(COOKIE);
}

/** Session courante, vérifiée : signature, échéance, et membre toujours actif. */
export async function currentSession(): Promise<Session | null> {
  const value = (await cookies()).get(COOKIE)?.value;
  if (!value || !adminConfigured()) return null;
  const parts = value.split(".");
  const sig = parts.pop() ?? "";
  const payload = parts.join(".");
  const expected = Buffer.from(sign(payload));
  const given = Buffer.from(sig);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return null;

  if (parts[0] === "super" && parts.length === 2) {
    return Date.now() < Number(parts[1]) ? { kind: "super" } : null;
  }
  if (parts[0] === "user" && parts.length === 3) {
    if (Date.now() >= Number(parts[2])) return null;
    const user = await getTeamUser(parts[1]);
    if (!user || !user.active) return null; // désactivé : accès coupé immédiatement
    return { kind: "user", id: user.id, username: user.username, name: user.name };
  }
  return null;
}

/** Responsable uniquement : accès aux pages de gestion. */
export async function isAdmin() {
  return (await currentSession())?.kind === "super";
}

/** Membre de l'équipe (sans être responsable) : accès à ses tâches. */
export async function currentMember() {
  const s = await currentSession();
  return s?.kind === "user" ? s : null;
}
