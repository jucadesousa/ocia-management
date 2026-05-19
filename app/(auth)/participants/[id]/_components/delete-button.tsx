"use client";
import { deleteParticipant } from "@/app/actions/participants";

export function DeleteParticipantButton({
  id,
  name,
}: {
  id: string;
  name: string;
}) {
  return (
    <form
      action={deleteParticipant.bind(null, id)}
      onSubmit={(e) => {
        if (!confirm(`Delete ${name}? This will permanently remove all their records and cannot be undone.`)) {
          e.preventDefault();
        }
      }}
    >
      <button
        type="submit"
        className="shrink-0 text-sm font-medium text-red-600 border border-red-200 px-4 py-2 rounded-lg hover:bg-red-50 transition-colors"
      >
        Delete
      </button>
    </form>
  );
}
