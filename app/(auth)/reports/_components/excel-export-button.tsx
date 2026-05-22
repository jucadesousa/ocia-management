"use client";
import * as XLSX from "xlsx";

type Props = {
  data: Record<string, unknown>[];
  filename: string;
  sheetName?: string;
  header?: string[];
  className?: string;
  children: React.ReactNode;
};

export function ExcelExportButton({ data, filename, sheetName, header, className, children }: Props) {
  function handleExport() {
    const ws = XLSX.utils.json_to_sheet(data, header ? { header } : undefined);
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
