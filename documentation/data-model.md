# OCIA Management – Data Model

Visual representation of the system's core entities and their relationships.

---

## Entity Relationship Diagram

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                              OCIA MANAGEMENT – DATA MODEL                               │
└─────────────────────────────────────────────────────────────────────────────────────────┘

                          ┌───────────────────────┐
                          │         CYCLE         │
                          ├───────────────────────┤
                          │ id                    │
                          │ year                  │
                          │ name                  │
                          │ startDate / endDate   │
                          │ isCurrent             │
                          │ atRiskThreshold%      │
                          └──────────┬────────────┘
                                     │ 1
                         ┌───────────┴──────────────┐
                         │                          │
                         │ N                        │ N
            ┌────────────▼──────────┐  ┌────────────▼──────────┐
            │      PARTICIPANT      │  │        SESSION        │
            ├───────────────────────┤  ├───────────────────────┤
            │ id                    │  │ id                    │
            │ firstName / lastName  │  │ number                │
            │ group (EN / ES)       │  │ title / presenter     │
            │ status (ACTIVE, ...)  │  │ date                  │
            │ ociaStage             │  │ type (WEEKLY /        │
            │ sponsorName           │  │       REFLECTION)     │
            │ cycleId               │  │ status (PLANNED, ...) │
            └──────┬────────────────┘  └──────────┬────────────┘
                   │ 1                            │ 1
        ┌──────────┼──────────────┐               │
        │ 1        │ 1            │ N             │ N
        │          │              │               │
        ▼          ▼              └──────────┬────┘
┌────────────┐  ┌─────────────────┐          │
│ SACRAMENTAL│  │    DOCUMENT     │  ┌───────▼────────────────┐
│  RECORD    │  ├─────────────────┤  │   ATTENDANCE RECORD    │
├────────────┤  │ id              │  ├────────────────────────┤
│ id         │  │ participantId   │  │ id                     │
│            │  │ type            │  │ participantId  ──────► PARTICIPANT
│ Baptism    │  │ (BAPTISM_CERT,  │  │ sessionId      ──────► SESSION
│  info      │  │  MARRIAGE_DOC,  │  │ group (EN / ES)        │
│            │  │  OTHER)         │  │ status:                │
│ Marriage   │  │ fileName        │  │  PRESENT / ABSENT      │
│  info      │  │ storageUrl      │  │  LATE / LEFT_EARLY     │
│            │  └─────────────────┘  │  EXCUSED               │
│ OCIA       │                       │ recordedAt             │
│ milestones │                       └────────────────────────┘
│  - Rite of Acceptance              Unique: (participantId,
│  - Election                                sessionId)
│  - Easter Vigil
└────────────┘
```

`CALENDAR EVENT` is a separate entity off `CYCLE`, shown on its own below since it isn't part of the attendance chain:

```
                          ┌───────────────────────┐
                          │         CYCLE         │
                          └──────────┬────────────┘
                                     │ 1
                                     │ N
                          ┌──────────▼────────────┐
                          │    CALENDAR EVENT     │
                          ├───────────────────────┤
                          │ id                    │
                          │ title / description   │
                          │ category              │
                          │ date / time           │
                          │ location              │
                          │ highlight / sortOrder │
                          └───────────────────────┘
```

Not shown as an edge above: the public `/calendar` view merges `CalendarEvent` rows with `Session` (`WEEKLY`/`REFLECTION`) rows at read time — see `### CalendarEvent` below.

---

## OCIA Stages (Participant lifecycle)

```
  INQUIRY ──► CATECHUMEN ──► CANDIDATE ──► ELECT ──► MYSTAGOGY ──► COMPLETED
                                                                        ▲
                             (can be WITHDRAWN or INACTIVE              │
                              at any point) ────────────────────────────┘
```

> This is the **manual** `ociaStage` field's linear model. Most of the app now shows a **computed OCIA Profile** instead — see below — which covers more nuance (e.g. baptism validity) and derives Elect/Mystagogy/Completed from milestone dates rather than a hand-set dropdown.

---

## OCIA Profile (Computed)

`lib/ocia-stage.ts` exports `deriveOciaLabel()`, which computes a participant's real-time OCIA category from their `SacramentalRecord` — no manual update needed. It checks, in order:

1. **Milestone dates** — `completedAt` → **Completed**; else `easterVigilDate` → **Mystagogy**; else `electionDate` → **Elect**. These are still set by hand (on the Sacramental tab), but only once staff confirm the participant actually attended that rite — not a separate stage dropdown.
2. **Baptism/sacrament data**, if no milestone date is set yet:

