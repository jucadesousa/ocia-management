import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { monthLabel, shiftMonthKey } from "@/lib/calendar";

export function MonthNav({ month }: { month: string }) {
  return (
    <div className="hidden md:flex items-center justify-between">
      <Link
        href={`/calendar?month=${shiftMonthKey(month, -1)}`}
        className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
        aria-label="Previous month"
      >
        <ChevronLeft size={18} />
      </Link>
      <h2 className="text-lg font-semibold text-gray-900">{monthLabel(month)}</h2>
      <Link
        href={`/calendar?month=${shiftMonthKey(month, 1)}`}
        className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
        aria-label="Next month"
      >
        <ChevronRight size={18} />
      </Link>
    </div>
  );
}
