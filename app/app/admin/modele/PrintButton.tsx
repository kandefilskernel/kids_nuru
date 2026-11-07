"use client";

export default function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="rounded-full bg-ink px-5 py-2 text-sm font-bold text-white shadow-sm"
    >
      Imprimer / PDF pour les partenaires
    </button>
  );
}
