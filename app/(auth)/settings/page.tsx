import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/dal";
import { UsersTab } from "./_components/users-tab";
import { CyclesTab } from "./_components/cycles-tab";
import { CalendarEventsTab } from "./_components/calendar-events-tab";

type SearchParams = Promise<{ tab?: string; edit?: string }>;

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const me = await requireAuth();
  if (me.role !== "ADMIN") notFound();

  const params = await searchParams;
  const tab = params.tab === "cycles" ? "cycles" : params.tab === "calendar" ? "calendar" : "users";

  const [users, cycles, currentCycle] = await Promise.all([
    prisma.user.findMany({ orderBy: { name: "asc" } }),
    prisma.cycle.findMany({ orderBy: { year: "desc" } }),
    prisma.cycle.findFirst({ where: { isCurrent: true } }),
  ]);

  const calendarEvents = currentCycle
    ? await prisma.calendarEvent.findMany({
        where: { cycleId: currentCycle.id },
        orderBy: [{ date: "asc" }, { sortOrder: "asc" }],
      })
    : [];

  const tabs = [
    { key: "users",    label: "Staff Accounts" },
    { key: "cycles",   label: "Cycles" },
    { key: "calendar", label: "Calendar" },
  ];

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Settings</h1>

      {/* Tab nav */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-1 -mb-px">
          {tabs.map(({ key, label }) => (
            <Link
              key={key}
              href={`/settings?tab=${key}`}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                tab === key
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              {label}
            </Link>
          ))}
        </nav>
      </div>

      {tab === "users"  && <UsersTab  users={users}  currentUserId={me.id} />}
      {tab === "cycles" && <CyclesTab cycles={cycles} editId={params.edit} />}
      {tab === "calendar" && (
        currentCycle ? (
          <CalendarEventsTab cycleId={currentCycle.id} events={calendarEvents} editId={params.edit} />
        ) : (
          <p className="text-sm text-gray-500 py-6">No active cycle found. Set a current cycle first.</p>
        )
      )}
    </div>
  );
}
