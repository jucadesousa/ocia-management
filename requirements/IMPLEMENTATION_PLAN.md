# OCIA Management System — Implementation Plan

**Project:** Saint Bartholomew OCIA Management System  
**Domain:** https://ocia.sousacloud.com  
**Repository:** https://github.com/jucadesousa/ocia-management  
**Plan Date:** 2026-05-18 · **Last updated:** 2026-05-19  
**Status:** MVP delivered and live in production

---

## Tech Stack (As Built)

| Layer | Technology | Notes |
|---|---|---|
| Framework | Next.js 16.2.6 (App Router) | `params`/`searchParams` are `Promise<{}>` — always awaited |
| Database | PostgreSQL via Supabase | Managed, free tier |
| Auth | Supabase Auth (email + password) | Service role used for admin account management |
| File Storage | Supabase Storage | `participant-photos` bucket (public, 5 MB limit, JPEG/PNG/WebP) |
| ORM | Prisma 6.x | `db push` for dev; `migrate deploy` for production |
| Styling | Tailwind CSS | Plain Tailwind — no component library |
| Hosting | Vercel | Auto-deploy on push to `master` |
| DNS | Cloudflare | `ocia` CNAME → Vercel |
| Excel Export | SheetJS (xlsx) | Client-side, no server overhead |
| Print | Browser CSS print media | Roster print suppresses nav and screen-only sections |

> **Note:** shadcn/ui was removed from the stack — plain Tailwind CSS was sufficient and kept the bundle lighter.

---

## Architecture

```
https://ocia.sousacloud.com
          │
      Vercel Edge
          │
     Next.js 16 App
  ┌──────────────────────────────────┐
  │  App Router                      │
  │  /register            (public)   │  ← Public intake form
  │  /login               (public)   │  ← Email + password login
  │  /(auth)/dashboard               │
  │  /(auth)/participants/...        │
  │  /(auth)/sessions/...            │
  │  /(auth)/attendance/...          │
  │  /(auth)/reports/...             │
  │  /(auth)/settings/...            │
  │                                  │
  │  proxy.ts  ← session middleware  │  ← Replaces Next.js middleware.ts
  │  app/actions/*.ts  ← Server Actions │
  └──────────────────────────────────┘
          │
     Supabase (managed)
     ├── PostgreSQL  (Prisma ORM)
     ├── Auth        (email + password, admin creates accounts)
     └── Storage     (participant-photos bucket)
```

---

## Database Schema (Current)

```prisma
enum Role             { ADMIN VOLUNTEER }
enum Group            { ENGLISH SPANISH }
enum ParticipantStatus { ACTIVE INACTIVE WITHDRAWN }
enum OciaStage        { INQUIRY CATECHUMEN CANDIDATE ELECT MYSTAGOGY COMPLETED }
enum SessionType      { WEEKLY REFLECTION }
enum SessionStatus    { PLANNED COMPLETED CANCELLED }
enum AttendanceStatus { PRESENT ABSENT LATE LEFT_EARLY EXCUSED }

model User {
  id             String   @id @default(cuid())
  email          String   @unique
  name           String
  role           Role     @default(VOLUNTEER)
  supabaseUserId String   @unique
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
}

model Cycle {
  id                     String        @id @default(cuid())
  year                   Int
  name                   String
  startDate              DateTime?
  endDate                DateTime?
  isCurrent              Boolean       @default(false)
  atRiskThresholdPercent Int           @default(75)
  createdAt              DateTime      @default(now())
  sessions               Session[]
  participants           Participant[]
}

model Participant {
  id            String            @id @default(cuid())
  // Identity
  firstName     String
  lastName      String
  maidenName    String?
  fullName      String
  preferredName String?
  dateOfBirth   DateTime?
  placeOfBirth  String?
  photoUrl      String?
  // Contact
  phone         String?
  phoneWork     String?
  email         String?
  address       String?
  city          String?
  state         String?
  zipCode       String?
  // Family & Work
  spouseName    String?
  occupation    String?
  // Background
  currentReligion String?
  maritalStatus   String?
  // Admin
  interviewDate DateTime?
  notes         String?
  // OCIA placement
  group         Group
  status        ParticipantStatus @default(ACTIVE)
  ociaStage     OciaStage         @default(INQUIRY)
  sponsorName   String?
  // Relations
  cycleId       String
  cycle         Cycle             @relation(fields: [cycleId], references: [id])
  sacramentalRecord SacramentalRecord?
  documents       Document[]
  attendanceRecords AttendanceRecord[]
  createdAt     DateTime          @default(now())
  updatedAt     DateTime          @updatedAt
}

model SacramentalRecord {
  id                      String      @id @default(cuid())
  participantId           String      @unique
  participant             Participant @relation(fields: [participantId], references: [id], onDelete: Cascade)
  // Baptism
  isBaptized              Boolean?
  baptismDenomination     String?
  baptismDate             DateTime?
  baptismParish           String?
  baptismCertReceived     Boolean     @default(false)
  // Sacraments
  hasFirstCommunion       Boolean?
  hasConfirmation         Boolean?
  // Marriage
  marriageStatus          String?
  marriedToCatholic       Boolean?
  marriedByCatholicPriest Boolean?
  hadPriorMarriage        Boolean?
  spouseHadPriorMarriage  Boolean?
  marriageCertReceived    Boolean     @default(false)
  annulmentStatus         String?
  // Children
  hasChildren             Boolean?
  childrenNotes           String?
  // OCIA milestones
  riteOfAcceptanceDate    DateTime?
  electionDate            DateTime?
  easterVigilDate         DateTime?
  completedAt             DateTime?
  updatedAt               DateTime    @updatedAt
}

model Session {
  id        String           @id @default(cuid())
  cycleId   String
  cycle     Cycle            @relation(fields: [cycleId], references: [id])
  number    Int
  title     String?
  presenter String?
  date      DateTime?
  type      SessionType      @default(WEEKLY)
  status    SessionStatus    @default(PLANNED)
  createdAt DateTime         @default(now())
  updatedAt DateTime         @updatedAt
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
  fileName      String
  storageUrl    String
  uploadedAt    DateTime     @default(now())
}
```

