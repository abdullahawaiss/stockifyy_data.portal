import Link from "next/link";
import Image from "next/image";

const SOCIAL = [
  {
    name: "Facebook",
    href: "https://www.facebook.com/share/1DVyc4gxmw/?mibextid=wwXIfr",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
        <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
      </svg>
    ),
  },
  {
    name: "Instagram",
    href: "https://www.instagram.com/stockifyyltd?igsh=bzRkYnE2NHhoeTF0",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
        <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
      </svg>
    ),
  },
  {
    name: "LinkedIn",
    href: "https://www.linkedin.com/company/stockifyy",  // update when available
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
        <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6zM2 9h4v12H2z"/>
        <circle cx="4" cy="4" r="2"/>
      </svg>
    ),
  },
  {
    name: "YouTube",
    href: "https://youtube.com/@stockifyyltd?si=ewFW8q-mjiawN6uc",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
        <path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46A2.78 2.78 0 0 0 1.46 6.42 29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58 2.78 2.78 0 0 0 1.95 1.96C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 0 0 1.95-1.96A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58z"/>
        <polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02" fill="white"/>
      </svg>
    ),
  },
  {
    name: "Twitter",
    href: "https://x.com/stockifyypsx?s=11",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
      </svg>
    ),
  },
];

const PRODUCTS = [
  { label: "Market Overview",  href: "/dashboard" },
  { label: "Advanced Screener",href: "/dashboard/screener" },
  { label: "Trading View",     href: "/dashboard/indices" },
  { label: "Portfolio",        href: "/dashboard/portfolio" },
  { label: "Trainings",        href: "/trainings" },
];

const COMPANY = [
  { label: "About Us",          href: "/about" },
  { label: "Careers",           href: "/careers" },
  { label: "Terms & Conditions",href: "/terms-of-service" },
  { label: "Privacy Policy",    href: "/privacy-policy" },
];

export default function PortalFooter() {
  return (
    <footer style={{ background: "#07111F", borderTop: "1px solid rgba(212,175,55,0.15)" }}>

      {/* ── Main grid ── */}
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 py-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">

        {/* Brand + social */}
        <div>
          <div className="mb-2">
            <Image
              src="/stockifyy-full-logo.png"
              alt="Stockifyy"
              width={160}
              height={56}
              className="object-contain logo-gold"
            />
          </div>
          <p className="text-xs leading-relaxed mb-4" style={{ color: "rgba(255,255,255,0.4)" }}>
            Pakistan&apos;s trusted financial data platform for PSX market intelligence.
          </p>
          <div className="flex items-center gap-3">
            {SOCIAL.map(s => (
              <a
                key={s.name}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={s.name}
                className="flex items-center justify-center rounded-lg transition-all hover:scale-110"
                style={{
                  width: 32, height: 32,
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  color: "rgba(255,255,255,0.65)",
                }}
              >
                {s.icon}
              </a>
            ))}
          </div>
        </div>

        {/* Products */}
        <div>
          <h3 className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "var(--gold)" }}>
            Products
          </h3>
          <ul className="space-y-2">
            {PRODUCTS.map(p => (
              <li key={p.href}>
                <Link
                  href={p.href}
                  className="text-xs transition-colors hover:text-white"
                  style={{ color: "rgba(255,255,255,0.5)" }}
                >
                  {p.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Company */}
        <div>
          <h3 className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "var(--gold)" }}>
            Company
          </h3>
          <ul className="space-y-2">
            {COMPANY.map(c => (
              <li key={c.href}>
                <Link
                  href={c.href}
                  className="text-xs transition-colors hover:text-white"
                  style={{ color: "rgba(255,255,255,0.5)" }}
                >
                  {c.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Contact + App */}
        <div>
          <h3 className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "var(--gold)" }}>
            Contact Us
          </h3>
          <ul className="space-y-2 mb-5">
            <li className="text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>
              <span style={{ color: "rgba(255,255,255,0.3)" }}>Phone: </span>+92 334 1555503
            </li>
            <li className="text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>
              <span style={{ color: "rgba(255,255,255,0.3)" }}>Email: </span>info@stockifyy.com
            </li>
            <li className="text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.5)" }}>
              <span style={{ color: "rgba(255,255,255,0.3)" }}>Address: </span>
              Office 3121, 3rd Floor, World Trade Center, Islamabad
            </li>
          </ul>

          {/* App store badges */}
          <div className="flex flex-col gap-2">
            <a
              href="https://apps.apple.com/us/app/zar-by-sarmaaya/id6480111724"
              target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2 px-3 py-2 rounded-lg transition-all hover:opacity-80"
              style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)", width: "fit-content" }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="white"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/></svg>
              <div>
                <div className="text-[9px]" style={{ color: "rgba(255,255,255,0.45)" }}>Download on the</div>
                <div className="text-xs font-bold text-white">App Store</div>
              </div>
            </a>
            <a
              href="https://play.google.com/store/apps/details?id=pk.sarmaaya.zar"
              target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2 px-3 py-2 rounded-lg transition-all hover:opacity-80"
              style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)", width: "fit-content" }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="white"><path d="M3.18 23.76c.3.17.64.22.98.15l12.09-6.98-2.54-2.54-10.53 9.37zM.53 1.7C.2 2.04 0 2.58 0 3.28v17.43c0 .7.2 1.24.53 1.58l.08.08 9.76-9.76v-.23L.61 1.62.53 1.7zM20.07 10.4l-2.72-1.57-2.86 2.86 2.86 2.85 2.74-1.58c.78-.45.78-1.11-.02-1.56zM4.16.24l12.09 6.98-2.54 2.54L3.18.39A1.2 1.2 0 0 1 4.16.24z"/></svg>
              <div>
                <div className="text-[9px]" style={{ color: "rgba(255,255,255,0.45)" }}>Download on the</div>
                <div className="text-xs font-bold text-white">Google Play</div>
              </div>
            </a>
          </div>
        </div>
      </div>

      {/* ── Disclaimer ── */}
      <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 py-4">
          <p className="text-[10px] leading-relaxed mb-3" style={{ color: "rgba(255,255,255,0.28)" }}>
            <span className="font-semibold" style={{ color: "rgba(255,255,255,0.4)" }}>Disclaimer: </span>
            Stockifyy Advisory Private Limited, a PSX authorized data redistributor, and CS Solutions (Pvt.) Ltd. make no guarantees
            regarding the timeliness, accuracy, or completeness of data on their website. They disclaim all warranties and assume no
            liability for any damages, whether direct or indirect, arising from the use of their data. The information provided is not
            an offering of financial instruments or investment advice. Users should not rely solely on the website&apos;s data for
            investment decisions.
          </p>
          <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.25)" }}>
            © {new Date().getFullYear()} STOCKIFYY.PK · All rights reserved
          </p>
        </div>
      </div>

    </footer>
  );
}
