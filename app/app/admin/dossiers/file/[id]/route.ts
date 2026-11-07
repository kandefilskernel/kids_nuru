import { isAdmin } from "@/lib/auth";
import { getDossierFile } from "@/lib/db";
import { fileBytes } from "@/lib/storage";

export const dynamic = "force-dynamic";

/** Téléchargement d'un dossier déposé : réservé à l'équipe. */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin())) return new Response("Accès refusé", { status: 403 });
  const { id } = await params;
  if (!/^\d+$/.test(id)) return new Response("Not found", { status: 404 });
  const row = await getDossierFile(id);
  if (!row) return new Response("Not found", { status: 404 });
  const bytes = await fileBytes(row);
  if (!bytes) return new Response("Not found", { status: 404 });
  const safe = row.file_name.replace(/"/g, "");
  return new Response(new Uint8Array(bytes), {
    headers: {
      "Content-Type": row.file_type,
      "Content-Disposition": `attachment; filename="${safe}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
