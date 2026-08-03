import Link from "next/link";
import { Suspense } from "react";
import { CalendarDays } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/dal";
import { SessionFilters } from "./_components/session-filters";
import { cancelSession } from "@/app/actions/sessions";
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

type SearchParams = Promise<{ type?: string; status?: string }>;

export default async function SessionsPage({ searchParams }: { searchParams: SearchParams }) {
  const user = await requireAuth();
  const params = await searchParams;
  const isAdmin = user.role === "ADMIN";

  const cycle = await prisma.cycle.findFirst({ where: { isCurrent: true } });

  if (!cycle) {
    return (
      <div className="p-6">
        <p className="text-gray-500">No active cycle found. Contact an administrator.</p>
      </div>
    );
  }

  const typeFilter = params.type ? { type: params.type as SessionType } : {};
  const statusFilter = params.status ? { status: params.status as SessionStatus } : {};

  const rawSessions = await prisma.session.findMany({
    where: { cycleId: cycle.id, ...typeFilter, ...statusFilter },
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sessions</h1>
          <p className="text-sm text-gray-500 mt-0.5">{cycle.name}</p>
        </div>
        {isAdmin && (
          <div className="flex gap-2">
            <Link
              href="/sessions/bulk-create"
              className="text-sm font-medium px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Bulk Create
            </Link>
            <Link
              href="/sessions/new"
              className="bg-blue-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              New Session
            </Link>
          </div>
        )}
      </div>

      <Suspense>
        <SessionFilters />
      </Suspense>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {sessions.length === 0 ? (
          <div className="p-12 text-center">
            <CalendarDays className="mx-auto mb-3 text-gray-300" size={40} />
            <p className="text-sm font-medium text-gray-400">No sessions found</p>
            <p className="text-xs text-gray-400 mt-1">Try adjusting your filters.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {["Session", "Title", "Presenter", "Date", "Status", ...(isAdmin ? ["Actions"] : [])].map((h) => (
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
                  <td className="px-4 py-3">
                    <Link
                      href={`/sessions/${s.id}`}
                      className="font-medium text-gray-900 hover:text-blue-600"
                    >
                      {sessionLabel(s.type, s.number)}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{s.title ?? <span className="text-gray-400">—</span>}</td>
                  <td className="px-4 py-3 text-gray-600">{s.presenter ?? <span className="text-gray-400">—</span>}</td>
                  <td className="px-4 py-3 text-gray-600">{formatDate(s.date)}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${statusBadge[s.status]}`}>
                      {statusLabel[s.status]}
                    </span>
                  </td>
                  {isAdmin && (
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/sessions/${s.id}/edit`}
                          className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                        >
                          Edit
                        </Link>
                        {s.status !== "CANCELLED" && (
                          <form action={cancelSession.bind(null, s.id)}>
                            <button
                              type="submit"
                              className="text-xs text-red-500 hover:text-red-700 font-medium"
                            >
                              Cancel
                            </button>
                          </form>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
