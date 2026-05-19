import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/dal";
import { UsersTab } from "./_components/users-tab";
import { CyclesTab } from "./_components/cycles-tab";

type SearchParams = Promise<{ tab?: string; edit?: string }>;

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const me = await requireAuth();
  if (me.role !== "ADMIN") notFound();

  const params = await searchParams;
  const tab = params.tab === "cycles" ? "cycles" : "users";

  const [users, cycles] = await Promise.all([
    prisma.user.findMany({ orderBy: { name: "asc" } }),
    prisma.cycle.findMany({ orderBy: { year: "desc" } }),
  ]);

  const tabs = [
    { key: "users",  label: "Staff Accounts" },
    { key: "cycles", label: "Cycles" },
  ];

  return (
    <div className="p-6 space-y-6 max-w-3xl">
      <h1 className="text-2xl font-bold text-gray-900">Settings</h1>

      {/* Tab nav */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-1 -mb-px">
          {tabs.map(({ key, label }) => (
            <Link
              key={key}
              href={`/settings?tab=${key}`}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                tab === key
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              {label}
            </Link>
          ))}
        </nav>
      </div>

      {tab === "users"  && <UsersTab  users={users}  currentUserId={me.id} />}
      {tab === "cycles" && <CyclesTab cycles={cycles} editId={params.edit} />}
    </div>
  );
}
