"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import CardFanAnimation from "./CardFanAnimation";

function safeReturnTo(raw: string | null): string {
  if (!raw) return "/data-portal";
  try {
    const decoded = decodeURIComponent(raw);
    if (decoded.startsWith("/data-portal")) return decoded;
  } catch { /* ignore */ }
  return "/data-portal";
}

/* ── Candlestick data (static seed, varied) ───────────── */
const CANDLES = [
  { o:44, h:58, l:38, c:54, up:true  },
  { o:54, h:62, l:49, c:49, up:false },
  { o:49, h:56, l:44, c:55, up:true  },
  { o:55, h:68, l:52, c:65, up:true  },
  { o:65, h:70, l:55, c:57, up:false },
  { o:57, h:64, l:53, c:62, up:true  },
  { o:62, h:72, l:58, c:70, up:true  },
  { o:70, h:75, l:62, c:64, up:false },
  { o:64, h:69, l:58, c:67, up:true  },
  { o:67, h:76, l:63, c:74, up:true  },
  { o:74, h:78, l:66, c:68, up:false },
  { o:68, h:74, l:62, c:72, up:true  },
  { o:72, h:82, l:69, c:79, up:true  },
  { o:79, h:84, l:72, c:73, up:false },
  { o:73, h:79, l:68, c:77, up:true  },
  { o:77, h:88, l:74, c:85, up:true  },
  { o:85, h:90, l:78, c:80, up:false },
  { o:80, h:87, l:76, c:84, up:true  },
];

/* Scale a candle y-value (0–100) into SVG y-coord */
const sy = (v: number) => 20 + (100 - v) * 1.6;

function CandlestickChart() {
  const W = 540, CW = 22, GAP = 8;
  return (
    <svg
      viewBox={`0 0 ${W} 200`}
      width="100%" height="100%"
      preserveAspectRatio="xMidYMid meet"
      style={{ opacity: 0.22 }}
    >
      {/* Grid lines */}
      {[0,1,2,3,4].map(i => (
        <line key={i}
          x1={0} y1={20 + i * 40} x2={W} y2={20 + i * 40}
          stroke="rgba(212,175,55,0.18)" strokeWidth={0.5} strokeDasharray="4 6"
        />
      ))}
      {/* Price line */}
      <polyline
        points={CANDLES.map((c,i) => `${14 + i*(CW+GAP) + CW/2},${sy((c.o+c.c)/2)}`).join(" ")}
        fill="none" stroke="#D4AF37" strokeWidth={1.2} opacity={0.5}
      />
      {/* Candles */}
      {CANDLES.map((c, i) => {
        const x = 14 + i * (CW + GAP);
        const color = c.up ? "#4ade80" : "#f87171";
        const bodyY = sy(Math.max(c.o, c.c));
        const bodyH = Math.max(2, Math.abs(sy(c.o) - sy(c.c)));
        return (
          <g key={i} style={{ animation: `candleFadeIn .4s ease ${i * 60}ms both` }}>
            {/* Wick */}
            <line x1={x + CW/2} y1={sy(c.h)} x2={x + CW/2} y2={sy(c.l)}
              stroke={color} strokeWidth={1.2} opacity={0.7} />
            {/* Body */}
            <rect x={x} y={bodyY} width={CW} height={bodyH}
              fill={color} opacity={0.75} rx={2} />
          </g>
        );
      })}
    </svg>
  );
}

/* ── Floating ticker badges ─────────────────────────── */
const TICKERS = [
  { sym:"KSE-100", val:"115,420", chg:"+1.24%", up:true,  delay:0    },
  { sym:"OGDC",    val:"186.40",  chg:"+2.35%", up:true,  delay:1.4  },
  { sym:"PPL",     val:"92.10",   chg:"-0.87%", up:false, delay:2.8  },
  { sym:"ENGRO",   val:"284.75",  chg:"+1.60%", up:true,  delay:0.7  },
  { sym:"HBL",     val:"215.00",  chg:"-0.46%", up:false, delay:2.1  },
  { sym:"LUCK",    val:"888.50",  chg:"+3.10%", up:true,  delay:3.5  },
  { sym:"MCB",     val:"211.20",  chg:"+0.57%", up:true,  delay:1.8  },
  { sym:"PSO",     val:"309.80",  chg:"-1.22%", up:false, delay:4.2  },
];

