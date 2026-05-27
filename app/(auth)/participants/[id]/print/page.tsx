import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/dal";
import { PrintButton } from "./_components/print-button";
import type { OciaStage } from "@prisma/client";

type Props = { params: Promise<{ id: string }> };

const stageLabel: Record<OciaStage, string> = {
  INQUIRY: "Inquiry", CATECHUMEN: "Catechumen", CANDIDATE: "Candidate",
  ELECT: "Elect", MYSTAGOGY: "Mystagogy", COMPLETED: "Completed",
};

function fmtDate(date: Date | null | undefined): string {
  if (!date) return "";
  return new Date(date).toLocaleDateString("en-US", { month: "2-digit", day: "2-digit", year: "numeric" });
}

function Field({ value, className = "" }: { value?: string | null; className?: string }) {
  return (
    <div className={`border-b border-black pb-px text-sm min-h-[1.25rem] ${className}`}>
      {value ?? ""}
    </div>
  );
}

function LabeledField({
  label,
  value,
  className = "",
  labelClassName = "",
}: {
  label: string;
  value?: string | null;
  className?: string;
  labelClassName?: string;
}) {
  return (
    <div className={`flex items-end gap-1 ${className}`}>
      <span className={`text-sm whitespace-nowrap shrink-0 ${labelClassName}`}>{label}</span>
      <Field value={value} className="flex-1 min-w-0" />
    </div>
  );
}

function YesNo({ value }: { value: boolean | null | undefined }) {
  return (
    <span className="text-sm">
      <span className="mr-4">
        <span className="mr-1">{value === true ? "☑" : "☐"}</span>Yes
      </span>
      <span>
        <span className="mr-1">{value === false ? "☑" : "☐"}</span>No
      </span>
    </span>
  );
}

function Checkbox({ checked, label }: { checked: boolean; label: string }) {
  return (
    <span className="mr-5 text-sm">
      <span className="mr-1">{checked ? "☑" : "☐"}</span>
      {label}
    </span>
  );
}

