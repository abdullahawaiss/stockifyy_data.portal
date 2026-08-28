"use client";
import { useState, useEffect, useRef, ReactNode } from "react";
import Link from "next/link";

// ── Scroll-reveal hook ──────────────────────────────────────────────────────
function useReveal(threshold = 0.12) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } }, { threshold });
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, visible };
}

function Reveal({ children, delay = 0, from = "bottom" }: { children: ReactNode; delay?: number; from?: "bottom" | "left" | "right" | "fade" }) {
  const { ref, visible } = useReveal();
  const transforms: Record<string, string> = { bottom: "translateY(40px)", left: "translateX(-40px)", right: "translateX(40px)", fade: "translateY(0)" };
  return (
    <div ref={ref} style={{
      opacity: visible ? 1 : 0,
      transform: visible ? "translateY(0) translateX(0)" : transforms[from],
      transition: `opacity 0.65s ease ${delay}ms, transform 0.65s ease ${delay}ms`,
    }}>
      {children}
    </div>
  );
}

// ── Data ────────────────────────────────────────────────────────────────────
const STEPS = [
  { num: "01", icon: "🪪", title: "Prepare Documents", desc: "Gather the 5 required documents — takes 2 minutes.", items: ["CNIC / SNIC (both sides)", "Bank Account details", "Specimen Signature", "Email ID", "CNIC-registered mobile number"] },
  { num: "02", icon: "📋", title: "Submit Application", desc: "Fill our short form or WhatsApp us — we handle the rest.", items: ["Account type selection (Sahulat / Full PSX)", "Overseas? Apply via Roshan Digital Account", "Joint account option available"] },
  { num: "03", icon: "🔍", title: "Biometric Verification", desc: "Visit any Stockifyy branch or NCCPL for a quick biometric.", items: ["Mobile SIM must be in applicant's name", "Overseas Pakistanis are biometric-exempt", "Takes under 15 minutes at the branch"] },
  { num: "04", icon: "✅", title: "Start Trading", desc: "Account activated within 24 hours — you're live on PSX.", items: ["Full access to 860+ PSX-listed stocks", "Free premium services included", "Stockifyy Data Portal access"] },
];

const ACCOUNT_TYPES = [
  { title: "Sahulat Account", badge: "MOST POPULAR", color: "#C8860A", desc: "Perfect for new investors starting their PSX journey.", limit: "Trading Limit: Rs 3,000,000", wa: "0301-0301246", items: ["CNIC / SNIC", "Bank Account", "Signatures", "Email ID", "Registered Mobile"] },
  { title: "Full PSX Account", badge: "NO LIMIT", color: "#1a6b3a", desc: "For serious traders — unlimited trading via Munir Khanani Securities.", limit: "No upper trading limit", wa: "0311-4944443", items: ["Same 5 documents", "Biometric verification", "Processed via Munir Khanani Securities", "PSX member broker access"] },
  { title: "Overseas (RDA)", badge: "NRP", color: "#1a3a6b", desc: "Overseas Pakistanis investing in PSX via Roshan Digital Account.", limit: "Biometric Exempted", wa: "0311-4944443", items: ["CNIC / NICOP / Passport", "Foreign bank account", "RDA account at any Pakistan bank", "No biometric required"] },
];

const SERVICES = [
  { icon: "📈", title: "Trade with Stockifyy", color: "#0f5132", badge: "SWING CALLS", price: "From Rs 6,000/mo", features: ["Short-term trade calls", "Risk-managed trading", "Learning & guidance"] },
  { icon: "💼", title: "Invest with Stockifyy", color: "#1a3560", badge: "ADVISORY", price: "From Rs 7,000/mo", features: ["Buy/sell ideas by Dr. Masood Rashid", "Stock levels & targets", "Members-only chat group", "Monthly Zoom Q&A"] },
  { icon: "📊", title: "Portfolio Designing", color: "#4a1a6b", badge: "PERSONALIZED", price: "Contact for pricing", features: ["Capital growth / dividend income / balanced", "Risk profiling (Conservative → Aggressive)", "30%–35% potential returns", "Short / Mid / Long-term horizons"] },
  { icon: "⭐", title: "Elite Club", color: "#7a3a00", badge: "ALL-IN-ONE", price: "Rs 99,999/year", features: ["Swing + Trade + Invest + Research Group", "43% off (was Rs 175,000)", "Four opportunities under one roof"] },
];

