import Link from "next/link";
import { requireAuth } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { todayUTCMidnight } from "@/lib/timezone";
import { CalendarDays } from "lucide-react";

export default async function DashboardPage() {
  const user = await requireAuth();

  const cycle = await prisma.cycle.findFirst({ where: { isCurrent: true } });

  const [participantCount, sessionCount, completedSessionCount, atRiskParticipants] =
    cycle
      ? await Promise.all([
          prisma.participant.count({
            where: { cycleId: cycle.id, status: "ACTIVE" },
          }),
          prisma.session.count({
            where: { cycleId: cycle.id, status: { not: "CANCELLED" } },
          }),
          prisma.session.count({
            where: { cycleId: cycle.id, status: "COMPLETED" },
          }),
          // At-risk: active participants below the cycle's attendance threshold
          prisma.participant.findMany({
            where: { cycleId: cycle.id, status: "ACTIVE" },
            select: {
              id: true,
              attendanceRecords: {
                where: { session: { status: "COMPLETED" } },
                select: { status: true },
              },
            },
          }),
        ])
      : [0, 0, 0, []];

  const threshold = cycle?.atRiskThresholdPercent ?? 75;

  const startOfToday = todayUTCMidnight();

  const upcomingSession = cycle
    ? await prisma.session.findFirst({
        where: { cycleId: cycle.id, status: "PLANNED", date: { gte: startOfToday } },
        orderBy: { date: "asc" },
      })
    : null;

  const atRiskCount =
    completedSessionCount > 0 && Array.isArray(atRiskParticipants)
      ? atRiskParticipants.filter((p) => {
          const attended = p.attendanceRecords.filter(
            (r) => r.status === "PRESENT"
          ).length;
          const pct = Math.round((attended / completedSessionCount) * 100);
          return pct < threshold;
        }).length
      : 0;

  const stats = [
    {
      label: "Active participants",
      value: participantCount,
      href: user.role === "ADMIN" ? "/participants" : null,
      accent: "border-l-blue-500",
    },
    {
      label: "Sessions scheduled",
      value: sessionCount,
      href: "/sessions",
      accent: "border-l-green-500",
    },
    {
      label: "Sessions completed",
      value: completedSessionCount,
      href: "/sessions",
      accent: "border-l-emerald-600",
    },
    {
      label: "At-risk participants",
      value: atRiskCount,
      href: "/reports/attendance",
      alert: atRiskCount > 0,
      accent: "border-l-red-500",
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">
          Welcome back, {user.name}.{cycle ? ` · ${cycle.name}` : ""}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(({ label, value, href, alert, accent }) => {
          const className = `bg-white rounded-xl border border-l-4 ${accent} p-5 transition-all ${
            alert ? "border-red-200" : "border-gray-200"
          } ${href ? (alert ? "hover:shadow-md hover:border-red-300" : "hover:shadow-md hover:border-blue-200") : ""}`;
          const content = (
            <>
              <p className="text-sm text-gray-500">{label}</p>
              <p className={`mt-1 text-3xl font-bold ${alert ? "text-red-600" : "text-gray-900"}`}>
                {value}
              </p>
            </>
          );
          return href ? (
            <Link key={label} href={href} className={className}>{content}</Link>
          ) : (
            <div key={label} className={className}>{content}</div>
          );
        })}
      </div>

      {upcomingSession && (
        <div className="bg-white rounded-xl border border-gray-200 border-l-4 border-l-catecheo p-5">
          <p className="text-xs font-semibold text-catecheo uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <CalendarDays size={13} />
            Upcoming Session
          </p>
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <p className="font-semibold text-gray-900">
                {upcomingSession.type === "WEEKLY"
                  ? `Session ${upcomingSession.number}`
                  : `Reflection ${upcomingSession.number}`}
                {upcomingSession.title ? ` — ${upcomingSession.title}` : ""}
              </p>
              {upcomingSession.date && (
                <p className="text-sm text-gray-500 mt-0.5">
                  {new Date(upcomingSession.date).toLocaleDateString("en-US", {
                    weekday: "long", month: "long", day: "numeric", year: "numeric",
                  })}
                </p>
              )}
            </div>
            <Link
              href="/attendance"
              className="shrink-0 text-sm font-medium px-4 py-2 rounded-lg bg-catecheo text-white hover:bg-catecheo-dark transition-colors"
            >
              Take Attendance
            </Link>
          </div>
        </div>
      )}

      {!cycle && (
        <p className="text-sm text-gray-400">No active cycle found. Contact an administrator.</p>
      )}
    </div>
  );
}
