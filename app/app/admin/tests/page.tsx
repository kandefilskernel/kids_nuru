import Link from "next/link";
import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/auth";
import { getRegistrations, getSkillTests, SKILLS, type Phase } from "@/lib/db";
import { saveSkillTestAction } from "../actions";
import AdminNav from "../AdminNav";

export const metadata = { title: "Tests d'entrée et de sortie · Kids Tech-nuru Lab", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function TestsPage({ searchParams }: { searchParams: Promise<{ saved?: string }> }) {
  if (!(await isAdmin())) redirect("/admin");
  const { saved } = await searchParams;
  const [registrations, results] = await Promise.all([getRegistrations(), getSkillTests()]);

  return (
    <div className="bg-dots-dark min-h-[calc(100vh-130px)] bg-sky/50">
      <div className="mx-auto max-w-5xl px-4 py-10">
        <Link href="/admin" className="text-sm font-semibold text-brand hover:underline">
          ← Espace équipe
        </Link>
        <AdminNav current="/admin/tests" />
        <h1 className="mt-5 text-3xl font-extrabold tracking-tight">Tests d&apos;entrée et de sortie</h1>
        <p className="mt-2 max-w-3xl text-sm text-ink/65">
          Un test au début du pilote (entrée) et un à la fin (sortie). Pour chaque compétence, cochez
          « réussi » si l&apos;enfant la réalise seul. La progression apparaît sur la fiche de l&apos;enfant.
        </p>

        {saved && (
          <p className="mt-4 rounded-xl bg-mint/15 p-3 text-sm font-semibold text-[#0b7a63] ring-1 ring-mint/40" role="status">
            Test {saved === "sortie" ? "de sortie" : "d'entrée"} enregistré.
          </p>
        )}

        {registrations.length === 0 ? (
          <p className="mt-8 rounded-2xl bg-white p-8 text-center text-ink/60 ring-1 ring-ink/10">
            Aucune inscription pour le moment.
          </p>
        ) : (
          <ul className="mt-6 space-y-4">
            {registrations.map((r) => {
              const res = results[r.id] ?? {};
              return (
                <li key={r.id} className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-ink/10">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-extrabold">
                      {r.childName} <span className="text-sm font-normal text-ink/55">· {r.age} ans · {r.level}</span>
                    </p>
                    <div className="flex gap-2 text-xs font-bold">
                      <Score label="Entrée" value={res.entree} />
                      <Score label="Sortie" value={res.sortie} />
                    </div>
                  </div>
                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    {(["entree", "sortie"] as Phase[]).map((phase) => (
                      <form key={phase} action={saveSkillTestAction} className="rounded-xl bg-sky/50 p-3">
                        <input type="hidden" name="id" value={r.id} />
                        <input type="hidden" name="phase" value={phase} />
                        <p className="text-sm font-bold">{phase === "entree" ? "Test d'entrée" : "Test de sortie"}</p>
                        <div className="mt-2 space-y-1.5">
                          {SKILLS.map((s, i) => (
                            <label key={s} className="flex items-center gap-2 text-sm">
                              <input
                                type="checkbox"
                                name={`s${i + 1}`}
                                defaultChecked={res[phase]?.[i] === true}
                                className="h-4 w-4 accent-brand"
                              />
                              {s}
                            </label>
                          ))}
                        </div>
                        <button className="mt-3 rounded-full bg-ink px-4 py-1.5 text-xs font-bold text-white">
                          Enregistrer
                        </button>
                      </form>
                    ))}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

function Score({ label, value }: { label: string; value?: [boolean, boolean, boolean, boolean] }) {
  if (!value) return <span className="rounded-full bg-ink/5 px-3 py-1 text-ink/50">{label} : —</span>;
  const n = value.filter(Boolean).length;
  return (
    <span className="rounded-full bg-brand/10 px-3 py-1 text-brand">
      {label} : {n}/4
    </span>
  );
}
