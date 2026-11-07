import { Pool } from "pg";
import { randomUUID } from "crypto";

export type Level = "Éveil" | "Explorateur" | "Créateur";

export type Registration = {
  id: string;
  createdAt: string;
  childName: string;
  age: number;
  level: Level;
  school: string;
  health: string;
  parentName: string;
  phone: string;
  momoNumber: string;
  emergencyContact: string;
  photoConsent: boolean;
  gender: "Fille" | "Garçon" | "";
  solidarity: boolean;
};

export type Payment = {
  id: string;
  registrationId: string;
  month: string; // YYYY-MM
  amount: number;
  currency: "USD" | "CDF";
  date: string;
  receiptNo: number;
  cancelledAt: string | null;
  cancelReason: string | null;
};

export function receiptNumber(p: Pick<Payment, "receiptNo" | "date">) {
  return `REC-${p.date.slice(0, 4)}-${String(p.receiptNo).padStart(5, "0")}`;
}

export function levelForAge(age: number): Level | null {
  if (age >= 5 && age <= 7) return "Éveil";
  if (age >= 8 && age <= 10) return "Explorateur";
  if (age >= 11 && age <= 12) return "Créateur";
  return null;
}

const g = globalThis as unknown as { __pool?: Pool; __ready?: Promise<void> };

function pool(): Pool {
  if (!g.__pool) {
    if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL n'est pas défini");
    g.__pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 10 });
  }
  return g.__pool;
}

const SCHEMA = `
CREATE TABLE IF NOT EXISTS registrations (
  id TEXT PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  child_name TEXT NOT NULL,
  age SMALLINT NOT NULL CHECK (age BETWEEN 5 AND 12),
  level TEXT NOT NULL,
  school TEXT NOT NULL DEFAULT '',
  health TEXT NOT NULL DEFAULT '',
  parent_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  momo_number TEXT NOT NULL DEFAULT '',
  emergency_contact TEXT NOT NULL DEFAULT '',
  photo_consent BOOLEAN NOT NULL DEFAULT false
);
CREATE TABLE IF NOT EXISTS payments (
  id TEXT PRIMARY KEY,
  registration_id TEXT NOT NULL REFERENCES registrations(id) ON DELETE CASCADE,
  month CHAR(7) NOT NULL,
  amount NUMERIC(14,2) NOT NULL CHECK (amount > 0),
  currency TEXT NOT NULL CHECK (currency IN ('USD','CDF')),
  paid_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS payments_reg_month ON payments (registration_id, month);
ALTER TABLE payments ADD COLUMN IF NOT EXISTS receipt_no SERIAL;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS cancel_reason TEXT;
CREATE TABLE IF NOT EXISTS reminders (
  id BIGSERIAL PRIMARY KEY,
  registration_id TEXT NOT NULL REFERENCES registrations(id) ON DELETE CASCADE,
  month CHAR(7) NOT NULL,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS reminders_reg_month ON reminders (registration_id, month);
CREATE TABLE IF NOT EXISTS login_failures (
  id BIGSERIAL PRIMARY KEY,
  ip TEXT NOT NULL,
  at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS login_failures_ip_at ON login_failures (ip, at);
CREATE TABLE IF NOT EXISTS attendance (
  registration_id TEXT NOT NULL REFERENCES registrations(id) ON DELETE CASCADE,
  session_date DATE NOT NULL,
  present BOOLEAN NOT NULL DEFAULT false,
  PRIMARY KEY (registration_id, session_date)
);
ALTER TABLE attendance ADD COLUMN IF NOT EXISTS challenge_done BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE attendance ADD COLUMN IF NOT EXISTS helped_peer BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE registrations ADD COLUMN IF NOT EXISTS gender TEXT NOT NULL DEFAULT '';
ALTER TABLE registrations ADD COLUMN IF NOT EXISTS solidarity BOOLEAN NOT NULL DEFAULT false;
CREATE TABLE IF NOT EXISTS teacher_requests (
  id BIGSERIAL PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  name TEXT NOT NULL,
  school TEXT NOT NULL DEFAULT '',
  role TEXT NOT NULL DEFAULT '',
  phone TEXT NOT NULL,
  levels TEXT NOT NULL DEFAULT '',
  pupils TEXT NOT NULL DEFAULT '',
  format TEXT NOT NULL DEFAULT '',
  slot TEXT NOT NULL DEFAULT '',
  message TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'Nouvelle',
  note TEXT NOT NULL DEFAULT ''
);
ALTER TABLE teacher_requests ADD COLUMN IF NOT EXISTS file_name TEXT;
ALTER TABLE teacher_requests ADD COLUMN IF NOT EXISTS file_type TEXT;
ALTER TABLE teacher_requests ADD COLUMN IF NOT EXISTS file_size INTEGER;
ALTER TABLE teacher_requests ADD COLUMN IF NOT EXISTS data BYTEA;
CREATE TABLE IF NOT EXISTS dossiers (
  id BIGSERIAL PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'À traiter',
  note TEXT NOT NULL DEFAULT '',
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  data BYTEA NOT NULL
);
CREATE TABLE IF NOT EXISTS skill_tests (
  registration_id TEXT NOT NULL REFERENCES registrations(id) ON DELETE CASCADE,
  phase TEXT NOT NULL CHECK (phase IN ('entree','sortie')),
  s1 BOOLEAN NOT NULL DEFAULT false,
  s2 BOOLEAN NOT NULL DEFAULT false,
  s3 BOOLEAN NOT NULL DEFAULT false,
  s4 BOOLEAN NOT NULL DEFAULT false,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (registration_id, phase)
);
CREATE TABLE IF NOT EXISTS survey_responses (
  id BIGSERIAL PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  children_ages TEXT NOT NULL DEFAULT '',
  neighborhood TEXT NOT NULL DEFAULT '',
  interest TEXT NOT NULL DEFAULT '',
  acceptable_price TEXT NOT NULL DEFAULT '',
  max_price TEXT NOT NULL DEFAULT '',
  payment_mode TEXT NOT NULL DEFAULT '',
  best_slot TEXT NOT NULL DEFAULT '',
  pilot_interest TEXT NOT NULL DEFAULT '',
  contact TEXT NOT NULL DEFAULT '',
  comments TEXT NOT NULL DEFAULT ''
);
CREATE TABLE IF NOT EXISTS expenses (
  id BIGSERIAL PRIMARY KEY,
  label TEXT NOT NULL,
  quantity NUMERIC(12,2) NOT NULL DEFAULT 1,
  unit_price NUMERIC(14,2),
  currency TEXT NOT NULL DEFAULT 'USD',
  supplier TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'À demander'
);
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS gallery (
  id BIGSERIAL PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  registration_id TEXT REFERENCES registrations(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  photo_type TEXT,
  photo BYTEA
);
ALTER TABLE gallery ADD COLUMN IF NOT EXISTS storage_key TEXT;
ALTER TABLE dossiers ADD COLUMN IF NOT EXISTS storage_key TEXT;
ALTER TABLE dossiers ALTER COLUMN data DROP NOT NULL;
ALTER TABLE teacher_requests ADD COLUMN IF NOT EXISTS storage_key TEXT;
`;

