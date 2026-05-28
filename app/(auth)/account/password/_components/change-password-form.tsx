"use client";
import { useActionState, useEffect } from "react";
import { changePassword } from "@/app/actions/auth";
import { useActionToast } from "@/hooks/use-action-toast";

const inputCls =
  "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500";
const labelCls = "block text-sm font-medium text-gray-700 mb-1";

export function ChangePasswordForm() {
  const [state, formAction, pending] = useActionState(changePassword, undefined);
  useActionToast(state);

  // Reset the form on success
  useEffect(() => {
    if (state?.success) {
      const form = document.getElementById("change-password-form") as HTMLFormElement | null;
      form?.reset();
    }
  }, [state]);

  return (
    <form id="change-password-form" action={formAction} className="space-y-4">
      <div>
        <label htmlFor="currentPassword" className={labelCls}>
          Current password
        </label>
        <input
          id="currentPassword"
          name="currentPassword"
          type="password"
          required
          autoComplete="current-password"
          placeholder="Enter your current password"
          className={inputCls}
        />
      </div>

      <div>
        <label htmlFor="newPassword" className={labelCls}>
          New password
        </label>
        <input
          id="newPassword"
          name="newPassword"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          placeholder="Min. 8 characters"
          className={inputCls}
        />
      </div>

      <div>
        <label htmlFor="confirmPassword" className={labelCls}>
          Confirm new password
        </label>
        <input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          placeholder="Repeat new password"
          className={inputCls}
        />
      </div>

      <button
        type="submit"
        disabled={pending}
        className="w-full bg-gray-800 text-white text-sm font-medium px-4 py-2.5 rounded-lg hover:bg-gray-900 disabled:opacity-60 transition-colors"
      >
        {pending ? "Updating…" : "Update password"}
      </button>
    </form>
  );
}
