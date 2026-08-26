import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/dal";
import { markAllUserBadgesPrinted } from "@/app/actions/settings";
import { PrintTrigger } from "./_components/print-trigger";
import { Breadcrumb } from "@/components/breadcrumb";

export default async function TeamBadgePrintPage() {
  const user = await requireAuth();
  if (user.role !== "ADMIN") notFound();

  const members = await prisma.user.findMany({
    where: { photoUrl: { not: null }, badgePrinted: false },
    orderBy: [{ name: "asc" }],
  });

  if (members.length === 0) redirect("/team/badges");

  // Group into pages of 8
  const pages: (typeof members)[] = [];
  for (let i = 0; i < members.length; i += 8) {
    pages.push(members.slice(i, i + 8));
  }

  const allIds = members.map((m) => m.id).join(",");

  return (
    <>
      <style>{`
        /* Scoped reset — only badge elements, not the sidebar/layout */
        .badge-wrap, .badge, .badge-content, .badge-name, .badge-photo, .badge-tag,
        .cut-h, .cut-v {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }

        /* Gray canvas behind the badge sheets */
        .badge-canvas { background: #e5e7eb; }

        /* ── Screen toolbar ─────────────────────────────────── */
        .toolbar {
          position: sticky;
          top: 0;
          z-index: 10;
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
        .badge-sheet {
          width: 8.5in;
          min-height: 11in;
          background: white;
          margin: 32px auto 32px;
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

        .tl-h { top: 0;    left: -0.15in; }
        .tl-v { top: -0.15in; left: 0;   }
        .tr-h { top: 0;    right: -0.15in; }
        .tr-v { top: -0.15in; right: 0;  }
        .bl-h { bottom: 0;    left: -0.15in; }
        .bl-v { bottom: -0.15in; left: 0;   }
        .br-h { bottom: 0;    right: -0.15in; }
        .br-v { bottom: -0.15in; right: 0;  }

        /* ── Individual badge ────────────────────────────────── */
        .badge {
          width: 3.5in;
          height: 2.2in;
          position: relative;
          background-image: url('/team_member_badge-template.png');
          background-size: 100% 100%;
          background-repeat: no-repeat;
          overflow: hidden;
        }

        /* White content area: roughly from 22% to 76% of badge height */
        .badge-content {
          position: absolute;
          top: 22%;
          bottom: 24%;
          left: 0;
          right: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 4px;
          padding: 0 8px;
        }

        .badge-photo {
          width: 0.7in;
          height: 0.7in;
          border-radius: 50%;
          object-fit: cover;
          border: 1.5px solid #d4a843;
        }

        .badge-name {
          font-family: Georgia, 'Times New Roman', serif;
          font-size: 11.5pt;
          font-weight: bold;
          text-align: center;
          color: #3b1f0a;
          line-height: 1.15;
          max-width: 100%;
        }

        .badge-tag {
          font-family: Arial, Helvetica, sans-serif;
          font-size: 6.5pt;
          font-weight: 600;
          letter-spacing: 1.3px;
          text-transform: uppercase;
          color: #a8781f;
        }

        /* ── Print styles ───────────────────────────────────── */
        @media print {
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

          .badge-sheet:last-child {
            page-break-after: avoid;
            break-after: avoid;
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
          { label: "Team Badges", href: "/team/badges" },
          { label: "Print Preview" },
        ]} />
        <div className="flex items-center gap-3 ml-auto">
          <span className="text-xs text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full font-medium">
            {members.length} badge{members.length !== 1 ? "s" : ""} · {pages.length} page{pages.length !== 1 ? "s" : ""}
          </span>
          <PrintTrigger />
          <form action={markAllUserBadgesPrinted}>
            <input type="hidden" name="userIds" value={allIds} />
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
            {page.map((m) => (
              <div key={m.id} className="badge-wrap">
                {/* Corner cut marks */}
                <span className="cut-h tl-h" /><span className="cut-v tl-v" />
                <span className="cut-h tr-h" /><span className="cut-v tr-v" />
                <span className="cut-h bl-h" /><span className="cut-v bl-v" />
                <span className="cut-h br-h" /><span className="cut-v br-v" />
                <div className="badge">
                  <div className="badge-content">
                    <img src={m.photoUrl!} alt={m.name} className="badge-photo" />
                    <span className="badge-name">{m.name}</span>
                    <span className="badge-tag">Team Member</span>
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
