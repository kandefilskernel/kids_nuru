import Link from "next/link";

const ITEMS = [
  { href: "/admin", label: "Inscrits" },
  { href: "/admin/presence", label: "Présence" },
  { href: "/admin/budget", label: "Budget" },
  { href: "/admin/sondage", label: "Sondage" },
  { href: "/admin/galerie", label: "Galerie" },
  { href: "/admin/reglages", label: "Places" },
  { href: "/admin/tests", label: "Tests" },
  { href: "/admin/enseignants", label: "Enseignants" },
  { href: "/admin/dossiers", label: "Dossiers" },
  { href: "/admin/modele", label: "Modèle" },
  { href: "/admin/export", label: "Export CSV" },
];

export default function AdminNav({ current }: { current: string }) {
  return (
    <nav className="mt-4 flex flex-wrap gap-1.5 text-sm" aria-label="Espace équipe">
      {ITEMS.map((i) => (
        <Link
          key={i.href}
          href={i.href}
          className={`rounded-full px-3.5 py-1.5 font-semibold transition ${
            current === i.href ? "bg-brand text-white" : "bg-white ring-1 ring-ink/15 hover:bg-sky"
          }`}
        >
          {i.label}
        </Link>
      ))}
    </nav>
  );
}
