import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAuth } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { Breadcrumb } from "@/components/breadcrumb";
import type { SessionStatus, SessionType } from "@prisma/client";

type Props = { params: Promise<{ id: string }> };

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

const attendanceLabel: Record<string, string> = {
  PRESENT: "Present",
  ABSENT:  "Absent",
  EXCUSED: "Excused",
};

const attendanceBadge: Record<string, string> = {
  PRESENT: "bg-green-100 text-green-700",
  ABSENT:  "bg-gray-100 text-gray-500",
  EXCUSED: "bg-blue-100 text-blue-700",
};

function sessionLabel(type: SessionType, number: number): string {
  return type === "WEEKLY" ? `Session ${number}` : `Reflection ${number}`;
}

function formatDate(date: Date | null): string {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  });
}

export default async function SessionDetailPage({ params }: Props) {
  const user = await requireAuth();
  const { id } = await params;
  const isAdmin = user.role === "ADMIN";

  const session = await prisma.session.findUnique({
    where: { id },
    include: {
      cycle: { select: { name: true } },
      attendanceRecords: {
        include: {
          participant: {
            select: { id: true, fullName: true, group: true },
          },
        },
        orderBy: { participant: { lastName: "asc" } },
      },
    },
  });

  if (!session) notFound();

  const label = sessionLabel(session.type, session.number);
  const records = session.attendanceRecords;

  const englishRecords = records.filter((r) => r.group === "ENGLISH");
  const spanishRecords = records.filter((r) => r.group === "SPANISH");

  function presentCount(recs: typeof records) {
    return recs.filter((r) => r.status === "PRESENT").length;
  }

  return (
    <div className="p-6 max-w-2xl space-y-6">
      <Breadcrumb crumbs={[
        { label: "Sessions", href: "/sessions" },
        { label },
      ]} />

      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-gray-900">{label}</h1>
          <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${statusBadge[session.status]}`}>
            {statusLabel[session.status]}
          </span>
        </div>
        {isAdmin && (
          <Link
            href={`/sessions/${id}/edit`}
            className="text-sm font-medium px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors whitespace-nowrap"
          >
            Edit
          </Link>
        )}
      </div>

      {/* Session details */}
      <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
        {[
          { label: "Title",     value: session.title ?? "—" },
          { label: "Presenter", value: session.presenter ?? "—" },
          { label: "Date",      value: formatDate(session.date) },
          { label: "Type",      value: session.type === "WEEKLY" ? "Weekly" : "Reflection" },
          { label: "Status",    value: statusLabel[session.status] },
          { label: "Cycle",     value: session.cycle.name },
        ].map(({ label: rowLabel, value }) => (
          <div key={rowLabel} className="flex px-4 py-3 text-sm">
            <span className="w-36 font-medium text-gray-500 shrink-0">{rowLabel}</span>
            <span className="text-gray-900">{value}</span>
          </div>
        ))}
      </div>

      {/* Attendance */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-gray-900">Attendance</h2>
          {records.length > 0 && (
            <span className="text-sm text-gray-500">
              {presentCount(records)} / {records.length} present
            </span>
          )}
        </div>

        {records.length === 0 ? (
          <div className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-8 text-center text-sm text-gray-400">
            No attendance recorded for this session yet.
          </div>
        ) : (
          <>
            {[
              { label: "English", recs: englishRecords },
              { label: "Spanish", recs: spanishRecords },
            ]
              .filter(({ recs }) => recs.length > 0)
              .map(({ label: groupLabel, recs }) => (
                <div key={groupLabel} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
                    <span className="text-sm font-semibold text-gray-700">{groupLabel}</span>
                    <span className="text-xs text-gray-500">
                      {presentCount(recs)} / {recs.length} present
                    </span>
                  </div>
                  <ul className="divide-y divide-gray-100">
                    {recs.map((r) => (
                      <li key={r.id} className="flex items-center justify-between px-4 py-2.5 gap-3">
                        <Link
                          href={`/participants/${r.participant.id}`}
                          className="text-sm font-medium text-gray-900 hover:text-blue-600 truncate"
                        >
                          {r.participant.fullName}
                        </Link>
                        <span className={`shrink-0 inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${attendanceBadge[r.status] ?? "bg-gray-100 text-gray-600"}`}>
                          {attendanceLabel[r.status] ?? r.status}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
          </>
        )}
      </div>
    </div>
  );
}
