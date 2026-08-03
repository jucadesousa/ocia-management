import { Breadcrumb } from "@/components/breadcrumb";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/dal";
import { CalendarDays } from "lucide-react";
import type { SessionType, SessionStatus } from "@prisma/client";

const statusBadge: Record<SessionStatus, string> = {
  PLANNED:   "bg-gray-100 text-gray-600",
  COMPLETED: "bg-green-100 text-green-700",
  CANCELLED: "bg-red-100 text-red-600",
};

const statusLabel: Record<SessionStatus, string> = {
  PLANNED:   "Planned",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

function formatDate(date: Date | null): string {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function sessionLabel(type: SessionType, number: number): string {
  return type === "WEEKLY" ? `Session ${number}` : `Reflection ${number}`;
}

export default async function SessionsReportPage() {
  await requireAuth();

  const cycle = await prisma.cycle.findFirst({ where: { isCurrent: true } });

  if (!cycle) {
    return (
      <div className="p-6">
        <p className="text-gray-500">No active cycle found. Contact an administrator.</p>
      </div>
    );
  }

  const rawSessions = await prisma.session.findMany({
    where: { cycleId: cycle.id },
    orderBy: [{ type: "asc" }, { number: "asc" }],
  });

  // WEEKLY sorts before REFLECTION alphabetically — that's correct (W > R is wrong, R < W alphabetically).
  // But REFLECTION < WEEKLY alphabetically, so Prisma asc gives REFLECTION first. We want WEEKLY first.
  const sessions = [...rawSessions].sort((a, b) => {
    const typeOrder = (a.type === "WEEKLY" ? 0 : 1) - (b.type === "WEEKLY" ? 0 : 1);
    if (typeOrder !== 0) return typeOrder;
    return a.number - b.number;
  });

  return (
    <div className="p-6 space-y-4">
      <Breadcrumb crumbs={[{ label: "Reports", href: "/reports" }, { label: "Session Schedule" }]} />

      <div>
        <h1 className="text-2xl font-bold text-gray-900">Session Schedule</h1>
        <p className="text-sm text-gray-500 mt-0.5">{cycle.name}</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {sessions.length === 0 ? (
          <div className="p-12 text-center">
            <CalendarDays className="mx-auto mb-3 text-gray-300" size={40} />
            <p className="text-sm font-medium text-gray-400">No sessions found</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {["Session", "Title", "Presenter", "Date", "Status"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {sessions.map((s) => (
                <tr
                  key={s.id}
                  className={`hover:bg-gray-50 transition-colors${s.status === "CANCELLED" ? " opacity-60" : ""}`}
                >
                  <td className="px-4 py-3 font-medium text-gray-900">
                    {sessionLabel(s.type, s.number)}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{s.title ?? <span className="text-gray-400">—</span>}</td>
                  <td className="px-4 py-3 text-gray-600">{s.presenter ?? <span className="text-gray-400">—</span>}</td>
                  <td className="px-4 py-3 text-gray-600">{formatDate(s.date)}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${statusBadge[s.status]}`}>
                      {statusLabel[s.status]}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
