"use client";
import { useState } from "react";
import { redirect } from "next/navigation";

export default function ImportPage() {
  const [file, setFile] = useState<File | null>(null);
  const [importType, setImportType] = useState("daily_stock_prices");
  const [preview, setPreview] = useState<string[][]>([]);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<{ success?: boolean; message?: string; errors?: string[] } | null>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setResult(null);

    // Preview first 5 rows
    const text = await f.text();
    const rows = text.split("\n").slice(0, 6).map(r => r.split(","));
    setPreview(rows);
  }

  async function handleUpload() {
    if (!file) return;
    setUploading(true);
    setResult(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("importType", importType);
      const res = await fetch("/api/portal/import", { method: "POST", body: formData });
      const data = await res.json();
      setResult(data);
    } catch (err) {
      setResult({ success: false, message: "Upload failed: " + err });
    } finally {
      setUploading(false);
    }
  }

  const IMPORT_TYPES = [
    { value: "daily_stock_prices", label: "Daily Stock Prices" },
    { value: "index_data", label: "Index Data" },
    { value: "company_master", label: "Company Master Data" },
    { value: "sector_data", label: "Sector Data" },
    { value: "trading_calendar", label: "Trading Calendar" },
    { value: "financial_statements", label: "Financial Statements" },
    { value: "dividends", label: "Dividends" },
    { value: "announcements", label: "Announcements" },
    { value: "shariah_status", label: "Shariah Status" },
  ];

  return (
    <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 py-6">
      <div className="mb-5">
        <h1 className="text-xl font-bold" style={{ color: "var(--navy)" }}>Data Import Centre</h1>
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>Upload CSV or XLSX files to import market data</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-5">
          {/* Import type */}
          <div className="card p-5">
            <h2 className="text-sm font-semibold mb-4" style={{ color: "var(--navy)" }}>1. Select Import Type</h2>
            <select value={importType} onChange={(e) => setImportType(e.target.value)}
              className="w-full px-3 py-2.5 rounded border text-sm" style={{ borderColor: "var(--border)" }}>
              {IMPORT_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>

          {/* File upload */}
          <div className="card p-5">
            <h2 className="text-sm font-semibold mb-4" style={{ color: "var(--navy)" }}>2. Upload File</h2>
            <div className="border-2 border-dashed rounded-lg p-6 text-center" style={{ borderColor: "var(--border)" }}>
              <input type="file" accept=".csv,.xlsx,.xls" onChange={handleFileChange} className="hidden" id="file-upload" />
              <label htmlFor="file-upload" className="cursor-pointer">
                <div className="text-3xl mb-2">📁</div>
                <p className="text-sm font-medium" style={{ color: "var(--navy)" }}>Click to select CSV or XLSX file</p>
                <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>Maximum file size: 50MB</p>
              </label>
              {file && (
                <div className="mt-3 p-3 rounded" style={{ background: "var(--light-bg)" }}>
                  <p className="text-xs font-medium" style={{ color: "var(--navy)" }}>✓ {file.name}</p>
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>{(file.size / 1024).toFixed(1)} KB</p>
                </div>
              )}
            </div>
          </div>

          {/* Preview */}
          {preview.length > 0 && (
            <div className="card p-5">
              <h2 className="text-sm font-semibold mb-3" style={{ color: "var(--navy)" }}>3. Data Preview (first 5 rows)</h2>
              <div className="table-scroll">
                <table className="w-full text-xs" style={{ borderCollapse: "separate", borderSpacing: 0 }}>
                  <thead>
                    <tr style={{ background: "var(--light-bg)" }}>
                      {preview[0]?.map((h, i) => (
                        <th key={i} className="px-3 py-2 border-b text-left" style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {preview.slice(1).map((row, i) => (
                      <tr key={i} style={{ background: i % 2 === 0 ? "var(--white)" : "var(--light-bg)" }}>
                        {row.map((cell, j) => (
                          <td key={j} className="px-3 py-2 border-b" style={{ borderColor: "var(--border)" }}>{cell}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <button onClick={handleUpload} disabled={uploading || !file}
                className="mt-4 px-5 py-2.5 rounded text-sm font-semibold disabled:opacity-60"
                style={{ background: "var(--gold)", color: "var(--navy)" }}>
                {uploading ? "Importing…" : "4. Import Data"}
              </button>
            </div>
          )}

          {/* Result */}
          {result && (
            <div className="card p-5" style={{ borderColor: result.success ? "#34D399" : "#F87171" }}>
              <h2 className="text-sm font-semibold mb-2" style={{ color: result.success ? "var(--positive)" : "var(--negative)" }}>
                {result.success ? "✓ Import Successful" : "✗ Import Failed"}
              </h2>
              <p className="text-sm" style={{ color: "var(--text-secondary)" }}>{result.message}</p>
              {result.errors?.map((e, i) => (
                <p key={i} className="text-xs mt-1" style={{ color: "var(--negative)" }}>{e}</p>
              ))}
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="space-y-4">
          <div className="card p-4">
            <h2 className="text-sm font-semibold mb-3" style={{ color: "var(--navy)" }}>Import Instructions</h2>
            <div className="space-y-2 text-xs" style={{ color: "var(--text-secondary)" }}>
              <p><strong>Daily Stock Prices:</strong> Required columns: symbol, date, open, high, low, close, volume</p>
              <p><strong>Date format:</strong> YYYY-MM-DD</p>
              <p><strong>Numbers:</strong> No commas, use decimal points</p>
              <p><strong>After import:</strong> Weekly aggregation runs automatically</p>
            </div>
          </div>

          <div className="card p-4">
            <h2 className="text-sm font-semibold mb-2" style={{ color: "var(--navy)" }}>Import Workflow</h2>
            <ol className="text-xs space-y-1.5 list-decimal list-inside" style={{ color: "var(--text-secondary)" }}>
              {["Select import type", "Upload file", "Preview data", "Validate & import", "Auto-aggregate weekly", "View audit log"].map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ol>
          </div>

          <div className="card p-4">
            <h2 className="text-sm font-semibold mb-2" style={{ color: "var(--navy)" }}>Weekly Aggregation</h2>
            <p className="text-xs mb-3" style={{ color: "var(--text-secondary)" }}>
              After importing daily data, trigger weekly aggregation to update weekly records.
            </p>
            <button
              onClick={async () => {
                const res = await fetch("/api/portal/aggregate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({}) });
                const d = await res.json();
                alert(d.success ? `✓ Aggregated ${d.symbolsProcessed} symbols` : "Error: " + d.error);
              }}
              className="w-full px-3 py-2 rounded text-xs font-semibold"
              style={{ background: "var(--navy)", color: "var(--gold)" }}
            >
              🔄 Run Weekly Aggregation
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
