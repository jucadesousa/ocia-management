import Link from "next/link";
import { requireAuth } from "@/lib/dal";

type Props = { searchParams: Promise<{ tab?: string }> };

// ── Shared prose helpers ────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="text-base font-semibold text-gray-900 border-b border-gray-100 pb-2">{title}</h2>
      {children}
    </section>
  );
}

function P({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-gray-700 leading-relaxed">{children}</p>;
}

function UL({ children }: { children: React.ReactNode }) {
  return <ul className="space-y-1.5 pl-4">{children}</ul>;
}

function LI({ children }: { children: React.ReactNode }) {
  return (
    <li className="text-sm text-gray-700 leading-relaxed list-disc list-outside">
      {children}
    </li>
  );
}

function Note({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-blue-50 border border-blue-100 rounded-lg px-4 py-3 text-sm text-blue-800 leading-relaxed">
      {children}
    </div>
  );
}

function Badge({ label, color }: { label: string; color: string }) {
  return (
    <span className={`inline-block text-xs px-2 py-0.5 rounded-full font-medium ${color}`}>
      {label}
    </span>
  );
}

function KV({ term, children }: { term: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[auto,1fr] gap-x-3 gap-y-0 items-baseline">
      <dt className="text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{term}</dt>
      <dd className="text-sm text-gray-700 leading-relaxed">{children}</dd>
    </div>
  );
}

// ── Tab content ─────────────────────────────────────────────────────────────

function OverviewTab() {
  return (
    <div className="space-y-6">
      <Section title="What is Lumen Catholic?">
        <P>
          Lumen Catholic is a parish tool for tracking adults through the Order of Christian Initiation of Adults (OCIA) — formerly known as RCIA. It covers the full journey from initial enrollment through the Easter Vigil, with tools for participant records, weekly attendance, sacramental history, and reporting.
        </P>
      </Section>

      <Section title="Key concepts">
        <dl className="space-y-3">
          <KV term="Cycle">
            A single OCIA year (e.g. 2026–2027). Each cycle has its own set of participants and sessions. Only one cycle is active at a time.
          </KV>
          <KV term="Session">
            A meeting within the cycle — either a <strong>Weekly</strong> session or a <strong>Reflection</strong> day. Sessions have a date, a number, and a status (Planned, Active, Completed, or Cancelled).
          </KV>
          <KV term="Participant">
            An adult enrolled in the current cycle. Each participant belongs to a language group (English or Spanish), has a status (Active, Withdrawn, On Hold), and has a sacramental record that determines their OCIA Profile.
          </KV>
          <KV term="OCIA Profile">
            A computed label based on the participant's sacramental data — baptism type, First Communion, and Confirmation. It updates automatically when the sacramental record changes.
          </KV>
        </dl>
      </Section>

      <Section title="OCIA Profile labels">
        <P>These labels are assigned automatically — no manual update needed.</P>
        <div className="space-y-2 mt-1">
          {[
            { label: "Catechumen", color: "bg-purple-100 text-purple-700", desc: "Never baptized. Seeking baptism, first communion, and confirmation." },
            { label: "Candidate", color: "bg-blue-100 text-blue-700", desc: "Validly baptized in another Christian tradition. Seeking full communion." },
            { label: "Candidate (Baptism Unverified)", color: "bg-yellow-100 text-yellow-700", desc: "Baptism in another tradition not yet verified." },
            { label: "Candidate for Sacraments", color: "bg-orange-100 text-orange-700", desc: "Catholic baptized, but has not received First Communion or Confirmation." },
            { label: "Catholic Candidate", color: "bg-teal-100 text-teal-700", desc: "Catholic baptized and has First Communion, but not yet Confirmation." },
            { label: "Fully Initiated", color: "bg-green-100 text-green-700", desc: "Has received all three sacraments of initiation." },
          ].map(({ label, color, desc }) => (
            <div key={label} className="flex items-start gap-3">
              <div className="pt-0.5 shrink-0"><Badge label={label} color={color} /></div>
              <p className="text-sm text-gray-600">{desc}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section title="User roles">
        <dl className="space-y-3">
          <KV term="Admin">
            Full access. Can create and edit participants, manage sessions, take attendance, view all reports, print badges, and manage users and settings.
          </KV>
          <KV term="Volunteer">
            Attendance and reporting access. Can take attendance and view reports. Cannot view or edit participant records, manage sessions, or access settings.
          </KV>
        </dl>
      </Section>
    </div>
  );
}

function ParticipantsTab() {
  return (
    <div className="space-y-6">
      <Section title="Enrolling a new participant">
        <P>
          Participants can join the system two ways:
        </P>
        <UL>
          <LI>
            <strong>Self-registration:</strong> A public registration form is available for prospective participants to fill out on their own device. Admins can find the link in <strong>Settings → Registration</strong>. Submitted forms create a new participant record immediately.
          </LI>
          <LI>
            <strong>Manual entry:</strong> Admins can create a participant directly from the <strong>Participants</strong> page using the <em>New participant</em> button.
          </LI>
        </UL>
      </Section>

      <Section title="Participant status">
        <dl className="space-y-3">
          <KV term="Active">Currently enrolled and attending. Appears in attendance sheets and reports.</KV>
          <KV term="On Hold">Temporarily paused. Excluded from attendance sheets but still visible in the participant list.</KV>
          <KV term="Withdrawn">Left the program. Excluded from attendance and most reports.</KV>
        </dl>
      </Section>

      <Section title="Groups">
        <P>
          Each participant belongs to either the <strong>English</strong> or <strong>Spanish</strong> group. Sessions, attendance sheets, and the blank volunteer sheet are all filtered by group.
        </P>
      </Section>

      <Section title="Participant profile tabs">
        <dl className="space-y-3">
          <KV term="Profile">Personal details: name, contact info, address, sponsor, notes, and current OCIA placement (stage, group, status).</KV>
          <KV term="Sacramental">Baptism details, First Communion and Confirmation status, marriage info, and OCIA milestone dates (Rite of Acceptance, Election, Easter Vigil, Completion).</KV>
          <KV term="Attendance">A full history of sessions recorded for this participant, with status and date for each.</KV>
        </dl>
      </Section>

      <Section title="The OCIA Profile badge">
        <P>
          The colored badge shown in the participant header and list is computed automatically from the sacramental record. To update it, edit the participant's sacramental record and set the correct <strong>Baptism type</strong>, <strong>First Communion</strong>, and <strong>Confirmation</strong> values. The badge will reflect the change immediately.
        </P>
        <Note>
          The <strong>Baptism type</strong> field drives the profile label — not the simple "Baptized?" yes/no field. Make sure to select the correct type (Catholic, Other Christian — valid, Other Christian — unverified, or Not baptized).
        </Note>
      </Section>
    </div>
  );
}

function AttendanceTab() {
  return (
    <div className="space-y-6">
      <Section title="Taking attendance">
        <P>
          Navigate to <strong>Attendance</strong> in the sidebar. Use the session selector at the top to choose the session you are recording. The roster lists all active participants in the selected group.
        </P>
        <P>
          Tap or click the status button next to each participant to cycle through statuses, or use the quick-mark buttons at the top to set all participants at once.
        </P>
      </Section>

      <Section title="Attendance codes">
        <dl className="space-y-2">
          <KV term="P — Present">Attended the session.</KV>
          <KV term="A — Absent">Did not attend with no prior notice.</KV>
          <KV term="E — Excused">Notified in advance and had a valid reason.</KV>
        </dl>
      </Section>

      <Section title="Volunteer workflow">
        <P>
          If a volunteer is taking attendance on paper first and entering it later:
        </P>
        <UL>
          <LI>Go to <strong>Reports → Roster</strong> and print the <em>Blank Volunteer Sheet</em> for the correct session and group.</LI>
          <LI>Volunteers use the sheet during the session, marking P / A / E for each name.</LI>
          <LI>After the session, an admin or volunteer enters the marks into the system under <strong>Attendance</strong>.</LI>
        </UL>
      </Section>

      <Section title="Switching groups">
        <P>
          The attendance page shows one language group at a time. Use the <strong>English / Spanish</strong> toggle at the top of the page to switch between groups.
        </P>
      </Section>

      <Note>
        Changes are not saved until you click <strong>Save attendance</strong> at the bottom of the page. If you navigate away with unsaved changes, the browser will warn you before leaving.
      </Note>
    </div>
  );
}

function ReportsTab() {
  return (
    <div className="space-y-6">
      <Section title="Available reports">
        <dl className="space-y-3">
          <KV term="Attendance">
            A full grid showing every active participant as a row and every session as a column. The OCIA Profile badge is shown for each participant. Attendance totals are calculated per participant and per session. Exportable to Excel.
          </KV>
          <KV term="Roster">
            Two sections: the <em>Session Roster</em> (attendance status for a selected session) and the <em>Blank Volunteer Sheet</em> (a printable sign-in table with checkboxes for P / A / E). Names are listed Last, First.
          </KV>
          <KV term="Session Schedule">
            A full list of sessions for the current cycle with their title, presenter, date, and status. Visible to volunteers as well as admins, since the <strong>Sessions</strong> management page in the sidebar is admin-only.
          </KV>
          <KV term="Ministry">
            Lists participants alongside their sponsor and family information. Useful for ministry team coordination.
          </KV>
          <KV term="Contacts">
            A contact directory for all active participants, including phone numbers and email addresses. Exportable to Excel.
          </KV>
        </dl>
      </Section>

      <Section title="Filtering reports">
        <P>
          All reports can be filtered by <strong>language group</strong> (English / Spanish) and, where applicable, by <strong>session</strong>. Use the controls at the top of each report page to adjust the view before printing or exporting.
        </P>
      </Section>

      <Section title="Exporting to Excel">
        <P>
          The <strong>Attendance</strong> and <strong>Contacts</strong> reports have an <em>Export to Excel</em> button. The file downloads immediately and includes all data currently shown on screen, respecting any active filters.
        </P>
      </Section>

      <Section title="Printing">
        <P>
          Any report can be printed using the browser's print function or the <em>Print</em> button where available. The navigation sidebar and toolbar are hidden automatically when printing, leaving only the report content.
        </P>
      </Section>
    </div>
  );
}

function SessionsTab() {
  return (
    <div className="space-y-6">
      <Section title="Session types">
        <dl className="space-y-3">
          <KV term="Weekly">Regular weekly catechesis sessions, typically numbered sequentially through the cycle.</KV>
          <KV term="Reflection">Retreat or reflection days. Numbered separately from weekly sessions.</KV>
        </dl>
      </Section>

      <Section title="Session statuses">
        <dl className="space-y-3">
          <KV term="Planned">Scheduled but not yet started. Shown in the session selector on the attendance page.</KV>
          <KV term="Active">Currently in progress.</KV>
          <KV term="Completed">Session has ended. Attendance records are final.</KV>
          <KV term="Cancelled">Session did not take place. Excluded from attendance grids and volunteer sheets.</KV>
        </dl>
      </Section>

      <Section title="Managing sessions">
        <P>
          Go to <strong>Sessions</strong> in the sidebar to view, create, edit, or cancel sessions. Sessions are created per cycle and should be set up at the beginning of the year with estimated dates.
        </P>
        <P>
          If a session needs to be rescheduled or cancelled (e.g. holiday break), update its status to <em>Cancelled</em> so it disappears from attendance sheets, then create a makeup session if needed.
        </P>
        <Note>
          Session order in reports and attendance grids follows the session date when a date is set, falling back to session number. Makeup sessions added mid-cycle will slot into the correct chronological position automatically once a date is assigned.
        </Note>
      </Section>
    </div>
  );
}

function BadgesTab() {
  return (
    <div className="space-y-6">
      <Section title="Overview">
        <P>
          The badge system generates printable name badges for participants using their photo and name. Badges are printed 8 per sheet (2 columns × 4 rows) on standard letter paper with corner cut marks.
        </P>
      </Section>

      <Section title="Prerequisites">
        <P>
          A participant must have a photo on file to appear in the badge print queue. To upload a photo:
        </P>
        <UL>
          <LI>Open the participant's detail page.</LI>
          <LI>Tap the avatar area or use the photo upload button that appears on the profile.</LI>
          <LI>Select a JPEG, PNG, WebP, or HEIC image. iPhone photos work directly.</LI>
        </UL>
      </Section>

      <Section title="Printing workflow">
        <UL>
          <LI>Go to <strong>Badges</strong> in the sidebar. The page shows participants with photos who have not yet been printed.</LI>
          <LI>Review the list and deselect any participants you do not want to print in this batch.</LI>
          <LI>Click <em>Print badges</em>. The print preview will open with all selected participants laid out across as many sheets as needed.</LI>
          <LI>Send to printer. Cut marks appear at each badge corner to guide trimming.</LI>
          <LI>After printing, click <em>Mark all as printed &amp; go back</em>. Those participants will move out of the unprinted queue.</LI>
        </UL>
      </Section>

      <Note>
        If you close the print page without marking as printed, the participants will remain in the queue and can be reprinted. Use <em>Mark all as printed</em> only after confirming the print was successful.
      </Note>
    </div>
  );
}

function SettingsTab() {
  return (
    <div className="space-y-6">
      <Section title="Users">
        <P>
          Manage admin and volunteer accounts under <strong>Settings → Users</strong>. You can invite new users, change roles, reset passwords, and deactivate accounts.
        </P>
        <P>
          There are two roles: <strong>Admin</strong> (full access) and <strong>Volunteer</strong> (attendance and reporting access). Assign the minimum role needed — volunteers cannot view or edit participant records, manage sessions, or access settings.
        </P>
      </Section>

      <Section title="Cycles">
        <P>
          Each OCIA year is a <em>Cycle</em>. Go to <strong>Settings → Cycles</strong> to view past cycles and start a new one at the beginning of each year.
        </P>
        <P>
          Starting a new cycle does not delete previous participant data — all records are preserved and remain accessible in reports. Only one cycle is marked as current at a time.
        </P>
      </Section>

      <Section title="Registration form">
        <P>
          A public self-registration form is available for prospective participants. Go to <strong>Settings → Registration</strong> to find the shareable link. This link can be posted on the parish website or shared directly with inquirers.
        </P>
        <P>
          Submitted registrations are immediately added as participants in the current cycle with a status of <em>Active</em>. Review new registrations in the <strong>Participants</strong> list and complete their sacramental record.
        </P>
      </Section>
    </div>
  );
}

// ── Page ────────────────────────────────────────────────────────────────────

export default async function DocsPage({ searchParams }: Props) {
  const user = await requireAuth();
  const { tab = "overview" } = await searchParams;
  const isAdmin = user.role === "ADMIN";

  const tabs = [
    { key: "overview",   label: "Overview" },
    { key: "attendance", label: "Attendance" },
    { key: "reports",    label: "Reports" },
    ...(isAdmin ? [
      { key: "participants", label: "Participants" },
      { key: "sessions",     label: "Sessions" },
      { key: "badges",       label: "Badges" },
      { key: "settings",     label: "Settings" },
    ] : []),
  ];

  const activeTab = tabs.find((t) => t.key === tab)?.key ?? "overview";

  return (
    <div className="p-6 max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Documentation</h1>
        <p className="text-sm text-gray-500 mt-1">How to use Lumen Catholic</p>
      </div>

      {/* Tab bar — horizontally scrollable on mobile */}
      <div className="border-b border-gray-200 -mx-6 px-6 overflow-x-auto">
        <nav className="flex gap-1 -mb-px min-w-max">
          {tabs.map(({ key, label }) => (
            <Link
              key={key}
              href={`/docs?tab=${key}`}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === key
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              {label}
            </Link>
          ))}
        </nav>
      </div>

      {/* Content */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 sm:p-6">
        {activeTab === "overview"     && <OverviewTab />}
        {activeTab === "attendance"   && <AttendanceTab />}
        {activeTab === "reports"      && <ReportsTab />}
        {isAdmin && activeTab === "participants" && <ParticipantsTab />}
        {isAdmin && activeTab === "sessions"     && <SessionsTab />}
        {isAdmin && activeTab === "badges"       && <BadgesTab />}
        {isAdmin && activeTab === "settings"     && <SettingsTab />}
      </div>
    </div>
  );
}
