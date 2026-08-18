"use client";

export default function PortalTitle() {
  return (
    <>
      <style>{`
        @keyframes titleFadeUp {
          from { opacity:0; transform:translateY(6px); }
          to   { opacity:1; transform:translateY(0); }
        }
        @keyframes titleShimmer {
          0%   { background-position: -300% center; }
          100% { background-position: 300% center; }
        }
        @keyframes pulseDot {
          0%,100% { opacity:1; transform:scale(1); }
          50%      { opacity:0.5; transform:scale(0.7); }
        }
        @keyframes dividerGrow {
          from { width:0; opacity:0; }
          to   { width:1px; opacity:1; }
        }
        @keyframes labelSlide {
          from { opacity:0; transform:translateX(-6px); }
          to   { opacity:0.8; transform:translateX(0); }
        }
        @keyframes subtitleFade {
          from { opacity:0; }
          to   { opacity:1; }
        }
      `}</style>

      <div style={{ display:"flex", alignItems:"center", gap:10 }}>

        {/* PSX label */}
        <span style={{
          fontSize:9, fontWeight:700, letterSpacing:"0.18em",
          textTransform:"uppercase", color:"var(--gold)",
          animation:"labelSlide 500ms cubic-bezier(0.22,1,0.36,1) both",
          animationDelay:"0ms",
        }}>
          PSX
        </span>

        <div style={{ width:1, height:12, background:"var(--border)", animation:"dividerGrow 300ms ease both", animationDelay:"200ms" }} />

        {/* Main title with shimmer */}
        <span style={{
          fontSize:13, fontWeight:800, letterSpacing:"-0.01em",
          background:"linear-gradient(90deg, var(--navy) 0%, #1a3a6b 30%, var(--gold) 50%, #1a3a6b 70%, var(--navy) 100%)",
          backgroundSize:"300% auto",
          WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", backgroundClip:"text",
          animation:"titleFadeUp 600ms cubic-bezier(0.22,1,0.36,1) both, titleShimmer 5s linear 800ms infinite",
        }}>
          Stockifyy Data Portal
        </span>

        <div style={{ width:1, height:12, background:"var(--border)", animation:"dividerGrow 300ms ease both", animationDelay:"400ms" }} />

        {/* Live dot */}
        <span style={{
          display:"inline-flex", alignItems:"center", gap:5,
          animation:"subtitleFade 600ms ease both", animationDelay:"600ms",
        }}>
          <span style={{
            width:5, height:5, borderRadius:"50%", background:"#16A34A", display:"inline-block",
            animation:"pulseDot 2s ease-in-out infinite",
          }} />
          <span style={{ fontSize:9, color:"var(--text-muted)", letterSpacing:"0.06em" }}>
            SECP Certified · Live Market Data
          </span>
        </span>

      </div>
    </>
  );
}