| `baptismType` | Additional condition | Derived label |
|---|---|---|
| `NONE` | — | Catechumen |
| `OTHER_UNVERIFIED` | — | Candidate (Baptism Unverified) |
| `OTHER_VALID` | — | Candidate |
| `CATHOLIC` | no First Communion | Candidate for Sacraments |
| `CATHOLIC` | Communion, no Confirmation | Catholic Candidate |
| `CATHOLIC` | Communion and Confirmation | Fully Initiated |
| *(no sacramental record at all)* | — | Unknown |

A matching `ociaProfileWhere()` helper (same file) translates any of these categories into a Prisma filter, so list/report filtering stays in sync with what's displayed — used by the Participants list filter dropdown.

**Where the computed profile is used:** Ministry Overview (Stage Distribution, Missing Documents), Session Roster's Stage column, the Participants list badge and its filter dropdown, and the Attendance roster/reports. The Contacts report and the participant edit form's dropdown are the remaining places still showing the manual `ociaStage` field (see backlog).

---

## Key Relationships

| Relationship | Type | Description |
|---|---|---|
| Cycle → Participants | 1 : N | All participants belong to one cycle |
| Cycle → Sessions | 1 : N | All sessions belong to one cycle |
| Cycle → CalendarEvents | 1 : N | All calendar events belong to one cycle |
| Participant → AttendanceRecord | 1 : N | One record per session attended |
| Session → AttendanceRecord | 1 : N | One record per participant |
| Participant ↔ AttendanceRecord ↔ Session | M : N | Junction table linking participants to sessions |
| Participant → SacramentalRecord | 1 : 1 | Baptism, marriage, and OCIA milestone data |
| Participant → Documents | 1 : N | Uploaded certificates and files |

---

## Entity Reference

### User

A staff login account (ADMIN or VOLUNTEER) — separate from `Participant` and not scoped to a cycle. Linked to Supabase Auth via `supabaseUserId`.

| Field | Type | Notes |
|---|---|---|
| id | String | CUID primary key |
| supabaseUserId | String | Foreign key → Supabase Auth user |
| email | String | Unique login email |
| name | String | Display name |
| role | Enum | `ADMIN` or `VOLUNTEER` |
| bio | String? | Short self-written summary shown on the public Team page |
| photoUrl | String? | Supabase Storage public URL (`staff-photos` bucket) |
| isPublished | Boolean | Default: false — must be explicitly turned on for the profile to appear on `/team` |

> Staff edit their own `bio`/`photoUrl`/`isPublished` at **Account → My Profile**; the public `/team` and `/team/[id]` pages only ever show `isPublished: true` users.

---

### Cycle

The top-level container for a single OCIA year. Everything — participants and sessions — is scoped to a cycle. Only one cycle is marked `isCurrent` at a time.

| Field | Type | Notes |
|---|---|---|
| id | String | CUID primary key |
| year | Int | Graduation year (e.g. 2026) |
| name | String | Display name (e.g. "OCIA 2025–2026") |
| startDate / endDate | DateTime? | Optional date range |
| isCurrent | Boolean | Marks the active cycle |
| atRiskThresholdPercent | Int | Default: 75 — threshold for at-risk flagging |

---

### Participant

An individual enrolled in OCIA. Belongs to one cycle and one language group.

| Field | Type | Notes |
|---|---|---|
| id | String | CUID primary key |
| firstName / lastName | String | Required |
| fullName | String | Stored explicitly; defaults to first + last |
| group | Enum | `ENGLISH` or `SPANISH` |
| ociaStage | Enum | Manual stage field — superseded by the computed OCIA Profile in most views (see below); still shown on the Contacts report and edit form |
| status | Enum | `ACTIVE`, `INACTIVE`, or `WITHDRAWN` |
| sponsorName | String? | Stored as plain text |
| cycleId | String | Foreign key → Cycle |

---

### Session

A single meeting within a cycle. Can be a regular weekly session or a reflection day.

| Field | Type | Notes |
|---|---|---|
| id | String | CUID primary key |
| cycleId | String | Foreign key → Cycle |
| number | Int | Session number within its type |
| title / presenter | String? | Optional metadata |
| date | DateTime? | When the session occurs |
| type | Enum | `WEEKLY` or `REFLECTION` |
| status | Enum | `PLANNED`, `COMPLETED`, or `CANCELLED` |

Unique constraint: `(cycleId, type, number)` — no duplicate session numbers per type per cycle.

---

### CalendarEvent