const WHY = [
  { icon: "🏛️", title: "SECP Licensed", desc: "Securities Adviser & Futures Adviser (SECP/LRD/LD/73/S&A/SIPL/2025)" },
  { icon: "🤝", title: "PSX Member Broker", desc: "Account opened via Munir Khanani Securities — a trusted PSX member" },
  { icon: "📊", title: "Free Data Portal", desc: "Full access to Stockifyy's live market data, heatmap, screener & more" },
  { icon: "📞", title: "Dedicated Dealer", desc: "A personal equity dealer assigned to help you trade and stay updated" },
  { icon: "🎓", title: "26 Live Q&A Sessions", desc: "Monthly Zoom Q&A sessions with analysts — included free with your account" },
  { icon: "⚡", title: "1-on-1 Guidance", desc: "One-on-one support from Stockifyy's experienced research team" },
];

const TEAM = [
  { name: "Dr. Masood Rashid", role: "Head of Research & Advisory", tier: "Diamond — Rs 20,000" },
  { name: "M. Sufiyan · Mufeez Aziz · Moiz Shahzad", role: "Senior Analysts", tier: "Platinum — Rs 15,000" },
  { name: "Hassan Askari · Saad Arshad · Hafsa Talpur", role: "Research Team", tier: "Gold — Rs 10,000" },
];

