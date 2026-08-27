"use client";
import { useState } from "react";
import Link from "next/link";

const STEPS = [
  {
    num: "01",
    icon: "🪪",
    title: "Verify Your Identity",
    desc: "CNIC, selfie verification & basic personal details — takes 3 minutes.",
    items: ["Valid CNIC (both sides)", "Live selfie photo", "Mobile number registered to CNIC"],
  },
  {
    num: "02",
    icon: "🏦",
    title: "Bank Account Details",
    desc: "Link your existing bank account for seamless fund transfers.",
    items: ["Bank account in your own name", "IBAN number", "Online banking access"],
  },
  {
    num: "03",
    icon: "📋",
    title: "KYC & Risk Profile",
    desc: "A short form to understand your investment goals and risk tolerance.",
    items: ["Investment objectives", "Annual income range", "Risk tolerance quiz"],
  },
  {
    num: "04",
    icon: "✅",
    title: "Account Activation",
    desc: "Your account is verified by our compliance team within 24 hours.",
    items: ["e-Signature of account agreement", "SECP UIN assignment", "Trading platform access granted"],
  },
];

const FEATURES = [
  { icon: "⚡", title: "Fast Execution", desc: "Trades executed in milliseconds on PSX live market" },
  { icon: "🔒", title: "SECP Regulated", desc: "Fully licensed broker under SECP & PSX regulations" },
  { icon: "📊", title: "Research Portal", desc: "Free access to Stockifyy data portal & stock screener" },
  { icon: "💰", title: "Low Brokerage", desc: "Competitive commission rates — as low as 0.05%" },
  { icon: "📱", title: "Mobile App", desc: "Trade from anywhere via our iOS and Android app" },
  { icon: "🧮", title: "Financial Tools", desc: "ROI, CAGR, Zakat, salary tax calculators built-in" },
];

const DOCS = [
  { icon: "🪪", title: "Original CNIC", desc: "Clear copy of both sides" },
  { icon: "📸", title: "Passport Photo", desc: "Recent passport-size photograph" },
  { icon: "🏦", title: "Bank Statement", desc: "Last 3 months bank statement" },
  { icon: "📄", title: "Salary Slip / ITR", desc: "Proof of income (if employed)" },
  { icon: "📱", title: "Zong/Jazz SIM", desc: "CNIC-registered mobile number" },
];

