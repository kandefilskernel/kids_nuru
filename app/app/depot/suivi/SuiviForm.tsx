"use client";

import { useActionState } from "react";
import { lookupDossier, type StatusState } from "../actions";

const initial: StatusState = {};

const input =
  "mt-1.5 w-full rounded-xl border border-ink/15 bg-white px-4 py-2.5 text-sm outline-none focus:border-brand focus:ring-4 focus:ring-brand/15";

const STEPS = ["À traiter", "En cours", "Traité", "Classé"];

export default function SuiviForm() {
  const [state, action, pending] = useActionState(lookupDossier, initial);
  const step = state.found ? STEPS.indexOf(state.found.status) : -1;

  return (
    <div className="space-y-5">
      <form action={action} className="space-y-4 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-ink/10">
        <label className="block text-sm">
          <span className="font-semibold">Numéro de dossier *</span>
          <input name="ref" required placeholder="DOS-00012" className={input} />
        </label>
        <label className="block text-sm">
          <span className="font-semibold">Téléphone utilisé au dépôt *</span>
          <input name="phone" type="tel" required className={input} />
        </label>
        <button
          disabled={pending}
          className="w-full rounded-full bg-brand px-6 py-3 font-bold text-white shadow-lg transition hover:-translate-y-0.5 disabled:opacity-60"
        >
          {pending ? "Recherche…" : "Voir le statut"}
        </button>
      </form>

      {state.error && (
        <p className="rounded-xl bg-coral/10 p-4 text-sm font-semibold text-[#b3261e] ring-1 ring-coral/40" role="alert">
          {state.error}
        </p>
      )}

      {state.found && (
        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-mint/40" role="status">
          <p className="text-sm text-ink/60">{state.found.category}</p>
          <p className="mt-1 text-xl font-extrabold">{state.found.status}</p>
          <ol className="mt-5 grid grid-cols-4 gap-2 text-center text-xs font-semibold">
            {STEPS.map((s, i) => (
              <li
                key={s}
                className={`rounded-xl px-2 py-2 ${i <= step ? "bg-brand text-white" : "bg-sky/60 text-ink/50"}`}
              >
                {s}
              </li>
            ))}
          </ol>
          <p className="mt-4 text-xs text-ink/55">
            Déposé le {new Date(state.found.createdAt).toLocaleDateString("fr-FR", { timeZone: "Africa/Lubumbashi" })}.
          </p>
        </div>
      )}
    </div>
  );
}
