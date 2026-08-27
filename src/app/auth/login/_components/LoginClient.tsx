"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function safeReturnTo(raw: string | null): string {
  if (!raw) return "/data-portal";
  try {
    const decoded = decodeURIComponent(raw);
    if (decoded.startsWith("/data-portal")) return decoded;
  } catch { /* ignore */ }
  return "/data-portal";
}

/* PSX background SVG — light warm chart motif */
function PsxBackground() {
  const LINE = "M0,320 C80,300 150,260 240,220 C310,188 370,200 450,160 C530,120 600,130 680,90 C760,50 830,60 920,28 C980,10 1040,18 1100,5";
  const LINE2 = "M0,380 C100,365 200,340 320,310 C420,285 500,295 600,265 C700,235 780,245 900,218 C980,200 1060,205 1100,195";
  const AREA = `${LINE} L1100,400 L0,400 Z`;

  return (
    <svg
      style={{ position:"absolute", inset:0, width:"100%", height:"100%", pointerEvents:"none" }}
      viewBox="0 0 1100 400" preserveAspectRatio="xMidYMid slice" aria-hidden="true"
    >
      <defs>
        <linearGradient id="bgFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#E79A00" stopOpacity=".09"/>
          <stop offset="100%" stopColor="#E79A00" stopOpacity="0"/>
        </linearGradient>
        <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#B87B1A" stopOpacity=".25"/>
          <stop offset="100%" stopColor="#E79A00" stopOpacity=".45"/>
        </linearGradient>
      </defs>
      {/* Grid */}
      {[80,160,240,320].map(y=>(
        <line key={y} x1="0" y1={y} x2="1100" y2={y}
          stroke="rgba(212,151,26,0.07)" strokeWidth="1" strokeDasharray="8 14"/>
      ))}
      {[0,220,440,660,880].map(x=>(
        <line key={x} x1={x} y1="0" x2={x} y2="400"
          stroke="rgba(212,151,26,0.04)" strokeWidth="1"/>
      ))}
      {/* Area fill */}
      <path d={AREA} fill="url(#bgFill)"/>
      {/* Main chart line */}
      <path d={LINE} fill="none" stroke="url(#lineGrad)" strokeWidth="2.5"
        strokeLinecap="round"
        pathLength="1" strokeDasharray="1" strokeDashoffset="1"
        style={{ animation:"bgDraw 3s cubic-bezier(.37,0,.63,1) .2s forwards" }}/>
      {/* Secondary softer line */}
      <path d={LINE2} fill="none" stroke="rgba(212,151,26,0.12)" strokeWidth="1.5" strokeLinecap="round"/>

      {/* Floating stat labels */}
      <g style={{ animation:"bgFadeIn .8s ease 1.2s both", opacity:0 }}>
        <rect x="860" y="18" width="88" height="26" rx="6" fill="rgba(255,255,255,0.72)" stroke="rgba(212,151,26,0.18)" strokeWidth="1"/>
        <text x="904" y="28" textAnchor="middle" fontSize="6.5" fontWeight="700" fill="#7A5600" letterSpacing=".08em">KSE-100</text>
        <text x="904" y="38" textAnchor="middle" fontSize="8" fontWeight="800" fill="#0F1B2D">113,842</text>
      </g>
      <g style={{ animation:"bgFadeIn .8s ease 1.5s both", opacity:0 }}>
        <rect x="40" y="295" width="82" height="24" rx="6" fill="rgba(255,255,255,0.65)" stroke="rgba(212,151,26,0.15)" strokeWidth="1"/>
        <text x="81" y="305" textAnchor="middle" fontSize="6" fontWeight="700" fill="#7A5600" letterSpacing=".07em">MARKET CAP</text>
        <text x="81" y="314" textAnchor="middle" fontSize="8" fontWeight="800" fill="#0F1B2D">11.2 Tn PKR</text>
      </g>
      <g style={{ animation:"bgFadeIn .8s ease 1.8s both", opacity:0 }}>
        <rect x="480" y="230" width="72" height="22" rx="6" fill="rgba(255,255,255,0.60)" stroke="rgba(212,151,26,0.14)" strokeWidth="1"/>
        <text x="516" y="240" textAnchor="middle" fontSize="6" fontWeight="700" fill="#16A34A" letterSpacing=".06em">+38.6%</text>
        <text x="516" y="248" textAnchor="middle" fontSize="7" fontWeight="700" fill="#0F1B2D">52W Return</text>
      </g>
    </svg>
  );
}

