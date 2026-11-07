import Link from "next/link";
import { CreateurArt, EveilArt, ExplorateurArt, HeroArt, Icon } from "@/components/art";

const facts = [
  { big: "5-12", small: "ans, trois niveaux" },
  { big: "8", small: "enfants max par assistant" },
  { big: "4-6", small: "samedis de pilote" },
  { big: "1", small: "projet final présenté aux parents" },
];

const levels = [
  {
    name: "Éveil",
    age: "5-7 ans",
    tag: "bg-mint/20 text-[#0b7a63]",
    art: <EveilArt />,
    content: "Logique par le jeu, programmation sans écran, découverte des capteurs, des lumières et des sons.",
    tools: ["Cartes de codage", "Robots au sol"],
    project: "Faire traverser un labyrinthe à un robot au sol",
  },
  {
    name: "Explorateur",
    age: "8-10 ans",
    tag: "bg-brand/10 text-brand",
    art: <ExplorateurArt />,
    content: "Programmation par blocs, boucles, conditions et variables, circuits simples et premiers capteurs.",
    tools: ["Scratch", "mBlock", "micro:bit"],
    project: "Un jeu Scratch ou une alarme de porte avec micro:bit",
  },
  {
    name: "Créateur",
    age: "11-12 ans",
    tag: "bg-accent/30 text-[#8a5a00]",
    art: <CreateurArt />,
    content: "Python, capteurs et moteurs avec Arduino, premiers projets d'IA, initiation au web et aux applications mobiles.",
    tools: ["Python", "Arduino", "Teachable Machine", "App Inventor"],
    project: "Une voiture robot ou un système qui reconnaît des objets du quotidien",
  },
];

const saturday = [
  { min: 10, label: "Accueil", color: "bg-brand" },
  { min: 20, label: "Découverte", color: "bg-mint" },
  { min: 60, label: "Pratique en équipe", color: "bg-accent" },
  { min: 10, label: "Pause", color: "bg-coral" },
  { min: 15, label: "Défi et partage", color: "bg-brand" },
  { min: 5, label: "Rangement", color: "bg-mint" },
];

const steps = [
  { n: "1", title: "Vous vous inscrivez", text: "Un formulaire de 2 minutes. Le niveau est choisi selon l'âge de l'enfant." },
  { n: "2", title: "Nous vous contactons", text: "Confirmation, horaires du samedi et réponse à vos questions sur WhatsApp." },
  { n: "3", title: "Votre enfant crée", text: "Séances pratiques, en petits groupes, avec du vrai matériel." },
  { n: "4", title: "Il présente son projet", text: "À la fin de la session, il montre ce qu'il a fabriqué à sa famille." },
];

const parents = [
  { icon: "shield" as const, title: "Un cadre sûr", text: "Autorisation parentale signée, liste des personnes autorisées à récupérer l'enfant, registre de présence." },
  { icon: "users" as const, title: "Petits groupes", text: "Un assistant pour 8 enfants au plus, avec des groupes séparés par tranche d'âge." },
  { icon: "phone" as const, title: "Paiement mobile money", text: "Réglez les frais depuis votre téléphone et recevez un reçu numéroté pour chaque paiement." },
  { icon: "trophy" as const, title: "Des résultats concrets", text: "Chaque niveau se termine par un projet réalisé et présenté, pas seulement des exercices." },
];

const faqs = [
  { q: "À partir de quel âge mon enfant peut-il venir ?", a: "À partir de 5 ans, jusqu'à 12 ans. Les 5-7 ans travaillent d'abord sans écran, avec des cartes de codage et des robots au sol." },
  { q: "Faut-il un ordinateur à la maison ?", a: "Non, pas pour les séances : les kits sont partagés et restent sous la garde de l'animateur. Pour les ordinateurs ou tablettes, nous vous précisons à l'inscription ce qui est prêté et ce qu'il faut éventuellement apporter." },
  { q: "Mon enfant n'a jamais programmé : est-ce un problème ?", a: "Pas du tout. Chaque niveau commence par les bases et l'enfant progresse sur un parcours continu d'une tranche d'âge à l'autre." },
  { q: "Que se passe-t-il en cas de coupure d'électricité ?", a: "Nous prévoyons toujours des activités sans écran, des batteries et des contenus hors ligne. La séance continue." },
  { q: "Combien ça coûte ?", a: "Les tarifs sont fixés après un sondage auprès des parents, pour qu'ils restent accessibles. Inscrivez-vous : nous vous communiquons le montant et les modalités de paiement par mobile money." },
  { q: "Est-ce une université ?", a: "Non. Kids Tech-nuru Lab est un centre de formation extrascolaire pour enfants." },
];