export default function OpenAccountClient() {
  const [form, setForm] = useState({ name: "", cnic: "", mobile: "", email: "", city: "", type: "individual", income: "" });
  const [submitted, setSubmitted] = useState(false);

  function setF(k: string, v: string) { setForm(f => ({ ...f, [k]: v })); }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !form.cnic || !form.mobile) return;
    setSubmitted(true);
  }

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "11px 14px", borderRadius: 8, boxSizing: "border-box",
    border: "1.5px solid var(--border,#e2e8f0)", background: "var(--background,#f8fafc)",
    fontSize: 13.5, color: "var(--text)", outline: "none",
    transition: "border-color 150ms",
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--background)", fontFamily: "inherit" }}>
      {/* Hero */}
      <div style={{
        background: "linear-gradient(135deg, #07111F 0%, #0f2040 60%, #1a3560 100%)",
        padding: "60px 20px 80px", textAlign: "center", position: "relative", overflow: "hidden",
      }}>
        {/* Gold glow */}
        <div style={{ position: "absolute", top: -100, left: "50%", transform: "translateX(-50%)", width: 600, height: 300, background: "radial-gradient(ellipse, rgba(200,134,10,0.18) 0%, transparent 70%)", pointerEvents: "none" }} />
        <div style={{ position: "relative", zIndex: 1 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "5px 16px", borderRadius: 20, border: "1px solid rgba(200,134,10,0.4)", background: "rgba(200,134,10,0.08)", marginBottom: 20 }}>
            <span style={{ fontSize: 12, color: "#C8860A", fontWeight: 700 }}>SECP Licensed · PSX Member</span>
          </div>
          <h1 style={{ fontSize: "clamp(28px,5vw,52px)", fontWeight: 900, color: "#fff", margin: "0 0 16px", lineHeight: 1.15 }}>
            Start Investing on PSX<br />
            <span style={{ color: "#C8860A" }}>in Minutes</span>
          </h1>
          <p style={{ fontSize: "clamp(14px,2vw,17px)", color: "rgba(255,255,255,0.72)", margin: "0 auto 32px", maxWidth: 540, lineHeight: 1.6 }}>
            Open your Stockifyy brokerage account today and get access to 860+ PSX-listed stocks, real-time data, and powerful research tools — completely free.
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <a href="#apply" style={{ padding: "13px 36px", background: "#C8860A", color: "#fff", borderRadius: 8, fontWeight: 800, fontSize: 14, textDecoration: "none", letterSpacing: "0.03em" }}>
              Apply Now — It&apos;s Free
            </a>
            <a href="tel:+923362444466" style={{ padding: "13px 24px", background: "rgba(255,255,255,0.08)", color: "#fff", borderRadius: 8, fontWeight: 700, fontSize: 14, textDecoration: "none", border: "1px solid rgba(255,255,255,0.2)" }}>
              📞 Call Us
            </a>
          </div>
          <div style={{ display: "flex", gap: 24, justifyContent: "center", marginTop: 32, flexWrap: "wrap" }}>
            {[["🚀", "Account in 24hrs"], ["💯", "Zero Setup Fee"], ["🔐", "Bank-Level Security"]].map(([icon, label]) => (
              <div key={label} style={{ fontSize: 13, color: "rgba(255,255,255,0.65)", display: "flex", alignItems: "center", gap: 6 }}>
                <span>{icon}</span>{label}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 20px" }}>
        {/* Features */}
        <section style={{ padding: "60px 0 48px" }}>
          <h2 style={{ textAlign: "center", fontSize: 24, fontWeight: 800, margin: "0 0 36px" }}>
            <span style={{ color: "var(--navy)" }}>Why Choose</span> <span style={{ color: "#C8860A" }}>Stockifyy?</span>
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))", gap: 16 }}>
            {FEATURES.map(f => (
              <div key={f.title} style={{ padding: "20px 22px", borderRadius: 12, border: "1.5px solid var(--border,#e2e8f0)", background: "var(--card-bg,#fff)", display: "flex", gap: 14, alignItems: "flex-start" }}>
                <div style={{ fontSize: 26, lineHeight: 1, flexShrink: 0 }}>{f.icon}</div>
                <div>
                  <div style={{ fontWeight: 800, fontSize: 14, color: "var(--navy)", marginBottom: 4 }}>{f.title}</div>
                  <div style={{ fontSize: 12, color: "var(--text-muted)", lineHeight: 1.6 }}>{f.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Steps */}
        <section style={{ padding: "0 0 60px" }}>
          <h2 style={{ textAlign: "center", fontSize: 24, fontWeight: 800, margin: "0 0 40px" }}>
            <span style={{ color: "var(--navy)" }}>How It</span> <span style={{ color: "#C8860A" }}>Works</span>
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(240px,1fr))", gap: 20 }}>
            {STEPS.map((s, idx) => (
              <div key={s.num} style={{ padding: "24px 22px", borderRadius: 12, border: "1.5px solid var(--border,#e2e8f0)", background: "var(--card-bg,#fff)", position: "relative" }}>
                <div style={{ position: "absolute", top: 16, right: 18, fontSize: 32, fontWeight: 900, color: "rgba(200,134,10,0.08)", letterSpacing: "-2px", fontVariantNumeric: "tabular-nums" }}>{s.num}</div>
                <div style={{ fontSize: 28, marginBottom: 12 }}>{s.icon}</div>
                <div style={{ fontWeight: 800, fontSize: 15, color: "var(--navy)", marginBottom: 6 }}>{s.title}</div>
                <div style={{ fontSize: 12.5, color: "var(--text-muted)", lineHeight: 1.6, marginBottom: 14 }}>{s.desc}</div>
                <ul style={{ margin: 0, padding: "0 0 0 16px", fontSize: 12, color: "var(--text-muted)", lineHeight: 2 }}>
                  {s.items.map(item => <li key={item}>{item}</li>)}
                </ul>
                {idx < STEPS.length - 1 && (
                  <div style={{ position: "absolute", top: "50%", right: -12, width: 24, height: 24, background: "#C8860A", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: "#fff", fontWeight: 800, zIndex: 2, transform: "translateY(-50%)" }}>→</div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Documents required */}
        <section style={{ padding: "0 0 60px" }}>
          <h2 style={{ textAlign: "center", fontSize: 22, fontWeight: 800, margin: "0 0 28px" }}>
            <span style={{ color: "var(--navy)" }}>Documents</span> <span style={{ color: "#C8860A" }}>Required</span>
          </h2>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
            {DOCS.map(d => (
              <div key={d.title} style={{ padding: "16px 20px", borderRadius: 10, border: "1.5px solid var(--border)", background: "var(--card-bg)", minWidth: 160, textAlign: "center" }}>
                <div style={{ fontSize: 28, marginBottom: 8 }}>{d.icon}</div>
                <div style={{ fontWeight: 700, fontSize: 13, color: "var(--navy)", marginBottom: 4 }}>{d.title}</div>
                <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{d.desc}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Application form */}
        <section id="apply" style={{ padding: "0 0 80px" }}>
          <div style={{ maxWidth: 600, margin: "0 auto" }}>
            <div style={{ textAlign: "center", marginBottom: 32 }}>
              <h2 style={{ fontSize: 24, fontWeight: 800, margin: "0 0 8px" }}>
                <span style={{ color: "var(--navy)" }}>Start Your</span> <span style={{ color: "#C8860A" }}>Application</span>
              </h2>
              <p style={{ fontSize: 13, color: "var(--text-muted)", margin: 0 }}>Fill in your details and our team will contact you within 1 business day.</p>
            </div>

            {submitted ? (
              <div style={{ padding: "48px 32px", textAlign: "center", borderRadius: 16, border: "1.5px solid #C8860A", background: "rgba(200,134,10,0.05)" }}>
                <div style={{ fontSize: 52, marginBottom: 16 }}>🎉</div>
                <div style={{ fontWeight: 800, fontSize: 20, color: "var(--navy)", marginBottom: 8 }}>Application Submitted!</div>
                <div style={{ fontSize: 14, color: "var(--text-muted)", lineHeight: 1.7, marginBottom: 24 }}>
                  Thank you, <strong>{form.name}</strong>! Our team will call you on <strong>{form.mobile}</strong> within 24 hours to complete your account setup.
                </div>
                <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
                  <Link href="/data-portal" style={{ padding: "10px 24px", background: "#C8860A", color: "#fff", borderRadius: 8, fontWeight: 700, fontSize: 13, textDecoration: "none" }}>
                    Explore Data Portal
                  </Link>
                  <button onClick={() => setSubmitted(false)} style={{ padding: "10px 24px", background: "none", border: "1.5px solid var(--border)", borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: "pointer", color: "var(--text)" }}>
                    Submit Another
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} style={{ background: "var(--card-bg,#fff)", borderRadius: 16, border: "1.5px solid var(--border)", padding: "32px 32px 28px" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
                  <div>
                    <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "var(--text-muted)", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em" }}>Full Name *</label>
                    <input required value={form.name} onChange={e => setF("name", e.target.value)} placeholder="As on CNIC" style={inputStyle} />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "var(--text-muted)", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em" }}>CNIC *</label>
                    <input required value={form.cnic} onChange={e => setF("cnic", e.target.value)} placeholder="00000-0000000-0" style={inputStyle} />
                  </div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
                  <div>
                    <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "var(--text-muted)", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em" }}>Mobile Number *</label>
                    <input required value={form.mobile} onChange={e => setF("mobile", e.target.value)} placeholder="+92 300 0000000" style={inputStyle} />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "var(--text-muted)", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em" }}>Email Address</label>
                    <input type="email" value={form.email} onChange={e => setF("email", e.target.value)} placeholder="you@example.com" style={inputStyle} />
                  </div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
                  <div>
                    <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "var(--text-muted)", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em" }}>City</label>
                    <input value={form.city} onChange={e => setF("city", e.target.value)} placeholder="Karachi, Lahore…" style={inputStyle} />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "var(--text-muted)", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em" }}>Account Type</label>
                    <select value={form.type} onChange={e => setF("type", e.target.value)} style={inputStyle}>
                      <option value="individual">Individual</option>
                      <option value="joint">Joint Account</option>
                      <option value="corporate">Corporate</option>
                      <option value="nrp">NRP (Non-Resident Pakistani)</option>
                    </select>
                  </div>
                </div>
                <div style={{ marginBottom: 22 }}>
                  <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "var(--text-muted)", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em" }}>Annual Income Range</label>
                  <select value={form.income} onChange={e => setF("income", e.target.value)} style={inputStyle}>
                    <option value="">Select range…</option>
                    <option value="under500k">Under Rs 500,000</option>
                    <option value="500k-1m">Rs 500,000 – 1,000,000</option>
                    <option value="1m-3m">Rs 1,000,000 – 3,000,000</option>
                    <option value="3m-10m">Rs 3,000,000 – 10,000,000</option>
                    <option value="over10m">Over Rs 10,000,000</option>
                  </select>
                </div>
                <div style={{ padding: "14px 16px", borderRadius: 10, background: "rgba(200,134,10,0.06)", border: "1px solid rgba(200,134,10,0.2)", marginBottom: 22, fontSize: 12, color: "var(--text-muted)", lineHeight: 1.7 }}>
                  By submitting this form, you agree to be contacted by Stockifyy regarding your account application. Your information is handled per our privacy policy and SECP guidelines. No money is collected at this stage.
                </div>
                <button type="submit" style={{ width: "100%", padding: "13px", background: "#C8860A", color: "#fff", border: "none", borderRadius: 8, fontWeight: 800, fontSize: 15, cursor: "pointer", letterSpacing: "0.03em" }}>
                  Submit Application →
                </button>
                <div style={{ textAlign: "center", marginTop: 14, fontSize: 12, color: "var(--text-muted)" }}>
                  Already have an account? <Link href="/auth/login" style={{ color: "#C8860A", fontWeight: 700, textDecoration: "none" }}>Login here</Link>
                </div>
              </form>
            )}
          </div>
        </section>
      </div>

      {/* Footer strip */}
      <div style={{ borderTop: "1px solid var(--border)", padding: "20px", textAlign: "center", fontSize: 12, color: "var(--text-muted)" }}>
        <strong style={{ color: "var(--navy)" }}>Stockifyy Securities (Pvt) Ltd</strong> &nbsp;·&nbsp;
        SECP Licensed Broker &nbsp;·&nbsp; PSX Trading Right Certificate Holder &nbsp;·&nbsp;
        <a href="tel:+923362444466" style={{ color: "#C8860A", fontWeight: 700, textDecoration: "none" }}>+92 336 2444466</a>
      </div>
    </div>
  );
}
