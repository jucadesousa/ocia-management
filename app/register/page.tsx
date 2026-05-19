"use client";
import { useActionState } from "react";
import { registerParticipant } from "@/app/actions/participants";

const inputCls =
  "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500";

export default function RegisterPage() {
  const [state, action, pending] = useActionState(registerParticipant, undefined);

  if (state?.success) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="w-full max-w-md text-center space-y-4 bg-white p-8 rounded-xl border border-gray-200 shadow-sm">
          <div className="text-4xl">✓</div>
          <h2 className="text-xl font-bold text-gray-900">Thank you for registering!</h2>
          <p className="text-sm text-gray-500">
            We have received your information. A member of our OCIA team will be in touch with you soon.
          </p>
          <p className="text-sm text-gray-500">
            Saint Bartholomew the Apostle Catholic Church
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-lg mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">OCIA — Order of Christian Initiation</h1>
          <p className="mt-1 text-sm text-gray-500">Saint Bartholomew the Apostle Catholic Church</p>
          <p className="mt-3 text-sm text-gray-600">
            Interested in learning more about the Catholic faith? Fill out this form and someone from our team will contact you.
          </p>
        </div>

        <form action={action} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-5">
          {state?.error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 px-3 py-2 rounded-lg">
              {state.error}
            </p>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
                First name <span className="text-red-500">*</span>
              </label>
              <input id="firstName" name="firstName" required className={inputCls} />
            </div>
            <div>
              <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
                Last name <span className="text-red-500">*</span>
              </label>
              <input id="lastName" name="lastName" required className={inputCls} />
            </div>
          </div>

          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
            <input id="phone" name="phone" type="tel" className={inputCls} />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input id="email" name="email" type="email" className={inputCls} />
          </div>

          <div>
            <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">Address</label>
            <textarea id="address" name="address" rows={2} className={`${inputCls} resize-none`} />
          </div>

          <div>
            <label htmlFor="group" className="block text-sm font-medium text-gray-700 mb-1">
              Preferred language group <span className="text-red-500">*</span>
            </label>
            <select id="group" name="group" required className={inputCls}>
              <option value="" disabled>Select…</option>
              <option value="ENGLISH">English</option>
              <option value="SPANISH">Spanish / Español</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={pending}
            className="w-full bg-blue-600 text-white text-sm font-medium px-4 py-2.5 rounded-lg hover:bg-blue-700 disabled:opacity-60 transition-colors"
          >
            {pending ? "Submitting…" : "Submit registration"}
          </button>
        </form>
      </div>
    </main>
  );
}
