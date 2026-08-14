import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/dal";
import { getCalendarEntries, currentMonthKey, monthKeyOf } from "@/lib/calendar";
import { PublicPageShell } from "@/components/public-page-shell";
import { MonthNav } from "@/components/calendar/month-nav";
import { MonthGrid } from "@/components/calendar/month-grid";
import { AgendaList } from "@/components/calendar/agenda-list";
import { CategoryLegend } from "@/components/calendar/category-legend";
import { PrintButton } from "./_components/print-button";

type SearchParams = Promise<{ month?: string }>;

const printStyle = (
  <style>{`
    @media print {
      .no-print { display: none !important; }
      body { font-size: 11pt; }
    }
  `}</style>
);

export default async function CalendarPage({ searchParams }: { searchParams: SearchParams }) {
  const [user, params, cycle] = await Promise.all([
    getCurrentUser(),
    searchParams,
    prisma.cycle.findFirst({ where: { isCurrent: true } }),
  ]);

  if (!cycle) {
    return PublicPageShell(
      user,
      <div className="flex items-center justify-center p-6 min-h-[60vh]">
        <p className="text-gray-500 text-sm">Calendar not available right now. Please check back later.</p>
      </div>
    );
  }

  const allEntries = await getCalendarEntries(cycle.id);
  const month = params.month ?? currentMonthKey();
  const monthEntries = allEntries.filter((e) => monthKeyOf(e.date) === month);

  return PublicPageShell(
    user,
    <>
      {printStyle}

      <div className="max-w-5xl mx-auto p-6 space-y-4">
        <div className="no-print flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">OCIA Calendar</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              St. Bartholomew the Apostle Catholic Church · {cycle.name}
            </p>
          </div>
          <PrintButton className="text-sm font-medium px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors">
            Print
          </PrintButton>
        </div>

        <div className="print:block">
          <p className="hidden print:block text-base font-bold mb-3">
            St. Bartholomew the Apostle Catholic Church — OCIA Calendar — {cycle.name}
          </p>

          <div className="mb-3">
            <MonthNav month={month} />
          </div>
          <div className="mb-3">
            <CategoryLegend entries={monthEntries} />
          </div>
          <MonthGrid entries={monthEntries} month={month} />
        </div>

        <AgendaList entries={allEntries} />
      </div>
    </>
  );
}
