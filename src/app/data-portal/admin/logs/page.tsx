import { redirect } from "next/navigation";
import { getSession, canAccess } from "@/lib/auth";
import { db } from "@/db";
import { auditLogs, users, importBatches } from "@/db/schema";
import { desc, eq } from "drizzle-orm";

export default async function LogsPage() {
  const session = await getSession();
  if (!canAccess(session, "data_manager")) redirect("/dashboard/admin/login");

  const [logsResult, batchesResult] = await Promise.allSettled([
    db.select({ log: auditLogs, userName: users.fullName })
      .from(auditLogs)
      .leftJoin(users, eq(auditLogs.userId, users.id))
      .orderBy(desc(auditLogs.createdAt))
      .limit(50),
    db.select().from(importBatches).orderBy(desc(importBatches.createdAt)).limit(20),
  ]);

  const logs    = logsResult.status    === "fulfilled" ? logsResult.value    : [];
  const batches = batchesResult.status === "fulfilled" ? batchesResult.value : [];
  const dbError = logsResult.status === "rejected" || batchesResult.status === "rejected";

  return (
    <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 py-6">
      <div className="mb-5">
        <h1 className="text-xl font-bold" style={{ color: "var(--navy)" }}>Audit & Import Logs</h1>
        {dbError && (
          <p className="mt-2 text-sm px-3 py-2 rounded" style={{ background: "#FEF3C7", color: "#92400E", border: "1px solid #FCD34D" }}>
            One or more tables do not exist yet. Run <code className="font-mono font-bold">drizzle-kit push</code> to apply migrations.
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="card">
          <div className="px-4 py-3 border-b font-semibold text-sm" style={{ borderColor: "var(--border)", color: "var(--navy)" }}>Import History</div>
          <div className="divide-y" style={{ borderColor: "var(--border)" }}>
            {batches.map((b) => (
              <div key={b.id} className="px-4 py-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium" style={{ color: "var(--navy)" }}>{b.fileName ?? b.importType}</p>
                  <span className="text-xs px-1.5 py-0.5 rounded" style={{
                    background: b.status === "completed" ? "#D1FAE5" : b.status === "failed" ? "#FEE2E2" : "#FEF3C7",
                    color: b.status === "completed" ? "#065F46" : b.status === "failed" ? "#991B1B" : "#92400E",
                  }}>{b.status}</span>
                </div>
                <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                  {b.createdAt?.toISOString().slice(0, 16)} · {b.processedRows}/{b.totalRows ?? "?"} rows
                  {b.errorRows ? ` · ${b.errorRows} errors` : ""}
                </p>
                {b.errorSummary && <p className="text-xs mt-1" style={{ color: "var(--negative)" }}>{b.errorSummary.slice(0, 100)}</p>}
              </div>
            ))}
            {batches.length === 0 && <p className="px-4 py-4 text-sm" style={{ color: "var(--text-muted)" }}>No imports yet.</p>}
          </div>
        </div>

        <div className="card">
          <div className="px-4 py-3 border-b font-semibold text-sm" style={{ borderColor: "var(--border)", color: "var(--navy)" }}>Audit Log (Latest 50)</div>
          <div className="divide-y" style={{ borderColor: "var(--border)" }}>
            {logs.map(({ log, userName }) => (
              <div key={log.id} className="px-4 py-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium" style={{ color: "var(--navy)" }}>{log.action}</p>
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>{log.createdAt?.toISOString().slice(0, 16)}</p>
                </div>
                <p className="text-xs mt-0.5" style={{ color: "var(--text-secondary)" }}>
                  {userName ?? "System"} · {log.entityType ?? ""} #{log.entityId ?? ""}
                </p>
              </div>
            ))}
            {logs.length === 0 && <p className="px-4 py-4 text-sm" style={{ color: "var(--text-muted)" }}>No audit events yet.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
