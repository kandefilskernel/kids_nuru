"use client";

import { useActionState, useRef } from "react";
import { askModelAction, type AskState } from "./ask";

const SUGGESTIONS = [
  "Explique-moi le seuil de rentabilité en termes simples",
  "Pourquoi la marge est-elle positive ou négative ?",
  "Quel est l'effet d'une place solidaire sur les recettes ?",
  "Quelles dépenses peut-on réduire en premier ?",
];

const initial: AskState = {};

export default function AskModel() {
  const [state, action, pending] = useActionState(askModelAction, initial);
  const ref = useRef<HTMLTextAreaElement>(null);
  const a = state.answer;

  return (
    <section className="mt-10 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-ink/10">
      <h2 className="text-xl font-extrabold">Assistant du modèle</h2>
      <p className="mt-1 text-sm text-ink/60">
        Posez une question sur le modèle. Les réponses s&apos;appuient sur les hypothèses en cours et sur les documents
        de l&apos;équipe, et indiquent leurs sources.
      </p>

      <form action={action} className="mt-4 space-y-3">
        <textarea
          ref={ref}
          name="question"
          rows={2}
          maxLength={500}
          required
          defaultValue={state.question ?? ""}
          placeholder="Ex. : Combien d'enfants faut-il pour couvrir les coûts ?"
          className="w-full rounded-xl border border-ink/15 bg-white px-4 py-3 text-sm shadow-sm outline-none focus:border-brand focus:ring-4 focus:ring-brand/15"
        />
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="submit"
            disabled={pending}
            className="rounded-full bg-brand px-5 py-2 text-sm font-bold text-white shadow-sm disabled:opacity-60"
          >
            {pending ? "Recherche…" : "Demander"}
          </button>
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => {
                if (ref.current) ref.current.value = s;
              }}
              className="rounded-full bg-sky px-3 py-1.5 text-xs font-semibold text-ink/80 hover:bg-sky/70"
            >
              {s}
            </button>
          ))}
        </div>
      </form>

      {state.error && (
        <p className="mt-4 rounded-xl bg-coral/10 p-3 text-sm font-semibold text-[#b3261e] ring-1 ring-coral/40" role="alert">
          {state.error}
        </p>
      )}

      {a && (
        <div className="mt-6 space-y-5">
          {a.text ? (
            <div className="whitespace-pre-wrap rounded-xl bg-sky/40 p-4 text-sm leading-relaxed text-ink">{a.text}</div>
          ) : (
            <p className="rounded-xl bg-accent/20 p-3 text-sm ring-1 ring-accent/50">
              La rédaction automatique n&apos;est pas activée (variable <code className="font-bold">ANTHROPIC_API_KEY</code>{" "}
              absente). Voici les passages les plus pertinents pour votre question.
            </p>
          )}

          {!a.text && a.passages.length > 0 && (
            <div className="space-y-3">
              {a.passages.map((p, i) => (
                <details key={`${p.source}-${i}`} className="rounded-xl ring-1 ring-ink/10" open={i === 0}>
                  <summary className="cursor-pointer px-4 py-3 text-sm font-semibold">{p.title}</summary>
                  <p className="whitespace-pre-wrap border-t border-ink/10 px-4 py-3 text-sm leading-relaxed text-ink/80">{p.text}</p>
                </details>
              ))}
            </div>
          )}

          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-ink/50">Sources</p>
            <ul className="mt-2 list-inside list-disc text-xs text-ink/70">
              {a.sources.map((s, i) => (
                <li key={`${s.source}-${i}`}>
                  {s.title} <span className="text-ink/45">({s.source})</span>
                </li>
              ))}
            </ul>
            {a.model && <p className="mt-2 text-xs text-ink/45">Généré avec {a.model}.</p>}
          </div>
        </div>
      )}
    </section>
  );
}
