import { notFound } from "next/navigation";
import { requireAuth } from "@/lib/dal";
import { SessionForm } from "../_components/session-form";
import { createSession } from "@/app/actions/sessions";

export default async function NewSessionPage() {
  const user = await requireAuth();
  if (user.role !== "ADMIN") notFound();

  return (
    <div className="p-6 max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">New Session</h1>
      <SessionForm action={createSession} />
    </div>
  );
}