export default function OpenAccountClient() {
  const [form, setForm] = useState({ name: "", cnic: "", mobile: "", email: "", city: "", type: "sahulat", income: "" });
  const [submitted, setSubmitted] = useState(false);
  const [particles, setParticles] = useState<{ x: number; y: number; size: number; speed: number; opacity: number }[]>([]);

  useEffect(() => {
    setParticles(Array.from({ length: 22 }, () => ({
      x: Math.random() * 100, y: Math.random() * 100,
      size: Math.random() * 3 + 1, speed: Math.random() * 20 + 15,
      opacity: Math.random() * 0.4 + 0.1,
    })));
  }, []);

  function setF(k: string, v: string) { setForm(f => ({ ...f, [k]: v })); }
  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !form.cnic || !form.mobile) return;
    setSubmitted(true);
  }

  const inp: React.CSSProperties = {
    width: "100%", padding: "11px 14px", borderRadius: 8, boxSizing: "border-box",
    border: "1.5px solid var(--border,#e2e8f0)", background: "var(--card-bg,#fff)",
    fontSize: 13.5, color: "var(--text)", outline: "none",
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--background)", fontFamily: "inherit", overflowX: "hidden" }}>

      {/* ── Top nav bar with logo ── */}
      <div style={{
        position: "sticky", top: 0, zIndex: 100,
        background: "rgba(10, 24, 54, 0.92)", backdropFilter: "blur(12px)",
        borderBottom: "1px solid rgba(255,255,255,0.08)",
        padding: "12px 28px", display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <a href="/" style={{ display: "flex", alignItems: "center", textDecoration: "none" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/stockifyy-full-logo.png" alt="Stockifyy" style={{ height: 34, objectFit: "contain", maxWidth: 170 }} />
        </a>
      </div>

      {/* ── Hero ── */}
      <div style={{
        background: "linear-gradient(140deg, #0a1e3c 0%, #122d58 45%, #1a3a6b 100%)",
        padding: "70px 20px 90px", textAlign: "center", position: "relative", overflow: "hidden",
      }}>
        {/* Animated particles */}
        {particles.map((p, i) => (
          <div key={i} style={{
            position: "absolute", left: `${p.x}%`, top: `${p.y}%`,
            width: p.size, height: p.size, borderRadius: "50%",
            background: "#C8860A", opacity: p.opacity,
            animation: `float ${p.speed}s ease-in-out infinite alternate`,
            animationDelay: `${i * 0.3}s`,
            pointerEvents: "none",
          }} />
        ))}
        {/* Gold radial glow */}
        <div style={{ position: "absolute", top: -80, left: "50%", transform: "translateX(-50%)", width: 700, height: 340, background: "radial-gradient(ellipse, rgba(200,134,10,0.22) 0%, transparent 70%)", pointerEvents: "none" }} />
        {/* Bottom wave */}
        <div style={{ position: "absolute", bottom: -2, left: 0, right: 0, height: 50, background: "var(--background)", clipPath: "ellipse(55% 100% at 50% 100%)" }} />

        <div style={{ position: "relative", zIndex: 1 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "5px 18px", borderRadius: 20, border: "1px solid rgba(200,134,10,0.45)", background: "rgba(200,134,10,0.1)", marginBottom: 22, animation: "fadeSlideIn 0.7s ease both" }}>
            <span style={{ fontSize: 11, color: "#C8860A", fontWeight: 800, letterSpacing: "0.08em" }}>SECP LICENSED · PSX MEMBER · MUNIR KHANANI SECURITIES</span>
          </div>
          <h1 style={{ fontSize: "clamp(30px,5.5vw,58px)", fontWeight: 900, color: "#fff", margin: "0 0 18px", lineHeight: 1.1, animation: "fadeSlideIn 0.8s ease 0.1s both" }}>
            Open Your PSX Account<br />
            <span style={{ color: "#C8860A" }}>Start Investing Today</span>
          </h1>
          <p style={{ fontSize: "clamp(14px,2vw,17px)", color: "rgba(255,255,255,0.68)", margin: "0 auto 36px", maxWidth: 560, lineHeight: 1.65, animation: "fadeSlideIn 0.8s ease 0.2s both" }}>
            Pakistan&apos;s trusted SECP-licensed advisory platform. Open your brokerage account in under 24 hours and get free access to research, live data, and expert guidance.
          </p>
          <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap", animation: "fadeSlideIn 0.8s ease 0.3s both" }}>
            <a href="#apply" style={{ padding: "14px 40px", background: "linear-gradient(135deg, #C8860A, #e8a020)", color: "#fff", borderRadius: 10, fontWeight: 800, fontSize: 15, textDecoration: "none", letterSpacing: "0.03em", boxShadow: "0 4px 20px rgba(200,134,10,0.4)" }}>
              Open Account — Free
            </a>
            <a href="https://wa.me/923112444443" target="_blank" rel="noreferrer" style={{ padding: "14px 28px", background: "rgba(255,255,255,0.07)", color: "#fff", borderRadius: 10, fontWeight: 700, fontSize: 14, textDecoration: "none", border: "1.5px solid rgba(255,255,255,0.18)", display: "flex", alignItems: "center", gap: 8 }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="#25d366"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
              WhatsApp Us
            </a>
          </div>
          <div style={{ display: "flex", gap: 28, justifyContent: "center", marginTop: 36, flexWrap: "wrap", animation: "fadeSlideIn 0.8s ease 0.4s both" }}>
            {[["🚀", "Account in 24 hrs"], ["💯", "Zero Setup Fee"], ["🏛️", "SECP Licensed"], ["🔐", "Bank-Level Security"]].map(([icon, label]) => (
              <div key={String(label)} style={{ fontSize: 12.5, color: "rgba(255,255,255,0.6)", display: "flex", alignItems: "center", gap: 7, fontWeight: 600 }}>
                <span style={{ fontSize: 16 }}>{icon}</span>{label}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1140, margin: "0 auto", padding: "0 20px" }}>

        {/* ── Why Stockifyy ── */}
        <section style={{ padding: "70px 0 56px" }}>
          <Reveal>
            <h2 style={{ textAlign: "center", fontSize: "clamp(20px,3vw,26px)", fontWeight: 900, margin: "0 0 10px" }}>
              <span style={{ color: "var(--navy,#07111F)" }}>Why Open Your Account</span> <span style={{ color: "#C8860A" }}>with Stockifyy?</span>
            </h2>
            <p style={{ textAlign: "center", fontSize: 14, color: "var(--text-muted)", margin: "0 0 40px" }}>Everything you need to invest confidently — free with every account.</p>
          </Reveal>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 16 }}>
            {WHY.map((w, i) => (
              <Reveal key={w.title} delay={i * 80} from="bottom">
                <div style={{ padding: "22px 24px", borderRadius: 14, border: "1.5px solid var(--border,#e2e8f0)", background: "var(--card-bg,#fff)", display: "flex", gap: 16, alignItems: "flex-start", transition: "box-shadow 0.2s, border-color 0.2s" }}
                  onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = "#C8860A"; (e.currentTarget as HTMLDivElement).style.boxShadow = "0 4px 20px rgba(200,134,10,0.12)"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = "var(--border,#e2e8f0)"; (e.currentTarget as HTMLDivElement).style.boxShadow = "none"; }}
                >
                  <div style={{ fontSize: 28, flexShrink: 0, lineHeight: 1 }}>{w.icon}</div>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: 14, color: "var(--navy,#07111F)", marginBottom: 5 }}>{w.title}</div>
                    <div style={{ fontSize: 12.5, color: "var(--text-muted)", lineHeight: 1.65 }}>{w.desc}</div>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        {/* ── Account Types ── */}
        <section style={{ padding: "0 0 64px" }}>
          <Reveal>
            <h2 style={{ textAlign: "center", fontSize: "clamp(20px,3vw,26px)", fontWeight: 900, margin: "0 0 10px" }}>
              <span style={{ color: "var(--navy,#07111F)" }}>Choose Your</span> <span style={{ color: "#C8860A" }}>Account Type</span>
            </h2>
            <p style={{ textAlign: "center", fontSize: 14, color: "var(--text-muted)", margin: "0 0 40px" }}>All accounts include free Stockifyy premium services.</p>
          </Reveal>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(300px,1fr))", gap: 20 }}>
            {ACCOUNT_TYPES.map((a, i) => (
              <Reveal key={a.title} delay={i * 100} from="bottom">
                <div style={{ padding: "28px 26px", borderRadius: 16, border: `2px solid ${a.color}30`, background: "var(--card-bg,#fff)", position: "relative", overflow: "hidden", height: "100%", boxSizing: "border-box" }}>
                  <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 4, background: a.color }} />
                  <div style={{ display: "inline-flex", padding: "3px 12px", borderRadius: 12, background: `${a.color}15`, color: a.color, fontSize: 10, fontWeight: 800, letterSpacing: "0.08em", marginBottom: 14 }}>{a.badge}</div>
                  <div style={{ fontWeight: 900, fontSize: 18, color: "var(--navy,#07111F)", marginBottom: 8 }}>{a.title}</div>
                  <div style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 12, lineHeight: 1.6 }}>{a.desc}</div>
                  <div style={{ fontSize: 12, fontWeight: 800, color: a.color, marginBottom: 16, padding: "6px 12px", borderRadius: 8, background: `${a.color}10`, display: "inline-block" }}>{a.limit}</div>
                  <ul style={{ margin: "0 0 20px", padding: "0 0 0 18px", fontSize: 12.5, color: "var(--text-muted)", lineHeight: 2 }}>
                    {a.items.map(item => <li key={item}>{item}</li>)}
                  </ul>
                  <a href={`https://wa.me/92${a.wa.replace(/-/g, "").replace(/^0/, "")}`} target="_blank" rel="noreferrer"
                    style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "11px 20px", borderRadius: 9, background: a.color, color: "#fff", fontWeight: 800, fontSize: 13, textDecoration: "none", letterSpacing: "0.02em" }}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
                    Open via WhatsApp · {a.wa}
                  </a>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        {/* ── Steps ── */}
        <section style={{ padding: "0 0 64px" }}>
          <Reveal>
            <h2 style={{ textAlign: "center", fontSize: "clamp(20px,3vw,26px)", fontWeight: 900, margin: "0 0 10px" }}>
              <span style={{ color: "var(--navy,#07111F)" }}>How It</span> <span style={{ color: "#C8860A" }}>Works</span>
            </h2>
            <p style={{ textAlign: "center", fontSize: 14, color: "var(--text-muted)", margin: "0 0 44px" }}>Four simple steps to start investing on PSX.</p>
          </Reveal>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(240px,1fr))", gap: 20, position: "relative" }}>
            {STEPS.map((s, idx) => (
              <Reveal key={s.num} delay={idx * 110} from="bottom">
                <div style={{ padding: "26px 22px", borderRadius: 14, border: "1.5px solid var(--border,#e2e8f0)", background: "var(--card-bg,#fff)", position: "relative", height: "100%", boxSizing: "border-box" }}>
                  <div style={{ position: "absolute", top: 14, right: 16, fontSize: 38, fontWeight: 900, color: "rgba(200,134,10,0.08)", letterSpacing: "-2px" }}>{s.num}</div>
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: "rgba(200,134,10,0.1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, marginBottom: 14 }}>{s.icon}</div>
                  <div style={{ fontWeight: 800, fontSize: 15, color: "var(--navy,#07111F)", marginBottom: 7 }}>{s.title}</div>
                  <div style={{ fontSize: 12.5, color: "var(--text-muted)", lineHeight: 1.65, marginBottom: 14 }}>{s.desc}</div>
                  <ul style={{ margin: 0, padding: "0 0 0 16px", fontSize: 12, color: "var(--text-muted)", lineHeight: 2 }}>
                    {s.items.map(item => <li key={item}>{item}</li>)}
                  </ul>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        {/* ── Services ── */}
        <section style={{ padding: "0 0 64px" }}>
          <Reveal>
            <h2 style={{ textAlign: "center", fontSize: "clamp(20px,3vw,26px)", fontWeight: 900, margin: "0 0 10px" }}>
              <span style={{ color: "var(--navy,#07111F)" }}>Stockifyy</span> <span style={{ color: "#C8860A" }}>Premium Services</span>
            </h2>
            <p style={{ textAlign: "center", fontSize: 14, color: "var(--text-muted)", margin: "0 0 40px" }}>Expert advisory packages to grow your portfolio — available alongside your account.</p>
          </Reveal>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(270px,1fr))", gap: 18 }}>
            {SERVICES.map((sv, i) => (
              <Reveal key={sv.title} delay={i * 90} from="bottom">
                <div style={{ padding: "26px 24px", borderRadius: 16, background: sv.color, color: "#fff", position: "relative", overflow: "hidden", height: "100%", boxSizing: "border-box" }}>
                  <div style={{ position: "absolute", top: -30, right: -30, width: 120, height: 120, borderRadius: "50%", background: "rgba(255,255,255,0.05)" }} />
                  <div style={{ display: "inline-flex", padding: "3px 12px", borderRadius: 12, background: "rgba(255,255,255,0.15)", fontSize: 9.5, fontWeight: 800, letterSpacing: "0.08em", marginBottom: 14 }}>{sv.badge}</div>
                  <div style={{ fontSize: 26, marginBottom: 10 }}>{sv.icon}</div>
                  <div style={{ fontWeight: 900, fontSize: 16, marginBottom: 6 }}>{sv.title}</div>
                  <div style={{ fontSize: 13.5, fontWeight: 800, color: "#ffd700", marginBottom: 16 }}>{sv.price}</div>
                  <ul style={{ margin: 0, padding: "0 0 0 16px", fontSize: 12.5, lineHeight: 2, color: "rgba(255,255,255,0.85)" }}>
                    {sv.features.map(f => <li key={f}>{f}</li>)}
                  </ul>
                </div>
              </Reveal>
            ))}
          </div>
          <Reveal delay={200}>
            <div style={{ marginTop: 24, padding: "20px 28px", borderRadius: 14, background: "linear-gradient(135deg, #0a1628, #1a2840)", border: "1px solid rgba(200,134,10,0.3)", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
              <div>
                <div style={{ fontWeight: 900, fontSize: 15, color: "#fff", marginBottom: 4 }}>Elite Club — All 4 Services in One</div>
                <div style={{ fontSize: 12.5, color: "rgba(255,255,255,0.65)" }}>Swing + Trade + Invest + Research Group · <strong style={{ color: "#ffd700" }}>43% off — Rs 99,999/year</strong> (was Rs 175,000)</div>
              </div>
              <a href="https://wa.me/923362444466" target="_blank" rel="noreferrer" style={{ padding: "11px 24px", background: "#C8860A", color: "#fff", borderRadius: 10, fontWeight: 800, fontSize: 13, textDecoration: "none", flexShrink: 0 }}>
                Join Elite Club →
              </a>
            </div>
          </Reveal>
        </section>

        {/* ── Advisory Team ── */}
        <section style={{ padding: "0 0 64px" }}>
          <Reveal>
            <h2 style={{ textAlign: "center", fontSize: "clamp(20px,3vw,26px)", fontWeight: 900, margin: "0 0 10px" }}>
              <span style={{ color: "var(--navy,#07111F)" }}>Meet the</span> <span style={{ color: "#C8860A" }}>Advisory Team</span>
            </h2>
            <p style={{ textAlign: "center", fontSize: 14, color: "var(--text-muted)", margin: "0 0 36px" }}>Expert-led one-on-one advisory — pick the tier that suits you.</p>
          </Reveal>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 16 }}>
            {TEAM.map((t, i) => {
              const colors = ["#C8860A", "#94a3b8", "#cd7f32"];
              return (
                <Reveal key={t.name} delay={i * 100} from="bottom">
                  <div style={{ padding: "24px 22px", borderRadius: 14, border: "1.5px solid var(--border,#e2e8f0)", background: "var(--card-bg,#fff)", display: "flex", gap: 14, alignItems: "center" }}>
                    <div style={{ width: 50, height: 50, borderRadius: "50%", background: `${colors[i]}20`, border: `2px solid ${colors[i]}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>
                      {["💎", "🥈", "🥇"][i]}
                    </div>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: 13.5, color: "var(--navy,#07111F)", marginBottom: 3 }}>{t.name}</div>
                      <div style={{ fontSize: 11.5, color: "var(--text-muted)", marginBottom: 5 }}>{t.role}</div>
                      <div style={{ fontSize: 11, fontWeight: 800, color: colors[i] }}>{t.tier}</div>
                    </div>
                  </div>
                </Reveal>
              );
            })}
          </div>
          <Reveal delay={150}>
            <div style={{ textAlign: "center", marginTop: 20 }}>
              <a href="https://wa.me/923362444466" target="_blank" rel="noreferrer" style={{ fontSize: 13, color: "#C8860A", fontWeight: 700, textDecoration: "none" }}>
                Book a 1-on-1 session → WhatsApp 0336-2444466
              </a>
            </div>
          </Reveal>
        </section>

        {/* ── Application Form ── */}
        <section id="apply" style={{ padding: "0 0 90px" }}>
          <div style={{ maxWidth: 620, margin: "0 auto" }}>
            <Reveal>
              <div style={{ textAlign: "center", marginBottom: 32 }}>
                <h2 style={{ fontSize: "clamp(20px,3vw,26px)", fontWeight: 900, margin: "0 0 8px" }}>
                  <span style={{ color: "var(--navy,#07111F)" }}>Start Your</span> <span style={{ color: "#C8860A" }}>Application</span>
                </h2>
                <p style={{ fontSize: 13, color: "var(--text-muted)", margin: 0 }}>Fill in your details — our team will contact you within 1 business day.</p>
              </div>
            </Reveal>

            {submitted ? (
              <Reveal from="fade">
                <div style={{ padding: "52px 32px", textAlign: "center", borderRadius: 18, border: "2px solid #C8860A", background: "rgba(200,134,10,0.05)" }}>
                  <div style={{ fontSize: 56, marginBottom: 18 }}>🎉</div>
                  <div style={{ fontWeight: 900, fontSize: 22, color: "var(--navy,#07111F)", marginBottom: 10 }}>Application Received!</div>
                  <div style={{ fontSize: 14, color: "var(--text-muted)", lineHeight: 1.75, marginBottom: 28 }}>
                    Thank you, <strong>{form.name}</strong>! Our team will call you on <strong>{form.mobile}</strong> within 24 hours to complete your account setup.
                  </div>
                  <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
                    <Link href="/data-portal" style={{ padding: "12px 28px", background: "#C8860A", color: "#fff", borderRadius: 9, fontWeight: 800, fontSize: 13, textDecoration: "none" }}>
                      Explore Data Portal
                    </Link>
                    <button onClick={() => setSubmitted(false)} style={{ padding: "12px 24px", background: "none", border: "1.5px solid var(--border)", borderRadius: 9, fontWeight: 700, fontSize: 13, cursor: "pointer", color: "var(--text)" }}>
                      Submit Another
                    </button>
                  </div>
                </div>
              </Reveal>
            ) : (
              <Reveal from="bottom">
                <form onSubmit={handleSubmit} style={{ background: "var(--card-bg,#fff)", borderRadius: 18, border: "1.5px solid var(--border)", padding: "36px 32px 30px", boxShadow: "0 8px 40px rgba(0,0,0,0.06)" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
                    <div>
                      <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "var(--text-muted)", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em" }}>Full Name *</label>
                      <input required value={form.name} onChange={e => setF("name", e.target.value)} placeholder="As on CNIC" style={inp} />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "var(--text-muted)", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em" }}>CNIC *</label>
                      <input required value={form.cnic} onChange={e => setF("cnic", e.target.value)} placeholder="00000-0000000-0" style={inp} />
                    </div>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
                    <div>
                      <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "var(--text-muted)", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em" }}>Mobile Number *</label>
                      <input required value={form.mobile} onChange={e => setF("mobile", e.target.value)} placeholder="03XX-XXXXXXX" style={inp} />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "var(--text-muted)", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em" }}>Email Address</label>
                      <input type="email" value={form.email} onChange={e => setF("email", e.target.value)} placeholder="you@example.com" style={inp} />
                    </div>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
                    <div>
                      <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "var(--text-muted)", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em" }}>City</label>
                      <input value={form.city} onChange={e => setF("city", e.target.value)} placeholder="Karachi, Lahore…" style={inp} />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "var(--text-muted)", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em" }}>Account Type</label>
                      <select value={form.type} onChange={e => setF("type", e.target.value)} style={inp}>
                        <option value="sahulat">Sahulat Account (up to Rs 3M)</option>
                        <option value="full">Full PSX Account (no limit)</option>
                        <option value="joint">Joint Account</option>
                        <option value="rda">Overseas / RDA Account</option>
                        <option value="corporate">Corporate Account</option>
                      </select>
                    </div>
                  </div>
                  <div style={{ marginBottom: 22 }}>
                    <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "var(--text-muted)", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em" }}>Annual Income Range</label>
                    <select value={form.income} onChange={e => setF("income", e.target.value)} style={inp}>
                      <option value="">Select range…</option>
                      <option value="under500k">Under Rs 500,000</option>
                      <option value="500k-1m">Rs 500,000 – 1,000,000</option>
                      <option value="1m-3m">Rs 1,000,000 – 3,000,000</option>
                      <option value="3m-10m">Rs 3,000,000 – 10,000,000</option>
                      <option value="over10m">Over Rs 10,000,000</option>
                    </select>
                  </div>
                  <div style={{ padding: "14px 16px", borderRadius: 10, background: "rgba(200,134,10,0.06)", border: "1px solid rgba(200,134,10,0.2)", marginBottom: 22, fontSize: 11.5, color: "var(--text-muted)", lineHeight: 1.75 }}>
                    By submitting, you agree to be contacted by Stockifyy regarding your application. Your information is handled per SECP guidelines. No money is collected at this stage.
                  </div>
                  <button type="submit" style={{ width: "100%", padding: "14px", background: "linear-gradient(135deg,#C8860A,#e8a020)", color: "#fff", border: "none", borderRadius: 10, fontWeight: 900, fontSize: 15, cursor: "pointer", letterSpacing: "0.03em", boxShadow: "0 4px 18px rgba(200,134,10,0.35)" }}>
                    Submit Application →
                  </button>
                  <div style={{ textAlign: "center", marginTop: 16, fontSize: 12.5, color: "var(--text-muted)" }}>
                    Prefer WhatsApp? <a href="https://wa.me/923112444443" target="_blank" rel="noreferrer" style={{ color: "#C8860A", fontWeight: 700, textDecoration: "none" }}>Message us at 0311-4944443</a>
                  </div>
                  <div style={{ textAlign: "center", marginTop: 8, fontSize: 12, color: "var(--text-muted)" }}>
                    Already have an account? <Link href="/auth/login" style={{ color: "#C8860A", fontWeight: 700, textDecoration: "none" }}>Login here</Link>
                  </div>
                </form>
              </Reveal>
            )}
          </div>
        </section>
      </div>

      {/* ── Footer strip ── */}
      <div style={{ background: "linear-gradient(135deg, #0a1e3c, #122d58)", padding: "28px 20px", textAlign: "center" }}>
        <div style={{ fontSize: 13, color: "rgba(255,255,255,0.7)", marginBottom: 8 }}>
          <strong style={{ color: "#fff" }}>M/S Stock Ifyy (Private) Limited</strong> &nbsp;·&nbsp; SECP Licence: SECP/LRD/LD/73/S&A/SIPL/2025 &nbsp;·&nbsp; Securities & Futures Adviser
        </div>
        <div style={{ fontSize: 12.5, color: "rgba(255,255,255,0.5)" }}>
          Partner Broker: Munir Khanani Securities &nbsp;·&nbsp;
          <a href="tel:+923362444466" style={{ color: "#C8860A", fontWeight: 700, textDecoration: "none" }}>0336-2444466</a>
          &nbsp;·&nbsp;
          <a href="tel:+923114944443" style={{ color: "#C8860A", fontWeight: 700, textDecoration: "none" }}>0311-4944443</a>
          &nbsp;·&nbsp; www.stockifyy.com
        </div>
      </div>

      {/* ── Keyframe animations ── */}
      <style>{`
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes float {
          from { transform: translateY(0px) translateX(0px); }
          to   { transform: translateY(-18px) translateX(8px); }
        }
      `}</style>
    </div>
  );
}
