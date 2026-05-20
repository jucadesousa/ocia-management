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

---

## OCIA Stages (Participant lifecycle)

```
  INQUIRY ──► CATECHUMEN ──► CANDIDATE ──► ELECT ──► MYSTAGOGY ──► COMPLETED
                                                                        ▲
                             (can be WITHDRAWN or INACTIVE              │
                              at any point) ────────────────────────────┘
```

---

## Key Relationships

| Relationship | Type | Description |
|---|---|---|
| Cycle → Participants | 1 : N | All participants belong to one cycle |
| Cycle → Sessions | 1 : N | All sessions belong to one cycle |
| Participant → AttendanceRecord | 1 : N | One record per session attended |
| Session → AttendanceRecord | 1 : N | One record per participant |
| Participant ↔ AttendanceRecord ↔ Session | M : N | Junction table linking participants to sessions |
| Participant → SacramentalRecord | 1 : 1 | Baptism, marriage, and OCIA milestone data |
| Participant → Documents | 1 : N | Uploaded certificates and files |

---

## Entity Reference

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
| ociaStage | Enum | Current stage in the OCIA process |
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

> The `ociaStage` field on **Participant** tracks *where they are in the process*. The **SacramentalRecord** tracks *what sacraments they've received and when*.

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
