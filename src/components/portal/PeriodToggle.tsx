"use client";
import { useRouter, useSearchParams, usePathname } from "next/navigation";

export default function PeriodToggle() {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const period = sp.get("period") ?? "daily";

  function toggle(p: string) {
    const params = new URLSearchParams(sp.toString());
    params.set("period", p);
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div
      className="inline-flex rounded-lg overflow-hidden border"
      style={{ borderColor: "var(--border)" }}
    >
      {(["daily", "weekly"] as const).map((p) => (
        <button
          key={p}
          onClick={() => toggle(p)}
          className="px-4 py-1.5 text-sm font-medium capitalize transition-colors"
          style={{
            background: period === p ? "var(--navy)" : "var(--white)",
            color: period === p ? "var(--gold)" : "var(--text-secondary)",
          }}
        >
          {p}
        </button>
      ))}
    </div>
  );
}
