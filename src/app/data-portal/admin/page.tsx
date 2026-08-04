import { redirect } from "next/navigation";
import { getSession, canAccess } from "@/lib/auth";
import Link from "next/link";
import { db } from "@/db";
import { importBatches, aggregationJobs, dailyStockPrices, weeklyStockPrices, companies } from "@/db/schema";
import { desc, count, sql } from "drizzle-orm";

export default async function AdminPage() {
  const session = await getSession();
  if (!canAccess(session, "data_manager")) {
    redirect("/data-portal/admin/login");
  }

  const [recentBatches, recentJobs, [stats]] = await Promise.all([
    db.select().from(importBatches).orderBy(desc(importBatches.createdAt)).limit(5),
    db.select().from(aggregationJobs).orderBy(desc(aggregationJobs.createdAt)).limit(5),
    db.select({
      dailyCount: sql<number>`count(distinct (symbol, trading_date))`,
      weeklyCount: sql<number>`(select count(*) from weekly_stock_prices)`,
      companyCount: sql<number>`(select count(*) from companies)`,
    }).from(dailyStockPrices),
  ]);

  return (
    <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 py-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold" style={{ color: "var(--navy)" }}>Admin Panel</h1>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>Welcome, {session?.fullName} · Role: {session?.role}</p>
        </div>
        <form action="/api/auth/logout" method="POST">
          <button type="submit" className="px-4 py-2 rounded border text-sm" style={{ borderColor: "var(--border)", color: "var(--text-secondary)" }}>
            Sign Out
          </button>
        </form>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
        {[
          { label: "Daily Records", value: stats?.dailyCount?.toLocaleString() ?? "—" },
          { label: "Weekly Records", value: stats?.weeklyCount?.toLocaleString() ?? "—" },
          { label: "Companies", value: stats?.companyCount?.toLocaleString() ?? "—" },
        ].map((s) => (
          <div key={s.label} className="card p-4 text-center">
            <p className="text-xs mb-1" style={{ color: "var(--text-muted)" }}>{s.label}</p>
            <p className="text-2xl font-bold" style={{ color: "var(--navy)" }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {[
          { title: "Import Data", desc: "Upload CSV/XLSX market data files", href: "/data-portal/admin/import", icon: "📥" },
          { title: "Aggregate Weekly", desc: "Trigger weekly data recalculation", href: "#", id: "aggregate-btn", icon: "🔄" },
          { title: "Import Logs", desc: "View import history and errors", href: "/data-portal/admin/logs", icon: "📋" },
          { title: "Audit Logs", desc: "View all system audit events", href: "/data-portal/admin/logs?type=audit", icon: "🔍" },
          { title: "Company Management", desc: "Add or edit company information", href: "/data-portal/companies", icon: "🏢" },
          { title: "System Settings", desc: "Configure portal settings", href: "#", icon: "⚙️" },
        ].map((action) => (
          <Link key={action.title} href={action.href} className="card p-5 flex items-start gap-3 hover:shadow-md transition-shadow">
            <span className="text-2xl">{action.icon}</span>
            <div>
              <p className="font-semibold text-sm" style={{ color: "var(--navy)" }}>{action.title}</p>
              <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{action.desc}</p>
            </div>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Recent imports */}
        <div className="card">
          <div className="px-4 py-3 border-b font-semibold text-sm" style={{ borderColor: "var(--border)", color: "var(--navy)" }}>
            Recent Imports
          </div>
          <div className="divide-y" style={{ borderColor: "var(--border)" }}>
            {recentBatches.map((b) => (
              <div key={b.id} className="px-4 py-3 flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium" style={{ color: "var(--navy)" }}>{b.fileName ?? b.importType}</p>
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>{b.createdAt?.toISOString().slice(0, 16)} · {b.processedRows}/{b.totalRows} rows</p>
                </div>
                <span className="text-xs px-2 py-0.5 rounded font-medium" style={{
                  background: b.status === "completed" ? "#D1FAE5" : b.status === "failed" ? "#FEE2E2" : "#FEF3C7",
                  color: b.status === "completed" ? "#065F46" : b.status === "failed" ? "#991B1B" : "#92400E",
                }}>
                  {b.status}
                </span>
              </div>
            ))}
            {recentBatches.length === 0 && <p className="px-4 py-4 text-sm" style={{ color: "var(--text-muted)" }}>No imports yet.</p>}
          </div>
        </div>

        {/* Recent aggregation jobs */}
        <div className="card">
          <div className="px-4 py-3 border-b font-semibold text-sm" style={{ borderColor: "var(--border)", color: "var(--navy)" }}>
            Aggregation Jobs
          </div>
          <div className="divide-y" style={{ borderColor: "var(--border)" }}>
            {recentJobs.map((j) => (
              <div key={j.id} className="px-4 py-3 flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium" style={{ color: "var(--navy)" }}>{j.jobType} · {j.weekStartDate ?? "—"}</p>
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>{j.createdAt?.toISOString().slice(0, 16)} · {j.symbolsProcessed ?? 0} symbols · {j.triggeredBy}</p>
                </div>
                <span className="text-xs px-2 py-0.5 rounded font-medium" style={{
                  background: j.status === "completed" ? "#D1FAE5" : j.status === "failed" ? "#FEE2E2" : "#FEF3C7",
                  color: j.status === "completed" ? "#065F46" : j.status === "failed" ? "#991B1B" : "#92400E",
                }}>
                  {j.status}
                </span>
              </div>
            ))}
            {recentJobs.length === 0 && <p className="px-4 py-4 text-sm" style={{ color: "var(--text-muted)" }}>No jobs yet.</p>}
          </div>
          <div className="px-4 py-3 border-t" style={{ borderColor: "var(--border)" }}>
            <AggregateButton />
          </div>
        </div>
      </div>
    </div>
  );
}

function AggregateButton() {
  return (
    <form action="/api/portal/aggregate" method="POST" onSubmit={(e) => {
      e.preventDefault();
      fetch("/api/portal/aggregate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({}) })
        .then(r => r.json()).then(d => alert(d.success ? `Aggregated ${d.symbolsProcessed} symbols` : "Error: " + d.error));
    }}>
      <button type="submit" className="px-4 py-2 rounded text-sm font-semibold" style={{ background: "var(--navy)", color: "var(--gold)" }}>
        🔄 Run Weekly Aggregation Now
      </button>
    </form>
  );
}
