// Calendrier du pilote : dates des séances (réglage « pilot_dates ») et rappels WhatsApp aux parents.

import { TRACKS } from "@/lib/programme";

export const MAX_SESSIONS = 8;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function validDate(d: string): boolean {
  if (!DATE_RE.test(d)) return false;
  const t = new Date(`${d}T12:00:00Z`);
  return !Number.isNaN(t.getTime()) && t.toISOString().slice(0, 10) === d;
}

/** Nettoie une liste de dates : valides, sans doublon, triées, au plus MAX_SESSIONS. */
export function cleanDates(dates: string[]): string[] {
  return [...new Set(dates.map((d) => d.trim()).filter(validDate))].sort().slice(0, MAX_SESSIONS);
}

/** Lit le réglage enregistré (tableau JSON de dates « AAAA-MM-JJ »). */
export function parsePilotDates(raw: string | null): string[] {
  if (!raw) return [];
  try {
    const j = JSON.parse(raw);
    return Array.isArray(j) ? cleanDates(j.filter((d): d is string => typeof d === "string")) : [];
  } catch {
    return [];
  }
}

/** Une date par semaine à partir de « start », « count » fois. */
export function weeklyDates(start: string, count: number): string[] {
  if (!validDate(start)) return [];
  const n = Math.max(1, Math.min(MAX_SESSIONS, Math.floor(count)));
  const t = new Date(`${start}T12:00:00Z`);
  return Array.from({ length: n }, (_, i) => new Date(t.getTime() + i * 7 * 86_400_000).toISOString().slice(0, 10));
}

/** Date du jour à Lubumbashi, « AAAA-MM-JJ ». */
export function todayLubumbashi(now = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Lubumbashi" }).format(now);
}

/** Prochaine séance (aujourd'hui compris), avec son numéro, ou null si le pilote est terminé ou non planifié. */
export function nextSession(dates: string[], today = todayLubumbashi()): { date: string; n: number } | null {
  const i = dates.findIndex((d) => d >= today);
  return i === -1 ? null : { date: dates[i], n: i + 1 };
}

export function formatLongDate(d: string): string {
  return new Date(`${d}T12:00:00Z`).toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "UTC",
  });
}

/** Thème de la séance n pour un niveau (programme des 6 samedis), s'il existe. */
export function sessionTheme(level: string, n: number): string | null {
  return TRACKS.find((t) => t.name === level)?.sessions.find((s) => s.n === n)?.theme ?? null;
}

/** Message de rappel envoyé au parent la veille d'une séance. */
export function sessionReminderMessage(opts: {
  parentName: string;
  childName: string;
  level: string;
  date: string;
  n: number;
  start: string | null;
}): string {
  const first = opts.childName.trim().split(/\s+/)[0];
  const theme = sessionTheme(opts.level, opts.n);
  return (
    `Bonjour ${opts.parentName}, ici Kids Tech-nuru Lab. ` +
    `Petit rappel : ${first} a atelier ${formatLongDate(opts.date)}` +
    (opts.start ? ` à ${opts.start.replace(":", "h")}` : "") +
    ` (séance ${opts.n}${theme ? ` : « ${theme} »` : ""}). ` +
    `Merci d'arriver 5 minutes en avance. À bientôt !`
  );
}

/** Majuscule sur la première lettre seulement (« Samedi 14 novembre »). */
export function ucfirst(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
