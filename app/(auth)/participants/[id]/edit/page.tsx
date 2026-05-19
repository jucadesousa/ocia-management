import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/dal";
import { updateParticipant } from "@/app/actions/participants";
import { ParticipantForm } from "../../_components/participant-form";
import { PhotoUploadForm } from "./_components/photo-upload";

type Props = { params: Promise<{ id: string }> };

export default async function EditParticipantPage({ params }: Props) {
  const user = await requireAuth();
  if (user.role !== "ADMIN") notFound();

  const { id } = await params;
  const participant = await prisma.participant.findUnique({ where: { id } });
  if (!participant) notFound();

  const boundAction = updateParticipant.bind(null, id);

  return (
    <div className="p-6 max-w-2xl">
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
        <Link href="/participants" className="hover:text-blue-600">Participants</Link>
        <span>/</span>
        <Link href={`/participants/${id}`} className="hover:text-blue-600">{participant.fullName}</Link>
        <span>/</span>
        <span>Edit</span>
      </div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Edit Participant</h1>
      <PhotoUploadForm
        participantId={id}
        photoUrl={participant.photoUrl}
        name={participant.fullName}
      />
      <ParticipantForm action={boundAction} defaultValues={participant} />
    </div>
  );
}
