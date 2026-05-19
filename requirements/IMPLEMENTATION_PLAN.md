# OCIA Management System — Implementation Plan

**Project:** Saint Bartholomew OCIA Management System  
**Domain:** ocia.sousacloud.com  
**Plan Date:** 2026-05-18  
**Stack:** Next.js 15 · Supabase · Vercel · Prisma · Tailwind CSS · shadcn/ui

---

## Tech Stack Decision

| Layer | Technology | Rationale |
|---|---|---|
| Framework | Next.js 15 (App Router) | Full-stack React, SSR for fast loads, API routes co-located with UI |
| Database | PostgreSQL via Supabase | Managed, free tier sufficient, RLS maps to RBAC |
| Auth | Supabase Auth | Built-in, supports email/password + magic link, RLS integration |
| File Storage | Supabase Storage | Photos + documents, 1GB free, CDN-backed |
| ORM | Prisma | Type-safe DB access, schema-as-code, migrations |
| Styling | Tailwind CSS + shadcn/ui | Mobile-first, accessible components, no design system to build |
| Hosting | Vercel | Auto-deploy from GitHub, edge CDN, free for personal projects |
| DNS | Cloudflare (sousacloud.com) | Point `ocia.sousacloud.com` CNAME to Vercel |
| Excel Export | xlsx (SheetJS) | Client-side Excel generation |
| PDF / Print | Browser print CSS | Printable rosters using CSS print media queries |

---

## Architecture Overview

```
ocia.sousacloud.com
       │
   Vercel Edge
       │
  Next.js App
  ┌────────────────────────────────┐
  │  App Router                    │
  │  /app/(public)/register        │  ← Public intake form
  │  /app/(auth)/dashboard         │  ← Admin/Volunteer views
  │  /app/(auth)/participants/...  │
  │  /app/(auth)/sessions/...      │
  │  /app/(auth)/attendance/...    │
  │  /app/(auth)/reports/...       │
  │  /app/api/...                  │  ← Server Actions + API routes
  └────────────────────────────────┘
       │
  Supabase (managed)
  ├── PostgreSQL DB  (Prisma ORM)
  ├── Auth           (email + magic link)
  └── Storage        (photos, documents)
```

---

## Database Schema (Prisma)

Full schema with all design decisions incorporated:

```prisma
// Enums
enum Role            { ADMIN VOLUNTEER }
enum Group           { ENGLISH SPANISH }
enum ParticipantStatus { ACTIVE INACTIVE WITHDRAWN }
enum OciaStage       { INQUIRY CATECHUMEN CANDIDATE ELECT MYSTAGOGY COMPLETED }
enum SessionType     { WEEKLY REFLECTION }
enum SessionStatus   { PLANNED COMPLETED CANCELLED }
enum AttendanceStatus { PRESENT ABSENT LATE LEFT_EARLY EXCUSED }
enum DocumentType    { BAPTISM_CERT MARRIAGE_DOC OTHER }

// Staff login accounts (separate from Participant)
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String
  role      Role     @default(VOLUNTEER)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  // supabaseUserId links to Supabase Auth
  supabaseUserId String @unique
}

// One record per OCIA year (e.g., "OCIA 2025–2026")
model Cycle {
  id                     String        @id @default(cuid())
  year                   Int           // e.g., 2026 (the graduation year)
  name                   String        // e.g., "OCIA 2025–2026"
  startDate              DateTime?
  endDate                DateTime?
  isCurrent              Boolean       @default(false)
  atRiskThresholdPercent Int           @default(75)
  createdAt              DateTime      @default(now())
  sessions               Session[]
  participants           Participant[]
}

// Sponsors are their own entity (external parishioners)
model Sponsor {
  id                  String        @id @default(cuid())
  name                String
  phone               String?
  email               String?
  eligibilityVerified Boolean       @default(false)
  notes               String?
  createdAt           DateTime      @default(now())
  updatedAt           DateTime      @updatedAt
  participants        Participant[]
}

model Participant {
  id              String            @id @default(cuid())
  // Identity
  firstName       String
  lastName        String
  fullName        String            // computed or entered; used for display/search
  preferredName   String?
  dateOfBirth     DateTime?
  photoUrl        String?           // Supabase Storage path
  // Contact
  phone           String?
  email           String?
  address         String?
  // Background
  currentReligion String?
  maritalStatus   String?
  // OCIA placement
  group           Group
  status          ParticipantStatus @default(ACTIVE)
  ociaStage       OciaStage         @default(INQUIRY)
  // Relations
  cycleId         String
  cycle           Cycle             @relation(fields: [cycleId], references: [id])
  sponsorId       String?
  sponsor         Sponsor?          @relation(fields: [sponsorId], references: [id])
  sacramentalRecord SacramentalRecord?
  documents       Document[]
  attendanceRecords AttendanceRecord[]
  createdAt       DateTime          @default(now())
  updatedAt       DateTime          @updatedAt
}

model SacramentalRecord {
  id                    String      @id @default(cuid())
  participantId         String      @unique
  participant           Participant @relation(fields: [participantId], references: [id], onDelete: Cascade)
  // Baptism
  isBaptized            Boolean?
  baptismDate           DateTime?
  baptismParish         String?
  baptismCertReceived   Boolean     @default(false)
  // Sacraments
  hasFirstCommunion     Boolean?
  hasConfirmation       Boolean?
  // Marriage / family status
  marriageStatus        String?     // Single, Married, Divorced, Widowed
  marriageCertReceived  Boolean     @default(false)
  annulmentStatus       String?     // None, Pending, Granted
  // OCIA milestones
  riteOfAcceptanceDate  DateTime?
  electionDate          DateTime?
  easterVigilDate       DateTime?
  // Completion
  completedAt           DateTime?
  updatedAt             DateTime    @updatedAt
}

model Session {
  id          String           @id @default(cuid())
  cycleId     String
  cycle       Cycle            @relation(fields: [cycleId], references: [id])
  number      Int              // 1–30 for weekly; 1–4 for reflection
  title       String?
  date        DateTime?
  type        SessionType      @default(WEEKLY)
  status      SessionStatus    @default(PLANNED)
  createdAt   DateTime         @default(now())
  updatedAt   DateTime         @updatedAt
  attendanceRecords AttendanceRecord[]
  @@unique([cycleId, type, number])
}

model AttendanceRecord {
  id            String           @id @default(cuid())
  participantId String
  participant   Participant      @relation(fields: [participantId], references: [id])
  sessionId     String
  session       Session          @relation(fields: [sessionId], references: [id])
  group         Group
  status        AttendanceStatus @default(ABSENT)
  recordedAt    DateTime         @default(now())
  @@unique([participantId, sessionId])
}

model Document {
  id            String       @id @default(cuid())
  participantId String
  participant   Participant  @relation(fields: [participantId], references: [id], onDelete: Cascade)
  type          DocumentType
  fileName      String
  storageUrl    String       // Supabase Storage path
  uploadedAt    DateTime     @default(now())
}
```

