import type { CalendarEntry } from "@/lib/calendar";
import { groupByMonth } from "@/lib/calendar";
import { CategoryBadge } from "./category-badge";

function formatDay(date: Date): string {
  return date.toLocaleDateString("en-US", {
    timeZone: "UTC",
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export function AgendaList({ entries }: { entries: CalendarEntry[] }) {
  const groups = groupByMonth(entries);

  if (groups.length === 0) {
    return (
      <div className="md:hidden bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-400 text-sm">
        No calendar events found.
      </div>
    );
  }

  return (
    <div className="md:hidden space-y-4">
      {groups.map((group) => (
        <div key={group.monthKey}>
          <h2 className="sticky top-14 z-10 bg-gray-50 px-1 py-2 text-sm font-semibold text-gray-700 border-b border-gray-200">
            {group.label}
          </h2>
          <ul className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100 mt-2 overflow-hidden">
            {group.entries.map((entry) => (
              <li
                key={entry.id}
                className={`px-4 py-3 space-y-1${entry.cancelled ? " opacity-60" : ""}${
                  entry.highlight ? " bg-amber-50/50" : ""
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-medium text-gray-500 shrink-0">{formatDay(entry.date)}</span>
                  <CategoryBadge category={entry.category} />
                </div>
                <p className={`text-sm font-medium text-gray-900${entry.cancelled ? " line-through" : ""}`}>
                  {entry.title}
                </p>
                {(entry.subtitle || entry.time) && (
                  <div className="flex items-center justify-between gap-2 text-xs text-gray-500">
                    <span>{entry.subtitle ?? ""}</span>
                    <span className="shrink-0">{entry.time ?? ""}</span>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
