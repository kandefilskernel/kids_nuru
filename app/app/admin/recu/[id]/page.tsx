import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { isAdmin } from "@/lib/auth";
import { getReceipt, receiptNumber } from "@/lib/db";
import { cancelPaymentAction } from "../../actions";
import PrintButton from "./PrintButton";

export const metadata = { title: "Reçu · Kids Tech-nuru Lab", robots: { index: false } };
export const dynamic = "force-dynamic";

const MONTHS = [
  "janvier", "février", "mars", "avril", "mai", "juin",
  "juillet", "août", "septembre", "octobre", "novembre", "décembre",
];

function monthLabel(m: string) {
  const [y, mo] = m.split("-");
  return `${MONTHS[Number(mo) - 1] ?? mo} ${y}`;
}

export default async function ReceiptPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  if (!(await isAdmin())) redirect("/admin");
  const { id } = await params;
  const { error } = await searchParams;
  const r = await getReceipt(id);
  if (!r) notFound();
  const { payment: p, registration: c } = r;

  const amount = `${p.amount.toLocaleString("fr-FR", { minimumFractionDigits: 0, maximumFractionDigits: 2 })} ${p.currency}`;
  const date = new Date(p.date).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    timeZone: "Africa/Lubumbashi",
  });

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 print:max-w-none print:p-0">
      <div className="mb-6 flex items-center justify-between print:hidden">
        <Link href="/admin" className="text-sm underline">
          ← Retour à l&apos;espace équipe
        </Link>
        <PrintButton />
      </div>

      {!p.cancelledAt && (
        <form
          action={cancelPaymentAction}
          className="mb-4 flex flex-wrap items-center gap-2 text-sm print:hidden"
        >
          <input type="hidden" name="id" value={p.id} />
          <input
            name="reason"
            required
            minLength={3}
            maxLength={300}
            placeholder="Motif de l'annulation (ex : montant erroné)"
            className="min-w-64 flex-1 rounded border border-gray-300 px-3 py-1"
          />
          <button className="rounded bg-red-600 px-3 py-1 font-semibold text-white">
            Annuler ce paiement
          </button>
          {error === "reason" && (
            <p className="w-full text-red-700" role="alert">
              Indiquez un motif (3 caractères minimum).
            </p>
          )}
        </form>
      )}

      {p.cancelledAt && (
        <div className="mb-4 border-2 border-red-600 bg-red-50 p-3 text-center text-red-700">
          <p className="text-xl font-bold">REÇU ANNULÉ</p>
          <p className="text-sm">
            Annulé le{" "}
            {new Date(p.cancelledAt).toLocaleDateString("fr-FR", {
              day: "2-digit",
              month: "long",
              year: "numeric",
              timeZone: "Africa/Lubumbashi",
            })}
            {p.cancelReason && <> · Motif : {p.cancelReason}</>}
          </p>
        </div>
      )}

      <article
        className={`border-2 border-brand p-8 print:border-black ${p.cancelledAt ? "opacity-60" : ""}`}
      >
        <header className="flex items-start justify-between border-b-2 border-accent pb-4">
          <div>
            <h1 className="text-2xl font-bold text-brand print:text-black">Kids Tech-nuru Lab</h1>
            <p className="text-xs text-gray-600">
              Centre de formation extrascolaire · Lubumbashi
            </p>
          </div>
          <div className="text-right">
            <p className="text-lg font-bold">REÇU DE PAIEMENT</p>
            <p className="font-mono text-sm">{receiptNumber(p)}</p>
            <p className="text-sm">{date}</p>
          </div>
        </header>

        <dl className="mt-6 grid grid-cols-[10rem_1fr] gap-y-2 text-sm">
          <dt className="text-gray-600">Reçu de</dt>
          <dd className="font-semibold">{c.parentName}</dd>
          <dt className="text-gray-600">Pour l&apos;enfant</dt>
          <dd>
            <b>{c.childName}</b> · {c.age} ans · niveau {c.level}
          </dd>
          <dt className="text-gray-600">Objet</dt>
          <dd>Frais mensuels de formation, {monthLabel(p.month)}</dd>
        </dl>

        <div className="my-6 border-y-2 border-dashed py-4 text-center">
          <p className="text-xs uppercase text-gray-600">Montant reçu</p>
          <p className="text-3xl font-bold">{amount}</p>
        </div>

        <div className="mt-10 grid grid-cols-2 gap-8 text-sm">
          <div>
            <p className="text-gray-600">Signature du parent</p>
            <div className="mt-10 border-b" />
          </div>
          <div>
            <p className="text-gray-600">Cachet et signature du centre</p>
            <div className="mt-10 border-b" />
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-gray-500">
          Merci de conserver ce reçu comme justificatif de paiement.
        </p>
      </article>
    </div>
  );
}
