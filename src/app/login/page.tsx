"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

/* ═══════════════════════════════════════════════════
   CINEMATIC GOLDEN BACKGROUND
   Palette locked to logo: #FEA500 · #D4AF37 · #986300
   Layers: deep base · ken-burns scene · aurora bands ·
           6 amber/gold blobs · 3 light rays · halo
   100% CSS — infinite resolution, zero blur artifacts
═══════════════════════════════════════════════════ */
function AnimatedBackground() {
  return (
    <div aria-hidden="true" style={{ position:"absolute", inset:0, overflow:"hidden", background:"#0A0500" }}>

      {/* Scene base — cinematic Ken Burns pan */}
      <div className="bg-scene" />

      {/* Counter-drift depth layer */}
      <div className="bg-scene-b" />

      {/* Aurora gold bands — clearly visible horizontal light */}
      <div className="bg-aurora bg-aurora-1" />
      <div className="bg-aurora bg-aurora-2" />
      <div className="bg-aurora bg-aurora-3" />

      {/* Floating amber/gold blobs */}
      <div className="bg-blob bg-blob-1" />
      <div className="bg-blob bg-blob-2" />
      <div className="bg-blob bg-blob-3" />
      <div className="bg-blob bg-blob-4" />
      <div className="bg-blob bg-blob-5" />

      {/* Diagonal golden light rays */}
      <div className="bg-ray bg-ray-1" />
      <div className="bg-ray bg-ray-2" />
      <div className="bg-ray bg-ray-3" />

      {/* Warm halo behind card */}
      <div className="bg-halo" />

      {/* Edge vignette */}
      <div style={{
        position:"absolute", inset:0, pointerEvents:"none",
        background:"radial-gradient(ellipse 110% 110% at 50% 50%, transparent 36%, rgba(5,2,0,.80) 100%)",
      }} />
    </div>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const submit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      const res = await fetch("/api/auth/admin-login", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Login failed"); return; }
      router.push("/dashboard"); router.refresh();
    } catch { setError("Network error. Please try again."); }
    finally { setLoading(false); }
  }, [username, password, router]);

  return (
    <div style={{ position:"fixed", inset:0, display:"flex", alignItems:"center", justifyContent:"center", overflow:"hidden" }}>
      <style>{`

        /* ══════════════════════════════════════════════
           BACKGROUND — cinematic golden scene
        ══════════════════════════════════════════════ */

        /* Ken Burns — slow visible cinematic zoom+pan */
        @keyframes kenBurns {
          0%   { transform:scale(1.00) translate(0%,   0%  ); }
          25%  { transform:scale(1.10) translate(-2%,  1%  ); }
          50%  { transform:scale(1.18) translate(-3%,  2.5%); }
          75%  { transform:scale(1.10) translate( 1%, -1%  ); }
          100% { transform:scale(1.00) translate(0%,   0%  ); }
        }
        @keyframes kenBurnsB {
          0%   { transform:scale(1.06) translate( 1%, -1%  ); }
          50%  { transform:scale(1.00) translate(-2%,  2%  ); }
          100% { transform:scale(1.06) translate( 1%, -1%  ); }
        }

        /* Aurora horizontal light bands */
        @keyframes aurora1 {
          0%   { transform:translateX(-20%) scaleY(1.00); opacity:.62; }
          50%  { transform:translateX( 14%) scaleY(1.14); opacity:.90; }
          100% { transform:translateX(-20%) scaleY(1.00); opacity:.62; }
        }
        @keyframes aurora2 {
          0%   { transform:translateX( 12%) scaleY(1.00); opacity:.50; }
          50%  { transform:translateX(-16%) scaleY(0.88); opacity:.76; }
          100% { transform:translateX( 12%) scaleY(1.00); opacity:.50; }
        }
        @keyframes aurora3 {
          0%   { transform:translateX(- 9%) scaleY(1.06); opacity:.40; }
          50%  { transform:translateX( 18%) scaleY(0.94); opacity:.64; }
          100% { transform:translateX(- 9%) scaleY(1.06); opacity:.40; }
        }

        /* Blob drifts */
        @keyframes blob1 {
          0%   { transform:translate(0,0) scale(1);         opacity:.78; }
          28%  { transform:translate(7vw,-9vh) scale(1.16); opacity:.95; }
          62%  { transform:translate(-5vw,7vh) scale(.88);  opacity:.58; }
          100% { transform:translate(0,0) scale(1);         opacity:.78; }
        }
        @keyframes blob2 {
          0%   { transform:translate(0,0) scale(1);          opacity:.65; }
          36%  { transform:translate(-8vw,10vh) scale(1.20); opacity:.82; }
          72%  { transform:translate( 6vw,-6vh) scale(.84);  opacity:.48; }
          100% { transform:translate(0,0) scale(1);          opacity:.65; }
        }
        @keyframes blob3 {
          0%,100% { transform:translate(0,0) scale(1);          opacity:.60; }
          50%      { transform:translate(5vw,-11vh) scale(1.24); opacity:.80; }
        }
        @keyframes blob4 {
          0%,100% { transform:scale(1);    opacity:.55; }
          50%      { transform:scale(1.28); opacity:.75; }
        }
        @keyframes blob5 {
          0%   { transform:translate(0,0) scale(1);           opacity:.48; }
          40%  { transform:translate(-6vw,-8vh) scale(1.18);  opacity:.68; }
          80%  { transform:translate( 4vw, 6vh) scale( .86);  opacity:.38; }
          100% { transform:translate(0,0) scale(1);           opacity:.48; }
        }

        /* Diagonal light rays */
        @keyframes raySweep {
          0%   { transform:translateX(-160%) skewX(-18deg); opacity:0; }
          5%   { opacity:1; }
          90%  { opacity:.65; }
          100% { transform:translateX(240%) skewX(-18deg); opacity:0; }
        }

        /* Halo pulse */
        @keyframes haloBreath {
          0%,100% { opacity:.48; transform:translate(-50%,-50%) scale(1.00); }
          50%      { opacity:.78; transform:translate(-50%,-50%) scale(1.12); }
        }

        /* ── Scene base — rich golden-hour landscape ── */
        .bg-scene {
          position:absolute; inset:-15%;
          background:
            radial-gradient(ellipse 80% 55% at 15% 18%, rgba(254,165,0,.70) 0%, rgba(200,120,0,.36) 28%, transparent 58%),
            radial-gradient(ellipse 65% 70% at 86% 80%, rgba(152,99,0,.62) 0%, rgba(110,68,0,.30) 35%, transparent 60%),
            radial-gradient(ellipse 55% 55% at 52% 48%, rgba(212,175,55,.28) 0%, transparent 52%),
            radial-gradient(ellipse 50% 60% at 74% 26%, rgba(255,200,60,.50) 0%, rgba(180,130,0,.24) 32%, transparent 58%),
            radial-gradient(ellipse 42% 48% at 26% 74%, rgba(180,110,0,.44) 0%, rgba(130,78,0,.20) 36%, transparent 56%),
            radial-gradient(ellipse 35% 40% at 60% 70%, rgba(254,165,0,.30) 0%, transparent 50%),
            linear-gradient(160deg, #1E0D00 0%, #120800 30%, #0F0600 60%, #0A0400 100%);
          will-change:transform;
          animation:kenBurns 28s ease-in-out infinite;
          transform-origin:center center;
        }

        /* ── Depth counter-layer ── */
        .bg-scene-b {
          position:absolute; inset:-10%;
          background:
            radial-gradient(ellipse 52% 42% at 62% 38%, rgba(255,215,80,.22) 0%, transparent 52%),
            radial-gradient(ellipse 38% 52% at 28% 66%, rgba(152,99,0,.26) 0%, transparent 50%),
            radial-gradient(ellipse 62% 36% at 82% 16%, rgba(254,200,60,.20) 0%, transparent 50%);
          will-change:transform;
          animation:kenBurnsB 38s ease-in-out infinite;
          mix-blend-mode:screen;
        }

        /* ── Aurora bands — warm golden horizontal light ── */
        .bg-aurora {
          position:absolute; left:-22%; width:144%;
          pointer-events:none; will-change:transform,opacity;
        }
        .bg-aurora-1 {
          top:6%; height:30%;
          background:linear-gradient(180deg,transparent,rgba(254,165,0,.24) 30%,rgba(255,200,60,.34) 50%,rgba(212,175,55,.20) 70%,transparent);
          filter:blur(30px);
          animation:aurora1 13s ease-in-out infinite;
        }
        .bg-aurora-2 {
          top:40%; height:28%;
          background:linear-gradient(180deg,transparent,rgba(212,175,55,.18) 30%,rgba(254,165,0,.26) 50%,rgba(180,130,0,.16) 70%,transparent);
          filter:blur(34px);
          animation:aurora2 17s ease-in-out infinite 2.5s;
        }
        .bg-aurora-3 {
          bottom:4%; height:26%;
          background:linear-gradient(180deg,transparent,rgba(152,99,0,.16) 30%,rgba(200,150,0,.22) 50%,rgba(152,99,0,.12) 70%,transparent);
          filter:blur(26px);
          animation:aurora3 21s ease-in-out infinite 5s;
        }

        /* ── Amber/gold floating blobs ── */
        .bg-blob {
          position:absolute; border-radius:50%;
          pointer-events:none; will-change:transform,opacity;
          filter:blur(58px);
        }
        .bg-blob-1 {
          width:72vw; height:72vw; top:-24vw; left:-18vw;
          background:radial-gradient(circle,rgba(254,165,0,.65) 0%,rgba(212,175,55,.32) 40%,transparent 68%);
          animation:blob1 9s ease-in-out infinite;
        }
        .bg-blob-2 {
          width:62vw; height:62vw; top:10vh; right:-22vw;
          background:radial-gradient(circle,rgba(152,99,0,.58) 0%,rgba(110,68,0,.28) 40%,transparent 68%);
          animation:blob2 12s ease-in-out infinite 1.8s;
        }
        .bg-blob-3 {
          width:54vw; height:54vw; bottom:-16vw; left:14vw;
          background:radial-gradient(circle,rgba(212,175,55,.52) 0%,rgba(180,130,0,.26) 42%,transparent 66%);
          animation:blob3 15s ease-in-out infinite 3.5s;
        }
        .bg-blob-4 {
          width:36vw; height:36vw; top:28vh; left:33vw;
          background:radial-gradient(circle,rgba(255,230,100,.62) 0%,rgba(212,175,55,.30) 44%,transparent 66%);
          animation:blob4 8s ease-in-out infinite 0.8s;
        }
        .bg-blob-5 {
          width:46vw; height:46vw; bottom:2vh; right:6vw;
          background:radial-gradient(circle,rgba(180,110,0,.44) 0%,rgba(130,80,0,.22) 42%,transparent 65%);
          animation:blob5 11s ease-in-out infinite 4.2s;
        }

        /* ── Diagonal golden light rays ── */
        .bg-ray {
          position:absolute; top:-20%; height:140%;
          pointer-events:none; will-change:transform,opacity;
        }
        .bg-ray-1 {
          left:0; width:28vw;
          background:linear-gradient(90deg,transparent,rgba(254,165,0,.18),rgba(255,240,150,.30),rgba(254,165,0,.18),transparent);
          animation:raySweep 7s ease-in-out infinite 0.4s;
        }
        .bg-ray-2 {
          left:0; width:20vw;
          background:linear-gradient(90deg,transparent,rgba(212,175,55,.14),rgba(255,235,140,.24),rgba(212,175,55,.14),transparent);
          animation:raySweep 7s ease-in-out infinite 3.8s;
        }
        .bg-ray-3 {
          left:0; width:14vw;
          background:linear-gradient(90deg,transparent,rgba(255,200,60,.12),rgba(254,220,100,.20),rgba(255,200,60,.12),transparent);
          animation:raySweep 7s ease-in-out infinite 5.8s;
        }

        /* ── Warm halo ── */
        .bg-halo {
          position:absolute; width:56vw; height:56vw;
          top:50%; left:50%;
          border-radius:50%; pointer-events:none;
          background:radial-gradient(circle,rgba(254,165,0,.26) 0%,rgba(212,175,55,.12) 46%,transparent 70%);
          will-change:transform,opacity;
          animation:haloBreath 4s ease-in-out infinite;
        }

        /* ══════════════════════════════════════════════
           CARD KEYFRAMES
        ══════════════════════════════════════════════ */

        @keyframes cIn {
          from { opacity:0; transform:translateY(26px) scale(.96); }
          to   { opacity:1; transform:none; }
        }
        @keyframes cf {
          0%   { transform:translateY(-7px) translateX(0px); }
          32%  { transform:translateY(4px) translateX(1.5px); }
          65%  { transform:translateY(7px) translateX(-1.5px); }
          100% { transform:translateY(-7px) translateX(0px); }
        }
        @keyframes fUp {
          from { opacity:0; transform:translateY(9px); }
          to   { opacity:1; transform:none; }
        }
        @keyframes lp {
          0%,100% { filter:drop-shadow(0 0 6px rgba(254,165,0,.50)); }
          50%      { filter:drop-shadow(0 0 20px rgba(254,165,0,.90)) drop-shadow(0 0 40px rgba(212,175,55,.35)); }
        }
        @keyframes gdot {
          0%,100% { box-shadow:0 0 0 0 rgba(34,197,94,.70); }
          50%      { box-shadow:0 0 0 5px rgba(34,197,94,0); }
        }
        @keyframes sg {
          0%   { background-position:-300% center; }
          100% { background-position: 300% center; }
        }
        @keyframes bspin { to { transform:rotate(360deg); } }
        @keyframes reflectSlide {
          0%   { transform:translateX(-220%) skewX(-28deg); opacity:0; }
          5%   { opacity:1; }
          94%  { opacity:.35; }
          100% { transform:translateX(320%) skewX(-28deg); opacity:0; }
        }
        @keyframes btnShine {
          0%   { transform:translateX(-130%) skewX(-22deg); }
          100% { transform:translateX(230%) skewX(-22deg); }
        }
        @keyframes spin { to { transform:rotate(360deg); } }

        /* ══════════════════════════════════════════════
           CARD ELEMENTS
        ══════════════════════════════════════════════ */

        .cIn { animation:cIn .68s cubic-bezier(.22,1.1,.36,1) .06s both; }
        .cf  { animation:cf 4.2s ease-in-out infinite; }
        .lp  { animation:lp 3.4s ease-in-out infinite; }
        .gdot{ animation:gdot 2.2s ease-in-out infinite; }
        .f1{animation:fUp .38s ease .13s both}
        .f2{animation:fUp .38s ease .21s both}
        .f3{animation:fUp .38s ease .29s both}
        .f4{animation:fUp .38s ease .37s both}
        .f5{animation:fUp .38s ease .45s both}
        .f6{animation:fUp .38s ease .53s both}

        /* Spinning amber conic border ring */
        .card-ring {
          position:absolute; inset:-2px; border-radius:20px;
          overflow:hidden; z-index:-1; pointer-events:none;
        }
        .card-ring-inner {
          position:absolute; inset:-80%;
          background:conic-gradient(
            from 0deg,
            transparent      0%,
            rgba(254,165,0,0) 14%,
            rgba(254,165,0,.85) 21%,
            rgba(255,230,120,1) 25%,
            rgba(254,165,0,.85) 29%,
            transparent      40%,
            transparent      60%,
            rgba(212,175,55,0) 70%,
            rgba(212,175,55,.75) 76%,
            rgba(255,240,160,.95) 80%,
            rgba(212,175,55,.75) 84%,
            transparent      100%
          );
          animation:bspin 5s linear infinite;
          opacity:.80;
        }
        .card-ring-mask {
          position:absolute; inset:1.5px; border-radius:18px;
          background:rgba(12,7,0,.92);
          pointer-events:none;
        }

        /* Glass reflection */
        .card-reflect {
          position:absolute; inset:0; border-radius:18px;
          overflow:hidden; pointer-events:none; z-index:1;
        }
        .card-reflect-beam {
          position:absolute; top:0; bottom:0; width:38%;
          background:linear-gradient(90deg,transparent,rgba(255,230,100,.06),rgba(255,240,150,.10),rgba(255,230,100,.06),transparent);
          animation:reflectSlide 8s ease-in-out infinite 2s;
        }

        /* Shimmer footer text */
        .sg {
          background:linear-gradient(90deg,#7A5600 0%,#D4AF37 22%,#FEA500 50%,#D4AF37 78%,#7A5600 100%);
          background-size:300% auto;
          -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text;
          animation:sg 2.8s linear infinite;
        }

        /* Inputs */
        .inp {
          width:100%; padding:11px 13px 11px 38px; box-sizing:border-box;
          background:rgba(254,165,0,.05);
          border:1px solid rgba(212,175,55,.22); border-radius:9px;
          color:rgba(255,240,210,.92); font-size:13px; outline:none;
          transition:background .2s, border-color .22s, box-shadow .22s;
          font-family:inherit;
        }
        .inp::placeholder { color:rgba(212,175,55,.28); }
        .inp:focus {
          background:rgba(254,165,0,.09);
          border-color:rgba(254,165,0,.60);
          box-shadow:0 0 0 3px rgba(254,165,0,.13), 0 0 18px rgba(212,175,55,.10);
        }

        /* Submit button */
        .sbtn {
          position:relative; overflow:hidden;
          width:100%; padding:13px; border:none; border-radius:9px;
          background:linear-gradient(135deg,#6B4000 0%,#9A6200 18%,#C9861A 36%,#D4AF37 50%,#FEA500 66%,#C9861A 82%,#7A5000 100%);
          color:#07111F; font-size:13px; font-weight:900; letter-spacing:.06em; cursor:pointer;
          box-shadow:0 6px 28px rgba(212,175,55,.50), 0 2px 10px rgba(152,99,0,.35);
          transition:transform .15s, box-shadow .15s;
          text-shadow:0 1px 3px rgba(255,220,100,.30);
        }
        .sbtn::after {
          content:'';
          position:absolute; top:0; left:-100%; height:100%; width:55%;
          background:linear-gradient(90deg,transparent,rgba(255,255,255,.20),transparent);
          animation:btnShine 3s ease-in-out infinite 0.5s;
        }
        .sbtn:hover:not(:disabled) {
          transform:translateY(-2px);
          box-shadow:0 10px 38px rgba(212,175,55,.65), 0 4px 16px rgba(152,99,0,.40);
        }
        .sbtn:active:not(:disabled) { transform:translateY(0); }
        .sbtn:disabled { opacity:.38; cursor:not-allowed; }
        .sbtn:disabled::after { display:none; }

        /* Reduced motion */
        @media(prefers-reduced-motion:reduce){
          .bg-scene,.bg-scene-b,.bg-aurora,.bg-blob,.bg-ray,.bg-halo,
          .cIn,.cf,.lp,.gdot,.f1,.f2,.f3,.f4,.f5,.f6,.sg,
          .card-ring-inner,.card-reflect-beam,.sbtn::after {
            animation:none!important; opacity:1!important; transform:none!important;
          }
        }
        @media(max-width:480px){
          .card-pad { padding:18px 18px 16px!important; }
          .bg-blob   { filter:blur(46px); }
          .bg-ray-3,.bg-aurora-3 { display:none; }
        }
      `}</style>

      <AnimatedBackground />

      {/* ── LOGIN CARD ── */}
      <div
        className={`cIn cf${mounted ? "" : " opacity-0"}`}
        style={{ position:"relative", zIndex:10, width:"100%", maxWidth:384, margin:"0 16px" }}
      >
        {/* Animated amber border ring */}
        <div className="card-ring">
          <div className="card-ring-inner" />
          <div className="card-ring-mask" />
        </div>

        {/* Glass card surface */}
        <div style={{
          position:"relative",
          background:"rgba(12,6,0,.80)",
          backdropFilter:"blur(26px)", WebkitBackdropFilter:"blur(26px)",
          borderRadius:18,
          border:"1px solid rgba(212,175,55,.28)",
          overflow:"hidden",
          boxShadow:"0 32px 90px rgba(0,0,0,.75), 0 0 60px rgba(212,175,55,.12), 0 0 0 1px rgba(255,220,100,.06) inset, 0 1px 0 rgba(255,230,120,.10) inset",
        }}>

          {/* Glass reflection sweep */}
          <div className="card-reflect"><div className="card-reflect-beam" /></div>

          {/* Top amber accent bar */}
          <div style={{ height:3, background:"linear-gradient(90deg,transparent,rgba(152,99,0,.6),#D4AF37,#FEA500,#D4AF37,rgba(152,99,0,.6),transparent)" }} />

          <div className="card-pad" style={{ padding:"22px 26px 20px", position:"relative", zIndex:2 }}>

            {/* Logo */}
            <div className="f1" style={{ display:"flex", flexDirection:"column", alignItems:"center", marginBottom:14 }}>
              <img src="/stockifyy-full-logo.png" alt="Stockifyy" width={150} height={44}
                className="lp logo-gold" style={{ objectFit:"contain", maxWidth:"100%" }} />
              <div style={{
                marginTop:8, display:"flex", alignItems:"center", gap:5,
                padding:"3px 12px", borderRadius:999,
                background:"rgba(254,165,0,.08)", border:"1px solid rgba(212,175,55,.28)",
              }}>
                <span className="gdot" style={{ display:"inline-block", width:6, height:6, borderRadius:"50%", background:"#22c55e", flexShrink:0 }} />
                <span style={{ fontSize:8.5, fontWeight:700, letterSpacing:".16em", textTransform:"uppercase", color:"rgba(212,175,55,.75)" }}>
                  Markets Live · PSX
                </span>
              </div>
            </div>

            {/* Heading */}
            <div className="f2" style={{ textAlign:"center", marginBottom:14 }}>
              <h1 style={{ margin:0, fontSize:20, fontWeight:900, color:"rgba(255,240,210,.96)", letterSpacing:"-.015em" }}>
                Welcome Back
              </h1>
              <p style={{ margin:"4px 0 0", fontSize:9.5, color:"rgba(212,175,55,.45)", letterSpacing:".08em", textTransform:"uppercase" }}>
                Pakistan Stock Exchange · Data Portal
              </p>
            </div>

            {/* Divider */}
            <div className="f3" style={{ display:"flex", alignItems:"center", gap:8, marginBottom:14 }}>
              <div style={{ flex:1, height:1, background:"rgba(212,175,55,.18)" }} />
              <span style={{ fontSize:8.5, fontWeight:700, color:"rgba(212,175,55,.38)", letterSpacing:".18em", textTransform:"uppercase" }}>Secure Access</span>
              <div style={{ flex:1, height:1, background:"rgba(212,175,55,.18)" }} />
            </div>

            {/* Form */}
            <form onSubmit={submit}>

              {/* Username */}
              <div className="f4" style={{ marginBottom:11 }}>
                <label style={{ display:"block", fontSize:9.5, fontWeight:700, letterSpacing:".11em", textTransform:"uppercase", color:"rgba(212,175,55,.60)", marginBottom:5 }}>
                  Username
                </label>
                <div style={{ position:"relative" }}>
                  <svg style={{ position:"absolute", left:12, top:"50%", transform:"translateY(-50%)", pointerEvents:"none" }}
                    width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="rgba(212,175,55,.60)" strokeWidth="2" strokeLinecap="round">
                    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" />
                  </svg>
                  <input type="text" value={username} onChange={e => setUsername(e.target.value)}
                    required autoComplete="username" placeholder="Enter username" className="inp" />
                </div>
              </div>

              {/* Password */}
              <div className="f5" style={{ marginBottom:16 }}>
                <label style={{ display:"block", fontSize:9.5, fontWeight:700, letterSpacing:".11em", textTransform:"uppercase", color:"rgba(212,175,55,.60)", marginBottom:5 }}>
                  Password
                </label>
                <div style={{ position:"relative" }}>
                  <svg style={{ position:"absolute", left:12, top:"50%", transform:"translateY(-50%)", pointerEvents:"none" }}
                    width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="rgba(212,175,55,.60)" strokeWidth="2" strokeLinecap="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0110 0v4" />
                  </svg>
                  <input type={showPw ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)}
                    required autoComplete="current-password" placeholder="Enter password"
                    className="inp" style={{ paddingRight:38 }} />
                  <button type="button" onClick={() => setShowPw(v => !v)} tabIndex={-1}
                    style={{ position:"absolute", right:11, top:"50%", transform:"translateY(-50%)", background:"none", border:"none", cursor:"pointer", padding:2, opacity:.50, color:"rgba(212,175,55,.9)" }}>
                    {showPw
                      ? <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" /></svg>
                      : <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                    }
                  </button>
                </div>
              </div>

              {/* Error */}
              {error && (
                <div style={{
                  display:"flex", alignItems:"center", gap:6,
                  padding:"8px 11px", borderRadius:8, marginBottom:11,
                  background:"rgba(239,68,68,.08)", border:"1px solid rgba(239,68,68,.25)",
                  color:"#FCA5A5", fontSize:12,
                }}>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  {error}
                </div>
              )}

              {/* Submit */}
              <div className="f6">
                <button type="submit" disabled={loading || !username || !password} className="sbtn">
                  {loading
                    ? <span style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:7 }}>
                        <svg style={{ animation:"spin 1s linear infinite" }} width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                          <path d="M21 12a9 9 0 11-18 0" />
                        </svg>
                        Authenticating…
                      </span>
                    : <span style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:7 }}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                          <path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4" />
                          <polyline points="10 17 15 12 10 7" />
                          <line x1="15" y1="12" x2="3" y2="12" />
                        </svg>
                        Sign In to Data Portal
                      </span>
                  }
                </button>
              </div>
            </form>

            {/* Footer */}
            <div style={{ marginTop:16, paddingTop:12, borderTop:"1px solid rgba(212,175,55,.12)", textAlign:"center" }}>
              <p className="sg" style={{ margin:0, fontSize:9.5, fontWeight:900, letterSpacing:".17em", textTransform:"uppercase" }}>
                Working on Data Portal by AWAIS
              </p>
              <p style={{ margin:"4px 0 0", fontSize:8.5, color:"rgba(212,175,55,.24)", letterSpacing:".12em", textTransform:"uppercase" }}>
                PSX · SECP Certified · KSE Equities Intelligence
              </p>
            </div>

          </div>

          {/* Bottom accent bar — bronze/gold */}
          <div style={{ height:2.5, background:"linear-gradient(90deg,transparent,rgba(152,99,0,.6),#986300,#D4AF37,#986300,rgba(152,99,0,.6),transparent)" }} />
        </div>
      </div>
    </div>
  );
}
