"use client";
import { useState, useEffect, useRef, ReactNode } from "react";
import Link from "next/link";

// ── Scroll-reveal with multiple animation styles ──────────────────────────
function useReveal(threshold = 0.1) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } }, { threshold });
    obs.observe(el); return () => obs.disconnect();
  }, [threshold]);
  return { ref, visible };
}

type AnimFrom = "bottom" | "left" | "right" | "fade" | "scale" | "blur";
function Reveal({ children, delay = 0, from = "bottom" }: { children: ReactNode; delay?: number; from?: AnimFrom }) {
  const { ref, visible } = useReveal();
  const transforms: Record<AnimFrom, string> = {
    bottom: "translateY(32px)", left: "translateX(-32px)", right: "translateX(32px)",
    fade: "translateY(0)", scale: "scale(0.93) translateY(12px)", blur: "translateY(16px)",
  };
  return (
    <div ref={ref} style={{
      opacity: visible ? 1 : 0,
      transform: visible ? "scale(1) translateY(0) translateX(0)" : transforms[from],
      filter: from === "blur" ? (visible ? "blur(0)" : "blur(6px)") : undefined,
      transition: `opacity 0.55s cubic-bezier(.4,0,.2,1) ${delay}ms, transform 0.55s cubic-bezier(.4,0,.2,1) ${delay}ms, filter 0.55s ease ${delay}ms`,
    }}>{children}</div>
  );
}

// ── Data ──────────────────────────────────────────────────────────────────
const STEPS = [
  { num: "01", icon: "🪪", title: "Prepare Documents", items: ["CNIC / SNIC (both sides)", "Bank Account details", "Specimen Signature", "Email ID", "CNIC-registered mobile"] },
  { num: "02", icon: "📋", title: "Submit Application", items: ["Choose account type", "Fill form or WhatsApp us", "Joint / Overseas options available"] },
  { num: "03", icon: "🔍", title: "Biometric Verification", items: ["Visit any branch or NCCPL", "Overseas Pakistanis exempt", "Takes under 15 minutes"] },
  { num: "04", icon: "✅", title: "Start Trading", items: ["Activated within 24 hours", "860+ PSX stocks unlocked", "Free premium services included"] },
];

const ACCOUNT_TYPES = [
  { title: "Sahulat Account", badge: "MOST POPULAR", color: "#C8860A", desc: "Perfect for new investors starting their PSX journey.", limit: "Trading Limit: Rs 3,000,000", wa: "03010301246", waDisplay: "0301-0301246", items: ["CNIC / SNIC", "Bank Account", "Signatures", "Email ID", "Registered Mobile"] },
  { title: "Full PSX Account", badge: "NO LIMIT", color: "#1a6b3a", desc: "Unlimited trading via Munir Khanani Securities.", limit: "No upper trading limit", wa: "923114944443", waDisplay: "0311-4944443", items: ["Same 5 documents", "Biometric verification", "Munir Khanani Securities", "PSX member broker access"] },
  { title: "Overseas (RDA)", badge: "NRP", color: "#1a3a6b", desc: "Overseas Pakistanis investing in PSX via Roshan Digital Account.", limit: "Biometric Exempted", wa: "923114944443", waDisplay: "0311-4944443", items: ["CNIC / NICOP / Passport", "Foreign bank account", "RDA at any Pakistan bank", "No biometric required"] },
];

const WHY = [
  { icon: "🏛️", title: "SECP Licensed", desc: "Licence No. SECP/LRD/LD/73/S&A/SIPL/2025" },
  { icon: "🤝", title: "PSX Member Broker", desc: "Accounts via Munir Khanani Securities" },
  { icon: "📊", title: "Free Data Portal", desc: "Live heatmap, screener & real-time stock data" },
  { icon: "📞", title: "Dedicated Dealer", desc: "Personal equity dealer assigned to you" },
  { icon: "🎓", title: "26 Live Zoom Sessions", desc: "Monthly Q&A sessions with expert analysts" },
  { icon: "⚡", title: "1-on-1 Guidance", desc: "Direct research support from our team" },
  { icon: "☪️", title: "Shariah Screener", desc: "Filter halal-compliant stocks on PSX instantly" },
  { icon: "📢", title: "PSX Announcements", desc: "Real-time corporate announcements & results" },
];

