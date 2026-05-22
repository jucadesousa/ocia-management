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
