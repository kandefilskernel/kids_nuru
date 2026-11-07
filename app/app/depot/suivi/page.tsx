import PageIntro from "@/components/PageIntro";
import SuiviForm from "./SuiviForm";

export const metadata = { title: "Suivre mon dossier · Kids Tech-nuru Lab" };

export default function SuiviPage() {
  return (
    <div className="bg-dots-dark bg-sky/50">
      <div className="mx-auto max-w-xl px-4 py-12">
        <PageIntro eyebrow="Suivi de dossier" title="Où en est mon dossier ?">
          Indiquez le numéro de dossier reçu à l&apos;envoi (DOS-…) et le téléphone utilisé pour le déposer.
        </PageIntro>
        <div className="mt-8">
          <SuiviForm />
        </div>
      </div>
    </div>
  );
}
