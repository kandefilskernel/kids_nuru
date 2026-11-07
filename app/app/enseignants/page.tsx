import PageIntro from "@/components/PageIntro";
import { submitTeacherRequest } from "./actions";

export const metadata = { title: "Enseignants · Kids Tech-nuru Lab" };
export const dynamic = "force-dynamic";

const FORMATS = [
  "Atelier ponctuel (une journée)",
  "Cycle de 6 samedis dans notre centre",
  "Intervention dans notre école",
  "Formation des enseignants en informatique",
  "Candidature : emploi d'animateur rémunéré à l'heure",
];
const LEVELS = ["Éveil", "Explorateur", "Créateur"];

const input =
  "mt-1.5 w-full rounded-xl border border-ink/15 bg-white px-4 py-2.5 text-sm outline-none focus:border-brand focus:ring-4 focus:ring-brand/15";

export default async function EnseignantsPage({
  searchParams,
}: {
  searchParams: Promise<{ merci?: string; error?: string }>;
}) {
  const { merci, error } = await searchParams;

  if (merci === "1") {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center">
        <h1 className="text-3xl font-extrabold">Merci pour votre demande !</h1>
        <p className="mt-3 text-ink/70">
          Nous étudions votre demande et revenons vers vous rapidement pour convenir d&apos;un format et d&apos;une date.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-dots-dark bg-sky/50">
      <div className="mx-auto max-w-2xl px-4 py-12">
        <PageIntro eyebrow="Pour les écoles et les enseignants" title="Faites venir l&apos;atelier chez vous">
          Vous êtes enseignant ou responsable d&apos;école ? Demandez une intervention, un cycle pour vos élèves ou une
          formation pour vos équipes en informatique et en robotique. Les champs marqués d&apos;un astérisque sont obligatoires.
        </PageIntro>

        <form action={submitTeacherRequest} encType="multipart/form-data" className="mt-8 space-y-6">
          <section className="space-y-4 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-ink/10">
            <h2 className="text-lg font-extrabold">Vous</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-sm">
                <span className="font-semibold">Nom et prénom *</span>
                <input name="name" required className={input} />
              </label>
              <label className="block text-sm">
                <span className="font-semibold">Fonction</span>
                <input name="role" placeholder="ex : enseignant de mathématiques" className={input} />
              </label>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-sm">
                <span className="font-semibold">École</span>
                <input name="school" className={input} />
              </label>
              <label className="block text-sm">
                <span className="font-semibold">Téléphone / WhatsApp *</span>
                <input name="phone" type="tel" required className={input} />
              </label>
            </div>
          </section>

          <section className="space-y-4 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-ink/10">
            <h2 className="text-lg font-extrabold">Votre demande</h2>
            <div>
              <p className="text-sm font-semibold">Format souhaité *</p>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                {FORMATS.map((f) => (
                  <label key={f} className="flex cursor-pointer items-start gap-2 rounded-xl bg-sky/50 p-3 text-sm ring-1 ring-ink/10 has-[:checked]:bg-brand has-[:checked]:text-white">
                    <input type="radio" name="format" value={f} required className="mt-0.5 accent-brand" />
                    {f}
                  </label>
                ))}
              </div>
            </div>
            <div>
              <p className="text-sm font-semibold">Niveaux concernés</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {LEVELS.map((l) => (
                  <label key={l} className="flex cursor-pointer items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold ring-1 ring-ink/15">
                    <input type="checkbox" name="levels" value={l} className="accent-brand" />
                    {l}
                  </label>
                ))}
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-sm">
                <span className="font-semibold">Nombre d&apos;élèves</span>
                <span className="block text-xs text-ink/55">
                  Pour une école ou une classe uniquement. Laissez vide si vous faites une candidature.
                </span>
                <input name="pupils" type="number" min="1" max="500" className={input} />
              </label>
              <label className="block text-sm">
                <span className="font-semibold">Créneau souhaité</span>
                <input name="slot" placeholder="ex : mercredi après-midi" className={input} />
              </label>
            </div>
            <label className="block text-sm">
              <span className="font-semibold">Précisions</span>
              <textarea name="message" rows={3} maxLength={800} className={input} />
            </label>
          </section>

          <section className="space-y-3 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-ink/10">
            <h2 className="text-lg font-extrabold">Dossier à joindre (facultatif)</h2>
            <p className="text-sm text-ink/65">
              Lettre de l&apos;école, programme de l&apos;établissement ou autorisation signée. PDF, JPEG ou PNG, 5 Mo maximum.
            </p>
            <input name="file" type="file" accept="application/pdf,image/jpeg,image/png" className="block text-sm" />
          </section>

          {error && (
            <p className="rounded-xl bg-coral/10 p-3 text-sm font-semibold text-[#b3261e] ring-1 ring-coral/40" role="alert">
              {error === "file"
                ? "Fichier refusé : PDF, JPEG ou PNG, 5 Mo maximum."
                : "Merci de remplir les champs obligatoires avec un numéro de téléphone valide."}
            </p>
          )}

          <button className="w-full rounded-full bg-brand px-6 py-3.5 font-bold text-white shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl">
            Envoyer ma demande
          </button>
        </form>
      </div>
    </div>
  );
}
