"use client";
import Link from "next/link";
import { useRef } from "react";

const WA_ICON = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="#25D366" xmlns="http://www.w3.org/2000/svg">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
);

/** Phone numbers row — title ke samne */
export function PortalPhones() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 20, flexShrink: 0, marginRight: 8 }}>
      {/* Phone */}
      <a href="tel:+923362444466" style={{
        display: "flex", alignItems: "center", gap: 5,
        textDecoration: "none", fontSize: 12.5, fontWeight: 600, color: "#1e293b",
        whiteSpace: "nowrap",
      }}>
        <span style={{ fontSize: 14 }}>📞</span>
        <span>+92 336 2444466</span>
      </a>

      <span style={{ color: "var(--border)", fontSize: 13 }}>|</span>

      {/* WhatsApp */}
      <a href="https://wa.me/923362444466" target="_blank" rel="noreferrer" style={{
        display: "flex", alignItems: "center", gap: 5,
        textDecoration: "none", fontSize: 12.5, fontWeight: 600, color: "#25D366",
        whiteSpace: "nowrap",
      }}>
        {WA_ICON}
        <span>+92 336 2444466</span>
      </a>
    </div>
  );
}

/** Buttons row — search ke samne */
export default function PortalCTA() {
  const btnRef = useRef<HTMLAnchorElement>(null);

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
      <style>{`
        @keyframes gold-pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(212,175,55,0); border-color: #D4AF37; }
          50%       { box-shadow: 0 0 10px 3px rgba(212,175,55,0.45); border-color: #f0cc5a; }
        }
        .cta-open-account, .cta-client-login {
          animation: gold-pulse 2s ease-in-out infinite;
        }
        .cta-open-account:hover, .cta-client-login:hover {
          animation: none;
          background: #D4AF37 !important;
          color: #07111F !important;
          border-color: #D4AF37 !important;
          box-shadow: 0 0 18px 5px rgba(212,175,55,0.55);
        }
      `}</style>

      <a
        ref={btnRef}
        href="/auth/register"
        className="cta-open-account"
        style={{
          padding: "8px 30px", borderRadius: 7,
          background: "transparent", color: "#07111F",
          fontWeight: 700, fontSize: 13, textDecoration: "none",
          border: "1.5px solid #D4AF37",
          whiteSpace: "nowrap", letterSpacing: "0.03em",
          display: "inline-block",
          transition: "background 150ms, color 150ms, box-shadow 150ms",
        }}
      >
        Open New Account
      </a>
      <Link
        href="/auth/login"
        className="cta-client-login"
        style={{
          padding: "8px 20px", borderRadius: 7,
          background: "transparent", color: "#07111F",
          fontWeight: 700, fontSize: 13, textDecoration: "none",
          border: "1.5px solid #D4AF37",
          whiteSpace: "nowrap",
          transition: "background 150ms, color 150ms, box-shadow 150ms",
          display: "inline-block",
        }}
      >
        Client Login
      </Link>
    </div>
  );
}
