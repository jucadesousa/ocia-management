import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/dal";
import { markAllBadgesPrinted } from "@/app/actions/participants";
import { PrintTrigger } from "./_components/print-trigger";
import { Breadcrumb } from "@/components/breadcrumb";

export default async function BadgePrintPage() {
  const user = await requireAuth();
  if (user.role !== "ADMIN") notFound();

  const cycle = await prisma.cycle.findFirst({ where: { isCurrent: true } });
  if (!cycle) redirect("/participants/badges");

  const participants = await prisma.participant.findMany({
    where: { cycleId: cycle.id, status: "ACTIVE", photoUrl: { not: null }, badgePrinted: false },
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
  });

  if (participants.length === 0) redirect("/participants/badges");

  // Group into pages of 8
  const pages: (typeof participants)[] = [];
  for (let i = 0; i < participants.length; i += 8) {
    pages.push(participants.slice(i, i + 8));
  }

  const allIds = participants.map((p) => p.id).join(",");

  return (
    <>
      <style>{`
        /* Scoped reset — only badge elements, not the sidebar/layout */
        .badge-wrap, .badge, .badge-content, .badge-name, .badge-photo,
        .cut-h, .cut-v {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }

        /* Gray canvas behind the badge sheets */
        .badge-canvas { background: #e5e7eb; }

        /* ── Screen toolbar ─────────────────────────────────── */
        .toolbar {
          position: fixed;
          top: 0; left: 0; right: 0;
          z-index: 100;
          background: white;
          border-bottom: 1px solid #e5e7eb;
          box-shadow: 0 1px 3px rgba(0,0,0,0.06);
          padding: 0 24px;
          height: 56px;
          display: flex;
          align-items: center;
          gap: 12px;
        }

        /* ── Badge sheet (one per page) ─────────────────────── */
        /* 2 cols × 3.5in + 1 gap × 0.2in = 7.2in → 0.65in side margins
           4 rows × 2.2in + 3 gaps × 0.2in = 9.4in → 0.8in top/bottom margins */
        .badge-sheet {
          width: 8.5in;
          min-height: 11in;
          background: white;
          margin: 80px auto 32px;
          padding: 0.8in 0.65in;
          display: grid;
          grid-template-columns: repeat(2, 3.5in);
          grid-template-rows: repeat(4, 2.2in);
          column-gap: 0.2in;
          row-gap: 0.2in;
        }

        /* ── Badge wrapper — provides overflow space for cut marks ── */
        .badge-wrap {
          position: relative;
          width: 3.5in;
          height: 2.2in;
          overflow: visible;
        }

        /* Corner cut marks: 4 corners × 2 lines each = 8 thin lines */
        .cut-h, .cut-v {
          position: absolute;
          background: #666;
        }
        .cut-h { height: 0.5px; width: 0.12in; }
        .cut-v { width: 0.5px;  height: 0.12in; }

        /* Top-left */
        .tl-h { top: 0;    left: -0.15in; }
        .tl-v { top: -0.15in; left: 0;   }
        /* Top-right */
        .tr-h { top: 0;    right: -0.15in; }
        .tr-v { top: -0.15in; right: 0;  }
        /* Bottom-left */
        .bl-h { bottom: 0;    left: -0.15in; }
        .bl-v { bottom: -0.15in; left: 0;   }
        /* Bottom-right */
        .br-h { bottom: 0;    right: -0.15in; }
        .br-v { bottom: -0.15in; right: 0;  }

        /* ── Individual badge ───────────────────────────────── */
        .badge {
          width: 3.5in;
          height: 2.2in;
          position: relative;
          background-image: url('/badge-template.png');
          background-size: 100% 100%;
          background-repeat: no-repeat;
          overflow: hidden;
        }

        /* White content area: roughly from 22% to 72% of badge height */
        .badge-content {
          position: absolute;
          top: 22%;
          bottom: 28%;
          left: 0;
          right: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 5px;
          padding: 0 8px;
        }

        .badge-photo {
          width: 0.75in;
          height: 0.75in;
          border-radius: 50%;
          object-fit: cover;
          border: 1.5px solid #d4a843;
        }

        .badge-name {
          font-family: Georgia, 'Times New Roman', serif;
          font-size: 9.5pt;
          font-weight: bold;
          text-align: center;
          color: #3b1f0a;
          line-height: 1.2;
          max-width: 100%;
        }

        /* ── Print styles ───────────────────────────────────── */
        @media print {
          /* Reset layout overflow so all pages reach the printer */
          html, body, body > div, main {
            overflow: visible !important;
            height: auto !important;
            max-height: none !important;
          }

          body, .badge-canvas { background: white; }
          .toolbar { display: none !important; }

          .badge-sheet {
            margin: 0;
            padding: 0.8in 0.65in;
            page-break-after: always;
            break-after: page;
          }

          .badge {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }

          .cut-h, .cut-v {
            background: #555;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
        }
      `}</style>

      {/* Screen toolbar — hidden on print */}
      <div className="toolbar no-print">
        <Breadcrumb crumbs={[
          { label: "Badges", href: "/participants/badges" },
          { label: "Print Preview" },
        ]} />
        <div className="flex items-center gap-3 ml-auto">
          <span className="text-xs text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full font-medium">
            {participants.length} badge{participants.length !== 1 ? "s" : ""} · {pages.length} page{pages.length !== 1 ? "s" : ""}
          </span>
          <PrintTrigger />
          <form action={markAllBadgesPrinted}>
            <input type="hidden" name="participantIds" value={allIds} />
            <button
              type="submit"
              className="text-sm font-medium bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
            >
              Mark all printed
            </button>
          </form>
        </div>
      </div>

      {/* Badge sheets */}
      <div className="badge-canvas">
        {pages.map((page, pi) => (
          <div key={pi} className="badge-sheet">
            {page.map((p) => (
              <div key={p.id} className="badge-wrap">
                {/* Corner cut marks */}
                <span className="cut-h tl-h" /><span className="cut-v tl-v" />
                <span className="cut-h tr-h" /><span className="cut-v tr-v" />
                <span className="cut-h bl-h" /><span className="cut-v bl-v" />
                <span className="cut-h br-h" /><span className="cut-v br-v" />
                <div className="badge">
                  <div className="badge-content">
                    <img src={p.photoUrl!} alt={p.fullName} className="badge-photo" />
                    <span className="badge-name">{p.firstName} {p.lastName}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </>
  );
}
