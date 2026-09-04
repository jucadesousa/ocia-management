import { NextResponse } from "next/server";
import ExcelJS from "exceljs";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/dal";
import { deriveOciaLabel } from "@/lib/ocia-stage";

// Colours matching the parish template
const BLUE_HEADER = "FF63A4F7";
const WHITE       = "FFFFFFFF";
const GREEN_TEXT   = "FF16A34A";
const BLUE_TEXT    = "FF2563EB";
const RED_TEXT     = "FFDC2626";
const DARK_TEXT    = "FF1F2937";

const STATUS_COLOR: Record<string, string> = {
  PRESENT: GREEN_TEXT,
  EXCUSED: BLUE_TEXT,
  ABSENT:  RED_TEXT,
};
const STATUS_LETTER: Record<string, string> = {
  PRESENT: "P",
  EXCUSED: "E",
  ABSENT:  "A",
};

function thin(): ExcelJS.Border {
  return { style: "thin", color: { argb: "FFD1D5DB" } };
}
function allBorders(): Partial<ExcelJS.Borders> {
  const b = thin();
  return { top: b, bottom: b, left: b, right: b };
}

export async function GET(request: Request) {
  await requireAuth();

  const { searchParams } = new URL(request.url);
  const groupParam = searchParams.get("group");
  const group = groupParam === "ENGLISH" || groupParam === "SPANISH" ? groupParam : undefined;

  const cycle = await prisma.cycle.findFirst({ where: { isCurrent: true } });
  if (!cycle) return NextResponse.json({ error: "No active cycle" }, { status: 404 });

  const threshold = cycle.atRiskThresholdPercent ?? 75;

  const [rawSessions, participants] = await Promise.all([
    prisma.session.findMany({
      where: { cycleId: cycle.id, status: "COMPLETED" },
      orderBy: [{ type: "asc" }, { number: "asc" }],
    }),
    prisma.participant.findMany({
      where: { cycleId: cycle.id, status: "ACTIVE", ...(group ? { group } : {}) },
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

  const sessions = [...rawSessions].sort((a, b) => {
    const o = (a.type === "WEEKLY" ? 0 : 1) - (b.type === "WEEKLY" ? 0 : 1);
    return o !== 0 ? o : a.number - b.number;
  });

  const pivotMap: Record<string, Record<string, string>> = {};
  for (const p of participants) {
    pivotMap[p.id] = {};
    for (const r of p.attendanceRecords) pivotMap[p.id][r.sessionId] = r.status;
  }

  function sessionCol(type: string, num: number) {
    return type === "WEEKLY" ? String(num) : `R${num}`;
  }

  // ── Build workbook ──────────────────────────────────────────────────────────

  const wb = new ExcelJS.Workbook();
  wb.creator = "Catecheo";
  wb.created = new Date();

  const ws = wb.addWorksheet("Attendance Grid", {
    views: [{ state: "frozen", xSplit: 3, ySplit: 1 }],
  });

  // ── Column definitions ──────────────────────────────────────────────────────

  type ColDef = { header: string; key: string; width: number };
  const fixedCols: ColDef[] = [
    { header: "#",            key: "num",     width: 4  },
    { header: "Name",         key: "name",    width: 30 },
    { header: "Group",        key: "group",   width: 10 },
    { header: "OCIA Profile", key: "profile", width: 22 },
  ];
  const sessionCols: ColDef[] = sessions.map((s) => ({
    header: sessionCol(s.type, s.number),
    key:    `s_${s.id}`,
    width:  4.5,
  }));
  const trailingCols: ColDef[] = [
    { header: "%", key: "pct", width: 6 },
  ];

  // exceljs Column type is strict; cast via unknown
  ws.columns = [...fixedCols, ...sessionCols, ...trailingCols] as unknown as ExcelJS.Column[];

  // ── Header row styling ──────────────────────────────────────────────────────

  const headerRow = ws.getRow(1);
  headerRow.height = 18;
  headerRow.eachCell((cell) => {
    cell.fill   = { type: "pattern", pattern: "solid", fgColor: { argb: BLUE_HEADER } };
    cell.font   = { bold: true, color: { argb: WHITE }, size: 10 };
    cell.alignment = { vertical: "middle", horizontal: "center" };
    cell.border = allBorders();
  });
  // Name, Group, Profile: left-aligned
  headerRow.getCell(2).alignment = { vertical: "middle", horizontal: "left" };
  headerRow.getCell(3).alignment = { vertical: "middle", horizontal: "left" };
  headerRow.getCell(4).alignment = { vertical: "middle", horizontal: "left" };

  // ── Data rows ───────────────────────────────────────────────────────────────

  participants.forEach((p, idx) => {
    const rec      = pivotMap[p.id];
    const attended = sessions.filter((s) => rec[s.id] === "PRESENT").length;
    const pct      = sessions.length > 0 ? Math.round((attended / sessions.length) * 100) : null;
    const atRisk  = pct !== null && pct < threshold;
    const profile = deriveOciaLabel(p.sacramentalRecord).label;
    const group   = p.group === "ENGLISH" ? "English" : "Spanish";

    const rowData: Record<string, string | number> = {
      num:     idx + 1,
      name:    `${p.lastName}, ${p.firstName}`,
      group,
      profile,
    };
    for (const s of sessions) {
      rowData[`s_${s.id}`] = STATUS_LETTER[rec[s.id]] ?? "";
    }
    rowData.pct = pct !== null ? `${pct}%` : "N/A";

    const row = ws.addRow(rowData);
    row.height = 15;

    row.eachCell({ includeEmpty: true }, (cell) => {
      cell.fill      = { type: "pattern", pattern: "solid", fgColor: { argb: WHITE } };
      cell.font      = { size: 10, color: { argb: DARK_TEXT } };
      cell.border    = allBorders();
      cell.alignment = { vertical: "middle", horizontal: "center" };
    });

    // Name, Group, Profile: left-aligned
    row.getCell(2).alignment = { vertical: "middle", horizontal: "left" };
    row.getCell(3).alignment = { vertical: "middle", horizontal: "left" };
    row.getCell(4).alignment = { vertical: "middle", horizontal: "left" };

    // Colour-code each session cell (fixed cols are now 4: #, Name, Group, Profile)
    sessions.forEach((s, si) => {
      const status = rec[s.id];
      const cell   = row.getCell(5 + si);
      if (status) {
        cell.font = {
          size: 10,
          bold: status === "ABSENT",
          color: { argb: STATUS_COLOR[status] ?? DARK_TEXT },
        };
      }
    });

    // Colour-code % cell
    const pctCell = row.getCell(ws.columns.length);
    if (pct !== null) {
      const pctColor = atRisk ? RED_TEXT : pct < 90 ? "FFD97706" : GREEN_TEXT;
      pctCell.font = { size: 10, bold: true, color: { argb: pctColor } };
    }
  });

  // ── Total Present footer row ────────────────────────────────────────────────

  const totalsData: Record<string, string | number> = {
    num:     "",
    name:    "Total Present",
    group:   "",
    profile: "",
  };
  sessions.forEach((s) => {
    totalsData[`s_${s.id}`] = participants.filter((p) => {
      const st = pivotMap[p.id][s.id];
      return st === "PRESENT";
    }).length;
  });
  totalsData.pct = "";

  const totalsRow = ws.addRow(totalsData);
  totalsRow.height = 16;
  totalsRow.eachCell({ includeEmpty: true }, (cell) => {
    cell.fill   = { type: "pattern", pattern: "solid", fgColor: { argb: BLUE_HEADER } };
    cell.font   = { bold: true, color: { argb: WHITE }, size: 10 };
    cell.border = allBorders();
    cell.alignment = { vertical: "middle", horizontal: "center" };
  });
  totalsRow.getCell(2).alignment = { vertical: "middle", horizontal: "left" };

  // ── Legend ──────────────────────────────────────────────────────────────────

  // ── Side-by-side legends ────────────────────────────────────────────────────
  // Attendance codes: cols A–B  |  OCIA Profile: cols D–E (same starting row)

  const attendanceCodes = [
    ["P", "Present"],
    ["E", "Excused"],
    ["A", "Absent"],
  ];
  const ociaProfiles = [
    ["Catechumen",                    "Never baptized — needs Baptism, First Communion, and Confirmation at Easter Vigil."],
    ["Candidate (Baptism Unverified)","Baptized in another Christian denomination — trinitarian validity not yet confirmed."],
    ["Candidate",                     "Baptized in another Christian denomination with confirmed valid trinitarian baptism — seeking full communion."],
    ["Candidate for Sacraments",      "Baptized Catholic but has not yet received First Communion."],
    ["Catholic Candidate",            "Baptized Catholic with First Communion — still needs Confirmation."],
    ["Fully Initiated",               "Has received all three sacraments: Baptism, Eucharist, and Confirmation."],
    ["Unknown",                       "No sacramental record has been filled in yet."],
  ];

  ws.addRow([]);
  const legendStart = ws.rowCount + 1;
  const totalLegendRows = Math.max(attendanceCodes.length, ociaProfiles.length) + 1; // +1 for header

  for (let i = 0; i < totalLegendRows; i++) {
    const row = ws.getRow(legendStart + i);

    if (i === 0) {
      // Header row
      row.getCell(1).value = "Legend — Attendance Codes";
      row.getCell(1).font  = { bold: true, size: 10 };
      row.getCell(4).value = "Legend — OCIA Profile";
      row.getCell(4).font  = { bold: true, size: 10 };
    } else {
      // Attendance code entry (cols A–B)
      const code = attendanceCodes[i - 1];
      if (code) {
        row.getCell(1).value = code[0];
        row.getCell(1).font  = { bold: true, size: 10 };
        row.getCell(2).value = code[1];
        row.getCell(2).font  = { size: 10 };
      }
      // OCIA profile entry (cols D–E)
      const profile = ociaProfiles[i - 1];
      if (profile) {
        row.getCell(4).value = profile[0];
        row.getCell(4).font  = { bold: true, size: 10 };
        row.getCell(5).value = profile[1];
        row.getCell(5).font  = { size: 10 };
      }
    }
    row.commit();
  }

  // ── Stream response ─────────────────────────────────────────────────────────

  const buffer = await wb.xlsx.writeBuffer();

  const filename = group ? `attendance-grid-${group.toLowerCase()}.xlsx` : "attendance-grid.xlsx";

  return new NextResponse(buffer, {
    headers: {
      "Content-Type":        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
