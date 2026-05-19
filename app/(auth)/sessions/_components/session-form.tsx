"use client";
import { useActionState } from "react";
import type { SessionFormState } from "@/app/actions/sessions";

type Props = {
  action: (state: SessionFormState, formData: FormData) => Promise<SessionFormState>;
  defaultValues?: {
    number?: number | null;
    title?: string | null;
    presenter?: string | null;
    date?: Date | null;
    type?: string | null;
    status?: string | null;
  };
};

const inputCls =
  "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500";
const labelCls = "block text-sm font-medium text-gray-700 mb-1";

export function SessionForm({ action, defaultValues: d }: Props) {
  const [state, formAction, pending] = useActionState(action, undefined);

  const dateDefault = d?.date ? new Date(d.date).toISOString().split("T")[0] : "";

  return (
    <form action={formAction} className="space-y-8">
      {state?.error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-200 px-4 py-3 rounded-lg">
          {state.error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="number" className={labelCls}>
            Session number<span className="text-red-500 ml-0.5">*</span>
          </label>
          <input
            id="number"
            name="number"
            type="number"
            required
            min={1}
            max={99}
            defaultValue={d?.number ?? ""}
            className={inputCls}
          />
        </div>

        <div>
          <label htmlFor="title" className={labelCls}>
            Title
          </label>
          <input
            id="title"
            name="title"
            type="text"
            defaultValue={d?.title ?? ""}
            className={inputCls}
          />
        </div>

        <div>
          <label htmlFor="presenter" className={labelCls}>
            Presenter
          </label>
          <input
            id="presenter"
            name="presenter"
            type="text"
            placeholder="e.g. Fr. Michael"
            defaultValue={d?.presenter ?? ""}
            className={inputCls}
          />
        </div>

        <div>
          <label htmlFor="date" className={labelCls}>
            Date
          </label>
          <input
            id="date"
            name="date"
            type="date"
            defaultValue={dateDefault}
            className={inputCls}
          />
        </div>

        <div>
          <label htmlFor="type" className={labelCls}>
            Type<span className="text-red-500 ml-0.5">*</span>
          </label>
          <select
            id="type"
            name="type"
            required
            defaultValue={d?.type ?? "WEEKLY"}
            className={inputCls}
          >
            <option value="WEEKLY">Weekly</option>
            <option value="REFLECTION">Reflection</option>
          </select>
        </div>

        <div>
          <label htmlFor="status" className={labelCls}>
            Status<span className="text-red-500 ml-0.5">*</span>
          </label>
          <select
            id="status"
            name="status"
            required
            defaultValue={d?.status ?? "PLANNED"}
            className={inputCls}
          >
            <option value="PLANNED">Planned</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={pending}
          className="bg-blue-600 text-white text-sm font-medium px-5 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-60 transition-colors"
        >
          {pending ? "Saving…" : "Save session"}
        </button>
        <a
          href="/sessions"
          className="text-sm text-gray-500 px-5 py-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          Cancel
        </a>
      </div>
    </form>
  );
}
