"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Login failed"); return; }
      router.push("/data-portal/admin");
      router.refresh();
    } catch { setError("Network error. Please try again."); } finally { setLoading(false); }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "var(--navy)" }}>
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold" style={{ color: "var(--gold)" }}>Stockifyy</h1>
          <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.6)" }}>Data Portal — Staff Login</p>
        </div>
        <div className="card p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-muted)" }}>Email Address</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
                className="w-full px-3 py-2.5 rounded border text-sm" style={{ borderColor: "var(--border)" }}
                placeholder="admin@stockifyy.com" />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-muted)" }}>Password</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required
                className="w-full px-3 py-2.5 rounded border text-sm" style={{ borderColor: "var(--border)" }}
                placeholder="••••••••" />
            </div>
            {error && <p className="text-xs font-medium" style={{ color: "var(--negative)" }}>{error}</p>}
            <button type="submit" disabled={loading}
              className="w-full py-2.5 rounded text-sm font-semibold disabled:opacity-60"
              style={{ background: "var(--gold)", color: "var(--navy)" }}>
              {loading ? "Signing in…" : "Sign In"}
            </button>
          </form>
          <p className="text-xs text-center mt-4" style={{ color: "var(--text-muted)" }}>
            Demo: admin@stockifyy.com / admin123
          </p>
        </div>
        <p className="text-xs text-center mt-4" style={{ color: "rgba(255,255,255,0.3)" }}>
          Access restricted to authorised staff only
        </p>
      </div>
    </div>
  );
}
