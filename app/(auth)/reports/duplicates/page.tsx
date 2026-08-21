import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/dal";
import { ExcelExportButton } from "../_components/excel-export-button";
import { Breadcrumb } from "@/components/breadcrumb";
import { deriveOciaLabel } from "@/lib/ocia-stage";
import type { Group, ParticipantStatus } from "@prisma/client";

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2)
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return (name[0] ?? "?").toUpperCase();
}

function normalizeEmail(email: string | null): string | null {
  if (!email) return null;
  const v = email.trim().toLowerCase();
  return v || null;
}

function normalizePhone(phone: string | null): string | null {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 7) return null; // too short to be a reliable match
  return digits.slice(-10);
}

function normalizeName(first: string, last: string): string {
  const clean = (s: string) =>
    s
      .normalize("NFD")
      .replace(/\p{Diacritic}/gu, "")
      .trim()
      .toLowerCase();
  const name = `${clean(first)} ${clean(last)}`.trim();
  return name;
}

const statusBadge: Record<ParticipantStatus, string> = {
  ACTIVE: "bg-green-100 text-green-700",
  INACTIVE: "bg-yellow-100 text-yellow-700",
  WITHDRAWN: "bg-red-100 text-red-700",
};

const matchReasonLabel: Record<"email" | "phone" | "name", string> = {
  email: "Same email",
  phone: "Same phone",
  name: "Same name",
};

const matchReasonOrder: ("email" | "phone" | "name")[] = ["email", "phone", "name"];

