"use client";
import * as XLSX from "xlsx";

type Props = {
  data: Record<string, unknown>[];
  filename: string;
  sheetName?: string;
  header?: string[];
  footer?: (string | number)[][];
  className?: string;
  children: React.ReactNode;
};

export function ExcelExportButton({ data, filename, sheetName, header, footer, className, children }: Props) {
  function handleExport() {
    const ws = XLSX.utils.json_to_sheet(data, header ? { header } : undefined);
    if (footer && footer.length > 0) {
      XLSX.utils.sheet_add_aoa(ws, [[]], { origin: -1 });
      XLSX.utils.sheet_add_aoa(ws, footer, { origin: -1 });
    }
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, sheetName ?? "Data");
    XLSX.writeFile(wb, filename);
  }

  return (
    <button type="button" onClick={handleExport} className={className}>
      {children}
    </button>
  );
}