Non-session calendar entries — rites, holy days, feast days, special services, routine Sunday Mass/dismissal notes, and other parish/team events. Backs the public `/calendar` page and its admin editor at Settings → Calendar.

| Field | Type | Notes |
|---|---|---|
| id | String | CUID primary key |
| cycleId | String | Foreign key → Cycle |
| title | String | e.g. "Rite of Welcoming" |
| description | String? | Optional longer note |
| category | Enum | See `EventCategory` below |
| date | DateTime | Calendar date, UTC-midnight (same convention as Session.date) |
| time | String? | Free-text display only (e.g. "5:00 PM") — never used for sorting |
| location | String? | e.g. "Parish Hall" |
| highlight | Boolean | Marks a milestone entry for visual emphasis |
| sortOrder | Int | Manual tie-break for same-day entries; default 0 |

> `CalendarEvent` is intentionally decoupled from `Session` — it carries no attendance or status concept. The public `/calendar` view merges `CalendarEvent` rows with `WEEKLY`/`REFLECTION` `Session` rows at read time via `lib/calendar.ts`. Retreat mornings are represented only as `Session{type: REFLECTION}` and are not duplicated here.

---

### Attendance Record

Junction table linking a Participant to a Session, recording whether they attended.

| Field | Type | Notes |
|---|---|---|
| id | String | CUID primary key |
| participantId | String | Foreign key → Participant |
| sessionId | String | Foreign key → Session |
| group | Enum | Denormalized copy of participant's group |
| status | Enum | `PRESENT`, `ABSENT`, `LATE`, `LEFT_EARLY`, `EXCUSED` |
| recordedAt | DateTime | Auto-timestamp |

Unique constraint: `(participantId, sessionId)` — one record per participant per session.

---

### Sacramental Record

A one-to-one extension of Participant tracking sacramental history and OCIA milestones. Created separately from the participant record.

| Section | Fields |
|---|---|
| Baptism | `isBaptized`, `baptismDenomination`, `baptismDate`, `baptismParish`, `baptismProofStatus` |
| Sacraments | `hasFirstCommunion`, `hasConfirmation` |
| Marriage | `marriageStatus`, `marriedToCatholic`, `marriedByCatholicPriest`, `hadPriorMarriage`, `annulmentStatus`, `marriageCertReceived` |
| Children | `hasChildren`, `childrenNotes` |
| OCIA Milestones | `riteOfAcceptanceDate`, `electionDate`, `easterVigilDate`, `completedAt` |

> The `ociaStage` field on **Participant** is the manual stage tracker. The **SacramentalRecord** feeds the computed **OCIA Profile** (see above) — *what sacraments they've received and when* — which is what most views now show instead.

---

### Document

Files uploaded for a participant (certificates, etc.), stored in Supabase Storage.

| Field | Type | Notes |
|---|---|---|
| id | String | CUID primary key |
| participantId | String | Foreign key → Participant (cascade delete) |
| type | Enum | `BAPTISM_CERT`, `MARRIAGE_DOC`, `OTHER` |
| fileName | String | Original filename |
| storageUrl | String | Supabase Storage path |

---

## How At-Risk Attendance Is Calculated

```
Cycle.atRiskThresholdPercent  (default: 75%)
         │
         ▼
For each Participant:
  attendedCount = AttendanceRecords where status IN (PRESENT, LATE)
  totalSessions = completed Sessions in the same cycle
  attendanceRate = attendedCount / totalSessions × 100
  isAtRisk      = attendanceRate < atRiskThresholdPercent
```

---

## Enum Values

| Enum | Values |
|---|---|
| OciaStage | `INQUIRY`, `CATECHUMEN`, `CANDIDATE`, `ELECT`, `MYSTAGOGY`, `COMPLETED` |
| ParticipantStatus | `ACTIVE`, `INACTIVE`, `WITHDRAWN` |
| SessionType | `WEEKLY`, `REFLECTION` |
| SessionStatus | `PLANNED`, `COMPLETED`, `CANCELLED` |
| AttendanceStatus | `PRESENT`, `ABSENT`, `LATE`, `LEFT_EARLY`, `EXCUSED` |
| Group | `ENGLISH`, `SPANISH` |
| DocumentType | `BAPTISM_CERT`, `MARRIAGE_DOC`, `OTHER` |
| BaptismProofStatus | `NONE`, `CERTIFICATE`, `LETTER`, `OTHER` |
| EventCategory | `RITE`, `HOLY_WEEK`, `HOLY_DAY`, `FEAST_DAY`, `SPECIAL_SERVICE`, `SUNDAY_MASS`, `TEAM_EVENT`, `OTHER` |
