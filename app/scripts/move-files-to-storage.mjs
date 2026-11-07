// Déplace les fichiers stockés en base (BYTEA) vers le dossier de stockage (UPLOAD_DIR).
// Usage (depuis le dossier app/) :
//   node --env-file=.env.local scripts/move-files-to-storage.mjs --dry-run
//   node --env-file=.env.local scripts/move-files-to-storage.mjs
// Sécurité : le fichier est écrit sur disque AVANT que la ligne ne soit mise à jour ;
// si l'écriture échoue, la base n'est pas modifiée.

import { randomUUID } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import pg from "pg";

const DRY = process.argv.includes("--dry-run");
const ROOT = process.env.UPLOAD_DIR ?? path.join(process.cwd(), "uploads");
const EXT = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "application/pdf": "pdf" };

// table, colonne binaire, colonne type MIME, dossier de stockage
const TABLES = [
  { table: "gallery", bytes: "photo", mime: "photo_type", kind: "gallery" },
  { table: "dossiers", bytes: "data", mime: "file_type", kind: "dossiers" },
  { table: "teacher_requests", bytes: "data", mime: "file_type", kind: "enseignants" },
];

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL n'est pas défini (utilisez --env-file=.env.local).");
  process.exit(1);
}

const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
await client.connect();

let moved = 0;
let failed = 0;
try {
  for (const t of TABLES) {
    // Garantit que la colonne de clé existe (le script peut être lancé avant le premier démarrage de l'app).
    await client.query(`ALTER TABLE ${t.table} ADD COLUMN IF NOT EXISTS storage_key TEXT`);
    if (t.table === "dossiers") await client.query("ALTER TABLE dossiers ALTER COLUMN data DROP NOT NULL");

    const { rows } = await client.query(
      `SELECT id, ${t.bytes} AS bytes, ${t.mime} AS mime FROM ${t.table}
       WHERE ${t.bytes} IS NOT NULL AND storage_key IS NULL ORDER BY id`,
    );
    console.log(`${t.table}: ${rows.length} fichier(s) à déplacer`);

    for (const row of rows) {
      const ext = EXT[row.mime];
      if (!ext) {
        console.warn(`  id ${row.id}: type ${row.mime} non pris en charge, ignoré`);
        failed++;
        continue;
      }
      const key = `${t.kind}/${randomUUID()}.${ext}`;
      if (DRY) {
        console.log(`  [dry-run] id ${row.id} -> ${key} (${row.bytes.length} octets)`);
        moved++;
        continue;
      }
      try {
        const full = path.join(ROOT, key);
        await mkdir(path.dirname(full), { recursive: true });
        await writeFile(full, row.bytes, { flag: "wx" });
        // Seulement après une écriture réussie : on enregistre la clé et on vide la colonne binaire.
        await client.query(
          `UPDATE ${t.table} SET storage_key = $2, ${t.bytes} = NULL WHERE id = $1`,
          [row.id, key],
        );
        moved++;
      } catch (err) {
        console.error(`  id ${row.id}: échec (${err.message}), ligne laissée telle quelle`);
        failed++;
      }
    }
  }
} finally {
  await client.end();
}

console.log(`${DRY ? "Simulation terminée" : "Migration terminée"} : ${moved} déplacé(s), ${failed} en échec.`);
console.log(`Dossier de stockage : ${ROOT}`);
if (failed > 0) process.exitCode = 1;