---

## Development Phases

---

### Phase 0 — Project Foundation (Week 1)

**Goal:** Working skeleton deployed to production URL before writing any features.

- [ ] Create GitHub repository (`ocia-management`)
- [ ] Scaffold Next.js 15 project with TypeScript
  ```bash
  npx create-next-app@latest ocia-management --typescript --tailwind --app
  ```
- [ ] Install and configure shadcn/ui
- [ ] Create Supabase project at supabase.com
  - Note project URL and anon/service keys
- [ ] Install Prisma, configure `DATABASE_URL` from Supabase connection string
- [ ] Write initial Prisma schema (all tables, enums, relations)
- [ ] Run first migration, verify schema in Supabase dashboard
- [ ] Set up Supabase Auth (email provider, disable email confirmation for internal use)
- [ ] Create Vercel project, link to GitHub repo
- [ ] Add environment variables to Vercel (`NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `DATABASE_URL`)
- [ ] Configure custom domain: `ocia.sousacloud.com`
  - In Vercel: Add domain under project settings
  - In Cloudflare: Add CNAME `ocia` → `cname.vercel-dns.com`
- [ ] Confirm `https://ocia.sousacloud.com` loads the Next.js default page
- [ ] Seed development data (2 admin users, 2 volunteer users, 10 test participants)

**Exit criteria:** Any push to `main` auto-deploys to `ocia.sousacloud.com`.

---

### Phase 1 — Auth + Shell (Week 1–2)

**Goal:** Logged-in users see the correct shell for their role. Non-authenticated routes redirect to login.

- [ ] Login page (`/login`) — email + password via Supabase Auth
- [ ] Auth middleware (Next.js middleware.ts) — protect all `/dashboard/*` routes
- [ ] Session cookie / server-side auth check with Supabase SSR client
- [ ] Role resolution — after login, read `User.role` from DB, store in session
- [ ] Navigation shell
  - Admin nav: Dashboard, Participants, Sessions, Attendance, Reports, Settings
  - Volunteer nav: Dashboard, Attendance, Participants (read-only)
- [ ] Role-based route guards (middleware blocks volunteers from admin-only pages)
- [ ] Basic dashboard page (placeholder cards for now)
- [ ] User management page (Admin only) — create staff accounts, assign roles

**Exit criteria:** Admin and Volunteer logins land on appropriate dashboards with correct nav.

---

### Phase 2 — Participant Management (Week 2–3)

**Goal:** Full CRUD for participants including photo upload.

#### 2A — Participant List
- [ ] `/participants` page — filterable/searchable table
  - Filters: group, OCIA stage, status
  - Search: name, email, phone
  - Columns: name, group, stage, status, attendance %
- [ ] Pagination (50 per page)
- [ ] Export to Excel button (participant list)

#### 2B — Participant Detail Page
- [ ] `/participants/[id]` — tabbed layout
  - **Profile tab:** all contact and demographic fields
  - **Sacramental tab:** full sacramental record + document uploads
  - **Attendance tab:** attendance history for this participant
- [ ] Stage suggestion indicator (non-blocking): shows "Suggested: Catechumen" if unbaptized, etc.
- [ ] Admin: edit all fields. Volunteer: read-only view.

#### 2C — Participant Create/Edit
- [ ] `/participants/new` — internal staff entry form
- [ ] Photo upload to Supabase Storage, preview thumbnail
- [ ] Document upload (Baptism cert, Marriage doc) to Supabase Storage
- [ ] Server Action validation (required fields: name, group, date of birth)

#### 2D — Public Intake Form
- [ ] `/register` — publicly accessible (no auth required)
- [ ] Minimal fields: name, email, phone, address, group preference
- [ ] On submit: creates Participant with status ACTIVE, stage INQUIRY
- [ ] Confirmation message (no email yet — out of scope MVP)
- [ ] Admin notification option: new registrations appear in a "Pending Review" queue on dashboard

**Exit criteria:** Admin can create, edit, view participants with photo. Public form creates records visible to admin.

---

### Phase 3 — Session Management (Week 3)

**Goal:** Admin can create and manage all 30+ weekly sessions and reflection days.

- [ ] `/sessions` — session list with status badges (Planned / Completed / Cancelled)
  - Filter by type (Weekly / Reflection), status
- [ ] Session create/edit modal
  - Fields: number (1–30), title (optional), date, time, type, status
  - No constraint between session number and date (flexible per requirements)
- [ ] Session cancel (sets status = Cancelled, does not delete)
- [ ] Bulk session creation helper — Admin can generate the 30 weekly sessions for a cycle at once with default dates that can be individually adjusted
- [ ] Session detail page — shows roster + attendance summary for that session

**Exit criteria:** Admin can manage the full session calendar for a cycle.

---

### Phase 4 — Attendance System (Week 4)

**Goal:** Volunteers can mark attendance quickly on mobile. Critical path feature.

#### 4A — Attendance Marking (Volunteer + Admin)
- [ ] `/attendance` — entry point: select session (most recent planned session pre-selected)
- [ ] Group tab toggle: English | Spanish
- [ ] Roster list — all active participants in selected group
  - Large tap targets (mobile-first)
  - Photo thumbnail next to name
  - One-tap status cycle: Present → Absent → Late → Left Early → Excused → Present
  - Default status is Absent until marked
- [ ] Search/filter within roster for edge cases (cross-group visitor, makeup)
- [ ] "Save Attendance" — bulk upsert all records
- [ ] Visual indicator: unsaved changes warning before navigating away

#### 4B — Attendance Editing (Admin Only)
- [ ] `/attendance/[sessionId]` — editable attendance grid
- [ ] Admin can change any status after the fact
- [ ] Admin can add individual attendance record for any participant

**Exit criteria:** Volunteer can select a session, mark full roster for a group in under 3 minutes on a phone.

---

### Phase 5 — Reporting (Week 5)

**Goal:** All high-priority reports live and exportable.

#### 5A — Attendance Reports
- [ ] Attendance per session (by group) — who was present/absent
- [ ] Attendance per participant — session-by-session history
- [ ] Attendance percentage per participant (present + late / total sessions)
- [ ] At-risk participants — below configurable threshold (default: <75% attendance)
- [ ] All exportable to Excel via SheetJS

#### 5B — Ministry Reports
- [ ] Participants by OCIA stage — counts + list view
- [ ] Missing documents report — participants with no baptism cert or no photo
- [ ] Sacrament readiness — admin-reviewed checklist view

#### 5C — Operational Reports
- [ ] Printable session roster — name + group, formatted for print (CSS print media)
- [ ] Photo roster — 2×3 grid with photo + name, printable (for name tags)
- [ ] Group contact list — name, phone, email for a group
- [ ] Volunteer attendance sheet — blank grid for paper backup

#### 5D — Parish / Diocese (Low Priority)
- [ ] Summary stats: total participants, stage distribution, sacrament counts
- [ ] These can be a single stats dashboard page

**Exit criteria:** All high-priority reports render and export correctly.

---

### Phase 6 — Polish + Production Hardening (Week 6)

- [ ] Mobile UX audit — test all flows on iOS Safari and Android Chrome
- [ ] Loading states and skeleton screens throughout
- [ ] Error boundaries and user-friendly error messages
- [ ] Row Level Security (RLS) policies in Supabase — defense in depth beyond middleware
- [ ] Input sanitization audit
- [ ] Image optimization — Next.js `<Image>` component for all photos
- [ ] Supabase Storage bucket policies (private; served via signed URLs)
- [ ] Environment secrets audit — no keys in client bundle
- [ ] 404 and unauthorized pages
- [ ] Accessibility pass — keyboard nav, focus management, color contrast
- [ ] Final review with a parish volunteer (usability test)

---

## Deployment Pipeline

```
Developer machine
    │
    git push origin main
    │
GitHub repo (ocia-management)
    │
Vercel (auto-deploy on push to main)
    ├── Runs `prisma migrate deploy`  ← via postbuild script
    ├── Builds Next.js
    └── Deploys to ocia.sousacloud.com
              │
         Supabase (always-on)
         ├── PostgreSQL
         └── Storage
```

**Branch strategy:**
- `main` → production (`ocia.sousacloud.com`)
- `dev` → Vercel preview URL (safe to test without affecting parish users)
- Feature branches → PR previews (auto-generated Vercel URLs)

---

## Environment Variables

| Variable | Where | Purpose |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Vercel + local | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Vercel + local | Public Supabase key (RLS enforced) |
| `SUPABASE_SERVICE_ROLE_KEY` | Vercel only | Server-side admin operations |
| `DATABASE_URL` | Vercel + local | Prisma connection string (Supabase pooler) |
| `DIRECT_URL` | Vercel + local | Prisma direct URL for migrations |
| `NEXTAUTH_SECRET` | Vercel + local | Session signing (if using NextAuth alongside Supabase) |

---

## Estimated Timeline

| Phase | Duration | Milestone |
|---|---|---|
| 0 — Foundation | 3–4 days | Live skeleton at ocia.sousacloud.com |
| 1 — Auth + Shell | 3–4 days | Login, roles, navigation working |
| 2 — Participants | 5–7 days | Full participant CRUD + public form |
| 3 — Sessions | 2–3 days | Session calendar management |
| 4 — Attendance | 4–5 days | Volunteer attendance marking live |
| 5 — Reports | 4–5 days | All high-priority reports + exports |
| 6 — Polish | 3–4 days | Production-ready, mobile-tested |
| **Total** | **~6 weeks** | **MVP complete** |

---

## Key Decisions Log

| Decision | Choice | Reason |
|---|---|---|
| Monorepo vs. separate repos | Monorepo (single Next.js app) | Simpler for solo maintenance |
| Server Actions vs. REST API | Server Actions (Next.js) | Less boilerplate, type-safe end-to-end |
| Supabase Auth vs. NextAuth | Supabase Auth primary | Integrates with RLS, fewer moving parts |
| ORM | Prisma | Type safety, auto-generated types, migration tooling |
| Cycle support | Multi-cycle from day one | One extra FK; avoids painful migration when year 2 arrives |
| Sponsor model | Free-text `sponsorName` on `Participant` | Parish does not maintain a sponsor database; a name field is sufficient |
| Staff account creation | Admin-only creation | Security; prevents unauthorized volunteer self-registration |
| At-risk threshold | Configurable on `Cycle` | Director may adjust threshold each year |
| Name tag format | Avery badge-size print CSS | Direct label printing; no external tool needed |
| PDF generation | Browser print CSS | No server-side PDF library needed for rosters |
| Excel export | Client-side SheetJS | No server overhead, instant download |
| Real-time attendance sync | Not in MVP | Single-volunteer use case, optimistic UI sufficient |

---

## Design Decisions (Resolved)

| # | Question | Decision |
|---|---|---|
| 1 | Cycle management | **Multi-cycle.** `Cycle` table with `year`, `name`, `isCurrent`. Sessions and participants FK to a Cycle. |
| 2 | Staff account creation | **Admin creates accounts only.** No self-registration. Admin → Settings → Users → Create. Supabase sends set-password email. |
| 3 | Sponsor tracking | **Free-text field on `Participant`.** `sponsorName String?`. Parish does not maintain a sponsor database; no separate entity needed. |
| 4 | At-risk threshold | **Configurable per cycle.** Stored as `atRiskThresholdPercent` on the `Cycle` record. Default: 75%. Admin editable in Cycle settings. |
| 5 | Name tags | **Badge-sized printable labels.** Avery-compatible layout (photo + name + cycle year). Print-ready page with CSS `@page` sizing. |

---

## Next Steps

1. Answer the open questions above
2. Create GitHub repository
3. Begin Phase 0 — Foundation Setup
4. First commit: scaffolded Next.js app deploying to ocia.sousacloud.com
