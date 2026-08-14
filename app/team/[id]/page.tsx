import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/dal";
import { PublicPageShell } from "@/components/public-page-shell";

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2)
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return (name[0] ?? "?").toUpperCase();
}

export default async function TeamMemberPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [user, member] = await Promise.all([
    getCurrentUser(),
    prisma.user.findUnique({
      where: { id },
      select: { name: true, bio: true, photoUrl: true, isPublished: true },
    }),
  ]);

  if (!member || !member.isPublished) notFound();

  return PublicPageShell(
    user,
    <div className="max-w-2xl mx-auto p-6 space-y-4">
      <Link href="/team" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700">
        <ArrowLeft size={16} />
        Back to Team
      </Link>

      <div className="bg-white rounded-xl border border-gray-200 p-6 sm:p-8 flex flex-col items-center text-center gap-4">
        {member.photoUrl ? (
          <img
            src={member.photoUrl}
            alt={member.name}
            className="w-32 h-32 rounded-full object-cover border border-gray-200"
          />
        ) : (
          <div className="w-32 h-32 rounded-full bg-blue-100 flex items-center justify-center text-4xl font-semibold text-blue-700 select-none">
            {initials(member.name)}
          </div>
        )}
        <h1 className="text-xl font-bold text-gray-900">{member.name}</h1>
        {member.bio && (
          <p className="text-sm text-gray-700 leading-relaxed max-w-prose">{member.bio}</p>
        )}
      </div>
    </div>
  );
}
