import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/dal";
import { ExcelExportButton } from "../_components/excel-export-button";
import { PrintButton } from "../_components/print-button";
import { Breadcrumb } from "@/components/breadcrumb";
import { deriveOciaLabel } from "@/lib/ocia-stage";
import { OciaProfileLegend } from "@/app/(auth)/participants/_components/ocia-profile-legend";
import type { Group } from "@prisma/client";

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2)
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return (name[0] ?? "?").toUpperCase();
}

type SearchParams = Promise<{ group?: string }>;

export default async function ContactsReportPage({
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
      fullName: true,
      preferredName: true,
      photoUrl: true,
      group: true,
      phone: true,
      phoneWork: true,
      email: true,
      sponsorName: true,
      address: true,
      city: true,
      state: true,
      zipCode: true,
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
  });

  const exportData = participants.map((p) => ({
    Name: p.fullName,
    "Preferred Name": p.preferredName ?? "",
    Group: p.group === "ENGLISH" ? "English" : "Spanish",
    "OCIA Profile": deriveOciaLabel(p.sacramentalRecord).label,
    Phone: p.phone ?? "",
    "Work Phone": p.phoneWork ?? "",
    Email: p.email ?? "",
    Sponsor: p.sponsorName ?? "",
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
      <style>{`@media print { .no-print { display: none !important; } }`}</style>

      <div className="no-print">
        <Breadcrumb crumbs={[{ label: "Reports", href: "/reports" }, { label: "Contact List" }]} />
      </div>

      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Contact List</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {cycle.name} · {participants.length} participant
            {participants.length !== 1 ? "s" : ""}
          </p>
        </div>

        {/* Actions */}
        <div className="no-print flex items-center gap-2">
          <ExcelExportButton
            data={exportData}
            filename="contact-list.xlsx"
            sheetName="Contacts"
            className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Export to Excel
          </ExcelExportButton>
          <PrintButton className="text-xs bg-gray-100 text-gray-700 px-3 py-1.5 rounded-lg hover:bg-gray-200 transition-colors font-medium">
            Print
          </PrintButton>
        </div>
      </div>

      {/* Group filter tabs */}
      <div className="no-print flex items-center gap-2">
        <Link href="/reports/contacts" className={filterTabClass("")}>
          All
        </Link>
        <Link
          href="/reports/contacts?group=ENGLISH"
          className={filterTabClass("ENGLISH")}
        >
          English
        </Link>
        <Link
          href="/reports/contacts?group=SPANISH"
          className={filterTabClass("SPANISH")}
        >
          Spanish
        </Link>
      </div>

      {/* Contact list */}
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
                <li key={p.id} className="px-4 py-3 flex items-start gap-3">
                  {p.photoUrl ? (
                    <img
                      src={p.photoUrl}
                      alt={p.fullName}
                      className="w-10 h-10 rounded-full object-cover border border-gray-200 shrink-0"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-sm font-semibold text-blue-700 shrink-0 select-none">
                      {initials(p.fullName)}
                    </div>
                  )}
                  <div className="min-w-0 space-y-1">
                    <div>
                      <span className="text-sm font-medium text-gray-900">{p.fullName}</span>
                      {p.preferredName && (
                        <span className="ml-1 text-xs text-gray-400 italic">({p.preferredName})</span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500">
                      {p.group === "ENGLISH" ? "English" : "Spanish"} · {deriveOciaLabel(p.sacramentalRecord).label}
                    </p>
                    {p.phone && (
                      <a href={`tel:${p.phone}`} className="block text-sm text-blue-600">
                        {p.phone}
                      </a>
                    )}
                    {p.phoneWork && (
                      <a href={`tel:${p.phoneWork}`} className="block text-sm text-blue-600">
                        {p.phoneWork} <span className="text-xs text-gray-400">(work)</span>
                      </a>
                    )}
                    {p.email && (
                      <a href={`mailto:${p.email}`} className="block text-sm text-blue-600 truncate">
                        {p.email}
                      </a>
                    )}
                    {p.sponsorName && (
                      <p className="text-xs text-gray-500">
                        Sponsor: <span className="text-gray-700">{p.sponsorName}</span>
                      </p>
                    )}
                  </div>
                </li>
              ))}
            </ul>

            {/* Desktop table */}
            <table className="hidden md:table w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Full Name</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Preferred Name</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Group</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    <span className="inline-flex items-center gap-0.5">
                      OCIA Profile
                      <span className="no-print">
                        <OciaProfileLegend />
                      </span>
                    </span>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Phone</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Work Phone</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Email</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Sponsor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {participants.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-900">
                      <div className="flex items-center gap-3">
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
                        <span>{p.fullName}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-500 italic text-xs">{p.preferredName ?? "—"}</td>
                    <td className="px-4 py-3 text-gray-600">{p.group === "ENGLISH" ? "English" : "Spanish"}</td>
                    <td className="px-4 py-3 text-gray-600">{deriveOciaLabel(p.sacramentalRecord).label}</td>
                    <td className="px-4 py-3 text-gray-600">
                      {p.phone ? <a href={`tel:${p.phone}`} className="hover:text-blue-600">{p.phone}</a> : <span className="text-gray-400">—</span>}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {p.phoneWork ? <a href={`tel:${p.phoneWork}`} className="hover:text-blue-600">{p.phoneWork}</a> : <span className="text-gray-400">—</span>}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {p.email ? <a href={`mailto:${p.email}`} className="hover:text-blue-600">{p.email}</a> : <span className="text-gray-400">—</span>}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{p.sponsorName ?? <span className="text-gray-400">—</span>}</td>
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
