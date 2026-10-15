import type { AppLocale } from "@/lib/i18n";

export const CLUB_TIME_ZONE = "Africa/Tunis";

export function parseClubDateTime(value: string) {
  const normalized = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value) ? `${value}:00` : value;
  const date = new Date(`${normalized}+01:00`);
  if (Number.isNaN(date.getTime())) throw new Error("INVALID_DATE_TIME");
  return date;
}

export function formatDate(date: Date, locale: AppLocale) {
  return new Intl.DateTimeFormat(locale === "ar" ? "ar-TN" : "fr-TN", { dateStyle: "medium", timeZone: CLUB_TIME_ZONE }).format(date);
}

export function formatDateTime(date: Date, locale: AppLocale) {
  return new Intl.DateTimeFormat(locale === "ar" ? "ar-TN" : "fr-TN", { dateStyle: "medium", timeStyle: "short", timeZone: CLUB_TIME_ZONE }).format(date);
}

export function toClubDateTimeInput(date: Date) {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: CLUB_TIME_ZONE, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(date);
  const value = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${value.year}-${value.month}-${value.day}T${value.hour}:${value.minute}`;
}
