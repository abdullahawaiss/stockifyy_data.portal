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
      {/* Backdrop */}
      <div
        onClick={() => setOpen(false)}
        style={{
          position: "fixed", inset: 0, zIndex: 9998,
          background: "rgba(0,0,0,0.5)",
          backdropFilter: "blur(3px)",
          WebkitBackdropFilter: "blur(3px)",
          animation: "pnFade .2s ease",
        }}
      />

      {/* Modal wrapper */}
      <div style={{
        position: "fixed", inset: 0, zIndex: 9999,
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "12px",
        pointerEvents: "none",
      }}>
        <div style={{
          pointerEvents: "all",
          width: "100%", maxWidth: 560,
          background: "#FDFAF5",
          borderRadius: 8,
          boxShadow: "0 4px 24px rgba(0,0,0,.14), 0 0 0 1px rgba(0,0,0,.06)",
          overflow: "hidden",
          animation: "pnUp .3s cubic-bezier(.22,.68,0,1.15)",
        }}>

          {/* Gold gradient bar */}
          <div style={{ height: 4, background: "linear-gradient(90deg, #986300 0%, #FEA500 50%, #986300 100%)" }} />

          {/* ── Header ── */}
          <div style={{
            background: "#FDFAF5",
            padding: "14px 18px 13px",
            display: "flex", alignItems: "center", justifyContent: "space-between",
            borderBottom: "1px solid #EDE8DE",
          }}>
            <Image
              src="/stockifyy-logo.svg"
              alt="Stockifyy"
              width={130}
              height={37}
              priority
              style={{ display: "block", height: 37, width: "auto" }}
            />
            <button
              onClick={() => setOpen(false)}
              aria-label="Close"
              style={{
                width: 28, height: 28, borderRadius: "50%",
                border: "1.5px solid #DDD8CC",
                background: "#F3EFE7",
                color: "#7A7268", fontSize: 12, fontWeight: 700,
                cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}
            >✕</button>
          </div>

          {/* ── Body ── */}
          <div style={{ padding: "18px 22px 0", background: "#FDFAF5" }}>

            {/* PUBLIC NOTICE */}
            <div style={{
              fontFamily: "Georgia, 'Times New Roman', serif",
              fontSize: 26, fontWeight: 900,
              color: "#1C1A17",
              letterSpacing: "-0.3px",
              marginBottom: 4,
            }}>
              PUBLIC NOTICE
            </div>

            {/* Gold subtitle */}
            <div style={{
              fontSize: 11, fontWeight: 800,
              color: "#986300",
              letterSpacing: "0.07em",
              textTransform: "uppercase",
              marginBottom: 14,
              lineHeight: 1.4,
            }}>
              Stockifyy — 100% Shariah-Compliant &amp; Riba-Free Advisory Platform
            </div>

            {/* Para 1 — Shariah */}
            <p style={{ fontSize: 13, color: "#2C2A26", lineHeight: 1.75, marginBottom: 10, fontWeight: 500 }}>
              It is hereby notified that Stockifyy is an <strong>SECP-licensed</strong> financial
              advisory operating strictly under Islamic finance principles. Our platform does{" "}
              <strong>not</strong> promote, facilitate, or earn from any interest-based (Riba)
              activity, margin financing, or non-Shariah-compliant instruments.
            </p>

            {/* Para 2 — Scam warning (from SECP notice) */}
            <div style={{
              background: "#FFF8ED",
              border: "1px solid #F0D080",
              borderLeft: "3px solid #C98A00",
              borderRadius: "0 6px 6px 0",
              padding: "10px 13px",
              marginBottom: 10,
            }}>
              <div style={{ fontSize: 10.5, fontWeight: 800, color: "#986300", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 5 }}>
                ⚠ Caution — Online Investment &amp; Trading Scams
              </div>
              <p style={{ fontSize: 12.5, color: "#3A2E00", lineHeight: 1.72, margin: 0, fontWeight: 500 }}>
                Investors are urged to remain vigilant. Fraudsters are exploiting social media platforms
                (WhatsApp, Facebook, Instagram) and falsely associating themselves with Stockifyy's name,
                logo, and identity to lure individuals into unauthorized investment schemes.
              </p>
            </div>

            {/* Para 3 — official channels */}
            <p style={{ fontSize: 13, color: "#2C2A26", lineHeight: 1.75, marginBottom: 10, fontWeight: 500 }}>
              <strong>Stockifyy has no affiliation</strong> with any unofficial WhatsApp groups, Facebook
              pages, or personal accounts claiming to represent us. All official communication is done
              exclusively through <strong>www.stockifyy.com</strong> and verified representatives only.
            </p>

            {/* Para 4 — advisory only */}
            <p style={{ fontSize: 13, color: "#2C2A26", lineHeight: 1.75, marginBottom: 14, fontWeight: 500 }}>
              Every investment opportunity on this platform is evaluated against recognised Shariah
              screening criteria. Stockifyy provides <strong>advisory services only</strong> — it does
              not hold or trade client funds. For investments, always consult a certified Shariah advisor.
            </p>

            {/* Divider */}
            <div style={{ height: 1, background: "#EDE8DE", marginBottom: 12 }} />

            {/* Footer row — website left, button right */}
            <div style={{
              display: "flex", alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
              paddingBottom: 18,
            }}>
              <a
                href="https://www.stockifyy.com"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  fontSize: 11.5, fontWeight: 700,
                  color: "#986300",
                  textDecoration: "none",
                  letterSpacing: "0.02em",
                  flexShrink: 0,
                }}
              >
                www.stockifyy.com
              </a>

              <button
                onClick={() => setOpen(false)}
                style={{
                  flex: 1, padding: "10px 0",
                  background: "linear-gradient(135deg, #986300 0%, #C98A00 50%, #986300 100%)",
                  color: "#fff", border: "none", borderRadius: 5,
                  fontSize: 13, fontWeight: 700, cursor: "pointer",
                  letterSpacing: "0.02em",
                }}
              >
                I Understand &amp; Continue
              </button>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes pnFade { from { opacity:0 } to { opacity:1 } }
        @keyframes pnUp   { from { opacity:0; transform:translateY(18px) } to { opacity:1; transform:none } }
      `}</style>
    </>
  );
}