---

## Development Phases

### Phase 0 — Project Foundation ✅
- [x] Scaffold Next.js 16.2.6 project (TypeScript, Tailwind, App Router)
- [x] Create Supabase project (PostgreSQL + Auth + Storage)
- [x] Configure Prisma with Supabase connection pooler
- [x] Write initial schema, run first migration
- [x] Create GitHub repository (`jucadesousa/ocia-management`)
- [x] Connect Vercel to GitHub — auto-deploy on push to `master`
- [x] Configure custom domain `ocia.sousacloud.com` via Cloudflare
- [x] Add all environment variables to Vercel

---

### Phase 1 — Auth + Shell ✅
- [x] Login page (`/login`) — email + password via Supabase Auth
- [x] `proxy.ts` session middleware — protects all `/(auth)/*` routes
- [x] Role resolution — reads `User.role` from DB after login
- [x] Responsive navigation shell (hamburger on mobile, sidebar on desktop)
  - Admin nav: Dashboard, Participants, Sessions, Attendance, Reports, Settings
  - Volunteer nav: Dashboard, Attendance, Participants
- [x] Role-based server-side guards (`requireAuth()` in `lib/dal.ts`)
- [x] Dashboard with real live stats (active participants, sessions, at-risk count)
- [x] Loading skeletons for all major pages
- [x] Error boundary (`error.tsx`) and custom 404 page

---

### Phase 2 — Participant Management ✅
- [x] `/participants` — searchable, filterable list with pagination (50/page)
  - Mobile: card layout (avatar + name + badges)
  - Desktop: full table with avatar, name, group, stage, status, attendance %
- [x] Filters: group, OCIA stage, status, free-text search
- [x] `/participants/[id]` — tabbed detail view
  - **Profile tab:** all fields in sections (Identity, Contact, Family & Work, OCIA Placement, Admin)
  - **Sacramental tab:** full sacramental record display + "Edit" button (admin only)
  - **Attendance tab:** per-session attendance history with totals
- [x] `/participants/new` — full intake form (admin only)
- [x] `/participants/[id]/edit` — edit form with photo upload section
- [x] `/participants/[id]/sacramental/edit` — dedicated sacramental record edit page
- [x] Photo upload (Supabase Storage, `participant-photos` bucket, public CDN URL)
- [x] Initials avatar displayed everywhere a photo is missing
- [x] `/register` — public intake form (no auth required)

**Fields added beyond original plan:** `maidenName`, `placeOfBirth`, `phoneWork`, `city`, `state`, `zipCode`, `spouseName`, `occupation`, `interviewDate`, `notes`  
**Sacramental fields added:** `baptismDenomination`, `marriedToCatholic`, `marriedByCatholicPriest`, `hadPriorMarriage`, `spouseHadPriorMarriage`, `hasChildren`, `childrenNotes`

---

### Phase 3 — Session Management ✅
- [x] `/sessions` — session list with type and status filters
- [x] Sort: Weekly sessions before Reflections; ordered by number
- [x] Session create/edit — number, title, presenter, date, type, status
- [x] Session cancel (status = Cancelled, no delete)
- [x] Bulk session creation — generates 30 weekly + N reflection sessions for a cycle (idempotent upsert via `@@unique([cycleId, type, number])`)
- [x] Session detail page — attendance summary for that session

---

### Phase 4 — Attendance System ✅
- [x] `/attendance` — select session + group, mark attendance
- [x] Defaults to next upcoming PLANNED session
- [x] English / Spanish group toggle
- [x] One-tap status cycle: Absent → Present → Late → Left Early → Excused → Absent
- [x] Color-coded status indicators per card
- [x] Search within roster (filters visible cards; hidden participants still saved)
- [x] Sticky save bar with unsaved-changes counter
- [x] `beforeunload` warning when changes are unsaved
- [x] Bulk upsert via Server Action — all statuses saved in one request

