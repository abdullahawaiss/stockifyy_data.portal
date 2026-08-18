"use client";
import { useEffect, useState } from "react";

export default function PublicNotice() {
  const [visible, setVisible] = useState(false);

  // Show on every page load (not persisted to localStorage)
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 300);
    return () => clearTimeout(t);
  }, []);

  if (!visible) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={() => setVisible(false)}
        style={{
          position: "fixed", inset: 0, zIndex: 9998,
          background: "rgba(0,0,0,0.55)",
          backdropFilter: "blur(3px)",
          WebkitBackdropFilter: "blur(3px)",
          animation: "pnFadeIn 0.25s ease",
        }}
      />

      {/* Modal */}
      <div style={{
        position: "fixed", inset: 0, zIndex: 9999,
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "16px",
        pointerEvents: "none",
      }}>
        <div style={{
          pointerEvents: "all",
          background: "#fff",
          borderRadius: 14,
          boxShadow: "0 24px 80px rgba(0,0,0,0.35)",
          maxWidth: 560, width: "100%",
          overflow: "hidden",
          animation: "pnSlideUp 0.3s cubic-bezier(0.34,1.56,0.64,1)",
          position: "relative",
        }}>

          {/* Green header */}
          <div style={{
            background: "linear-gradient(135deg, #064E3B 0%, #065F46 60%, #047857 100%)",
            padding: "18px 20px 16px",
            display: "flex", alignItems: "center", gap: 14,
          }}>
            {/* Logo area */}
            <div style={{
              width: 46, height: 46, borderRadius: 10,
              background: "rgba(255,255,255,0.15)",
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0,
            }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                <path d="M12 2L2 7l10 5 10-5-10-5z" fill="#D4AF37"/>
                <path d="M2 17l10 5 10-5" stroke="#D4AF37" strokeWidth="1.8" strokeLinecap="round"/>
                <path d="M2 12l10 5 10-5" stroke="rgba(212,175,55,0.6)" strokeWidth="1.8" strokeLinecap="round"/>
              </svg>
            </div>
            <div>
              <div style={{ fontSize: 18, fontWeight: 800, color: "#fff", letterSpacing: "-0.3px" }}>
                Stockifyy
              </div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.7)", marginTop: 1 }}>
                Pakistan's Shariah-Compliant Stock Data Portal
              </div>
            </div>
            {/* Close */}
            <button
              onClick={() => setVisible(false)}
              style={{
                marginLeft: "auto", width: 30, height: 30, borderRadius: "50%",
                border: "none", background: "rgba(255,255,255,0.15)",
                color: "#fff", fontSize: 16, cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0,
              }}
            >✕</button>
          </div>

          {/* Body */}
          <div style={{ padding: "20px 22px 24px" }}>

            {/* Title */}
            <div style={{ marginBottom: 14 }}>
              <div style={{
                display: "inline-block",
                background: "#D1FAE5", color: "#064E3B",
                fontSize: 11, fontWeight: 800, letterSpacing: "0.08em",
                textTransform: "uppercase", padding: "3px 10px",
                borderRadius: 20, marginBottom: 8,
              }}>
                اعلان عام — Public Notice
              </div>
              <h2 style={{
                fontSize: 17, fontWeight: 800, color: "#064E3B",
                margin: 0, lineHeight: 1.3,
              }}>
                Shariah-Compliant &amp; Interest-Free Platform
              </h2>
            </div>

            {/* Key statement */}
            <div style={{
              background: "linear-gradient(135deg, #ECFDF5, #F0FDF4)",
              border: "1.5px solid #6EE7B7",
              borderRadius: 10, padding: "12px 14px", marginBottom: 14,
            }}>
              <p style={{ margin: 0, fontSize: 13, color: "#065F46", lineHeight: 1.65, fontWeight: 600 }}>
                🕌 &nbsp;Stockifyy is a <strong>100% Shariah-compliant</strong> data portal. We provide
                stock market information strictly in accordance with Islamic finance principles.
                Our platform does <strong>not</strong> promote, facilitate, or earn from any
                interest-based (Riba) activities.
              </p>
            </div>

            {/* Bullet points */}
            <ul style={{ margin: "0 0 16px", paddingLeft: 0, listStyle: "none" }}>
              {[
                { icon: "✅", text: "Shariah screening status shown for every listed company" },
                { icon: "🚫", text: "No Riba — zero interest-based instruments promoted on this platform" },
                { icon: "📊", text: "Data sourced directly from Pakistan Stock Exchange (PSX)" },
                { icon: "🔒", text: "We do not manage funds, accept investments, or provide trading services" },
                { icon: "⚠️",  text: "For investment decisions, always consult a certified Shariah advisor" },
              ].map((item, i) => (
                <li key={i} style={{
                  display: "flex", gap: 10, alignItems: "flex-start",
                  padding: "6px 0",
                  borderBottom: i < 4 ? "1px solid #F0FDF4" : "none",
                }}>
                  <span style={{ fontSize: 14, flexShrink: 0, marginTop: 1 }}>{item.icon}</span>
                  <span style={{ fontSize: 12.5, color: "#374151", lineHeight: 1.55 }}>{item.text}</span>
                </li>
              ))}
            </ul>

            {/* Urdu note */}
            <div style={{
              background: "#FFFBEB", border: "1px solid #FDE68A",
              borderRadius: 8, padding: "10px 14px", marginBottom: 18,
              textAlign: "right", direction: "rtl",
            }}>
              <p style={{ margin: 0, fontSize: 12.5, color: "#92400E", lineHeight: 1.8, fontWeight: 500 }}>
                یہ پلیٹ فارم مکمل طور پر شریعت کے اصولوں کے مطابق ہے۔ یہاں کوئی سودی
                لین دین نہیں ہوتا۔ تمام ڈیٹا پاکستان اسٹاک ایکسچینج سے لیا جاتا ہے۔
              </p>
            </div>

            {/* CTA button */}
            <button
              onClick={() => setVisible(false)}
              style={{
                width: "100%", padding: "11px 0",
                background: "linear-gradient(135deg, #065F46, #047857)",
                color: "#fff", border: "none", borderRadius: 9,
                fontSize: 14, fontWeight: 700, cursor: "pointer",
                boxShadow: "0 4px 14px rgba(6,95,70,0.35)",
                letterSpacing: "0.01em",
              }}
            >
              میں سمجھتا/سمجھتی ہوں — I Understand &amp; Continue
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes pnFadeIn  { from { opacity:0 } to { opacity:1 } }
        @keyframes pnSlideUp { from { opacity:0; transform:translateY(30px) scale(0.96) } to { opacity:1; transform:translateY(0) scale(1) } }
      `}</style>
    </>
  );
}
