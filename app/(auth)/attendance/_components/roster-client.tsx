"use client";
import { useActionState, useState, useEffect, useCallback } from "react";
import { saveAttendance } from "@/app/actions/attendance";
import type { AttendanceFormState } from "@/app/actions/attendance";

type Participant = {
  id: string;
  fullName: string;
  preferredName: string | null;
};

type Props = {
  sessionId: string;
  group: "ENGLISH" | "SPANISH";
  participants: Participant[];
  initialStatuses: Record<string, string>;
};

const STATUS_CYCLE = ["ABSENT", "PRESENT", "LATE", "LEFT_EARLY", "EXCUSED"] as const;

const STATUS_LABELS: Record<string, string> = {
  PRESENT: "Present",
  ABSENT: "Absent",
  LATE: "Late",
  LEFT_EARLY: "Left early",
  EXCUSED: "Excused",
};

const STATUS_BADGE: Record<string, string> = {
  PRESENT: "bg-green-100 text-green-700",
  ABSENT: "bg-gray-100 text-gray-500",
  LATE: "bg-yellow-100 text-yellow-700",
  LEFT_EARLY: "bg-orange-100 text-orange-700",
  EXCUSED: "bg-blue-100 text-blue-700",
};

function getInitials(fullName: string): string {
  const parts = fullName.split(" ");
  const first = parts[0]?.[0] ?? "";
  const last = parts[parts.length - 1]?.[0] ?? "";
  return (first + (parts.length > 1 ? last : "")).toUpperCase();
}

export function RosterClient({ sessionId, group, participants, initialStatuses }: Props) {
  const [state, formAction, pending] = useActionState<AttendanceFormState, FormData>(
    saveAttendance,
    undefined
  );

  const [statuses, setStatuses] = useState<Record<string, string>>(initialStatuses);
  const [savedStatuses, setSavedStatuses] = useState<Record<string, string>>(initialStatuses);
  const [search, setSearch] = useState("");

  const hasChanges = JSON.stringify(statuses) !== JSON.stringify(savedStatuses);

  // Reset statuses when the session changes
  useEffect(() => {
    setStatuses(initialStatuses);
    setSavedStatuses(initialStatuses);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  // After a successful save, update the baseline
  useEffect(() => {
    if (state?.saved) {
      setSavedStatuses({ ...statuses });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state?.saved]);

  // Warn on unsaved changes
  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => {
      if (hasChanges) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [hasChanges]);

  const cycleStatus = useCallback((participantId: string) => {
    setStatuses((prev) => {
      const current = prev[participantId] ?? "ABSENT";
      const idx = STATUS_CYCLE.indexOf(current as typeof STATUS_CYCLE[number]);
      const next = STATUS_CYCLE[(idx + 1) % STATUS_CYCLE.length];
      return { ...prev, [participantId]: next };
    });
  }, []);

  const lowerSearch = search.toLowerCase();
  const filtered = participants.filter((p) => {
    if (!search) return true;
    return (
      p.fullName.toLowerCase().includes(lowerSearch) ||
      (p.preferredName?.toLowerCase().includes(lowerSearch) ?? false)
    );
  });

  return (
    <form action={formAction}>
      <input type="hidden" name="sessionId" value={sessionId} />
      <input type="hidden" name="group" value={group} />
      {participants.map((p) => (
        <input
          key={p.id}
          type="hidden"
          name={`s_${p.id}`}
          value={statuses[p.id] ?? "ABSENT"}
        />
      ))}

      {/* Search */}
      <div className="px-4 pt-3 pb-2">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search participants…"
          className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Error banner */}
      {state?.error && (
        <div className="mx-4 mb-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {state.error}
        </div>
      )}

      {/* Roster list */}
      <div>
        {filtered.map((p) => {
          const status = statuses[p.id] ?? "ABSENT";
          const badgeClass = STATUS_BADGE[status] ?? STATUS_BADGE.ABSENT;
          const label = STATUS_LABELS[status] ?? status;

          return (
            <button
              key={p.id}
              type="button"
              onClick={() => cycleStatus(p.id)}
              className="w-full flex items-center gap-3 px-4 py-4 hover:bg-gray-50 active:bg-gray-100 transition-colors border-b border-gray-100 last:border-0 text-left"
            >
              <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-sm font-semibold shrink-0">
                {getInitials(p.fullName)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900">{p.fullName}</p>
                {p.preferredName && (
                  <p className="text-xs text-gray-500">&ldquo;{p.preferredName}&rdquo;</p>
                )}
              </div>
              <span className={`shrink-0 text-xs font-medium px-2.5 py-1 rounded-full ${badgeClass}`}>
                {label}
              </span>
            </button>
          );
        })}

        {filtered.length === 0 && (
          <p className="text-sm text-gray-400 text-center py-8">No participants found.</p>
        )}
      </div>

      {/* Sticky save bar */}
      <div className="sticky bottom-0 bg-white border-t border-gray-200 px-4 py-3 flex items-center justify-between gap-3">
        <div className="text-xs text-gray-500">
          {state?.saved && !hasChanges ? "Saved" : hasChanges ? "Unsaved changes" : ""}
        </div>
        <button
          type="submit"
          disabled={pending || !hasChanges}
          className="bg-blue-600 text-white text-sm font-medium px-6 py-2.5 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {pending ? "Saving…" : "Save attendance"}
        </button>
      </div>
    </form>
  );
}
