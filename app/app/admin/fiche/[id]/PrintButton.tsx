"use client";

export default function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="rounded bg-black px-3 py-1 text-sm font-semibold text-white"
    >
      Imprimer
    </button>
  );
}
