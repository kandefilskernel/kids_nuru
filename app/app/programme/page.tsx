import Link from "next/link";
import { CreateurArt, EveilArt, ExplorateurArt, HeroArt } from "@/components/art";
import { EVALUATION, PLAN_B, SESSION_STRUCTURE, TRACKS, type Track } from "@/lib/programme";

export const metadata = { title: "Programme détaillé · Kids Tech-nuru Lab" };

const THEME: Record<
  Track["name"],
  { art: React.ReactNode; band: string; chip: string; dot: string; ring: string; soft: string; text: string }
> = {
  "Éveil": {
    art: <EveilArt />,
    band: "from-mint to-[#0b8f74]",
    chip: "bg-mint/20 text-[#0b7a63]",
    dot: "bg-mint",
    ring: "ring-mint/40",
    soft: "bg-mint/10",
    text: "text-[#0b7a63]",
  },
  "Explorateur": {
    art: <ExplorateurArt />,
    band: "from-brand to-[#1a2a96]",
    chip: "bg-brand/10 text-brand",
    dot: "bg-brand",
    ring: "ring-brand/30",
    soft: "bg-brand/5",
    text: "text-brand",
  },
  "Créateur": {
    art: <CreateurArt />,
    band: "from-accent to-[#f0a500]",
    chip: "bg-accent/30 text-[#8a5a00]",
    dot: "bg-accent",
    ring: "ring-accent/50",
    soft: "bg-accent/10",
    text: "text-[#8a5a00]",
  },
};

const OFFLINE = {
  oui: { label: "Sans électricité", cls: "bg-mint/20 text-[#0b7a63]" },
  non: { label: "Avec matériel", cls: "bg-brand/10 text-brand" },
  partiel: { label: "Partiellement", cls: "bg-accent/30 text-[#8a5a00]" },
} as const;

const TOTAL_MIN = SESSION_STRUCTURE.reduce((s, x) => s + x.minutes, 0);

