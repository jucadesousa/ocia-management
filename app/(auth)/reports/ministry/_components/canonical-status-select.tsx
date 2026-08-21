"use client";
import { updateCanonicalReviewStatus } from "@/app/actions/sacramental";

const STATUS_LABELS: Record<string, string> = {
  NOT_REVIEWED: "Not reviewed",
  REFERRED_TO_DEACON: "Referred to deacon",
  CONVALIDATION_SCHEDULED: "Convalidation scheduled",
  RESOLVED: "Resolved",
};

export function CanonicalStatusSelect({
  participantId,
  status,
  className = "",
}: {
  participantId: string;
  status: string;
  className?: string;
}) {
  return (
    <form action={updateCanonicalReviewStatus.bind(null, participantId)} className={className}>
      <select
        name="canonicalReviewStatus"
        defaultValue={status}
        onChange={(e) => {
          const form = e.currentTarget.closest("form") as HTMLFormElement;
          form?.requestSubmit();
        }}
        className="text-xs border border-gray-300 rounded-lg px-2 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        {Object.entries(STATUS_LABELS).map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>
    </form>
  );
}