async function db(): Promise<Pool> {
  const p = pool();
  if (!g.__ready) {
    g.__ready = p.query(SCHEMA).then(() => undefined);
    g.__ready.catch(() => {
      g.__ready = undefined;
    });
  }
  await g.__ready;
  return p;
}

type RegRow = {
  id: string;
  created_at: Date;
  child_name: string;
  age: number;
  level: Level;
  school: string;
  health: string;
  parent_name: string;
  phone: string;
  momo_number: string;
  emergency_contact: string;
  photo_consent: boolean;
  gender: string;
  solidarity: boolean;
};
type PayRow = {
  id: string;
  registration_id: string;
  month: string;
  amount: string;
  currency: "USD" | "CDF";
  paid_at: Date;
  receipt_no: number;
  cancelled_at: Date | null;
  cancel_reason: string | null;
};

function toRegistration(x: RegRow): Registration {
  return {
    id: x.id,
    createdAt: x.created_at.toISOString(),
    childName: x.child_name,
    age: x.age,
    level: x.level,
    school: x.school,
    health: x.health,
    parentName: x.parent_name,
    phone: x.phone,
    momoNumber: x.momo_number,
    emergencyContact: x.emergency_contact,
    photoConsent: x.photo_consent,
    gender: x.gender === "Fille" || x.gender === "Garçon" ? x.gender : "",
    solidarity: x.solidarity,
  };
}

function toPayment(x: PayRow): Payment {
  return {
    id: x.id,
    registrationId: x.registration_id,
    month: x.month,
    amount: Number(x.amount),
    currency: x.currency,
    date: x.paid_at.toISOString(),
    receiptNo: x.receipt_no,
    cancelledAt: x.cancelled_at ? x.cancelled_at.toISOString() : null,
    cancelReason: x.cancel_reason,
  };
}

export type ReminderInfo = { count: number; last: string };

/** Relances déjà faites pour un mois : registrationId -> nombre et date de la dernière. */
export async function getReminders(month: string): Promise<Record<string, ReminderInfo>> {
  const p = await db();
  const r = await p.query<{ registration_id: string; n: string; last: Date }>(
    `SELECT registration_id, count(*) n, max(sent_at) last
     FROM reminders WHERE month = $1 GROUP BY registration_id`,
    [month],
  );
  return Object.fromEntries(
    r.rows.map((x) => [x.registration_id, { count: Number(x.n), last: x.last.toISOString() }]),
  );
}

export async function addReminder(registrationId: string, month: string) {
  const p = await db();
  await p.query("INSERT INTO reminders (registration_id, month) VALUES ($1,$2)", [
    registrationId,
    month,
  ]);
}

