import { redirect } from "next/navigation";
import { Logo } from "@/components/art";
import { isAdmin } from "@/lib/auth";
import { getSetting } from "@/lib/db";
import { MONTHS, SCENARIOS, parseProjection, simulate } from "@/lib/projection";
import PrintButton from "../../modele/PrintButton";

export const metadata = { title: "Le projet et sa projection sur 3 ans · Kids Tech-nuru Lab", robots: { index: false } };
export const dynamic = "force-dynamic";

const fmt = (n: number) => Math.round(n).toLocaleString("fr-FR");
const month = (m: number | null) => (m === null ? "au-delà de 36 mois" : `mois ${m}`);
const dateFr = (d: Date) =>
  d.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric", timeZone: "Africa/Lubumbashi" });

/* Feuille imprimable : sobre, filets fins, peu d'encre. */
const CSS = `
  .doc { font-family: Arial, Helvetica, sans-serif; color: #1a1a1a; font-size: 9.5pt; line-height: 1.55; background: #fff; }
  .doc .sheet { max-width: 180mm; margin: 0 auto; padding: 12mm 0 8mm; }
  .doc .num { text-align: right; font-variant-numeric: tabular-nums; white-space: nowrap; }
  .doc h1 { margin: 0; font-size: 20pt; font-weight: 700; letter-spacing: -0.02em; color: #111; }
  .doc h2 { margin: 0; font-size: 9pt; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #111; }
  .doc p { margin: 0; }
  .doc ul { margin: 0; padding-left: 14pt; }
  .doc li { margin-bottom: 3pt; }
  .doc section { margin-top: 16pt; }
  .doc .keep { break-inside: avoid; }
  .doc .sec-title { display: flex; gap: 8pt; align-items: baseline; border-bottom: 0.5pt solid #bbb; padding-bottom: 4pt; margin-bottom: 8pt; break-after: avoid; }
  .doc .sec-title span.n { display: inline-flex; align-items: center; justify-content: center; width: 17pt; height: 17pt; border-radius: 50%; background: #2740d6; color: #fff; font-weight: 700; font-size: 8.5pt; flex-shrink: 0; print-color-adjust: exact; -webkit-print-color-adjust: exact; }
  .doc .band { background: linear-gradient(120deg, #0e1647 0%, #1a2a96 100%); color: #fff; border-radius: 10pt; padding: 14pt 18pt; print-color-adjust: exact; -webkit-print-color-adjust: exact; }
  .doc .kicker { font-size: 7.5pt; font-weight: 700; letter-spacing: 0.14em; text-transform: uppercase; color: #ffc233; }
  .doc table { width: 100%; border-collapse: collapse; font-size: 9pt; }
  .doc thead { display: table-header-group; }
  .doc th { font-size: 7.5pt; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: #666; text-align: left; padding: 0 4pt 5pt; border-bottom: 0.5pt solid #bbb; }
  .doc th.num { text-align: right; }
  .doc td { padding: 5pt 4pt; border-bottom: 0.3pt solid #dcdcdc; vertical-align: top; }
  .doc tr { break-inside: avoid; }
  .doc tr.total td { background: #e8edff; border-top: 0.5pt solid #111; border-bottom: none; font-weight: 700; print-color-adjust: exact; -webkit-print-color-adjust: exact; }
  .doc .note { font-size: 9pt; color: #444; margin-bottom: 8pt; }
  .doc .cols { display: grid; grid-template-columns: 1fr 1fr; gap: 14pt; }
  .doc .box { border: 0.5pt solid #bbb; border-radius: 6pt; padding: 8pt 10pt; break-inside: avoid; }
  .doc .box b { display: block; margin-bottom: 3pt; }
  .doc .foot { margin-top: 24pt; padding-top: 6pt; border-top: 0.3pt solid #bbb; font-size: 7.5pt; color: #666; display: flex; justify-content: space-between; gap: 12pt; }
  @page { size: A4; margin: 14mm 16mm 16mm; }
  @media print { .no-print { display: none !important; } .doc .sheet { padding: 0; max-width: none; } }
  @media screen { .doc .sheet { padding: 14mm 16mm 12mm; box-shadow: 0 1px 6px rgba(0,0,0,.15); margin-bottom: 24px; } }
`;

