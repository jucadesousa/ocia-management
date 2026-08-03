"use client";
import { useActionState } from "react";
import Link from "next/link";
import { createCalendarEvent, updateCalendarEvent, deleteCalendarEvent } from "@/app/actions/settings";
import type { SettingsFormState } from "@/app/actions/settings";
import { useActionToast } from "@/hooks/use-action-toast";
import { CategoryBadge, categoryInfo } from "@/components/calendar/category-badge";
import type { EventCategory } from "@prisma/client";

type CalendarEvent = {
  id: string;
  title: string;
  description: string | null;
  category: EventCategory;
  date: Date;
  time: string | null;
  location: string | null;
  highlight: boolean;
  sortOrder: number;
};

const CATEGORIES: EventCategory[] = [
  "RITE", "HOLY_WEEK", "HOLY_DAY", "FEAST_DAY", "SPECIAL_SERVICE", "SUNDAY_MASS", "TEAM_EVENT", "OTHER",
];

const inputCls =
  "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500";
const labelCls = "block text-sm font-medium text-gray-700 mb-1";

function fmt(date: Date | null): string {
  if (!date) return "";
  return new Date(date).toISOString().split("T")[0];
}

function CalendarEventForm({
  action,
  cycleId,
  defaultValues,
  submitLabel,
}: {
  action: (state: SettingsFormState, formData: FormData) => Promise<SettingsFormState>;
  cycleId: string;
  defaultValues?: Partial<CalendarEvent>;
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState<SettingsFormState, FormData>(
    action,
    undefined
  );
  useActionToast(state);

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="cycleId" value={cycleId} />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <label htmlFor="title" className={labelCls}>
            Title<span className="text-red-500 ml-0.5">*</span>
          </label>
          <input
            id="title" name="title" type="text" required
            placeholder="Rite of Welcoming"
            defaultValue={defaultValues?.title ?? ""}
            className={inputCls}
          />
        </div>
        <div>
          <label htmlFor="category" className={labelCls}>
            Category<span className="text-red-500 ml-0.5">*</span>
          </label>
          <select
            id="category" name="category" required
            defaultValue={defaultValues?.category ?? "SUNDAY_MASS"}
            className={inputCls}
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{categoryInfo(c).label}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="date" className={labelCls}>
            Date<span className="text-red-500 ml-0.5">*</span>
          </label>
          <input
            id="date" name="date" type="date" required
            defaultValue={fmt(defaultValues?.date ?? null)}
            className={inputCls}
          />
        </div>
        <div>
          <label htmlFor="time" className={labelCls}>Time</label>
          <input
            id="time" name="time" type="text"
            placeholder="5:00 PM"
            defaultValue={defaultValues?.time ?? ""}
            className={inputCls}
          />
        </div>
        <div>
          <label htmlFor="location" className={labelCls}>Location</label>
          <input
            id="location" name="location" type="text"
            placeholder="Parish Hall"
            defaultValue={defaultValues?.location ?? ""}
            className={inputCls}
          />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="description" className={labelCls}>Notes</label>
          <textarea
            id="description" name="description" rows={2}
            defaultValue={defaultValues?.description ?? ""}
            className={inputCls}
          />
        </div>
        <div className="sm:col-span-2 flex items-center gap-2">
          <input
            id="highlight" name="highlight" type="checkbox"
            defaultChecked={defaultValues?.highlight ?? false}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <label htmlFor="highlight" className="text-sm text-gray-700">
            Highlight as a milestone event
          </label>
        </div>
      </div>

      <div className="flex gap-3 pt-1">
        <button
          type="submit"
          disabled={pending}
          className="bg-blue-600 text-white text-sm font-medium px-5 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-60 transition-colors"
        >
          {pending ? "Saving…" : submitLabel}
        </button>
        <Link
          href="/settings?tab=calendar"
          className="text-sm text-gray-500 px-5 py-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}

export function CalendarEventsTab({
  cycleId,
  events,
  editId,
}: {
  cycleId: string;
  events: CalendarEvent[];
  editId?: string;
}) {
  const editing = editId ? events.find((e) => e.id === editId) : null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <p className="text-sm text-gray-500">
          Non-session calendar entries — rites, holy days, feast days, special services, and other parish events.
        </p>
        <Link
          href="/calendar"
          target="_blank"
          className="text-sm text-blue-600 hover:text-blue-800 font-medium shrink-0"
        >
          View public calendar ↗
        </Link>
      </div>

      {/* Create / Edit form */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="text-base font-semibold text-gray-900 mb-4">
          {editing ? `Edit: ${editing.title}` : "New Calendar Event"}
        </h2>
        {editing ? (
          <CalendarEventForm
            action={updateCalendarEvent.bind(null, editing.id)}
            cycleId={cycleId}
            defaultValues={editing}
            submitLabel="Save changes"
          />
        ) : (
          <CalendarEventForm action={createCalendarEvent} cycleId={cycleId} submitLabel="Create event" />
        )}
      </div>

      {/* Events list */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-3 bg-gray-50 border-b border-gray-200">
          <h2 className="text-base font-semibold text-gray-900">All Calendar Events</h2>
        </div>

        {events.length === 0 ? (
          <p className="p-6 text-sm text-gray-400 text-center">No calendar events yet.</p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {events.map((e) => (
              <li key={e.id} className="px-5 py-4 flex items-start gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-medium text-gray-900">{e.title}</p>
                    <CategoryBadge category={e.category} />
                    {e.highlight && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-medium">
                        Highlighted
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {new Date(e.date).toLocaleDateString("en-US", { timeZone: "UTC", month: "short", day: "numeric", year: "numeric" })}
                    {e.time && ` · ${e.time}`}
                    {e.location && ` · ${e.location}`}
                  </p>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <Link
                    href={`/settings?tab=calendar&edit=${e.id}`}
                    className="text-xs text-gray-500 hover:text-gray-800 font-medium"
                  >
                    Edit
                  </Link>
                  <form action={deleteCalendarEvent.bind(null, e.id)}>
                    <button
                      type="submit"
                      className="text-xs text-red-500 hover:text-red-700 font-medium"
                    >
                      Delete
                    </button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
