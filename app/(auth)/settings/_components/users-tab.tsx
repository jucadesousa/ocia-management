"use client";
import { useActionState, useState } from "react";
import { createStaffUser, updateUserRole, removeUser, setUserPassword } from "@/app/actions/settings";
import type { SettingsFormState } from "@/app/actions/settings";

type User = { id: string; name: string; email: string; role: string };

const inputCls =
  "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500";
const labelCls = "block text-sm font-medium text-gray-700 mb-1";

function SetPasswordForm({ user, onDone }: { user: User; onDone: () => void }) {
  const boundAction = setUserPassword.bind(null, user.id);
  const [state, formAction, pending] = useActionState<SettingsFormState, FormData>(
    boundAction,
    undefined
  );

  if (state?.success) {
    return (
      <div className="mt-2 text-xs text-green-700 bg-green-50 border border-green-200 px-3 py-2 rounded-lg flex items-center justify-between gap-2">
        {state.success}
        <button type="button" onClick={onDone} className="underline">Close</button>
      </div>
    );
  }

  return (
    <form action={formAction} className="mt-3 flex items-end gap-2">
      <div className="flex-1">
        <label htmlFor={`pwd-${user.id}`} className="block text-xs font-medium text-gray-600 mb-1">
          New password
        </label>
        <input
          id={`pwd-${user.id}`}
          name="password"
          type="password"
          required
          minLength={8}
          placeholder="Min. 8 characters"
          className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {state?.error && (
          <p className="mt-1 text-xs text-red-600">{state.error}</p>
        )}
      </div>
      <button
        type="submit"
        disabled={pending}
        className="shrink-0 bg-gray-800 text-white text-xs font-medium px-3 py-2 rounded-lg hover:bg-gray-900 disabled:opacity-60 transition-colors"
      >
        {pending ? "Saving…" : "Set password"}
      </button>
    </form>
  );
}

export function UsersTab({
  users,
  currentUserId,
}: {
  users: User[];
  currentUserId: string;
}) {
  const [state, formAction, pending] = useActionState<SettingsFormState, FormData>(
    createStaffUser,
    undefined
  );
  const [pwdUserId, setPwdUserId] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      {/* Create account form */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="text-base font-semibold text-gray-900 mb-4">Create Staff Account</h2>

        {state?.error && (
          <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 px-4 py-3 rounded-lg">
            {state.error}
          </div>
        )}
        {state?.success && (
          <div className="mb-4 text-sm text-green-700 bg-green-50 border border-green-200 px-4 py-3 rounded-lg">
            {state.success}
          </div>
        )}

        <form action={formAction} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="name" className={labelCls}>
              Full name<span className="text-red-500 ml-0.5">*</span>
            </label>
            <input
              id="name" name="name" type="text" required
              placeholder="Mary Catechist"
              className={inputCls}
            />
          </div>
          <div>
            <label htmlFor="email" className={labelCls}>
              Email<span className="text-red-500 ml-0.5">*</span>
            </label>
            <input
              id="email" name="email" type="email" required
              placeholder="mary@example.com"
              className={inputCls}
            />
          </div>
          <div>
            <label htmlFor="password" className={labelCls}>
              Password<span className="text-red-500 ml-0.5">*</span>
            </label>
            <input
              id="password" name="password" type="password" required
              minLength={8}
              placeholder="Min. 8 characters"
              className={inputCls}
            />
          </div>
          <div>
            <label htmlFor="role" className={labelCls}>
              Role<span className="text-red-500 ml-0.5">*</span>
            </label>
            <select id="role" name="role" required defaultValue="VOLUNTEER" className={inputCls}>
              <option value="VOLUNTEER">Volunteer</option>
              <option value="ADMIN">Admin</option>
            </select>
          </div>
          <div className="sm:col-span-2 flex justify-end">
            <button
              type="submit"
              disabled={pending}
              className="bg-blue-600 text-white text-sm font-medium px-5 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-60 transition-colors"
            >
              {pending ? "Creating…" : "Create account"}
            </button>
          </div>
        </form>
      </div>

      {/* Staff list */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-3 bg-gray-50 border-b border-gray-200">
          <h2 className="text-base font-semibold text-gray-900">Staff Accounts</h2>
        </div>

        {users.length === 0 ? (
          <p className="p-6 text-sm text-gray-400 text-center">No staff accounts yet.</p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {users.map((u) => (
              <li key={u.id} className="px-4 py-4">
                {/* Top row: name + role badge/selector */}
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{u.name}</p>
                    <p className="text-xs text-gray-500 truncate mt-0.5">{u.email}</p>
                  </div>

                  {u.id !== currentUserId ? (
                    <form action={updateUserRole.bind(null, u.id)} className="shrink-0">
                      <select
                        name="role"
                        defaultValue={u.role}
                        onChange={(e) => {
                          const form = e.currentTarget.closest("form") as HTMLFormElement;
                          form?.requestSubmit();
                        }}
                        className="text-xs border border-gray-300 rounded-lg px-2 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="VOLUNTEER">Volunteer</option>
                        <option value="ADMIN">Admin</option>
                      </select>
                    </form>
                  ) : (
                    <span className="shrink-0 text-xs px-2.5 py-1 rounded-full bg-blue-100 text-blue-700 font-medium">
                      {u.role === "ADMIN" ? "Admin" : "Volunteer"} (you)
                    </span>
                  )}
                </div>

                {/* Action buttons row */}
                {u.id !== currentUserId && (
                  <div className="flex items-center gap-4 mt-2.5">
                    <button
                      type="button"
                      onClick={() => setPwdUserId(pwdUserId === u.id ? null : u.id)}
                      className="text-xs text-gray-500 hover:text-gray-800 font-medium"
                    >
                      {pwdUserId === u.id ? "Cancel" : "Set password"}
                    </button>
                    <form action={removeUser.bind(null, u.id)}>
                      <button
                        type="submit"
                        className="text-xs text-red-500 hover:text-red-700 font-medium"
                        onClick={(e) => {
                          if (!confirm(`Remove ${u.name}? This cannot be undone.`)) {
                            e.preventDefault();
                          }
                        }}
                      >
                        Remove
                      </button>
                    </form>
                  </div>
                )}

                {/* Inline set-password form */}
                {pwdUserId === u.id && (
                  <SetPasswordForm user={u} onDone={() => setPwdUserId(null)} />
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
