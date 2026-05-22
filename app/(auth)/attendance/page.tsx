import Link from "next/link";
import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/dal";
import { deriveOciaLabel } from "@/lib/ocia-stage";
import { SessionSelector } from "./_components/session-selector";
import { RosterClient } from "./_components/roster-client";
import type { SessionType } from "@prisma/client";

type SearchParams = Promise<{ sessionId?: string; group?: string }>;

function sortSessions<T extends { type: SessionType; number: number }>(sessions: T[]): T[] {
  return [...sessions].sort((a, b) => {
    const typeOrder = (a.type === "WEEKLY" ? 0 : 1) - (b.type === "WEEKLY" ? 0 : 1);
    if (typeOrder !== 0) return typeOrder;
    return a.number - b.number;
  });
}

export default async function AttendancePage({ searchParams }: { searchParams: SearchParams }) {
  await requireAuth();
  const params = await searchParams;

  const cycle = await prisma.cycle.findFirst({ where: { isCurrent: true } });

  if (!cycle) {
    return (
      <div className="p-6">
        <p className="text-gray-500">No active cycle.</p>
      </div>
    );
  }

  const rawSessions = await prisma.session.findMany({
    where: { cycleId: cycle.id, status: { not: "CANCELLED" } },
    orderBy: [{ type: "asc" }, { number: "asc" }],
  });

  const sessions = sortSessions(rawSessions);

  // Resolve active session ID
  let activeSessionId: string | null = null;

  if (params.sessionId && sessions.some((s) => s.id === params.sessionId)) {
    activeSessionId = params.sessionId;
  } else {
    // Default to the first upcoming PLANNED session (next one to run)
    const plannedSessions = sessions.filter((s) => s.status === "PLANNED");
    if (plannedSessions.length > 0) {
      activeSessionId = plannedSessions[0].id;
    } else if (sessions.length > 0) {
      activeSessionId = sessions[0].id;
    }
  }

  const group: "ENGLISH" | "SPANISH" =
    params.group === "ENGLISH" || params.group === "SPANISH" ? params.group : "ENGLISH";

  const rawParticipants = await prisma.participant.findMany({
    where: { cycleId: cycle.id, group, status: "ACTIVE" },
    orderBy: { lastName: "asc" },
    include: {
      sacramentalRecord: {
        select: { baptismType: true, hasFirstCommunion: true, hasConfirmation: true },
      },
    },
  });

  const participants = rawParticipants.map((p) => ({
    id: p.id,
    fullName: p.fullName,
    preferredName: p.preferredName,
    ociaLabel: deriveOciaLabel(p.sacramentalRecord),
  }));

  const existingRecords = activeSessionId
    ? await prisma.attendanceRecord.findMany({ where: { sessionId: activeSessionId } })
    : [];

  const initialStatuses: Record<string, string> = {};
  for (const r of existingRecords) {
    initialStatuses[r.participantId] = r.status;
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 sm:p-6 border-b border-gray-200 space-y-3">
        <h1 className="text-xl font-bold text-gray-900">Attendance</h1>

        {/* Session selector */}
        <Suspense>
          <SessionSelector sessions={sessions} selectedId={activeSessionId} />
        </Suspense>

        {/* Group tabs */}
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1 w-fit">
          {(["ENGLISH", "SPANISH"] as const).map((g) => (
            <Link
              key={g}
              href={`/attendance?sessionId=${activeSessionId}&group=${g}`}
              className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
                group === g
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {g === "ENGLISH" ? "English" : "Spanish"}
            </Link>
          ))}
        </div>
      </div>

      {/* Roster */}
      {!activeSessionId ? (
        <div className="p-6 text-sm text-gray-400 text-center">
          Select a session to mark attendance.
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto">
          <Suspense
            fallback={
              <div className="p-6 text-center text-gray-400 text-sm">Loading…</div>
            }
          >
            <RosterClient
              sessionId={activeSessionId}
              group={group}
              participants={participants}
              initialStatuses={initialStatuses}
            />
          </Suspense>
        </div>
      )}
    </div>
  );
}
