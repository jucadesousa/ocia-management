import type { BaptismType, Prisma } from "@prisma/client";

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

// Mirrors deriveOciaLabel()'s priority order as a Prisma filter, so list/report
// filtering by OCIA Profile stays in sync with how the label is computed for display.
export function ociaProfileWhere(key: string): Prisma.ParticipantWhereInput {
  const noMilestones = { completedAt: null, easterVigilDate: null, electionDate: null };

  switch (key) {
    case "completed":
      return { sacramentalRecord: { completedAt: { not: null } } };
    case "mystagogy":
      return { sacramentalRecord: { completedAt: null, easterVigilDate: { not: null } } };
    case "elect":
      return { sacramentalRecord: { completedAt: null, easterVigilDate: null, electionDate: { not: null } } };
    case "catechumen":
      return { sacramentalRecord: { ...noMilestones, baptismType: "NONE" } };
    case "candidate_unverified":
      return { sacramentalRecord: { ...noMilestones, baptismType: "OTHER_UNVERIFIED" } };
    case "candidate":
      return { sacramentalRecord: { ...noMilestones, baptismType: "OTHER_VALID" } };
    case "candidate_for_sacraments":
      return {
        sacramentalRecord: {
          ...noMilestones,
          baptismType: "CATHOLIC",
          OR: [{ hasFirstCommunion: false }, { hasFirstCommunion: null }],
        },
      };
    case "candidate_for_confirmation":
      return {
        sacramentalRecord: {
          ...noMilestones,
          baptismType: "CATHOLIC",
          hasFirstCommunion: true,
          OR: [{ hasConfirmation: false }, { hasConfirmation: null }],
        },
      };
    case "fully_initiated":
      return {
        sacramentalRecord: {
          ...noMilestones,
          baptismType: "CATHOLIC",
          hasFirstCommunion: true,
          hasConfirmation: true,
        },
      };
    case "unknown":
      return { sacramentalRecord: null };
    default:
      return {};
  }
}

// Human-readable labels for the BaptismType enum (used in forms/display)
export const BAPTISM_TYPE_LABELS: Record<BaptismType, string> = {
  NONE:              "Not baptized",
  CATHOLIC:          "Catholic",
  OTHER_VALID:       "Other Christian (trinitarian — valid)",
  OTHER_UNVERIFIED:  "Other Christian (trinitarian — unverified)",
};
