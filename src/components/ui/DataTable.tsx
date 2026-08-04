"use client";
import { formatChange, formatPct, formatNumber, formatVolume, cn } from "@/lib/utils";

export interface Column<T> {
  key: keyof T | string;
  label: string;
  align?: "left" | "right" | "center";
  render?: (row: T) => React.ReactNode;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyField: keyof T;
  emptyMessage?: string;
  className?: string;
}

export default function DataTable<T>({ columns, data, keyField, emptyMessage = "No data available", className }: DataTableProps<T>) {
  if (data.length === 0) {
    return (
      <div className="text-center py-12" style={{ color: "var(--text-muted)" }}>
        <p className="text-sm">{emptyMessage}</p>
      </div>
    );
  }
  return (
    <div className={cn("table-scroll", className)}>
      <table className="w-full text-sm" style={{ borderCollapse: "separate", borderSpacing: 0 }}>
        <thead>
          <tr style={{ background: "var(--light-bg)" }}>
            {columns.map((col) => (
              <th
                key={String(col.key)}
                className="px-3 py-2.5 text-xs font-semibold uppercase tracking-wider border-b whitespace-nowrap"
                style={{
                  color: "var(--text-muted)",
                  borderColor: "var(--border)",
                  textAlign: col.align ?? "left",
                }}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr
              key={String(row[keyField])}
              className="transition-colors"
              style={{ background: i % 2 === 0 ? "var(--white)" : "var(--light-bg)" }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#EFF6FF")}
              onMouseLeave={(e) => (e.currentTarget.style.background = i % 2 === 0 ? "var(--white)" : "var(--light-bg)")}
            >
              {columns.map((col) => (
                <td
                  key={String(col.key)}
                  className="px-3 py-2.5 border-b whitespace-nowrap"
                  style={{ borderColor: "var(--border)", textAlign: col.align ?? "left" }}
                >
                  {col.render ? col.render(row) : String((row as Record<string, unknown>)[String(col.key)] ?? "—")}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function ChangeCell({ value }: { value: string | number | null }) {
  const { text, positive } = formatChange(value);
  return (
    <span style={{ color: positive === true ? "var(--positive)" : positive === false ? "var(--negative)" : "var(--neutral)" }}>
      {text}
    </span>
  );
}

export function PctCell({ value }: { value: string | number | null }) {
  const { text, positive } = formatPct(value);
  return (
    <span style={{ color: positive === true ? "var(--positive)" : positive === false ? "var(--negative)" : "var(--neutral)" }}>
      {text}
    </span>
  );
}
