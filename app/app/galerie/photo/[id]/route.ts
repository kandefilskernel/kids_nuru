import { isAdmin } from "@/lib/auth";
import { getGalleryPhoto } from "@/lib/db";
import { fileBytes } from "@/lib/storage";

export const dynamic = "force-dynamic";

/** Photo d'un projet : visible du public seulement si l'enfant a accepté la diffusion, toujours pour l'équipe. */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^\d+$/.test(id)) return new Response("Not found", { status: 404 });
  const row = await getGalleryPhoto(id);
  if (!row) return new Response("Not found", { status: 404 });
  if (row.photo_consent !== true && !(await isAdmin())) {
    return new Response("Not found", { status: 404 });
  }
  const bytes = await fileBytes({ storage_key: row.storage_key, data: row.photo });
  if (!bytes) return new Response("Not found", { status: 404 });
  return new Response(new Uint8Array(bytes), {
    headers: {
      "Content-Type": row.photo_type,
      "Cache-Control": "private, max-age=3600",
    },
  });
}
