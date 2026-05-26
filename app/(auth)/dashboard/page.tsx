import Link from "next/link";
import { requireAuth } from "@/lib/dal";
import { prisma } from "@/lib/prisma";

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
      href: "/participants",
    },
    {
      label: "Sessions scheduled",
      value: sessionCount,
      href: "/sessions",
    },
    {
      label: "Sessions completed",
      value: completedSessionCount,
      href: "/sessions",
    },
    {
      label: "At-risk participants",
      value: atRiskCount,
      href: "/reports/attendance",
      alert: atRiskCount > 0,
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
        {stats.map(({ label, value, href, alert }) => (
          <Link
            key={label}
            href={href}
            className={`bg-white rounded-xl border p-5 hover:shadow-sm transition-all ${
              alert ? "border-red-200 hover:border-red-300" : "border-gray-200 hover:border-blue-200"
            }`}
          >
            <p className="text-sm text-gray-500">{label}</p>
            <p className={`mt-1 text-2xl font-semibold ${alert ? "text-red-600" : "text-gray-900"}`}>
              {value}
            </p>
          </Link>
        ))}
      </div>

      {!cycle && (
        <p className="text-sm text-gray-400">No active cycle found. Contact an administrator.</p>
      )}
    </div>
  );
}
