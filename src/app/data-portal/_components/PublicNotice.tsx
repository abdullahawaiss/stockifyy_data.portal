"use client";
import { useEffect, useState } from "react";

/* Brand tokens */
const G = "#0B4D35";   /* deep green  */
const GA = "#0F6344";  /* mid green   */
const AU = "#C9A227";  /* gold        */
const AUL = "#F0D97A"; /* light gold  */

export default function PublicNotice() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setOpen(true), 250);
    return () => clearTimeout(t);
  }, []);

  if (!open) return null;

  return (
    <>
      {/* ── Backdrop ─────────────────────────────────────── */}
      <div
        onClick={() => setOpen(false)}
        style={{
          position: "fixed", inset: 0, zIndex: 9998,
          background: "rgba(5,20,12,0.65)",
          backdropFilter: "blur(4px)",
          WebkitBackdropFilter: "blur(4px)",
          animation: "pnFade .22s ease",
        }}
      />

      {/* ── Modal shell ──────────────────────────────────── */}
      <div style={{
        position: "fixed", inset: 0, zIndex: 9999,
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "12px",
        pointerEvents: "none",
      }}>
        <div style={{
          pointerEvents: "all",
          width: "100%", maxWidth: 500,
          maxHeight: "calc(100dvh - 24px)",
          overflowY: "auto",
          background: "#FAFAF8",
          borderRadius: 12,
          boxShadow: "0 0 0 1px rgba(0,0,0,.08), 0 20px 60px rgba(0,0,0,.28)",
          animation: "pnUp .3s cubic-bezier(.22,.68,0,1.2)",
          display: "flex", flexDirection: "column",
        }}>

          {/* ── Gold top bar ─────────────────────────────── */}
          <div style={{ height: 5, background: `linear-gradient(90deg, ${AU} 0%, ${AUL} 60%, ${AU} 100%)`, borderRadius: "12px 12px 0 0", flexShrink: 0 }} />

          {/* ── Header ───────────────────────────────────── */}
          <div style={{
            padding: "16px 20px 14px",
            borderBottom: `1px solid rgba(0,0,0,.07)`,
            display: "flex", alignItems: "center", gap: 12,
            flexShrink: 0,
          }}>
            {/* Seal */}
            <div style={{
              width: 44, height: 44, borderRadius: "50%",
              border: `2px solid ${AU}`,
              background: G,
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0,
            }}>
              {/* Simple S wordmark */}
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                <path d="M15 7.5C14.2 5.8 12.7 5 11 5 8.8 5 7 6.3 7 8c0 1.4 1 2.2 3.2 2.8l1.6.4C14 11.8 15 12.8 15 14.2 15 16.3 13 18 10.5 18 8.5 18 6.8 17 6 15.5" stroke={AUL} strokeWidth="1.7" strokeLinecap="round"/>
              </svg>
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 15, fontWeight: 800, color: G, letterSpacing: "-0.2px" }}>
                Stockifyy
              </div>
              <div style={{ fontSize: 10.5, color: "#6B7280", marginTop: 1, letterSpacing: "0.04em", textTransform: "uppercase" }}>
                PSX Data Portal — Public Notice
              </div>
            </div>

            {/* Close */}
            <button
              onClick={() => setOpen(false)}
              aria-label="Close"
              style={{
                width: 28, height: 28, borderRadius: 6, border: "1px solid #E5E7EB",
                background: "#fff", color: "#6B7280", fontSize: 14,
                cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0, fontWeight: 600,
              }}
            >✕</button>
          </div>

          {/* ── Body ─────────────────────────────────────── */}
          <div style={{ padding: "16px 20px 20px", flex: 1 }}>

            {/* Heading */}
            <div style={{ marginBottom: 12 }}>
              <div style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                background: `${G}18`, border: `1px solid ${G}30`,
                borderRadius: 20, padding: "3px 10px 3px 8px",
                marginBottom: 8,
              }}>
                <span style={{
                  width: 6, height: 6, borderRadius: "50%",
                  background: AU, display: "inline-block",
                }} />
                <span style={{ fontSize: 10, fontWeight: 800, color: G, letterSpacing: "0.08em", textTransform: "uppercase" }}>
                  اعلان عام
                </span>
              </div>
              <h2 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: "#111827", lineHeight: 1.35 }}>
                Shariah-Compliant &amp; Riba-Free Platform
              </h2>
            </div>

            {/* Key statement */}
            <div style={{
              background: "#fff", border: `1.5px solid ${G}25`,
              borderLeft: `3px solid ${G}`,
              borderRadius: "0 8px 8px 0",
              padding: "10px 14px", marginBottom: 14,
            }}>
              <p style={{ margin: 0, fontSize: 12.5, color: "#1F2937", lineHeight: 1.7, fontWeight: 500 }}>
                Stockifyy is a <strong style={{ color: G }}>100% Shariah-compliant</strong> stock market data portal.
                This platform strictly follows Islamic finance principles and does{" "}
                <strong>not</strong> promote, facilitate, or earn from any interest-based (Riba) activities.
              </p>
            </div>

            {/* Points */}
            <div style={{ marginBottom: 14 }}>
              {[
                ["Shariah Screening", "Every listed company's Shariah compliance status is displayed based on recognized screening criteria."],
                ["Zero Interest (Riba)", "No interest-bearing instruments, margin financing, or Riba-based products are promoted on this platform."],
                ["PSX Official Data", "All market data is sourced directly from Pakistan Stock Exchange (PSX). We do not alter or fabricate figures."],
                ["Data Portal Only", "Stockifyy does not manage funds, execute trades, or provide personalized investment advice."],
              ].map(([title, desc], i) => (
                <div key={i} style={{
                  display: "flex", gap: 10, padding: "8px 0",
                  borderBottom: i < 3 ? "1px solid #F3F4F6" : "none",
                  alignItems: "flex-start",
                }}>
                  <div style={{
                    width: 20, height: 20, borderRadius: 5,
                    background: `${G}12`, border: `1px solid ${G}20`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    flexShrink: 0, marginTop: 1,
                  }}>
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                      <path d="M2 5.5L4 7.5L8 3" stroke={G} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "#111827", marginBottom: 1 }}>{title}</div>
                    <div style={{ fontSize: 11.5, color: "#6B7280", lineHeight: 1.55 }}>{desc}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Urdu note */}
            <div style={{
              background: `${AU}12`, border: `1px solid ${AU}40`,
              borderRadius: 8, padding: "10px 14px", marginBottom: 16,
              direction: "rtl", textAlign: "right",
            }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: AU, marginBottom: 4, letterSpacing: "0.02em" }}>
                نوٹ
              </div>
              <p style={{ margin: 0, fontSize: 12.5, color: "#78350F", lineHeight: 1.8, fontWeight: 500 }}>
                یہ پلیٹ فارم مکمل طور پر شریعت کے اصولوں کے مطابق ہے۔
                یہاں کوئی سودی لین دین نہیں ہوتا اور نہ ہی کوئی سودی مصنوعات فروخت کی جاتی ہیں۔
                سرمایہ کاری کے فیصلوں کے لیے اپنے شرعی مشیر سے رہنمائی حاصل کریں۔
              </p>
            </div>

            {/* CTA */}
            <button
              onClick={() => setOpen(false)}
              style={{
                width: "100%", padding: "11px 0",
                background: `linear-gradient(135deg, ${G} 0%, ${GA} 100%)`,
                color: "#fff", border: "none", borderRadius: 8,
                fontSize: 13.5, fontWeight: 700, cursor: "pointer",
                letterSpacing: "0.01em",
                boxShadow: `0 2px 12px ${G}40`,
              }}
            >
              میں سمجھتا / سمجھتی ہوں &nbsp;—&nbsp; I Understand, Continue
            </button>

            <p style={{ margin: "10px 0 0", fontSize: 10.5, color: "#9CA3AF", textAlign: "center", lineHeight: 1.5 }}>
              This notice appears on every session for regulatory transparency.
            </p>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes pnFade { from { opacity:0 } to { opacity:1 } }
        @keyframes pnUp   { from { opacity:0; transform:translateY(24px) scale(.97) } to { opacity:1; transform:none } }
      `}</style>
    </>
  );
}
