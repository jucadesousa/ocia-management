import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/dal";
import { PublicPageShell } from "@/components/public-page-shell";

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2)
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return (name[0] ?? "?").toUpperCase();
}

export default async function TeamPage() {
  const user = await getCurrentUser();

  const team = await prisma.user.findMany({
    where: { isPublished: true },
    orderBy: { name: "asc" },
    select: { id: true, name: true, photoUrl: true },
  });

  return PublicPageShell(
    user,
    <div className="max-w-5xl mx-auto p-6 space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Our Team</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Meet the OCIA team at St. Bartholomew the Apostle Catholic Church.
        </p>
      </div>

      {team.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-400 text-sm">
          No team profiles published yet.
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {team.map((member) => (
            <Link
              key={member.id}
              href={`/team/${member.id}`}
              className="bg-white rounded-xl border border-gray-200 p-4 flex flex-col items-center gap-3 text-center hover:border-blue-300 hover:shadow-md transition-all"
            >
              {member.photoUrl ? (
                <img
                  src={member.photoUrl}
                  alt={member.name}
                  className="w-20 h-20 rounded-full object-cover border border-gray-200"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center text-xl font-semibold text-blue-700 select-none">
                  {initials(member.name)}
                </div>
              )}
              <p className="text-sm font-medium text-gray-900">{member.name}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
