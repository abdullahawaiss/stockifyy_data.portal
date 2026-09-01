export default function Loading() {
  return (
    <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 py-6 space-y-4">
      <div className="h-8 w-44 rounded-lg animate-pulse" style={{ background: "var(--border)" }} />
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
        {Array.from({ length: 20 }).map((_, i) => (
          <div key={i} className="card p-4 space-y-2 animate-pulse">
            <div className="h-5 w-16 rounded" style={{ background: "var(--border)" }} />
            <div className="h-3 w-full rounded" style={{ background: "var(--border)" }} />
            <div className="h-3 w-2/3 rounded" style={{ background: "var(--border)" }} />
          </div>
        ))}
      </div>
    </div>
  );
}
