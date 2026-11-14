import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import Attestation, { PRINT_CSS } from "@/components/Attestation";
import PrintButton from "@/components/PrintButton";
import { isAdmin } from "@/lib/auth";
import { computeBadges } from "@/lib/badges";
import { getChildHistory, getGalleryForRegistration, getRegistration, getSkillTests } from "@/lib/db";

export const metadata = { title: "Attestation · Kids Tech-nuru Lab", robots: { index: false } };
export const dynamic = "force-dynamic";


export default async function AdminAttestationPage({ params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin())) redirect("/admin");
  const { id } = await params;
  const r = await getRegistration(id);
  if (!r) notFound();

  const [history, tests, projects] = await Promise.all([
    getChildHistory(r.id),
    getSkillTests().then((all) => all[r.id] ?? {}),
    getGalleryForRegistration(r.id),
  ]);
  const badges = computeBadges({ history, tests, projects: projects.length });

  return (
    <div className="bg-sky/50 px-4 py-8 print:bg-white print:p-0">
      <style>{PRINT_CSS}</style>
      <div className="mx-auto mb-5 flex max-w-5xl flex-wrap items-center justify-between gap-3 print:hidden">
        <Link href={`/admin/fiche/${r.id}`} className="text-sm font-semibold text-brand hover:underline">
          ← Fiche de {r.childName}
        </Link>
        <span className="flex items-center gap-3">
          {!tests.sortie && <span className="text-xs text-ink/60">Test de sortie pas encore enregistré.</span>}
          <PrintButton label="Imprimer / PDF" />
        </span>
      </div>
      <Attestation registration={r} history={history} tests={tests} badges={badges} />
    </div>
  );
}
