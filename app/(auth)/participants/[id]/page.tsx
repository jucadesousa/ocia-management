import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/dal";
import { DeleteParticipantButton } from "./_components/delete-button";
import { deriveOciaLabel } from "@/lib/ocia-stage";
import { Breadcrumb } from "@/components/breadcrumb";
import type { OciaStage } from "@prisma/client";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
};

const stageLabel: Record<OciaStage, string> = {
  INQUIRY: "Inquiry", CATECHUMEN: "Catechumen", CANDIDATE: "Candidate",
  ELECT: "Elect", MYSTAGOGY: "Mystagogy", COMPLETED: "Completed",
};

function DetailRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="py-3 grid grid-cols-3 gap-4 border-b border-gray-100 last:border-0">
      <dt className="text-sm font-medium text-gray-500">{label}</dt>
      <dd className="text-sm text-gray-900 col-span-2">{value || <span className="text-gray-400">—</span>}</dd>
    </div>
  );
}

function BoolRow({ label, value }: { label: string; value?: boolean | null }) {
  const display = value === true ? "Yes" : value === false ? "No" : null;
  return <DetailRow label={label} value={display} />;
}

function SectionTitle({ title }: { title: string }) {
  return (
    <div className="pt-4 pb-1 px-4 first:pt-2">
      <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{title}</h3>
    </div>
  );
}

function fmt(date: Date | null | undefined, opts?: Intl.DateTimeFormatOptions) {
  if (!date) return null;
  return new Date(date).toLocaleDateString("en-US", opts ?? { year: "numeric", month: "long", day: "numeric" });
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2)
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return (name[0] ?? "?").toUpperCase();
}

