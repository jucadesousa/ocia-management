# OCIA Management System — MVP Requirements Document (v1.0)

## 1. Purpose

This document defines the MVP requirements for a responsive web application to support the OCIA ministry at Saint Bartholomew the Apostle Catholic Church (Katy, TX). The system replaces paper and Excel-based workflows for participant intake, attendance tracking, sacramental monitoring, and reporting.

The system is designed for internal parish use, with a future enhancement for participant self-service access.

---

## 2. Scope

### In Scope (MVP)
- Participant registration (public form + internal entry)
- OCIA lifecycle tracking
- Attendance management
- Session scheduling (flexible)
- Sacramental and document tracking
- Role-based access control
- Reporting (attendance, ministry, operational)

### Out of Scope (MVP)
- Native mobile applications
- Offline mode
- Automated approval workflows
- External diocesan integrations

---

## 3. Users and Roles

### 3.1 Admin (OCIA Director / Parish Staff)
- Full system access
- Manage participants
- Manage sessions
- Update sacramental records
- View all reports
- Edit attendance and participant data

### 3.2 Volunteers / Catechists
- View participants
- Mark attendance
- View session rosters (both groups)
- Cannot modify sacramental data or system configuration

### 3.3 Future Role: Participant
- View own profile only
- Update limited personal information (future phase)

---

## 4. Groups Model

The system supports exactly two fixed groups:

- English OCIA Group
- Spanish OCIA Group

### Rules
- Assigned at registration (required)
- No creation or deletion of groups
- Volunteers may view both groups
- Attendance is recorded per group

---

## 5. Participant Management

### 5.1 Intake Sources
- Public signup form
- Internal staff entry

### 5.2 Default State
- Participant is ACTIVE immediately upon creation
- Default OCIA stage: Inquiry
- Must be assigned to a group (English or Spanish)

### 5.3 Participant Data Fields
- Full name (first, last, maiden, preferred/goes-by)
- Date of birth, place of birth
- Contact information (home phone, work phone, email, full address)
- Spouse name, occupation
- Current religion, marital status
- Baptism status
- Sponsor name (free-text field — parish does not maintain a sponsor database)
- Photo (required for name tags, optional at intake but strongly encouraged)

### 5.4 Sacramental Tracking
- Baptism status and certificate
- First Communion
- Confirmation
- Marriage status
- Annulment status
- Sponsor name (recorded on participant record)
- Rite participation
- Easter Vigil sacraments
- Completion status

### 5.5 Document Management
- Upload and store:
  - Baptism certificates
  - Marriage documents
  - Supporting documents
- Participant photo storage for rosters and name tags

---

## 6. OCIA Lifecycle Management

### Stages
- Inquiry
- Catechumen
- Candidate
- Elect
- Mystagogy
- Completed
- Inactive
- Withdrawn

### Rules
- Admin manually controls status
- System provides suggestions based on sacramental data:
  - Baptized = No → Suggest Catechumen
  - Baptized = Yes → Suggest Candidate
- Suggestions are advisory only (no automatic assignment)

---

## 7. Session Management

### Structure
- 30 weekly OCIA sessions per cycle
- 3–4 Morning of Reflection sessions (Saturdays)

### Session Properties
- Session number (1–30)
- Title/topic (optional)
- Date/time (flexible)
- Type (Weekly / Reflection)
- Status (Planned / Completed / Cancelled)

### Flexibility Rules
- Sessions can be rescheduled freely
- Sessions can be cancelled
- Session number is independent from calendar date
- No audit history required for changes

---

## 8. Attendance System

### Data Model
Attendance is recorded as:

Participant + Session + Group + Status

### Status Options
- Present
- Absent
- Late
- Left Early
- Excused

### Workflow (MVP)
- Volunteer selects session
- Selects group view
- Marks attendance using roster list (Excel replacement)
- Search available for exceptions

### Constraints
- Volunteers can view both groups
- Attendance editable by Admin
- Group separation is logical, not restrictive

---

## 9. Reporting

### 9.1 Attendance Reports (High Priority)
- Attendance per session (by group)
- Attendance per participant
- Attendance percentage per participant
- Status breakdown
- Export to Excel

### 9.2 Ministry Reports (High Priority)
- Participants by OCIA stage
- Missing documents report
- At-risk participants (low attendance)
- Sacrament readiness indicators (admin-reviewed)

### 9.3 Operational Reports (High Priority)
- Printable session rosters
- Photo rosters for name tags
- Group contact lists
- Volunteer attendance sheets

### 9.4 Parish / Diocese Reports (Low Priority)
- Total participants per cycle
- Stage distribution
- Sacrament counts
- Completion statistics

---

## 10. System Requirements

### Platform
- Responsive web application
- Mobile-first design
- Works on phone, tablet, and desktop

### Access
- Authentication required for staff
- Role-based permissions

### Performance
- Supports ~150+ participants per cycle

### Usability
- Fast attendance marking (critical requirement)
- Minimal clicks for volunteers
- Photo-enabled rosters recommended

---

## 11. Key Design Principles

- Replace Excel-based workflows
- Optimize for real-world parish volunteer usage
- Admin-controlled flexibility (no rigid workflows)
- Mobile-first attendance experience
- Parish operational reality over theoretical process design

---

## 12. Future Enhancements (Out of Scope MVP)

- Participant self-service portal
- QR code attendance
- Self check-in
- Sponsor portal
- Notifications (email/SMS)
- Offline mode
- Advanced analytics dashboards

