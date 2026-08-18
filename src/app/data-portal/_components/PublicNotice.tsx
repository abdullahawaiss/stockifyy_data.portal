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
          background: "#fff",
          borderRadius: 8,
          boxShadow: "0 4px 24px rgba(0,0,0,.14), 0 0 0 1px rgba(0,0,0,.06)",
          overflow: "hidden",
          animation: "pnUp .3s cubic-bezier(.22,.68,0,1.15)",
        }}>

          {/* Gold gradient bar */}
          <div style={{
            height: 4,
            background: "linear-gradient(90deg, #986300 0%, #FEA500 50%, #986300 100%)",
          }} />

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
          <div style={{ padding: "20px 22px 22px", background: "#FDFAF5" }}>

            {/* PUBLIC NOTICE */}
            <div style={{
              fontFamily: "Georgia, 'Times New Roman', serif",
              fontSize: 27, fontWeight: 900,
              color: "#1C1A17",
              letterSpacing: "-0.3px",
              marginBottom: 5,
            }}>
              PUBLIC NOTICE
            </div>

            {/* Gold subtitle */}
            <div style={{
              fontSize: 11.5, fontWeight: 800,
              color: "#986300",
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              marginBottom: 16,
              lineHeight: 1.4,
            }}>
              Stockifyy is a 100% Shariah-Compliant &amp; Riba-Free Advisory Platform
            </div>

            {/* Body paragraphs */}
            <p style={{ fontSize: 13.5, color: "#2C2A26", lineHeight: 1.78, marginBottom: 11, fontWeight: 500 }}>
              It is hereby notified to all users and the general public that Stockifyy
              is an <strong>SECP-licensed</strong> financial advisory operating strictly under
              Islamic finance principles. Our platform does <strong>not</strong> promote,
              facilitate, or earn from any interest-based (Riba) activity, margin
              financing, or non-Shariah-compliant instruments.
            </p>

            <p style={{ fontSize: 13.5, color: "#2C2A26", lineHeight: 1.78, marginBottom: 11, fontWeight: 500 }}>
              Every investment opportunity advised on this platform is evaluated against
              recognised Shariah screening criteria, ensuring your portfolio remains
              aligned with your values. All market data displayed is sourced directly
              and exclusively from the Pakistan Stock Exchange (PSX).
            </p>

            <p style={{ fontSize: 13.5, color: "#2C2A26", lineHeight: 1.78, marginBottom: 20, fontWeight: 500 }}>
              Stockifyy provides <strong>advisory services only</strong> — it does not
              hold, manage, or trade client funds directly. For any investment decisions,
              we strongly recommend consulting with a certified Shariah financial advisor.
            </p>

            {/* Divider */}
            <div style={{ height: 1, background: "#EDE8DE", marginBottom: 16 }} />

            {/* CTA — gold/amber, no green */}
            <button
              onClick={() => setOpen(false)}
              style={{
                width: "100%", padding: "11px 0",
                background: "linear-gradient(135deg, #986300 0%, #C98A00 50%, #986300 100%)",
                color: "#fff", border: "none", borderRadius: 5,
                fontSize: 13.5, fontWeight: 700, cursor: "pointer",
                letterSpacing: "0.02em",
              }}
            >
              I Understand &amp; Continue
            </button>
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
