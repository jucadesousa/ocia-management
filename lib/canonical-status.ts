// Flags OCIA participants whose marital situation may be canonically
// irregular, based on the sacramental fields already captured for them.
// Tiers are ordered by severity; only the highest-severity match is returned.

export type CanonicalFlag = {
  tier: 1 | 2 | 3;
  label: string;
  reason: string;
};

type MarriageFields = {
  marriageStatus: string | null;
  marriedToCatholic: boolean | null;
  marriedByCatholicPriest: boolean | null;
  hadPriorMarriage: boolean | null;
  spouseHadPriorMarriage: boolean | null;
  annulmentStatus: string | null;
};

export function evaluateCanonicalFlag(
  rec: MarriageFields | null
): CanonicalFlag | null {
  if (!rec || rec.marriageStatus !== "Married") return null;

  const priorBondUnresolved =
    (rec.hadPriorMarriage === true || rec.spouseHadPriorMarriage === true) &&
    rec.annulmentStatus !== "Granted";

  if (priorBondUnresolved) {
    return {
      tier: 1,
      label: "Prior bond not resolved",
      reason:
        "A prior marriage exists with no granted annulment — the current marriage may not be valid until that bond is resolved.",
    };
  }

  if (rec.marriedToCatholic === true && rec.marriedByCatholicPriest === false) {
    return {
      tier: 2,
      label: "Married outside canonical form",
      reason:
        "Married to a Catholic but not witnessed by a priest or deacon — likely needs a convalidation.",
    };
  }

  if (rec.marriedByCatholicPriest === null) {
    return {
      tier: 3,
      label: "Marriage form not documented",
      reason: "Whether the marriage was witnessed by a priest or deacon is unknown — needs a follow-up interview.",
    };
  }

  return null;
}
