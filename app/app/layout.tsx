import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { Logo } from "@/components/art";
import "./globals.css";

export const metadata: Metadata = {
  title: "Kids Tech-nuru Lab · Code, robots et IA pour les 5-12 ans à Lubumbashi",
  description:
    "Centre de formation extrascolaire : programmation, systèmes embarqués et intelligence artificielle pour les enfants de 5 à 12 ans à Lubumbashi.",
};

export const viewport: Viewport = { themeColor: "#2740d6" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className="flex min-h-screen flex-col">
        <header className="sticky top-0 z-20 border-b border-ink/10 bg-white/85 backdrop-blur print:hidden">
          <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
            <Link href="/" className="flex items-center gap-2.5">
              <Logo />
              <span className="text-lg font-extrabold tracking-tight text-ink">
                Kids Tech<span className="text-brand">-nuru</span> Lab
              </span>
            </Link>
            <div className="flex items-center gap-1 text-sm font-medium sm:gap-5">
              <Link href="/programme" className="hidden rounded px-2 py-1 hover:text-brand md:block">Programme</Link>
              <Link href="/enseignants" className="hidden rounded px-2 py-1 hover:text-brand md:block">Enseignants</Link>
              <Link href="/#parcours" className="hidden rounded px-2 py-1 hover:text-brand md:block">Parcours</Link>
              <Link href="/#samedi" className="hidden rounded px-2 py-1 hover:text-brand md:block">Un samedi</Link>
              <Link href="/#parents" className="hidden rounded px-2 py-1 hover:text-brand md:block">Parents</Link>
              <Link href="/#faq" className="hidden rounded px-2 py-1 hover:text-brand md:block">FAQ</Link>
              <Link
                href="/inscription"
                className="rounded-full bg-accent px-4 py-2 font-bold text-ink shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                S&apos;inscrire
              </Link>
            </div>
          </nav>
        </header>

        <main className="flex-1">{children}</main>

        <footer className="bg-ink text-white/80 print:hidden">
          <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-4 px-4 py-8 text-sm sm:flex-row sm:items-center">
            <div className="flex items-center gap-2.5">
              <Logo size={30} />
              <div>
                <p className="font-bold text-white">Kids Tech-nuru Lab</p>
                <p className="text-xs">Centre de formation extrascolaire · Lubumbashi</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-x-5 gap-y-2 text-xs">
              <Link href="/inscription" className="hover:text-white">Inscription</Link>
              <Link href="/programme" className="hover:text-white">Programme</Link>
              <Link href="/tech-nuru" className="hover:text-white">Tech nuru</Link>
              <Link href="/enseignants" className="hover:text-white">Enseignants</Link>
              <Link href="/sondage" className="hover:text-white">Questionnaire</Link>
              <Link href="/galerie" className="hover:text-white">Galerie</Link>
              <Link href="/parent" className="hover:text-white">Suivi de mon enfant</Link>
              <Link href="/#faq" className="hover:text-white">FAQ</Link>
              <Link href="/admin" className="hover:text-white">Espace équipe</Link>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
