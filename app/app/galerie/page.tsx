import { getGallery } from "@/lib/db";

export const metadata = { title: "Galerie des projets · Kids Tech-nuru Lab" };
export const dynamic = "force-dynamic";

export default async function GaleriePage() {
  const items = await getGallery(true);

  return (
    <div className="bg-dots-dark bg-sky/50">
      <div className="mx-auto max-w-6xl px-4 py-12">
        <p className="text-sm font-bold uppercase tracking-widest text-brand">Galerie</p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">Les projets de nos enfants</h1>
        <p className="mt-3 max-w-2xl text-ink/70">
          Chaque session se termine par un projet réalisé et présenté aux parents. Seuls les projets dont les familles
          ont accepté la diffusion des photos sont affichés.
        </p>

        {items.length === 0 ? (
          <p className="mt-10 rounded-2xl bg-white p-8 text-center text-ink/60 ring-1 ring-ink/10">
            Les premiers projets arriveront à la fin du pilote.
          </p>
        ) : (
          <ul className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((g) => (
              <li key={g.id} className="overflow-hidden rounded-3xl bg-white shadow-md ring-1 ring-ink/10">
                {g.hasPhoto ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={`/galerie/photo/${g.id}`} alt={g.title} className="h-52 w-full object-cover" />
                ) : (
                  <div className="flex h-52 items-center justify-center bg-gradient-to-br from-brand to-[#1a2a96] text-lg font-bold text-white/80">
                    Projet Kids Tech-nuru Lab
                  </div>
                )}
                <div className="p-5">
                  <p className="text-lg font-extrabold">{g.title}</p>
                  {g.description && <p className="mt-1 text-sm text-ink/70">{g.description}</p>}
                  {g.childFirstName && (
                    <p className="mt-3 text-xs font-semibold text-brand">
                      Projet de {g.childFirstName}
                      {g.level ? ` · ${g.level}` : ""}
                    </p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
