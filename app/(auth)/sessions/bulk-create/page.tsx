import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAuth } from "@/lib/dal";
import { bulkCreateSessions } from "@/app/actions/sessions";

const inputCls =
  "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500";
const labelCls = "block text-sm font-medium text-gray-700 mb-1";

export default async function BulkCreateSessionsPage() {
  const user = await requireAuth();
  if (user.role !== "ADMIN") notFound();

  return (
    <div className="p-6 max-w-lg">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Generate Sessions</h1>
      <p className="text-sm text-gray-500 mb-6">
        Automatically create all 30 weekly sessions and up to 4 reflection sessions for the current
        cycle. Existing sessions are not overwritten — only missing ones are created.
      </p>

      <form action={bulkCreateSessions} className="space-y-5">
        <div>
          <label htmlFor="startDate" className={labelCls}>
            First session date<span className="text-red-500 ml-0.5">*</span>
          </label>
          <input
            id="startDate"
            name="startDate"
            type="date"
            required
            className={inputCls}
          />
        </div>

        <div>
          <label htmlFor="reflectionCount" className={labelCls}>
            Reflection sessions to create
          </label>
          <input
            id="reflectionCount"
            name="reflectionCount"
            type="number"
            min={1}
            max={4}
            defaultValue={4}
            className={inputCls}
          />
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            className="bg-blue-600 text-white text-sm font-medium px-5 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Generate sessions
          </button>
          <Link
            href="/sessions"
            className="text-sm text-gray-500 px-5 py-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