export async function getReceipt(paymentId: string) {
  const p = await db();
  const pay = await p.query<PayRow>("SELECT * FROM payments WHERE id = $1", [paymentId]);
  if (!pay.rows[0]) return null;
  const reg = await p.query<RegRow>("SELECT * FROM registrations WHERE id = $1", [
    pay.rows[0].registration_id,
  ]);
  if (!reg.rows[0]) return null;
  return { payment: toPayment(pay.rows[0]), registration: toRegistration(reg.rows[0]) };
}

export async function addRegistration(r: Omit<Registration, "id" | "createdAt">) {
  const p = await db();
  await p.query(
    `INSERT INTO registrations
     (id, child_name, age, level, school, health, parent_name, phone, momo_number, emergency_contact, photo_consent, gender, solidarity)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`,
    [randomUUID(), r.childName, r.age, r.level, r.school, r.health, r.parentName, r.phone, r.momoNumber, r.emergencyContact, r.photoConsent, r.gender, r.solidarity],
  );
}

/** Annule un paiement (le reçu et son numéro sont conservés). Renvoie false s'il n'existe pas ou est déjà annulé. */
export async function cancelPayment(id: string, reason: string) {
  const p = await db();
  const r = await p.query(
    "UPDATE payments SET cancelled_at = now(), cancel_reason = $2 WHERE id = $1 AND cancelled_at IS NULL",
    [id, reason],
  );
  return (r.rowCount ?? 0) > 0;
}

export async function addPayment(x: Omit<Payment, "id" | "date" | "receiptNo" | "cancelledAt" | "cancelReason">) {
  const p = await db();
  const id = randomUUID();
  await p.query(
    "INSERT INTO payments (id, registration_id, month, amount, currency) VALUES ($1,$2,$3,$4,$5)",
    [id, x.registrationId, x.month, x.amount, x.currency],
  );
  return id;
}

/** Limitation des tentatives de connexion (stockée en base : survit aux redémarrages). */
export const LOGIN_MAX_PER_IP = 5;
export const LOGIN_MAX_GLOBAL = 50;
export const LOGIN_WINDOW_MIN = 15;

/** Renvoie le nombre de minutes à attendre, ou 0 si la connexion est autorisée. */
export async function loginLockMinutes(ip: string): Promise<number> {
  const p = await db();
  await p.query(`DELETE FROM login_failures WHERE at < now() - interval '1 day'`);
  const r = await p.query<{ n: string; oldest: Date | null }>(
    `SELECT count(*) n, min(at) oldest FROM login_failures
     WHERE ip = $1 AND at > now() - make_interval(mins => $2)`,
    [ip, LOGIN_WINDOW_MIN],
  );
  const g = await p.query<{ n: string; oldest: Date | null }>(
    `SELECT count(*) n, min(at) oldest FROM login_failures
     WHERE at > now() - make_interval(mins => $1)`,
    [LOGIN_WINDOW_MIN],
  );
  const locks: Date[] = [];
  if (Number(r.rows[0].n) >= LOGIN_MAX_PER_IP && r.rows[0].oldest) locks.push(r.rows[0].oldest);
  if (Number(g.rows[0].n) >= LOGIN_MAX_GLOBAL && g.rows[0].oldest) locks.push(g.rows[0].oldest);
  if (locks.length === 0) return 0;
  const unlockAt = Math.max(...locks.map((d) => d.getTime())) + LOGIN_WINDOW_MIN * 60_000;
  return Math.max(1, Math.ceil((unlockAt - Date.now()) / 60_000));
}

export async function recordLoginFailure(ip: string) {
  const p = await db();
  await p.query("INSERT INTO login_failures (ip) VALUES ($1)", [ip]);
}

export async function clearLoginFailures(ip: string) {
  const p = await db();
  await p.query("DELETE FROM login_failures WHERE ip = $1", [ip]);
}

export type AttendanceRow = { present: boolean; challenge: boolean; helped: boolean };

/** Présences d'une séance (date YYYY-MM-DD) : registrationId -> présence et points du bilan. */
export async function getAttendance(date: string): Promise<Record<string, AttendanceRow>> {
  const p = await db();
  const r = await p.query<{ registration_id: string; present: boolean; challenge_done: boolean; helped_peer: boolean }>(
    "SELECT registration_id, present, challenge_done, helped_peer FROM attendance WHERE session_date = $1",
    [date],
  );
  return Object.fromEntries(
    r.rows.map((x) => [x.registration_id, { present: x.present, challenge: x.challenge_done, helped: x.helped_peer }]),
  );
}

/**
 * Enregistre la séance pour tous les inscrits. Les points du bilan (défi, entraide)
 * ne comptent que pour les enfants présents.
 */
