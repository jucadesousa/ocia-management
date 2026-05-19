# OCIA Management System — MVP Requirements Document (v2.0)

**Parish:** Saint Bartholomew the Apostle Catholic Church, Katy, TX  
**System URL:** https://ocia.sousacloud.com  
**Version:** 2.0 — Updated to reflect delivered MVP  
**Original:** 2026-05-18 · **Last updated:** 2026-05-19

---

## Change Log

| Version | Date | Summary |
|---|---|---|
| 1.0 | 2026-05-18 | Initial requirements |
| 2.0 | 2026-05-19 | Updated to match delivered MVP; clarified deferred items |

---

## 1. Purpose

This document defines the requirements for a responsive web application supporting the OCIA ministry at Saint Bartholomew the Apostle Catholic Church. The system replaces paper and Excel-based workflows for participant intake, attendance tracking, sacramental record-keeping, and reporting.

The system is designed for internal parish use by the OCIA director and volunteers.

---

## 2. Scope

### Delivered in MVP
- Participant registration (public form + internal admin entry)
- OCIA lifecycle tracking (stage + status management)
- Attendance management with mobile-optimized marking
- Session scheduling (weekly sessions + reflections)
- Sacramental record editing
- Participant photo upload and display
- Role-based access control (Admin / Volunteer)
- Reporting (attendance, roster, contacts, ministry)
- Staff account management (admin-controlled)
- Cycle management (multi-year support)

### Deferred — Post-MVP
- Document uploads (baptism certificates, marriage documents)
- Stage auto-suggestions based on sacramental data
- Photo rosters / name tag printing
- Native mobile applications
- Offline mode
- Automated approval workflows
- External diocesan integrations
- QR code or self-check-in attendance
- Email / SMS notifications
- Participant self-service portal

---

## 3. Users and Roles

### 3.1 Admin (OCIA Director / Parish Staff)
- Full system access
- Create and manage participant records
- Edit sacramental records
- Manage sessions and cycles
- Mark and edit attendance
- View all reports and exports
- Create and manage staff accounts (Volunteer or Admin)
- Set and reset staff passwords

### 3.2 Volunteer / Catechist
- View all participants (read-only)
- Mark attendance for any session and group
- View session rosters (both groups)
- Cannot modify sacramental records, participant data, or system settings

### 3.3 Future Role: Participant (Post-MVP)
- View own profile only
- Update limited personal information

---

## 4. Groups Model

The system supports exactly two fixed groups:
- **English OCIA Group**
- **Spanish OCIA Group**

Rules:
- Group is assigned at registration (required)
- No creation or deletion of groups
- Both Volunteers and Admins can view both groups
- Attendance is recorded per participant per session

---

## 5. Participant Management

### 5.1 Intake Sources
- Public signup form (`/register`) — no login required
- Internal admin entry (`/participants/new`) — admin only

### 5.2 Default State
- Participant status: **ACTIVE** immediately upon creation
- Default OCIA stage: **Inquiry**
- Group assignment required at intake

### 5.3 Participant Data Fields

**Identity**
- First name, last name, full name (editable), maiden name, preferred name ("goes by")
- Date of birth, place of birth

**Contact**
- Home phone, work phone, email
- Street address, city, state, ZIP code

**Family & Work**
- Spouse name, occupation
- Current religion, marital status

**OCIA Placement**
- Group (English / Spanish)
- OCIA stage, participant status
- Sponsor name (free-text — parish does not maintain a sponsor database)

**Admin**
- Interview date
- Internal notes

**Photo**
- Participant photo stored in Supabase Storage
- Displayed in participant list (avatar), detail page, and edit page
- Initials avatar shown when no photo is on file
- Upload via admin edit page (JPEG, PNG, WebP; max 5 MB)

### 5.4 Sacramental Record

Sacramental data is stored in a separate linked record, editable only by Admins.

**Baptism**
- Baptized? (Yes / No / Unknown)
- Denomination / church where baptized
- Baptism date, baptism parish
- Baptism certificate received (Yes / No)

**Other Sacraments**
- First Communion received? (Yes / No / Unknown)
- Confirmation received? (Yes / No / Unknown)

**Marriage**
- Marriage status (Single / Married / Separated / Divorced / Widowed)
- Married to a Catholic? (Yes / No / Unknown)
- Married by a Catholic priest? (Yes / No / Unknown)
- Had a prior marriage? (Yes / No / Unknown)
- Spouse had a prior marriage? (Yes / No / Unknown)
- Marriage certificate received (Yes / No)
- Annulment status (None / Pending / Granted)

**Children**
- Has children? (Yes / No / Unknown)
- Children notes (free-text)

**OCIA Milestones**
- Rite of Acceptance date
- Election date
- Easter Vigil date
- Completion date

### 5.5 Document Management (Post-MVP)

