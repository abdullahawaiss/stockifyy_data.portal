import { redirect } from "next/navigation";
import { getSession, canAccess } from "@/lib/auth";

// All /data-portal/admin/* pages are gated here.
// Middleware has already verified a valid JWT; this DB check verifies the session is active
// and the user actually has admin role — deactivated accounts with live JWTs are caught here.
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();

  if (!session) {
    redirect("/auth/login?returnTo=/data-portal/admin");
  }

  if (!canAccess(session, "admin")) {
    redirect("/data-portal");
  }

  return <>{children}</>;
}
