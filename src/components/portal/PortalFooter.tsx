export default function PortalFooter() {
  return (
    <footer className="mt-auto border-t py-6 px-4" style={{ background: "var(--navy)", borderColor: "rgba(212,175,55,0.15)" }}>
      <div className="max-w-screen-2xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
        <span className="text-sm font-bold" style={{ color: "var(--gold)" }}>Stockifyy Data Portal</span>
        <p className="text-xs text-center" style={{ color: "rgba(255,255,255,0.35)" }}>
          © {new Date().getFullYear()} Stockifyy Private Limited · Data for informational purposes only · Not financial advice
        </p>
        <span className="text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>
          All times PKT (UTC+5)
        </span>
      </div>
    </footer>
  );
}
