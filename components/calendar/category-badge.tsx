import type { CalendarCategory } from "@/lib/calendar";

const categoryConfig: Record<CalendarCategory, { label: string; className: string }> = {
  WEEKLY:           { label: "Session",         className: "bg-blue-100 text-blue-700" },
  REFLECTION:       { label: "Reflection",       className: "bg-indigo-100 text-indigo-700" },
  RITE:             { label: "Rite",             className: "bg-purple-100 text-purple-700" },
  HOLY_WEEK:        { label: "Holy Week",        className: "bg-rose-100 text-rose-700" },
  HOLY_DAY:         { label: "Holy Day",         className: "bg-amber-100 text-amber-700" },
  FEAST_DAY:        { label: "Feast Day",        className: "bg-yellow-100 text-yellow-700" },
  SPECIAL_SERVICE:  { label: "Special Service",  className: "bg-teal-100 text-teal-700" },
  SUNDAY_MASS:      { label: "Sunday Mass",      className: "bg-sky-100 text-sky-700" },
  TEAM_EVENT:       { label: "Team Event",       className: "bg-orange-100 text-orange-700" },
  OTHER:            { label: "Other",            className: "bg-gray-100 text-gray-600" },
};

export function categoryInfo(category: CalendarCategory) {
  return categoryConfig[category];
}

export function CategoryBadge({ category }: { category: CalendarCategory }) {
  const { label, className } = categoryInfo(category);
  return (
    <span className={`inline-flex shrink-0 px-2 py-0.5 rounded-full text-xs font-medium ${className}`}>
      {label}
    </span>
  );
}
