import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/dal";
import { ExcelExportButton } from "../_components/excel-export-button";
import { Breadcrumb } from "@/components/breadcrumb";
import { deriveOciaLabel, OCIA_LABELS, OCIA_LABEL_ORDER } from "@/lib/ocia-stage";
import { OciaProfileLegend } from "@/app/(auth)/participants/_components/ocia-profile-legend";
import { evaluateCanonicalFlag } from "@/lib/canonical-status";
import { CanonicalStatusSelect } from "./_components/canonical-status-select";

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2)
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return (name[0] ?? "?").toUpperCase();
}

type SearchParams = Promise<{ missingGroup?: string; canonicalFilter?: string }>;

export default async function MinistryOverviewPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const user = await requireAuth();
  const params = await searchParams;

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
          baptismType: true,
          isBaptized: true,
          hasFirstCommunion: true,
          hasConfirmation: true,
          baptismProofStatus: true,
          electionDate: true,
          easterVigilDate: true,
          completedAt: true,
          marriageStatus: true,
          marriedToCatholic: true,
          marriedByCatholicPriest: true,
          hadPriorMarriage: true,
          spouseHadPriorMarriage: true,
          annulmentStatus: true,
          canonicalReviewStatus: true,
        },
      },
    },
    orderBy: { lastName: "asc" },
  });

  // ─── Stage Distribution ────────────────────────────────────────────────────

  const activeParticipants = participants.filter((p) => p.status === "ACTIVE");
  const inactiveCount = participants.filter((p) => p.status === "INACTIVE").length;
  const withdrawnCount = participants.filter((p) => p.status === "WITHDRAWN").length;

  const stageCounts: Record<string, number> = {};
  for (const key of OCIA_LABEL_ORDER) stageCounts[key] = 0;

  for (const p of activeParticipants) {
    const key = deriveOciaLabel(p.sacramentalRecord).key;
    stageCounts[key] = (stageCounts[key] ?? 0) + 1;
  }

  const maxStageCount = Math.max(...Object.values(stageCounts), 1);

  // ─── Missing Documents ────────────────────────────────────────────────────

  type MissingRow = {
    id: string;
    fullName: string;
    photoUrl: string | null;
    phone: string | null;
    email: string | null;
    group: string;
    stage: string;
    missing: string;
  };

  const missingRows: MissingRow[] = [];

  for (const p of activeParticipants) {
    const rec = p.sacramentalRecord;
    if (!rec) {
      missingRows.push({
        id: p.id,
        fullName: p.fullName,
        photoUrl: p.photoUrl,
        phone: p.phone,
        email: p.email,
        group: p.group === "ENGLISH" ? "English" : "Spanish",
        stage: deriveOciaLabel(null).label,
        missing: "No sacramental record",
      });
    } else if (rec.isBaptized === true && rec.baptismProofStatus === "NONE") {
      missingRows.push({
        id: p.id,
        fullName: p.fullName,
        photoUrl: p.photoUrl,
        phone: p.phone,
        email: p.email,
        group: p.group === "ENGLISH" ? "English" : "Spanish",
        stage: deriveOciaLabel(rec).label,
        missing: "Baptism proof",
      });
    }
  }

  const missingGroupFilter =
    params.missingGroup === "ENGLISH" || params.missingGroup === "SPANISH"
      ? params.missingGroup === "ENGLISH" ? "English" : "Spanish"
      : "";

  const filteredMissingRows = missingGroupFilter
    ? missingRows.filter((r) => r.group === missingGroupFilter)
    : missingRows;

  const missingExportData = filteredMissingRows.map((r) => ({
    Name: r.fullName,
    Group: r.group,
    Stage: r.stage,
    Missing: r.missing,
    Phone: r.phone ?? "",
    Email: r.email ?? "",
  }));

  function missingGroupTabClass(value: string) {
    const isActive = value === missingGroupFilter;
    return `text-xs px-3 py-1 rounded-lg font-medium transition-colors ${
      isActive
        ? "bg-blue-600 text-white"
        : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
    }`;
  }

  // ─── Canonical Status Review (ADMIN only) ─────────────────────────────────

  type CanonicalRow = {
    id: string;
    fullName: string;
    photoUrl: string | null;
    phone: string | null;
    email: string | null;
    group: string;
    tier: 1 | 2 | 3;
    label: string;
    reason: string;
    status: string;
  };

  const canonicalRows: CanonicalRow[] = [];

  if (user.role === "ADMIN") {
    for (const p of activeParticipants) {
      const flag = evaluateCanonicalFlag(p.sacramentalRecord);
      if (!flag) continue;
      canonicalRows.push({
        id: p.id,
        fullName: p.fullName,
        photoUrl: p.photoUrl,
        phone: p.phone,
        email: p.email,
        group: p.group === "ENGLISH" ? "English" : "Spanish",
        tier: flag.tier,
        label: flag.label,
        reason: flag.reason,
        status: p.sacramentalRecord?.canonicalReviewStatus ?? "NOT_REVIEWED",
      });
    }
    canonicalRows.sort((a, b) => a.tier - b.tier || a.fullName.localeCompare(b.fullName));
  }

  const canonicalFilter =
    params.canonicalFilter === "all" || params.canonicalFilter === "resolved"
      ? params.canonicalFilter
      : "open";

  const filteredCanonicalRows = canonicalRows.filter((r) => {
    if (canonicalFilter === "open") return r.status !== "RESOLVED";
    if (canonicalFilter === "resolved") return r.status === "RESOLVED";
    return true;
  });

  const canonicalExportData = filteredCanonicalRows.map((r) => ({
    Name: r.fullName,
    Group: r.group,
    Issue: r.label,
    Status: r.status.replace(/_/g, " "),
    Phone: r.phone ?? "",
    Email: r.email ?? "",
  }));

  function canonicalFilterTabClass(value: string) {
    const isActive = value === canonicalFilter;
    return `text-xs px-3 py-1 rounded-lg font-medium transition-colors ${
      isActive
        ? "bg-blue-600 text-white"
        : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
    }`;
  }

  const canonicalBadgeClass: Record<1 | 2 | 3, string> = {
    1: "bg-red-100 text-red-700",
    2: "bg-orange-100 text-orange-700",
    3: "bg-yellow-100 text-yellow-700",
  };

  return (
    <div className="p-6 space-y-6">
      <style>{`@media print { .no-print { display: none !important; } }`}</style>

      <div className="no-print">
        <Breadcrumb crumbs={[{ label: "Reports", href: "/reports" }, { label: "Ministry Overview" }]} />
      </div>

      <div>
        <h1 className="text-2xl font-bold text-gray-900">Ministry Overview</h1>
        <p className="text-sm text-gray-500 mt-0.5">{cycle.name}</p>
      </div>

      {/* ─── Section 1: Stage Distribution ─────────────────────────────────── */}
      <section>
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-3 bg-gray-50 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 inline-flex items-center gap-0.5">
              Stage Distribution
              <OciaProfileLegend />
            </h2>
            <p className="text-sm text-gray-500">
              {activeParticipants.length} active participant
              {activeParticipants.length !== 1 ? "s" : ""}
              {inactiveCount > 0 && ` · ${inactiveCount} inactive`}
              {withdrawnCount > 0 && ` · ${withdrawnCount} withdrawn`}
            </p>
          </div>

          <div className="p-5 space-y-3">
            {OCIA_LABEL_ORDER.map((key) => {
              const count = stageCounts[key] ?? 0;
              const widthPct =
                maxStageCount > 0
                  ? Math.round((count / maxStageCount) * 100)
                  : 0;
              return (
                <div key={key} className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                  <span className="text-sm text-gray-700 sm:w-44 sm:shrink-0 sm:truncate" title={OCIA_LABELS[key].label}>
                    {OCIA_LABELS[key].label}
                  </span>
                  <div className="flex items-center gap-3 flex-1 min-w-0">
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
          <div className="px-5 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between flex-wrap gap-3">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Missing Documents{" "}
                <span className="text-sm font-normal text-gray-400">
                  ({filteredMissingRows.length})
                </span>
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

          {missingRows.length > 0 && (
            <div className="no-print px-5 py-2 border-b border-gray-100 flex items-center gap-2">
              <Link href="/reports/ministry" className={missingGroupTabClass("")}>
                All
              </Link>
              <Link href="/reports/ministry?missingGroup=ENGLISH" className={missingGroupTabClass("English")}>
                English
              </Link>
              <Link href="/reports/ministry?missingGroup=SPANISH" className={missingGroupTabClass("Spanish")}>
                Spanish
              </Link>
            </div>
          )}

          {filteredMissingRows.length === 0 ? (
            <div className="p-8 text-center text-gray-400 text-sm">
              {missingRows.length === 0
                ? "All active participants have complete sacramental records."
                : "No missing documents for this group."}
            </div>
          ) : (
            <>
              {/* Mobile cards */}
              <ul className="md:hidden divide-y divide-gray-100">
                {filteredMissingRows.map((r) => (
                  <li key={r.id} className="px-4 py-3 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      {r.photoUrl ? (
                        <img
                          src={r.photoUrl}
                          alt={r.fullName}
                          className="w-10 h-10 rounded-full object-cover border border-gray-200 shrink-0"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-sm font-semibold text-blue-700 shrink-0 select-none">
                          {initials(r.fullName)}
                        </div>
                      )}
                      <div className="min-w-0">
                        <Link href={`/participants/${r.id}`} className="text-sm font-medium text-gray-900 hover:text-blue-600 truncate block">
                          {r.fullName}
                        </Link>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {r.group} · {r.stage}
                        </p>
                      </div>
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
                    {["Name", "Group"].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        {h}
                      </th>
                    ))}
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      <span className="inline-flex items-center gap-0.5">
                        Stage
                        <OciaProfileLegend />
                      </span>
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Missing
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredMissingRows.map((r) => (
                    <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 font-medium text-gray-900">
                        <Link href={`/participants/${r.id}`} className="flex items-center gap-3 group w-fit hover:text-blue-600">
                          {r.photoUrl ? (
                            <img
                              src={r.photoUrl}
                              alt={r.fullName}
                              className="w-8 h-8 rounded-full object-cover border border-gray-200 shrink-0"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-xs font-semibold text-blue-700 shrink-0 select-none">
                              {initials(r.fullName)}
                            </div>
                          )}
                          {r.fullName}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{r.group}</td>
                      <td className="px-4 py-3 text-gray-600">{r.stage}</td>
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

      {/* ─── Section 3: Canonical Status Review (ADMIN only) ──────────────── */}
      {user.role === "ADMIN" && (
        <section>
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-5 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between flex-wrap gap-3">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Canonical Status Review{" "}
                  <span className="text-sm font-normal text-gray-400">
                    ({filteredCanonicalRows.length})
                  </span>
                </h2>
                <p className="text-sm text-gray-500">
                  Active, married participants whose marriage may need review
                  by the deacon — unresolved prior bonds, marriage outside
                  canonical form, or undocumented form
                </p>
              </div>
              {canonicalRows.length > 0 && (
                <ExcelExportButton
                  data={canonicalExportData}
                  filename="canonical-status-review.xlsx"
                  sheetName="Canonical Review"
                  className="no-print text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  Export to Excel
                </ExcelExportButton>
              )}
            </div>

            {canonicalRows.length > 0 && (
              <div className="no-print px-5 py-2 border-b border-gray-100 flex items-center gap-2">
                <Link href="/reports/ministry?canonicalFilter=open" className={canonicalFilterTabClass("open")}>
                  Open
                </Link>
                <Link href="/reports/ministry?canonicalFilter=all" className={canonicalFilterTabClass("all")}>
                  All
                </Link>
                <Link href="/reports/ministry?canonicalFilter=resolved" className={canonicalFilterTabClass("resolved")}>
                  Resolved
                </Link>
              </div>
            )}

            {filteredCanonicalRows.length === 0 ? (
              <div className="p-8 text-center text-gray-400 text-sm">
                {canonicalRows.length === 0
                  ? "No canonical concerns detected among active participants."
                  : "No cases in this view."}
              </div>
            ) : (
              <>
                {/* Mobile cards */}
                <ul className="md:hidden divide-y divide-gray-100">
                  {filteredCanonicalRows.map((r) => (
                    <li key={r.id} className="px-4 py-3 space-y-2">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          {r.photoUrl ? (
                            <img
                              src={r.photoUrl}
                              alt={r.fullName}
                              className="w-10 h-10 rounded-full object-cover border border-gray-200 shrink-0"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-sm font-semibold text-blue-700 shrink-0 select-none">
                              {initials(r.fullName)}
                            </div>
                          )}
                          <div className="min-w-0">
                            <Link href={`/participants/${r.id}`} className="text-sm font-medium text-gray-900 hover:text-blue-600 truncate block">
                              {r.fullName}
                            </Link>
                            <p className="text-xs text-gray-500 mt-0.5">{r.group}</p>
                          </div>
                        </div>
                        <span className={`shrink-0 inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${canonicalBadgeClass[r.tier]}`}>
                          {r.label}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500">{r.reason}</p>
                      <CanonicalStatusSelect participantId={r.id} status={r.status} />
                    </li>
                  ))}
                </ul>

                {/* Desktop table */}
                <table className="hidden md:table w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      {["Name", "Group", "Issue", "Status"].map((h) => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredCanonicalRows.map((r) => (
                      <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 font-medium text-gray-900">
                          <Link href={`/participants/${r.id}`} className="flex items-center gap-3 group w-fit hover:text-blue-600">
                            {r.photoUrl ? (
                              <img
                                src={r.photoUrl}
                                alt={r.fullName}
                                className="w-8 h-8 rounded-full object-cover border border-gray-200 shrink-0"
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-xs font-semibold text-blue-700 shrink-0 select-none">
                                {initials(r.fullName)}
                              </div>
                            )}
                            {r.fullName}
                          </Link>
                        </td>
                        <td className="px-4 py-3 text-gray-600">{r.group}</td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${canonicalBadgeClass[r.tier]}`}
                            title={r.reason}
                          >
                            {r.label}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <CanonicalStatusSelect participantId={r.id} status={r.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