export default async function ParticipantDetailPage({ params, searchParams }: Props) {
  const user = await requireAuth();
  const { id } = await params;
  const { tab = "profile" } = await searchParams;

  const participant = await prisma.participant.findUnique({
    where: { id },
    include: {
      sacramentalRecord: true,
      attendanceRecords: {
        include: { session: { select: { number: true, date: true, type: true } } },
        orderBy: { session: { date: "desc" } },
      },
    },
  });

  if (!participant) notFound();

  const tabs = [
    { key: "profile", label: "Profile" },
    { key: "sacramental", label: "Sacramental" },
    { key: "attendance", label: "Attendance" },
  ];

  const attended = participant.attendanceRecords.filter(
    (r) => r.status === "PRESENT"
  ).length;
  const total = participant.attendanceRecords.length;

  const sr = participant.sacramentalRecord;
  const ociaLabel = deriveOciaLabel(sr);

  const fullAddress = [
    participant.address,
    participant.city,
    participant.state && participant.zipCode
      ? `${participant.state} ${participant.zipCode}`
      : participant.state || participant.zipCode,
  ].filter(Boolean).join(", ") || null;

  return (
    <div className="p-6 space-y-6 max-w-3xl">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div className="flex items-start gap-4">
          {/* Avatar */}
          {participant.photoUrl ? (
            <img
              src={participant.photoUrl}
              alt={participant.fullName}
              className="w-16 h-16 rounded-full object-cover border border-gray-200 shrink-0 mt-1"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center text-xl font-semibold text-blue-700 shrink-0 mt-1 select-none">
              {initials(participant.fullName)}
            </div>
          )}
          <div>
            <div className="mb-1">
              <Breadcrumb crumbs={[
                { label: "Participants", href: "/participants" },
                { label: participant.fullName },
              ]} />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">{participant.fullName}</h1>
            {participant.preferredName && (
              <p className="text-sm text-gray-500 mt-0.5">Goes by: {participant.preferredName}</p>
            )}
            <div className="flex flex-wrap gap-2 mt-2">
              <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">
                {participant.group === "ENGLISH" ? "English" : "Spanish"}
              </span>
              <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full">
                {stageLabel[participant.ociaStage]}
              </span>
              <span className={`text-xs px-2 py-0.5 rounded-full ${ociaLabel.color}`}>
                {ociaLabel.label}
              </span>
              <span className={`text-xs px-2 py-0.5 rounded-full ${
                participant.status === "ACTIVE" ? "bg-green-100 text-green-700" :
                participant.status === "WITHDRAWN" ? "bg-red-100 text-red-700" :
                "bg-yellow-100 text-yellow-700"
              }`}>
                {participant.status.charAt(0) + participant.status.slice(1).toLowerCase()}
              </span>
            </div>
          </div>
        </div>
        {/* Action buttons — full width on mobile, auto width on desktop */}
        <div className="flex flex-wrap gap-2">
          <Link
            href={`/participants/${id}/print`}
            target="_blank"
            className="flex-1 sm:flex-none text-center text-sm font-medium text-gray-600 border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Print form
          </Link>
          {user.role === "ADMIN" && (
            <>
              <Link
                href={`/participants/${id}/edit`}
                className="flex-1 sm:flex-none text-center text-sm font-medium text-gray-600 border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Edit
              </Link>
              <DeleteParticipantButton id={id} name={participant.fullName} />
            </>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-1 -mb-px">
          {tabs.map(({ key, label }) => (
            <Link
              key={key}
              href={`/participants/${id}?tab=${key}`}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                tab === key
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              {label}
            </Link>
          ))}
        </nav>
      </div>

      {/* Profile tab */}
      {tab === "profile" && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <SectionTitle title="Identity" />
          <dl className="px-4">
            <DetailRow label="Full name" value={participant.fullName} />
            <DetailRow label="Maiden name" value={participant.maidenName} />
            <DetailRow label="Preferred name" value={participant.preferredName} />
            <DetailRow label="Date of birth" value={fmt(participant.dateOfBirth)} />
            <DetailRow label="Place of birth" value={participant.placeOfBirth} />
          </dl>

          <SectionTitle title="Contact" />
          <dl className="px-4">
            <DetailRow label="Phone" value={participant.phone} />
            <DetailRow label="Phone (work)" value={participant.phoneWork} />
            <DetailRow label="Email" value={participant.email} />
            <DetailRow label="Address" value={fullAddress} />
          </dl>

          <SectionTitle title="Family & Work" />
          <dl className="px-4">
            <DetailRow label="Spouse name" value={participant.spouseName} />
            <DetailRow label="Occupation" value={participant.occupation} />
            <DetailRow label="Marital status" value={participant.maritalStatus} />
            <DetailRow label="Current religion" value={participant.currentReligion} />
          </dl>

          <SectionTitle title="OCIA Placement" />
          <dl className="px-4">
            <DetailRow label="Group" value={participant.group === "ENGLISH" ? "English" : "Spanish"} />
            <DetailRow label="Stage" value={stageLabel[participant.ociaStage]} />
            <DetailRow label="OCIA Profile" value={ociaLabel.label} />
            <DetailRow label="Status" value={participant.status.charAt(0) + participant.status.slice(1).toLowerCase()} />
            <DetailRow label="Sponsor" value={participant.sponsorName} />
          </dl>

          <SectionTitle title="Admin" />
          <dl className="px-4">
            <DetailRow label="Interview date" value={fmt(participant.interviewDate)} />
            <DetailRow label="Notes" value={participant.notes} />
          </dl>
        </div>
      )}

      {/* Sacramental tab */}
      {tab === "sacramental" && (
        <div className="space-y-3">
          {user.role === "ADMIN" && (
            <div className="flex justify-end">
              <Link
                href={`/participants/${id}/sacramental/edit`}
                className="text-sm font-medium text-gray-600 border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Edit sacramental record
              </Link>
            </div>
          )}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {!sr ? (
            <div className="p-6 text-center text-gray-400 text-sm">
              No sacramental record on file.{user.role === "ADMIN" && (
                <span className="block mt-2">
                  Use the &ldquo;Edit sacramental record&rdquo; button above to add one.
                </span>
              )}
            </div>
          ) : (
            <>
              <SectionTitle title="Baptism" />
              <dl className="px-4">
                <BoolRow label="Baptized" value={sr.isBaptized} />
                <DetailRow label="Denomination / church" value={sr.baptismDenomination} />
                <DetailRow label="Baptism date" value={fmt(sr.baptismDate)} />
                <DetailRow label="Baptism parish" value={sr.baptismParish} />
                <DetailRow
                  label="Baptism proof"
                  value={
                    sr.baptismProofStatus === "CERTIFICATE" ? "Certificate" :
                    sr.baptismProofStatus === "LETTER"      ? "Letter from faith community" :
                    sr.baptismProofStatus === "OTHER"       ? "Other" :
                    null
                  }
                />
              </dl>

              <SectionTitle title="Other sacraments" />
              <dl className="px-4">
                <BoolRow label="First Communion" value={sr.hasFirstCommunion} />
                <BoolRow label="Confirmation" value={sr.hasConfirmation} />
              </dl>

              <SectionTitle title="Marriage" />
              <dl className="px-4">
                <DetailRow label="Marriage status" value={sr.marriageStatus} />
                <BoolRow label="Married to a Catholic" value={sr.marriedToCatholic} />
                <BoolRow label="Married by a Catholic priest" value={sr.marriedByCatholicPriest} />
                <BoolRow label="Had a prior marriage" value={sr.hadPriorMarriage} />
                <BoolRow label="Spouse had prior marriage" value={sr.spouseHadPriorMarriage} />
                <BoolRow label="Marriage cert received" value={sr.marriageCertReceived} />
                <DetailRow label="Annulment status" value={sr.annulmentStatus} />
              </dl>

              <SectionTitle title="Children" />
              <dl className="px-4">
                <BoolRow label="Has children" value={sr.hasChildren} />
                <DetailRow label="Children notes" value={sr.childrenNotes} />
              </dl>

              <SectionTitle title="OCIA Milestones" />
              <dl className="px-4">
                <DetailRow label="Rite of Acceptance" value={fmt(sr.riteOfAcceptanceDate)} />
                <DetailRow label="Election date" value={fmt(sr.electionDate)} />
                <DetailRow label="Easter Vigil date" value={fmt(sr.easterVigilDate)} />
                <DetailRow label="Completed" value={fmt(sr.completedAt)} />
              </dl>
            </>
          )}
        </div>
        </div>
      )}

      {/* Attendance tab */}
      {tab === "attendance" && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-sm text-gray-500">
              Attended <span className="font-semibold text-gray-900">{attended}</span> of{" "}
              <span className="font-semibold text-gray-900">{total}</span> sessions recorded
              {total > 0 && (
                <span className="ml-1 text-gray-500">
                  ({Math.round((attended / total) * 100)}%)
                </span>
              )}
            </p>
          </div>
          {participant.attendanceRecords.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">No attendance records yet.</p>
          ) : (
            <table className="w-full text-sm bg-white rounded-xl border border-gray-200 overflow-hidden">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {["Session", "Date", "Status"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {participant.attendanceRecords.map((r) => (
                  <tr key={r.id}>
                    <td className="px-4 py-3 text-gray-900">
                      {r.session.type === "WEEKLY" ? "Session" : "Reflection"} #{r.session.number}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {r.session.date
                        ? new Date(r.session.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                        : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                        r.status === "PRESENT" ? "bg-green-100 text-green-700" :
                        r.status === "EXCUSED" ? "bg-blue-100 text-blue-700" :
                        "bg-gray-100 text-gray-600"
                      }`}>
                        {r.status.charAt(0) + r.status.slice(1).toLowerCase().replace("_", " ")}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
