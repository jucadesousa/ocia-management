import type { CalendarEntry } from "@/lib/calendar";
import { buildMonthMatrix } from "@/lib/calendar";
import { todayKey } from "@/lib/timezone";
import { categoryInfo } from "./category-badge";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MAX_CHIPS_PER_DAY = 3;

function dateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function MonthGrid({ entries, month }: { entries: CalendarEntry[]; month: string }) {
  const weeks = buildMonthMatrix(month);
  const currentTodayKey = todayKey();

  const entriesByDay = new Map<string, CalendarEntry[]>();
  for (const entry of entries) {
    const key = dateKey(entry.date);
    if (!entriesByDay.has(key)) entriesByDay.set(key, []);
    entriesByDay.get(key)!.push(entry);
  }

  return (
    <div className="hidden md:block bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="grid grid-cols-7 bg-gray-50 border-b border-gray-200">
        {WEEKDAYS.map((d) => (
          <div key={d} className="px-2 py-2.5 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {weeks.flatMap((week, wi) =>
          week.map((day, di) => {
            const key = day ? dateKey(day) : null;
            const dayEntries = key ? entriesByDay.get(key) ?? [] : [];
            const visible = dayEntries.slice(0, MAX_CHIPS_PER_DAY);
            const overflow = dayEntries.length - visible.length;
            const isToday = key === currentTodayKey;

            return (
              <div
                key={`${wi}-${di}`}
                className={`min-h-[9rem] border-b border-r border-gray-100 p-2 transition-colors ${
                  day ? "hover:bg-gray-50/70" : "bg-gray-50/40"
                }`}
              >
                {day && (
                  <>
                    <p
                      className={`mb-1.5 inline-flex h-6 w-6 items-center justify-center text-xs font-medium ${
                        isToday
                          ? "rounded-full bg-blue-600 text-white"
                          : "text-gray-400"
                      }`}
                    >
                      {day.getUTCDate()}
                    </p>
                    <div className="space-y-1">
                      {visible.map((entry) => {
                        const { className } = categoryInfo(entry.category);
                        return (
                          <p
                            key={entry.id}
                            title={entry.title}
                            className={`line-clamp-2 rounded-md px-1.5 py-1 text-xs leading-snug font-medium ${className}${
                              entry.cancelled ? " opacity-60 line-through" : ""
                            }${entry.highlight ? " ring-1 ring-inset ring-current" : ""}`}
                          >
                            {entry.title}
                          </p>
                        );
                      })}
                      {overflow > 0 && (
                        <p className="px-1.5 text-xs font-medium text-gray-400">+{overflow} more</p>
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
