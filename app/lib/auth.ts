import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";

const COOKIE = "nuru_admin";

function token(password: string) {
  return createHmac("sha256", password).update("nuru-admin-session").digest("hex");
}

export function adminConfigured() {
  return !!process.env.ADMIN_PASSWORD;
}

export function checkPassword(input: string) {
  const pw = process.env.ADMIN_PASSWORD;
  if (!pw) return false;
  const a = Buffer.from(token(input));
  const b = Buffer.from(token(pw));
  return timingSafeEqual(a, b);
}

export async function setAdminCookie() {
  const jar = await cookies();
  jar.set(COOKIE, token(process.env.ADMIN_PASSWORD!), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 8,
  });
}

export async function clearAdminCookie() {
  (await cookies()).delete(COOKIE);
}

export async function isAdmin() {
  const pw = process.env.ADMIN_PASSWORD;
  if (!pw) return false;
  const v = (await cookies()).get(COOKIE)?.value;
  if (!v) return false;
  const a = Buffer.from(v);
  const b = Buffer.from(token(pw));
  return a.length === b.length && timingSafeEqual(a, b);
}
