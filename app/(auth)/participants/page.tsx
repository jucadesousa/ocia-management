import Link from "next/link";
import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/dal";
import { ParticipantFilters } from "./_components/filters";
import type { Group, OciaStage, ParticipantStatus } from "@prisma/client";

const PAGE_SIZE = 50;

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2)
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return (name[0] ?? "?").toUpperCase();
}

const stageBadge: Record<OciaStage, string> = {
  INQUIRY:    "bg-gray-100 text-gray-700",
  CATECHUMEN: "bg-blue-100 text-blue-700",
  CANDIDATE:  "bg-purple-100 text-purple-700",
  ELECT:      "bg-indigo-100 text-indigo-700",
  MYSTAGOGY:  "bg-teal-100 text-teal-700",
  COMPLETED:  "bg-green-100 text-green-700",
};

const statusBadge: Record<ParticipantStatus, string> = {
  ACTIVE:    "bg-green-100 text-green-700",
  INACTIVE:  "bg-yellow-100 text-yellow-700",
  WITHDRAWN: "bg-red-100 text-red-700",
};

const stageLabel: Record<OciaStage, string> = {
  INQUIRY: "Inquiry", CATECHUMEN: "Catechumen", CANDIDATE: "Candidate",
  ELECT: "Elect", MYSTAGOGY: "Mystagogy", COMPLETED: "Completed",
};

type SearchParams = Promise<{
  search?: string;
  group?: string;
  stage?: string;
  status?: string;
  page?: string;
}>;

export default async function ParticipantsPage({ searchParams }: { searchParams: SearchParams }) {
  await requireAuth();
  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page ?? "1", 10));
  const search = params.search?.trim() ?? "";

  const cycle = await prisma.cycle.findFirst({ where: { isCurrent: true } });

  if (!cycle) {
    return (
      <div className="p-6">
        <p className="text-gray-500">No active cycle found.</p>
      </div>
    );
  }

  const where = {
    cycleId: cycle.id,
    ...(params.group && { group: params.group as Group }),
    ...(params.stage && { ociaStage: params.stage as OciaStage }),
    ...(params.status && { status: params.status as ParticipantStatus }),
    ...(search && {
      OR: [
        { fullName: { contains: search, mode: "insensitive" as const } },
        { email: { contains: search, mode: "insensitive" as const } },
        { phone: { contains: search } },
      ],
    }),
  };

  const [participants, total, completedSessions] = await Promise.all([
    prisma.participant.findMany({
      where,
      include: {
        attendanceRecords: {
          where: { status: { in: ["PRESENT", "LATE"] } },
          select: { id: true },
        },
      },
      orderBy: { fullName: "asc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.participant.count({ where }),
    prisma.session.count({ where: { cycleId: cycle.id, status: "COMPLETED" } }),
  ]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  const buildPageUrl = (p: number) => {
    const sp = new URLSearchParams();
    if (search) sp.set("search", search);
    if (params.group) sp.set("group", params.group);
    if (params.stage) sp.set("stage", params.stage);
    if (params.status) sp.set("status", params.status);
    sp.set("page", String(p));
    return `/participants?${sp.toString()}`;
  };

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Participants</h1>
          <p className="text-sm text-gray-500 mt-0.5">{cycle.name}</p>
        </div>
        <Link
          href="/participants/new"
          className="bg-blue-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Add participant
        </Link>
      </div>

      <Suspense>
        <ParticipantFilters />
      </Suspense>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {participants.length === 0 ? (
          <div className="p-8 text-center text-gray-400 text-sm">No participants found.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {["Name", "Group", "Stage", "Status", "Attendance"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {participants.map((p) => {
                const attended = p.attendanceRecords.length;
                const pct = completedSessions > 0
                  ? Math.round((attended / completedSessions) * 100)
                  : null;
                const atRisk = pct !== null && pct < cycle.atRiskThresholdPercent;

                return (
                  <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <Link href={`/participants/${p.id}`} className="flex items-center gap-3 group w-fit">
                        {p.photoUrl ? (
                          <img
                            src={p.photoUrl}
                            alt={p.fullName}
                            className="w-8 h-8 rounded-full object-cover border border-gray-200 shrink-0"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-xs font-semibold text-blue-700 shrink-0 select-none">
                            {initials(p.fullName)}
                          </div>
                        )}
                        <div>
                          <span className="font-medium text-gray-900 group-hover:text-blue-600">
                            {p.fullName}
                          </span>
                          {p.preferredName && (
                            <span className="ml-1 text-xs text-gray-400">({p.preferredName})</span>
                          )}
                        </div>
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {p.group === "ENGLISH" ? "English" : "Spanish"}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${stageBadge[p.ociaStage]}`}>
                        {stageLabel[p.ociaStage]}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${statusBadge[p.status]}`}>
                        {p.status.charAt(0) + p.status.slice(1).toLowerCase()}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {pct === null ? (
                        <span className="text-gray-400">—</span>
                      ) : (
                        <span className={atRisk ? "font-semibold text-red-600" : "text-gray-700"}>
                          {pct}%
                          {atRisk && <span className="ml-1 text-xs">⚠</span>}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-gray-500">
          <span>{total} participants · page {page} of {totalPages}</span>
          <div className="flex gap-2">
            {page > 1 && (
              <Link href={buildPageUrl(page - 1)} className="px-3 py-1.5 rounded-lg border border-gray-300 hover:bg-gray-50 text-gray-700">
                Previous
              </Link>
            )}
            {page < totalPages && (
              <Link href={buildPageUrl(page + 1)} className="px-3 py-1.5 rounded-lg border border-gray-300 hover:bg-gray-50 text-gray-700">
                Next
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