export default function ProgrammePage() {
  return (
    <div className="bg-sky/40">
      {/* Bandeau d'accueil */}
      <section className="relative overflow-hidden bg-gradient-to-br from-ink via-[#1a2a96] to-brand text-white">
        <div className="bg-dots absolute inset-0" aria-hidden="true" />
        <div className="relative mx-auto grid max-w-6xl items-center gap-8 px-4 py-14 md:grid-cols-2 md:py-20">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-sm font-semibold ring-1 ring-white/20">
              <span className="h-2 w-2 rounded-full bg-mint" /> Atelier pilote · 6 samedis
            </p>
            <h1 className="mt-5 text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl">
              Un parcours pour <span className="text-accent">chaque âge</span>, un projet à présenter.
            </h1>
            <p className="mt-4 max-w-lg text-white/80">
              Séances de 2 heures, groupes par tranche d&apos;âge, un assistant pour 8 enfants au plus. À la fin, votre
              enfant présente son projet aux parents.
            </p>
            <nav className="mt-7 flex flex-wrap gap-2" aria-label="Niveaux">
              {TRACKS.map((t) => (
                <a
                  key={t.name}
                  href={`#${t.name.toLowerCase()}`}
                  className="rounded-full bg-white/10 px-4 py-2 text-sm font-bold ring-1 ring-white/25 transition hover:bg-white/20"
                >
                  {t.name} · {t.ages}
                </a>
              ))}
            </nav>
          </div>
          <div className="hidden md:block">
            <HeroArt />
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 py-12">
        {/* Une séance type : frise proportionnelle à la durée */}
        <section className="rounded-3xl bg-white p-6 shadow-md ring-1 ring-ink/10 sm:p-8">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <div>
              <p className="text-sm font-bold uppercase tracking-widest text-brand">Une séance type</p>
              <h2 className="mt-1 text-2xl font-extrabold">Deux heures, six temps</h2>
            </div>
            <p className="text-sm font-semibold text-ink/60">{TOTAL_MIN} minutes</p>
          </div>
          <div className="mt-6 flex h-12 overflow-hidden rounded-2xl shadow-inner ring-1 ring-ink/10" role="img" aria-label="Répartition d'une séance de 2 heures">
            {SESSION_STRUCTURE.map((s, i) => (
              <div
                key={s.label}
                style={{ flexGrow: s.minutes }}
                className={`flex items-center justify-center text-xs font-bold text-white sm:text-sm ${
                  ["bg-brand", "bg-mint", "bg-[#0e1647]", "bg-accent text-ink", "bg-coral", "bg-[#8a94c8]"][i]
                }`}
              >
                {s.minutes >= 10 && `${s.minutes}′`}
              </div>
            ))}
          </div>
          <ol className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {SESSION_STRUCTURE.map((s, i) => (
              <li key={s.label} className="flex items-center gap-3 rounded-2xl bg-sky/60 p-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-ink text-sm font-extrabold text-white">
                  {i + 1}
                </span>
                <span className="flex-1 text-sm font-semibold">{s.label}</span>
                <span className="rounded-full bg-white px-2.5 py-1 text-xs font-bold text-ink/70 ring-1 ring-ink/10">
                  {s.minutes} min
                </span>
              </li>
            ))}
          </ol>
        </section>

        {/* Un parcours par niveau */}
        {TRACKS.map((t) => {
          const th = THEME[t.name];
          return (
            <section key={t.name} id={t.name.toLowerCase()} className="mt-14 scroll-mt-24">
              <div className={`relative overflow-hidden rounded-3xl bg-gradient-to-r ${th.band} p-6 text-white shadow-lg sm:p-8`}>
                <div className="absolute -right-6 -top-6 h-40 w-40 rounded-full bg-white/10" aria-hidden="true" />
                <div className="relative flex flex-wrap items-center gap-6">
                  <div className="h-24 w-24 shrink-0 rounded-2xl bg-white/15 p-2 ring-1 ring-white/30">{th.art}</div>
                  <div className="flex-1">
                    <p className="text-sm font-bold uppercase tracking-widest text-white/80">{t.ages}</p>
                    <h2 className="text-3xl font-extrabold tracking-tight">{t.name}</h2>
                    <p className="mt-1 text-white/90">« {t.slogan} »</p>
                  </div>
                  {t.variant && (
                    <p className="max-w-xs rounded-xl bg-white/15 px-4 py-2 text-xs font-semibold ring-1 ring-white/25">
                      {t.variant}
                    </p>
                  )}
                </div>
              </div>

              {/* Frise : une carte par samedi */}
              <ol className="relative mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                {t.sessions.map((s) => {
                  const isFinal = s.theme === "Projet final";
                  return (
                    <li
                      key={s.n}
                      className={`group relative flex flex-col rounded-3xl bg-white p-6 shadow-sm ring-1 transition hover:-translate-y-1 hover:shadow-xl ${
                        isFinal ? `ring-2 ${th.ring} md:col-span-2 lg:col-span-3` : "ring-ink/10"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <span className={`flex h-12 w-12 items-center justify-center rounded-2xl text-lg font-extrabold text-white ${th.dot} shadow-md`}>
                          {isFinal ? "★" : s.n}
                        </span>
                        <span className="text-xs font-bold uppercase tracking-wide text-ink/50">
                          {isFinal ? "Grand final" : `Samedi ${s.n}`}
                        </span>
                      </div>

                      <h3 className="mt-4 text-xl font-extrabold">{s.theme}</h3>
                      <p className="mt-2 text-sm leading-relaxed text-ink/75">{s.activity}</p>

                      <div className="mt-auto flex flex-wrap gap-2 pt-5">
                        <span className={`rounded-full px-3 py-1 text-xs font-bold ${th.chip}`}>🛠 {s.tools}</span>
                        {s.offline && (
                          <span className={`rounded-full px-3 py-1 text-xs font-bold ${OFFLINE[s.offline].cls}`}>
                            {OFFLINE[s.offline].label}
                          </span>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ol>
            </section>
          );
        })}

        {/* Plan B et évaluation */}
        <div className="mt-14 grid gap-6 lg:grid-cols-2">
          <section className="rounded-3xl bg-white p-7 shadow-sm ring-1 ring-ink/10">
            <p className="text-sm font-bold uppercase tracking-widest text-brand">Plan B</p>
            <h2 className="mt-1 text-2xl font-extrabold">Si l&apos;électricité ou la connexion coupe</h2>
            <ul className="mt-5 space-y-3">
              {PLAN_B.map((p) => (
                <li key={p} className="flex gap-3 text-sm">
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-mint/20 text-xs font-extrabold text-[#0b7a63]">
                    ✓
                  </span>
                  <span>{p}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-3xl bg-ink p-7 text-white shadow-lg">
            <p className="text-sm font-bold uppercase tracking-widest text-accent">Évaluation légère</p>
            <h2 className="mt-1 text-2xl font-extrabold">Trois points par séance</h2>
            <p className="mt-4 text-sm leading-relaxed text-white/80">{EVALUATION}</p>
            <div className="mt-5 grid grid-cols-3 gap-2 text-center text-xs font-bold">
              {["A participé", "A terminé le défi", "A aidé un camarade"].map((x) => (
                <div key={x} className="rounded-2xl bg-white/10 px-2 py-3 ring-1 ring-white/15">
                  {x}
                </div>
              ))}
            </div>
            <Link
              href="/inscription"
              className="mt-7 inline-block rounded-full bg-accent px-6 py-3 text-sm font-bold text-ink shadow-lg transition hover:-translate-y-0.5"
            >
              Inscrire mon enfant au pilote
            </Link>
          </section>
        </div>
      </div>
    </div>
  );
}
