"use client";

import { useActionState } from "react";
import { register, type FormState } from "./actions";

const initial: FormState = { ok: false };

function Field({
  label,
  name,
  type = "text",
  required,
  hint,
  min,
  max,
  autoComplete,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  hint?: string;
  min?: number;
  max?: number;
  autoComplete?: string;
}) {
  return (
    <label className="block text-sm">
      <span className="font-semibold text-ink">
        {label}
        {required && <span className="text-coral"> *</span>}
      </span>
      <input
        name={name}
        type={type}
        required={required}
        min={min}
        max={max}
        autoComplete={autoComplete}
        className="mt-1.5 w-full rounded-xl border border-ink/15 bg-white px-4 py-3 text-base shadow-sm outline-none transition focus:border-brand focus:ring-4 focus:ring-brand/15"
      />
      {hint && <span className="mt-1 block text-xs text-ink/55">{hint}</span>}
    </label>
  );
}

function Card({ n, title, children }: { n: string; title: string; children: React.ReactNode }) {
  return (
    <fieldset className="space-y-4 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-ink/10 sm:p-6">
      <legend className="sr-only">{title}</legend>
      <div className="flex items-center gap-3">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand text-sm font-extrabold text-white" aria-hidden="true">
          {n}
        </span>
        <h3 className="text-lg font-extrabold">{title}</h3>
      </div>
      {children}
    </fieldset>
  );
}

export default function RegisterForm() {
  const [state, action, pending] = useActionState(register, initial);

  if (state.ok) {
    return (
      <div className="rounded-3xl bg-white p-8 text-center shadow-lg ring-1 ring-mint/40" role="status">
        <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-mint/20 text-mint">
          <svg viewBox="0 0 24 24" className="h-9 w-9" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M5 12.5l4.5 4.5L19 7.5" />
          </svg>
        </span>
        <h3 className="mt-4 text-2xl font-extrabold">Merci, c&apos;est enregistré !</h3>
        <p className="mt-2 text-ink/75">{state.message}</p>
      </div>
    );
  }

  return (
    <form action={action} className="space-y-5">
      <Card n="1" title="L'enfant">
        <Field label="Nom et prénom" name="childName" required autoComplete="off" />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Âge" name="age" type="number" min={5} max={12} required hint="De 5 à 12 ans" />
          <label className="block text-sm">
            <span className="font-semibold text-ink">
              Fille ou garçon<span className="text-coral"> *</span>
            </span>
            <select
              name="gender"
              required
              defaultValue=""
              className="mt-1.5 w-full rounded-xl border border-ink/15 bg-white px-4 py-3 text-base shadow-sm outline-none transition focus:border-brand focus:ring-4 focus:ring-brand/15"
            >
              <option value="" disabled>Choisir</option>
              <option>Fille</option>
              <option>Garçon</option>
            </select>
          </label>
        </div>
        <Field label="École" name="school" />
        <Field label="Allergies / santé" name="health" hint="Facultatif, mais utile pour la sécurité de l'enfant" />
      </Card>

      <Card n="2" title="Le parent / tuteur">
        <Field label="Nom et prénom" name="parentName" required autoComplete="name" />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Téléphone / WhatsApp" name="phone" type="tel" required autoComplete="tel" />
          <Field label="Numéro mobile money" name="momoNumber" type="tel" hint="Pour le suivi des paiements" />
        </div>
        <Field label="Contact d'urgence" name="emergencyContact" hint="Nom et téléphone" />
      </Card>

      <Card n="3" title="Autorisations">
        <label className="flex gap-3 text-sm">
          <input type="checkbox" name="parentalConsent" className="mt-0.5 h-5 w-5 shrink-0 accent-brand" />
          <span>
            J&apos;autorise mon enfant à participer aux séances et j&apos;accepte le règlement
            intérieur. <span className="text-coral">*</span>
          </span>
        </label>
        <label className="flex gap-3 text-sm">
          <input type="checkbox" name="photoConsent" className="mt-0.5 h-5 w-5 shrink-0 accent-brand" />
          <span>
            J&apos;autorise les photos de mon enfant pour la communication du centre{" "}
            <span className="text-ink/55">(facultatif)</span>.
          </span>
        </label>
        <label className="flex gap-3 rounded-xl bg-accent/10 p-3 text-sm ring-1 ring-accent/30">
          <input type="checkbox" name="solidarity" className="mt-0.5 h-5 w-5 shrink-0 accent-brand" />
          <span>
            <span className="font-semibold">Je souhaite une place solidaire</span> (tarif réduit ou gratuit, selon les
            places disponibles). Nous vous contacterons pour en discuter.
          </span>
        </label>
      </Card>

      {state.error && (
        <p className="rounded-xl bg-coral/10 p-4 text-sm font-semibold text-[#b3261e] ring-1 ring-coral/40" role="alert">
          {state.error}
        </p>
      )}

      <button
        disabled={pending}
        className="w-full rounded-full bg-brand px-6 py-4 text-base font-bold text-white shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl disabled:translate-y-0 disabled:opacity-60"
      >
        {pending ? "Envoi en cours…" : "Envoyer l'inscription"}
      </button>
      <p className="text-center text-xs text-ink/55">
        Une signature papier de l&apos;autorisation parentale pourra être demandée à la première séance.
      </p>
    </form>
  );
}
