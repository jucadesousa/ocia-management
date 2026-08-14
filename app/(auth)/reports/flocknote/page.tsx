import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/dal";
import { ExcelExportButton } from "../_components/excel-export-button";
import { Breadcrumb } from "@/components/breadcrumb";
import type { Group } from "@prisma/client";

type SearchParams = Promise<{ group?: string }>;

export default async function FlocknoteExportPage({
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

  const groupFilter =
    params.group === "ENGLISH" || params.group === "SPANISH"
      ? { group: params.group as Group }
      : {};

  const participants = await prisma.participant.findMany({
    where: { cycleId: cycle.id, status: "ACTIVE", ...groupFilter },
    orderBy: { lastName: "asc" },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      group: true,
    },
  });

  const exportData = participants.map((p) => ({
    "First Name": p.firstName,
    "Last Name": p.lastName,
    Email: p.email ?? "",
    Phone: p.phone ?? "",
  }));

  const activeGroup = params.group ?? "";

  function filterTabClass(value: string) {
    const isActive = value === activeGroup;
    return `text-sm px-3 py-1.5 rounded-lg font-medium transition-colors ${
      isActive
        ? "bg-blue-600 text-white"
        : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
    }`;
  }

  return (
    <div className="p-6 space-y-4">
      <Breadcrumb crumbs={[{ label: "Reports", href: "/reports" }, { label: "Flocknote Export" }]} />

      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Flocknote Export</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {cycle.name} · {participants.length} participant
            {participants.length !== 1 ? "s" : ""}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <ExcelExportButton
            data={exportData}
            filename="flocknote-import.xlsx"
            sheetName="Members"
            className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Export to Excel
          </ExcelExportButton>
        </div>
      </div>

      {/* Group filter tabs */}
      <div className="flex items-center gap-2">
        <Link href="/reports/flocknote" className={filterTabClass("")}>
          All
        </Link>
        <Link href="/reports/flocknote?group=ENGLISH" className={filterTabClass("ENGLISH")}>
          English
        </Link>
        <Link href="/reports/flocknote?group=SPANISH" className={filterTabClass("SPANISH")}>
          Spanish
        </Link>
      </div>

      {/* Preview list */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {participants.length === 0 ? (
          <div className="p-8 text-center text-gray-400 text-sm">
            No active participants found.
          </div>
        ) : (
          <>
            {/* Mobile cards */}
            <ul className="md:hidden divide-y divide-gray-100">
              {participants.map((p) => (
                <li key={p.id} className="px-4 py-3 space-y-1">
                  <div className="text-sm font-medium text-gray-900">
                    {p.firstName} {p.lastName}
                  </div>
                  <p className="text-xs text-gray-500">
                    {p.group === "ENGLISH" ? "English" : "Spanish"}
                  </p>
                  {p.email && (
                    <a href={`mailto:${p.email}`} className="block text-sm text-blue-600 truncate">
                      {p.email}
                    </a>
                  )}
                  {p.phone && (
                    <a href={`tel:${p.phone}`} className="block text-sm text-blue-600">
                      {p.phone}
                    </a>
                  )}
                </li>
              ))}
            </ul>

            {/* Desktop table */}
            <table className="hidden md:table w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {["First Name", "Last Name", "Email", "Phone", "Group"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {participants.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-900">{p.firstName}</td>
                    <td className="px-4 py-3 font-medium text-gray-900">{p.lastName}</td>
                    <td className="px-4 py-3 text-gray-600">
                      {p.email ? <a href={`mailto:${p.email}`} className="hover:text-blue-600">{p.email}</a> : <span className="text-gray-400">—</span>}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {p.phone ? <a href={`tel:${p.phone}`} className="hover:text-blue-600">{p.phone}</a> : <span className="text-gray-400">—</span>}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{p.group === "ENGLISH" ? "English" : "Spanish"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
      </div>
    </div>
  );
}
