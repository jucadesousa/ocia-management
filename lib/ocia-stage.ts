import type { BaptismType } from "@prisma/client";

type SacramentalSnapshot = {
  baptismType: BaptismType | null;
  hasFirstCommunion: boolean | null;
  hasConfirmation: boolean | null;
};

export type OciaLabel = {
  label: string;
  color: string;
};

const LABELS: Record<string, OciaLabel> = {
  catechumen:                  { label: "Catechumen",                    color: "bg-purple-100 text-purple-700" },
  candidate_unverified:        { label: "Candidate (Baptism Unverified)", color: "bg-yellow-100 text-yellow-700" },
  candidate:                   { label: "Candidate",                     color: "bg-blue-100 text-blue-700" },
  candidate_for_sacraments:    { label: "Candidate for Sacraments",      color: "bg-orange-100 text-orange-700" },
  candidate_for_confirmation:  { label: "Catholic Candidate",            color: "bg-teal-100 text-teal-700" },
  fully_initiated:             { label: "Fully Initiated",               color: "bg-green-100 text-green-700" },
  unknown:                     { label: "Unknown",                       color: "bg-gray-100 text-gray-500" },
};

export function deriveOciaLabel(s: SacramentalSnapshot | null | undefined): OciaLabel {
  if (!s) return LABELS.unknown;

  const bt = s.baptismType ?? "NONE";

  if (bt === "NONE") return LABELS.catechumen;
  if (bt === "OTHER_UNVERIFIED") return LABELS.candidate_unverified;
  if (bt === "OTHER_VALID") return LABELS.candidate;

  // CATHOLIC
  if (!s.hasFirstCommunion) return LABELS.candidate_for_sacraments;
  if (!s.hasConfirmation) return LABELS.candidate_for_confirmation;
  return LABELS.fully_initiated;
}

// Human-readable labels for the BaptismType enum (used in forms/display)
export const BAPTISM_TYPE_LABELS: Record<BaptismType, string> = {
  NONE:              "Not baptized",
  CATHOLIC:          "Catholic",
  OTHER_VALID:       "Other Christian (trinitarian — valid)",
  OTHER_UNVERIFIED:  "Other Christian (trinitarian — unverified)",
};
