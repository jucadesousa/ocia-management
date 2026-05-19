import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAuth } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { SessionForm } from "../../_components/session-form";
import { updateSession } from "@/app/actions/sessions";

type Props = { params: Promise<{ id: string }> };

function sessionLabel(type: string, number: number): string {
  return type === "WEEKLY" ? `Session ${number}` : `Reflection ${number}`;
}

export default async function EditSessionPage({ params }: Props) {
  const user = await requireAuth();
  if (user.role !== "ADMIN") notFound();

  const { id } = await params;

  const session = await prisma.session.findUnique({ where: { id } });
  if (!session) notFound();

  const label = sessionLabel(session.type, session.number);

  return (
    <div className="p-6 max-w-2xl">
      <nav className="text-sm text-gray-500 mb-4 flex items-center gap-1.5">
        <Link href="/sessions" className="hover:text-blue-600">
          Sessions
        </Link>
        <span>/</span>
        <span className="text-gray-900">Edit {label}</span>
      </nav>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Edit {label}</h1>
      <SessionForm
        action={updateSession.bind(null, id)}
        defaultValues={session}
      />
    </div>
  );
}
