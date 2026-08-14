import type { BaptismType } from "@prisma/client";

type SacramentalSnapshot = {
  baptismType: BaptismType | null;
  hasFirstCommunion: boolean | null;
  hasConfirmation: boolean | null;
  electionDate?: Date | null;
  easterVigilDate?: Date | null;
  completedAt?: Date | null;
};

export type OciaLabel = {
  key: string;
  label: string;
  color: string;
};

export const OCIA_LABELS: Record<string, OciaLabel> = {
  catechumen:                  { key: "catechumen",                  label: "Catechumen",                    color: "bg-purple-100 text-purple-700" },
  candidate_unverified:        { key: "candidate_unverified",        label: "Candidate (Baptism Unverified)", color: "bg-yellow-100 text-yellow-700" },
  candidate:                   { key: "candidate",                   label: "Candidate",                     color: "bg-blue-100 text-blue-700" },
  candidate_for_sacraments:    { key: "candidate_for_sacraments",    label: "Candidate for Sacraments",      color: "bg-orange-100 text-orange-700" },
  candidate_for_confirmation:  { key: "candidate_for_confirmation",  label: "Catholic Candidate",            color: "bg-teal-100 text-teal-700" },
  elect:                       { key: "elect",                       label: "Elect",                         color: "bg-indigo-100 text-indigo-700" },
  mystagogy:                   { key: "mystagogy",                   label: "Mystagogy",                     color: "bg-pink-100 text-pink-700" },
  completed:                   { key: "completed",                   label: "Completed",                     color: "bg-emerald-100 text-emerald-700" },
  fully_initiated:             { key: "fully_initiated",             label: "Fully Initiated",               color: "bg-green-100 text-green-700" },
  unknown:                     { key: "unknown",                     label: "Unknown",                       color: "bg-gray-100 text-gray-500" },
};

export const OCIA_LABEL_ORDER = [
  "unknown",
  "catechumen",
  "candidate_unverified",
  "candidate",
  "candidate_for_sacraments",
  "candidate_for_confirmation",
  "elect",
  "mystagogy",
  "completed",
  "fully_initiated",
] as const;

export function deriveOciaLabel(s: SacramentalSnapshot | null | undefined): OciaLabel {
  if (!s) return OCIA_LABELS.unknown;

  if (s.completedAt) return OCIA_LABELS.completed;
  if (s.easterVigilDate) return OCIA_LABELS.mystagogy;
  if (s.electionDate) return OCIA_LABELS.elect;

  const bt = s.baptismType ?? "NONE";

  if (bt === "NONE") return OCIA_LABELS.catechumen;
  if (bt === "OTHER_UNVERIFIED") return OCIA_LABELS.candidate_unverified;
  if (bt === "OTHER_VALID") return OCIA_LABELS.candidate;

  // CATHOLIC
  if (!s.hasFirstCommunion) return OCIA_LABELS.candidate_for_sacraments;
  if (!s.hasConfirmation) return OCIA_LABELS.candidate_for_confirmation;
  return OCIA_LABELS.fully_initiated;
}

// Human-readable labels for the BaptismType enum (used in forms/display)
export const BAPTISM_TYPE_LABELS: Record<BaptismType, string> = {
  NONE:              "Not baptized",
  CATHOLIC:          "Catholic",
  OTHER_VALID:       "Other Christian (trinitarian — valid)",
  OTHER_UNVERIFIED:  "Other Christian (trinitarian — unverified)",
};
