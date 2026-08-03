import type { CalendarEntry } from "@/lib/calendar";
import { categoryInfo } from "./category-badge";

export function CategoryLegend({ entries }: { entries: CalendarEntry[] }) {
  const present = new Set(entries.map((e) => e.category));
  if (present.size === 0) return null;

  return (
    <div className="hidden md:flex flex-wrap items-center gap-x-4 gap-y-1.5 px-1">
      {[...present].map((category) => {
        const { label, className } = categoryInfo(category);
        return (
          <span key={category} className="flex items-center gap-1.5 text-xs text-gray-500">
            <span className={`h-2.5 w-2.5 rounded-sm ${className.split(" ")[0]}`} />
            {label}
          </span>
        );
      })}
    </div>
  );
}
