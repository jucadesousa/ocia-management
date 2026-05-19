"use client";
import * as XLSX from "xlsx";

type Props = {
  data: Record<string, unknown>[];
  filename: string;
  sheetName?: string;
  className?: string;
  children: React.ReactNode;
};

export function ExcelExportButton({ data, filename, sheetName, className, children }: Props) {
  function handleExport() {
    const ws = XLSX.utils.json_to_sheet(data);
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
