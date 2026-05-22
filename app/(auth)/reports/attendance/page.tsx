import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/dal";
import { deriveOciaLabel } from "@/lib/ocia-stage";
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

const statusLetter: Record<string, string> = {
  PRESENT: "P",
  LATE: "L",
  LEFT_EARLY: "LE",
  EXCUSED: "E",
  ABSENT: "A",
};

const statusCellClass: Record<string, string> = {
  PRESENT: "text-green-700",
  LATE: "text-amber-600",
  LEFT_EARLY: "text-orange-600",
  EXCUSED: "text-blue-600",
  ABSENT: "text-red-600 font-semibold",
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

  const [rawSessions, participants] = await Promise.all([
    prisma.session.findMany({
      where: { cycleId: cycle.id, status: "COMPLETED" },
      orderBy: [{ type: "asc" }, { number: "asc" }],
    }),
    prisma.participant.findMany({
      where: { cycleId: cycle.id, status: "ACTIVE" },
      include: {
        attendanceRecords: {
          where: { session: { status: "COMPLETED" } },
        },
        sacramentalRecord: {
          select: { baptismType: true, hasFirstCommunion: true, hasConfirmation: true },
        },
      },
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    }),
  ]);

  // WEEKLY before REFLECTION
  const sessions = [...rawSessions].sort((a, b) => {
    const order = (a.type === "WEEKLY" ? 0 : 1) - (b.type === "WEEKLY" ? 0 : 1);
    return order !== 0 ? order : a.number - b.number;
  });

  const totalSessions = sessions.length;

  // ── Summary rows (only ABSENT counts as not present) ──────────────────────

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
    const attended = p.attendanceRecords.filter((r) => r.status !== "ABSENT").length;
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

  // ── Pivot data ─────────────────────────────────────────────────────────────

  // participantId → sessionId → status
  const pivotMap: Record<string, Record<string, string>> = {};
  for (const p of participants) {
    pivotMap[p.id] = {};
    for (const rec of p.attendanceRecords) {
      pivotMap[p.id][rec.sessionId] = rec.status;
    }
  }

  function sessionLabel(type: string, number: number) {
    return type === "WEEKLY" ? String(number) : `R${number}`;
  }

  // ── Exports ────────────────────────────────────────────────────────────────

  const summaryExportData = sortedRows.map((r) => ({
    Name: r.fullName,
    Group: r.group,
    Stage: stageLabel[r.ociaStage],
    Attended: r.attended,
    Total: r.total,
    "%": r.pct ?? "N/A",
  }));

  const sessionKeys = sessions.map((s) => sessionLabel(s.type, s.number));
  const pivotExportHeader = ["Name", "OCIA Profile", ...sessionKeys, "%"];

  const pivotExportData = participants.map((p) => {
    const rec = pivotMap[p.id];
    const attended = sessions.filter((s) => rec[s.id] && rec[s.id] !== "ABSENT" && rec[s.id] !== "EXCUSED").length;
    const pct = totalSessions > 0 ? Math.round((attended / totalSessions) * 100) : null;
    const entry: Record<string, string | number> = {
      Name: `${p.lastName}, ${p.firstName}`,
      "OCIA Profile": deriveOciaLabel(p.sacramentalRecord).label,
    };
    for (const s of sessions) {
      entry[sessionLabel(s.type, s.number)] = statusLetter[rec[s.id]] ?? "";
    }
    entry["%"] = pct ?? "N/A";
    return entry;
  });

  // ── Shared summary table ───────────────────────────────────────────────────

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
              <span className={`shrink-0 text-sm ${pctClass(r.pct, r.atRisk)}`}>
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
        <Link href="/reports" className="text-sm text-gray-500 hover:text-blue-600">
          ← Reports
        </Link>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-gray-900">Attendance Report</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          {cycle.name} · {totalSessions} completed session{totalSessions !== 1 ? "s" : ""}
        </p>
      </div>

      {/* Section 1 — At-Risk */}
      <section>
        <div className={`rounded-xl border overflow-hidden ${atRiskRows.length > 0 ? "border-red-200" : "border-gray-200"}`}>
          <div className={`px-5 py-3 flex items-center justify-between border-b ${
            atRiskRows.length > 0 ? "bg-red-50 border-red-200" : "bg-gray-50 border-gray-200"
          }`}>
            <div>
              <h2 className={`text-lg font-semibold ${atRiskRows.length > 0 ? "text-red-800" : "text-gray-900"}`}>
                At-Risk Participants
              </h2>
              <p className={`text-sm ${atRiskRows.length > 0 ? "text-red-600" : "text-gray-500"}`}>
                Below {threshold}% attendance · only Absent counts against
              </p>
            </div>
          </div>
          {atRiskRows.length === 0 ? (
            <div className="p-8 text-center text-gray-400 text-sm bg-white">No at-risk participants. Great job!</div>
          ) : (
            <div className="bg-white"><AttendanceTable data={atRiskRows} /></div>
          )}
        </div>
      </section>

      {/* Section 2 — Summary table */}
      <section>
        <div className="rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">All Participants</h2>
            <ExcelExportButton
              data={summaryExportData}
              filename="attendance-report.xlsx"
              sheetName="Attendance"
              className="no-print text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Export to Excel
            </ExcelExportButton>
          </div>
          {sortedRows.length === 0 ? (
            <div className="p-8 text-center text-gray-400 text-sm bg-white">No active participants found.</div>
          ) : (
            <div className="bg-white"><AttendanceTable data={sortedRows} /></div>
          )}
        </div>
      </section>

      {/* Section 3 — Pivot grid */}
      <section>
        <div className="rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Attendance Grid</h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Weekly sessions (1, 2…) · Reflections (R1, R2…) ·{" "}
                <span className="text-green-700">P</span>{" "}
                <span className="text-amber-600">L</span>{" "}
                <span className="text-orange-600">LE</span>{" "}
                <span className="text-blue-600">E</span>{" "}
                <span className="text-red-600">A</span>
              </p>
            </div>
            <ExcelExportButton
              data={pivotExportData}
              filename="attendance-grid.xlsx"
              sheetName="Grid"
              header={pivotExportHeader}
              className="no-print text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Export to Excel
            </ExcelExportButton>
          </div>

          {totalSessions === 0 ? (
            <div className="p-8 text-center text-gray-400 text-sm bg-white">
              No completed sessions yet.
            </div>
          ) : participants.length === 0 ? (
            <div className="p-8 text-center text-gray-400 text-sm bg-white">
              No active participants found.
            </div>
          ) : (
            <div className="bg-white overflow-x-auto">
              <table className="text-xs border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="sticky left-0 z-10 bg-gray-50 px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap border-r border-gray-200 min-w-[160px]">
                      Name
                    </th>
                    <th className="px-3 py-3 text-left font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap border-r border-gray-200 min-w-[140px]">
                      OCIA Profile
                    </th>
                    {sessions.map((s) => (
                      <th
                        key={s.id}
                        className="px-2 py-3 text-center font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap w-8"
                        title={`${s.type === "WEEKLY" ? "Session" : "Reflection"} ${s.number}`}
                      >
                        {sessionLabel(s.type, s.number)}
                      </th>
                    ))}
                    <th className="px-3 py-3 text-center font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap border-l border-gray-200 w-12">
                      %
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {participants.map((p) => {
                    const rec = pivotMap[p.id];
                    const attended = sessions.filter(
                      (s) => rec[s.id] && rec[s.id] !== "ABSENT" && rec[s.id] !== "EXCUSED"
                    ).length;
                    const pct =
                      totalSessions > 0
                        ? Math.round((attended / totalSessions) * 100)
                        : null;
                    const atRisk = pct !== null && pct < threshold;
                    const ociaLabel = deriveOciaLabel(p.sacramentalRecord);
                    return (
                      <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                        <td className="sticky left-0 z-10 bg-white px-4 py-2 font-medium text-gray-900 whitespace-nowrap border-r border-gray-100">
                          {p.lastName}, {p.firstName}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap border-r border-gray-100">
                          <span className={`inline-flex px-1.5 py-0.5 rounded-full text-xs font-medium ${ociaLabel.color}`}>
                            {ociaLabel.label}
                          </span>
                        </td>
                        {sessions.map((s) => {
                          const status = rec[s.id];
                          return (
                            <td
                              key={s.id}
                              className={`px-1 py-2 text-center font-medium ${
                                status ? statusCellClass[status] ?? "text-gray-600" : "text-gray-200"
                              }`}
                            >
                              {status ? (statusLetter[status] ?? status) : "·"}
                            </td>
                          );
                        })}
                        <td className={`px-3 py-2 text-center border-l border-gray-100 ${pctClass(pct, atRisk)}`}>
                          {pct !== null ? `${pct}%` : "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="bg-gray-50 border-t-2 border-gray-300 font-semibold">
                    <td className="sticky left-0 z-10 bg-gray-50 px-4 py-2 text-gray-700 whitespace-nowrap border-r border-gray-200">
                      Present
                    </td>
                    <td className="border-r border-gray-200" />
                    {sessions.map((s) => {
                      const count = participants.filter((p) => {
                        const status = pivotMap[p.id][s.id];
                        return status && status !== "ABSENT" && status !== "EXCUSED";
                      }).length;
                      return (
                        <td key={s.id} className="px-1 py-2 text-center text-gray-700">
                          {count}
                        </td>
                      );
                    })}
                    <td className="border-l border-gray-200" />
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
