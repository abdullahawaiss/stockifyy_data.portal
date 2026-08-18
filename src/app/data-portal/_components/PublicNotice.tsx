"use client";
import { useEffect, useState } from "react";

export default function PublicNotice() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setOpen(true), 200);
    return () => clearTimeout(t);
  }, []);

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={() => setOpen(false)}
        style={{
          position: "fixed", inset: 0, zIndex: 9998,
          background: "rgba(0,0,0,0.55)",
          backdropFilter: "blur(2px)",
          WebkitBackdropFilter: "blur(2px)",
          animation: "pnFade .2s ease",
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
          width: "100%", maxWidth: 560,
          background: "#fff",
          borderRadius: 6,
          boxShadow: "0 2px 8px rgba(0,0,0,.12), 0 20px 60px rgba(0,0,0,.25)",
          overflow: "hidden",
          animation: "pnUp .28s cubic-bezier(.22,.68,0,1.15)",
        }}>

          {/* ── Header row (same as SCS: logo left, X right) ── */}
          <div style={{
            background: "#0B3D2A",
            padding: "14px 18px",
            display: "flex", alignItems: "center", justifyContent: "space-between",
          }}>
            {/* Logo */}
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{
                width: 42, height: 42, borderRadius: "50%",
                border: "2px solid #C9A240",
                background: "#0F5236",
                display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0,
              }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                  <path d="M16 8.5C15 6.5 13.2 5.5 11 5.5C8.5 5.5 6.5 7 6.5 9C6.5 10.7 7.7 11.7 10.3 12.5L12 13C14.5 13.8 16 15 16 17C16 19.3 13.8 21 11 21C8.5 21 6.5 19.7 5.5 17.5"
                    stroke="#C9A240" strokeWidth="1.8" strokeLinecap="round"/>
                </svg>
              </div>
              <div>
                <div style={{ color: "#fff", fontSize: 16, fontWeight: 800, letterSpacing: "-0.2px", lineHeight: 1.1 }}>
                  Stockifyy
                </div>
                <div style={{ color: "rgba(255,255,255,0.55)", fontSize: 10, marginTop: 2, letterSpacing: "0.04em" }}>
                  Pakistan Stock Exchange Data Portal
                </div>
              </div>
            </div>

            {/* X close */}
            <button
              onClick={() => setOpen(false)}
              aria-label="Close"
              style={{
                width: 30, height: 30, borderRadius: "50%",
                border: "2px solid rgba(255,255,255,0.3)",
                background: "transparent", color: "#fff",
                fontSize: 14, fontWeight: 700, cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
                lineHeight: 1,
              }}
            >✕</button>
          </div>

          {/* ── Content (white area, like SCS) ── */}
          <div style={{ padding: "22px 24px 24px" }}>

            {/* "PUBLIC NOTICE" — big bold green like SCS */}
            <div style={{
              fontSize: 26, fontWeight: 900,
              color: "#0B5C35",
              letterSpacing: "-0.5px",
              marginBottom: 6,
              fontFamily: "Georgia, 'Times New Roman', serif",
            }}>
              PUBLIC NOTICE
            </div>

            {/* Green subtitle line */}
            <div style={{
              fontSize: 12, fontWeight: 800,
              color: "#0B5C35",
              letterSpacing: "0.04em",
              textTransform: "uppercase",
              marginBottom: 16,
              lineHeight: 1.4,
            }}>
              Stockifyy is a 100% Shariah-Compliant &amp; Riba-Free Stock Data Portal
            </div>

            {/* Body paragraphs — no bullets, no Urdu */}
            <p style={{ fontSize: 13.5, color: "#1a1a1a", lineHeight: 1.75, marginBottom: 12, fontWeight: 500 }}>
              It is hereby notified to all users and the general public that Stockifyy
              operates strictly in accordance with Islamic finance principles. This platform
              does <strong>not</strong> promote, facilitate, or earn from any interest-based
              (Riba) activity, margin financing, or non-Shariah-compliant instruments.
            </p>

            <p style={{ fontSize: 13.5, color: "#1a1a1a", lineHeight: 1.75, marginBottom: 12, fontWeight: 500 }}>
              Every company listed on this portal displays its Shariah compliance screening
              status based on recognized criteria. All market data is sourced directly and
              exclusively from the Pakistan Stock Exchange (PSX) without alteration.
            </p>

            <p style={{ fontSize: 13.5, color: "#1a1a1a", lineHeight: 1.75, marginBottom: 20, fontWeight: 500 }}>
              Stockifyy is a <strong>data portal only</strong> — it does not manage funds,
              execute trades, or provide personalized investment advice. For investment
              decisions, always consult a certified Shariah advisor.
            </p>

            {/* Dismiss button */}
            <button
              onClick={() => setOpen(false)}
              style={{
                width: "100%", padding: "11px 0",
                background: "#0B3D2A",
                color: "#fff", border: "none", borderRadius: 4,
                fontSize: 13.5, fontWeight: 700, cursor: "pointer",
                letterSpacing: "0.01em",
              }}
            >
              I Understand &amp; Continue
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes pnFade { from { opacity:0 } to { opacity:1 } }
        @keyframes pnUp   { from { opacity:0; transform:translateY(20px) } to { opacity:1; transform:none } }
      `}</style>
    </>
  );
}
