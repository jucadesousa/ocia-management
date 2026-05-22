import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/dal";
import { SacramentalForm } from "./_components/sacramental-form";

type Props = { params: Promise<{ id: string }> };

function toDateInput(date: Date | null | undefined): string | null {
  if (!date) return null;
  return new Date(date).toISOString().split("T")[0];
}

export default async function SacramentalEditPage({ params }: Props) {
  const user = await requireAuth();
  if (user.role !== "ADMIN") notFound();

  const { id } = await params;
  const participant = await prisma.participant.findUnique({
    where: { id },
    include: { sacramentalRecord: true },
  });
  if (!participant) notFound();

  const sr = participant.sacramentalRecord;

  const defaults = sr
    ? {
        isBaptized: sr.isBaptized,
        baptismType: sr.baptismType,
        baptismDenomination: sr.baptismDenomination,
        baptismDate: toDateInput(sr.baptismDate),
        baptismParish: sr.baptismParish,
        baptismProofStatus: sr.baptismProofStatus,
        hasFirstCommunion: sr.hasFirstCommunion,
        hasConfirmation: sr.hasConfirmation,
        marriageStatus: sr.marriageStatus,
        marriedToCatholic: sr.marriedToCatholic,
        marriedByCatholicPriest: sr.marriedByCatholicPriest,
        hadPriorMarriage: sr.hadPriorMarriage,
        spouseHadPriorMarriage: sr.spouseHadPriorMarriage,
        marriageCertReceived: sr.marriageCertReceived,
        annulmentStatus: sr.annulmentStatus,
        hasChildren: sr.hasChildren,
        childrenNotes: sr.childrenNotes,
        riteOfAcceptanceDate: toDateInput(sr.riteOfAcceptanceDate),
        electionDate: toDateInput(sr.electionDate),
        easterVigilDate: toDateInput(sr.easterVigilDate),
        completedAt: toDateInput(sr.completedAt),
      }
    : null;

  return (
    <div className="p-6 max-w-2xl">
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
        <Link href="/participants" className="hover:text-blue-600">
          Participants
        </Link>
        <span>/</span>
        <Link href={`/participants/${id}`} className="hover:text-blue-600">
          {participant.fullName}
        </Link>
        <span>/</span>
        <Link
          href={`/participants/${id}?tab=sacramental`}
          className="hover:text-blue-600"
        >
          Sacramental
        </Link>
        <span>/</span>
        <span>Edit</span>
      </div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        Edit Sacramental Record
      </h1>
      <SacramentalForm participantId={id} defaults={defaults} />
    </div>
  );
}
