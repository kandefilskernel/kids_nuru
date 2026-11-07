import { Icon, HeroArt } from "@/components/art";
import RegisterForm from "./RegisterForm";

export const metadata = { title: "Inscription · Kids Tech-nuru Lab" };

const points = [
  { icon: "clock" as const, text: "Inscription en 2 minutes" },
  { icon: "chat" as const, text: "Confirmation et horaires par WhatsApp" },
  { icon: "shield" as const, text: "Autorisation parentale et personnes autorisées à récupérer l'enfant" },
];

export default function Page() {
  return (
    <div className="grid min-h-[calc(100vh-130px)] lg:grid-cols-5">
      <aside className="relative hidden overflow-hidden bg-gradient-to-br from-ink via-[#1a2a96] to-brand p-10 text-white lg:col-span-2 lg:block">
        <div className="bg-dots absolute inset-0" aria-hidden="true" />
        <div className="relative">
          <h1 className="text-3xl font-extrabold leading-tight">Réservez la place de votre enfant</h1>
          <p className="mt-3 text-white/85">
            Atelier pilote : 8 à 10 enfants, 4 à 6 samedis, un projet présenté aux parents à la fin.
          </p>
          <ul className="mt-6 space-y-3 text-sm">
            {points.map((p) => (
              <li key={p.text} className="flex items-center gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/15">
                  <Icon name={p.icon} className="h-5 w-5" />
                </span>
                {p.text}
              </li>
            ))}
          </ul>
          <div className="mt-8 opacity-95">
            <HeroArt />
          </div>
        </div>
      </aside>

      <section className="bg-background px-4 py-10 lg:col-span-3 lg:px-14">
        <div className="mx-auto max-w-xl">
          <h2 className="text-2xl font-extrabold tracking-tight lg:hidden">
            Inscription à l&apos;atelier pilote
          </h2>
          <p className="mb-6 mt-2 text-sm text-ink/70 lg:mt-0">
            Places limitées. Le niveau (Éveil, Explorateur ou Créateur) est choisi automatiquement
            selon l&apos;âge de l&apos;enfant.
          </p>
          <RegisterForm />
        </div>
      </section>
    </div>
  );
}