export default async function DuplicateParticipantsReportPage() {
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
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      fullName: true,
      preferredName: true,
      photoUrl: true,
      email: true,
      phone: true,
      phoneWork: true,
      address: true,
      city: true,
      dateOfBirth: true,
      sponsorName: true,
      notes: true,
      interviewDate: true,
      spouseName: true,
      occupation: true,
      currentReligion: true,
      maritalStatus: true,
      group: true,
      status: true,
      createdAt: true,
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
      attendanceRecords: {
        where: { status: "PRESENT", session: { status: "COMPLETED" } },
        select: { id: true },
      },
    },
  });

  const completedSessions = await prisma.session.count({
    where: { cycleId: cycle.id, status: "COMPLETED" },
  });

  // ── Group participants that share an email, phone number, or full name ──
  // Union-find over participant ids, linked whenever a normalized key matches.
  const parent = new Map<string, string>();
  function find(x: string): string {
    let root = x;
    while (parent.get(root) !== root) root = parent.get(root) ?? root;
    let cur = x;
    while (parent.get(cur) !== root) {
      const next = parent.get(cur)!;
      parent.set(cur, root);
      cur = next;
    }
    return root;
  }
  function union(a: string, b: string) {
    const ra = find(a);
    const rb = find(b);
    if (ra !== rb) parent.set(ra, rb);
  }

  for (const p of participants) parent.set(p.id, p.id);

  const reasonsByParticipant = new Map<string, Set<"email" | "phone" | "name">>();
  function recordReason(ids: string[], reason: "email" | "phone" | "name") {
    if (ids.length < 2) return;
    for (let i = 1; i < ids.length; i++) union(ids[0], ids[i]);
    for (const id of ids) {
      if (!reasonsByParticipant.has(id)) reasonsByParticipant.set(id, new Set());
      reasonsByParticipant.get(id)!.add(reason);
    }
  }

  const emailMap = new Map<string, string[]>();
  const phoneMap = new Map<string, string[]>();
  const nameMap = new Map<string, string[]>();

  for (const p of participants) {
    const email = normalizeEmail(p.email);
    if (email) emailMap.set(email, [...(emailMap.get(email) ?? []), p.id]);

    for (const raw of [p.phone, p.phoneWork]) {
      const ph = normalizePhone(raw);
      if (ph) phoneMap.set(ph, [...(phoneMap.get(ph) ?? []), p.id]);
    }

    const name = normalizeName(p.firstName, p.lastName);
    if (name.length > 2) nameMap.set(name, [...(nameMap.get(name) ?? []), p.id]);
  }

  for (const ids of emailMap.values()) recordReason([...new Set(ids)], "email");
  for (const ids of phoneMap.values()) recordReason([...new Set(ids)], "phone");
  for (const ids of nameMap.values()) recordReason([...new Set(ids)], "name");

  const clusterMap = new Map<string, typeof participants>();
  for (const p of participants) {
    const root = find(p.id);
    if (!clusterMap.has(root)) clusterMap.set(root, []);
    clusterMap.get(root)!.push(p);
  }

  const optionalFieldsFilled = (p: (typeof participants)[number]) =>
    [
      p.photoUrl,
      p.phone,
      p.phoneWork,
      p.email,
      p.address,
      p.city,
      p.dateOfBirth,
      p.sponsorName,
      p.notes,
      p.interviewDate,
      p.spouseName,
      p.occupation,
      p.currentReligion,
      p.maritalStatus,
      p.sacramentalRecord,
    ].filter(Boolean).length;

  const clusters = [...clusterMap.values()]
    .filter((group) => group.length >= 2)
    .map((group) => {
      const withMeta = group.map((p) => ({
        ...p,
        attended: p.attendanceRecords.length,
        completeness: optionalFieldsFilled(p),
        reasons: reasonsByParticipant.get(p.id) ?? new Set<"email" | "phone" | "name">(),
      }));
      // Suggested keep: most attendance, then most complete profile, then earliest registered
      const sorted = [...withMeta].sort((a, b) => {
        if (b.attended !== a.attended) return b.attended - a.attended;
        if (b.completeness !== a.completeness) return b.completeness - a.completeness;
        return a.createdAt.getTime() - b.createdAt.getTime();
      });
      const clusterReasons = new Set<"email" | "phone" | "name">();
      for (const p of withMeta) for (const r of p.reasons) clusterReasons.add(r);
      return {
        key: group[0].id,
        members: sorted,
        suggestedKeepId: sorted[0].id,
        reasons: clusterReasons,
      };
    })
    .sort((a, b) => b.members.length - a.members.length || a.members[0].fullName.localeCompare(b.members[0].fullName));

  const exportData = clusters.flatMap((cluster, i) =>
    cluster.members.map((p) => ({
      Group: i + 1,
      "Suggested Keep": p.id === cluster.suggestedKeepId ? "Yes" : "",
      "Matched By": [...cluster.reasons].map((r) => matchReasonLabel[r]).join(", "),
      Name: p.fullName,
      Email: p.email ?? "",
      Phone: p.phone ?? "",
      "Work Phone": p.phoneWork ?? "",
      "Language Group": p.group === "ENGLISH" ? "English" : "Spanish",
      Status: p.status,
      "OCIA Profile": deriveOciaLabel(p.sacramentalRecord).label,
      Registered: p.createdAt.toISOString().slice(0, 10),
      "Attendance (of completed sessions)": completedSessions > 0 ? `${p.attended}/${completedSessions}` : "",
    }))
  );

  return (
    <div className="p-6 space-y-4">
      <Breadcrumb crumbs={[{ label: "Reports", href: "/reports" }, { label: "Duplicate Participants" }]} />

      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Duplicate Participants</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {cycle.name} · {clusters.length} possible duplicate group
            {clusters.length !== 1 ? "s" : ""}
          </p>
        </div>

        {clusters.length > 0 && (
          <ExcelExportButton
            data={exportData}
            filename="duplicate-participants.xlsx"
            sheetName="Duplicates"
            className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Export to Excel
          </ExcelExportButton>
        )}
      </div>

      <p className="text-sm text-gray-500 max-w-3xl">
        Participants in this cycle are grouped together when they share the same email, the
        same phone number, or the same first and last name. Review each group below and
        decide which record to keep — the highlighted one has the most attendance and the
        most complete profile, but always confirm before removing a duplicate.
      </p>

      {clusters.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-400 text-sm">
          No potential duplicates found in {cycle.name}.
        </div>
      ) : (
        <div className="space-y-4">
          {clusters.map((cluster, i) => (
            <div key={cluster.key} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between flex-wrap gap-2">
                <span className="text-sm font-semibold text-gray-700">
                  Group {i + 1} · {cluster.members.length} records
                </span>
                <div className="flex items-center gap-1.5">
                  {matchReasonOrder
                    .filter((r) => cluster.reasons.has(r))
                    .map((r) => (
                      <span key={r} className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">
                        {matchReasonLabel[r]}
                      </span>
                    ))}
                </div>
              </div>

              {/* Mobile cards */}
              <ul className="md:hidden divide-y divide-gray-100">
                {cluster.members.map((p) => (
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
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <Link href={`/participants/${p.id}`} className="text-sm font-medium text-gray-900 hover:text-blue-600 truncate">
                          {p.fullName}
                        </Link>
                        {p.id === cluster.suggestedKeepId && (
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                            Suggested keep
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500">
                        {p.group === "ENGLISH" ? "English" : "Spanish"} · {deriveOciaLabel(p.sacramentalRecord).label}
                      </p>
                      <p className="text-xs text-gray-500">
                        {p.email ?? "—"} · {p.phone ?? "—"}
                      </p>
                      <p className="text-xs text-gray-400">
                        Registered {p.createdAt.toLocaleDateString("en-US")}
                        {completedSessions > 0 && ` · Attended ${p.attended}/${completedSessions}`}
                      </p>
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${statusBadge[p.status]}`}>
                        {p.status.charAt(0) + p.status.slice(1).toLowerCase()}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>

              {/* Desktop table */}
              <table className="hidden md:table w-full text-sm">
                <thead className="bg-white border-b border-gray-200">
                  <tr>
                    {["Name", "Email", "Phone", "Group", "Status", "OCIA Profile", "Registered", "Attendance"].map((h) => (
                      <th key={h} className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {cluster.members.map((p) => (
                    <tr
                      key={p.id}
                      className={`hover:bg-gray-50 transition-colors ${p.id === cluster.suggestedKeepId ? "bg-green-50/50" : ""}`}
                    >
                      <td className="px-4 py-3 font-medium text-gray-900">
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
                            <span className="group-hover:text-blue-600">{p.fullName}</span>
                            {p.preferredName && (
                              <span className="ml-1 text-xs text-gray-400">({p.preferredName})</span>
                            )}
                            {p.id === cluster.suggestedKeepId && (
                              <span className="block text-xs text-green-700 font-medium">Suggested keep</span>
                            )}
                          </div>
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{p.email ?? <span className="text-gray-400">—</span>}</td>
                      <td className="px-4 py-3 text-gray-600">{p.phone ?? <span className="text-gray-400">—</span>}</td>
                      <td className="px-4 py-3 text-gray-600">{p.group === "ENGLISH" ? "English" : "Spanish"}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${statusBadge[p.status]}`}>
                          {p.status.charAt(0) + p.status.slice(1).toLowerCase()}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{deriveOciaLabel(p.sacramentalRecord).label}</td>
                      <td className="px-4 py-3 text-gray-600">{p.createdAt.toLocaleDateString("en-US")}</td>
                      <td className="px-4 py-3 text-gray-600">
                        {completedSessions > 0 ? `${p.attended}/${completedSessions}` : <span className="text-gray-400">—</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
