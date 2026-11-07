import { redirect } from "next/navigation";
import { Logo } from "@/components/art";
import { isAdmin } from "@/lib/auth";
import { loadModel } from "../data";
import PrintButton from "../PrintButton";

export const metadata = { title: "Modèle économique · Kids Tech-nuru Lab", robots: { index: false } };
export const dynamic = "force-dynamic";

const fmt = (n: number) => Math.round(n).toLocaleString("fr-FR");
const dateFr = (d: Date) =>
  d.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric", timeZone: "Africa/Lubumbashi" });

/* Feuille imprimable : noir et blanc, filets fins, aucun fond coloré (économie d'encre, lisibilité). */
const CSS = `
  .doc { font-family: Arial, Helvetica, sans-serif; color: #1a1a1a; font-size: 9.5pt; line-height: 1.55; background: #fff; }
  .doc .sheet { max-width: 180mm; margin: 0 auto; padding: 12mm 0 8mm; }
  .doc .num { text-align: right; font-variant-numeric: tabular-nums; white-space: nowrap; }
  .doc h1 { margin: 0; font-size: 20pt; font-weight: 700; letter-spacing: -0.02em; color: #111; }
  .doc h2 { margin: 0; font-size: 9pt; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #111; }
  .doc p { margin: 0; }
  .doc section { margin-top: 18pt; break-inside: avoid; }
  .doc .sec-title { display: flex; gap: 8pt; align-items: baseline; border-bottom: 0.5pt solid #bbb; padding-bottom: 4pt; margin-bottom: 8pt; break-after: avoid; }
  .doc .sec-title span.n { display: inline-flex; align-items: center; justify-content: center; width: 17pt; height: 17pt; border-radius: 50%; background: #2740d6; color: #fff; font-weight: 700; font-size: 8.5pt; flex-shrink: 0; print-color-adjust: exact; -webkit-print-color-adjust: exact; }
  .doc .band { background: linear-gradient(120deg, #0e1647 0%, #1a2a96 100%); color: #fff; border-radius: 10pt; padding: 14pt 18pt; print-color-adjust: exact; -webkit-print-color-adjust: exact; }
  .doc .band .kicker { font-size: 7.5pt; font-weight: 700; letter-spacing: 0.14em; text-transform: uppercase; color: #ffc233; }
  .doc .kpis > div .kpi-value { color: #2740d6; }
  .doc tr.total td { background: #e8edff; print-color-adjust: exact; -webkit-print-color-adjust: exact; }
  .doc table { width: 100%; border-collapse: collapse; font-size: 9pt; }
  .doc thead { display: table-header-group; }
  .doc th { font-size: 7.5pt; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: #666; text-align: left; padding: 0 4pt 5pt; border-bottom: 0.5pt solid #bbb; }
  .doc th.num { text-align: right; }
  .doc td { padding: 5pt 4pt; border-bottom: 0.3pt solid #dcdcdc; vertical-align: top; }
  .doc tr { break-inside: avoid; }
  .doc tr.total td { border-top: 0.5pt solid #111; border-bottom: none; font-weight: 700; padding-top: 7pt; }
  .doc .note { font-size: 9pt; color: #444; margin-bottom: 9pt; }
  .doc .kpis { display: grid; grid-template-columns: repeat(4, 1fr); border-top: 0.5pt solid #111; border-bottom: 0.5pt solid #bbb; margin-top: 16pt; }
  .doc .kpis > div { padding: 9pt 10pt 9pt 0; }
  .doc .kpis > div + div { padding-left: 10pt; border-left: 0.3pt solid #dcdcdc; }
  .doc .kpi-label { font-size: 7.5pt; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: #666; }
  .doc .kpi-value { font-size: 14pt; font-weight: 700; margin-top: 3pt; color: #111; font-variant-numeric: tabular-nums; }
  .doc .kpi-sub { font-size: 7.5pt; color: #666; margin-top: 2pt; }
  .doc .result { font-weight: 700; font-size: 10pt; margin-bottom: 9pt; color: #111; }
  .doc .foot { margin-top: 26pt; padding-top: 6pt; border-top: 0.3pt solid #bbb; font-size: 7.5pt; color: #666; display: flex; justify-content: space-between; gap: 12pt; }
  @page { size: A4; margin: 14mm 16mm 16mm; }
  @media print {
    .no-print { display: none !important; }
    .doc .sheet { padding: 0; max-width: none; }
  }
  @media screen {
    .doc { background: #fff; }
    .doc .sheet { padding: 14mm 16mm 12mm; box-shadow: 0 1px 6px rgba(0,0,0,.15); margin-bottom: 24px; }
  }
`;

