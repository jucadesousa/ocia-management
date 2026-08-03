import type { CalendarEntry } from "@/lib/calendar";
import { buildMonthMatrix } from "@/lib/calendar";
import { categoryInfo } from "./category-badge";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MAX_CHIPS_PER_DAY = 3;

function dateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function MonthGrid({ entries, month }: { entries: CalendarEntry[]; month: string }) {
  const weeks = buildMonthMatrix(month);

  const entriesByDay = new Map<string, CalendarEntry[]>();
  for (const entry of entries) {
    const key = dateKey(entry.date);
    if (!entriesByDay.has(key)) entriesByDay.set(key, []);
    entriesByDay.get(key)!.push(entry);
  }

  return (
    <div className="hidden md:block bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="grid grid-cols-7 bg-gray-50 border-b border-gray-200">
        {WEEKDAYS.map((d) => (
          <div key={d} className="px-2 py-2 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {weeks.flatMap((week, wi) =>
          week.map((day, di) => {
            const dayEntries = day ? entriesByDay.get(dateKey(day)) ?? [] : [];
            const visible = dayEntries.slice(0, MAX_CHIPS_PER_DAY);
            const overflow = dayEntries.length - visible.length;

            return (
              <div
                key={`${wi}-${di}`}
                className={`min-h-[6.5rem] border-b border-r border-gray-100 p-1.5 ${
                  day ? "" : "bg-gray-50/50"
                }`}
              >
                {day && (
                  <>
                    <p className="text-xs text-gray-400 mb-1">{day.getUTCDate()}</p>
                    <div className="space-y-1">
                      {visible.map((entry) => {
                        const { className } = categoryInfo(entry.category);
                        return (
                          <p
                            key={entry.id}
                            title={entry.title}
                            className={`truncate rounded px-1.5 py-0.5 text-[11px] leading-tight ${className}${
                              entry.cancelled ? " opacity-60 line-through" : ""
                            }${entry.highlight ? " ring-1 ring-offset-1 ring-current" : ""}`}
                          >
                            {entry.title}
                          </p>
                        );
                      })}
                      {overflow > 0 && (
                        <p className="text-[11px] text-gray-400 px-1.5">+{overflow} more</p>
                      )}
                    </div>
                  </>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
