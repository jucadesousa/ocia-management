import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/dal";
import { ExcelExportButton } from "../_components/excel-export-button";
import type { OciaStage } from "@prisma/client";

const stageLabel: Record<OciaStage, string> = {
  INQUIRY: "Inquiry",
  CATECHUMEN: "Catechumen",
  CANDIDATE: "Candidate",
  ELECT: "Elect",
  MYSTAGOGY: "Mystagogy",
  COMPLETED: "Completed",
};

type SearchParams = Promise<{ group?: string }>;

export default async function AttendanceReportPage({
  searchParams: _searchParams,
}: {
  searchParams: SearchParams;
}) {
  await requireAuth();

  const cycle = await prisma.cycle.findFirst({ where: { isCurrent: true } });

  if (!cycle) {
    return (
      <div className="p-6">
        <p className="text-gray-500">No active cycle found.</p>
      </div>
    );
  }

  const threshold = cycle.atRiskThresholdPercent ?? 75;

  const [sessions, participants] = await Promise.all([
    prisma.session.findMany({
      where: { cycleId: cycle.id, status: "COMPLETED" },
      orderBy: [{ type: "asc" }, { number: "asc" }],
    }),
    prisma.participant.findMany({
      where: { cycleId: cycle.id, status: "ACTIVE" },
      include: {
        attendanceRecords: {
          where: { session: { status: "COMPLETED" } },
          include: {
            session: { select: { number: true, type: true } },
          },
        },
      },
      orderBy: { lastName: "asc" },
    }),
  ]);

  const totalSessions = sessions.length;

  type ParticipantRow = {
    id: string;
    fullName: string;
    group: string;
    ociaStage: OciaStage;
    attended: number;
    total: number;
    pct: number | null;
    atRisk: boolean;
  };

  const rows: ParticipantRow[] = participants.map((p) => {
    const attended = p.attendanceRecords.filter(
      (r) => r.status === "PRESENT" || r.status === "LATE"
    ).length;
    const total = totalSessions;
    const pct = total > 0 ? Math.round((attended / total) * 100) : null;
    const atRisk = pct !== null && pct < threshold;
    return {
      id: p.id,
      fullName: p.fullName,
      group: p.group === "ENGLISH" ? "English" : "Spanish",
      ociaStage: p.ociaStage,
      attended,
      total,
      pct,
      atRisk,
    };
  });

  const atRiskRows = rows.filter((r) => r.atRisk);

  // Sort: at-risk first, then by name
  const sortedRows = [...rows].sort((a, b) => {
    if (a.atRisk && !b.atRisk) return -1;
    if (!a.atRisk && b.atRisk) return 1;
    return a.fullName.localeCompare(b.fullName);
  });

  function pctClass(pct: number | null, atRisk: boolean): string {
    if (pct === null) return "text-gray-400";
    if (atRisk) return "font-semibold text-red-600";
    if (pct < 90) return "font-semibold text-yellow-600";
    return "font-semibold text-green-600";
  }

  const exportData = sortedRows.map((r) => ({
    Name: r.fullName,
    Group: r.group,
    Stage: stageLabel[r.ociaStage],
    Attended: r.attended,
    Total: r.total,
    "%": r.pct ?? "N/A",
  }));

  function AttendanceTable({ data }: { data: ParticipantRow[] }) {
    return (
      <>
        {/* Mobile cards */}
        <ul className="md:hidden divide-y divide-gray-100">
          {data.map((r) => (
            <li key={r.id} className="px-4 py-3 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{r.fullName}</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {r.group} · {stageLabel[r.ociaStage]}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {r.attended} of {r.total} sessions
                </p>
              </div>
              <span className={`shrink-0 text-sm font-semibold ${pctClass(r.pct, r.atRisk)}`}>
                {r.pct !== null ? `${r.pct}%` : "—"}
              </span>
            </li>
          ))}
        </ul>

        {/* Desktop table */}
        <table className="hidden md:table w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {["Full Name", "Group", "Stage", "Attended", "Sessions", "%"].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {data.map((r) => (
              <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 font-medium text-gray-900">{r.fullName}</td>
                <td className="px-4 py-3 text-gray-600">{r.group}</td>
                <td className="px-4 py-3 text-gray-600">{stageLabel[r.ociaStage]}</td>
                <td className="px-4 py-3 text-gray-700">{r.attended}</td>
                <td className="px-4 py-3 text-gray-700">{r.total}</td>
                <td className={`px-4 py-3 ${pctClass(r.pct, r.atRisk)}`}>
                  {r.pct !== null ? `${r.pct}%` : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <style>{`@media print { .no-print { display: none !important; } }`}</style>

      <div className="no-print">
        <Link
          href="/reports"
          className="text-sm text-gray-500 hover:text-blue-600"
        >
          ← Reports
        </Link>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-gray-900">Attendance Report</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          {cycle.name} · {totalSessions} completed session
          {totalSessions !== 1 ? "s" : ""}
        </p>
      </div>

      {/* Section 1 — At-Risk */}
      <section>
        <div
          className={`rounded-xl border overflow-hidden ${
            atRiskRows.length > 0
              ? "border-red-200"
              : "border-gray-200"
          }`}
        >
          <div
            className={`px-5 py-3 flex items-center justify-between ${
              atRiskRows.length > 0 ? "bg-red-50" : "bg-gray-50"
            } border-b ${
              atRiskRows.length > 0 ? "border-red-200" : "border-gray-200"
            }`}
          >
            <div>
              <h2
                className={`text-lg font-semibold ${
                  atRiskRows.length > 0 ? "text-red-800" : "text-gray-900"
                }`}
              >
                At-Risk Participants
              </h2>
              <p
                className={`text-sm ${
                  atRiskRows.length > 0 ? "text-red-600" : "text-gray-500"
                }`}
              >
                (below {threshold}% attendance)
              </p>
            </div>
          </div>

          {atRiskRows.length === 0 ? (
            <div className="p-8 text-center text-gray-400 text-sm bg-white">
              No at-risk participants. Great job!
            </div>
          ) : (
            <div className="bg-white">
              <AttendanceTable data={atRiskRows} />
            </div>
          )}
        </div>
      </section>

      {/* Section 2 — All Participants */}
      <section>
        <div className="rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              All Participants
            </h2>
            <ExcelExportButton
              data={exportData}
              filename="attendance-report.xlsx"
              sheetName="Attendance"
              className="no-print text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Export to Excel
            </ExcelExportButton>
          </div>

          {sortedRows.length === 0 ? (
            <div className="p-8 text-center text-gray-400 text-sm bg-white">
              No active participants found.
            </div>
          ) : (
            <div className="bg-white">
              <AttendanceTable data={sortedRows} />
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
