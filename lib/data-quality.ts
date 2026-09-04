// Flags data that's missing or internally inconsistent — signs of a
// data-entry slip or an incomplete intake rather than a pastoral concern.
// This is distinct from the Ministry Overview "Missing Documents" check,
// which tracks proof (e.g. a baptism certificate) for facts we already know;
// this file tracks whether we know the fact at all. Unlike canonical-status.ts,
// a participant can carry more than one issue at once, and the list is
// self-healing: fixing the field removes the flag on the next read, with no
// persisted review state.

export type DataQualityIssue = {
  ruleId: string;
  label: string;
  detail: string;
};

type ParticipantFields = {
  maritalStatus: string | null;
};

type RecordFields = {
  marriageStatus: string | null;
  marriedToCatholic: boolean | null;
  marriedByCatholicPriest: boolean | null;
  hadPriorMarriage: boolean | null;
  spouseHadPriorMarriage: boolean | null;
  annulmentStatus: string | null;
  marriageCertReceived: boolean;
  isBaptized: boolean | null;
  baptismType: string;
};

export function evaluateDataQualityIssues(
  participant: ParticipantFields,
  rec: RecordFields | null
): DataQualityIssue[] {
  const issues: DataQualityIssue[] = [];

  if (!rec || rec.isBaptized === null) {
    issues.push({
      ruleId: "baptism-status-unknown",
      label: "Baptism status unknown",
      detail: "Whether this participant has been baptized has not been recorded.",
    });
  }

  if (!participant.maritalStatus) {
    issues.push({
      ruleId: "marital-status-unknown",
      label: "Marital status unknown",
      detail: "Marital or cohabitation status has not been recorded for this participant.",
    });
  }

  if (!rec) return issues;

  if (
    participant.maritalStatus &&
    rec.marriageStatus &&
    participant.maritalStatus !== rec.marriageStatus
  ) {
    issues.push({
      ruleId: "marital-status-mismatch",
      label: "Marital status mismatch",
      detail: `Participant record says "${participant.maritalStatus}"; sacramental record says "${rec.marriageStatus}".`,
    });
  }

  if (
    rec.marriageStatus &&
    rec.marriageStatus !== "Married" &&
    (rec.marriedToCatholic !== null || rec.marriedByCatholicPriest !== null)
  ) {
    issues.push({
      ruleId: "marriage-detail-without-married-status",
      label: `Marriage details without "Married" status`,
      detail: `Marriage status is "${rec.marriageStatus}", but marriage-to-a-Catholic details are filled in.`,
    });
  }

  if (rec.isBaptized === false && rec.baptismType !== "NONE") {
    issues.push({
      ruleId: "baptism-type-mismatch",
      label: "Baptism status mismatch",
      detail: `Marked as not baptized, but baptism type is "${rec.baptismType}".`,
    });
  } else if (rec.isBaptized === true && rec.baptismType === "NONE") {
    issues.push({
      ruleId: "baptism-type-mismatch",
      label: "Baptism status mismatch",
      detail: `Marked as baptized, but no baptism type has been recorded.`,
    });
  }

  if (
    rec.annulmentStatus &&
    rec.annulmentStatus !== "None" &&
    rec.hadPriorMarriage !== true &&
    rec.spouseHadPriorMarriage !== true
  ) {
    issues.push({
      ruleId: "annulment-without-prior-marriage",
      label: "Annulment status without a prior marriage",
      detail: `Annulment status is "${rec.annulmentStatus}", but no prior marriage is recorded for either spouse.`,
    });
  }

  if (rec.marriageCertReceived && rec.marriageStatus === "Single") {
    issues.push({
      ruleId: "marriage-cert-without-marriage",
      label: "Marriage certificate without a marriage",
      detail: `A marriage certificate is on file, but marital status is "Single".`,
    });
  }

  return issues;
}