export async function saveAttendance(date: string, presentIds: string[], challengeIds: string[], helpedIds: string[]) {
  const p = await db();
  await p.query(
    `INSERT INTO attendance (registration_id, session_date, present, challenge_done, helped_peer)
     SELECT r.id, $1::date,
            r.id = ANY($2::text[]),
            r.id = ANY($2::text[]) AND r.id = ANY($3::text[]),
            r.id = ANY($2::text[]) AND r.id = ANY($4::text[])
     FROM registrations r
     ON CONFLICT (registration_id, session_date) DO UPDATE SET
       present = EXCLUDED.present,
       challenge_done = EXCLUDED.challenge_done,
       helped_peer = EXCLUDED.helped_peer`,
    [date, presentIds, challengeIds, helpedIds],
  );
}

export type HistoryRow = { date: string; present: boolean; challenge: boolean; helped: boolean };

/** Historique des séances d'un enfant, du plus ancien au plus récent. */
export async function getChildHistory(registrationId: string): Promise<HistoryRow[]> {
  const p = await db();
  const r = await p.query<{ d: string; present: boolean; challenge_done: boolean; helped_peer: boolean }>(
    `SELECT to_char(session_date, 'YYYY-MM-DD') d, present, challenge_done, helped_peer
     FROM attendance WHERE registration_id = $1 ORDER BY session_date`,
    [registrationId],
  );
  return r.rows.map((x) => ({ date: x.d, present: x.present, challenge: x.challenge_done, helped: x.helped_peer }));
}

// ---------- Sondage parents ----------

export type SurveyInput = {
  childrenAges: string;
  neighborhood: string;
  interest: string;
  acceptablePrice: string;
  maxPrice: string;
  paymentMode: string;
  bestSlot: string;
  pilotInterest: string;
  contact: string;
  comments: string;
};