function playPageChime() {
  try {
    const ctx  = new (window.AudioContext || (window as any).webkitAudioContext)();
    const t    = ctx.currentTime;
    [[523, 0, 0.18], [659, 0.12, 0.22], [784, 0.22, 0.28]].forEach(([freq, start, dur]) => {
      const osc  = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.type = "sine"; osc.frequency.value = freq;
      gain.gain.setValueAtTime(0, t + start);
      gain.gain.linearRampToValueAtTime(0.10, t + start + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, t + start + dur);
      osc.start(t + start); osc.stop(t + start + dur);
    });
  } catch { /* unsupported */ }
}

export default function LoginClient() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const returnTo     = safeReturnTo(searchParams.get("returnTo"));
  const cardRef      = useRef<HTMLDivElement>(null);

  const [email,      setEmail]      = useState("");
  const [password,   setPassword]   = useState("");
  const [showPw,     setShowPw]     = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error,      setError]      = useState("");
  const [loading,    setLoading]    = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

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
    <div style={{
      position:"fixed", inset:0,
      background:"linear-gradient(150deg, #FFFFFF 0%, #FDF9F3 50%, #FAF5EC 100%)",
      display:"flex", alignItems:"center", justifyContent:"center",
      fontFamily:"system-ui,-apple-system,sans-serif",
      overflow:"hidden",
    }}>
      <style suppressHydrationWarning>{`
        @keyframes bgDraw    { to{stroke-dashoffset:0} }
        @keyframes bgFadeIn  { to{opacity:1} }
        @keyframes cardIn    { from{opacity:0;transform:translateY(32px) scale(.96)} to{opacity:1;transform:translateY(0) scale(1)} }
        @keyframes cardOut   { from{opacity:1;transform:translateY(0) scale(1)} to{opacity:0;transform:translateY(-28px) scale(.97)} }
        @keyframes spin      { to{transform:rotate(360deg)} }
        @keyframes gdot      { 0%,100%{box-shadow:0 0 0 0 rgba(34,197,94,.7)} 50%{box-shadow:0 0 0 5px rgba(34,197,94,0)} }
        @keyframes btnShine  { 0%{transform:translateX(-130%) skewX(-22deg)} 100%{transform:translateX(230%) skewX(-22deg)} }
        @keyframes sg        { 0%{background-position:-300% center} 100%{background-position:300% center} }

        .ln-card   { animation:cardIn .6s cubic-bezier(.22,1.1,.36,1) .1s both }
        .ln-gdot   { animation:gdot 2.2s ease-in-out infinite }
        .ln-sg     { background:linear-gradient(90deg,#7A5600 0%,#D4971A 22%,#FEA500 50%,#D4971A 78%,#7A5600 100%);background-size:300% auto;-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;animation:sg 2.8s linear infinite }

        .ln-inp    { width:100%;padding:8px 14px 8px 38px;box-sizing:border-box;background:rgba(15,27,45,.04);border:1.5px solid rgba(15,27,45,.13);border-radius:10px;color:#0F1B2D;font-size:13.5px;outline:none;transition:background .2s,border-color .22s,box-shadow .22s;font-family:inherit }
        .ln-inp::placeholder { color:rgba(15,27,45,.30) }
        .ln-inp:focus { background:rgba(212,151,26,.05);border-color:rgba(212,151,26,.60);box-shadow:0 0 0 3px rgba(212,151,26,.12) }
        .ln-inp.err { border-color:rgba(239,68,68,.50) }

        .ln-btn    { position:relative;overflow:hidden;width:100%;padding:10px;border:none;border-radius:50px;background:linear-gradient(135deg,#C88A00 0%,#E79A00 100%);color:#fff;font-size:14px;font-weight:900;letter-spacing:.08em;text-transform:uppercase;cursor:pointer;box-shadow:0 6px 24px rgba(200,138,0,.45),0 2px 8px rgba(180,100,0,.25);transition:transform .15s,box-shadow .15s;text-shadow:0 1px 2px rgba(0,0,0,.20);font-family:inherit }
        .ln-btn::after { content:'';position:absolute;top:0;left:-100%;height:100%;width:55%;background:linear-gradient(90deg,transparent,rgba(255,255,255,.28),transparent);animation:btnShine 3s ease-in-out infinite .5s }
        .ln-btn:hover:not(:disabled) { transform:translateY(-2px);box-shadow:0 12px 36px rgba(231,154,0,.60),0 4px 16px rgba(180,100,0,.35) }
        .ln-btn:active:not(:disabled) { transform:translateY(0) }
        .ln-btn:disabled { opacity:.40;cursor:not-allowed }
        .ln-btn:disabled::after { display:none }

        .ln-check  { width:15px;height:15px;border:1.5px solid rgba(15,27,45,.22);border-radius:4px;background:rgba(15,27,45,.03);cursor:pointer;appearance:none;-webkit-appearance:none;flex-shrink:0;transition:background .15s;position:relative }
        .ln-check:checked { background:#D4971A;border-color:#D4971A }
        .ln-check:checked::after { content:'';position:absolute;left:3px;top:0px;width:5px;height:9px;border:2px solid #07111F;border-top:none;border-left:none;transform:rotate(45deg) }

        @media(prefers-reduced-motion:reduce) {
          .ln-card,.ln-btn::after,.ln-sg { animation:none!important;opacity:1!important;transform:none!important }
        }
      `}</style>

      {/* Full-page PSX background */}
      <PsxBackground />

      {/* ── Centered auth card ── */}
      <div ref={cardRef} className="ln-card" style={{
        position:"relative", zIndex:10,
        width:"100%", maxWidth:340,
        margin:"0 16px",
        background:"rgba(255,255,255,0.90)",
        backdropFilter:"blur(20px)",
        border:"1px solid rgba(212,151,26,0.18)",
        borderRadius:20,
        boxShadow:"0 16px 50px rgba(15,27,45,0.12), 0 4px 16px rgba(200,138,0,0.09)",
        padding:"16px 22px 14px",
        boxSizing:"border-box",
      }}>

        {/* Logo */}
        <div style={{ display:"flex", justifyContent:"center", marginBottom:12 }}>
          <a href="/data-portal" style={{ textDecoration:"none" }}>
            <img src="/stockifyy-full-logo.png" alt="Stockifyy" style={{ height:32, objectFit:"contain", maxWidth:160 }} />
          </a>
        </div>

        {/* Live badge */}
        <div style={{ display:"flex", justifyContent:"center", marginBottom:12 }}>
          <div style={{
            display:"flex", alignItems:"center", gap:6,
            padding:"3px 12px", borderRadius:999,
            background:"rgba(212,151,26,.07)",
            border:"1px solid rgba(212,151,26,.25)",
          }}>
            <span className="ln-gdot" style={{ display:"inline-block", width:6, height:6, borderRadius:"50%", background:"#22c55e", flexShrink:0 }}/>
            <span style={{ fontSize:8, fontWeight:700, letterSpacing:".16em", textTransform:"uppercase", color:"rgba(184,123,26,.90)" }}>
              Markets Live · PSX
            </span>
          </div>
        </div>

        {/* Heading */}
        <div style={{ textAlign:"center", marginBottom:10 }}>
          <h1 style={{ margin:0, fontSize:19, fontWeight:700, color:"#0F1B2D", letterSpacing:"-.02em" }}>
            Client Login
          </h1>
          <p style={{ margin:"3px 0 0", fontSize:10, color:"rgba(15,27,45,.42)", letterSpacing:".10em", textTransform:"uppercase" }}>
            Stockifyy Data Portal · Secure Access
          </p>
        </div>

        <form onSubmit={submit} noValidate>

          {/* Email */}
          <div style={{ marginBottom:10 }}>
            <label htmlFor="email" style={{ display:"block", fontSize:10, fontWeight:700, letterSpacing:".11em", textTransform:"uppercase", color:"rgba(15,27,45,.50)", marginBottom:4 }}>
              Email Address
            </label>
            <div style={{ position:"relative" }}>
              <svg style={{ position:"absolute", left:13, top:"50%", transform:"translateY(-50%)", pointerEvents:"none" }}
                width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(15,27,45,.35)" strokeWidth="2" strokeLinecap="round">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
              </svg>
              <input id="email" type="email" value={email} onChange={e=>setEmail(e.target.value)}
                required autoComplete="email" autoFocus placeholder="you@example.com"
                className={`ln-inp${error&&!email?" err":""}`} disabled={loading}
                aria-describedby={error?"login-error":undefined}/>
            </div>
          </div>

          {/* Password */}
          <div style={{ marginBottom:10 }}>
            <label htmlFor="password" style={{ display:"block", fontSize:10, fontWeight:700, letterSpacing:".11em", textTransform:"uppercase", color:"rgba(15,27,45,.50)", marginBottom:4 }}>
              Password
            </label>
            <div style={{ position:"relative" }}>
              <svg style={{ position:"absolute", left:13, top:"50%", transform:"translateY(-50%)", pointerEvents:"none" }}
                width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(15,27,45,.35)" strokeWidth="2" strokeLinecap="round">
                <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/>
              </svg>
              <input id="password" type={showPw?"text":"password"} value={password} onChange={e=>setPassword(e.target.value)}
                required autoComplete="current-password" placeholder="Enter your password"
                className="ln-inp" style={{ paddingRight:40 }} disabled={loading}
                aria-describedby={error?"login-error":undefined}/>
              <button type="button" onClick={()=>setShowPw(v=>!v)} aria-label={showPw?"Hide password":"Show password"}
                style={{ position:"absolute", right:13, top:"50%", transform:"translateY(-50%)", background:"none", border:"none", cursor:"pointer", padding:2, opacity:.5, color:"#D4971A" }} tabIndex={-1}>
                {showPw
                  ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                  : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                }
              </button>
            </div>
          </div>

          {/* Remember + Forgot */}
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:12 }}>
            <label style={{ display:"flex", alignItems:"center", gap:7, cursor:"pointer", fontSize:12, color:"rgba(15,27,45,.55)", fontWeight:500, userSelect:"none" }}>
              <input type="checkbox" className="ln-check" checked={rememberMe} onChange={e=>setRememberMe(e.target.checked)} aria-label="Keep me signed in for 30 days"/>
              Remember me
            </label>
            <span style={{ fontSize:11.5, color:"rgba(15,27,45,.35)", cursor:"default" }} title="Coming soon">
              Forgot password? <span style={{ fontSize:9, opacity:.7 }}>(Soon)</span>
            </span>
          </div>

          {/* Error */}
          {error && (
            <div id="login-error" role="alert" aria-live="assertive"
              style={{ display:"flex", alignItems:"flex-start", gap:7, padding:"10px 12px", borderRadius:10, marginBottom:14, background:"rgba(239,68,68,.06)", border:"1px solid rgba(239,68,68,.22)", color:"#B91C1C", fontSize:12.5, lineHeight:1.45 }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{ flexShrink:0, marginTop:2 }}>
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              {error}
            </div>
          )}

          {/* Submit */}
          <button type="submit" disabled={loading} className="ln-btn" aria-busy={loading}>
            {loading
              ? <span style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:7 }}>
                  <svg style={{ animation:"spin 1s linear infinite" }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M21 12a9 9 0 11-18 0"/></svg>
                  Signing in…
                </span>
              : "Sign In to Data Portal →"
            }
          </button>
        </form>

        {/* OR divider */}
        <div style={{ display:"flex", alignItems:"center", gap:8, margin:"10px 0" }}>
          <div style={{ flex:1, height:1, background:"rgba(15,27,45,.10)" }}/>
          <span style={{ fontSize:9.5, fontWeight:600, color:"rgba(15,27,45,.30)", letterSpacing:".12em", textTransform:"uppercase" }}>or</span>
          <div style={{ flex:1, height:1, background:"rgba(15,27,45,.10)" }}/>
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
            width:"100%", padding:"8px 16px", boxSizing:"border-box",
            display:"flex", alignItems:"center", justifyContent:"center", gap:10,
            background:"#fff", border:"1.5px solid rgba(15,27,45,.14)", borderRadius:50,
            cursor: loading || googleLoading ? "not-allowed" : "pointer",
            opacity: loading || googleLoading ? 0.5 : 1,
            fontSize:13.5, fontWeight:600, color:"#3c4043",
            boxShadow:"0 1px 6px rgba(15,27,45,.07)",
            transition:"box-shadow .15s, border-color .15s",
            fontFamily:"inherit",
          }}
          aria-label="Continue with Google"
        >
          <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
          </svg>
          {googleLoading ? "Redirecting…" : "Continue with Google"}
        </button>

        {/* Sign up link */}
        <p style={{ textAlign:"center", margin:"10px 0 0", fontSize:12, color:"rgba(15,27,45,.48)" }}>
          Don&apos;t have an account?{" "}
          <a
            href="/auth/signup"
            style={{ color:"#D4971A", fontWeight:700, textDecoration:"none" }}
            onClick={e => {
              e.preventDefault();
              playPageChime();
              const card = cardRef.current;
              if (card) {
                card.style.animation = "cardOut 0.35s cubic-bezier(0.4,0,1,1) forwards";
                setTimeout(() => { window.location.href = "/auth/signup"; }, 320);
              } else {
                window.location.href = "/auth/signup";
              }
            }}
          >
            Sign Up Free
          </a>
        </p>

        {/* Footer */}
        <div style={{ textAlign:"center", marginTop:10, paddingTop:10, borderTop:"1px solid rgba(212,151,26,.12)" }}>
          <p className="ln-sg" style={{ margin:0, fontSize:9, fontWeight:900, letterSpacing:".17em", textTransform:"uppercase" }}>
            Stockifyy · Pakistan Stock Exchange Intelligence
          </p>
          <p style={{ margin:"3px 0 0", fontSize:8, color:"rgba(15,27,45,.22)", letterSpacing:".10em", textTransform:"uppercase" }}>
            SECP Certified · KSE Equities · Secure Session
          </p>
        </div>
      </div>
    </div>
  );
}
