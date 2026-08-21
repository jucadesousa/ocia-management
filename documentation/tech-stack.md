# OCIA Management – Tech Stack

Overview of every technology in this project, what it does, and how it connects to everything else.

---

## Architecture at a Glance

```
┌──────────────────────────────────────────────────────────────────────┐
│                          USER'S BROWSER                              │
└─────────────────────────────┬────────────────────────────────────────┘
                              │ HTTPS
┌─────────────────────────────▼────────────────────────────────────────┐
│                       VERCEL (Hosting)                               │
│                                                                      │
│   ┌──────────────────────────────────────────────────────────────┐   │
│   │                    NEXT.JS APPLICATION                       │   │
│   │                                                              │   │
│   │   ┌─────────────────┐        ┌────────────────────────────┐  │   │
│   │   │  React + TSX    │        │    Server Actions / API    │  │   │
│   │   │  (UI Pages &    │◄──────►│    (business logic,        │  │   │
│   │   │   Components)   │        │     data mutations)        │  │   │
│   │   └────────┬────────┘        └──────────┬─────────────────┘  │   │
│   │            │ Tailwind CSS               │                    │   │
│   │            │ (styling)          ┌───────┴──────────┐         │   │
│   │            │                    │   DAL / lib/     │         │   │
│   │            │                    │  (auth checks,   │         │   │
│   │            │                    │  Prisma queries) │         │   │
│   │            │                    └───────┬──────────┘         │   │
│   └────────────┼────────────────────────────┼────────────────────┘   │
└────────────────┼────────────────────────────┼────────────────────────┘
                 │                            │
      ┌──────────▼──────────┐      ┌──────────▼──────────────────┐
      │      SUPABASE       │      │           SUPABASE          │
      │   Authentication    │      │     PostgreSQL Database     │
      │  (login, sessions,  │      │   (via Prisma ORM +         │
      │   storage)          │      │    connection pooler)       │
      └─────────────────────┘      └─────────────────────────────┘
```

---

## Technologies

### Next.js 16 — Application Framework

**What it is:** The core framework that runs the entire application. It handles routing, page rendering, and the server-side logic.

**How it is used here:**
- **App Router** — every folder under `app/` is a route. Protected routes live under `app/(auth)/`, the public registration form lives under `app/register/`.
- **Server Components** — most pages fetch data directly on the server before sending HTML to the browser. This means pages load fast and database credentials never reach the browser.
- **Server Actions** — form submissions (creating participants, saving attendance, editing sacramental records) call server-side functions directly. No separate API layer is needed.
- **Middleware** — a `middleware.ts` file intercepts every request to check whether the user is logged in before letting them through to protected pages.
- **Turbopack** — the development build tool (enabled in v16). Makes local development faster.

**Key config:** [next.config.ts](../next.config.ts)

---

### React 19 — UI Library

**What it is:** The library used to build every page and component. Next.js is built on top of React.

**How it is used here:**
- Pages are written as React components (`.tsx` files).
- Client-side interactivity (dropdowns, form state, pending states on buttons) uses React hooks like `useActionState`.
- The `"use client"` directive marks components that need to run in the browser. Everything else runs on the server.

---

### TypeScript 5 — Type Safety

**What it is:** A strongly-typed layer on top of JavaScript. TypeScript catches mistakes at compile time rather than at runtime.

**How it is used here:**
- Every file in the project is TypeScript (`.ts` or `.tsx`).
- Prisma generates TypeScript types from the database schema automatically, so the code always knows the exact shape of every database record.
- Strict mode is enabled — the compiler will reject any code that could produce a runtime error due to a missing or wrong type.

**Key config:** [tsconfig.json](../tsconfig.json)

---

### Tailwind CSS 4 — Styling

**What it is:** A utility-first CSS framework. Instead of writing separate CSS files, styles are applied directly in the HTML/TSX using short class names like `text-sm`, `rounded-lg`, `bg-blue-600`.

**How it is used here:**
- All visual design — layout, spacing, colours, typography — is done with Tailwind classes inline on components.
- No custom CSS files exist. Tailwind generates only the CSS classes actually used, keeping the final stylesheet small.

**Key config:** [postcss.config.mjs](../postcss.config.mjs)

---

### Prisma 6 — Database ORM

