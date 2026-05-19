"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";

const TYPES = [
  { value: "", label: "All types" },
  { value: "WEEKLY", label: "Weekly" },
  { value: "REFLECTION", label: "Reflection" },
];

const STATUSES = [
  { value: "", label: "All statuses" },
  { value: "PLANNED", label: "Planned" },
  { value: "COMPLETED", label: "Completed" },
  { value: "CANCELLED", label: "Cancelled" },
];

const selectCls =
  "text-sm border border-gray-300 rounded-lg px-3 py-2 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500";

export function SessionFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const update = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    startTransition(() => {
      router.replace(`/sessions?${params.toString()}`);
    });
  };

  return (
    <div className="flex flex-wrap gap-2">
      <select
        defaultValue={searchParams.get("type") ?? ""}
        onChange={(e) => update("type", e.target.value)}
        className={selectCls}
      >
        {TYPES.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <select
        defaultValue={searchParams.get("status") ?? ""}
        onChange={(e) => update("status", e.target.value)}
        className={selectCls}
      >
        {STATUSES.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}