const SERVICES_MAIN = [
  { icon: "📈", title: "Trade with Stockifyy", color: "#0f5132", badge: "SWING CALLS", price: "From Rs 6,000/mo", features: ["Short-term trade calls", "Risk-managed trading", "Learning & guidance"] },
  { icon: "💼", title: "Invest with Stockifyy", color: "#1a3560", badge: "ADVISORY", price: "From Rs 7,000/mo", features: ["Buy/sell ideas — Dr. Masood Rashid", "Stock levels & targets", "Members-only chat group", "Monthly Zoom Q&A"] },
  { icon: "📊", title: "Portfolio Designing", color: "#4a1a6b", badge: "PERSONALIZED", price: "Contact for pricing", features: ["Capital growth / dividend income", "Risk profiling (Conservative → Aggressive)", "30%–35% potential returns"] },
];

const TEAM = [
  { icon: "💎", name: "Dr. Masood Rashid", role: "Head of Research & Advisory", tier: "Diamond — Rs 20,000", color: "#C8860A" },
  { icon: "🥈", name: "M. Sufiyan · Mufeez Aziz · Moiz Shahzad", role: "Senior Analysts", tier: "Platinum — Rs 15,000", color: "#94a3b8" },
  { icon: "🥇", name: "Hassan Askari · Saad Arshad · Hafsa Talpur", role: "Research Team", tier: "Gold — Rs 10,000", color: "#cd7f32" },
];

