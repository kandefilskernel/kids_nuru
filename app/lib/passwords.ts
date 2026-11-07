// Mots de passe des membres de l'équipe : hachage scrypt avec sel aléatoire, comparaison en temps constant.
import { randomBytes, scrypt as scryptCb, timingSafeEqual } from "crypto";
import { promisify } from "util";

const scrypt = promisify(scryptCb) as (password: string, salt: Buffer, keylen: number) => Promise<Buffer>;

export const MIN_PASSWORD = 10;

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const key = await scrypt(password, salt, 64);
  return `scrypt$${salt.toString("hex")}$${key.toString("hex")}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [scheme, saltHex, keyHex] = stored.split("$");
  if (scheme !== "scrypt" || !saltHex || !keyHex) return false;
  const expected = Buffer.from(keyHex, "hex");
  const actual = await scrypt(password, Buffer.from(saltHex, "hex"), expected.length);
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

/** Identifiant : minuscules, chiffres, points, tirets ou tirets bas ; 3 à 32 caractères. */
export function normalizeUsername(raw: string): string {
  return raw.trim().toLowerCase();
}
export function validUsername(u: string): boolean {
  return /^[a-z0-9._-]{3,32}$/.test(u) && u !== "super";
}
