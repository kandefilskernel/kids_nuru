import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import PageIntro from "@/components/PageIntro";
import { PARENT_COOKIE, readParentSession } from "@/lib/parent";
import { parentLoginAction } from "./actions";

export const metadata = { title: "Suivi de mon enfant · Kids Tech-nuru Lab", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

const field = "mt-1.5 w-full rounded-xl border border-ink/15 bg-white px-4 py-3 text-base outline-none transition focus:border-brand focus:ring-4 focus:ring-brand/15";

export default async function ParentLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; wait?: string }>;
}) {
  // Déjà connecté : direction le suivi.
  if (readParentSession((await cookies()).get(PARENT_COOKIE)?.value)) redirect("/parent/suivi");

  const { error, wait } = await searchParams;

  return (
    <div className="bg-dots-dark min-h-[calc(100vh-130px)] bg-sky/50">
      <div className="mx-auto max-w-md px-4 py-12">
        <PageIntro eyebrow="Espace parents" title="Suivre l'évolution de mon enfant">
          Entrez le code de suivi remis par l&apos;équipe et le téléphone que vous avez indiqué à l&apos;inscription.
        </PageIntro>

        <form action={parentLoginAction} className="space-y-5 rounded-3xl bg-white p-6 shadow-md ring-1 ring-ink/10 sm:p-8">
          <label className="block text-sm">
            <span className="font-semibold">Code de suivi</span>
            <input name="code" required autoComplete="off" autoCapitalize="characters" placeholder="ex : K7QF3M2Z" className={`${field} uppercase tracking-widest`} />
          </label>
          <label className="block text-sm">
            <span className="font-semibold">Téléphone du parent</span>
            <input name="phone" type="tel" required autoComplete="tel" placeholder="ex : +243 97 000 0000" className={field} />
          </label>

          {error === "locked" ? (
            <p className="rounded-xl bg-coral/10 p-3 text-sm font-semibold text-[#b3261e] ring-1 ring-coral/40" role="alert">
              Trop de tentatives. Réessayez dans {Math.max(1, Number(wait) || 15)} minute(s).
            </p>
          ) : (
            error && (
              <p className="rounded-xl bg-coral/10 p-3 text-sm font-semibold text-[#b3261e] ring-1 ring-coral/40" role="alert">
                Code ou téléphone incorrect. Vérifiez ce que l&apos;équipe vous a transmis.
              </p>
            )
          )}

          <button className="w-full rounded-full bg-brand px-6 py-3.5 font-bold text-white shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl">
            Voir le suivi
          </button>
          <p className="text-xs text-ink/55">
            Seules les informations de votre enfant sont visibles. Pour un oubli de code, contactez l&apos;équipe.
          </p>
        </form>
      </div>
    </div>
  );
}