Physical document uploads (baptism certificates, marriage documents) are deferred to a post-MVP release. The sacramental record tracks whether certificates have been received, but the files themselves are not yet stored in the system.

---

## 6. OCIA Lifecycle Management

### Stages
- Inquiry
- Catechumen
- Candidate
- Elect
- Mystagogy
- Completed

### Status Values
- Active
- Inactive
- Withdrawn

### Rules
- Admin manually controls both stage and status
- No automatic stage transitions
- Stage suggestions based on sacramental data are deferred to post-MVP

---

## 7. Session Management

### Structure
- Up to 30 weekly OCIA sessions per cycle
- Up to 4 Morning of Reflection sessions (Saturdays)

### Session Properties
- Type: Weekly or Reflection
- Session number (1–30 for weekly; 1–4 for reflections)
- Title / topic (optional)
- Presenter (optional free-text)
- Date (optional — can be set later)
- Status: Planned / Completed / Cancelled

### Rules
- Sessions can be rescheduled freely
- Session number is independent of calendar date
- Cancellation sets status = Cancelled; does not delete
- Bulk creation helper generates all sessions for a cycle at once

---

## 8. Attendance System

### Data Model
Each record links: `Participant + Session + Status`

### Status Options
- Present
- Absent
- Late
- Left Early
- Excused

### Workflow
1. Volunteer selects a session (defaults to next upcoming planned session)
2. Selects group (English or Spanish)
3. Taps participant cards to cycle through statuses (Present → Absent → Late → Left Early → Excused → Present)
4. Uses search to find specific participants quickly
5. Saves all records at once via sticky Save bar
6. Browser warns before navigating away with unsaved changes

### Mobile Experience
- Large tap targets, card layout on phones
- Sticky session selector and save bar
- Search filters the visible list without losing unsaved data for hidden participants

---

## 9. Reporting

### 9.1 Attendance Report
- Attendance summary across all sessions for the current cycle
- Per-participant row with present, absent, late, left-early, excused counts and attendance %
- At-risk participants highlighted (below configurable threshold, default 75%)
- Exportable to Excel (SheetJS)

### 9.2 Session Roster
- Select any session and group
- **Screen view:** filled roster showing current attendance status for each participant
- **Print view:** blank volunteer sheet with checkboxes (P / A / L / LE / E columns)
- Print button prints only the blank sheet, suppressing navigation and screen content

### 9.3 Contact List
- Name, phone, email, address for each active participant
- Filterable by group
- Exportable to Excel

### 9.4 Ministry Report
- Participants grouped by OCIA stage
- At-risk participants (below attendance threshold)
- Missing photo indicator
- Exportable to Excel

### 9.5 Deferred Reports (Post-MVP)
- Photo rosters for name tags
- Parish / diocese summary statistics page
- Sacrament readiness checklist

---

## 10. System Requirements

### Platform
- Responsive web application
- Mobile-first design (phones and tablets are the primary attendance-marking devices)
- Desktop supported for admin workflows

### Access
- Authentication required for all staff-facing routes
- Role-based permissions enforced server-side
- Public `/register` route requires no authentication

### Performance
- Supports 150+ participants per cycle
- Fast attendance marking — full group recorded in under 3 minutes on a phone

### Usability
- Initials avatar as placeholder whenever no photo is available
- Mobile card layout for participant lists (no horizontal scrolling)
- Minimal clicks for volunteer attendance workflow

---

## 11. Key Design Decisions

| # | Decision | Choice | Reason |
|---|---|---|---|
| 1 | Sponsor tracking | Free-text `sponsorName` on Participant | Parish does not maintain a sponsor database |
| 2 | Staff account creation | Admin creates directly with password | Security; no self-registration; admin sets/resets passwords |
| 3 | At-risk threshold | Configurable per cycle (`atRiskThresholdPercent`) | Director may adjust threshold each year |
| 4 | Cycle support | Multi-cycle from day one | One extra FK; avoids painful migration when year 2 arrives |
| 5 | Sacramental records | Separate linked model, admin-only edit | Keeps participant form manageable; sacramental data has its own edit page |
| 6 | Document uploads | Deferred post-MVP | Photo upload covers the highest-value use case; file management adds complexity |
| 7 | Stage suggestions | Deferred post-MVP | Advisory-only feature; low volunteer value vs. implementation cost |
| 8 | Print rosters | CSS print media queries | No server-side PDF library needed |
| 9 | Excel export | Client-side SheetJS | No server overhead; instant download |

---

## 12. Future Enhancements

- Document uploads (baptism cert, marriage doc) linked to sacramental record
- Stage suggestions based on sacramental data (advisory, non-blocking)
- Photo rosters / Avery name-tag print layout
- Participant self-service portal
- QR code or self check-in attendance
- Email / SMS notifications (new registrations, upcoming sessions)
- Offline mode for attendance in poor connectivity environments
- Advanced analytics dashboard (stage distribution, sacrament counts per cycle)
- Diocese reporting export
