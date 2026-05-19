import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAuth } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import type { SessionStatus, SessionType } from "@prisma/client";

type Props = { params: Promise<{ id: string }> };

const statusBadge: Record<SessionStatus, string> = {
  PLANNED:   "bg-gray-100 text-gray-600",
  COMPLETED: "bg-green-100 text-green-700",
  CANCELLED: "bg-red-100 text-red-600",
};

const statusLabel: Record<SessionStatus, string> = {
  PLANNED:   "Planned",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

function sessionLabel(type: SessionType, number: number): string {
  return type === "WEEKLY" ? `Session ${number}` : `Reflection ${number}`;
}

function formatDate(date: Date | null): string {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default async function SessionDetailPage({ params }: Props) {
  const user = await requireAuth();
  const { id } = await params;
  const isAdmin = user.role === "ADMIN";

  const session = await prisma.session.findUnique({
    where: { id },
    include: { cycle: { select: { name: true } } },
  });

  if (!session) notFound();

  const label = sessionLabel(session.type, session.number);

  return (
    <div className="p-6 max-w-2xl space-y-6">
      <nav className="text-sm text-gray-500 flex items-center gap-1.5">
        <Link href="/sessions" className="hover:text-blue-600">
          Sessions
        </Link>
        <span>/</span>
        <span className="text-gray-900">{label}</span>
      </nav>

      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-gray-900">{label}</h1>
          <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${statusBadge[session.status]}`}>
            {statusLabel[session.status]}
          </span>
        </div>
        {isAdmin && (
          <Link
            href={`/sessions/${id}/edit`}
            className="text-sm font-medium px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors whitespace-nowrap"
          >
            Edit
          </Link>
        )}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
        {[
          { label: "Title", value: session.title ?? "—" },
          { label: "Presenter", value: session.presenter ?? "—" },
          { label: "Date", value: formatDate(session.date) },
          { label: "Type", value: session.type === "WEEKLY" ? "Weekly" : "Reflection" },
          { label: "Status", value: statusLabel[session.status] },
          { label: "Cycle", value: session.cycle.name },
        ].map(({ label: rowLabel, value }) => (
          <div key={rowLabel} className="flex px-4 py-3 text-sm">
            <span className="w-36 font-medium text-gray-500 shrink-0">{rowLabel}</span>
            <span className="text-gray-900">{value}</span>
          </div>
        ))}
      </div>

      <div>
        <h2 className="text-base font-semibold text-gray-900 mb-3">Attendance</h2>
        <div className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-6 text-center text-sm text-gray-500">
          Attendance marking is available in the Attendance section.
        </div>
      </div>
    </div>
  );
}
