import Link from "next/link";
import { requireAuth } from "@/lib/dal";
import { BarChart2, ClipboardList, Phone, Layers, CalendarDays, Send, Copy, AlertTriangle } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export default async function ReportsPage() {
  const user = await requireAuth();

  const cards: { href: string; title: string; description: string; badge: string; icon: LucideIcon }[] = [
    {
      href: "/reports/attendance",
      title: "Attendance Report",
      description:
        "At-risk participants, per-session summaries, and attendance percentages. Exportable to Excel.",
      badge: "Excel export",
      icon: BarChart2,
    },
    {
      href: "/reports/roster",
      title: "Session Roster",
      description:
        "Printable participant roster for a session. Includes a blank volunteer attendance sheet.",
      badge: "Printable",
      icon: ClipboardList,
    },
    {
      href: "/reports/sessions",
      title: "Session Schedule",
      description:
        "Full list of sessions for the cycle with their dates, presenters, and status.",
      badge: "All sessions",
      icon: CalendarDays,
    },
    {
      href: "/reports/contacts",
      title: "Contact List",
      description:
        "Phone and email for all active participants, filterable by group.",
      badge: "Print · Excel",
      icon: Phone,
    },
    {
      href: "/reports/flocknote",
      title: "Flocknote Export",
      description:
        "First name, last name, email, and phone for active participants, formatted for Flocknote's bulk import.",
      badge: "Excel export",
      icon: Send,
    },
    {
      href: "/reports/ministry",
      title: "Ministry Overview",
      description:
        "Stage distribution, missing documents, and sacrament readiness.",
      badge: "Excel export",
      icon: Layers,
    },
    {
      href: "/reports/duplicates",
      title: "Duplicate Participants",
      description:
        "Groups participants who share an email, phone, or name so you can spot repeat registrations and decide which record to keep.",
      badge: "Excel export",
      icon: Copy,
    },
    ...(user.role === "ADMIN"
      ? [
          {
            href: "/reports/data-quality",
            title: "Data Quality",
            description:
              "Active participants whose record has an internal inconsistency, such as a marital status that doesn't match the sacramental record.",
            badge: "Excel export",
            icon: AlertTriangle,
          },
        ]
      : []),
  ];

  return (
    <div className="p-6 space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Select a report to view or export.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
        {cards.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="block bg-white rounded-xl border border-gray-200 p-5 hover:border-blue-300 hover:shadow-md transition-all"
          >
            <div className="flex flex-col h-full gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <card.icon size={20} className="text-blue-500 shrink-0" />
                  <p className="text-base font-semibold text-gray-900">{card.title}</p>
                </div>
                <p className="text-sm text-gray-500">{card.description}</p>
              </div>
              <div className="flex justify-end">
                <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">
                  {card.badge}
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
