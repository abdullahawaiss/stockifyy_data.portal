import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string;
  subValue?: string;
  trend?: "up" | "down" | "neutral";
  className?: string;
}

export default function StatCard({ label, value, subValue, trend, className }: StatCardProps) {
  const trendColor = trend === "up" ? "var(--positive)" : trend === "down" ? "var(--negative)" : "var(--neutral)";
  return (
    <div className={cn("card p-4", className)}>
      <p className="text-xs font-medium uppercase tracking-wider mb-1" style={{ color: "var(--text-muted)" }}>
        {label}
      </p>
      <p className="text-2xl font-bold leading-none mb-1" style={{ color: "var(--text-primary)" }}>
        {value}
      </p>
      {subValue && (
        <p className="text-sm font-medium" style={{ color: trend ? trendColor : "var(--text-secondary)" }}>
          {subValue}
        </p>
      )}
    </div>
  );
}
