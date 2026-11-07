import type { ReactNode } from "react";

/**
 * En-tête commun des pages : même identité visuelle que le hero d'accueil, en version compacte.
 * Utilisé sur les pages publiques et sur l'espace équipe.
 */
export default function PageIntro({
  eyebrow,
  title,
  children,
  tone = "brand",
}: {
  eyebrow: string;
  title: ReactNode;
  children?: ReactNode;
  tone?: "brand" | "coral";
}) {
  const glow = tone === "coral" ? "bg-coral/50" : "bg-mint/50";
  const bg = tone === "coral"
    ? "from-[#8a1f16] via-[#c43a2c] to-[#ff6b5b]"
    : "from-ink via-[#1a2a96] to-brand";
  return (
    <header className={`relative mb-8 overflow-hidden rounded-3xl bg-gradient-to-br ${bg} p-7 text-white shadow-xl sm:p-9`}>
      <div className="bg-dots absolute inset-0" aria-hidden="true" />
      <div className={`glow -right-16 -top-16 h-56 w-56 ${glow}`} aria-hidden="true" />
      <div className="relative">
        <p className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-widest ring-1 ring-white/20">
          <span className="h-1.5 w-1.5 rounded-full bg-accent" />
          {eyebrow}
        </p>
        <h1 className="mt-4 text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl">{title}</h1>
        {children && <div className="mt-3 max-w-xl text-white/85">{children}</div>}
      </div>
    </header>
  );
}
