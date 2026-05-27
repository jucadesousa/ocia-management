import { NextResponse } from "next/server";
import ExcelJS from "exceljs";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/dal";
import { deriveOciaLabel } from "@/lib/ocia-stage";

const BLUE_HEADER = "FF63A4F7";
const WHITE       = "FFFFFFFF";
const GREEN_TEXT  = "FF16A34A";
const RED_TEXT    = "FFDC2626";
const DARK_TEXT   = "FF1F2937";

function thin(): ExcelJS.Border {
  return { style: "thin", color: { argb: "FFD1D5DB" } };
}
function allBorders(): Partial<ExcelJS.Borders> {
  const b = thin();
  return { top: b, bottom: b, left: b, right: b };
}

export async function GET() {
  await requireAuth();

  const cycle = await prisma.cycle.findFirst({ where: { isCurrent: true } });
  if (!cycle) return NextResponse.json({ error: "No active cycle" }, { status: 404 });

  const threshold = cycle.atRiskThresholdPercent ?? 75;

  const [rawSessions, participants] = await Promise.all([
    prisma.session.findMany({
      where: { cycleId: cycle.id, status: "COMPLETED" },
    }),
    prisma.participant.findMany({
      where: { cycleId: cycle.id, status: "ACTIVE" },
      include: {
        attendanceRecords: {
          where: { session: { status: "COMPLETED" } },
        },
        sacramentalRecord: {
          select: { baptismType: true, hasFirstCommunion: true, hasConfirmation: true },
        },
      },
      orderBy: [{ group: "asc" }, { lastName: "asc" }, { firstName: "asc" }],
    }),
  ]);

  const totalSessions = rawSessions.length;

  const wb = new ExcelJS.Workbook();
  wb.creator = "OCIA Management";
  wb.created = new Date();

  const ws = wb.addWorksheet("Attendance Summary");

  type ColDef = { header: string; key: string; width: number };
  const cols: ColDef[] = [
    { header: "#",            key: "num",     width: 4  },
    { header: "Name",         key: "name",    width: 30 },
    { header: "Group",        key: "group",   width: 10 },
    { header: "OCIA Profile", key: "profile", width: 22 },
    { header: "Attended",     key: "attended",width: 10 },
    { header: "Total",        key: "total",   width: 8  },
    { header: "%",            key: "pct",     width: 8  },
  ];
  ws.columns = cols as unknown as ExcelJS.Column[];

  // ── Header row ──────────────────────────────────────────────────────────────
  const headerRow = ws.getRow(1);
  headerRow.height = 18;
  headerRow.eachCell((cell) => {
    cell.fill      = { type: "pattern", pattern: "solid", fgColor: { argb: BLUE_HEADER } };
    cell.font      = { bold: true, color: { argb: "FFFFFFFF" }, size: 10 };
    cell.alignment = { vertical: "middle", horizontal: "center" };
    cell.border    = allBorders();
  });
  headerRow.getCell(2).alignment = { vertical: "middle", horizontal: "left" };
  headerRow.getCell(4).alignment = { vertical: "middle", horizontal: "left" };

  // ── Data rows ───────────────────────────────────────────────────────────────
  participants.forEach((p, idx) => {
    const attended = p.attendanceRecords.filter((r) => r.status === "PRESENT").length;
    const pct      = totalSessions > 0 ? Math.round((attended / totalSessions) * 100) : null;
    const atRisk   = pct !== null && pct < threshold;
    const profile  = deriveOciaLabel(p.sacramentalRecord).label;
    const group    = p.group === "ENGLISH" ? "English" : "Spanish";

    const row = ws.addRow({
      num:      idx + 1,
      name:     `${p.lastName}, ${p.firstName}`,
      group,
      profile,
      attended,
      total:    totalSessions,
      pct:      pct !== null ? `${pct}%` : "N/A",
    });
    row.height = 15;

    row.eachCell({ includeEmpty: true }, (cell) => {
      cell.fill      = { type: "pattern", pattern: "solid", fgColor: { argb: WHITE } };
      cell.font      = { size: 10, color: { argb: DARK_TEXT } };
      cell.border    = allBorders();
      cell.alignment = { vertical: "middle", horizontal: "center" };
    });
    row.getCell(2).alignment = { vertical: "middle", horizontal: "left" };
    row.getCell(4).alignment = { vertical: "middle", horizontal: "left" };

    // Colour-code %
    if (pct !== null) {
      const pctColor = atRisk ? RED_TEXT : pct < 90 ? "FFD97706" : GREEN_TEXT;
      row.getCell(7).font = { size: 10, bold: true, color: { argb: pctColor } };
    }
  });

  // ── Legend ──────────────────────────────────────────────────────────────────

  ws.addRow([]);
  const legendHeader = ws.addRow(["", "Legend — OCIA Profile"]);
  legendHeader.getCell(2).font = { bold: true, size: 10 };

  [
    ["Catechumen",                    "Never baptized — needs Baptism, First Communion, and Confirmation at Easter Vigil."],
    ["Candidate (Baptism Unverified)","Baptized in another Christian denomination — trinitarian validity not yet confirmed."],
    ["Candidate",                     "Baptized in another Christian denomination with confirmed valid trinitarian baptism — seeking full communion."],
    ["Candidate for Sacraments",      "Baptized Catholic but has not yet received First Communion."],
    ["Catholic Candidate",            "Baptized Catholic with First Communion — still needs Confirmation."],
    ["Fully Initiated",               "Has received all three sacraments: Baptism, Eucharist, and Confirmation."],
    ["Unknown",                       "No sacramental record has been filled in yet."],
  ].forEach(([profile, desc]) => {
    const r = ws.addRow(["", profile, desc]);
    r.getCell(2).font = { bold: true, size: 10 };
    r.getCell(3).font = { size: 10 };
  });

  const buffer = await wb.xlsx.writeBuffer();
  return new NextResponse(buffer, {
    headers: {
      "Content-Type":        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="attendance-summary.xlsx"`,
    },
  });
}