export async function addSurvey(s: SurveyInput) {
  const p = await db();
  await p.query(
    `INSERT INTO survey_responses (children_ages, neighborhood, interest, acceptable_price, max_price,
       payment_mode, best_slot, pilot_interest, contact, comments)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
    [s.childrenAges, s.neighborhood, s.interest, s.acceptablePrice, s.maxPrice, s.paymentMode,
      s.bestSlot, s.pilotInterest, s.contact, s.comments],
  );
}

export type SurveyRow = SurveyInput & { id: string; createdAt: string };

export async function getSurveys(): Promise<SurveyRow[]> {
  const p = await db();
  const r = await p.query<{
    id: string; created_at: Date; children_ages: string; neighborhood: string; interest: string;
    acceptable_price: string; max_price: string; payment_mode: string; best_slot: string;
    pilot_interest: string; contact: string; comments: string;
  }>("SELECT * FROM survey_responses ORDER BY created_at DESC");
  return r.rows.map((x) => ({
    id: x.id,
    createdAt: x.created_at.toISOString(),
    childrenAges: x.children_ages,
    neighborhood: x.neighborhood,
    interest: x.interest,
    acceptablePrice: x.acceptable_price,
    maxPrice: x.max_price,
    paymentMode: x.payment_mode,
    bestSlot: x.best_slot,
    pilotInterest: x.pilot_interest,
    contact: x.contact,
    comments: x.comments,
  }));
}

// ---------- Budget ----------

export type Expense = {
  id: string;
  label: string;
  quantity: number;
  unitPrice: number | null;
  currency: string;
  supplier: string;
  status: string;
};

type ExpenseRow = {
  id: string; label: string; quantity: string; unit_price: string | null;
  currency: string; supplier: string; status: string;
};

function toExpense(x: ExpenseRow): Expense {
  return {
    id: x.id,
    label: x.label,
    quantity: Number(x.quantity),
    unitPrice: x.unit_price === null ? null : Number(x.unit_price),
    currency: x.currency,
    supplier: x.supplier,
    status: x.status,
  };
}

export async function getExpenses(): Promise<Expense[]> {
  const p = await db();
  const r = await p.query<ExpenseRow>("SELECT id::text, label, quantity, unit_price, currency, supplier, status FROM expenses ORDER BY id");
  return r.rows.map(toExpense);
}

export async function countExpenses() {
  const p = await db();
  const r = await p.query<{ n: string }>("SELECT count(*) n FROM expenses");
  return Number(r.rows[0].n);
}

export async function addExpense(x: Omit<Expense, "id">) {
  const p = await db();
  await p.query(
    "INSERT INTO expenses (label, quantity, unit_price, currency, supplier, status) VALUES ($1,$2,$3,$4,$5,$6)",
    [x.label, x.quantity, x.unitPrice, x.currency, x.supplier, x.status],
  );
}

export async function updateExpense(id: string, x: Omit<Expense, "id" | "label">) {
  const p = await db();
  await p.query(
    "UPDATE expenses SET quantity = $2, unit_price = $3, currency = $4, supplier = $5, status = $6 WHERE id = $1",
    [id, x.quantity, x.unitPrice, x.currency, x.supplier, x.status],
  );
}

export async function removeExpense(id: string) {
  const p = await db();
  await p.query("DELETE FROM expenses WHERE id = $1", [id]);
}

// ---------- Places par niveau ----------

export const DEFAULT_CAPACITY = 10;

export async function getCapacities(): Promise<Record<Level, number>> {
  const p = await db();
  const r = await p.query<{ key: string; value: string }>("SELECT key, value FROM settings WHERE key LIKE 'capacity:%'");
  const out: Record<Level, number> = { "Éveil": DEFAULT_CAPACITY, "Explorateur": DEFAULT_CAPACITY, "Créateur": DEFAULT_CAPACITY };
  for (const row of r.rows) {
    const level = row.key.slice("capacity:".length) as Level;
    if (level in out) out[level] = Number(row.value);
  }
  return out;
}

export async function setCapacity(level: Level, n: number) {
  const p = await db();
  await p.query(
    `INSERT INTO settings (key, value) VALUES ($1, $2)
     ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`,
    [`capacity:${level}`, String(n)],
  );
}

export async function countByLevel(): Promise<Record<Level, number>> {
  const p = await db();
  const r = await p.query<{ level: Level; n: string }>("SELECT level, count(*) n FROM registrations GROUP BY level");
  const out: Record<Level, number> = { "Éveil": 0, "Explorateur": 0, "Créateur": 0 };
  for (const row of r.rows) out[row.level] = Number(row.n);
  return out;
}

// ---------- Galerie ----------

export type GalleryRow = {
  id: string;
  title: string;
  description: string;
  hasPhoto: boolean;
  childFirstName: string | null;
  level: Level | null;
  registrationId: string | null;
  photoConsent: boolean;
};

/** Projets de la galerie. En public, seuls les projets dont l'enfant a donné son accord photo sont renvoyés. */
export async function getGallery(publicOnly: boolean): Promise<GalleryRow[]> {
  const p = await db();
  const r = await p.query<{
    id: string; title: string; description: string; has_photo: boolean; child_name: string | null;
    level: Level | null; registration_id: string | null; photo_consent: boolean | null;
  }>(
    `SELECT g.id::text, g.title, g.description, (g.photo IS NOT NULL OR g.storage_key IS NOT NULL) AS has_photo,
            r.child_name, r.level, g.registration_id, r.photo_consent
     FROM gallery g LEFT JOIN registrations r ON r.id = g.registration_id
     WHERE ($1::boolean = false OR r.photo_consent = true)
     ORDER BY g.created_at DESC`,
    [publicOnly],
  );
  return r.rows.map((x) => ({
    id: x.id,
    title: x.title,
    description: x.description,
    hasPhoto: x.has_photo,
    childFirstName: x.child_name ? x.child_name.trim().split(/\s+/)[0] : null,
    level: x.level,
    registrationId: x.registration_id,
    photoConsent: x.photo_consent === true,
  }));
}

export async function addGalleryItem(x: {
  registrationId: string | null;
  title: string;
  description: string;
  photoType: string | null;
  storageKey: string | null;
}) {
  const p = await db();
  await p.query(
    `INSERT INTO gallery (registration_id, title, description, photo_type, storage_key) VALUES ($1,$2,$3,$4,$5)`,
    [x.registrationId, x.title, x.description, x.photoType, x.storageKey],
  );
}

export async function getGalleryPhoto(id: string) {
  const p = await db();
  const r = await p.query<{ photo_type: string; photo: Buffer | null; storage_key: string | null; photo_consent: boolean | null }>(
    `SELECT g.photo_type, g.photo, g.storage_key, r.photo_consent FROM gallery g
     LEFT JOIN registrations r ON r.id = g.registration_id
     WHERE g.id = $1 AND (g.photo IS NOT NULL OR g.storage_key IS NOT NULL)`,
    [id],
  );
  return r.rows[0] ?? null;
}

export async function removeGalleryItem(id: string) {
  const p = await db();
  await p.query("DELETE FROM gallery WHERE id = $1", [id]);
}

// ---------- Dépôt de dossiers ----------

export const DOSSIER_STATUSES = ["À traiter", "En cours", "Traité", "Classé"] as const;

export type Dossier = {
  id: string;
  createdAt: string;
  name: string;
  phone: string;
  category: string;
  description: string;
  status: string;
  note: string;
  fileName: string;
  fileType: string;
  fileSize: number;
};

export async function addDossier(x: {
  name: string; phone: string; category: string; description: string;
  fileName: string; fileType: string; fileSize: number; storageKey: string;
}): Promise<string> {
  const p = await db();
  const r = await p.query<{ id: string }>(
    `INSERT INTO dossiers (name, phone, category, description, file_name, file_type, file_size, storage_key)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id::text`,
    [x.name, x.phone, x.category, x.description, x.fileName, x.fileType, x.fileSize, x.storageKey],
  );
  return r.rows[0].id;
}

/** Statut d'un dossier pour le demandeur : seulement si le numéro ET le téléphone correspondent. */
export async function getDossierStatusFor(id: string, phone: string) {
  const p = await db();
  const r = await p.query<{ status: string; created_at: Date; category: string }>(
    "SELECT status, created_at, category FROM dossiers WHERE id = $1 AND phone = $2",
    [id, phone],
  );
  const row = r.rows[0];
  return row ? { status: row.status, createdAt: row.created_at.toISOString(), category: row.category } : null;
}

export async function getDossiers(): Promise<Dossier[]> {
  const p = await db();
  const r = await p.query<{
    id: string; created_at: Date; name: string; phone: string; category: string; description: string;
    status: string; note: string; file_name: string; file_type: string; file_size: number;
  }>(
    `SELECT id::text, created_at, name, phone, category, description, status, note, file_name, file_type, file_size
     FROM dossiers ORDER BY created_at DESC`,
  );
  return r.rows.map((x) => ({
    id: x.id,
    createdAt: x.created_at.toISOString(),
    name: x.name,
    phone: x.phone,
    category: x.category,
    description: x.description,
    status: x.status,
    note: x.note,
    fileName: x.file_name,
    fileType: x.file_type,
    fileSize: x.file_size,
  }));
}

export async function getDossierFile(id: string) {
  const p = await db();
  const r = await p.query<{ file_name: string; file_type: string; data: Buffer | null; storage_key: string | null }>(
    "SELECT file_name, file_type, data, storage_key FROM dossiers WHERE id = $1",
    [id],
  );
  return r.rows[0] ?? null;
}

export async function updateDossier(id: string, status: string, note: string) {
  const p = await db();
  await p.query("UPDATE dossiers SET status = $2, note = $3 WHERE id = $1", [id, status, note]);
}

// ---------- Demandes des enseignants ----------

export const TEACHER_STATUSES = ["Nouvelle", "Contactée", "Devis envoyé", "Acceptée", "Refusée"] as const;

export type TeacherRequest = {
  id: string;
  createdAt: string;
  name: string;
  school: string;
  role: string;
  phone: string;
  levels: string;
  pupils: string;
  format: string;
  slot: string;
  message: string;
  status: string;
  note: string;
  fileName: string | null;
  fileSize: number | null;
};

export async function addTeacherRequest(
  x: Omit<TeacherRequest, "id" | "createdAt" | "status" | "note" | "fileName" | "fileSize"> & {
    file?: { name: string; type: string; size: number; storageKey: string } | null;
  },
) {
  const p = await db();
  await p.query(
    `INSERT INTO teacher_requests (name, school, role, phone, levels, pupils, format, slot, message,
       file_name, file_type, file_size, storage_key)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`,
    [
      x.name, x.school, x.role, x.phone, x.levels, x.pupils, x.format, x.slot, x.message,
      x.file?.name ?? null, x.file?.type ?? null, x.file?.size ?? null, x.file?.storageKey ?? null,
    ],
  );
}

export async function getTeacherRequestFile(id: string) {
  const p = await db();
  const r = await p.query<{ file_name: string; file_type: string; data: Buffer | null; storage_key: string | null }>(
    `SELECT file_name, file_type, data, storage_key FROM teacher_requests
     WHERE id = $1 AND (data IS NOT NULL OR storage_key IS NOT NULL)`,
    [id],
  );
  return r.rows[0] ?? null;
}

export async function getTeacherRequests(): Promise<TeacherRequest[]> {
  const p = await db();
  const r = await p.query<{
    id: string; created_at: Date; name: string; school: string; role: string; phone: string;
    levels: string; pupils: string; format: string; slot: string; message: string; status: string; note: string;
  }>("SELECT id::text, created_at, name, school, role, phone, levels, pupils, format, slot, message, status, note FROM teacher_requests ORDER BY created_at DESC");
  const files = await p.query<{ id: string; file_name: string | null; file_size: number | null }>(
    "SELECT id::text, file_name, file_size FROM teacher_requests WHERE data IS NOT NULL OR storage_key IS NOT NULL",
  );
  const fileById = new Map(files.rows.map((f) => [f.id, f]));
  return r.rows.map((x) => ({
    id: x.id,
    createdAt: x.created_at.toISOString(),
    name: x.name,
    school: x.school,
    role: x.role,
    phone: x.phone,
    levels: x.levels,
    pupils: x.pupils,
    format: x.format,
    slot: x.slot,
    message: x.message,
    status: x.status,
    note: x.note,
    fileName: fileById.get(x.id)?.file_name ?? null,
    fileSize: fileById.get(x.id)?.file_size ?? null,
  }));
}

export async function getTeacherRequest(id: string): Promise<TeacherRequest | null> {
  const all = await getTeacherRequests();
  return all.find((x) => x.id === id) ?? null;
}

export async function updateTeacherRequest(id: string, status: string, note: string) {
  const p = await db();
  await p.query("UPDATE teacher_requests SET status = $2, note = $3 WHERE id = $1", [id, status, note]);
}

// ---------- Réglages génériques (modèle économique) ----------

export async function getSetting(key: string): Promise<string | null> {
  const p = await db();
  const r = await p.query<{ value: string }>("SELECT value FROM settings WHERE key = $1", [key]);
  return r.rows[0]?.value ?? null;
}

export async function setSetting(key: string, value: string) {
  const p = await db();
  await p.query(
    `INSERT INTO settings (key, value) VALUES ($1, $2)
     ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`,
    [key, value],
  );
}

/** Total du matériel prévu (prix unitaire × quantité), en ignorant les lignes sans prix. */
export async function getMaterielTotal(): Promise<number> {
  const p = await db();
  const r = await p.query<{ total: string | null }>(
    "SELECT sum(quantity * unit_price) total FROM expenses WHERE unit_price IS NOT NULL",
  );
  return Number(r.rows[0]?.total ?? 0);
}

// ---------- Parité et places solidaires ----------

export const DEFAULT_PARITY_TARGET = 50;

/** Objectif de filles, en pourcentage des inscrits. */
export async function getParityTarget(): Promise<number> {
  const p = await db();
  const r = await p.query<{ value: string }>("SELECT value FROM settings WHERE key = 'parity_target'");
  return r.rows[0] ? Number(r.rows[0].value) : DEFAULT_PARITY_TARGET;
}

/** Corrige le genre et le statut « place solidaire » d'une inscription existante. */
export async function setChildFlags(id: string, gender: "Fille" | "Garçon" | "", solidarity: boolean) {
  const p = await db();
  await p.query("UPDATE registrations SET gender = $2, solidarity = $3 WHERE id = $1", [id, gender, solidarity]);
}

export async function setParityTarget(pct: number) {
  const p = await db();
  await p.query(
    `INSERT INTO settings (key, value) VALUES ('parity_target', $1)
     ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`,
    [String(pct)],
  );
}

// ---------- Tests d'entrée et de sortie ----------

export const SKILLS = [
  "Donner une suite d'ordres claire",
  "Repérer et corriger une erreur",
  "Utiliser une répétition (boucle)",
  "Expliquer le rôle d'un capteur",
] as const;

export type Phase = "entree" | "sortie";
export type SkillResult = [boolean, boolean, boolean, boolean];

/** Résultats des tests : registrationId -> phase -> 4 compétences réussies ou non. */
export async function getSkillTests(): Promise<Record<string, Partial<Record<Phase, SkillResult>>>> {
  const p = await db();
  const r = await p.query<{ registration_id: string; phase: Phase; s1: boolean; s2: boolean; s3: boolean; s4: boolean }>(
    "SELECT registration_id, phase, s1, s2, s3, s4 FROM skill_tests",
  );
  const out: Record<string, Partial<Record<Phase, SkillResult>>> = {};
  for (const x of r.rows) {
    (out[x.registration_id] ??= {})[x.phase] = [x.s1, x.s2, x.s3, x.s4];
  }
  return out;
}

export async function saveSkillTest(registrationId: string, phase: Phase, s: SkillResult) {
  const p = await db();
  await p.query(
    `INSERT INTO skill_tests (registration_id, phase, s1, s2, s3, s4) VALUES ($1,$2,$3,$4,$5,$6)
     ON CONFLICT (registration_id, phase) DO UPDATE SET
       s1 = EXCLUDED.s1, s2 = EXCLUDED.s2, s3 = EXCLUDED.s3, s4 = EXCLUDED.s4, recorded_at = now()`,
    [registrationId, phase, ...s],
  );
}

export async function removeRegistration(id: string) {
  const p = await db();
  await p.query("DELETE FROM registrations WHERE id = $1", [id]);
}

// ---------- Lectures ciblées (remplacent l'ancien getData() chargé en entier) ----------

export async function getRegistrations(): Promise<Registration[]> {
  const p = await db();
  const r = await p.query<RegRow>("SELECT * FROM registrations ORDER BY created_at");
  return r.rows.map(toRegistration);
}

export async function getRegistration(id: string): Promise<Registration | null> {
  const p = await db();
  const r = await p.query<RegRow>("SELECT * FROM registrations WHERE id = $1", [id]);
  return r.rows[0] ? toRegistration(r.rows[0]) : null;
}

/** Tous les paiements (y compris annulés), pour l'export. */
export async function getAllPayments(): Promise<Payment[]> {
  const p = await db();
  const r = await p.query<PayRow>("SELECT * FROM payments ORDER BY paid_at");
  return r.rows.map(toPayment);
}

/** Paiements d'un ensemble d'inscrits, groupés par inscrit. */
export async function getPaymentsForRegistrations(ids: string[]): Promise<Record<string, Payment[]>> {
  const out: Record<string, Payment[]> = {};
  if (ids.length === 0) return out;
  const p = await db();
  const r = await p.query<PayRow>(
    "SELECT * FROM payments WHERE registration_id = ANY($1::text[]) ORDER BY paid_at",
    [ids],
  );
  for (const x of r.rows) (out[x.registration_id] ??= []).push(toPayment(x));
  return out;
}

/** Encaissé par devise (paiements non annulés). */
export async function getCollectedTotals(): Promise<Record<string, number>> {
  const p = await db();
  const r = await p.query<{ currency: string; total: string }>(
    "SELECT currency, sum(amount) total FROM payments WHERE cancelled_at IS NULL GROUP BY currency",
  );
  return Object.fromEntries(r.rows.map((x) => [x.currency, Number(x.total)]));
}

/** Effectifs du modèle économique : nombre d'inscrits et de places solidaires. */
export async function getChildCounts(): Promise<{ children: number; solidaires: number }> {
  const p = await db();
  const r = await p.query<{ n: string; s: string }>(
    "SELECT count(*) n, count(*) FILTER (WHERE solidarity) s FROM registrations",
  );
  return { children: Number(r.rows[0].n), solidaires: Number(r.rows[0].s) };
}

/** Indicateurs du tableau de bord, calculés en base. */
export async function getDashboardStats(month: string) {
  const p = await db();
  const r = await p.query<{
    total: string; girls: string; boys: string; solidarity: string;
    eveil: string; explorateur: string; createur: string; paid: string;
  }>(
    `SELECT count(*) total,
            count(*) FILTER (WHERE gender = 'Fille') girls,
            count(*) FILTER (WHERE gender = 'Garçon') boys,
            count(*) FILTER (WHERE solidarity) solidarity,
            count(*) FILTER (WHERE level = 'Éveil') eveil,
            count(*) FILTER (WHERE level = 'Explorateur') explorateur,
            count(*) FILTER (WHERE level = 'Créateur') createur,
            count(*) FILTER (WHERE ${paidSql("$1")}) paid
     FROM registrations r`,
    [month],
  );
  const x = r.rows[0];
  return {
    total: Number(x.total),
    girls: Number(x.girls),
    boys: Number(x.boys),
    solidarity: Number(x.solidarity),
    levels: { "Éveil": Number(x.eveil), "Explorateur": Number(x.explorateur), "Créateur": Number(x.createur) } as Record<Level, number>,
    paidCount: Number(x.paid),
  };
}

/** Sous-requête « inscrit a payé ce mois-ci » (paiements non annulés), avec le mois passé en paramètre SQL. */
const paidSql = (monthParam: string) =>
  `EXISTS (SELECT 1 FROM payments p WHERE p.registration_id = r.id AND p.month = ${monthParam} AND p.cancelled_at IS NULL)`;

export type RegistrationFilter = "all" | "pending" | "paid";

/** Une page d'inscrits, filtrée par statut de paiement du mois et par recherche texte. */
export async function listRegistrationsPage(opts: {
  month: string;
  filter: RegistrationFilter;
  query: string;
  page: number;
  pageSize: number;
}): Promise<{ rows: Registration[]; total: number }> {
  const p = await db();
  // Chaque paramètre est numéroté au moment où il est utilisé : PostgreSQL refuse un $n inutilisé.
  const params: unknown[] = [];
  const ph = (v: unknown) => {
    params.push(v);
    return `$${params.length}`;
  };
  const conds: string[] = [];
  if (opts.filter === "pending") conds.push(`NOT ${paidSql(ph(opts.month))}`);
  if (opts.filter === "paid") conds.push(paidSql(ph(opts.month)));
  if (opts.query) {
    conds.push(`lower(r.child_name || ' ' || r.parent_name || ' ' || r.phone) LIKE lower(${ph(`%${opts.query.replace(/[\\%_]/g, "\\$&")}%`)})`);
  }
  const where = conds.length ? `WHERE ${conds.join(" AND ")}` : "";
  const count = await p.query<{ n: string }>(`SELECT count(*) n FROM registrations r ${where}`, params);
  const limit = ph(opts.pageSize);
  const offset = ph((opts.page - 1) * opts.pageSize);
  const rows = await p.query<RegRow>(
    `SELECT r.* FROM registrations r ${where} ORDER BY r.created_at LIMIT ${limit} OFFSET ${offset}`,
    params,
  );
  return { rows: rows.rows.map(toRegistration), total: Number(count.rows[0].n) };
}

/** Historique de présence de tous les enfants, groupé par inscrit (une seule requête). */
export async function getAllChildHistory(): Promise<Record<string, HistoryRow[]>> {
  const p = await db();
  const r = await p.query<{ registration_id: string; d: string; present: boolean; challenge_done: boolean; helped_peer: boolean }>(
    `SELECT registration_id, to_char(session_date, 'YYYY-MM-DD') d, present, challenge_done, helped_peer
     FROM attendance ORDER BY session_date`,
  );
  const out: Record<string, HistoryRow[]> = {};
  for (const x of r.rows) {
    (out[x.registration_id] ??= []).push({ date: x.d, present: x.present, challenge: x.challenge_done, helped: x.helped_peer });
  }
  return out;
}
