import Link from "next/link";

export const metadata = {
  title: "Tech nuru · Kids Tech-nuru Lab",
  description: "Tech nuru : programmation, robotique et IA pour les enfants de 5 à 12 ans à Lubumbashi.",
};

const TRACKS = [
  { name: "Éveil", ages: "5-7 ans", text: "Logique par le jeu, programmation sans écran, capteurs, lumières et sons.", href: "/programme#éveil" },
  { name: "Explorateur", ages: "8-10 ans", text: "Scratch, mBlock, micro:bit : bloc par bloc, on crée ses premiers jeux.", href: "/programme#explorateur" },
  { name: "Créateur", ages: "11-12 ans", text: "Python, Arduino, premiers projets d'IA : robots et systèmes qui reconnaissent des objets.", href: "/programme#créateur" },
];

export default function TechNuruPage() {
  return (
    <div className="bg-[#f4fafd] text-[#1d2433]">
      {/* Motif hexagonal discret en fond */}
      <section className="relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-60"
          aria-hidden="true"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 15%, rgba(120,190,230,0.25) 0 2px, transparent 3px), radial-gradient(circle at 80% 70%, rgba(120,190,230,0.25) 0 2px, transparent 3px)",
            backgroundSize: "140px 140px",
          }}
        />
        <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-4 py-14 md:grid-cols-2 md:py-20">
          <div>
            <p className="text-sm font-bold uppercase tracking-widest text-[#ef4136]">Tech nuru</p>
            <h1 className="mt-3 text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl">
              Des enfants qui <span className="text-[#ef4136]">créent</span> la technologie de demain.
            </h1>
            <p className="mt-5 max-w-lg text-lg text-[#1d2433]/75">
              Kids Tech-nuru Lab initie les 5 à 12 ans à la programmation, à l&apos;électronique et à l&apos;intelligence
              artificielle, par le jeu et par projets, à Lubumbashi.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/inscription"
                className="rounded-full bg-[#ef4136] px-6 py-3.5 font-bold text-white shadow-lg shadow-[#ef4136]/30 transition hover:-translate-y-0.5"
              >
                Inscrire mon enfant
              </Link>
              <Link
                href="/programme"
                className="rounded-full bg-white px-6 py-3.5 font-bold text-[#1d2433] ring-1 ring-[#1d2433]/15 transition hover:bg-[#e8f4fa]"
              >
                Voir le programme
              </Link>
            </div>
          </div>

          <div className="mx-auto w-full max-w-md">
            <div className="overflow-hidden rounded-[2rem] bg-white p-3 shadow-2xl ring-1 ring-[#1d2433]/10">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/brand/tech-nuru.jpg" alt="Tech nuru" width={640} height={640} className="h-auto w-full rounded-[1.5rem]" />
            </div>
          </div>
        </div>
      </section>

      {/* Parcours */}
      <section className="mx-auto max-w-6xl px-4 py-14">
        <p className="text-sm font-bold uppercase tracking-widest text-[#ef4136]">Nos parcours</p>
        <h2 className="mt-2 text-3xl font-extrabold tracking-tight">Un chemin par tranche d&apos;âge</h2>
        <div className="mt-8 grid gap-5 md:grid-cols-3">
          {TRACKS.map((t, i) => (
            <Link
              key={t.name}
              href={t.href}
              className="group rounded-3xl bg-white p-6 shadow-sm ring-1 ring-[#1d2433]/10 transition hover:-translate-y-1 hover:shadow-xl"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#ef4136] text-lg font-extrabold text-white">
                {i + 1}
              </span>
              <p className="mt-4 text-sm font-bold text-[#1d2433]/55">{t.ages}</p>
              <h3 className="text-2xl font-extrabold">{t.name}</h3>
              <p className="mt-2 text-sm text-[#1d2433]/75">{t.text}</p>
              <p className="mt-4 text-sm font-bold text-[#ef4136] group-hover:underline">Voir les 6 samedis →</p>
            </Link>
          ))}
        </div>
      </section>

      {/* Appel */}
      <section className="mx-auto max-w-6xl px-4 pb-16">
        <div className="flex flex-col items-start justify-between gap-6 rounded-3xl bg-[#1d2433] p-8 text-white md:flex-row md:items-center md:p-10">
          <div>
            <h2 className="text-2xl font-extrabold">Places limitées au pilote</h2>
            <p className="mt-2 max-w-xl text-white/75">8 à 10 enfants par session, un assistant pour 8 enfants au plus, et un projet présenté aux parents.</p>
          </div>
          <Link
            href="/inscription"
            className="shrink-0 rounded-full bg-[#ef4136] px-6 py-3.5 font-bold text-white transition hover:-translate-y-0.5"
          >
            Réserver une place
          </Link>
        </div>
      </section>
    </div>
  );
}
