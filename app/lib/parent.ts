// Accès des parents au suivi de leur enfant : code de suivi, session signée.
// Aucune donnée ici n'est liée à un autre enfant que celui de la session.

import { createHmac, randomInt, timingSafeEqual } from "crypto";

export const PARENT_COOKIE = "nuru_parent";
export const PARENT_SESSION_HOURS = 8;

// Alphabet sans caractères ambigus (pas de 0/O, 1/I/L).
const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
const CODE_LENGTH = 8;

/** Code de suivi à transmettre au parent, par ex. « K7QF3M2Z ». */
export function newAccessCode(): string {
  let out = "";
  for (let i = 0; i < CODE_LENGTH; i++) out += ALPHABET[randomInt(ALPHABET.length)];
  return out;
}

/** Normalise un code saisi : majuscules, sans espaces ni tirets. */
export function normalizeCode(raw: string): string {
  return raw.toUpperCase().replace(/[\s-]/g, "").slice(0, 16);
}

function secret(): string {
  const s = process.env.PARENT_SECRET ?? process.env.ADMIN_PASSWORD;
  if (!s) throw new Error("PARENT_SECRET (ou ADMIN_PASSWORD) doit être défini");
  return s;
}

function sign(payload: string): string {
  return createHmac("sha256", secret()).update(`parent:${payload}`).digest("hex");
}

/** Valeur du cookie : identifiant de l'enfant, échéance, signature. */
export function signParentSession(registrationId: string, now = Date.now()): string {
  const exp = now + PARENT_SESSION_HOURS * 3600_000;
  const payload = `${registrationId}.${exp}`;
  return `${payload}.${sign(payload)}`;
}

/** Renvoie l'identifiant de l'enfant si la session est valide et non expirée, sinon null. */
export function readParentSession(value: string | undefined, now = Date.now()): string | null {
  if (!value) return null;
  const parts = value.split(".");
  if (parts.length !== 3) return null;
  const [id, exp, sig] = parts;
  if (!/^[0-9a-f-]{36}$/.test(id) || !/^\d+$/.test(exp) || Number(exp) < now) return null;
  const expected = Buffer.from(sign(`${id}.${exp}`));
  const given = Buffer.from(sig);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return null;
  return id;
}
