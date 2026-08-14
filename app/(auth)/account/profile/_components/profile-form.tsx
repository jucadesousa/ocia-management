"use client";
import { useActionState } from "react";
import { updateMyProfile } from "@/app/actions/account";
import { useActionToast } from "@/hooks/use-action-toast";

const labelCls = "block text-sm font-medium text-gray-700 mb-1";

export function ProfileForm({
  bio,
  isPublished,
}: {
  bio: string | null;
  isPublished: boolean;
}) {
  const [state, formAction, pending] = useActionState(updateMyProfile, undefined);
  useActionToast(state);

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label htmlFor="bio" className={labelCls}>
          About me
        </label>
        <textarea
          id="bio"
          name="bio"
          rows={5}
          maxLength={1000}
          defaultValue={bio ?? ""}
          placeholder="A short paragraph about yourself — your role on the team, what drew you to OCIA ministry, etc."
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <label className="flex items-start gap-2 text-sm text-gray-700">
        <input
          type="checkbox"
          name="isPublished"
          defaultChecked={isPublished}
          className="mt-0.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        />
        <span>
          Publish my profile to the public <strong>Team</strong> page.
          <span className="block text-xs text-gray-400">
            Uncheck this to hide your photo and bio from the public site without losing what you've written.
          </span>
        </span>
      </label>

      <button
        type="submit"
        disabled={pending}
        className="bg-gray-800 text-white text-sm font-medium px-4 py-2.5 rounded-lg hover:bg-gray-900 disabled:opacity-60 transition-colors"
      >
        {pending ? "Saving…" : "Save profile"}
      </button>
    </form>
  );
}