function TickerBadge({ sym, val, chg, up, delay, style }: {
  sym:string; val:string; chg:string; up:boolean; delay:number;
  style?: React.CSSProperties;
}) {
  return (
    <div style={{
      position:"absolute", display:"flex", alignItems:"center", gap:8,
      padding:"7px 12px", borderRadius:10,
      background:"rgba(7,17,31,0.70)",
      border:`1px solid ${up?"rgba(74,222,128,0.22)":"rgba(248,113,113,0.22)"}`,
      backdropFilter:"blur(8px)",
      animation:`tickerFloat 6s ease-in-out ${delay}s infinite`,
      ...style,
    }}>
      <div>
        <div style={{ fontSize:9, fontWeight:700, letterSpacing:".10em", color:"rgba(212,175,55,0.80)", textTransform:"uppercase" }}>{sym}</div>
        <div style={{ fontSize:12, fontWeight:800, color:"#fff", fontVariantNumeric:"tabular-nums" }}>{val}</div>
      </div>
      <div style={{
        fontSize:10, fontWeight:700, letterSpacing:".04em",
        color: up?"#4ade80":"#f87171",
        background: up?"rgba(74,222,128,0.10)":"rgba(248,113,113,0.10)",
        padding:"2px 6px", borderRadius:5,
      }}>{chg}</div>
    </div>
  );
}