export default async function ImprimerProjetPage() {
  if (!(await isAdmin())) redirect("/admin");
  const proj = parseProjection(await getSetting("projection_3ans"));
  const res = Object.fromEntries(SCENARIOS.map((s) => [s, simulate(proj[s])])) as Record<(typeof SCENARIOS)[number], ReturnType<typeof simulate>>;
  const p = proj["Réaliste"].params;
  const r = res["Réaliste"];
  const now = new Date();

  return (
    <div className="doc">
      <style>{CSS}</style>
      <div className="sheet">
        <div className="no-print" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <p style={{ color: "#555", fontSize: 13 }}>Aperçu du dossier de présentation (A4)</p>
          <PrintButton />
        </div>

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
          <div style={{ textAlign: "right", fontSize: 8.5, lineHeight: 1.5 }}>
            <div className="kicker">Dossier investisseurs</div>
            <div>Édité le {dateFr(now)}</div>
          </div>
        </header>

        <div style={{ marginTop: 18 }}>
          <h1>Le projet et sa projection sur 3 ans</h1>
          <p style={{ marginTop: 4, color: "#333" }}>
            Apprendre aux enfants de 5 à 12 ans à créer la technologie, et non seulement à la consommer.
          </p>
        </div>

        <Section n="1" title="Le projet en bref">
          <p>
            Kids Tech-nuru Lab est un centre de formation extrascolaire à Lubumbashi où les enfants de 5 à 12 ans apprennent la
            programmation, la robotique et l&apos;intelligence artificielle en réalisant de vrais projets, présentés à leurs parents
            en fin de session.
          </p>
        </Section>

        <Section n="2" title="Le problème et la solution">
          <div className="cols">
            <div className="box">
              <b>Le problème</b>
              <ul>
                <li>Peu d&apos;occasions d&apos;initiation au numérique, à l&apos;électronique et à l&apos;IA hors de l&apos;école.</li>
                <li>Des enfants qui utilisent déjà téléphones et tablettes, mais sans apprendre à créer.</li>
                <li>Peu de cadres sûrs, accessibles, avec paiement adapté (mobile money) et suivi clair.</li>
              </ul>
            </div>
            <div className="box">
              <b>La solution</b>
              <ul>
                <li>Un parcours par âge, fondé sur des projets concrets.</li>
                <li>Petits groupes : un animateur pour 8 enfants au plus.</li>
                <li>Paiement par mobile money, reçu numéroté, suivi pour les parents.</li>
                <li>Outils gratuits ou peu coûteux : Scratch, micro:bit, Arduino, Python.</li>
              </ul>
            </div>
          </div>
        </Section>

        <Section n="3" title="Un parcours par âge">
          <table>
            <thead>
              <tr>
                <th>Niveau</th>
                <th>Âge</th>
                <th>Contenu</th>
                <th>Projet final</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Éveil</td>
                <td>5-7 ans</td>
                <td>Logique par le jeu, codage sans écran, robots au sol</td>
                <td>Faire traverser un labyrinthe à un robot</td>
              </tr>
              <tr>
                <td>Explorateur</td>
                <td>8-10 ans</td>
                <td>Scratch, micro:bit, boucles, conditions</td>
                <td>Un jeu ou une alarme de porte</td>
              </tr>
              <tr>
                <td>Créateur</td>
                <td>11-12 ans</td>
                <td>Python, Arduino, capteurs, IA (Teachable Machine)</td>
                <td>Une voiture robot ou un système de reconnaissance d&apos;objets</td>
              </tr>
            </tbody>
          </table>
        </Section>

        <Section n="4" title="Comment le projet gagne de l'argent">
          <ul>
            <li>
              <b>Frais mensuels des familles</b> : {p.fee} USD par enfant et par mois (scénario réaliste), avec {Math.round(p.solidPct * 100)} % de places
              solidaires à tarif réduit de {Math.round(p.reductionPct * 100)} %.
            </li>
            <li>
              <b>Frais d&apos;inscription</b> : {p.regFee} USD à l&apos;arrivée de chaque nouvel enfant.
            </li>
            <li>
              <b>Clubs dans les écoles privées</b> : contrat mensuel de {p.schoolFee} USD par école ({p.schools} école(s) dès le mois {p.schoolStart}).
            </li>
            <li>
              <b>Parrainage d&apos;entreprises</b> : bourses, kits, journée de démonstration ({p.sponsor} USD par mois dès le mois {p.sponsorStart}).
            </li>
          </ul>
        </Section>

        <Section n="5" title="La projection sur 36 mois">
          <p className="note">
            Trois scénarios calculés à partir d&apos;hypothèses saisies par l&apos;équipe. Montants en dollars américains (USD).
          </p>
          <table className="keep">
            <thead>
              <tr>
                <th />
                {SCENARIOS.map((s) => (
                  <th key={s} className="num">
                    {s}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <Cmp label="Seuil de rentabilité (marge durablement positive)" f={(x) => month(x.breakEvenMonth)} res={res} />
              <Cmp label="Retour sur investissement" f={(x) => month(x.paybackMonth)} res={res} />
              <Cmp label="Seuil en enfants, avec un seul site (estimation)" f={(x) => (x.breakEvenChildren === null ? "n/a" : String(x.breakEvenChildren))} res={res} />
              <Cmp label="Enfants en fin d'année 3" f={(x) => String(x.years[2].children)} res={res} />
              <Cmp label="Marge d'exploitation de l'année 3" f={(x) => fmt(x.years[2].margin)} res={res} />
              <Cmp label="Trésorerie cumulée à 36 mois" f={(x) => fmt(x.months[MONTHS - 1].cum)} res={res} />
              <Cmp label="Besoin de financement maximal" f={(x) => fmt(x.need)} res={res} />
              <Cmp label="Levée recommandée (avec marge de sécurité)" f={(x) => fmt(x.ask)} res={res} total />
            </tbody>
          </table>

          <p className="note" style={{ marginTop: 12 }}>
            Détail par année, scénario réaliste :
          </p>
          <table className="keep">
            <thead>
              <tr>
                <th />
                {[1, 2, 3].map((y) => (
                  <th key={y} className="num">
                    Année {y}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(
                [
                  ["Enfants en fin d'année", "children"],
                  ["Recettes", "revenue"],
                  ["Coûts d'exploitation", "cost"],
                  ["Marge d'exploitation", "margin"],
                  ["Investissements", "capex"],
                  ["Trésorerie nette", "net"],
                ] as const
              ).map(([label, k]) => (
                <tr key={k}>
                  <td>{label}</td>
                  {r.years.map((y, i) => (
                    <td key={i} className="num">
                      {fmt(y[k])}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </Section>

        <Section n="6" title="Ce que l'investissement finance">
          <ul>
            <li>Le matériel pédagogique : kits, capteurs, robots, à raison de {fmt(p.capexGroup)} USD par nouveau groupe.</li>
            <li>Le lancement : affiches, outils, aménagement ({fmt(p.capex0)} USD).</li>
            <li>L&apos;ouverture de nouveaux sites : {fmt(p.capexSite)} USD par site.</li>
            <li>Le démarrage de l&apos;activité jusqu&apos;au seuil de rentabilité (creux de trésorerie).</li>
          </ul>
        </Section>

        <Section n="7" title="Sécurité, confiance et suivi">
          <ul>
            <li>Autorisation parentale signée, liste des personnes autorisées à récupérer l&apos;enfant, registre de présence.</li>
            <li>Évaluation à chaque séance et bilan remis aux parents ; attestation et badges de progression.</li>
            <li>Application web : inscriptions, paiements, reçus, présences, finances et tableau de bord pour rendre compte aux partenaires.</li>
            <li>Plan B en cas de coupure d&apos;électricité ou de connexion : activités sans écran, contenus hors ligne.</li>
          </ul>
        </Section>

        <footer className="foot">
          <span>Kids Tech-nuru Lab · Lubumbashi, RD Congo</span>
          <span>Projection indicative, à ajuster avec les devis réels et le sondage des parents</span>
        </footer>
      </div>
    </div>
  );
}

function Section({ n, title, children }: { n: string; title: string; children: React.ReactNode }) {
  return (
    <section>
      <div className="sec-title">
        <span className="n">{n}</span>
        <h2>{title}</h2>
      </div>
      {children}
    </section>
  );
}

function Cmp({
  label,
  f,
  res,
  total,
}: {
  label: string;
  f: (r: ReturnType<typeof simulate>) => string;
  res: Record<(typeof SCENARIOS)[number], ReturnType<typeof simulate>>;
  total?: boolean;
}) {
  return (
    <tr className={total ? "total" : undefined}>
      <td>{label}</td>
      {SCENARIOS.map((s) => (
        <td key={s} className="num">
          {f(res[s])}
        </td>
      ))}
    </tr>
  );
}
