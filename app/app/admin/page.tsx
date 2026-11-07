import Link from "next/link";
import { Logo } from "@/components/art";
import { adminConfigured, isAdmin } from "@/lib/auth";
import {
  getCollectedTotals,
  getDashboardStats,
  getParityTarget,
  getPaymentsForRegistrations,
  getReminders,
  listRegistrationsPage,
  type Level,
  type Payment,
  type Registration,
  type ReminderInfo,
} from "@/lib/db";
import { monthLabel, reminderUrl } from "@/lib/whatsapp";
import { deleteRegistration, login, logout, recordPayment } from "./actions";
import AdminNav from "./AdminNav";
import ReminderButton from "./ReminderButton";

export const metadata = { title: "Espace équipe · Kids Tech-nuru Lab", robots: { index: false } };
export const dynamic = "force-dynamic";

const LEVELS: { name: Level; badge: string; bar: string }[] = [
  { name: "Éveil", badge: "bg-mint/20 text-[#0b7a63]", bar: "bg-mint" },
  { name: "Explorateur", badge: "bg-brand/10 text-brand", bar: "bg-brand" },
  { name: "Créateur", badge: "bg-accent/30 text-[#8a5a00]", bar: "bg-accent" },
];

const PAGE_SIZE = 30;

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; wait?: string; f?: string; q?: string; page?: string }>;
}) {
  const { error, wait, f, q, page } = await searchParams;

  if (!adminConfigured()) {
    return (
      <Shell>
        <div className="mx-auto max-w-md rounded-2xl bg-accent/20 p-6 text-sm ring-1 ring-accent/50">
          Définissez la variable <code className="font-bold">ADMIN_PASSWORD</code> dans{" "}
          <code className="font-bold">.env</code> puis redémarrez le serveur.
        </div>
      </Shell>
    );
  }

  if (!(await isAdmin())) {
    return (
      <Shell>
        <div className="mx-auto max-w-sm rounded-3xl bg-white p-8 shadow-xl ring-1 ring-ink/10">
          <div className="flex flex-col items-center text-center">
            <Logo size={52} />
            <h1 className="mt-4 text-2xl font-extrabold">Espace équipe</h1>
            <p className="mt-1 text-sm text-ink/60">Réservé à l&apos;équipe Kids Tech-nuru Lab</p>
          </div>
          <form action={login} className="mt-6 space-y-4">
            <label className="block text-sm">
              <span className="font-semibold">Mot de passe</span>
              <input
                name="password"
                type="password"
                required
                autoComplete="current-password"
                className="mt-1.5 w-full rounded-xl border border-ink/15 bg-white px-4 py-3 text-base shadow-sm outline-none transition focus:border-brand focus:ring-4 focus:ring-brand/15"
              />
            </label>
            {error === "locked" ? (
              <p className="rounded-xl bg-coral/10 p-3 text-sm font-semibold text-[#b3261e] ring-1 ring-coral/40" role="alert">
                Trop de tentatives. Réessayez dans {Math.max(1, Number(wait) || 15)} minute(s).
              </p>
            ) : (
              error && (
                <p className="rounded-xl bg-coral/10 p-3 text-sm font-semibold text-[#b3261e] ring-1 ring-coral/40" role="alert">
                  Mot de passe incorrect.
                </p>
              )
            )}
            <button className="w-full rounded-full bg-brand px-6 py-3 font-bold text-white shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl">
              Entrer
            </button>
          </form>
        </div>
      </Shell>
    );
  }

  const month = new Date().toISOString().slice(0, 7);
  const filter = f === "pending" || f === "paid" ? f : "all";
  const query = (q ?? "").trim();
  const pageNo = Math.max(1, Number(page) || 1);

  const [stats, totals, reminders, parityTarget, list] = await Promise.all([
    getDashboardStats(month),
    getCollectedTotals(), // les paiements annulés ne comptent pas
    getReminders(month),
    getParityTarget(),
    listRegistrationsPage({ month, filter, query, page: pageNo, pageSize: PAGE_SIZE }),
  ]);
  const shown = list.rows;
  const cardPayments = await getPaymentsForRegistrations(shown.map((r) => r.id));
  const paidOf = (id: string) =>
    (cardPayments[id] ?? []).some((p) => p.month === month && !p.cancelledAt);

  const total = stats.total;
  const paidCount = stats.paidCount;
  const pct = total ? Math.round((paidCount / total) * 100) : 0;
  const { girls, boys, solidarity } = stats;
  const girlPct = girls + boys ? Math.round((girls / (girls + boys)) * 100) : 0;
  const pageCount = Math.max(1, Math.ceil(list.total / PAGE_SIZE));

  const pageHref = (n: number) =>
    `/admin?${new URLSearchParams({
      ...(filter !== "all" && { f: filter }),
      ...(query && { q: query }),
      ...(n > 1 && { page: String(n) }),
    })}`;
  const tabHref = (k: string) => `/admin?${new URLSearchParams({ ...(k !== "all" && { f: k }), ...(q && { q }) })}`;

  return (
    <Shell wide>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Espace équipe</h1>
          <p className="text-sm text-ink/60">Suivi de {monthLabel(month)}</p>
        </div>
        <form action={logout}>
          <button className="rounded-full bg-white px-4 py-2 text-sm font-semibold shadow-sm ring-1 ring-ink/15 transition hover:bg-sky">
            Se déconnecter
          </button>
        </form>
      </div>
      <AdminNav current="/admin" />

      {/* Statistiques */}
      <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-5">
        <div className="col-span-2 rounded-2xl bg-gradient-to-br from-brand to-[#1a2a96] p-5 text-white shadow-md lg:col-span-1">
          <p className="text-sm font-semibold text-white/80">Inscrits</p>
          <p className="mt-1 text-4xl font-extrabold">{total}</p>
          <p className="mt-1 text-xs text-white/70">pilote : 8 à 10 places</p>
        </div>
        {LEVELS.map((l) => {
          const n = stats.levels[l.name];
          return (
            <div key={l.name} className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-ink/10">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold">{l.name}</p>
                <span className={`h-3 w-3 rounded-full ${l.bar}`} />
              </div>
              <p className="mt-1 text-4xl font-extrabold">{n}</p>
              <p className="mt-1 text-xs text-ink/55">{Math.ceil(n / 8)} groupe(s) de 8 max</p>
            </div>
          );
        })}
        <div className="col-span-2 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-ink/10 lg:col-span-1">
          <p className="text-sm font-semibold">Payé ce mois</p>
          <p className="mt-1 text-4xl font-extrabold">
            {paidCount}
            <span className="text-xl text-ink/45"> / {total}</span>
          </p>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-sky">
            <div className="h-full rounded-full bg-mint" style={{ width: `${pct}%` }} />
          </div>
        </div>
      </div>
      {Object.keys(totals).length > 0 && (
        <p className="mt-4 text-sm">
          <span className="font-semibold">Total encaissé :</span>{" "}
          {Object.entries(totals).map(([c, v]) => `${v.toLocaleString("fr-FR")} ${c}`).join("  +  ")}
        </p>
      )}

      {/* Parité et places solidaires */}
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-ink/10">
          <p className="text-sm font-semibold">Parité filles-garçons</p>
          <p className="mt-1 text-2xl font-extrabold">
            {girls} <span className="text-base text-ink/55">filles</span> · {boys} <span className="text-base text-ink/55">garçons</span>
          </p>
          <div className="relative mt-3 h-2 overflow-hidden rounded-full bg-sky">
            <div className="h-full rounded-full bg-[#ff6b5b]" style={{ width: `${girlPct}%` }} />
          </div>
          <p className="mt-1 text-xs text-ink/55">
            {girlPct}% de filles · objectif {parityTarget}% {girlPct >= parityTarget ? "atteint" : "à atteindre"}
          </p>
        </div>
        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-ink/10">
          <p className="text-sm font-semibold">Places solidaires</p>
          <p className="mt-1 text-2xl font-extrabold">{solidarity}</p>
          <p className="mt-1 text-xs text-ink/55">familles ayant demandé un tarif réduit ou gratuit</p>
        </div>
      </div>

      {/* Filtres et recherche */}
      <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
        <nav className="flex gap-1 rounded-full bg-white p-1 shadow-sm ring-1 ring-ink/10" aria-label="Filtre">
          {[
            ["all", "Tous", total],
            ["pending", "En attente", total - paidCount],
            ["paid", "Payés", paidCount],
          ].map(([k, label, n]) => (
            <Link
              key={k as string}
              href={tabHref(k as string)}
              className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${
                filter === k ? "bg-brand text-white" : "hover:bg-sky"
              }`}
            >
              {label} <span className="opacity-70">{n}</span>
            </Link>
          ))}
        </nav>
        <form className="flex gap-2" action="/admin">
          {filter !== "all" && <input type="hidden" name="f" value={filter} />}
          <input
            name="q"
            defaultValue={q ?? ""}
            placeholder="Rechercher un enfant ou un parent"
            className="w-64 rounded-full border border-ink/15 bg-white px-4 py-2 text-sm shadow-sm outline-none focus:border-brand focus:ring-4 focus:ring-brand/15"
          />
          <button className="rounded-full bg-ink px-4 py-2 text-sm font-semibold text-white">OK</button>
        </form>
      </div>

      {/* Fiches */}
      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        {shown.length === 0 && (
          <p className="rounded-2xl bg-white p-8 text-center text-ink/60 ring-1 ring-ink/10 lg:col-span-2">
            {total === 0 ? "Aucune inscription pour le moment." : "Aucun résultat pour ce filtre."}
          </p>
        )}
        {shown.map((r) => (
          <RegistrationCard
            key={r.id}
            r={r}
            month={month}
            paid={paidOf(r.id)}
            info={reminders[r.id]}
            payments={cardPayments[r.id] ?? []}
          />
        ))}
      </div>

      {list.total > PAGE_SIZE && (
        <nav className="mt-6 flex items-center justify-center gap-3 text-sm" aria-label="Pages">
          {pageNo > 1 ? (
            <Link href={pageHref(pageNo - 1)} className="rounded-full bg-white px-4 py-2 font-semibold shadow-sm ring-1 ring-ink/15 hover:bg-sky">
              ← Précédent
            </Link>
          ) : (
            <span className="px-4 py-2 text-ink/35">← Précédent</span>
          )}
          <span className="text-ink/60">
            Page {pageNo} / {pageCount}
          </span>
          {pageNo < pageCount ? (
            <Link href={pageHref(pageNo + 1)} className="rounded-full bg-white px-4 py-2 font-semibold shadow-sm ring-1 ring-ink/15 hover:bg-sky">
              Suivant →
            </Link>
          ) : (
            <span className="px-4 py-2 text-ink/35">Suivant →</span>
          )}
        </nav>
      )}
    </Shell>
  );
}

function Shell({ children, wide }: { children: React.ReactNode; wide?: boolean }) {
  return (
    <div className="bg-dots-dark min-h-[calc(100vh-130px)] bg-sky/50">
      <div className={`mx-auto px-4 py-10 ${wide ? "max-w-6xl" : "max-w-lg"}`}>{children}</div>
    </div>
  );
}

function RegistrationCard({
  r,
  month,
  paid,
  info,
  payments,
}: {
  r: Registration;
  month: string;
  paid: boolean;
  info?: ReminderInfo;
  payments: Payment[];
}) {
  const lvl = LEVELS.find((l) => l.name === r.level)!;
  const url = reminderUrl(r.phone, r.parentName, r.childName, month);
  return (
    <article className="flex flex-col rounded-2xl bg-white p-5 shadow-sm ring-1 ring-ink/10">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-extrabold">{r.childName}</h3>
          <p className="text-sm text-ink/60">
            {r.age} ans{r.school && ` · ${r.school}`}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <span className={`rounded-full px-3 py-1 text-xs font-bold ${lvl.badge}`}>{r.level}</span>
          <span
            className={`rounded-full px-3 py-1 text-xs font-bold ${
              paid ? "bg-mint/20 text-[#0b7a63]" : "bg-coral/15 text-[#b3261e]"
            }`}
          >
            {paid ? "Payé" : "En attente"}
          </span>
        </div>
      </div>

      {r.health && (
        <p className="mt-3 rounded-lg bg-coral/10 px-3 py-2 text-xs font-semibold text-[#b3261e]">
          Santé : {r.health}
        </p>
      )}

      <dl className="mt-4 grid grid-cols-[6.5rem_1fr] gap-y-1 text-sm">
        <dt className="text-ink/55">Parent</dt>
        <dd className="font-semibold">{r.parentName}</dd>
        <dt className="text-ink/55">Téléphone</dt>
        <dd>{r.phone}</dd>
        {r.momoNumber && (
          <>
            <dt className="text-ink/55">Mobile money</dt>
            <dd>{r.momoNumber}</dd>
          </>
        )}
        {r.emergencyContact && (
          <>
            <dt className="text-ink/55">Urgence</dt>
            <dd>{r.emergencyContact}</dd>
          </>
        )}
        <dt className="text-ink/55">Photos</dt>
        <dd>{r.photoConsent ? "autorisées" : "non autorisées"}</dd>
        <dt className="text-ink/55">Genre</dt>
        <dd>{r.gender || "non renseigné"}</dd>
      </dl>
      {r.solidarity && (
        <p className="mt-3 rounded-lg bg-accent/25 px-3 py-2 text-xs font-bold text-[#8a5a00]">Demande de place solidaire</p>
      )}

      <div className="mt-4 border-t border-ink/10 pt-4">
        <form action={recordPayment} className="flex flex-wrap items-center gap-2">
          <input type="hidden" name="registrationId" value={r.id} />
          <input type="hidden" name="month" value={month} />
          <input
            name="amount"
            type="number"
            min="1"
            step="any"
            required
            placeholder="Montant"
            aria-label={`Montant payé pour ${r.childName}`}
            className="w-28 rounded-xl border border-ink/15 px-3 py-2 text-sm outline-none focus:border-brand focus:ring-4 focus:ring-brand/15"
          />
          <select name="currency" aria-label="Devise" className="rounded-xl border border-ink/15 px-2 py-2 text-sm">
            <option>USD</option>
            <option>CDF</option>
          </select>
          <button className="rounded-full bg-accent px-4 py-2 text-sm font-bold text-ink shadow-sm transition hover:-translate-y-0.5">
            Enregistrer le paiement
          </button>
        </form>

        {payments.length > 0 && (
          <ul className="mt-3 space-y-1 text-sm">
            {payments.map((p) => (
              <li key={p.id}>
                <Link
                  href={`/admin/recu/${p.id}`}
                  className={p.cancelledAt ? "text-ink/45 line-through" : "font-semibold text-brand hover:underline"}
                >
                  Reçu {p.month} · {p.amount.toLocaleString("fr-FR")} {p.currency}
                </Link>
                {p.cancelledAt && <span className="ml-2 text-xs font-bold text-[#b3261e]">annulé</span>}
              </li>
            ))}
          </ul>
        )}

        {!paid && (
          <div className="mt-3">
            {url ? (
              <ReminderButton
                url={url}
                registrationId={r.id}
                month={month}
                label={info ? "Relancer à nouveau sur WhatsApp" : "Relancer sur WhatsApp"}
              />
            ) : (
              <p className="text-xs font-semibold text-[#b3261e]">Numéro invalide : relance impossible</p>
            )}
            {info && (
              <p className="mt-1 text-xs text-ink/55">
                Relancé {info.count} fois, dernière le{" "}
                {new Date(info.last).toLocaleDateString("fr-FR", { timeZone: "Africa/Lubumbashi" })}
              </p>
            )}
          </div>
        )}
      </div>

      <Link href={`/admin/fiche/${r.id}`} className="mt-3 text-xs font-semibold text-brand hover:underline">
        Fiche imprimable (bilan, paiements)
      </Link>

      <details className="mt-4 text-xs">
        <summary className="cursor-pointer text-ink/50 hover:text-[#b3261e]">Supprimer cette inscription…</summary>
        <form action={deleteRegistration} className="mt-2 flex items-center gap-3 rounded-lg bg-coral/10 p-3">
          <input type="hidden" name="id" value={r.id} />
          <span className="flex-1 text-[#b3261e]">Supprime aussi ses paiements, reçus et relances. Irréversible.</span>
          <button className="rounded-full bg-[#b3261e] px-3 py-1.5 font-bold text-white">Confirmer</button>
        </form>
      </details>
    </article>
  );
}