export default function LoginClient() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const returnTo     = safeReturnTo(searchParams.get("returnTo"));

  const [email,      setEmail]      = useState("");
  const [password,   setPassword]   = useState("");
  const [showPw,     setShowPw]     = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error,      setError]      = useState("");
  const [loading,    setLoading]    = useState(false);
  const [mounted,    setMounted]    = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  // Surface OAuth/signup errors passed via query param.
  useEffect(() => {
    const err = searchParams.get("error");
    if (err === "email_exists") {
      setError("This email is already linked to a password account. Please sign in with your password.");
    } else if (err === "oauth_only_account") {
      setError("This account was created with Google. Please use 'Continue with Google' to sign in.");
    } else if (err === "google_failed") {
      setError("Google sign-in failed. Please try again.");
    } else if (err === "account_inactive") {
      setError("Your account is inactive. Please contact Stockifyy support.");
    }
  }, [searchParams]);

  const submit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email.trim()) { setError("Please enter your email address."); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) { setError("Please enter a valid email address."); return; }
    if (!password) { setError("Please enter your password."); return; }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ email: email.trim(), password, rememberMe }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.error === "ACCOUNT_INACTIVE") {
          setError("Your account is currently inactive. Please contact Stockifyy support.");
        } else if (data.error === "EMAIL_NOT_VERIFIED") {
          setError("Please verify your email address before signing in. Check your inbox for the verification link.");
        } else if (data.error === "OAUTH_ONLY_ACCOUNT") {
          setError("This account was created with Google. Please use 'Continue with Google' to sign in.");
        } else if (res.status === 429) {
          setError(data.error ?? "Too many login attempts. Please try again later.");
        } else {
          setError("Invalid email address or password.");
        }
        return;
      }
      const role = data.user?.role ?? "client";
      const isAdmin = role === "admin" || role === "super_admin";
      const dest = isAdmin && returnTo === "/data-portal" ? "/data-portal/admin" : returnTo;
      router.push(dest);
      router.refresh();
    } catch {
      setError("A network error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [email, password, rememberMe, returnTo, router]);

  return (
    <div style={{ position:"fixed", inset:0, display:"flex", overflow:"hidden", fontFamily:"system-ui,-apple-system,sans-serif", alignItems:"stretch" }}>
      <style>{`
        /* ── Candlestick animation ── */
        @keyframes candleFadeIn { from{opacity:0;transform:scaleY(0);transform-origin:bottom} to{opacity:1;transform:scaleY(1)} }

        /* ── Ticker float ── */
        @keyframes tickerFloat {
          0%,100%{transform:translateY(0px); opacity:.82}
          50%{transform:translateY(-8px); opacity:1}
        }

        /* ── Background glow pulse ── */
        @keyframes glowPulse {
          0%,100%{opacity:.55} 50%{opacity:.85}
        }

        /* ── Price line draw ── */
        @keyframes lineDraw {
          from{stroke-dashoffset:800} to{stroke-dashoffset:0}
        }

        /* ── Portrait float ── */
        @keyframes portraitFloat {
          0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)}
        }

        /* ── Left panel fade in ── */
        @keyframes panelIn { from{opacity:0;transform:translateX(-24px)} to{opacity:1;transform:none} }
        @keyframes cardIn  { from{opacity:0;transform:translateY(22px) scale(.97)} to{opacity:1;transform:none} }
        @keyframes fUp     { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:none} }
        @keyframes spin    { to{transform:rotate(360deg)} }
        @keyframes lp      { 0%,100%{filter:drop-shadow(0 0 6px rgba(212,175,55,.5))} 50%{filter:drop-shadow(0 0 22px rgba(212,175,55,.9))} }
        @keyframes gdot    { 0%,100%{box-shadow:0 0 0 0 rgba(34,197,94,.7)} 50%{box-shadow:0 0 0 5px rgba(34,197,94,0)} }
        @keyframes sg      { 0%{background-position:-300% center} 100%{background-position:300% center} }
        @keyframes btnShine{ 0%{transform:translateX(-130%) skewX(-22deg)} 100%{transform:translateX(230%) skewX(-22deg)} }

        .panel-in { animation:panelIn .7s cubic-bezier(.22,1,.36,1) .05s both; }
        .card-in  { animation:cardIn .65s cubic-bezier(.22,1.1,.36,1) .12s both; }
        .f1{animation:fUp .35s ease .10s both}.f2{animation:fUp .35s ease .18s both}
        .f3{animation:fUp .35s ease .26s both}.f4{animation:fUp .35s ease .34s both}
        .f5{animation:fUp .35s ease .42s both}.f6{animation:fUp .35s ease .50s both}
        .f7{animation:fUp .35s ease .58s both}
        .lp{animation:lp 3.4s ease-in-out infinite}
        .gdot{animation:gdot 2.2s ease-in-out infinite}
        .sg{background:linear-gradient(90deg,#7A5600 0%,#D4AF37 22%,#FEA500 50%,#D4AF37 78%,#7A5600 100%);background-size:300% auto;-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;animation:sg 2.8s linear infinite}

        /* ── Form elements ── */
        .inp{width:100%;padding:9px 13px 9px 38px;box-sizing:border-box;background:rgba(7,17,31,.04);border:1.5px solid rgba(7,17,31,.12);border-radius:9px;color:#07111F;font-size:13px;outline:none;transition:background .2s,border-color .22s,box-shadow .22s;font-family:inherit}
        .inp::placeholder{color:rgba(7,17,31,.28)}
        .inp:focus{background:rgba(212,175,55,.05);border-color:rgba(212,175,55,.55);box-shadow:0 0 0 3px rgba(212,175,55,.10)}
        .inp.err{border-color:rgba(239,68,68,.45)}

        .sbtn{position:relative;overflow:hidden;width:100%;padding:11px;border:none;border-radius:10px;background:#D78B02;color:#fff;font-size:13.5px;font-weight:900;letter-spacing:.06em;cursor:pointer;box-shadow:0 6px 28px rgba(215,139,2,.45),0 2px 10px rgba(180,100,0,.30);transition:transform .15s,box-shadow .15s;text-shadow:0 1px 3px rgba(0,0,0,.25)}
        .sbtn::after{content:'';position:absolute;top:0;left:-100%;height:100%;width:55%;background:linear-gradient(90deg,transparent,rgba(255,255,255,.22),transparent);animation:btnShine 3s ease-in-out infinite .5s}
        .sbtn:hover:not(:disabled){transform:translateY(-2px);box-shadow:0 10px 38px rgba(212,175,55,.65),0 4px 16px rgba(152,99,0,.40)}
        .sbtn:active:not(:disabled){transform:translateY(0)}
        .sbtn:disabled{opacity:.38;cursor:not-allowed}
        .sbtn:disabled::after{display:none}

        .check-box{width:15px;height:15px;border:1.5px solid rgba(7,17,31,.20);border-radius:4px;background:rgba(7,17,31,.03);cursor:pointer;appearance:none;-webkit-appearance:none;flex-shrink:0;transition:background .15s,border-color .15s;position:relative}
        .check-box:checked{background:#D4AF37;border-color:#D4AF37}
        .check-box:checked::after{content:'';position:absolute;left:3px;top:0px;width:5px;height:9px;border:2px solid #07111F;border-top:none;border-left:none;transform:rotate(45deg)}

        /* ── Right panel ── */
        .rp-glow{animation:glowPulse 4s ease-in-out infinite}

        /* ── Responsive ── */
        @media(max-width:900px){
          .right-panel{display:none!important}
          .left-panel{width:100%!important;min-width:0!important;max-width:100%!important;height:100vh!important}
        }

        @media(prefers-reduced-motion:reduce){
          .panel-in,.card-in,.f1,.f2,.f3,.f4,.f5,.f6,.f7,.lp,.gdot,.sg,.sbtn::after{animation:none!important;opacity:1!important;transform:none!important}
        }
      `}</style>

      {/* ══════════════════════════════════════════
          LEFT PANEL — login form
      ══════════════════════════════════════════ */}
      <div
        className="left-panel panel-in"
        style={{
          width:"44%", minWidth:420, maxWidth:560,
          height:"100vh",
          display:"flex", flexDirection:"column",
          justifyContent:"space-between", alignItems:"center",
          background:"#faf7f2",
          padding:"16px 48px 12px 48px",
          position:"relative", zIndex:10, overflowY:"hidden",
          boxShadow:"4px 0 40px rgba(7,17,31,0.10)",
          flexShrink:0,
        }}
      >
        {/* Top logo strip */}
        <div className="f1" style={{ width:"100%", display:"flex", alignItems:"center", paddingBottom:8 }}>
          <a href="/data-portal" style={{ textDecoration:"none", display:"flex", alignItems:"center" }}>
            <img src="/stockifyy-full-logo.png" alt="Stockifyy" className="lp" style={{ height:40, objectFit:"contain", maxWidth:180, cursor:"pointer" }} />
          </a>
        </div>

        {/* Card */}
        <div className="card-in" style={{ width:"100%", maxWidth:380, flex:1, display:"flex", flexDirection:"column", justifyContent:"center" }}>

          {/* Live badge */}
          <div className="f2" style={{ display:"flex", justifyContent:"center", marginBottom:10 }}>
            <div style={{
              display:"flex", alignItems:"center", gap:6,
              padding:"4px 14px", borderRadius:999,
              background:"rgba(212,175,55,.07)",
              border:"1px solid rgba(212,175,55,.25)",
            }}>
              <span className="gdot" style={{ display:"inline-block", width:6, height:6, borderRadius:"50%", background:"#22c55e", flexShrink:0 }} />
              <span style={{ fontSize:8.5, fontWeight:700, letterSpacing:".16em", textTransform:"uppercase", color:"rgba(212,175,55,.80)" }}>
                Markets Live · PSX
              </span>
            </div>
          </div>

          {/* Heading */}
          <div className="f3" style={{ textAlign:"center", marginBottom:10 }}>
            <h1 style={{ margin:0, fontSize:22, fontWeight:900, color:"#07111F", letterSpacing:"-.02em" }}>
              Client Login
            </h1>
            <p style={{ margin:"5px 0 0", fontSize:10, color:"rgba(7,17,31,.42)", letterSpacing:".10em", textTransform:"uppercase" }}>
              Stockifyy Data Portal · Secure Access
            </p>
          </div>

          {/* Divider */}
          <div className="f4" style={{ display:"flex", alignItems:"center", gap:8, marginBottom:10 }}>
            <div style={{ flex:1, height:1, background:"rgba(212,175,55,.15)" }} />
            <span style={{ fontSize:8.5, fontWeight:700, color:"rgba(7,17,31,.25)", letterSpacing:".20em", textTransform:"uppercase" }}>Secure Sign In</span>
            <div style={{ flex:1, height:1, background:"rgba(212,175,55,.15)" }} />
          </div>

          <form onSubmit={submit} noValidate>

            {/* Email */}
            <div style={{ marginBottom:12 }}>
              <label htmlFor="email" style={{ display:"block", fontSize:10, fontWeight:700, letterSpacing:".11em", textTransform:"uppercase", color:"rgba(7,17,31,.50)", marginBottom:5 }}>
                Email Address
              </label>
              <div style={{ position:"relative" }}>
                <svg style={{ position:"absolute", left:12, top:"50%", transform:"translateY(-50%)", pointerEvents:"none" }}
                  width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="rgba(7,17,31,.35)" strokeWidth="2" strokeLinecap="round">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
                </svg>
                <input id="email" type="email" value={email} onChange={e=>setEmail(e.target.value)}
                  required autoComplete="email" autoFocus placeholder="you@example.com"
                  className="inp" disabled={loading} aria-describedby={error?"login-error":undefined} />
              </div>
            </div>

            {/* Password */}
            <div style={{ marginBottom:10 }}>
              <label htmlFor="password" style={{ display:"block", fontSize:10, fontWeight:700, letterSpacing:".11em", textTransform:"uppercase", color:"rgba(7,17,31,.50)", marginBottom:5 }}>
                Password
              </label>
              <div style={{ position:"relative" }}>
                <svg style={{ position:"absolute", left:12, top:"50%", transform:"translateY(-50%)", pointerEvents:"none" }}
                  width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="rgba(7,17,31,.35)" strokeWidth="2" strokeLinecap="round">
                  <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/>
                </svg>
                <input id="password" type={showPw?"text":"password"} value={password} onChange={e=>setPassword(e.target.value)}
                  required autoComplete="current-password" placeholder="Enter your password"
                  className="inp" style={{ paddingRight:38 }} disabled={loading}
                  aria-describedby={error?"login-error":undefined} />
                <button type="button" onClick={()=>setShowPw(v=>!v)} aria-label={showPw?"Hide password":"Show password"}
                  style={{ position:"absolute", right:11, top:"50%", transform:"translateY(-50%)", background:"none", border:"none", cursor:"pointer", padding:2, opacity:.5, color:"#D4AF37" }} tabIndex={-1}>
                  {showPw
                    ? <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                    : <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  }
                </button>
              </div>
            </div>

            {/* Remember + Forgot */}
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:14 }}>
              <label style={{ display:"flex", alignItems:"center", gap:7, cursor:"pointer", fontSize:12, color:"rgba(7,17,31,.55)", fontWeight:500, userSelect:"none" }}>
                <input type="checkbox" className="check-box" checked={rememberMe} onChange={e=>setRememberMe(e.target.checked)} aria-label="Keep me signed in for 30 days" />
                Remember me
              </label>
              <span style={{ fontSize:11.5, color:"rgba(7,17,31,.35)", cursor:"default" }} title="Coming soon">
                Forgot password? <span style={{ fontSize:9, opacity:.7 }}>(Soon)</span>
              </span>
            </div>

            {/* Error */}
            {error && (
              <div id="login-error" role="alert" aria-live="assertive"
                style={{ display:"flex", alignItems:"flex-start", gap:7, padding:"9px 12px", borderRadius:8, marginBottom:13, background:"rgba(239,68,68,.06)", border:"1px solid rgba(239,68,68,.20)", color:"#B91C1C", fontSize:12.5, lineHeight:1.45 }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{ flexShrink:0, marginTop:1 }}>
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                {error}
              </div>
            )}

            {/* Submit */}
            <button type="submit" disabled={loading||!email.trim()||!password} className="sbtn" aria-busy={loading}>
              {loading
                ? <span style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:7 }}>
                    <svg style={{ animation:"spin 1s linear infinite" }} width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M21 12a9 9 0 11-18 0"/></svg>
                    Signing in…
                  </span>
                : <span style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:7 }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                      <path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/>
                    </svg>
                    Sign In to Data Portal
                  </span>
              }
            </button>
          </form>

          {/* OR divider */}
          <div style={{ display:"flex", alignItems:"center", gap:8, margin:"8px 0 8px" }}>
            <div style={{ flex:1, height:1, background:"rgba(7,17,31,.10)" }} />
            <span style={{ fontSize:9.5, fontWeight:600, color:"rgba(7,17,31,.30)", letterSpacing:".12em", textTransform:"uppercase" }}>or</span>
            <div style={{ flex:1, height:1, background:"rgba(7,17,31,.10)" }} />
          </div>

          {/* Continue with Google */}
          <button
            type="button"
            disabled={loading || googleLoading}
            onClick={() => {
              setGoogleLoading(true);
              window.location.href = `/api/auth/google/start?returnTo=${encodeURIComponent(returnTo)}`;
            }}
            style={{
              width:"100%", padding:"9px 16px", boxSizing:"border-box",
              display:"flex", alignItems:"center", justifyContent:"center", gap:10,
              background:"#fff", border:"1.5px solid rgba(7,17,31,.14)", borderRadius:10,
              cursor: loading || googleLoading ? "not-allowed" : "pointer",
              opacity: loading || googleLoading ? 0.5 : 1,
              fontSize:13, fontWeight:600, color:"#3c4043",
              boxShadow:"0 1px 6px rgba(7,17,31,.07)",
              transition:"box-shadow .15s, border-color .15s",
              fontFamily:"inherit",
            }}
            aria-label="Continue with Google"
          >
            {/* Official Google G icon */}
            <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
            </svg>
            {googleLoading ? "Redirecting…" : "Continue with Google"}
          </button>

          {/* Sign up link */}
          <p style={{ textAlign:"center", margin:"8px 0 0", fontSize:12, color:"rgba(7,17,31,.45)" }}>
            Don&apos;t have an account?{" "}
            <a href="/auth/signup" style={{ color:"#D4AF37", fontWeight:700, textDecoration:"none" }}>
              Sign Up
            </a>
          </p>

        </div>

        {/* Footer */}
        <div style={{ textAlign:"center", paddingBottom:10, paddingTop:8, pointerEvents:"none" }}>
          <p className="sg" style={{ margin:0, fontSize:9, fontWeight:900, letterSpacing:".17em", textTransform:"uppercase" }}>
            Stockifyy · Pakistan Stock Exchange Intelligence
          </p>
          <p style={{ margin:"3px 0 0", fontSize:8, color:"rgba(7,17,31,.22)", letterSpacing:".12em", textTransform:"uppercase" }}>
            SECP Certified · KSE Equities · Secure Session
          </p>
        </div>

      </div>

      {/* ══════════════════════════════════════════
          RIGHT PANEL — trading visuals + portraits
      ══════════════════════════════════════════ */}
      <div
        className="right-panel"
        style={{
          flex:1, height:"100vh", position:"relative", overflow:"hidden",
          background:"linear-gradient(160deg, #040D18 0%, #07111F 35%, #0A1828 60%, #06101C 100%)",
          minWidth:0,
        }}
      >
        {/* ── Subtle gold radial glow — top ── */}
        <div style={{
          position:"absolute", top:"-8%", left:"50%", transform:"translateX(-50%)",
          width:500, height:320, borderRadius:"50%",
          background:"radial-gradient(ellipse at center, rgba(212,175,55,.10) 0%, transparent 70%)",
          pointerEvents:"none",
        }} />

        {/* ── Bottom ambient glow ── */}
        <div style={{
          position:"absolute", bottom:"-5%", left:"50%", transform:"translateX(-50%)",
          width:460, height:280, borderRadius:"50%",
          background:"radial-gradient(ellipse at center, rgba(30,80,160,.14) 0%, transparent 65%)",
          pointerEvents:"none",
        }} />

        {/* ── Ticker badges — corners ── */}
        <TickerBadge {...TICKERS[0]} style={{ top:"8%",  left:"5%"  }} />
        <TickerBadge {...TICKERS[1]} style={{ top:"8%",  right:"5%" }} />
        <TickerBadge {...TICKERS[2]} style={{ top:"28%", left:"4%"  }} />
        <TickerBadge {...TICKERS[3]} style={{ top:"28%", right:"4%" }} />
        <TickerBadge {...TICKERS[4]} style={{ top:"72%", left:"5%"  }} />
        <TickerBadge {...TICKERS[5]} style={{ top:"72%", right:"5%" }} />

        {/* ── Stockifyy logo watermark ── */}
        <div style={{
          position:"absolute", top:"3%", left:"50%", transform:"translateX(-50%)",
          textAlign:"center", pointerEvents:"none", zIndex:5,
        }}>
          <img src="/stockifyy-full-logo.png" alt="" aria-hidden="true"
            style={{ height:30, objectFit:"contain", filter:"brightness(0) invert(1)", opacity:0.20 }} />
        </div>

        {/* ── PSX ghost tagline — behind cards ── */}
        <div style={{
          position:"absolute", bottom:"14%", left:"50%",
          transform:"translateX(-50%)",
          textAlign:"center", pointerEvents:"none", zIndex:2,
          width:"90%",
        }}>
          <div style={{
            fontSize:8.5, fontWeight:700, letterSpacing:".24em", textTransform:"uppercase",
            color:"rgba(212,175,55,.35)", marginBottom:5,
          }}>
            Pakistan Stock Exchange
          </div>
          <div style={{
            fontSize:26, fontWeight:900, letterSpacing:"-.01em",
            color:"rgba(255,255,255,.04)",
            lineHeight:1.1, textTransform:"uppercase",
          }}>
            Market<br/>Intelligence
          </div>
        </div>

        {/* ── Card fan animation (hero element) ── */}
        <CardFanAnimation />

        {/* ── Left edge fade — blend into white left panel ── */}
        <div style={{
          position:"absolute", top:0, left:0, bottom:0, width:60,
          background:"linear-gradient(to right, rgba(7,17,31,.6) 0%, transparent 100%)",
          pointerEvents:"none", zIndex:20,
        }} />
      </div>
    </div>
  );
}
