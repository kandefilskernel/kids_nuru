import type { Badge } from "@/lib/badges";

/** Grille des badges : gagnés en couleur, à venir en gris avec leur avancement. */
export default function Badges({ badges, compact = false }: { badges: Badge[]; compact?: boolean }) {
  const earned = badges.filter((b) => b.earned).length;
  return (
    <div>
      <p className="text-sm text-ink/60">
        {earned} badge{earned > 1 ? "s" : ""} gagné{earned > 1 ? "s" : ""} sur {badges.length}
      </p>
      <ul className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {badges.map((b) => (
          <li
            key={b.id}
            className={`flex flex-col items-center rounded-2xl p-3 text-center ring-1 ${
              b.earned ? "bg-accent/15 ring-accent/50" : "bg-sky/40 ring-ink/10"
            }`}
            title={b.description}
          >
            <span
              aria-hidden="true"
              className={`flex h-12 w-12 items-center justify-center rounded-full text-2xl ${
                b.earned ? "bg-white shadow-sm" : "bg-white/60 opacity-40 grayscale"
              }`}
            >
              {b.icon}
            </span>
            <span className={`mt-2 text-sm font-extrabold ${b.earned ? "" : "text-ink/50"}`}>{b.label}</span>
            {!compact && <span className="mt-0.5 text-[11px] leading-tight text-ink/60">{b.description}</span>}
            {!b.earned && b.progress.goal > 1 && (
              <span className="mt-2 w-full">
                <span className="block h-1.5 overflow-hidden rounded-full bg-ink/10">
                  <span className="block h-full rounded-full bg-brand" style={{ width: `${(b.progress.value / b.progress.goal) * 100}%` }} />
                </span>
                <span className="mt-1 block text-[10px] font-semibold text-ink/55">
                  {b.progress.value} / {b.progress.goal}
                </span>
              </span>
            )}
            <span className="sr-only">{b.earned ? "Badge gagné" : "Badge à gagner"}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
