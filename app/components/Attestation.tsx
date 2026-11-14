import { Logo } from "@/components/art";
import type { Badge } from "@/lib/badges";
import { SKILLS, type HistoryRow, type Registration } from "@/lib/db";
import { TRACKS } from "@/lib/programme";

/** Mise en page A4 paysage et couleurs conservées à l'impression. */
export const PRINT_CSS = `@page { size: A4 landscape; margin: 8mm; }
@media print { html, body { background: #fff !important; } .attestation { -webkit-print-color-adjust: exact; print-color-adjust: exact; height: 190mm; aspect-ratio: auto; } }`;

/**
 * Attestation de fin de parcours, au format A4 paysage pour l'impression.
 * Les compétences retenues sont celles du test de sortie (ou d'entrée si la sortie n'est pas encore faite).
 */
export default function Attestation({
  registration: r,
  history,
  tests,
  badges,
}: {
  registration: Registration;
  history: HistoryRow[];
  tests: { entree?: boolean[]; sortie?: boolean[] };
  badges: Badge[];
}) {
  const ages = TRACKS.find((t) => t.name === r.level)?.ages ?? "";
  const present = history.filter((h) => h.present).length;
  const challenges = history.filter((h) => h.present && h.challenge).length;
  const skillsSource = tests.sortie ?? tests.entree;
  const skills = SKILLS.filter((_, i) => skillsSource?.[i]);
  const earned = badges.filter((b) => b.earned);
  const today = new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric", timeZone: "Africa/Lubumbashi" });

  return (
    <article className="attestation relative mx-auto aspect-[297/210] w-full max-w-5xl overflow-hidden rounded-3xl bg-white shadow-xl ring-1 ring-ink/10 print:max-w-none print:rounded-none print:shadow-none print:ring-0">
      {/* Cadre décoratif */}
      <div className="absolute inset-3 rounded-2xl border-[3px] border-brand print:rounded-none" aria-hidden="true" />
      <div className="absolute inset-5 rounded-xl border border-accent print:rounded-none" aria-hidden="true" />

      <div className="relative flex h-full flex-col px-[7%] py-[5%] text-center">
        <header className="flex items-center justify-center gap-3">
          <Logo size={48} />
          <p className="text-left leading-tight">
            <span className="block text-xs font-extrabold text-coral">Kids</span>
            <span className="block text-xl font-black tracking-tight text-ink">
              Tech-<span className="text-brand">nuru</span> Lab
            </span>
          </p>
        </header>

        <p className="mt-[3%] text-xs font-bold uppercase tracking-[0.35em] text-brand">Attestation de participation</p>
        <p className="mt-2 text-sm text-ink/70">est décernée à</p>
        <h1 className="mt-1 text-4xl font-black tracking-tight text-ink sm:text-5xl">{r.childName}</h1>
        <p className="mx-auto mt-3 max-w-2xl text-sm text-ink/80 sm:text-base">
          pour avoir suivi l&apos;atelier pilote de programmation, d&apos;électronique et d&apos;intelligence artificielle,
          niveau <span className="font-bold">{r.level}</span>
          {ages && <> ({ages})</>}, à Lubumbashi.
        </p>

        <div className="mx-auto mt-[3%] grid w-full max-w-3xl grid-cols-3 gap-3 text-sm">
          <Stat value={present} label={present > 1 ? "séances suivies" : "séance suivie"} />
          <Stat value={challenges} label={challenges > 1 ? "défis réussis" : "défi réussi"} />
          <Stat value={earned.length} label={earned.length > 1 ? "badges gagnés" : "badge gagné"} />
        </div>

        <div className="mx-auto mt-[3%] grid w-full max-w-3xl gap-4 text-left text-sm sm:grid-cols-2">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-ink/50">Compétences acquises</p>
            {skills.length ? (
              <ul className="mt-1 space-y-0.5">
                {skills.map((s) => (
                  <li key={s}>
                    <span className="font-bold text-[#0b7a63]">✓</span> {s}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-1 text-ink/55">Évaluées au test de fin de parcours.</p>
            )}
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-ink/50">Badges</p>
            {earned.length ? (
              <p className="mt-1 leading-relaxed">
                {earned.map((b) => (
                  <span key={b.id} className="mr-1.5 inline-block whitespace-nowrap">
                    <span aria-hidden="true">{b.icon}</span> {b.label}
                  </span>
                ))}
              </p>
            ) : (
              <p className="mt-1 text-ink/55">Les badges s&apos;affichent au fil des séances.</p>
            )}
          </div>
        </div>

        <footer className="mt-auto flex items-end justify-between gap-6 pt-4 text-left text-xs text-ink/70">
          <p>
            Fait à Lubumbashi, le {today}
          </p>
          <div className="w-56 text-center">
            <div className="h-10 border-b border-ink/40" />
            <p className="mt-1">Le responsable pédagogique</p>
          </div>
        </footer>
      </div>
    </article>
  );
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div className="rounded-2xl bg-sky/60 px-3 py-2 print:bg-sky/60">
      <p className="text-2xl font-black text-brand">{value}</p>
      <p className="text-xs font-semibold text-ink/70">{label}</p>
    </div>
  );
}
