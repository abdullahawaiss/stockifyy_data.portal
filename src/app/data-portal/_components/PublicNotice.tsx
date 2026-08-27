"use client";
import { useEffect, useState } from "react";
import Image from "next/image";

export default function PublicNotice() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setOpen(true), 200);
    return () => clearTimeout(t);
  }, []);

  if (!open) return null;

  return (
    <>
      <div onClick={() => setOpen(false)} style={{
        position: "fixed", inset: 0, zIndex: 9998,
        background: "rgba(0,0,0,0.5)",
        backdropFilter: "blur(3px)", WebkitBackdropFilter: "blur(3px)",
        animation: "pnFade .2s ease",
      }} />

      <div style={{
        position: "fixed", inset: 0, zIndex: 9999,
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "12px", pointerEvents: "none",
      }}>
        <div style={{
          pointerEvents: "all",
          width: "100%", maxWidth: 500,
          background: "#FDFAF5",
          borderRadius: 8,
          boxShadow: "0 4px 24px rgba(0,0,0,.16), 0 0 0 1px rgba(0,0,0,.06)",
          overflow: "hidden",
          animation: "pnUp .3s cubic-bezier(.22,.68,0,1.15)",
        }}>

          {/* Gold bar */}
          <div style={{ height: 3, background: "linear-gradient(90deg,#986300,#FEA500 50%,#986300)" }} />

          {/* Header */}
          <div style={{
            background: "#FDFAF5", padding: "10px 16px",
            display: "flex", alignItems: "center", justifyContent: "space-between",
            borderBottom: "1px solid #EDE8DE",
          }}>
            <Image src="/stockifyy-logo.svg" alt="Stockifyy" width={110} height={31} priority
              style={{ display: "block", height: 31, width: "auto" }} />
            <button onClick={() => setOpen(false)} aria-label="Close" style={{
              width: 26, height: 26, borderRadius: "50%",
              border: "1.5px solid #DDD8CC", background: "#F3EFE7",
              color: "#7A7268", fontSize: 11, fontWeight: 700, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>✕</button>
          </div>

          {/* Body */}
          <div style={{ padding: "14px 18px 0" }}>

            <div style={{
              fontFamily: "Georgia,'Times New Roman',serif",
              fontSize: 22, fontWeight: 900, color: "#1C1A17",
              letterSpacing: "-0.3px", marginBottom: 3,
            }}>PUBLIC NOTICE</div>

            <div style={{
              fontSize: 9.5, fontWeight: 800, color: "#986300",
              letterSpacing: "0.07em", textTransform: "uppercase",
              marginBottom: 10, lineHeight: 1.4,
            }}>Stockifyy — 100% Shariah-Compliant &amp; Riba-Free Platform</div>

            {/* Para 1 */}
            <p style={{ fontSize: 12, color: "#2C2A26", lineHeight: 1.65, marginBottom: 8, fontWeight: 500 }}>
              Stockifyy is an <strong>SECP-licensed</strong> advisory operating strictly under Islamic finance principles.
              We do <strong>not</strong> promote any interest-based (Riba), margin financing, or non-Shariah instruments.
              All investment opportunities are screened against recognised Shariah criteria.
            </p>

            {/* Scam warning — compact */}
            <div style={{
              background: "#FFF8ED", border: "1px solid #F0D080",
              borderLeft: "3px solid #C98A00", borderRadius: "0 5px 5px 0",
              padding: "8px 11px", marginBottom: 8,
            }}>
              <div style={{ fontSize: 9.5, fontWeight: 800, color: "#986300", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 4 }}>
                ⚠ Caution — Online Scams
              </div>
              <p style={{ fontSize: 11.5, color: "#3A2E00", lineHeight: 1.6, margin: 0, fontWeight: 500 }}>
                Fraudsters are misusing Stockifyy's name and logo on WhatsApp, Facebook &amp; Instagram.
                We have <strong>no affiliation</strong> with any unofficial groups or personal accounts.
                All official communication is only through <strong>www.stockifyy.com</strong>.
              </p>
            </div>

            {/* Services grid */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px 10px", marginBottom: 10 }}>
              {[
                { icon: "📊", label: "Investment Advisory", desc: "SECP-licensed Shariah-compliant guidance" },
                { icon: "🎓", label: "Courses & Training",   desc: "Stock market & Islamic finance courses" },
                { icon: "📈", label: "Market Research",      desc: "PSX analysis & sector reports" },
                { icon: "🤝", label: "Portfolio Guidance",   desc: "Personalised Halal portfolio reviews" },
              ].map(s => (
                <div key={s.label} style={{ display: "flex", alignItems: "flex-start", gap: 7, background: "#FFF8ED", borderRadius: 5, padding: "6px 8px" }}>
                  <span style={{ fontSize: 14, flexShrink: 0 }}>{s.icon}</span>
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 800, color: "#5A3A00", lineHeight: 1.3 }}>{s.label}</div>
                    <div style={{ fontSize: 9.5, color: "#7A5C2A", lineHeight: 1.4 }}>{s.desc}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Para 2 */}
            <p style={{ fontSize: 12, color: "#2C2A26", lineHeight: 1.65, marginBottom: 12, fontWeight: 500 }}>
              Stockifyy offers <strong>advisory, education &amp; research services</strong> — we do not hold or trade client funds.
              All recommendations are screened under recognised Shariah criteria by our certified advisors.
            </p>

            <div style={{ height: 1, background: "#EDE8DE", marginBottom: 10 }} />

            {/* Footer */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, paddingBottom: 14 }}>
              <a href="https://www.stockifyy.com" target="_blank" rel="noopener noreferrer" style={{
                fontSize: 11, fontWeight: 700, color: "#986300",
                textDecoration: "none", letterSpacing: "0.01em", flexShrink: 0,
              }}>www.stockifyy.com</a>

              <button onClick={() => setOpen(false)} style={{
                flex: 1, padding: "9px 0",
                background: "linear-gradient(135deg,#986300,#C98A00 50%,#986300)",
                color: "#fff", border: "none", borderRadius: 5,
                fontSize: 12.5, fontWeight: 700, cursor: "pointer",
              }}>I Understand &amp; Continue</button>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes pnFade { from{opacity:0} to{opacity:1} }
        @keyframes pnUp   { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:none} }
      `}</style>
    </>
  );
}
