// Horaires du pilote, définis par l'équipe dans l'espace admin (réglage « session_schedule »).
// Les valeurs par défaut reprennent la structure annoncée de la séance de 2 heures.

export type Block = { label: string; minutes: number };

export type Schedule = {
  start: string | null; // heure de début « HH:MM », ou null si non fixée
  blocks: Block[];
  slots: string[]; // créneaux proposés aux parents et aux écoles
};

export const MAX_BLOCKS = 8;

export const DEFAULT_SCHEDULE: Schedule = {
  start: null,
  blocks: [
    { label: "Accueil et rappel", minutes: 10 },
    { label: "Découverte", minutes: 20 },
    { label: "Pratique en équipe", minutes: 60 },
    { label: "Pause", minutes: 10 },
    { label: "Défi et partage", minutes: 15 },
    { label: "Rangement et inventaire du matériel", minutes: 5 },
  ],
  slots: ["Samedi matin", "Samedi après-midi", "Dimanche", "Mercredi après-midi", "Vacances"],
};

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

/** Lit le réglage enregistré et le complète avec les valeurs par défaut. */
export function parseSchedule(raw: string | null): Schedule {
  if (!raw) return DEFAULT_SCHEDULE;
  try {
    const j = JSON.parse(raw) as Partial<Schedule>;
    const blocks = Array.isArray(j.blocks)
      ? j.blocks
          .filter((b) => b && typeof b.label === "string" && b.label.trim() && Number.isFinite(Number(b.minutes)) && Number(b.minutes) > 0)
          .slice(0, MAX_BLOCKS)
          .map((b) => ({ label: String(b.label), minutes: Math.round(Number(b.minutes)) }))
      : DEFAULT_SCHEDULE.blocks;
    const slots = Array.isArray(j.slots)
      ? j.slots.filter((s): s is string => typeof s === "string" && s.trim().length > 0)
      : DEFAULT_SCHEDULE.slots;
    return {
      start: typeof j.start === "string" && TIME_RE.test(j.start) ? j.start : null,
      blocks: blocks.length ? blocks : DEFAULT_SCHEDULE.blocks,
      slots: slots.length ? slots : DEFAULT_SCHEDULE.slots,
    };
  } catch {
    return DEFAULT_SCHEDULE;
  }
}

export function totalMinutes(s: Schedule): number {
  return s.blocks.reduce((sum, b) => sum + b.minutes, 0);
}

/** Heure « HH:MM » plus un nombre de minutes. */
export function addMinutes(hhmm: string, minutes: number): string {
  const [h, m] = hhmm.split(":").map(Number);
  const t = (h * 60 + m + minutes) % (24 * 60);
  return `${String(Math.floor(t / 60)).padStart(2, "0")}:${String(t % 60).padStart(2, "0")}`;
}

/** Chaque bloc avec ses heures de début et de fin, si une heure de début est fixée. */
export function timetable(s: Schedule): (Block & { from: string | null; to: string | null })[] {
  let cursor = s.start;
  return s.blocks.map((b) => {
    const from = cursor;
    const to = cursor ? addMinutes(cursor, b.minutes) : null;
    cursor = to;
    return { ...b, from, to };
  });
}

/** Découpe le texte saisi (une ligne par créneau) en liste propre. */
export function parseSlots(text: string): string[] {
  return text
    .split(/\r?\n/)
    .map((l) => l.trim().slice(0, 60))
    .filter(Boolean)
    .slice(0, 12);
}