export default function Home() {
  return (
    <>
      {/* HERO */}
      <section className="relative overflow-hidden bg-gradient-to-br from-ink via-[#1a2a96] to-brand text-white">
        <div className="bg-dots absolute inset-0" aria-hidden="true" />
        <div className="relative mx-auto grid max-w-6xl items-center gap-6 px-4 py-14 md:grid-cols-2 md:py-20">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-sm font-semibold ring-1 ring-white/20">
              <span className="h-2 w-2 rounded-full bg-mint" /> Atelier pilote à Lubumbashi
            </p>
            <h1 className="mt-5 text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
              Ils ne font pas que <span className="text-accent">jouer</span> avec la technologie.{" "}
              <span className="text-mint">Ils la créent.</span>
            </h1>
            <p className="mt-5 max-w-xl text-lg text-white/85">
              Programmation, robots et intelligence artificielle pour les enfants de 5 à 12 ans :
              des projets concrets, en petits groupes, présentés fièrement aux parents.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/inscription"
                className="rounded-full bg-accent px-6 py-3.5 text-base font-bold text-ink shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl"
              >
                Inscrire mon enfant au pilote
              </Link>
              <Link
                href="#parcours"
                className="rounded-full bg-white/10 px-6 py-3.5 text-base font-semibold ring-1 ring-white/30 transition hover:bg-white/20"
              >
                Découvrir le parcours
              </Link>
            </div>
          </div>
          <div className="mx-auto w-full max-w-md md:max-w-none">
            <HeroArt />
          </div>
        </div>
      </section>

      {/* CHIFFRES */}
      <section className="relative z-10 mx-auto -mt-8 max-w-5xl px-4">
        <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl bg-ink/10 shadow-xl ring-1 ring-ink/10 md:grid-cols-4">
          {facts.map((f) => (
            <div key={f.small} className="bg-white px-4 py-5 text-center">
              <dt className="text-3xl font-extrabold text-brand">{f.big}</dt>
              <dd className="mt-1 text-sm text-ink/70">{f.small}</dd>
            </div>
          ))}
        </dl>
      </section>

      {/* PARCOURS */}
      <section id="parcours" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-20">
        <p className="text-sm font-bold uppercase tracking-widest text-brand">Le parcours</p>
        <h2 className="mt-2 max-w-2xl text-3xl font-extrabold tracking-tight sm:text-4xl">
          Un programme taillé pour chaque âge, un fil rouge : la programmation
        </h2>
        <p className="mt-4 max-w-2xl text-ink/75">
          La programmation relie l&apos;IA et les systèmes embarqués. Chaque enfant avance sur un
          parcours continu d&apos;une tranche d&apos;âge à l&apos;autre.
        </p>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {levels.map((l) => (
            <article
              key={l.name}
              className="group flex flex-col overflow-hidden rounded-3xl bg-white shadow-md ring-1 ring-ink/10 transition hover:-translate-y-1 hover:shadow-xl"
            >
              <div className="aspect-[200/130] w-full p-3 pb-0">{l.art}</div>
              <div className="flex flex-1 flex-col p-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-2xl font-extrabold">{l.name}</h3>
                  <span className={`rounded-full px-3 py-1 text-xs font-bold ${l.tag}`}>{l.age}</span>
                </div>
                <p className="mt-3 text-sm text-ink/75">{l.content}</p>
                <ul className="mt-4 flex flex-wrap gap-1.5">
                  {l.tools.map((t) => (
                    <li key={t} className="rounded-md bg-sky px-2 py-1 text-xs font-semibold text-brand">{t}</li>
                  ))}
                </ul>
                <div className="mt-auto pt-5">
                  <p className="text-xs font-bold uppercase tracking-wider text-ink/50">Projet final</p>
                  <p className="mt-1 text-sm font-semibold">{l.project}</p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* UN SAMEDI */}
      <section id="samedi" className="bg-dots-dark scroll-mt-20 bg-sky/60">
        <div className="mx-auto max-w-6xl px-4 py-20">
          <p className="text-sm font-bold uppercase tracking-widest text-brand">Un samedi type</p>
          <h2 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">
            2 heures, dont 1 heure à fabriquer
          </h2>
          <p className="mt-4 max-w-2xl text-ink/75">
            Chaque séance suit le même rythme : de quoi comprendre, essayer, se tromper, recommencer
            et partager.
          </p>
          <div className="mt-10 flex h-14 overflow-hidden rounded-2xl shadow-md ring-1 ring-ink/10" role="img" aria-label="Répartition d'une séance de 2 heures">
            {saturday.map((s) => (
              <div key={s.label} className={`${s.color} flex items-center justify-center text-xs font-bold text-white`} style={{ flexGrow: s.min }}>
                {s.min >= 15 ? `${s.min} min` : ""}
              </div>
            ))}
          </div>
          <ul className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 text-sm sm:grid-cols-3 lg:grid-cols-6">
            {saturday.map((s) => (
              <li key={s.label} className="flex items-center gap-2">
                <span className={`h-3 w-3 shrink-0 rounded-full ${s.color}`} />
                <span><b>{s.label}</b> <span className="text-ink/60">{s.min} min</span></span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* COMMENT CA MARCHE */}
      <section className="mx-auto max-w-6xl px-4 py-20">
        <p className="text-sm font-bold uppercase tracking-widest text-brand">Comment ça marche</p>
        <h2 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">De l&apos;inscription au projet final</h2>
        <ol className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((s) => (
            <li key={s.n} className="relative rounded-2xl bg-white p-6 shadow-sm ring-1 ring-ink/10">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand text-xl font-extrabold text-white">{s.n}</span>
              <h3 className="mt-4 text-lg font-bold">{s.title}</h3>
              <p className="mt-2 text-sm text-ink/70">{s.text}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* EN IMAGES */}
      <section className="mx-auto max-w-6xl px-4 pb-20">
        <div className="grid gap-5 md:grid-cols-2">
          <figure className="overflow-hidden rounded-3xl shadow-md ring-1 ring-ink/10">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/photos/child-tablet.jpg" alt="Un enfant qui apprend le code sur une tablette, à côté de blocs colorés" className="h-52 w-full object-cover sm:h-72" loading="lazy" />
            <figcaption className="bg-white px-4 py-3 text-sm text-ink/70">Apprendre le code par le jeu</figcaption>
          </figure>
          <figure className="overflow-hidden rounded-3xl shadow-md ring-1 ring-ink/10">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/photos/teens-laptop.jpg" alt="Des adolescents qui travaillent ensemble sur un ordinateur pour un projet" className="h-52 w-full object-cover sm:h-72" loading="lazy" />
            <figcaption className="bg-white px-4 py-3 text-sm text-ink/70">Des projets réalisés en équipe</figcaption>
          </figure>
        </div>
        <p className="mt-3 text-right text-xs text-ink/50">
          Photos : Pexels, licence gratuite (Vanessa Loring et Robo Wunderkind)
        </p>
      </section>

      {/* ENSEIGNANTS */}
      <section className="mx-auto max-w-6xl px-4 pb-20">
        <div className="flex flex-col items-start justify-between gap-6 rounded-3xl bg-ink p-8 text-white shadow-xl md:flex-row md:items-center md:p-10">
          <div>
            <p className="text-sm font-bold uppercase tracking-widest text-accent">Pour les écoles</p>
            <h2 className="mt-2 text-2xl font-extrabold sm:text-3xl">Vous êtes enseignant ? Faites venir l&apos;atelier chez vous.</h2>
            <p className="mt-2 max-w-xl text-white/75">
              Une intervention ponctuelle, un cycle de 6 samedis pour vos élèves, ou une formation pour vos équipes.
            </p>
          </div>
          <Link
            href="/enseignants"
            className="shrink-0 rounded-full bg-accent px-6 py-3.5 font-bold text-ink shadow-lg transition hover:-translate-y-0.5"
          >
            Envoyer une demande
          </Link>
        </div>
      </section>

      {/* PARENTS */}
      <section id="parents" className="scroll-mt-20 bg-ink text-white">
        <div className="mx-auto max-w-6xl px-4 py-20">
          <p className="text-sm font-bold uppercase tracking-widest text-accent">Pour les parents</p>
          <h2 className="mt-2 max-w-2xl text-3xl font-extrabold tracking-tight sm:text-4xl">
            Confier son enfant en toute confiance
          </h2>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {parents.map((p) => (
              <div key={p.title} className="rounded-2xl bg-white/5 p-6 ring-1 ring-white/10">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent text-ink">
                  <Icon name={p.icon} />
                </span>
                <h3 className="mt-4 text-lg font-bold">{p.title}</h3>
                <p className="mt-2 text-sm text-white/75">{p.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="mx-auto max-w-3xl scroll-mt-20 px-4 py-20">
        <p className="text-sm font-bold uppercase tracking-widest text-brand">Questions fréquentes</p>
        <h2 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">Vous vous demandez…</h2>
        <div className="mt-8 space-y-3">
          {faqs.map((f) => (
            <details key={f.q} className="rounded-2xl bg-white shadow-sm ring-1 ring-ink/10">
              <summary className="flex cursor-pointer items-center justify-between gap-4 px-5 py-4 font-bold">
                {f.q}
                <svg className="chev h-5 w-5 shrink-0 text-brand transition" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </summary>
              <p className="px-5 pb-5 text-sm text-ink/75">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="px-4 pb-20">
        <div className="relative mx-auto max-w-5xl overflow-hidden rounded-3xl bg-gradient-to-r from-brand to-[#5a2be2] px-6 py-14 text-center text-white shadow-xl">
          <div className="bg-dots absolute inset-0" aria-hidden="true" />
          <div className="relative">
            <h2 className="text-3xl font-extrabold sm:text-4xl">Les places du pilote sont limitées</h2>
            <p className="mx-auto mt-3 max-w-xl text-white/85">
              8 à 10 enfants seulement pour garder un accompagnement de qualité. Réservez la place de votre enfant.
            </p>
            <Link
              href="/inscription"
              className="mt-7 inline-block rounded-full bg-accent px-8 py-4 font-bold text-ink shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl"
            >
              Inscrire mon enfant
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
