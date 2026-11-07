import { notFound, redirect } from "next/navigation";
import { Logo } from "@/components/art";
import { isAdmin } from "@/lib/auth";
import { getTeacherRequest } from "@/lib/db";
import { teacherRef } from "@/lib/whatsapp";
import PrintButton from "../../../modele/PrintButton";

export const metadata = { title: "Récépissé · Kids Tech-nuru Lab", robots: { index: false } };
export const dynamic = "force-dynamic";

const CSS = `
  .rcp { font-family: Arial, Helvetica, sans-serif; color: #1a1a1a; font-size: 10pt; line-height: 1.55; background: #fff; }
  .rcp .sheet { max-width: 180mm; margin: 0 auto; padding: 12mm 0 8mm; }
  .rcp h1 { margin: 0; font-size: 18pt; font-weight: 700; letter-spacing: -0.01em; color: #111; }
  .rcp table { width: 100%; border-collapse: collapse; font-size: 9.5pt; margin-top: 12pt; }
  .rcp th { width: 36%; text-align: left; font-weight: 700; padding: 6pt 6pt 6pt 0; border-bottom: 0.3pt solid #dcdcdc; vertical-align: top; color: #333; }
  .rcp td { padding: 6pt 0; border-bottom: 0.3pt solid #dcdcdc; vertical-align: top; }
  .rcp .sign { margin-top: 36pt; display: flex; justify-content: space-between; gap: 24pt; }
  .rcp .sign > div { flex: 1; font-size: 9.5pt; }
  .rcp .line { margin-top: 36pt; border-top: 0.5pt solid #111; padding-top: 4pt; }
  .rcp .foot { margin-top: 28pt; padding-top: 6pt; border-top: 0.3pt solid #bbb; font-size: 7.5pt; color: #666; display: flex; justify-content: space-between; gap: 12pt; }
  @page { size: A4; margin: 14mm 16mm 16mm; }
  @media print {
    .no-print { display: none !important; }
    .rcp .sheet { padding: 0; max-width: none; }
  }
  @media screen {
    .rcp .sheet { padding: 14mm 16mm 12mm; box-shadow: 0 1px 6px rgba(0,0,0,.15); margin-bottom: 24px; }
  }
`;

export default async function RecepissePage({ params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin())) redirect("/admin");
  const { id } = await params;
  if (!/^\d+$/.test(id)) notFound();
  const r = await getTeacherRequest(id);
  if (!r) notFound();

  const ref = teacherRef(r.id, r.createdAt);
  const received = new Date(r.createdAt).toLocaleDateString("fr-FR", {
    day: "numeric", month: "long", year: "numeric", timeZone: "Africa/Lubumbashi",
  });
  const today = new Date().toLocaleDateString("fr-FR", {
    day: "numeric", month: "long", year: "numeric", timeZone: "Africa/Lubumbashi",
  });

  return (
    <div className="rcp">
      <style>{CSS}</style>
      <div className="sheet">
        <div className="no-print" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <p style={{ color: "#555", fontSize: 13 }}>Récépissé à imprimer en PDF puis à joindre au message de l&apos;enseignant</p>
          <PrintButton />
        </div>

        {r.status !== "Acceptée" ? (
          <p className="no-print" style={{ padding: 12, borderRadius: 8, background: "#fff4d6", fontSize: 13 }}>
            Ce récépissé n&apos;est édité que pour une demande acceptée. Statut actuel : {r.status}.
          </p>
        ) : null}

        <header style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, paddingBottom: 12, borderBottom: "0.5pt solid #111" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Logo size={44} />
            <div>
              <div style={{ fontSize: 13, fontWeight: 700 }}>Kids Tech-nuru Lab</div>
              <div style={{ fontSize: 8.5, color: "#444" }}>Centre de formation extrascolaire · Lubumbashi, RD Congo</div>
            </div>
          </div>
          <div style={{ textAlign: "right", fontSize: 8.5, color: "#444", lineHeight: 1.5 }}>
            <div style={{ fontWeight: 700, color: "#111", fontSize: 9 }}>Réf. {ref}</div>
            <div>Édité le {today}</div>
          </div>
        </header>

        <div style={{ marginTop: 18 }}>
          <h1>Récépissé d&apos;acceptation de demande</h1>
          <p style={{ marginTop: 10 }}>
            Kids Tech-nuru Lab confirme avoir reçu la demande ci-dessous, reçue le {received}, et l&apos;accepter.
          </p>
        </div>

        <table>
          <tbody>
            <tr><th>Référence</th><td>{ref}</td></tr>
            <tr><th>Enseignant(e)</th><td>{r.name}{r.role ? ` · ${r.role}` : ""}</td></tr>
            <tr><th>École</th><td>{r.school || "non précisée"}</td></tr>
            <tr><th>Téléphone</th><td>{r.phone}</td></tr>
            <tr><th>Format proposé</th><td>{r.format}</td></tr>
            <tr><th>Niveaux concernés</th><td>{r.levels || "non précisé"}</td></tr>
            <tr><th>Nombre d&apos;élèves</th><td>{r.pupils || "non précisé"}</td></tr>
            <tr><th>Créneau souhaité</th><td>{r.slot || "non précisé"}</td></tr>
            <tr><th>Date de réception</th><td>{received}</td></tr>
          </tbody>
        </table>

        <p style={{ marginTop: 18 }}>
          Les modalités (date de démarrage, salle, tarif éventuel) seront confirmées par écrit avec l&apos;équipe.
        </p>

        <div className="sign">
          <div>
            <div className="line">Pour Kids Tech-nuru Lab</div>
            <div style={{ fontSize: 8.5, color: "#666" }}>Nom, fonction et signature</div>
          </div>
          <div>
            <div className="line">Pour l&apos;école</div>
            <div style={{ fontSize: 8.5, color: "#666" }}>Nom, fonction et signature</div>
          </div>
        </div>

        <footer className="foot">
          <span>Kids Tech-nuru Lab · Lubumbashi, RD Congo</span>
          <span>{ref}</span>
        </footer>
      </div>
    </div>
  );
}
