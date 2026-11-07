import SuiviForm from "./SuiviForm";

export const metadata = { title: "Suivre mon dossier · Kids Tech-nuru Lab" };

export default function SuiviPage() {
  return (
    <div className="bg-dots-dark bg-sky/50">
      <div className="mx-auto max-w-xl px-4 py-12">
        <p className="text-sm font-bold uppercase tracking-widest text-brand">Suivi de dossier</p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight">Où en est mon dossier ?</h1>
        <p className="mt-3 text-ink/70">
          Indiquez le numéro de dossier reçu à l&apos;envoi (DOS-…) et le téléphone utilisé pour le déposer.
        </p>
        <div className="mt-8">
          <SuiviForm />
        </div>
      </div>
    </div>
  );
}
