"use client";
import { useRouter, useSearchParams } from "next/navigation";
import type { SessionType, SessionStatus } from "@prisma/client";

type Session = {
  id: string;
  number: number;
  type: SessionType;
  date: Date | null;
  status: SessionStatus;
};

type Props = {
  sessions: Session[];
  selectedId: string | null;
};

function formatDate(date: Date | null): string {
  if (!date) return "(no date)";
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function sessionLabel(type: SessionType, number: number, date: Date | null): string {
  const prefix = type === "WEEKLY" ? `Session ${number}` : `Reflection ${number}`;
  return `${prefix} — ${formatDate(date)}`;
}

export function SessionSelector({ sessions, selectedId }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("sessionId", e.target.value);
    router.replace(`/attendance?${params.toString()}`);
  }

  return (
    <select
      value={selectedId ?? ""}
      onChange={handleChange}
      className="text-sm border border-gray-300 rounded-lg px-3 py-2 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-auto"
    >
      {sessions.length === 0 && (
        <option value="" disabled>
          No sessions available
        </option>
      )}
      {sessions.map((s) => (
        <option key={s.id} value={s.id}>
          {sessionLabel(s.type, s.number, s.date)}
        </option>
      ))}
    </select>
  );
}