**What it is:** The layer between the application code and the database. ORM stands for "Object-Relational Mapper" — it lets the code work with database records as regular TypeScript objects, without writing raw SQL.

**How it is used here:**
- The **schema** ([prisma/schema.prisma](../prisma/schema.prisma)) defines all tables, columns, relationships, and enums in one file. This is the single source of truth for the data model.
- **Migrations** ([prisma/migrations/](../prisma/migrations/)) are versioned SQL files that record every change ever made to the database structure. Running `prisma migrate deploy` applies any pending changes.
- **Prisma Client** is auto-generated from the schema and gives the application fully type-safe database queries (e.g. `prisma.participant.findMany(...)`).
- A singleton client is kept in [lib/prisma.ts](../lib/prisma.ts) to avoid opening too many database connections during development.

**Key commands:**
| Command | Purpose |
|---|---|
| `npm run db:generate` | Regenerate the Prisma client after a schema change |
| `npm run db:migrate` | Create and apply a new migration (development) |
| `prisma migrate deploy` | Apply pending migrations (production) |
| `npm run db:studio` | Open a visual database browser |

> **Important:** The build script runs `prisma generate` before `next build` so that Vercel always has up-to-date types when deploying.

---

### Supabase — Authentication & Storage & Database Hosting

Supabase provides three separate services, all used in this project:

#### 1. PostgreSQL Database (hosting)
The actual database where all data lives — participants, sessions, attendance records, sacramental records, and so on. Supabase hosts a managed PostgreSQL instance.

Two connection strings are used:
- **`DATABASE_URL`** — goes through a **connection pooler** (PgBouncer, port 6543). Used by the running application for all queries. The pooler efficiently manages many simultaneous connections.
- **`DIRECT_URL`** — a **direct connection** (port 5432). Used only by Prisma when running migrations, because migrations require a persistent connection that the pooler cannot provide.

#### 2. Authentication
Supabase Auth handles login, logout, and session management. When a user logs in, Supabase issues a session token stored in a cookie.

- [lib/supabase/server.ts](../lib/supabase/server.ts) — creates a Supabase client for use inside Server Components and Server Actions (reads cookies from the request).
- [lib/supabase/client.ts](../lib/supabase/client.ts) — creates a Supabase client for use inside Client Components (browser-side).
- [lib/supabase/middleware.ts](../lib/supabase/middleware.ts) — refreshes the session token on every request so sessions stay alive.
- [lib/supabase/admin.ts](../lib/supabase/admin.ts) — a special admin client that uses the service role key. Used for privileged operations like uploading files to Storage. Never exposed to the browser.

#### 3. Storage
Supabase Storage holds participant photos, staff photos, and uploaded documents (baptism certificates, marriage documents, etc.). Two relevant buckets:
- `participant-photos` — participant photos.
- `staff-photos` — staff profile photos for the public Team page (public bucket, since these are meant to be viewed without login).

Files are referenced by URL in the database.

**Key environment variables:**
| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | The URL of the Supabase project |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public key — safe to expose to the browser |
| `SUPABASE_SERVICE_ROLE_KEY` | Secret admin key — server-side only, never in the browser |
| `DATABASE_URL` | Pooled DB connection for the running app |
| `DIRECT_URL` | Direct DB connection for migrations |

---

### Data Access Layer — `lib/dal.ts`

**What it is:** A thin bridge between Supabase Auth and Prisma.

**How it works:**
1. Supabase Auth knows *who is logged in* (a Supabase user ID and email).
2. Prisma knows *what role that person has* (Admin or Volunteer), stored in the `User` table.
3. `lib/dal.ts` combines both: it looks up the current Supabase session, then queries the Prisma `User` record to get the role and name.

Every protected page and Server Action calls `requireAuth()` from the DAL first. If the user is not logged in, they are redirected to the login page. If they are logged in but lack the required role, they get a `notFound()` or an error.

```
Browser request
      │
      ▼
middleware.ts ── checks session cookie ── not logged in → redirect /login
      │
      ▼
Page / Server Action
      │
      ▼
requireAuth() in dal.ts
      ├── supabase.auth.getUser()  → confirms session is valid
      └── prisma.user.findUnique() → gets role (ADMIN / VOLUNTEER)
```

---

### xlsx — Excel Export

