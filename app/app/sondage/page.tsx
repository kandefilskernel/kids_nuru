import { submitSurvey } from "./actions";

export const metadata = { title: "Questionnaire parents · Kids Tech-nuru Lab" };
export const dynamic = "force-dynamic";

const INTERESTS = ["Très intéressé", "Intéressé", "Peu", "Pas du tout"];
const SLOTS = ["Samedi matin", "Samedi après-midi", "Dimanche", "Mercredi après-midi", "Vacances"];
const PAYMENTS = ["Mobile money", "Espèces", "Virement", "Autre"];
const PILOT = ["Oui", "Peut-être", "Non"];

function Radio({ name, options, required }: { name: string; options: string[]; required?: boolean }) {
  return (
    <div className="mt-2 flex flex-wrap gap-2">
      {options.map((o) => (
        <label key={o} className="cursor-pointer">
          <input type="radio" name={name} value={o} required={required} className="peer sr-only" />
          <span className="inline-block rounded-full bg-white px-4 py-2 text-sm font-semibold ring-1 ring-ink/15 transition peer-checked:bg-brand peer-checked:text-white peer-checked:ring-brand">
            {o}
          </span>
        </label>
      ))}
    </div>
  );
}

function Field({ label, name, hint, type = "text", placeholder }: { label: string; name: string; hint?: string; type?: string; placeholder?: string }) {
  return (
    <label className="block">
      <span className="text-sm font-semibold">{label}</span>
      {hint && <span className="block text-xs text-ink/55">{hint}</span>}
      <input
        name={name}
        type={type}
        placeholder={placeholder}
        className="mt-1.5 w-full rounded-xl border border-ink/15 bg-white px-4 py-2.5 text-sm outline-none focus:border-brand focus:ring-4 focus:ring-brand/15"
      />
    </label>
  );
}

export default async function SondagePage({
  searchParams,
}: {
  searchParams: Promise<{ merci?: string; error?: string }>;
}) {
  const { merci, error } = await searchParams;

  if (merci === "1") {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center">
        <h1 className="text-3xl font-extrabold">Merci pour votre réponse !</h1>
        <p className="mt-3 text-ink/70">
          Vos réponses nous aideront à fixer des tarifs accessibles et des horaires qui conviennent aux familles.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-dots-dark bg-sky/50">
      <div className="mx-auto max-w-2xl px-4 py-12">
        <p className="text-sm font-bold uppercase tracking-widest text-brand">Questionnaire 5 minutes</p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight">Aidez-nous à construire l&apos;atelier</h1>
        <p className="mt-3 text-ink/70">
          Kids Tech-nuru Lab est un centre extrascolaire où les enfants de 5 à 12 ans apprennent la programmation,
          la robotique et l&apos;intelligence artificielle par le jeu. Quelques questions pour adapter l&apos;offre aux familles.
        </p>

        <form action={submitSurvey} className="mt-8 space-y-6">
          <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-ink/10 space-y-4">
            <h2 className="text-lg font-extrabold">Votre famille</h2>
            <Field label="Âge de vos enfants *" name="childrenAges" placeholder="ex : 6 et 10 ans" />
            <Field label="Quartier / commune" name="neighborhood" />
          </section>

          <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-ink/10">
            <h2 className="text-lg font-extrabold">Intérêt</h2>
            <p className="mt-3 text-sm font-semibold">Intérêt pour un atelier de programmation et robotique</p>
            <Radio name="interest" options={INTERESTS} />
          </section>

          <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-ink/10 space-y-4">
            <h2 className="text-lg font-extrabold">Prix et paiement</h2>
            <Field label="Montant mensuel acceptable" name="acceptablePrice" hint="En dollars ou en francs congolais" />
            <Field label="Montant au-delà duquel vous n'inscririez plus votre enfant" name="maxPrice" />
            <div>
              <p className="text-sm font-semibold">Mode de paiement préféré</p>
              <Radio name="paymentMode" options={PAYMENTS} />
            </div>
          </section>

          <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-ink/10">
            <h2 className="text-lg font-extrabold">Organisation</h2>
            <p className="mt-3 text-sm font-semibold">Meilleur créneau</p>
            <Radio name="bestSlot" options={SLOTS} />
          </section>

          <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-ink/10 space-y-4">
            <h2 className="text-lg font-extrabold">Suite</h2>
            <div>
              <p className="text-sm font-semibold">Souhaitez-vous inscrire votre enfant à l&apos;atelier pilote ? *</p>
              <Radio name="pilotInterest" options={PILOT} required />
            </div>
            <label className="flex items-start gap-3 text-sm">
              <input type="checkbox" name="recontact" className="mt-0.5 h-5 w-5 shrink-0 accent-brand" />
              <span>Je consens à être recontacté(e) à ce sujet sur WhatsApp.</span>
            </label>
            <Field label="Numéro WhatsApp (seulement si vous acceptez d'être recontacté)" name="contact" type="tel" />
            <label className="block">
              <span className="text-sm font-semibold">Remarques</span>
              <textarea
                name="comments"
                rows={3}
                className="mt-1.5 w-full rounded-xl border border-ink/15 bg-white px-4 py-2.5 text-sm outline-none focus:border-brand focus:ring-4 focus:ring-brand/15"
              />
            </label>
          </section>

          {error && (
            <p className="rounded-xl bg-coral/10 p-3 text-sm font-semibold text-[#b3261e] ring-1 ring-coral/40" role="alert">
              Merci de répondre aux questions marquées d&apos;un astérisque.
            </p>
          )}

          <button className="w-full rounded-full bg-brand px-6 py-3.5 font-bold text-white shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl">
            Envoyer mes réponses
          </button>
        </form>
      </div>
    </div>
  );
}
