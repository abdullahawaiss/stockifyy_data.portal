import Link from "next/link";

export default function HomePage() {
  return (
    <main
      className="min-h-screen flex flex-col items-center justify-center"
      style={{ background: "var(--navy)" }}
    >
      <div className="text-center px-6 max-w-2xl">
        <div className="mb-8">
          <span
            className="text-5xl font-bold tracking-tight"
            style={{ color: "var(--gold)" }}
          >
            Stockifyy
          </span>
          <span
            className="block text-lg mt-2"
            style={{ color: "rgba(255,255,255,0.7)" }}
          >
            Pakistan&apos;s Trusted Financial Data Platform
          </span>
        </div>
        <p className="mb-10 text-base leading-relaxed" style={{ color: "rgba(255,255,255,0.55)" }}>
          Comprehensive market data, company research, and financial information
          for the Pakistan Stock Exchange.
        </p>
        <Link
          href="/data-portal"
          className="inline-block px-8 py-3 rounded-lg font-semibold text-base transition-all duration-150"
          style={{
            background: "var(--gold)",
            color: "var(--navy)",
          }}
        >
          Open Data Portal →
        </Link>
      </div>
    </main>
  );
}
