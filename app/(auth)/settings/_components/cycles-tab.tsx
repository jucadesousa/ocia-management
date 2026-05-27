"use client";
import { useActionState } from "react";
import Link from "next/link";
import { createCycle, updateCycle, setCurrentCycle } from "@/app/actions/settings";
import type { SettingsFormState } from "@/app/actions/settings";
import { useActionToast } from "@/hooks/use-action-toast";

type Cycle = {
  id: string;
  name: string;
  year: number;
  isCurrent: boolean;
  startDate: Date | null;
  endDate: Date | null;
  atRiskThresholdPercent: number;
};

const inputCls =
  "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500";
const labelCls = "block text-sm font-medium text-gray-700 mb-1";

function fmt(date: Date | null): string {
  if (!date) return "";
  return new Date(date).toISOString().split("T")[0];
}

function CycleForm({
  action,
  defaultValues,
  submitLabel,
}: {
  action: (state: SettingsFormState, formData: FormData) => Promise<SettingsFormState>;
  defaultValues?: Partial<Cycle>;
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState<SettingsFormState, FormData>(
    action,
    undefined
  );
  useActionToast(state);

  return (
    <form action={formAction} className="space-y-4">

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="name" className={labelCls}>
            Cycle name<span className="text-red-500 ml-0.5">*</span>
          </label>
          <input
            id="name" name="name" type="text" required
            placeholder="OCIA 2025–2026"
            defaultValue={defaultValues?.name ?? ""}
            className={inputCls}
          />
        </div>
        <div>
          <label htmlFor="year" className={labelCls}>
            Graduation year<span className="text-red-500 ml-0.5">*</span>
          </label>
          <input
            id="year" name="year" type="number" required
            placeholder="2026"
            defaultValue={defaultValues?.year ?? ""}
            className={inputCls}
          />
        </div>
        <div>
          <label htmlFor="startDate" className={labelCls}>Start date</label>
          <input
            id="startDate" name="startDate" type="date"
            defaultValue={fmt(defaultValues?.startDate ?? null)}
            className={inputCls}
          />
        </div>
        <div>
          <label htmlFor="endDate" className={labelCls}>End date</label>
          <input
            id="endDate" name="endDate" type="date"
            defaultValue={fmt(defaultValues?.endDate ?? null)}
            className={inputCls}
          />
        </div>
        <div>
          <label htmlFor="atRiskThresholdPercent" className={labelCls}>
            At-risk threshold (%)
          </label>
          <input
            id="atRiskThresholdPercent" name="atRiskThresholdPercent"
            type="number" min={1} max={100}
            defaultValue={defaultValues?.atRiskThresholdPercent ?? 75}
            className={inputCls}
          />
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
          href="/settings?tab=cycles"
          className="text-sm text-gray-500 px-5 py-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}

export function CyclesTab({
  cycles,
  editId,
}: {
  cycles: Cycle[];
  editId?: string;
}) {
  const editing = editId ? cycles.find((c) => c.id === editId) : null;

  return (
    <div className="space-y-6">
      {/* Create / Edit form */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="text-base font-semibold text-gray-900 mb-4">
          {editing ? `Edit: ${editing.name}` : "New Cycle"}
        </h2>
        {editing ? (
          <CycleForm
            action={updateCycle.bind(null, editing.id)}
            defaultValues={editing}
            submitLabel="Save changes"
          />
        ) : (
          <CycleForm action={createCycle} submitLabel="Create cycle" />
        )}
      </div>

      {/* Cycles list */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-3 bg-gray-50 border-b border-gray-200">
          <h2 className="text-base font-semibold text-gray-900">All Cycles</h2>
        </div>

        {cycles.length === 0 ? (
          <p className="p-6 text-sm text-gray-400 text-center">No cycles yet.</p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {cycles.map((c) => (
              <li key={c.id} className="px-5 py-4 flex items-start gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-gray-900">{c.name}</p>
                    {c.isCurrent && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-medium">
                        Current
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Year {c.year} · At-risk threshold: {c.atRiskThresholdPercent}%
                    {c.startDate && ` · Starts ${new Date(c.startDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`}
                  </p>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  {!c.isCurrent && (
                    <form action={setCurrentCycle.bind(null, c.id)}>
                      <button
                        type="submit"
                        className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                      >
                        Set current
                      </button>
                    </form>
                  )}
                  <Link
                    href={`/settings?tab=cycles&edit=${c.id}`}
                    className="text-xs text-gray-500 hover:text-gray-800 font-medium"
                  >
                    Edit
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
