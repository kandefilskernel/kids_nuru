import { randomUUID } from "crypto";
import { mkdir, readFile, unlink, writeFile } from "fs/promises";
import path from "path";

/**
 * Stockage des fichiers téléversés (photos de la galerie, dossiers, pièces jointes).
 * Les octets ne sont pas stockés en base : seule une clé relative est enregistrée.
 *
 * - Si SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY sont définis, les fichiers vont dans un bucket Supabase
 *   privé (requis sur Vercel, dont le disque est en lecture seule). Le bucket se nomme SUPABASE_BUCKET
 *   (par défaut « nuru-files »).
 * - Sinon, les fichiers sont écrits dans UPLOAD_DIR (par défaut app/uploads, hors du dossier public).
 *
 * Dans les deux cas, les fichiers ne sont jamais servis directement : tout passe par les routes de l'application.
 */

export type StorageKind = "gallery" | "dossiers" | "enseignants";

const ROOT = process.env.UPLOAD_DIR ?? path.join(process.cwd(), "uploads");
const SB_URL = process.env.SUPABASE_URL?.replace(/\/$/, "");
const SB_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const BUCKET = process.env.SUPABASE_BUCKET ?? "nuru-files";
const REMOTE = !!(SB_URL && SB_KEY);

const EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "application/pdf": "pdf",
};

const KEY_RE = /^(gallery|dossiers|enseignants)\/[0-9a-f-]{36}\.(jpg|png|webp|pdf)$/;

function checkKey(key: string): string {
  if (!KEY_RE.test(key)) throw new Error("Clé de fichier invalide");
  return key;
}

function diskPath(key: string): string {
  return path.join(ROOT, checkKey(key));
}

function remoteUrl(key: string): string {
  return `${SB_URL}/storage/v1/object/${BUCKET}/${checkKey(key)}`;
}

/** Enregistre les octets et renvoie la clé à stocker en base. */
export async function saveFile(kind: StorageKind, data: Buffer, mime: string): Promise<string> {
  const ext = EXT[mime];
  if (!ext) throw new Error("Type de fichier non pris en charge");
  const key = `${kind}/${randomUUID()}.${ext}`;
  if (REMOTE) {
    const res = await fetch(remoteUrl(key), {
      method: "POST",
      headers: {
        Authorization: `Bearer ${SB_KEY}`,
        apikey: SB_KEY!,
        "Content-Type": mime,
        "x-upsert": "false",
      },
      body: new Uint8Array(data),
    });
    if (!res.ok) throw new Error(`Stockage indisponible (HTTP ${res.status})`);
    return key;
  }
  const full = diskPath(key);
  await mkdir(path.dirname(full), { recursive: true });
  await writeFile(full, data, { flag: "wx" });
  return key;
}

export async function readStoredFile(key: string): Promise<Buffer> {
  if (REMOTE) {
    const res = await fetch(remoteUrl(key), {
      headers: { Authorization: `Bearer ${SB_KEY}`, apikey: SB_KEY! },
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`Fichier introuvable (HTTP ${res.status})`);
    return Buffer.from(await res.arrayBuffer());
  }
  return readFile(diskPath(key));
}

export async function removeStoredFile(key: string): Promise<void> {
  if (REMOTE) {
    await fetch(`${SB_URL}/storage/v1/object/${BUCKET}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${SB_KEY}`, apikey: SB_KEY!, "Content-Type": "application/json" },
      body: JSON.stringify({ prefixes: [checkKey(key)] }),
    }).catch(() => undefined);
    return;
  }
  await unlink(diskPath(key)).catch(() => undefined);
}

/**
 * Octets d'un fichier : depuis le stockage si une clé existe, sinon depuis l'ancienne
 * colonne binaire (données antérieures à la migration). Renvoie null si introuvable.
 */
export async function fileBytes(row: { storage_key: string | null; data: Buffer | null }): Promise<Buffer | null> {
  if (row.storage_key) {
    try {
      return await readStoredFile(row.storage_key);
    } catch {
      return null;
    }
  }
  return row.data;
}
