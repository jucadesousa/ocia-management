import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/dal";
import { Breadcrumb } from "@/components/breadcrumb";
import { ExcelExportButton } from "../_components/excel-export-button";
import { evaluateDataQualityIssues } from "@/lib/data-quality";

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2)
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return (name[0] ?? "?").toUpperCase();
}

type SearchParams = Promise<{ group?: string }>;

export default async function DataQualityReportPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const user = await requireAuth();
  if (user.role !== "ADMIN") notFound();

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
    where: { cycleId: cycle.id, status: "ACTIVE" },
    select: {
      id: true,
      fullName: true,
      photoUrl: true,
      phone: true,
      email: true,
      group: true,
      maritalStatus: true,
      sacramentalRecord: {
        select: {
          marriageStatus: true,
          marriedToCatholic: true,
          marriedByCatholicPriest: true,
          hadPriorMarriage: true,
          spouseHadPriorMarriage: true,
          annulmentStatus: true,
          marriageCertReceived: true,
          isBaptized: true,
          baptismType: true,
        },
      },
    },
    orderBy: { lastName: "asc" },
  });

  type Row = {
    id: string;
    fullName: string;
    photoUrl: string | null;
    phone: string | null;
    email: string | null;
    group: string;
    issues: ReturnType<typeof evaluateDataQualityIssues>;
  };

  const rows: Row[] = [];
  for (const p of participants) {
    const issues = evaluateDataQualityIssues({ maritalStatus: p.maritalStatus }, p.sacramentalRecord);
    if (issues.length === 0) continue;
    rows.push({
      id: p.id,
      fullName: p.fullName,
      photoUrl: p.photoUrl,
      phone: p.phone,
      email: p.email,
      group: p.group === "ENGLISH" ? "English" : "Spanish",
      issues,
    });
  }

  const groupFilter =
    params.group === "ENGLISH" || params.group === "SPANISH"
      ? params.group === "ENGLISH" ? "English" : "Spanish"
      : "";

  const filteredRows = groupFilter ? rows.filter((r) => r.group === groupFilter) : rows;

  const exportData = filteredRows.flatMap((r) =>
    r.issues.map((issue) => ({
      Name: r.fullName,
      Group: r.group,
      Issue: issue.label,
      Detail: issue.detail,
      Phone: r.phone ?? "",
      Email: r.email ?? "",
    }))
  );

  function groupTabClass(value: string) {
    const isActive = value === groupFilter;
    return `text-xs px-3 py-1 rounded-lg font-medium transition-colors ${
      isActive
        ? "bg-blue-600 text-white"
        : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
    }`;
  }

  return (
    <div className="p-6 space-y-4">
      <Breadcrumb crumbs={[{ label: "Reports", href: "/reports" }, { label: "Data Quality" }]} />

      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Data Quality</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {cycle.name} · {filteredRows.length} active participant
            {filteredRows.length !== 1 ? "s" : ""} flagged
          </p>
        </div>

        {rows.length > 0 && (
          <ExcelExportButton
            data={exportData}
            filename="data-quality.xlsx"
            sheetName="Data Quality"
            className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Export to Excel
          </ExcelExportButton>
        )}
      </div>

      <p className="text-sm text-gray-500 max-w-3xl">
        Active participants who are missing a core fact — baptism or
        marital/cohabitation status — or whose record has an internal
        inconsistency, such as fields that should agree with each other but
        don&apos;t. Fixing the underlying field on the participant&apos;s
        profile removes it from this list automatically.
      </p>

      {rows.length > 0 && (
        <div className="flex items-center gap-2">
          <Link href="/reports/data-quality" className={groupTabClass("")}>
            All
          </Link>
          <Link href="/reports/data-quality?group=ENGLISH" className={groupTabClass("English")}>
            English
          </Link>
          <Link href="/reports/data-quality?group=SPANISH" className={groupTabClass("Spanish")}>
            Spanish
          </Link>
        </div>
      )}

      {filteredRows.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-400 text-sm">
          {rows.length === 0
            ? "No data quality issues detected among active participants."
            : "No data quality issues for this group."}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {/* Mobile cards */}
          <ul className="md:hidden divide-y divide-gray-100">
            {filteredRows.map((r) => (
              <li key={r.id} className="px-4 py-3 space-y-2">
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
                <ul className="space-y-1">
                  {r.issues.map((issue) => (
                    <li key={issue.ruleId} className="text-xs">
                      <span className="inline-flex px-2 py-0.5 rounded-full font-medium bg-red-100 text-red-700">
                        {issue.label}
                      </span>
                      <p className="text-gray-500 mt-0.5">{issue.detail}</p>
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>

          {/* Desktop table */}
          <table className="hidden md:table w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {["Name", "Group", "Issues"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredRows.map((r) => (
                <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-900 align-top">
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
                  <td className="px-4 py-3 text-gray-600 align-top">{r.group}</td>
                  <td className="px-4 py-3 align-top">
                    <ul className="space-y-1.5">
                      {r.issues.map((issue) => (
                        <li key={issue.ruleId}>
                          <span
                            className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700"
                            title={issue.detail}
                          >
                            {issue.label}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