// ── Main Component ────────────────────────────────────────────────────────
export default function OpenAccountClient() {
  const [dark, setDark] = useState(false);
  const [form, setForm] = useState({ name: "", mobile: "", type: "sahulat", email: "" });
  const [submitted, setSubmitted] = useState(false);
  const [showTop, setShowTop] = useState(false);
  const [pkTime, setPkTime] = useState("");
  const [marketOpen, setMarketOpen] = useState(false);
  const [particles, setParticles] = useState<{ x: number; y: number; size: number; speed: number; opacity: number }[]>([]);

  useEffect(() => {
    setParticles(Array.from({ length: 18 }, () => ({
      x: Math.random() * 100, y: Math.random() * 100,
      size: Math.random() * 3 + 1, speed: Math.random() * 22 + 14, opacity: Math.random() * 0.35 + 0.08,
    })));
    const onScroll = () => setShowTop(window.scrollY > 400);
    window.addEventListener("scroll", onScroll);
    // Pakistan time clock
    const tick = () => {
      const now = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Karachi" }));
      const h = now.getHours(), m = now.getMinutes();
      const hStr = h % 12 || 12, mStr = String(m).padStart(2, "0");
      const ampm = h >= 12 ? "PM" : "AM";
      setPkTime(`${hStr}:${mStr} ${ampm} PKT`);
      const dow = now.getDay(); // 0=Sun,6=Sat
      const isWeekday = dow >= 1 && dow <= 5;
      const totalMin = h * 60 + m;
      setMarketOpen(isWeekday && totalMin >= 9 * 60 + 30 && totalMin < 15 * 60 + 30);
    };
    tick();
    const id = setInterval(tick, 30000);
    return () => { window.removeEventListener("scroll", onScroll); clearInterval(id); };
  }, []);

  function setF(k: string, v: string) { setForm(f => ({ ...f, [k]: v })); }
  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !form.mobile) return;
    // Send data to Stockifyy via WhatsApp
    const msg = encodeURIComponent(
      `*New Account Application — Stockifyy*\n\n` +
      `Name: ${form.name}\nMobile: ${form.mobile}\n` +
      (form.email ? `Email: ${form.email}\n` : "") +
      `Account Type: ${form.type}\n\n_Submitted from stockifyy.com_`
    );
    window.open(`https://wa.me/923114944443?text=${msg}`, "_blank");
    setSubmitted(true);
  }

  // CSS variable values for dark/light
  const pg = {
    bg: dark ? "#0a1628" : "#f5f6f8",
    card: dark ? "#111e30" : "#ffffff",
    text: dark ? "#e2e8f0" : "#1a2035",
    muted: dark ? "#94a3b8" : "#64748b",
    border: dark ? "rgba(255,255,255,0.09)" : "#e8eaf0",
    navy: dark ? "#cbd5e1" : "#07111F",
    section: dark ? "#0d1e38" : "#eef0f5",
  };

  const inp: React.CSSProperties = {
    width: "100%", padding: "10px 13px", borderRadius: 8, boxSizing: "border-box",
    border: `1.5px solid ${pg.border}`, background: pg.bg, fontSize: 13,
    color: pg.text, outline: "none",
  };

  return (
    <div style={{ minHeight: "100vh", background: pg.bg, color: pg.text, fontFamily: "inherit", overflowX: "hidden", transition: "background 0.3s, color 0.3s" }}>

      {/* ── Sticky Navbar ── */}
      <div style={{
        position: "sticky", top: 0, zIndex: 100,
        background: dark ? "rgba(10,22,40,0.95)" : "rgba(255,255,255,0.95)",
        backdropFilter: "blur(12px)",
        borderBottom: `1px solid ${pg.border}`,
        padding: "10px 28px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <a href="/" style={{ display: "flex", alignItems: "center", textDecoration: "none" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/stockifyy-full-logo.png" alt="Stockifyy" style={{ height: 32, objectFit: "contain", maxWidth: 160 }} />
        </a>

        {/* ── Centre: time + market status + quick links ── */}
        <div style={{ display: "flex", alignItems: "center", gap: 18, flex: 1, justifyContent: "center", flexWrap: "wrap" }}>
          {/* Pakistan time */}
          {pkTime && (
            <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11.5, color: pg.muted, fontWeight: 600 }}>
              🕐 <span style={{ fontVariantNumeric: "tabular-nums" }}>{pkTime}</span>
            </div>
          )}
          {/* Market status */}
          <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, fontWeight: 700 }}>
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: marketOpen ? "#16a34a" : "#ef4444", display: "inline-block", animation: marketOpen ? "pulse 2s infinite" : "none" }} />
            <span style={{ color: marketOpen ? "#16a34a" : "#ef4444" }}>{marketOpen ? "Market Open" : "Market Closed"}</span>
          </div>
          {/* Divider */}
          <div style={{ width: 1, height: 18, background: pg.border }} />
          {/* Quick links */}
          <Link href="/data-portal" style={{ fontSize: 11.5, color: pg.muted, fontWeight: 600, textDecoration: "none" }}>Data Portal</Link>
          <Link href="/data-portal/heatmap" style={{ fontSize: 11.5, color: pg.muted, fontWeight: 600, textDecoration: "none" }}>Heatmap</Link>
          <Link href="/data-portal/screener" style={{ fontSize: 11.5, color: pg.muted, fontWeight: 600, textDecoration: "none" }}>Screener</Link>
        </div>

        <button
          onClick={() => setDark(d => !d)}
          style={{ padding: "6px 14px", borderRadius: 20, border: `1.5px solid ${pg.border}`, background: "transparent", cursor: "pointer", fontSize: 12.5, color: pg.muted, fontWeight: 600, flexShrink: 0 }}
        >{dark ? "☀ Light" : "🌙 Dark"}</button>
      </div>

      {/* ── Hero — two-column: headline left, form right ── */}
      <div style={{
        background: `linear-gradient(140deg, #0a1e3c 0%, #122d58 50%, #1a3a6b 100%)`,
        position: "relative", overflow: "hidden",
      }}>
        {particles.map((p, i) => (
          <div key={i} style={{
            position: "absolute", left: `${p.x}%`, top: `${p.y}%`,
            width: p.size, height: p.size, borderRadius: "50%",
            background: "#C8860A", opacity: p.opacity,
            animation: `float ${p.speed}s ease-in-out infinite alternate`,
            animationDelay: `${i * 0.4}s`, pointerEvents: "none",
          }} />
        ))}
        <div style={{ position: "absolute", top: -100, left: "50%", transform: "translateX(-50%)", width: 700, height: 320, background: "radial-gradient(ellipse, rgba(200,134,10,0.18) 0%, transparent 70%)", pointerEvents: "none" }} />

        <div style={{ maxWidth: 1140, margin: "0 auto", padding: "48px 24px 56px", display: "grid", gridTemplateColumns: "1fr 420px", gap: 40, alignItems: "center", position: "relative", zIndex: 1 }}>

          {/* Left — headline */}
          <div>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "4px 16px", borderRadius: 20, border: "1px solid rgba(200,134,10,0.45)", background: "rgba(200,134,10,0.1)", marginBottom: 20, animation: "fadeSlideIn 0.7s ease both" }}>
              <span style={{ fontSize: 10.5, color: "#C8860A", fontWeight: 800, letterSpacing: "0.08em" }}>SECP LICENSED · PSX MEMBER · MUNIR KHANANI SECURITIES</span>
            </div>
            <h1 style={{ fontSize: "clamp(28px,4vw,50px)", fontWeight: 900, color: "#fff", margin: "0 0 14px", lineHeight: 1.12, animation: "fadeSlideIn 0.75s ease 0.1s both" }}>
              Open Your PSX Account<br />
              <span style={{ color: "#C8860A" }}>Start Investing Today</span>
            </h1>
            <p style={{ fontSize: 14.5, color: "rgba(255,255,255,0.7)", margin: "0 0 28px", lineHeight: 1.7, fontWeight: 400, maxWidth: 460, animation: "fadeSlideIn 0.75s ease 0.2s both" }}>
              Pakistan&apos;s trusted SECP-licensed advisory. Open your brokerage account in under 24 hours and get free access to research, live data, and expert guidance.
            </p>
            <div style={{ display: "flex", gap: 20, flexWrap: "wrap", marginBottom: 28, animation: "fadeSlideIn 0.75s ease 0.3s both" }}>
              {[["🚀", "24-hour activation"], ["💯", "Zero setup fee"], ["🔐", "SECP regulated"], ["📊", "Free data portal"]].map(([icon, label]) => (
                <div key={String(label)} style={{ fontSize: 12.5, color: "rgba(255,255,255,0.65)", display: "flex", alignItems: "center", gap: 6, fontWeight: 500 }}>
                  <span style={{ fontSize: 15 }}>{icon}</span>{label}
                </div>
              ))}
            </div>
            <div style={{ display: "flex", gap: 10, animation: "fadeSlideIn 0.75s ease 0.35s both" }}>
              <a href="https://wa.me/923114944443" target="_blank" rel="noreferrer" style={{ padding: "11px 22px", background: "#25d366", color: "#fff", borderRadius: 9, fontWeight: 800, fontSize: 13, textDecoration: "none", display: "flex", alignItems: "center", gap: 7 }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
                WhatsApp Us
              </a>
            </div>
          </div>

          {/* Right — compact application form */}
          <div style={{ animation: "fadeSlideIn 0.8s ease 0.2s both" }}>
            {submitted ? (
              <div style={{ background: "rgba(255,255,255,0.97)", borderRadius: 18, padding: "32px 24px", textAlign: "center", boxShadow: "0 20px 60px rgba(0,0,0,0.25)" }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>🎉</div>
                <div style={{ fontWeight: 900, fontSize: 18, color: "#07111F", marginBottom: 8 }}>Application Received!</div>
                <div style={{ fontSize: 13, color: "#64748b", lineHeight: 1.7, marginBottom: 20 }}>
                  Thank you, <strong>{form.name}</strong>! We&apos;ll call <strong>{form.mobile}</strong> within 24 hours.
                </div>
                <Link href="/data-portal" style={{ display: "block", padding: "11px", background: "#C8860A", color: "#fff", borderRadius: 9, fontWeight: 800, fontSize: 13, textDecoration: "none", textAlign: "center" }}>
                  Explore Data Portal →
                </Link>
                <button onClick={() => setSubmitted(false)} style={{ display: "block", width: "100%", marginTop: 10, padding: "9px", background: "none", border: "1.5px solid #e2e8f0", borderRadius: 8, fontSize: 12, cursor: "pointer", color: "#64748b" }}>
                  Submit Another
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} style={{ background: dark ? "rgba(15,28,50,0.97)" : "rgba(255,255,255,0.97)", borderRadius: 18, padding: "28px 24px", boxShadow: "0 20px 60px rgba(0,0,0,0.25)", backdropFilter: "blur(8px)" }}>
                <div style={{ fontWeight: 900, fontSize: 17, color: "#07111F", marginBottom: 4 }}>Start Your Application</div>
                <div style={{ fontSize: 12, color: "#64748b", marginBottom: 20, fontWeight: 400 }}>Free • No setup fee • Account in 24 hours</div>
                <div style={{ marginBottom: 14 }}>
                  <label style={{ display: "block", fontSize: 10.5, fontWeight: 700, color: "#64748b", marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.07em" }}>Full Name *</label>
                  <input required value={form.name} onChange={e => setF("name", e.target.value)} placeholder="As on CNIC" style={{ width: "100%", padding: "10px 13px", borderRadius: 8, boxSizing: "border-box", border: `1.5px solid ${dark ? "rgba(255,255,255,0.15)" : "#e2e8f0"}`, background: dark ? "#1a2c45" : "#f8fafc", fontSize: 13, color: dark ? "#e2e8f0" : "#1a2035", outline: "none" }} />
                </div>
                <div style={{ marginBottom: 14 }}>
                  <label style={{ display: "block", fontSize: 10.5, fontWeight: 700, color: "#64748b", marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.07em" }}>Mobile Number *</label>
                  <input required value={form.mobile} onChange={e => setF("mobile", e.target.value)} placeholder="03XX-XXXXXXX" style={{ width: "100%", padding: "10px 13px", borderRadius: 8, boxSizing: "border-box", border: `1.5px solid ${dark ? "rgba(255,255,255,0.15)" : "#e2e8f0"}`, background: dark ? "#1a2c45" : "#f8fafc", fontSize: 13, color: dark ? "#e2e8f0" : "#1a2035", outline: "none" }} />
                </div>
                <div style={{ marginBottom: 14 }}>
                  <label style={{ display: "block", fontSize: 10.5, fontWeight: 700, color: "#64748b", marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.07em" }}>Email (optional)</label>
                  <input type="email" value={form.email} onChange={e => setF("email", e.target.value)} placeholder="you@example.com" style={{ width: "100%", padding: "10px 13px", borderRadius: 8, boxSizing: "border-box", border: `1.5px solid ${dark ? "rgba(255,255,255,0.15)" : "#e2e8f0"}`, background: dark ? "#1a2c45" : "#f8fafc", fontSize: 13, color: dark ? "#e2e8f0" : "#1a2035", outline: "none" }} />
                </div>
                <div style={{ marginBottom: 20 }}>
                  <label style={{ display: "block", fontSize: 10.5, fontWeight: 700, color: "#64748b", marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.07em" }}>Account Type</label>
                  <select value={form.type} onChange={e => setF("type", e.target.value)} style={{ width: "100%", padding: "10px 13px", borderRadius: 8, boxSizing: "border-box", border: `1.5px solid ${dark ? "rgba(255,255,255,0.15)" : "#e2e8f0"}`, background: dark ? "#1a2c45" : "#f8fafc", fontSize: 13, color: dark ? "#e2e8f0" : "#1a2035", outline: "none" }}>
                    <option value="sahulat">Sahulat Account (up to Rs 3M)</option>
                    <option value="full">Full PSX Account (no limit)</option>
                    <option value="joint">Joint Account</option>
                    <option value="rda">Overseas / RDA Account</option>
                  </select>
                </div>
                <button type="submit" style={{ width: "100%", padding: "13px", background: "linear-gradient(135deg,#C8860A,#e8a020)", color: "#fff", border: "none", borderRadius: 10, fontWeight: 900, fontSize: 14, cursor: "pointer", letterSpacing: "0.03em", boxShadow: "0 4px 18px rgba(200,134,10,0.4)" }}>
                  Submit Application →
                </button>
                <div style={{ textAlign: "center", marginTop: 12, fontSize: 11.5, color: "#64748b", fontWeight: 400 }}>
                  No money collected at this stage &nbsp;·&nbsp; <Link href="/auth/login" style={{ color: "#C8860A", fontWeight: 700, textDecoration: "none" }}>Login</Link>
                </div>
              </form>
            )}
          </div>
        </div>
        {/* Wave */}
        <div style={{ height: 42, background: pg.bg, clipPath: "ellipse(55% 100% at 50% 100%)" }} />
      </div>

      {/* ── Main content ── */}
      <div style={{ maxWidth: 1140, margin: "0 auto", padding: "0 24px" }}>

        {/* ── Why Stockifyy ── */}
        <section style={{ padding: "52px 0 44px" }}>
          <Reveal from="blur">
            <h2 style={{ textAlign: "center", fontSize: "clamp(18px,2.6vw,24px)", fontWeight: 900, margin: "0 0 32px", color: pg.navy }}>
              Why Choose <span style={{ color: "#C8860A" }}>Stockifyy?</span>
            </h2>
          </Reveal>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))", gap: 14 }}>
            {WHY.map((w, i) => (
              <Reveal key={w.title} delay={i * 70} from="scale">
                <div style={{ padding: "18px 20px", borderRadius: 12, border: `1.5px solid ${pg.border}`, background: pg.card, display: "flex", gap: 14, alignItems: "flex-start", transition: "box-shadow 0.2s, border-color 0.2s, transform 0.2s" }}
                  onMouseEnter={e => { const d = e.currentTarget as HTMLDivElement; d.style.borderColor = "#C8860A"; d.style.boxShadow = "0 4px 18px rgba(200,134,10,0.1)"; d.style.transform = "translateY(-2px)"; }}
                  onMouseLeave={e => { const d = e.currentTarget as HTMLDivElement; d.style.borderColor = pg.border; d.style.boxShadow = "none"; d.style.transform = ""; }}
                >
                  <div style={{ fontSize: 24, flexShrink: 0 }}>{w.icon}</div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 13.5, color: pg.navy, marginBottom: 3 }}>{w.title}</div>
                    <div style={{ fontSize: 12, color: pg.muted, lineHeight: 1.6, fontWeight: 400 }}>{w.desc}</div>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        {/* ── Account Types ── */}
        <section style={{ padding: "0 0 52px" }}>
          <Reveal from="blur">
            <h2 style={{ textAlign: "center", fontSize: "clamp(18px,2.6vw,24px)", fontWeight: 900, margin: "0 0 32px", color: pg.navy }}>
              Choose Your <span style={{ color: "#C8860A" }}>Account Type</span>
            </h2>
          </Reveal>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 18 }}>
            {ACCOUNT_TYPES.map((a, i) => (
              <Reveal key={a.title} delay={i * 100} from="bottom">
                <div style={{ padding: "24px 22px", borderRadius: 16, border: `1.5px solid ${pg.border}`, background: pg.card, position: "relative", overflow: "hidden", display: "flex", flexDirection: "column", height: "100%", boxSizing: "border-box" }}>
                  <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 4, background: a.color, borderRadius: "16px 16px 0 0" }} />
                  <div style={{ display: "inline-flex", padding: "3px 10px", borderRadius: 10, background: `${a.color}18`, color: a.color, fontSize: 9.5, fontWeight: 800, letterSpacing: "0.07em", marginBottom: 12, alignSelf: "flex-start", whiteSpace: "nowrap" }}>{a.badge}</div>
                  <div style={{ fontWeight: 800, fontSize: 17, color: pg.navy, marginBottom: 6 }}>{a.title}</div>
                  <div style={{ fontSize: 12.5, color: pg.muted, marginBottom: 12, lineHeight: 1.6, fontWeight: 400 }}>{a.desc}</div>
                  <div style={{ fontSize: 11.5, fontWeight: 700, color: a.color, marginBottom: 14, padding: "5px 11px", borderRadius: 7, background: `${a.color}12`, display: "inline-block", alignSelf: "flex-start", whiteSpace: "nowrap" }}>{a.limit}</div>
                  <ul style={{ margin: "0 0 18px", padding: "0 0 0 16px", fontSize: 12, color: pg.muted, lineHeight: 2, fontWeight: 400, flex: 1 }}>
                    {a.items.map(item => <li key={item}>{item}</li>)}
                  </ul>
                  <a href={`https://wa.me/${a.wa}`} target="_blank" rel="noreferrer"
                    style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 7, padding: "10px 14px", borderRadius: 9, background: a.color, color: "#fff", fontWeight: 800, fontSize: 12.5, textDecoration: "none", whiteSpace: "nowrap" }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
                    WhatsApp · {a.waDisplay}
                  </a>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        {/* ── Steps ── */}
        <section style={{ padding: "0 0 52px" }}>
          <Reveal from="blur">
            <h2 style={{ textAlign: "center", fontSize: "clamp(18px,2.6vw,24px)", fontWeight: 900, margin: "0 0 32px", color: pg.navy }}>
              How It <span style={{ color: "#C8860A" }}>Works</span>
            </h2>
          </Reveal>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16 }}>
            {STEPS.map((s, idx) => (
              <Reveal key={s.num} delay={idx * 90} from={idx % 2 === 0 ? "left" : "right"}>
                <div style={{ padding: "22px 18px", borderRadius: 14, border: `1.5px solid ${pg.border}`, background: pg.card, position: "relative", height: "100%", boxSizing: "border-box" }}>
                  <div style={{ position: "absolute", top: 12, right: 14, fontSize: 34, fontWeight: 900, color: "rgba(200,134,10,0.07)", letterSpacing: "-2px" }}>{s.num}</div>
                  <div style={{ width: 40, height: 40, borderRadius: 11, background: "rgba(200,134,10,0.1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, marginBottom: 12 }}>{s.icon}</div>
                  <div style={{ fontWeight: 700, fontSize: 13.5, color: pg.navy, marginBottom: 10 }}>{s.title}</div>
                  <ul style={{ margin: 0, padding: "0 0 0 15px", fontSize: 11.5, color: pg.muted, lineHeight: 1.9, fontWeight: 400 }}>
                    {s.items.map(item => <li key={item}>{item}</li>)}
                  </ul>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        {/* ── Premium Services ── */}
        <section style={{ padding: "0 0 52px" }}>
          <Reveal from="blur">
            <h2 style={{ textAlign: "center", fontSize: "clamp(18px,2.6vw,24px)", fontWeight: 900, margin: "0 0 8px", color: pg.navy }}>
              Stockifyy <span style={{ color: "#C8860A" }}>Premium Services</span>
            </h2>
            <p style={{ textAlign: "center", fontSize: 13, color: pg.muted, margin: "0 0 28px", fontWeight: 400 }}>Expert advisory packages — available alongside your account.</p>
          </Reveal>

          {/* 3 main service cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16, marginBottom: 16 }}>
            {SERVICES_MAIN.map((sv, i) => (
              <Reveal key={sv.title} delay={i * 80} from="scale">
                <div style={{ padding: "24px 22px", borderRadius: 16, background: sv.color, color: "#fff", position: "relative", overflow: "hidden", height: "100%", boxSizing: "border-box" }}>
                  <div style={{ position: "absolute", top: -28, right: -28, width: 110, height: 110, borderRadius: "50%", background: "rgba(255,255,255,0.05)" }} />
                  <div style={{ display: "inline-flex", padding: "3px 10px", borderRadius: 10, background: "rgba(255,255,255,0.15)", fontSize: 9, fontWeight: 800, letterSpacing: "0.08em", marginBottom: 12 }}>{sv.badge}</div>
                  <div style={{ fontSize: 22, marginBottom: 8 }}>{sv.icon}</div>
                  <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 5 }}>{sv.title}</div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: "#ffd700", marginBottom: 14 }}>{sv.price}</div>
                  <ul style={{ margin: 0, padding: "0 0 0 15px", fontSize: 12, lineHeight: 1.9, color: "rgba(255,255,255,0.85)", fontWeight: 400 }}>
                    {sv.features.map(f => <li key={f}>{f}</li>)}
                  </ul>
                </div>
              </Reveal>
            ))}
          </div>

          {/* Elite Club — centered below */}
          <Reveal delay={120} from="scale">
            <div style={{ display: "flex", justifyContent: "center" }}>
              <div style={{ width: "calc(33.33% - 11px)", minWidth: 280, padding: "24px 22px", borderRadius: 16, background: "#7a3a00", color: "#fff", position: "relative", overflow: "hidden", boxSizing: "border-box" }}>
                <div style={{ position: "absolute", top: -28, right: -28, width: 110, height: 110, borderRadius: "50%", background: "rgba(255,255,255,0.05)" }} />
                <div style={{ display: "inline-flex", padding: "3px 10px", borderRadius: 10, background: "rgba(255,255,255,0.15)", fontSize: 9, fontWeight: 800, letterSpacing: "0.08em", marginBottom: 12 }}>ALL-IN-ONE</div>
                <div style={{ fontSize: 22, marginBottom: 8 }}>⭐</div>
                <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 5 }}>Elite Club</div>
                <div style={{ fontSize: 13, fontWeight: 800, color: "#ffd700", marginBottom: 14 }}>Rs 99,999/year &nbsp;<span style={{ fontWeight: 400, fontSize: 11, opacity: 0.7, textDecoration: "line-through" }}>Rs 175,000</span> &nbsp;<span style={{ fontSize: 11, fontWeight: 700, color: "#86efac" }}>43% off</span></div>
                <ul style={{ margin: "0 0 16px", padding: "0 0 0 15px", fontSize: 12, lineHeight: 1.9, color: "rgba(255,255,255,0.85)", fontWeight: 400 }}>
                  {["Swing + Trade + Invest + Research Group", "Four opportunities under one roof", "Best value for serious investors"].map(f => <li key={f}>{f}</li>)}
                </ul>
                <a href="https://wa.me/923362444466" target="_blank" rel="noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "9px 18px", background: "#C8860A", color: "#fff", borderRadius: 8, fontWeight: 800, fontSize: 12, textDecoration: "none" }}>
                  Join Elite Club → 0336-2444466
                </a>
              </div>
            </div>
          </Reveal>
        </section>

        {/* ── Advisory Team ── */}
        <section style={{ padding: "0 0 52px" }}>
          <Reveal from="blur">
            <h2 style={{ textAlign: "center", fontSize: "clamp(18px,2.6vw,24px)", fontWeight: 900, margin: "0 0 28px", color: pg.navy }}>
              Meet the <span style={{ color: "#C8860A" }}>Advisory Team</span>
            </h2>
          </Reveal>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14 }}>
            {TEAM.map((t, i) => (
              <Reveal key={t.name} delay={i * 80} from="bottom">
                <div style={{ padding: "20px 18px", borderRadius: 14, border: `1.5px solid ${pg.border}`, background: pg.card, display: "flex", gap: 14, alignItems: "center" }}>
                  <div style={{ width: 46, height: 46, borderRadius: "50%", background: `${t.color}20`, border: `2px solid ${t.color}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>{t.icon}</div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 13, color: pg.navy, marginBottom: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{t.name}</div>
                    <div style={{ fontSize: 11, color: pg.muted, marginBottom: 4, fontWeight: 400 }}>{t.role}</div>
                    <div style={{ fontSize: 11, fontWeight: 800, color: t.color }}>{t.tier}</div>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
          <Reveal delay={100}>
            <div style={{ textAlign: "center", marginTop: 16 }}>
              <a href="https://wa.me/923362444466" target="_blank" rel="noreferrer" style={{ fontSize: 13, color: "#C8860A", fontWeight: 700, textDecoration: "none" }}>Book a 1-on-1 session → WhatsApp 0336-2444466</a>
            </div>
          </Reveal>
        </section>
      </div>

      {/* ── Footer ── */}
      <div style={{ background: "linear-gradient(135deg, #0a1e3c, #122d58)", padding: "24px 20px", textAlign: "center" }}>
        <div style={{ fontSize: 13, color: "rgba(255,255,255,0.75)", marginBottom: 6 }}>
          <strong style={{ color: "#fff" }}>M/S Stock Ifyy (Private) Limited</strong> &nbsp;·&nbsp; SECP Licence: SECP/LRD/LD/73/S&A/SIPL/2025
        </div>
        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)" }}>
          Munir Khanani Securities &nbsp;·&nbsp;
          <a href="tel:+923362444466" style={{ color: "#C8860A", fontWeight: 700, textDecoration: "none" }}>0336-2444466</a>
          &nbsp;·&nbsp;
          <a href="tel:+923114944443" style={{ color: "#C8860A", fontWeight: 700, textDecoration: "none" }}>0311-4944443</a>
          &nbsp;·&nbsp; www.stockifyy.com
        </div>
      </div>

      {/* ── Back to top button ── */}
      {showTop && (
        <button onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          style={{ position: "fixed", bottom: 28, right: 24, width: 44, height: 44, borderRadius: "50%", background: "#C8860A", color: "#fff", border: "none", fontSize: 18, cursor: "pointer", boxShadow: "0 4px 16px rgba(200,134,10,0.4)", zIndex: 999, display: "flex", alignItems: "center", justifyContent: "center", transition: "transform 0.2s" }}
          onMouseEnter={e => (e.currentTarget.style.transform = "scale(1.1)")}
          onMouseLeave={e => (e.currentTarget.style.transform = "scale(1)")}
        >↑</button>
      )}

      {/* ── Keyframes ── */}
      <style>{`
        @keyframes fadeSlideIn { from { opacity:0; transform:translateY(22px); } to { opacity:1; transform:translateY(0); } }
        @keyframes float { from { transform:translateY(0) translateX(0); } to { transform:translateY(-16px) translateX(7px); } }
        @media (max-width: 900px) {
          .hero-grid { grid-template-columns: 1fr !important; }
          .three-col { grid-template-columns: 1fr !important; }
          .four-col { grid-template-columns: repeat(2,1fr) !important; }
        }
      `}</style>
    </div>
  );
}
