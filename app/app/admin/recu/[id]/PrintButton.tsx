"use client";

export default function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="rounded bg-brand px-4 py-2 font-semibold text-white"
    >
      Imprimer / Enregistrer en PDF
    </button>
  );
}
