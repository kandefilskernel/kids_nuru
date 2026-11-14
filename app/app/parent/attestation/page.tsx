import { cookies } from "next/headers";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import Attestation, { PRINT_CSS } from "@/components/Attestation";
import PrintButton from "@/components/PrintButton";
import { computeBadges } from "@/lib/badges";
import { getChildHistory, getGalleryForRegistration, getRegistration, getSkillTests } from "@/lib/db";
import { PARENT_COOKIE, readParentSession } from "@/lib/parent";

export const metadata = { title: "Attestation · Kids Tech-nuru Lab", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

/** Attestation pour le parent : disponible une fois le test de sortie enregistré (fin du parcours). */
export default async function ParentAttestationPage() {
  const id = readParentSession((await cookies()).get(PARENT_COOKIE)?.value);
  if (!id) redirect("/parent");
  const r = await getRegistration(id);
  if (!r) notFound();

  const [history, tests, projects] = await Promise.all([
    getChildHistory(id),
    getSkillTests().then((all) => all[id] ?? {}),
    getGalleryForRegistration(id),
  ]);
  if (!tests.sortie) redirect("/parent/suivi");
  const badges = computeBadges({ history, tests, projects: projects.length });

  return (
    <div className="bg-sky/50 px-4 py-8 print:bg-white print:p-0">
      <style>{PRINT_CSS}</style>
      <div className="mx-auto mb-5 flex max-w-5xl flex-wrap items-center justify-between gap-3 print:hidden">
        <Link href="/parent/suivi" className="text-sm font-semibold text-brand hover:underline">
          ← Suivi de mon enfant
        </Link>
        <PrintButton label="Imprimer / PDF" />
      </div>
      <Attestation registration={r} history={history} tests={tests} badges={badges} />
    </div>
  );
}
