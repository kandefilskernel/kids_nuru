import PageIntro from "@/components/PageIntro";
import Link from "next/link";
import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/auth";
import { getGallery, getRegistrations } from "@/lib/db";
import { addGalleryAction, deleteGalleryAction } from "../actions";
import AdminNav from "../AdminNav";

export const metadata = { title: "Galerie · Kids Tech-nuru Lab", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function GalerieAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; error?: string }>;
}) {
  if (!(await isAdmin())) redirect("/admin");
  const { saved, error } = await searchParams;
  const [items, registrations] = await Promise.all([getGallery(false), getRegistrations()]);

  return (
    <div className="bg-dots-dark min-h-[calc(100vh-130px)] bg-sky/50">
      <div className="mx-auto max-w-5xl px-4 py-10">
        <Link href="/admin" className="text-sm font-semibold text-brand hover:underline">
          ← Espace équipe
        </Link>
        <AdminNav current="/admin/galerie" />
        <div className="mt-5">
          <PageIntro eyebrow="Espace équipe" title="Galerie des projets" />
        </div>
        <div className="-mt-4 mb-6 flex flex-wrap items-center justify-end gap-3">
          <Link href="/galerie" className="rounded-full bg-white px-4 py-2 text-sm font-semibold ring-1 ring-ink/15 hover:bg-sky">
            Voir la page publique
          </Link>
        </div>
        <p className="mt-2 text-sm text-ink/65">
          La page publique n&apos;affiche que les projets d&apos;enfants dont le parent a accepté les photos.
        </p>

        {saved === "1" && (
          <p className="mt-4 rounded-xl bg-mint/15 p-3 text-sm font-semibold text-[#0b7a63] ring-1 ring-mint/40">Projet ajouté.</p>
        )}
        {error === "photo" && (
          <p className="mt-4 rounded-xl bg-coral/10 p-3 text-sm font-semibold text-[#b3261e] ring-1 ring-coral/40">
            Photo refusée : JPEG, PNG ou WebP, 2 Mo maximum.
          </p>
        )}
        {error === "title" && (
          <p className="mt-4 rounded-xl bg-coral/10 p-3 text-sm font-semibold text-[#b3261e] ring-1 ring-coral/40">Indiquez un titre.</p>
        )}

        <form action={addGalleryAction} encType="multipart/form-data" className="mt-6 grid gap-3 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-ink/10 md:grid-cols-2">
          <label className="block text-sm">
            <span className="font-semibold">Titre *</span>
            <input name="title" required maxLength={120} placeholder="ex : Un labyrinthe pour robot" className={inputCls} />
          </label>
          <label className="block text-sm">
            <span className="font-semibold">Enfant (optionnel)</span>
            <select name="registrationId" className={inputCls}>
              <option value="">— projet d&apos;équipe, sans enfant —</option>
              {registrations.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.childName} ({r.level}){r.photoConsent ? "" : " — pas d'accord photo"}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm md:col-span-2">
            <span className="font-semibold">Description</span>
            <textarea name="description" rows={2} maxLength={500} className={inputCls} />
          </label>
          <label className="block text-sm">
            <span className="font-semibold">Photo (JPEG, PNG ou WebP, 2 Mo max)</span>
            <input name="photo" type="file" accept="image/jpeg,image/png,image/webp" className="mt-1.5 block text-sm" />
          </label>
          <div className="flex items-end justify-end">
            <button className="rounded-full bg-accent px-6 py-2.5 font-bold text-ink shadow-sm">Ajouter à la galerie</button>
          </div>
        </form>

        <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.length === 0 && <li className="text-sm text-ink/60">Aucun projet pour le moment.</li>}
          {items.map((g) => (
            <li key={g.id} className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-ink/10">
              {g.hasPhoto ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={`/galerie/photo/${g.id}`} alt={g.title} className="h-40 w-full object-cover" />
              ) : (
                <div className="flex h-40 items-center justify-center bg-sky text-sm text-ink/50">Sans photo</div>
              )}
              <div className="p-4">
                <p className="font-bold">{g.title}</p>
                <p className="text-xs text-ink/60">
                  {g.childFirstName ? `${g.childFirstName} · ${g.level}` : "Projet d'équipe"}
                  {g.registrationId && !g.photoConsent && " · pas d'accord photo (masqué en public)"}
                </p>
                <form action={deleteGalleryAction} className="mt-3">
                  <input type="hidden" name="id" value={g.id} />
                  <button className="text-xs font-bold text-[#b3261e] hover:underline">Supprimer</button>
                </form>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

const inputCls =
  "mt-1.5 w-full rounded-xl border border-ink/15 bg-white px-3 py-2 text-sm outline-none focus:border-brand focus:ring-4 focus:ring-brand/15";
