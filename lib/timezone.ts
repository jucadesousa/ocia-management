// The parish is in Houston, TX — this is the reference timezone for "today"
// and "this month", regardless of the server's own timezone (Vercel runs in
// UTC) or the visitor's browser timezone. Using the IANA name (rather than a
// fixed UTC offset) handles the CST/CDT daylight-saving switch automatically.
const REFERENCE_TIMEZONE = "America/Chicago";

function referenceDateParts(now: Date = new Date()): { year: number; month: number; day: number } {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: REFERENCE_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const get = (type: string) => Number(parts.find((p) => p.type === type)!.value);
  return { year: get("year"), month: get("month"), day: get("day") };
}

// "YYYY-MM-DD" for today as observed in Houston/Central time.
export function todayKey(now: Date = new Date()): string {
  const { year, month, day } = referenceDateParts(now);
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

// Today's calendar day as a UTC-midnight Date, using Houston/Central time as
// the reference — matches the app's convention of storing Session/
// CalendarEvent dates as UTC-midnight (see documentation/data-model.md).
export function todayUTCMidnight(now: Date = new Date()): Date {
  const { year, month, day } = referenceDateParts(now);
  return new Date(Date.UTC(year, month - 1, day));
}
