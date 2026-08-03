import { prisma } from "@/lib/prisma";
import type { EventCategory, SessionType } from "@prisma/client";

export type CalendarCategory = SessionType | EventCategory;

export type CalendarEntry = {
  id: string; // `session:${id}` or `event:${id}` — stable React key
  source: "session" | "event";
  sourceId: string;
  date: Date; // UTC-midnight
  title: string;
  subtitle: string | null; // presenter (session) or location (event)
  time: string | null; // always null for session-derived entries
  category: CalendarCategory;
  cancelled: boolean; // true only when Session.status === "CANCELLED"
  highlight: boolean;
  sortOrder: number;
};

function sessionLabel(type: SessionType, number: number): string {
  return type === "WEEKLY" ? `Session ${number}` : `Reflection ${number}`;
}

export async function getCalendarEntries(cycleId: string): Promise<CalendarEntry[]> {
  const [sessions, events] = await Promise.all([
    prisma.session.findMany({
      where: { cycleId, date: { not: null } },
      orderBy: [{ date: "asc" }],
    }),
    prisma.calendarEvent.findMany({
      where: { cycleId },
      orderBy: [{ date: "asc" }, { sortOrder: "asc" }, { createdAt: "asc" }],
    }),
  ]);

  const fromSessions: CalendarEntry[] = sessions.map((s) => ({
    id: `session:${s.id}`,
    source: "session",
    sourceId: s.id,
    date: s.date!,
    title: s.title ? `${sessionLabel(s.type, s.number)} — ${s.title}` : sessionLabel(s.type, s.number),
    subtitle: s.presenter,
    time: null,
    category: s.type,
    cancelled: s.status === "CANCELLED",
    highlight: false,
    sortOrder: 0,
  }));

  const fromEvents: CalendarEntry[] = events.map((e) => ({
    id: `event:${e.id}`,
    source: "event",
    sourceId: e.id,
    date: e.date,
    title: e.title,
    subtitle: e.location,
    time: e.time,
    category: e.category,
    cancelled: false,
    highlight: e.highlight,
    sortOrder: e.sortOrder,
  }));

  return [...fromSessions, ...fromEvents].sort(
    (a, b) => a.date.getTime() - b.date.getTime() || a.sortOrder - b.sortOrder
  );
}

export function monthKeyOf(date: Date): string {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

export function currentMonthKey(): string {
  return monthKeyOf(new Date());
}

export function shiftMonthKey(monthKey: string, delta: number): string {
  const [year, month] = monthKey.split("-").map(Number);
  const d = new Date(Date.UTC(year, month - 1 + delta, 1));
  return monthKeyOf(d);
}

export function monthLabel(monthKey: string): string {
  const [year, month] = monthKey.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, 1)).toLocaleDateString("en-US", {
    timeZone: "UTC",
    month: "long",
    year: "numeric",
  });
}

// Sun–Sat week rows covering the given month, with leading/trailing
// out-of-month cells as null.
export function buildMonthMatrix(monthKey: string): (Date | null)[][] {
  const [year, month] = monthKey.split("-").map(Number);
  const firstOfMonth = new Date(Date.UTC(year, month - 1, 1));
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const leadingBlanks = firstOfMonth.getUTCDay();

  const cells: (Date | null)[] = [
    ...Array(leadingBlanks).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => new Date(Date.UTC(year, month - 1, i + 1))),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const weeks: (Date | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return weeks;
}

export function groupByMonth(
  entries: CalendarEntry[]
): { monthKey: string; label: string; entries: CalendarEntry[] }[] {
  const groups = new Map<string, CalendarEntry[]>();
  for (const entry of entries) {
    const key = monthKeyOf(entry.date);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(entry);
  }
  return [...groups.entries()]
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .map(([monthKey, groupEntries]) => ({ monthKey, label: monthLabel(monthKey), entries: groupEntries }));
}
