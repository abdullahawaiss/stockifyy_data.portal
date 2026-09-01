export default function Loading() {
  return (
    <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 py-6 space-y-4">
      <div className="h-8 w-40 rounded-lg animate-pulse" style={{ background: "var(--border)" }} />
      <div className="card p-0 overflow-hidden">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="flex gap-4 px-4 py-3 border-b" style={{ borderColor: "var(--border)" }}>
            <div className="h-4 w-20 rounded animate-pulse" style={{ background: "var(--border)" }} />
            <div className="h-4 w-32 rounded animate-pulse" style={{ background: "var(--border)" }} />
            <div className="h-4 w-16 rounded animate-pulse ml-auto" style={{ background: "var(--border)" }} />
            <div className="h-4 w-20 rounded animate-pulse" style={{ background: "var(--border)" }} />
          </div>
        ))}
      </div>
    </div>
  );
}