export default async function PrintPage({ params }: Props) {
  await requireAuth();
  const { id } = await params;

  const participant = await prisma.participant.findUnique({
    where: { id },
    include: {
      sacramentalRecord: true,
      cycle: true,
    },
  });

  if (!participant) notFound();

  const sr = participant.sacramentalRecord;
  const cycle = participant.cycle;
  const yearRange = `${cycle.year - 1} - ${cycle.year}`;
  const today = new Date().toLocaleDateString("en-US", {
    month: "2-digit", day: "2-digit", year: "numeric",
  });

  const participantStatus =
    participant.status !== "ACTIVE"
      ? participant.status.charAt(0) + participant.status.slice(1).toLowerCase()
      : stageLabel[participant.ociaStage];

  const baptismProof =
    sr?.baptismProofStatus === "CERTIFICATE" ? "Certificate" :
    sr?.baptismProofStatus === "LETTER"      ? "Letter"      :
    sr?.baptismProofStatus === "OTHER"       ? "Other"       : "";

  const marriageCase =
    sr?.annulmentStatus && sr.annulmentStatus !== "None" ? sr.annulmentStatus : "";

  return (
    <>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          nav { display: none !important; }
          main { padding-top: 0 !important; overflow: visible !important; background: white !important; }
          .print-page-wrapper { background: white !important; padding: 0 !important; min-height: unset !important; }
          .print-form { box-shadow: none !important; max-width: 100% !important; padding: 0 !important; }
          @page { size: letter; margin: 0.6in; }
        }
      `}</style>

      {/* Toolbar */}
      <div className="no-print flex items-center gap-3 px-4 py-3 bg-white border-b border-gray-200 sticky top-0 z-10">
        <Link
          href={`/participants/${id}`}
          className="text-sm text-gray-600 hover:text-blue-600"
        >
          ← Back to {participant.fullName}
        </Link>
        <div className="ml-auto">
          <PrintButton />
        </div>
      </div>

      {/* Page background */}
      <div className="print-page-wrapper bg-gray-100 min-h-screen p-8 flex justify-center">

        {/* Letter-sized form */}
        <div className="print-form bg-white w-full max-w-[816px] px-14 py-10 shadow font-sans text-black text-sm leading-snug">

          {/* ── Top header ── */}
          <div className="flex justify-between items-start mb-1">
            <div className="text-sm">
              <p>Information Form</p>
              <p>{yearRange}</p>
            </div>
            <div className="text-sm text-right space-y-0.5">
              <div className="flex items-end justify-end gap-1">
                <span className="whitespace-nowrap">Status of Participant:</span>
                <Field value={participantStatus} className="w-32 text-left" />
              </div>
              <div className="flex items-end justify-end gap-1">
                <span className="whitespace-nowrap">Baptismal Certificate:</span>
                <Field value={baptismProof} className="w-32 text-left" />
              </div>
              <div className="flex items-end justify-end gap-1">
                <span className="whitespace-nowrap">Marriage Case:</span>
                <Field value={marriageCase} className="w-40 text-left" />
              </div>
            </div>
          </div>

          <div className="flex justify-between items-end mb-5">
            <div className="flex items-end gap-1">
              <span className="font-bold whitespace-nowrap">Today&apos;s Date</span>
              <Field value={today} className="w-28" />
            </div>
            <div className="flex items-end gap-1">
              <span className="whitespace-nowrap">Date of Interview:</span>
              <Field value={fmtDate(participant.interviewDate)} className="w-32" />
            </div>
          </div>

          {/* ── Church header ── */}
          <div className="flex items-center gap-4 mb-5">
            {/* Passport-style photo box */}
            <div className="shrink-0 w-[72px] h-[90px] border border-black overflow-hidden">
              {participant.photoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={participant.photoUrl} alt={participant.fullName} className="w-full h-full object-cover" />
              ) : null}
            </div>
            <div className="flex-1 text-center">
              <p className="italic text-sm">St. Bartholomew the Apostle Catholic Church</p>
              <p className="text-[1.6rem] font-bold tracking-tight mt-0.5">
                <span className="text-[2rem]">O</span>rder of{" "}
                <span className="text-[2rem]">C</span>hristian{" "}
                <span className="text-[2rem]">I</span>nitiation of{" "}
                <span className="text-[2rem]">A</span>dults
              </p>
            </div>
            {/* Spacer to keep title visually centred */}
            <div className="shrink-0 w-[72px]" />
          </div>

          {/* ── PERSONAL INFORMATION ── */}
          <div className="mb-4">
            <h2 className="font-bold text-sm mb-3">PERSONAL INFORMATION</h2>

            {/* Last / First / Maiden */}
            <div className="flex gap-5 mb-3">
              <LabeledField label="Last Name" value={participant.lastName} className="flex-[3]" />
              <LabeledField label="First" value={participant.firstName} className="flex-[2]" />
              <LabeledField label="Maiden" value={participant.maidenName} className="flex-[2]" />
            </div>

            {/* Address */}
            <div className="flex gap-5 mb-3">
              <LabeledField label="Address" value={participant.address} className="flex-[3]" />
              <LabeledField label="City" value={participant.city} className="flex-[2]" />
              <LabeledField label="State" value={participant.state} className="w-16" />
              <LabeledField label="Zip" value={participant.zipCode} className="w-20" />
            </div>

            {/* Phone / Spouse */}
            <div className="flex gap-5 mb-3">
              <LabeledField label="Phone" value={participant.phone} className="flex-1" />
              <LabeledField label="Phone (W)" value={participant.phoneWork} className="flex-1" />
              <LabeledField label="Spouse (Name)" value={participant.spouseName} className="flex-[2]" />
            </div>

            {/* Email */}
            <LabeledField label="Email" value={participant.email} className="mb-3" />

            {/* DOB / Place of Birth */}
            <div className="flex gap-5 mb-1">
              <LabeledField label="Date of Birth" value={fmtDate(participant.dateOfBirth)} className="flex-1" />
              <LabeledField label="Place of Birth" value={participant.placeOfBirth} className="flex-[3]" />
            </div>
          </div>

          {/* ── RELIGIOUS AFFILIATION ── */}
          <div className="mb-4">
            <h2 className="font-bold text-sm mb-3">RELIGIOUS AFFILIATION</h2>

            <div className="flex items-center gap-3 mb-2">
              <span>Have you been baptized?</span>
              <YesNo value={sr?.isBaptized} />
            </div>

            <LabeledField
              label="If yes, in what denomination or church?"
              value={sr?.baptismDenomination}
              className="mb-2"
            />
            <LabeledField
              label="Religious Affiliation Now"
              value={participant.currentReligion}
            />
          </div>

          {/* ── MARITAL STATUS ── */}
          <div className="mb-4">
            <h2 className="font-bold text-sm mb-3">MARITAL STATUS</h2>

            <div className="mb-2">
              <Checkbox checked={participant.maritalStatus === "Married"}   label="Married"   />
              <Checkbox checked={participant.maritalStatus === "Single"}    label="Single"    />
              <Checkbox checked={participant.maritalStatus === "Separated"} label="Separated" />
              <Checkbox checked={participant.maritalStatus === "Divorced"}  label="Divorced"  />
              <Checkbox checked={participant.maritalStatus === "Widowed"}   label="Widowed"   />
            </div>

            <div className="ml-4 space-y-1.5 mb-3">
              <p className="italic text-sm">If married:</p>
              <div className="flex items-center gap-3">
                <span>Are you married to a Catholic?</span>
                <YesNo value={sr?.marriedToCatholic} />
              </div>
              <div className="flex items-center gap-3">
                <span>Were you married by a Catholic Priest or Deacon?</span>
                <YesNo value={sr?.marriedByCatholicPriest} />
              </div>
              <div className="flex items-center gap-3">
                <span>Were you ever married prior to the present marriage?</span>
                <YesNo value={sr?.hadPriorMarriage} />
              </div>
              <div className="flex items-center gap-3">
                <span>Was your spouse ever married prior to the present marriage?</span>
                <YesNo value={sr?.spouseHadPriorMarriage} />
              </div>
              <div className="flex items-center gap-3">
                <span>Do you have children?</span>
                <YesNo value={sr?.hasChildren} />
              </div>
            </div>

            <LabeledField label="List Names and Ages" value={sr?.childrenNotes} />
          </div>

          {/* ── ADDITIONAL COMMENTS ── */}
          <div className="border-t-2 border-black pt-2 mt-5">
            <h2 className="font-bold text-sm mb-2">
              ADDITIONAL COMMENTS{" "}
              <span className="font-normal">(Note: Continue next page)</span>
            </h2>
            <div className="min-h-[4rem] text-sm">
              {participant.notes ?? ""}
            </div>
          </div>

          {/* ── Footer ── */}
          <div className="border-t border-black mt-6 pt-1">
            <p className="text-xs">OCIA Rev Num: 08.18.2026</p>
          </div>

        </div>
      </div>
    </>
  );
}
