import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/dal";
import { deriveOciaLabel } from "@/lib/ocia-stage";
import { toggleBadgePrinted } from "@/app/actions/participants";

export default async function BadgesPage() {
  const user = await requireAuth();
  if (user.role !== "ADMIN") notFound();

  const cycle = await prisma.cycle.findFirst({ where: { isCurrent: true } });
  if (!cycle) return <div className="p-6 text-gray-500">No active cycle found.</div>;

  const allParticipants = await prisma.participant.findMany({
    where: { cycleId: cycle.id, status: "ACTIVE" },
    include: {
      sacramentalRecord: {
        select: { baptismType: true, hasFirstCommunion: true, hasConfirmation: true },
      },
    },
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
  });

  const participants  = allParticipants.filter((p) => p.photoUrl);
  const noPhoto       = allParticipants.filter((p) => !p.photoUrl);
  const unprinted     = participants.filter((p) => !p.badgePrinted);
  const printed       = participants.filter((p) => p.badgePrinted);

  function ParticipantRow({
    p,
    currentlyPrinted,
  }: {
    p: (typeof participants)[number];
    currentlyPrinted: boolean;
  }) {
    const ociaLabel = deriveOciaLabel(p.sacramentalRecord);
    return (
      <li className="flex items-center gap-4 px-4 py-3 border-b border-gray-100 last:border-0">
        <img
          src={p.photoUrl!}
          alt={p.fullName}
          className="w-10 h-10 rounded-full object-cover shrink-0 border border-gray-200"
        />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900">{p.firstName} {p.lastName}</p>
          <span className={`inline-flex mt-0.5 px-1.5 py-0.5 rounded-full text-xs font-medium ${ociaLabel.color}`}>
            {ociaLabel.label}
          </span>
        </div>
        <form action={toggleBadgePrinted}>
          <input type="hidden" name="participantId" value={p.id} />
          <input type="hidden" name="printed" value={String(!currentlyPrinted)} />
          <button
            type="submit"
            className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-colors ${
              currentlyPrinted
                ? "bg-gray-100 text-gray-600 hover:bg-gray-200"
                : "bg-green-50 text-green-700 hover:bg-green-100"
            }`}
          >
            {currentlyPrinted ? "Mark as not printed" : "Mark as printed"}
          </button>
        </form>
      </li>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-2xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Badge Manager</h1>
          <p className="text-sm text-gray-500 mt-0.5">{cycle.name}</p>
        </div>
        {unprinted.length > 0 && (
          <Link
            href="/participants/badges/print"
            className="shrink-0 bg-blue-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Print {unprinted.length} badge{unprinted.length !== 1 ? "s" : ""}
          </Link>
        )}
      </div>

      {/* Not yet printed */}
      <section>
        <div className="rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
            <h2 className="text-sm font-semibold text-gray-700">
              Not yet printed
              <span className="ml-2 text-gray-400 font-normal">({unprinted.length})</span>
            </h2>
          </div>
          {unprinted.length === 0 ? (
            <p className="px-4 py-6 text-sm text-gray-400 text-center">All badges have been printed.</p>
          ) : (
            <ul className="bg-white">
              {unprinted.map((p) => <ParticipantRow key={p.id} p={p} currentlyPrinted={false} />)}
            </ul>
          )}
        </div>
      </section>

      {/* Already printed */}
      {printed.length > 0 && (
        <section>
          <div className="rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
              <h2 className="text-sm font-semibold text-gray-700">
                Already printed
                <span className="ml-2 text-gray-400 font-normal">({printed.length})</span>
              </h2>
            </div>
            <ul className="bg-white">
              {printed.map((p) => <ParticipantRow key={p.id} p={p} currentlyPrinted={true} />)}
            </ul>
          </div>
        </section>
      )}

      {/* Missing photo */}
      {noPhoto.length > 0 && (
        <section>
          <div className="rounded-xl border border-orange-200 overflow-hidden">
            <div className="px-4 py-3 bg-orange-50 border-b border-orange-200">
              <h2 className="text-sm font-semibold text-orange-800">
                Missing photo
                <span className="ml-2 text-orange-400 font-normal">({noPhoto.length})</span>
              </h2>
              <p className="text-xs text-orange-600 mt-0.5">Upload a photo on each participant&apos;s profile to enable badge printing.</p>
            </div>
            <ul className="bg-white">
              {noPhoto.map((p) => {
                const ociaLabel = deriveOciaLabel(p.sacramentalRecord);
                return (
                  <li key={p.id} className="flex items-center gap-4 px-4 py-3 border-b border-gray-100 last:border-0">
                    <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center shrink-0">
                      <span className="text-orange-400 text-lg">?</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">{p.firstName} {p.lastName}</p>
                      <span className={`inline-flex mt-0.5 px-1.5 py-0.5 rounded-full text-xs font-medium ${ociaLabel.color}`}>
                        {ociaLabel.label}
                      </span>
                    </div>
                    <Link
                      href={`/participants/${p.id}`}
                      className="text-xs font-medium px-3 py-1.5 rounded-lg bg-orange-50 text-orange-700 hover:bg-orange-100 transition-colors shrink-0"
                    >
                      Upload photo →
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </section>
      )}
    </div>
  );
}
