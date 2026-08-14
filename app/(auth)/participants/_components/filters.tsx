"use client";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useTransition, useCallback } from "react";

const GROUPS = [
  { value: "", label: "All groups" },
  { value: "ENGLISH", label: "English" },
  { value: "SPANISH", label: "Spanish" },
];

const PROFILES = [
  { value: "", label: "All profiles" },
  { value: "catechumen", label: "Catechumen" },
  { value: "candidate_unverified", label: "Candidate (Baptism Unverified)" },
  { value: "candidate", label: "Candidate" },
  { value: "candidate_for_sacraments", label: "Candidate for Sacraments" },
  { value: "candidate_for_confirmation", label: "Catholic Candidate" },
  { value: "elect", label: "Elect" },
  { value: "mystagogy", label: "Mystagogy" },
  { value: "completed", label: "Completed" },
  { value: "fully_initiated", label: "Fully Initiated" },
  { value: "unknown", label: "Unknown" },
];

const STATUSES = [
  { value: "", label: "All statuses" },
  { value: "ACTIVE", label: "Active" },
  { value: "INACTIVE", label: "Inactive" },
  { value: "WITHDRAWN", label: "Withdrawn" },
];

export function ParticipantFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const update = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      params.delete("page");
      startTransition(() => {
        router.push(`${pathname}?${params.toString()}`);
      });
    },
    [router, pathname, searchParams]
  );

  return (
    <div className="flex flex-wrap gap-2">
      <input
        type="search"
        placeholder="Search name, email, phone…"
        defaultValue={searchParams.get("search") ?? ""}
        onChange={(e) => update("search", e.target.value)}
        className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 w-56"
      />
      {[
        { key: "group", options: GROUPS },
        { key: "stage", options: PROFILES },
        { key: "status", options: STATUSES },
      ].map(({ key, options }) => (
        <select
          key={key}
          defaultValue={searchParams.get(key) ?? ""}
          onChange={(e) => update(key, e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      ))}
    </div>
  );
}