---

### Phase 5 — Reports ✅
- [x] **Attendance report** — per-participant summary, at-risk highlighting, Excel export
- [x] **Session roster** — screen view (filled) + print view (blank volunteer sheet)
  - Print CSS hides nav, header, and screen-only content
  - Print button placed at the Blank Volunteer Sheet section
- [x] **Contact list** — name, phone, email, address; Excel export
- [x] **Ministry report** — participants by stage, at-risk list, missing photo flag; Excel export

---

### Phase 6 — Polish ✅
- [x] Responsive hamburger navigation (mobile sidebar with backdrop overlay)
- [x] Loading skeleton screens (participants, sessions, attendance, reports)
- [x] Error boundary with retry button
- [x] Custom 404 page
- [x] Roster print fixed — blank sheet only, navigation suppressed
- [x] Print button repositioned to Blank Volunteer Sheet section
- [x] Dashboard wired to live database stats
- [x] Settings — full user management (create accounts, set/reset passwords, change roles, remove)
- [x] Settings — full cycle management (create, edit, set current)
- [x] Participant list — responsive card layout on mobile (no horizontal scrolling)
- [x] Git repository initialized, pushed to GitHub, connected to Vercel auto-deploy

---

## Deployment Pipeline

```
Developer machine (c:\Projects\ocia-management)
    │
    git push origin master
    │
GitHub (jucadesousa/ocia-management)
    │
Vercel (auto-deploy on push to master)
    ├── npm install
    ├── next build  (TypeScript check + Turbopack)
    └── Deploy to ocia.sousacloud.com
              │
         Supabase (always-on)
         ├── PostgreSQL (Prisma, transaction pooler port 6543)
         └── Storage (participant-photos, public bucket)
```

**Branch:** `master` → production (`ocia.sousacloud.com`)

---

## Environment Variables

| Variable | Where | Purpose |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Vercel + local | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Vercel + local | Public key (client-side Supabase client) |
| `SUPABASE_SERVICE_ROLE_KEY` | Vercel + local | Server-side admin operations (account creation, storage) |
| `DATABASE_URL` | Vercel + local | Prisma connection (transaction pooler, port 6543, `?pgbouncer=true`) |
| `DIRECT_URL` | Vercel + local | Prisma direct URL for migrations (session pooler, port 5432) |

---

## Key Decisions Log

| Decision | Choice | Reason |
|---|---|---|
| Monorepo | Single Next.js app | Simpler for solo maintenance |
| Server Actions vs REST | Server Actions | Less boilerplate, type-safe end-to-end |
| Supabase Auth | Email + password only | Magic link not needed for internal parish staff |
| Staff account creation | Admin creates with password | No self-registration; admin sets/resets passwords via `supabase.auth.admin` |
| Sponsor model | Free-text `sponsorName` on Participant | Parish does not maintain a sponsor database |
| Component library | Plain Tailwind CSS (no shadcn/ui) | Sufficient for the UI needed; fewer dependencies |
| Middleware | `proxy.ts` (not `middleware.ts`) | Next.js 16 deprecates `middleware.ts`; `proxy.ts` is the new convention |
| `params`/`searchParams` | Always awaited (`await params`) | Next.js 16 breaking change — they are Promises |
| Prisma dev workflow | `db push` (not `migrate dev`) | Non-TTY shell; `migrate dev` requires interactive TTY |
| At-risk threshold | Configurable on `Cycle` | Director may adjust threshold each year |
| Session sort order | JS re-sort after Prisma query | Prisma `orderBy type asc` gives REFLECTION before WEEKLY alphabetically |
| Attendance hidden inputs | All participants, not just visible | Prevents losing unsaved records when search filters the roster |
| Print roster | CSS `@media print` + `no-print` class | No server PDF library; browser print CSS sufficient |
| Excel export | Client-side SheetJS | No server overhead; instant download |
| Participant list mobile | Card layout below `md:` breakpoint | Full table wider than phone screen; cards are more readable |
| Photo storage | Supabase Storage, public bucket | Simple CDN URL stored in `participant.photoUrl`; no signed URLs needed for MVP |

---

## Post-MVP Backlog

| Feature | Priority | Notes |
|---|---|---|
| Document uploads (baptism cert, marriage doc) | High | Storage bucket + Document model already in schema |
| Stage auto-suggestions | Medium | Advisory only; show suggested stage based on sacramental data |
| Photo roster / name tags | Medium | Avery-compatible print layout |
| RLS policies in Supabase | Medium | Defense-in-depth beyond middleware |
| Participant self-service portal | Low | View own profile, update limited fields |
| QR code / self check-in | Low | Reduce volunteer workload on busy nights |
| Email notifications | Low | New registration alerts, upcoming session reminders |
| Offline attendance mode | Low | PWA with service worker for poor connectivity |
| Diocese reporting export | Low | Summary stats per cycle |
