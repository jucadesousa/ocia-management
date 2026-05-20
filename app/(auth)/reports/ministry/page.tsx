import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/dal";
import { ExcelExportButton } from "../_components/excel-export-button";
import type { OciaStage, ParticipantStatus } from "@prisma/client";

const stageLabel: Record<OciaStage, string> = {
  INQUIRY: "Inquiry",
  CATECHUMEN: "Catechumen",
  CANDIDATE: "Candidate",
  ELECT: "Elect",
  MYSTAGOGY: "Mystagogy",
  COMPLETED: "Completed",
};

const STAGE_ORDER: OciaStage[] = [
  "INQUIRY",
  "CATECHUMEN",
  "CANDIDATE",
  "ELECT",
  "MYSTAGOGY",
  "COMPLETED",
];

export default async function MinistryOverviewPage() {
  await requireAuth();

  const cycle = await prisma.cycle.findFirst({ where: { isCurrent: true } });

  if (!cycle) {
    return (
      <div className="p-6">
        <p className="text-gray-500">No active cycle found.</p>
      </div>
    );
  }

  const participants = await prisma.participant.findMany({
    where: { cycleId: cycle.id },
    include: {
      sacramentalRecord: {
        select: {
          isBaptized: true,
          hasFirstCommunion: true,
          hasConfirmation: true,
          baptismProofStatus: true,
        },
      },
    },
    orderBy: { lastName: "asc" },
  });

  // ─── Stage Distribution ────────────────────────────────────────────────────

  const activeParticipants = participants.filter((p) => p.status === "ACTIVE");
  const inactiveCount = participants.filter((p) => p.status === "INACTIVE").length;
  const withdrawnCount = participants.filter((p) => p.status === "WITHDRAWN").length;

  const stageCounts: Record<OciaStage, number> = {
    INQUIRY: 0,
    CATECHUMEN: 0,
    CANDIDATE: 0,
    ELECT: 0,
    MYSTAGOGY: 0,
    COMPLETED: 0,
  };

  for (const p of activeParticipants) {
    stageCounts[p.ociaStage] = (stageCounts[p.ociaStage] ?? 0) + 1;
  }

  const maxStageCount = Math.max(...Object.values(stageCounts), 1);

  // ─── Missing Documents ────────────────────────────────────────────────────

  type MissingRow = {
    id: string;
    fullName: string;
    group: string;
    stage: OciaStage;
    missing: string;
  };

  const missingRows: MissingRow[] = [];

  for (const p of activeParticipants) {
    const rec = p.sacramentalRecord;
    if (!rec) {
      missingRows.push({
        id: p.id,
        fullName: p.fullName,
        group: p.group === "ENGLISH" ? "English" : "Spanish",
        stage: p.ociaStage,
        missing: "No sacramental record",
      });
    } else if (rec.baptismProofStatus === "NONE") {
      missingRows.push({
        id: p.id,
        fullName: p.fullName,
        group: p.group === "ENGLISH" ? "English" : "Spanish",
        stage: p.ociaStage,
        missing: "Baptism proof",
      });
    }
  }

  const missingExportData = missingRows.map((r) => ({
    Name: r.fullName,
    Group: r.group,
    Stage: stageLabel[r.stage],
    Missing: r.missing,
  }));

  return (
    <div className="p-6 space-y-6">
      <style>{`@media print { .no-print { display: none !important; } }`}</style>

      <div className="no-print">
        <Link href="/reports" className="text-sm text-gray-500 hover:text-blue-600">
          ← Reports
        </Link>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-gray-900">Ministry Overview</h1>
        <p className="text-sm text-gray-500 mt-0.5">{cycle.name}</p>
      </div>

      {/* ─── Section 1: Stage Distribution ─────────────────────────────────── */}
      <section>
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-3 bg-gray-50 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Stage Distribution
            </h2>
            <p className="text-sm text-gray-500">
              {activeParticipants.length} active participant
              {activeParticipants.length !== 1 ? "s" : ""}
              {inactiveCount > 0 && ` · ${inactiveCount} inactive`}
              {withdrawnCount > 0 && ` · ${withdrawnCount} withdrawn`}
            </p>
          </div>

          <div className="p-5 space-y-3">
            {STAGE_ORDER.map((stage) => {
              const count = stageCounts[stage] ?? 0;
              const widthPct =
                maxStageCount > 0
                  ? Math.round((count / maxStageCount) * 100)
                  : 0;
              return (
                <div key={stage} className="flex items-center gap-3">
                  <span className="text-sm text-gray-700 w-28 shrink-0">
                    {stageLabel[stage]}
                  </span>
                  <div className="flex-1 bg-gray-100 rounded-full h-4 overflow-hidden">
                    <div
                      className="bg-blue-500 h-4 rounded-full transition-all"
                      style={{ width: `${widthPct}%` }}
                    />
                  </div>
                  <span className="text-sm font-semibold text-gray-700 w-6 text-right shrink-0">
                    {count}
                  </span>
                </div>
              );
            })}

            {(inactiveCount > 0 || withdrawnCount > 0) && (
              <div className="pt-2 border-t border-gray-100 space-y-1 text-sm text-gray-500">
                {inactiveCount > 0 && (
                  <div className="flex justify-between">
                    <span>Inactive</span>
                    <span className="font-medium text-gray-700">
                      {inactiveCount}
                    </span>
                  </div>
                )}
                {withdrawnCount > 0 && (
                  <div className="flex justify-between">
                    <span>Withdrawn</span>
                    <span className="font-medium text-gray-700">
                      {withdrawnCount}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ─── Section 2: Missing Documents ──────────────────────────────────── */}
      <section>
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Missing Documents
              </h2>
              <p className="text-sm text-gray-500">
                Active participants missing a sacramental record or baptism
                certificate
              </p>
            </div>
            {missingRows.length > 0 && (
              <ExcelExportButton
                data={missingExportData}
                filename="missing-documents.xlsx"
                sheetName="Missing Docs"
                className="no-print text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Export to Excel
              </ExcelExportButton>
            )}
          </div>

          {missingRows.length === 0 ? (
            <div className="p-8 text-center text-gray-400 text-sm">
              All active participants have complete sacramental records.
            </div>
          ) : (
            <>
              {/* Mobile cards */}
              <ul className="md:hidden divide-y divide-gray-100">
                {missingRows.map((r) => (
                  <li key={r.id} className="px-4 py-3 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{r.fullName}</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {r.group} · {stageLabel[r.stage]}
                      </p>
                    </div>
                    <span className={`shrink-0 inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                      r.missing === "No sacramental record"
                        ? "bg-red-100 text-red-700"
                        : "bg-yellow-100 text-yellow-700"
                    }`}>
                      {r.missing}
                    </span>
                  </li>
                ))}
              </ul>

              {/* Desktop table */}
              <table className="hidden md:table w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    {["Name", "Group", "Stage", "Missing"].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {missingRows.map((r) => (
                    <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 font-medium text-gray-900">{r.fullName}</td>
                      <td className="px-4 py-3 text-gray-600">{r.group}</td>
                      <td className="px-4 py-3 text-gray-600">{stageLabel[r.stage]}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                          r.missing === "No sacramental record"
                            ? "bg-red-100 text-red-700"
                            : "bg-yellow-100 text-yellow-700"
                        }`}>
                          {r.missing}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
        </div>
      </section>
    </div>
  );
}
