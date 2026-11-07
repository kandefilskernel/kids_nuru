import Link from "next/link";
import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/auth";
import { getSurveys, type SurveyRow } from "@/lib/db";
import AdminNav from "../AdminNav";

export const metadata = { title: "Sondage · Kids Tech-nuru Lab", robots: { index: false } };
export const dynamic = "force-dynamic";

/** Premier nombre trouvé dans un texte libre (ex. « 5 000 FC » -> 5000). */
function firstNumber(s: string): number | null {
  const m = s.replace(/\s/g, "").match(/\d+(?:[.,]\d+)?/);
  return m ? Number(m[0].replace(",", ".")) : null;
}

function median(xs: number[]): number | null {
  if (xs.length === 0) return null;
  const s = [...xs].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

function count(rows: SurveyRow[], key: keyof SurveyRow, value: string) {
  return rows.filter((r) => r[key] === value).length;
}

export default async function SondageAdminPage() {
  if (!(await isAdmin())) redirect("/admin");
  const rows = await getSurveys();
  const prices = rows.map((r) => firstNumber(r.acceptablePrice)).filter((n): n is number => n !== null);
  const med = median(prices);
  const yes = count(rows, "pilotInterest", "Oui");

  return (
    <div className="bg-dots-dark min-h-[calc(100vh-130px)] bg-sky/50">
      <div className="mx-auto max-w-6xl px-4 py-10">
        <Link href="/admin" className="text-sm font-semibold text-brand hover:underline">
          ← Espace équipe
        </Link>
        <AdminNav current="/admin/sondage" />
        <div className="mt-5 flex flex-wrap items-end justify-between gap-3">
          <h1 className="text-3xl font-extrabold tracking-tight">Sondage des parents</h1>
          <Link href="/sondage" className="rounded-full bg-white px-4 py-2 text-sm font-semibold ring-1 ring-ink/15 hover:bg-sky">
            Voir le formulaire
          </Link>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-4">
          <Stat label="Réponses" value={String(rows.length)} hint="objectif : 20 à 30" />
          <Stat label="« Oui » pour le pilote" value={String(yes)} hint="seuil de lancement : 8 à 10" />
          <Stat label="« Peut-être »" value={String(count(rows, "pilotInterest", "Peut-être"))} hint="à relancer au mois 3" />
          <Stat label="Prix acceptable (médiane)" value={med === null ? "—" : med.toLocaleString("fr-FR")} hint="à croiser avec le budget" />
        </div>

        {rows.length === 0 ? (
          <p className="mt-8 rounded-2xl bg-white p-8 text-center text-ink/60 ring-1 ring-ink/10">
            Aucune réponse pour le moment. Partagez le lien <code>/sondage</code> aux parents.
          </p>
        ) : (
          <div className="mt-6 overflow-x-auto rounded-2xl bg-white shadow-sm ring-1 ring-ink/10">
            <table className="w-full min-w-[800px] text-left text-sm">
              <thead className="bg-sky/60 text-xs uppercase tracking-wide text-ink/60">
                <tr>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Âge(s)</th>
                  <th className="px-4 py-3">Quartier</th>
                  <th className="px-4 py-3">Intérêt</th>
                  <th className="px-4 py-3">Prix accept.</th>
                  <th className="px-4 py-3">Prix max</th>
                  <th className="px-4 py-3">Paiement</th>
                  <th className="px-4 py-3">Créneau</th>
                  <th className="px-4 py-3">Pilote</th>
                  <th className="px-4 py-3">Contact</th>
                  <th className="px-4 py-3">Remarques</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink/10">
                {rows.map((r) => (
                  <tr key={r.id} className="align-top">
                    <td className="px-4 py-3 whitespace-nowrap">
                      {new Date(r.createdAt).toLocaleDateString("fr-FR", { timeZone: "Africa/Lubumbashi" })}
                    </td>
                    <td className="px-4 py-3">{r.childrenAges}</td>
                    <td className="px-4 py-3">{r.neighborhood}</td>
                    <td className="px-4 py-3">{r.interest}</td>
                    <td className="px-4 py-3">{r.acceptablePrice}</td>
                    <td className="px-4 py-3">{r.maxPrice}</td>
                    <td className="px-4 py-3">{r.paymentMode}</td>
                    <td className="px-4 py-3">{r.bestSlot}</td>
                    <td className="px-4 py-3 font-semibold">{r.pilotInterest}</td>
                    <td className="px-4 py-3">{r.contact}</td>
                    <td className="px-4 py-3">{r.comments}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-ink/10">
      <p className="text-sm font-semibold">{label}</p>
      <p className="mt-1 text-3xl font-extrabold">{value}</p>
      <p className="mt-1 text-xs text-ink/55">{hint}</p>
    </div>
  );
}
