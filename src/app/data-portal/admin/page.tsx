import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession, canAccess } from "@/lib/auth";

export default async function AdminPage() {
  const session = await getSession();
  // Non-admin authenticated users are sent back to the portal, not the login page.
  if (!canAccess(session, "admin")) redirect("/data-portal");

  return (
    <div className="max-w-screen-xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-6">
        <div className="text-[9.5px] font-bold tracking-[0.15em] uppercase mb-0.5" style={{ color: "#D4971A" }}>Admin Panel</div>
        <h1 className="text-xl font-bold">
          <span style={{ color: "var(--text-primary)" }}>Over</span><span style={{ color: "#D4971A" }}>view</span>
        </h1>
        <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
          Logged in as {session?.fullName} · {session?.role}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg">
        <Link href="/dashboard/admin/import"
          className="card p-5 flex items-center gap-3 portal-pressable"
          style={{ textDecoration: "none" }}>
          <span className="text-2xl">📥</span>
          <div>
            <div className="font-semibold text-sm" style={{ color: "var(--navy)" }}>Import Data</div>
            <div className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>Upload CSV / XLSX files</div>
          </div>
        </Link>

        <Link href="/dashboard/admin/logs"
          className="card p-5 flex items-center gap-3 portal-pressable"
          style={{ textDecoration: "none" }}>
          <span className="text-2xl">📋</span>
          <div>
            <div className="font-semibold text-sm" style={{ color: "var(--navy)" }}>Import Logs</div>
            <div className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>View import history</div>
          </div>
        </Link>
      </div>
    </div>
  );
}
