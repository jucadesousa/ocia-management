"use client";
import { useRouter, useSearchParams } from "next/navigation";
import type { SessionType } from "@prisma/client";

type Session = {
  id: string;
  number: number;
  type: SessionType;
  date: Date | null;
};

type Props = {
  sessions: Session[];
  selectedSessionId: string | null;
  group: string;
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

export function RosterControls({ sessions, selectedSessionId, group }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set(key, value);
    router.replace(`/reports/roster?${params.toString()}`);
  }

  return (
    <div className="no-print flex flex-wrap items-center gap-3">
      {/* Session selector */}
      <select
        value={selectedSessionId ?? ""}
        onChange={(e) => updateParam("sessionId", e.target.value)}
        className="text-sm border border-gray-300 rounded-lg px-3 py-2 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        {sessions.length === 0 ? (
          <option value="" disabled>
            No sessions available
          </option>
        ) : (
          sessions.map((s) => (
            <option key={s.id} value={s.id}>
              {sessionLabel(s.type, s.number, s.date)}
            </option>
          ))
        )}
      </select>

      {/* Group toggle */}
      <div className="flex rounded-lg border border-gray-300 overflow-hidden text-sm">
        <button
          type="button"
          onClick={() => updateParam("group", "ENGLISH")}
          className={`px-3 py-2 font-medium transition-colors ${
            group === "ENGLISH"
              ? "bg-blue-600 text-white"
              : "bg-white text-gray-700 hover:bg-gray-50"
          }`}
        >
          English
        </button>
        <button
          type="button"
          onClick={() => updateParam("group", "SPANISH")}
          className={`px-3 py-2 font-medium transition-colors border-l border-gray-300 ${
            group === "SPANISH"
              ? "bg-blue-600 text-white"
              : "bg-white text-gray-700 hover:bg-gray-50"
          }`}
        >
          Spanish
        </button>
      </div>

    </div>
  );
}
