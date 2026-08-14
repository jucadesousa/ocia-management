import Link from "next/link";
import { Suspense } from "react";
import { Breadcrumb } from "@/components/breadcrumb";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/dal";
import { RosterControls } from "./_components/roster-controls";
import { PrintButton } from "../_components/print-button";
import type { SessionType, SessionStatus } from "@prisma/client";
import { deriveOciaLabel } from "@/lib/ocia-stage";
import { OciaProfileLegend } from "@/app/(auth)/participants/_components/ocia-profile-legend";

function formatDate(date: Date | null): string {
  if (!date) return "______";
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function makeSessionLabel(type: SessionType, number: number, date: Date | null): string {
  const prefix = type === "WEEKLY" ? `Session ${number}` : `Reflection ${number}`;
  return `${prefix} — ${formatDate(date)}`;
}

const attendanceStatusLabel: Record<string, string> = {
  PRESENT: "Present",
  ABSENT: "Absent",
  EXCUSED: "Excused",
};

const attendanceStatusClass: Record<string, string> = {
  PRESENT: "text-green-700",
  ABSENT: "text-gray-400",
  EXCUSED: "text-blue-600",
};

type SearchParams = Promise<{ sessionId?: string; group?: string }>;

export default async function RosterPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  await requireAuth();
  const params = await searchParams;

  const cycle = await prisma.cycle.findFirst({ where: { isCurrent: true } });

  if (!cycle) {
    return (
      <div className="p-6">
        <p className="text-gray-500">No active cycle found.</p>
      </div>
    );
  }

  const rawSessions = await prisma.session.findMany({
    where: { cycleId: cycle.id },
    orderBy: [{ type: "asc" }, { number: "asc" }],
  });

  // WEEKLY before REFLECTION
  const sessions = [...rawSessions].sort((a, b) => {
    const typeOrder =
      (a.type === "WEEKLY" ? 0 : 1) - (b.type === "WEEKLY" ? 0 : 1);
    if (typeOrder !== 0) return typeOrder;
    return a.number - b.number;
  });

  // Resolve active session
  const activeSessionId =
    params.sessionId ||
    sessions.find((s) => s.status === "PLANNED")?.id ||
    sessions[0]?.id ||
    null;

  const group =
    params.group === "SPANISH" ? ("SPANISH" as const) : ("ENGLISH" as const);

  const activeSession = sessions.find((s) => s.id === activeSessionId) ?? null;

  const [participants, existingRecords] = await Promise.all([
    prisma.participant.findMany({
      where: { cycleId: cycle.id, group, status: "ACTIVE" },
      include: {
        sacramentalRecord: {
          select: {
            baptismType: true,
            hasFirstCommunion: true,
            hasConfirmation: true,
            electionDate: true,
            easterVigilDate: true,
            completedAt: true,
          },
        },
      },
      orderBy: { lastName: "asc" },
    }),
    activeSessionId
      ? prisma.attendanceRecord.findMany({
          where: { sessionId: activeSessionId },
        })
      : Promise.resolve([]),
  ]);

  const statusMap: Record<string, string> = {};
  for (const rec of existingRecords) {
    statusMap[rec.participantId] = rec.status;
  }

  const hasRecords = existingRecords.length > 0;
  const sessionLabel = activeSession
    ? makeSessionLabel(activeSession.type, activeSession.number, activeSession.date)
    : "No Session Selected";
  const groupLabel = group === "ENGLISH" ? "English" : "Spanish";

  // Shape sessions for client component (dates need serialisation)
  const sessionsForClient = sessions.map((s) => ({
    id: s.id,
    number: s.number,
    type: s.type as SessionType,
    date: s.date,
    status: s.status as SessionStatus,
  }));

  return (
    <div className="p-6 space-y-6">
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { font-size: 11pt; }
          table { width: 100%; border-collapse: collapse; }
          th, td { border: 1px solid #ccc; padding: 4px 8px; }
          .page-break { page-break-before: always; }
          header, nav, aside { display: none !important; }
          main { padding-top: 0 !important; }
        }
      `}</style>

      {/* Controls — hidden on print */}
      <div className="no-print space-y-3">
        <Breadcrumb crumbs={[{ label: "Reports", href: "/reports" }, { label: "Session Roster" }]} />

        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Session Roster</h1>
            <p className="text-sm text-gray-500 mt-0.5">{cycle.name}</p>
          </div>
        </div>

        <Suspense>
          <RosterControls
            sessions={sessionsForClient}
            selectedSessionId={activeSessionId}
            group={group}
          />
        </Suspense>
      </div>

      {/* Section A — Filled Roster (screen only) */}
      <section className="no-print">
        {/* Print header */}
        <div className="print-only hidden print:block mb-3">
          <p className="text-base font-bold">
            OCIA {cycle.name} — {sessionLabel} — {groupLabel} Group
          </p>
        </div>

        <div className="no-print mb-3 flex items-center gap-2">
          <h2 className="text-lg font-semibold text-gray-900">
            {sessionLabel}
          </h2>
          <span className="text-sm text-gray-500">— {groupLabel} Group</span>
          {hasRecords && (
            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
              Attendance recorded
            </span>
          )}
        </div>

        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {participants.length === 0 ? (
            <div className="p-8 text-center text-gray-400 text-sm">
              No active participants in this group.
            </div>
          ) : (
            <>
              {/* Mobile cards */}
              <ul className="md:hidden divide-y divide-gray-100">
                {participants.map((p, i) => {
                  const status = statusMap[p.id];
                  return (
                    <li key={p.id} className="px-4 py-3 flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-xs text-gray-400 shrink-0">{i + 1}.</span>
                          <span className="text-sm font-medium text-gray-900 truncate">{p.fullName}</span>
                          {p.preferredName && (
                            <span className="text-xs text-gray-400 italic shrink-0">({p.preferredName})</span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5 ml-4">{deriveOciaLabel(p.sacramentalRecord).label}</p>
                      </div>
                      <span className={`shrink-0 text-xs font-medium ${
                        status ? attendanceStatusClass[status] ?? "text-gray-600" : "text-gray-300"
                      }`}>
                        {status ? attendanceStatusLabel[status] ?? status : "—"}
                      </span>
                    </li>
                  );
                })}
              </ul>

              {/* Desktop table */}
              <table className="hidden md:table w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-10">#</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Full Name</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Preferred Name</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      <span className="inline-flex items-center gap-0.5">
                        Stage
                        <OciaProfileLegend />
                      </span>
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      {hasRecords ? "Status" : "Attendance"}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {participants.map((p, i) => {
                    const status = statusMap[p.id];
                    return (
                      <tr key={p.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-gray-500 text-xs">{i + 1}</td>
                        <td className="px-4 py-3 font-medium text-gray-900">{p.fullName}</td>
                        <td className="px-4 py-3 text-gray-500 italic text-xs">{p.preferredName ?? ""}</td>
                        <td className="px-4 py-3 text-gray-600">{deriveOciaLabel(p.sacramentalRecord).label}</td>
                        <td className={`px-4 py-3 ${status ? attendanceStatusClass[status] ?? "text-gray-600" : "text-gray-300"}`}>
                          {status ? attendanceStatusLabel[status] ?? status : "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </>
          )}
        </div>
      </section>

      {/* Section B — Blank Volunteer Sheet (prints only this) */}
      <section>
        {/* Print-only header */}
        <div className="hidden print:block mb-3">
          <p className="text-base font-bold">
            Attendance Sheet — {sessionLabel} — {groupLabel} Group — Date:{" "}
            {activeSession?.date ? formatDate(activeSession.date) : "______"}
          </p>
        </div>

        <div className="no-print mb-3 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Blank Volunteer Sheet</h2>
            <p className="text-sm text-gray-500">
              P = Present · A = Absent · E = Excused
            </p>
          </div>
          <PrintButton className="text-sm font-medium px-4 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors shrink-0">
            Print
          </PrintButton>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
          {participants.length === 0 ? (
            <div className="p-8 text-center text-gray-400 text-sm">
              No active participants in this group.
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-10">
                    #
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  {["P", "A", "E"].map((col) => (
                    <th
                      key={col}
                      className="px-3 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider w-10"
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {participants.map((p, i) => (
                  <tr key={p.id}>
                    <td className="px-4 py-3 text-gray-500 text-xs">{i + 1}</td>
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {p.lastName}, {p.firstName}
                      {p.preferredName && (
                        <span className="ml-1 text-xs text-gray-400 italic">
                          ({p.preferredName})
                        </span>
                      )}
                    </td>
                    {["P", "A", "E"].map((col) => (
                      <td key={col} className="px-3 py-3 text-center">
                        <span className="inline-block w-5 h-5 border border-gray-400 rounded" />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>
    </div>
  );
}
