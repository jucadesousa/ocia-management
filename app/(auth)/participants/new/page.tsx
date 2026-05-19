import { requireAuth } from "@/lib/dal";
import { createParticipant } from "@/app/actions/participants";
import { ParticipantForm } from "../_components/participant-form";

export default async function NewParticipantPage() {
  await requireAuth();

  return (
    <div className="p-6 max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Add Participant</h1>
      <ParticipantForm action={createParticipant} />
    </div>
  );
}
