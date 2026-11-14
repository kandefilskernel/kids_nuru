"use client";

export default function PrintButton({ label = "Imprimer" }: { label?: string }) {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="rounded-full bg-brand px-5 py-2 text-sm font-bold text-white shadow-sm hover:opacity-90"
    >
      {label}
    </button>
  );
}
