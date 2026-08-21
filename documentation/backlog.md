# OCIA Management — Backlog & Future Improvements

Items discussed but not yet implemented. Prioritize before picking up.

---

## Session Date-Based Ordering

**Context:** Sessions are currently sorted by `type` then `number`. Sessions were bulk-created at the start of the cycle with sequential numbers. When sessions need to be cancelled (e.g. Christmas/New Year break) and makeup sessions added later, the new sessions receive high numbers (e.g. 31) and appear at the end of the attendance grid — even if their actual date places them mid-cycle.

**Proposed solution:**
- Sort sessions by `date` when a date is set, falling back to `number`.
- Change the attendance grid column headers to show the session date (e.g. "Sep 5") instead of the session number, so chronological order is always clear regardless of how sessions were numbered.
- Cancelled sessions already disappear from the grid; this change makes makeup sessions slot in correctly by date.

**Schema impact:** None — the `date DateTime?` field already exists on `Session`. This is a sorting and display change only.

**Files likely affected:**
- `app/(auth)/reports/attendance/page.tsx` — grid sort order and column header label
- `app/(auth)/attendance/page.tsx` — attendance roster sort order
- `app/(auth)/attendance/_components/session-selector.tsx` — session dropdown display

---

## OCIA Profile — Per-Label Tooltip (Option C)

**Context:** When implementing the OCIA Profile column on the participants list, the user preferred Option C (tooltip on each label showing its definition + info icon on the column header for the full legend table). We went with Option A (info icon only on the column header) for simplicity.

**Proposed solution:**
- Keep the existing legend modal on the column header (Option A, already implemented).
- Additionally, add a short tooltip on each colored profile pill showing a one-line definition of that specific label on hover/tap.

**Files likely affected:**
- `app/(auth)/participants/_components/ocia-profile-legend.tsx` — add tooltip component
- `app/(auth)/participants/page.tsx` — wrap each profile pill with tooltip
- `app/(auth)/attendance/_components/roster-client.tsx` — same for roster pills

---

## Remove Manual `ociaStage` Field — Rely Solely on OCIA Profile (Tech Debt)

**Context:** The `Participant` table has a manual `ociaStage` enum field (INQUIRY, CATECHUMEN, CANDIDATE, ELECT, MYSTAGOGY, COMPLETED) that defaults to INQUIRY and must be updated by hand. The computed `deriveOciaLabel()` function (`lib/ocia-stage.ts`) already derives the correct profile automatically from sacramental data, and now also covers Elect/Mystagogy/Completed via the `electionDate`/`easterVigilDate`/`completedAt` milestone fields.

**Progress:** Ministry Overview, Session Roster, the Participants list filter (`ociaProfileWhere()` in `lib/ocia-stage.ts`), and now the Contacts and Duplicate Participants reports have all been switched over to the computed profile — done, not just proposed. What's left:
- The participant detail page still displays the manual `ociaStage` badge.
- The participant edit form still has the manual Stage dropdown.
- The `ociaStage` column and `OciaStage` enum are still in the Prisma schema/database — dropping them requires a migration.

**Proposed solution:**
- Replace the manual Stage badge on the participant detail page with the computed OCIA Profile.
- Remove the Stage dropdown from the participant edit form.
- Drop the `ociaStage` column from the Prisma schema and database (requires a migration).

**Files likely affected:**
- `prisma/schema.prisma` — remove `ociaStage` field and `OciaStage` enum
- `app/(auth)/participants/[id]/page.tsx` — remove Stage badge and Stage row
- `app/(auth)/participants/_components/participant-form.tsx` — remove stage dropdown

---

## Sponsor Management

**Context:** The registration form captures a sponsor name (`sponsorName` text field on `Participant`), but there is no dedicated view to manage sponsors or see which participants have one assigned and which don't. Coordinators currently have no way to get a quick list of participants without a sponsor so they can follow up.

**Proposed solution:**
- Add a "Sponsors" report or filter view showing all active participants with their sponsor name (or a blank/missing indicator).
- Allow filtering/sorting by whether a sponsor is assigned (assigned vs. unassigned).
- Optionally: promote `sponsorName` from a free-text field to a proper `Sponsor` entity (name, phone, email) linked to one or more participants — enabling sponsor-level communication and reuse across cycles.

**Open question:** Is the short-term need just visibility (a report), or is there also a need to manage sponsor contact info and track their involvement more formally?

**Files likely affected:**
- `app/(auth)/reports/` — new sponsor report page
- `prisma/schema.prisma` — if promoting to a `Sponsor` entity
- `app/(auth)/participants/_components/participant-form.tsx` — sponsor lookup/autocomplete if relational

---