**What it is:** A library for generating `.xlsx` spreadsheet files in Node.js.

**How it is used here:** The Reports section allows staff to export participant rosters and attendance data as Excel files. The `xlsx` package builds the file in memory on the server and streams it back to the browser as a download.

---

### Vercel — Deployment & Hosting

**What it is:** The cloud platform where the application is deployed and runs in production.

**How it is used here:**
- Every push to the `master` branch on GitHub triggers an automatic deployment.
- Vercel runs `npm run build` (`prisma generate && next build`) on its build servers, then deploys the result globally.
- Environment variables (Supabase keys, database URLs) are configured in the Vercel project dashboard and injected at build and runtime.
- The application runs as serverless functions — each page or API route spins up on demand.

---

## How It All Fits Together

```
Developer pushes code to GitHub
        │
        ▼
Vercel detects new commit on master
        │
        ▼
Vercel build: prisma generate → next build
        │
        ▼
App deployed to Vercel edge network
        │
        ▼
User visits the site
        │
        ├── Not logged in → Supabase Auth login page
        │
        └── Logged in:
              │
              ├── Supabase session cookie confirmed by middleware
              │
              ├── Server Component requests data
              │       └── Prisma queries PostgreSQL on Supabase
              │
              └── Form submitted (Server Action)
                      ├── DAL checks auth + role
                      ├── Prisma writes to PostgreSQL
                      └── Page revalidated and redirected
```

---

## Participant Stage Model

Each participant has two related concepts that work together:

### `ociaStage` (on `Participant`)
An admin-managed enum that tracks where a participant is in the OCIA process: `INQUIRY → CATECHUMEN → CANDIDATE → ELECT → MYSTAGOGY → COMPLETED`. New registrants always start at `INQUIRY`. Admins advance the stage manually from the participant edit form.

### `baptismType` (on `SacramentalRecord`)
An enum that records the nature of a participant's baptism:

| Value | Meaning |
|---|---|
| `NONE` | Not baptized |
| `CATHOLIC` | Baptized Catholic |
| `OTHER_VALID` | Baptized in another Christian denomination — trinitarian validity confirmed |
| `OTHER_UNVERIFIED` | Baptized in another Christian denomination — trinitarian validity not yet confirmed |

At registration, `baptismType` is **auto-suggested** from the registrant's answers (`isBaptized` + `baptismDenomination`). Admins review and correct it in the Sacramental Record edit form after the intake interview.

### Derived OCIA Label (OCIA Profile)
`lib/ocia-stage.ts` exports `deriveOciaLabel()`, which first checks the OCIA milestone dates (`completedAt`, `easterVigilDate`, `electionDate`) and, if none are set yet, falls back to the combination of `baptismType` + `hasFirstCommunion` + `hasConfirmation`:

| Profile | Derived Label |
|---|---|
| `completedAt` set | Completed |
| `easterVigilDate` set | Mystagogy |
| `electionDate` set | Elect |
| Not baptized | Catechumen |
| Other Christian, unverified | Candidate (Baptism Unverified) |
| Other Christian, valid trinitarian | Candidate |
| Catholic — no First Communion | Candidate for Sacraments |
| Catholic — has Communion, no Confirmation | Catholic Candidate |
| Catholic — fully initiated | Fully Initiated |
| No sacramental record at all | Unknown |

The label is computed server-side and rendered as a color-coded pill. It's used on the Attendance roster/reports, Ministry Overview (Stage Distribution and Missing Documents), Session Roster's Stage column, the Contacts and Duplicate Participants reports, and the Participants list badge. A companion function, `ociaProfileWhere()`, translates any of these categories into a Prisma filter — this is what powers the Participants list's profile filter dropdown, keeping list filtering in sync with the displayed label.

---

## Version Summary

| Technology | Version | Role |
|---|---|---|
| Next.js | 16.2.6 | Application framework |
| React | 19.2.4 | UI rendering |
| TypeScript | 5.x | Type safety |
| Tailwind CSS | 4.x | Styling |
| Prisma | 6.8.2 | ORM & migrations |
| Supabase JS | 2.x | Auth & Storage client |
| PostgreSQL | (managed by Supabase) | Database |
| xlsx | 0.18.5 | Excel export |
| Vercel | — | Hosting & deployment |