export default async function ImprimerPage() {
  if (!(await isAdmin())) redirect("/admin");
  const m = await loadModel();
  const { model, current, scenarios, threshold, children, solidaires, retenuParNiveau, actualByLevel, actualChildren, isPlanned } = m;
  const a = model.assumptions;
  const now = new Date();

  const hypotheses: [string, string][] = [
    ["Frais mensuel par enfant", `${a.fee} USD`],
    ["Réduction pour les places solidaires", `${a.reductionPct} %`],
    ["Samedis par mois", String(a.samedisParMois)],
    ["Durée d'une séance", `${a.heuresSeance} h`],
    ["Taux horaire d'un animateur", `${a.tauxAnimateur} USD`],
    ["Enfants par animateur (au plus)", String(a.enfantsParAnimateur)],
    ["Location de salle", `${a.salleMois} USD / mois`],
    ["Assurance", `${a.assuranceMois} USD / mois`],
    ["Communication et frais divers", `${a.adminMois} USD / mois`],
    ["Soutien des partenaires", `${a.sponsorsMois} USD / mois`],
    ["Durée d'amortissement du matériel", `${a.amortissementMois} mois`],
  ];

  const recettes: [string, number][] = [
    ["Frais des familles", current.revenueFees],
    ["Soutien des partenaires", current.revenueSponsors],
    ...model.revenues.map((l): [string, number] => [l.label, l.amount]),
  ];
  const couts: [string, number][] = [
    ["Animateurs", current.costAnimateurs],
    ["Location de salle", current.costSalle],
    ["Assurance", current.costAssurance],
    ["Communication et frais divers", current.costAdmin],
    ["Matériel (part amortie)", current.costMateriel],
    ...model.costs.map((l): [string, number] => [l.label, l.amount]),
  ];

  return (
    <div className="doc">
      <style>{CSS}</style>
      <div className="sheet">
        <div className="no-print" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <p style={{ color: "#555", fontSize: 13 }}>Aperçu de la fiche partenaires (A4)</p>
          <PrintButton />
        </div>

        {/* En-tête */}
        <header className="band" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ background: "#fff", borderRadius: 10, padding: 4, display: "flex" }}>
              <Logo size={40} />
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 800 }}>Kids Tech-nuru Lab</div>
              <div style={{ fontSize: 8.5, opacity: 0.85 }}>Centre de formation extrascolaire · Lubumbashi, RD Congo</div>
            </div>
          </div>
          <div style={{ textAlign: "right", fontSize: 8.5, lineHeight: 1.5, opacity: 0.95 }}>
            <div className="kicker">Fiche partenaires</div>
            <div>Édité le {dateFr(now)}</div>
            <div>Réf. MOD-{now.toISOString().slice(0, 7).replace("-", "")}</div>
          </div>
        </header>

        {/* Titre */}
        <div style={{ marginTop: 18 }}>
          <div className="kicker" style={{ color: "#2740d6" }}>Modèle économique</div>
          <h1 style={{ marginTop: 3 }}>Le pilote, en chiffres</h1>
          <p style={{ marginTop: 4, fontSize: 9.5, color: "#333" }}>
            Montants indicatifs en dollars américains (USD) par mois, sauf mention contraire.
          </p>
        </div>

        {/* Indicateurs */}
        <div className="kpis">
          <div>
            <div className="kpi-label">Enfants retenus</div>
            <div className="kpi-value">{children}</div>
            <div className="kpi-sub">dont {solidaires} place(s) solidaire(s)</div>
          </div>
          <div>
            <div className="kpi-label">Recettes / mois</div>
            <div className="kpi-value">{fmt(current.revenue)} USD</div>
            <div className="kpi-sub">frais et soutiens</div>
          </div>
          <div>
            <div className="kpi-label">Coûts / mois</div>
            <div className="kpi-value">{fmt(current.cost)} USD</div>
            <div className="kpi-sub">{current.groups} groupe(s) d&apos;animateurs</div>
          </div>
          <div>
            <div className="kpi-label">Marge / mois</div>
            <div className="kpi-value">{fmt(current.margin)} USD</div>
            <div className="kpi-sub">
              {threshold === null ? "équilibre non atteint" : `équilibre dès ${threshold} enfant(s)`}
            </div>
          </div>
        </div>

        {/* 1. Présentation */}
        <Section n="1" title="Présentation">
          <p>{model.notes.intro}</p>
        </Section>

        {/* 2. Hypothèses */}
        <Section n="2" title="Effectifs et hypothèses de calcul">
          <p className="note">
            {isPlanned
              ? "Les calculs reposent sur les effectifs ci-dessous, tels que prévus par l'équipe."
              : "Les calculs reposent sur les inscriptions réelles à la date d'édition."}
          </p>
          <table style={{ marginBottom: "12pt" }}>
            <thead>
              <tr>
                <th>Niveau</th>
                <th className="num">Effectif retenu</th>
                <th className="num">Inscrits actuellement</th>
              </tr>
            </thead>
            <tbody>
              {(["Éveil", "Explorateur", "Créateur"] as const).map((niveau) => (
                <tr key={niveau}>
                  <td>{niveau}</td>
                  <td className="num">{retenuParNiveau[niveau]}</td>
                  <td className="num">{actualByLevel[niveau]}</td>
                </tr>
              ))}
              <tr className="total">
                <td>Total</td>
                <td className="num">{children}</td>
                <td className="num">{actualChildren}</td>
              </tr>
            </tbody>
          </table>
          <table>
            <thead>
              <tr>
                <th>Hypothèse</th>
                <th className="num">Valeur</th>
              </tr>
            </thead>
            <tbody>
              {hypotheses.map(([k, v]) => (
                <tr key={k}>
                  <td>{k}</td>
                  <td className="num">{v}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Section>

        {/* 3. Recettes */}
        <Section n="3" title="Recettes mensuelles">
          <p className="note">{model.notes.revenues}</p>
          <AmountTable
            head="Poste de recette"
            rows={recettes}
            total={["Total des recettes", current.revenue]}
          />
        </Section>

        {/* 4. Coûts */}
        <Section n="4" title="Coûts mensuels">
          <p className="note">{model.notes.costs}</p>
          <AmountTable head="Poste de coût" rows={couts} total={["Total des coûts", current.cost]} />
        </Section>

        {/* 5. Seuil et scénarios */}
        <Section n="5" title="Seuil de rentabilité et scénarios">
          <p className="note">{model.notes.threshold}</p>
          <p className="result">
            {threshold === null
              ? "Le pilote n'atteint pas l'équilibre avec ces hypothèses."
              : `Équilibre à partir de ${threshold} enfant(s) inscrits par mois.`}
          </p>
          <table>
            <thead>
              <tr>
                <th>Nombre d&apos;enfants</th>
                <th className="num">Recettes (USD)</th>
                <th className="num">Coûts (USD)</th>
                <th className="num">Marge (USD)</th>
              </tr>
            </thead>
            <tbody>
              {scenarios.map(({ n, r }) => (
                <tr key={n}>
                  <td>{n}</td>
                  <td className="num">{fmt(r.revenue)}</td>
                  <td className="num">{fmt(r.cost)}</td>
                  <td className="num">{fmt(r.margin)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Section>

        {/* 6. Conclusion */}
        <Section n="6" title="Conclusion">
          <p>{model.notes.conclusion}</p>
        </Section>

        <footer className="foot">
          <span>Kids Tech-nuru Lab · Lubumbashi, RD Congo</span>
          <span>Document indicatif, à ajuster avec les devis réels</span>
        </footer>
      </div>
    </div>
  );
}

function Section({ n, title, children }: { n: string; title: string; children: React.ReactNode }) {
  return (
    <section>
      <div className="sec-title">
        <span className="n">{n}.</span>
        <h2>{title}</h2>
      </div>
      {children}
    </section>
  );
}

function AmountTable({ head, rows, total }: { head: string; rows: [string, number][]; total: [string, number] }) {
  return (
    <table>
      <thead>
        <tr>
          <th>{head}</th>
          <th className="num">Montant (USD / mois)</th>
        </tr>
      </thead>
      <tbody>
        {rows.map(([k, v], i) => (
          <tr key={`${k}-${i}`}>
            <td>{k}</td>
            <td className="num">{fmt(v)}</td>
          </tr>
        ))}
        <tr className="total">
          <td>{total[0]}</td>
          <td className="num">{fmt(total[1])}</td>
        </tr>
      </tbody>
    </table>
  );
}
