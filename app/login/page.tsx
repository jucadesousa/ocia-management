"use client";
import { useActionState } from "react";
import { login } from "@/app/actions/auth";
import Image from "next/image";
import { useActionToast } from "@/hooks/use-action-toast";

export default function LoginPage() {
  const [state, action, pending] = useActionState(login, undefined);
  useActionToast(state);

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center flex flex-col items-center">
          <Image src="/LumenLogo.svg" alt="Lumen Logo" width={200} height={200} priority />
          <h1 className="mt-1 text-2xl font-bold text-lumen">Lumen Catholic</h1>
          <p className="mt-1 text-sm text-gray-500">Saint Bartholomew the Apostle</p>
        </div>

        <form action={action} className="space-y-4 bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <button
            type="submit"
            disabled={pending}
            className="w-full bg-blue-600 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-60 transition-colors"
          >
            {pending ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </div>
    </main>
  );
}
