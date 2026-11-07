import PageIntro from "@/components/PageIntro";
import Link from "next/link";
import { submitDossier } from "./actions";

export const metadata = { title: "Déposer un dossier · Kids Tech-nuru Lab" };
export const dynamic = "force-dynamic";

const CATEGORIES = [
  "Inscription d'un enfant (autorisation, certificat)",
  "Dossier d'école ou d'enseignant",
  "Projet réalisé par un enfant",
  "Autre",
];

const ERRORS: Record<string, string> = {
  fields: "Merci de remplir le nom, un numéro valide et la catégorie.",
  file: "Fichier refusé : PDF, JPEG ou PNG, 5 Mo maximum.",
};

const input =
  "mt-1.5 w-full rounded-xl border border-ink/15 bg-white px-4 py-2.5 text-sm outline-none focus:border-brand focus:ring-4 focus:ring-brand/15";

export default async function DepotPage({ searchParams }: { searchParams: Promise<{ merci?: string; error?: string }> }) {
  const { merci, error } = await searchParams;

  if (merci && /^\d+$/.test(merci)) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center">
        <h1 className="text-3xl font-extrabold">Dossier bien reçu !</h1>
        <p className="mt-3 text-ink/70">
          Votre dossier est traité par l&apos;équipe Tech-nuru. Nous revenons vers vous par WhatsApp si nécessaire.
        </p>
        <p className="mt-6 inline-block rounded-2xl bg-white px-6 py-4 text-lg font-extrabold shadow-sm ring-1 ring-ink/10">
          Numéro de dossier : DOS-{merci.padStart(5, "0")}
        </p>
        <p className="mt-4">
          <Link href="/depot/suivi" className="font-bold text-brand hover:underline">
            Suivre mon dossier
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div className="bg-dots-dark bg-sky/50">
      <div className="mx-auto max-w-2xl px-4 py-12">
        <PageIntro eyebrow="Dépôt de dossiers" title="Envoyez votre dossier">
          Autorisation parentale signée, certificat, dossier d&apos;école ou projet réalisé : déposez le fichier ici.
          Formats acceptés : PDF, JPEG, PNG (5 Mo maximum). Après l&apos;envoi, vous recevez un numéro de dossier pour le suivre.
        </PageIntro>
        <p className="mt-2 text-sm">
          Vous avez déjà déposé un dossier ?{" "}
          <Link href="/depot/suivi" className="font-bold text-brand hover:underline">
            Suivre mon dossier
          </Link>
        </p>

        <form action={submitDossier} encType="multipart/form-data" className="mt-8 space-y-5 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-ink/10">
          <label className="block text-sm">
            <span className="font-semibold">Nom et prénom *</span>
            <input name="name" required className={input} />
          </label>
          <label className="block text-sm">
            <span className="font-semibold">Téléphone / WhatsApp *</span>
            <input name="phone" type="tel" required className={input} />
          </label>
          <label className="block text-sm">
            <span className="font-semibold">Type de dossier *</span>
            <select name="category" required defaultValue="" className={input}>
              <option value="" disabled>Choisir</option>
              {CATEGORIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </label>
          <label className="block text-sm">
            <span className="font-semibold">Fichier *</span>
            <input name="file" type="file" required accept="application/pdf,image/jpeg,image/png" className="mt-1.5 block text-sm" />
          </label>
          <label className="block text-sm">
            <span className="font-semibold">Précisions</span>
            <textarea name="description" rows={3} maxLength={600} className={input} />
          </label>

          {error && (
            <p className="rounded-xl bg-coral/10 p-3 text-sm font-semibold text-[#b3261e] ring-1 ring-coral/40" role="alert">
              {ERRORS[error] ?? "Une erreur est survenue."}
            </p>
          )}

          <button className="w-full rounded-full bg-brand px-6 py-3.5 font-bold text-white shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl">
            Envoyer le dossier
          </button>
        </form>
      </div>
    </div>
  );
}
