"use client";
import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";

function PasswordStrength({ password }: { password: string }) {
  const len    = password.length;
  const upper  = /[A-Z]/.test(password);
  const lower  = /[a-z]/.test(password);
  const digit  = /[0-9]/.test(password);
  const symbol = /[^A-Za-z0-9]/.test(password);
  const score  = [len >= 8, upper, lower, digit || symbol, len >= 12].filter(Boolean).length;

  if (!password) return null;
  const labels = ["Weak", "Weak", "Fair", "Good", "Strong", "Strong"];
  const colors = ["#ef4444","#ef4444","#f97316","#eab308","#22c55e","#22c55e"];
  const label  = labels[score] ?? "Weak";
  const color  = colors[score] ?? "#ef4444";
  const fill   = score;

  return (
    <div style={{ marginTop:5 }}>
      <div style={{ display:"flex", gap:3, marginBottom:3 }}>
        {[1,2,3,4,5].map(i => (
          <div key={i} style={{
            flex:1, height:3, borderRadius:2,
            background: i <= fill ? color : "rgba(15,27,45,.10)",
            transition:"background .2s",
          }} />
        ))}
      </div>
      <span style={{ fontSize:9.5, fontWeight:600, color, letterSpacing:".06em" }}>{label}</span>
    </div>
  );
}

/* PSX background — same motif as login */
function PsxBackground() {
  const LINE = "M0,320 C80,300 150,260 240,220 C310,188 370,200 450,160 C530,120 600,130 680,90 C760,50 830,60 920,28 C980,10 1040,18 1100,5";
  const LINE2 = "M0,370 C120,355 230,328 360,300 C460,278 560,290 660,260 C760,230 860,242 980,215 C1040,200 1080,204 1100,198";
  const AREA = `${LINE} L1100,400 L0,400 Z`;

  return (
    <svg
      style={{ position:"absolute", inset:0, width:"100%", height:"100%", pointerEvents:"none" }}
      viewBox="0 0 1100 400" preserveAspectRatio="xMidYMid slice" aria-hidden="true"
    >
      <defs>
        <linearGradient id="suBgFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#E79A00" stopOpacity=".08"/>
          <stop offset="100%" stopColor="#E79A00" stopOpacity="0"/>
        </linearGradient>
        <linearGradient id="suLineGrad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#B87B1A" stopOpacity=".20"/>
          <stop offset="100%" stopColor="#E79A00" stopOpacity=".40"/>
        </linearGradient>
      </defs>
      {[80,160,240,320].map(y=>(
        <line key={y} x1="0" y1={y} x2="1100" y2={y}
          stroke="rgba(212,151,26,0.06)" strokeWidth="1" strokeDasharray="8 14"/>
      ))}
      {[0,220,440,660,880].map(x=>(
        <line key={x} x1={x} y1="0" x2={x} y2="400"
          stroke="rgba(212,151,26,0.04)" strokeWidth="1"/>
      ))}
      <path d={AREA} fill="url(#suBgFill)"/>
      <path d={LINE} fill="none" stroke="url(#suLineGrad)" strokeWidth="2.5"
        strokeLinecap="round"
        pathLength="1" strokeDasharray="1" strokeDashoffset="1"
        style={{ animation:"suBgDraw 3s cubic-bezier(.37,0,.63,1) .2s forwards" }}/>
      <path d={LINE2} fill="none" stroke="rgba(212,151,26,0.10)" strokeWidth="1.5" strokeLinecap="round"/>
      <g style={{ animation:"suBgFadeIn .8s ease 1.2s both", opacity:0 }}>
        <rect x="860" y="18" width="88" height="26" rx="6" fill="rgba(255,255,255,0.72)" stroke="rgba(212,151,26,0.18)" strokeWidth="1"/>
        <text x="904" y="28" textAnchor="middle" fontSize="6.5" fontWeight="700" fill="#7A5600" letterSpacing=".08em">KSE-100</text>
        <text x="904" y="38" textAnchor="middle" fontSize="8" fontWeight="800" fill="#0F1B2D">113,842</text>
      </g>
    </svg>
  );
}

export default function SignupClient() {
  const router = useRouter();

  const [fullName,   setFullName]   = useState("");
  const [email,      setEmail]      = useState("");
  const [password,   setPassword]   = useState("");
  const [confirm,    setConfirm]    = useState("");
  const [showPw,     setShowPw]     = useState(false);
  const [showCf,     setShowCf]     = useState(false);
  const [agreed,     setAgreed]     = useState(false);
  const [error,      setError]      = useState("");
  const [fieldErr,   setFieldErr]   = useState<Record<string,string>>({});
  const [loading,    setLoading]    = useState(false);
  const [googleLoad, setGoogleLoad] = useState(false);
  const [success,    setSuccess]    = useState(false);

  const submit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setFieldErr({});

    const errs: Record<string,string> = {};
    if (!fullName.trim() || fullName.trim().length < 2) errs.fullName = "Full name is required (min 2 chars).";
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) errs.email = "A valid email address is required.";
    if (!password || password.length < 8) errs.password = "Password must be at least 8 characters.";
    if (password !== confirm) errs.confirmPassword = "Passwords do not match.";
    if (!agreed) errs.agreed = "You must agree to the terms to create an account.";
    if (Object.keys(errs).length) { setFieldErr(errs); return; }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName: fullName.trim(), email: email.trim(), password, confirmPassword: confirm }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.error === "VALIDATION" && data.field) {
          setFieldErr({ [data.field]: data.message });
        } else if (res.status === 429) {
          setError("Too many signup attempts. Please try again later.");
        } else {
          setError(data.message ?? "Unable to create account. Please try again.");
        }
        return;
      }
      setSuccess(true);
    } catch {
      setError("A network error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [fullName, email, password, confirm, agreed]);

  if (success) {
    return (
      <div style={{
        position:"fixed", inset:0, display:"flex", alignItems:"center", justifyContent:"center",
        background:"linear-gradient(145deg, #FEFAF0 0%, #FBF4E0 55%, #F5EDD0 100%)",
        fontFamily:"system-ui,-apple-system,sans-serif",
      }}>
        <div style={{ maxWidth:400, width:"100%", padding:"0 24px", textAlign:"center" }}>
          <div style={{ width:56, height:56, borderRadius:"50%", background:"rgba(34,197,94,.12)", border:"2px solid rgba(34,197,94,.30)", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 20px" }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
          </div>
          <h1 style={{ margin:"0 0 10px", fontSize:24, fontWeight:900, color:"#0F1B2D", letterSpacing:"-.02em" }}>Check Your Email</h1>
          <p style={{ margin:"0 0 24px", fontSize:13.5, color:"rgba(15,27,45,.55)", lineHeight:1.6 }}>
            We&apos;ve sent a verification link to <strong>{email}</strong>. Click the link to activate your account and sign in.
          </p>
          <a href="/auth/login" style={{
            display:"inline-block", padding:"12px 28px",
            background:"linear-gradient(135deg,#C88A00 0%,#E79A00 100%)",
            color:"#fff", fontWeight:800, fontSize:13.5,
            borderRadius:50, textDecoration:"none",
            letterSpacing:".06em", textTransform:"uppercase",
            boxShadow:"0 6px 24px rgba(200,138,0,.40)",
          }}>
            Go to Sign In →
          </a>
        </div>
      </div>
    );
  }

  const labelStyle: React.CSSProperties = {
    display:"block", fontSize:10, fontWeight:700, letterSpacing:".11em",
    textTransform:"uppercase", color:"rgba(15,27,45,.50)", marginBottom:3,
  };
  const inpBase: React.CSSProperties = {
    width:"100%", padding:"7px 13px 7px 40px", boxSizing:"border-box",
    background:"rgba(15,27,45,.04)", border:"1.5px solid rgba(15,27,45,.13)",
    borderRadius:10, color:"#0F1B2D", fontSize:13.5, outline:"none",
    fontFamily:"inherit", transition:"border-color .2s, box-shadow .2s",
  };
  const errBorder: React.CSSProperties = { borderColor:"rgba(239,68,68,.50)" };

  return (
    <div style={{
      position:"fixed", inset:0,
      background:"linear-gradient(150deg, #FFFFFF 0%, #FDF9F3 50%, #FAF5EC 100%)",
      display:"flex", alignItems:"center", justifyContent:"center",
      fontFamily:"system-ui,-apple-system,sans-serif",
      overflow:"hidden",
    }}>
      <style>{`
        @keyframes suBgDraw   { to{stroke-dashoffset:0} }
        @keyframes suBgFadeIn { to{opacity:1} }
        @keyframes suCardIn   { from{opacity:0;transform:translateY(24px) scale(.97)} to{opacity:1;transform:none} }
        @keyframes spin       { to{transform:rotate(360deg)} }
        @keyframes suBtnShine { 0%{transform:translateX(-130%) skewX(-22deg)} 100%{transform:translateX(230%) skewX(-22deg)} }
        @keyframes sg         { 0%{background-position:-300% center} 100%{background-position:300% center} }

        .su-card  { animation:suCardIn .6s cubic-bezier(.22,1.1,.36,1) .1s both }
        .su-sg    { background:linear-gradient(90deg,#7A5600 0%,#D4971A 22%,#FEA500 50%,#D4971A 78%,#7A5600 100%);background-size:300% auto;-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;animation:sg 2.8s linear infinite }

        .su-inp:focus { background:rgba(212,151,26,.05)!important;border-color:rgba(212,151,26,.60)!important;box-shadow:0 0 0 3px rgba(212,151,26,.12)!important }
        .su-inp.err   { border-color:rgba(239,68,68,.50)!important }

        .su-btn   { position:relative;overflow:hidden;width:100%;padding:10px;border:none;border-radius:50px;background:linear-gradient(135deg,#C88A00 0%,#E79A00 100%);color:#fff;font-size:14px;font-weight:900;letter-spacing:.08em;text-transform:uppercase;cursor:pointer;box-shadow:0 6px 24px rgba(200,138,0,.45);transition:transform .15s,box-shadow .15s;text-shadow:0 1px 2px rgba(0,0,0,.20);font-family:inherit }
        .su-btn::after { content:'';position:absolute;top:0;left:-100%;height:100%;width:55%;background:linear-gradient(90deg,transparent,rgba(255,255,255,.28),transparent);animation:suBtnShine 3s ease-in-out infinite .5s }
        .su-btn:hover:not(:disabled) { transform:translateY(-2px);box-shadow:0 12px 36px rgba(231,154,0,.60) }
        .su-btn:disabled { opacity:.40;cursor:not-allowed }
        .su-btn:disabled::after { display:none }

        .su-check  { width:15px;height:15px;border:1.5px solid rgba(15,27,45,.22);border-radius:4px;background:rgba(15,27,45,.03);cursor:pointer;appearance:none;-webkit-appearance:none;flex-shrink:0;transition:background .15s;position:relative }
        .su-check:checked { background:#D4971A;border-color:#D4971A }
        .su-check:checked::after { content:'';position:absolute;left:3px;top:0px;width:5px;height:9px;border:2px solid #07111F;border-top:none;border-left:none;transform:rotate(45deg) }

        @media(prefers-reduced-motion:reduce) {
          .su-card,.su-btn::after,.su-sg { animation:none!important;opacity:1!important;transform:none!important }
        }
      `}</style>

      {/* PSX background */}
      <PsxBackground />

      {/* ── Centered auth card ── */}
      <div className="su-card" style={{
        position:"relative", zIndex:10,
        width:"100%", maxWidth:420,
        background:"rgba(255,255,255,0.90)",
        backdropFilter:"blur(20px)",
        border:"1px solid rgba(212,151,26,0.18)",
        borderRadius:24,
        boxShadow:"0 20px 60px rgba(15,27,45,0.14), 0 4px 20px rgba(200,138,0,0.10)",
        padding:"14px 32px 12px",
        boxSizing:"border-box",
      }}>

        {/* Logo */}
        <div style={{ display:"flex", justifyContent:"center", marginBottom:8 }}>
          <a href="/data-portal" style={{ textDecoration:"none" }}>
            <img src="/stockifyy-full-logo.png" alt="Stockifyy" style={{ height:30, objectFit:"contain", maxWidth:150 }}/>
          </a>
        </div>

        {/* Heading */}
        <div style={{ textAlign:"center", marginBottom:8 }}>
          <h1 style={{ margin:0, fontSize:20, fontWeight:900, color:"#0F1B2D", letterSpacing:"-.03em" }}>Create Account</h1>
          <p style={{ margin:"2px 0 0", fontSize:10, color:"rgba(15,27,45,.42)", letterSpacing:".10em", textTransform:"uppercase" }}>
            Stockifyy Data Portal · Free Access
          </p>
        </div>

        <form onSubmit={submit} noValidate>

          {/* Full Name */}
          <div style={{ marginBottom:7 }}>
            <label htmlFor="fullName" style={labelStyle}>Full Name</label>
            <div style={{ position:"relative" }}>
              <svg style={{ position:"absolute", left:13, top:"50%", transform:"translateY(-50%)", pointerEvents:"none" }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(15,27,45,.35)" strokeWidth="2" strokeLinecap="round">
                <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>
              </svg>
              <input id="fullName" type="text" value={fullName} onChange={e=>setFullName(e.target.value)}
                required autoComplete="name" autoFocus placeholder="Your full name"
                className={`su-inp${fieldErr.fullName?" err":""}`} style={inpBase} disabled={loading}/>
            </div>
            {fieldErr.fullName && <p style={{ margin:"4px 0 0", fontSize:11, color:"#B91C1C" }}>{fieldErr.fullName}</p>}
          </div>

          {/* Email */}
          <div style={{ marginBottom:7 }}>
            <label htmlFor="email" style={labelStyle}>Email Address</label>
            <div style={{ position:"relative" }}>
              <svg style={{ position:"absolute", left:13, top:"50%", transform:"translateY(-50%)", pointerEvents:"none" }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(15,27,45,.35)" strokeWidth="2" strokeLinecap="round">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
              </svg>
              <input id="email" type="email" value={email} onChange={e=>setEmail(e.target.value)}
                required autoComplete="email" placeholder="you@example.com"
                className={`su-inp${fieldErr.email?" err":""}`} style={inpBase} disabled={loading}/>
            </div>
            {fieldErr.email && <p style={{ margin:"4px 0 0", fontSize:11, color:"#B91C1C" }}>{fieldErr.email}</p>}
          </div>

          {/* Password */}
          <div style={{ marginBottom:7 }}>
            <label htmlFor="password" style={labelStyle}>Password</label>
            <div style={{ position:"relative" }}>
              <svg style={{ position:"absolute", left:13, top:"50%", transform:"translateY(-50%)", pointerEvents:"none" }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(15,27,45,.35)" strokeWidth="2" strokeLinecap="round">
                <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/>
              </svg>
              <input id="password" type={showPw?"text":"password"} value={password} onChange={e=>setPassword(e.target.value)}
                required autoComplete="new-password" placeholder="Min 8 chars, mixed case + number"
                className={`su-inp${fieldErr.password?" err":""}`} style={{ ...inpBase, paddingRight:40 }} disabled={loading}/>
              <button type="button" onClick={()=>setShowPw(v=>!v)} tabIndex={-1}
                style={{ position:"absolute", right:13, top:"50%", transform:"translateY(-50%)", background:"none", border:"none", cursor:"pointer", padding:2, opacity:.5, color:"#D4971A" }}
                aria-label={showPw?"Hide password":"Show password"}>
                {showPw
                  ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                  : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>}
              </button>
            </div>
            <PasswordStrength password={password}/>
            {fieldErr.password && <p style={{ margin:"4px 0 0", fontSize:11, color:"#B91C1C" }}>{fieldErr.password}</p>}
          </div>

          {/* Confirm Password */}
          <div style={{ marginBottom:7 }}>
            <label htmlFor="confirm" style={labelStyle}>Confirm Password</label>
            <div style={{ position:"relative" }}>
              <svg style={{ position:"absolute", left:13, top:"50%", transform:"translateY(-50%)", pointerEvents:"none" }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(15,27,45,.35)" strokeWidth="2" strokeLinecap="round">
                <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/>
              </svg>
              <input id="confirm" type={showCf?"text":"password"} value={confirm} onChange={e=>setConfirm(e.target.value)}
                required autoComplete="new-password" placeholder="Re-enter your password"
                className={`su-inp${fieldErr.confirmPassword?" err":""}`} style={{ ...inpBase, paddingRight:40 }} disabled={loading}/>
              <button type="button" onClick={()=>setShowCf(v=>!v)} tabIndex={-1}
                style={{ position:"absolute", right:13, top:"50%", transform:"translateY(-50%)", background:"none", border:"none", cursor:"pointer", padding:2, opacity:.5, color:"#D4971A" }}
                aria-label={showCf?"Hide confirm":"Show confirm"}>
                {showCf
                  ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                  : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>}
              </button>
            </div>
            {fieldErr.confirmPassword && <p style={{ margin:"4px 0 0", fontSize:11, color:"#B91C1C" }}>{fieldErr.confirmPassword}</p>}
          </div>

          {/* Terms */}
          <div style={{ marginBottom:7 }}>
            <label style={{ display:"flex", alignItems:"flex-start", gap:8, cursor:"pointer", fontSize:12, color:"rgba(15,27,45,.55)", fontWeight:500, userSelect:"none" }}>
              <input type="checkbox" className="su-check" checked={agreed} onChange={e=>setAgreed(e.target.checked)} style={{ marginTop:2 }}/>
              I agree to Stockifyy&apos;s Terms of Service and Privacy Policy.
            </label>
            {fieldErr.agreed && <p style={{ margin:"4px 0 0", fontSize:11, color:"#B91C1C" }}>{fieldErr.agreed}</p>}
          </div>

          {/* Global error */}
          {error && (
            <div role="alert" style={{ display:"flex", alignItems:"flex-start", gap:7, padding:"10px 12px", borderRadius:10, marginBottom:12, background:"rgba(239,68,68,.06)", border:"1px solid rgba(239,68,68,.22)", color:"#B91C1C", fontSize:12.5, lineHeight:1.45 }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{ flexShrink:0, marginTop:2 }}>
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              {error}
            </div>
          )}

          {/* Submit */}
          <button type="submit" disabled={loading || googleLoad} className="su-btn" aria-busy={loading}>
            {loading
              ? <span style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:7 }}>
                  <svg style={{ animation:"spin 1s linear infinite" }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M21 12a9 9 0 11-18 0"/></svg>
                  Creating Account…
                </span>
              : "Create Account →"
            }
          </button>
        </form>

        {/* OR divider */}
        <div style={{ display:"flex", alignItems:"center", gap:8, margin:"8px 0" }}>
          <div style={{ flex:1, height:1, background:"rgba(15,27,45,.10)" }}/>
          <span style={{ fontSize:9.5, fontWeight:600, color:"rgba(15,27,45,.30)", letterSpacing:".12em", textTransform:"uppercase" }}>or</span>
          <div style={{ flex:1, height:1, background:"rgba(15,27,45,.10)" }}/>
        </div>

        {/* Continue with Google */}
        <button
          type="button"
          disabled={loading || googleLoad}
          onClick={() => {
            setGoogleLoad(true);
            window.location.href = "/api/auth/google/start?returnTo=%2Fdata-portal";
          }}
          style={{
            width:"100%", padding:"8px 16px", boxSizing:"border-box",
            display:"flex", alignItems:"center", justifyContent:"center", gap:10,
            background:"#fff", border:"1.5px solid rgba(15,27,45,.14)", borderRadius:50,
            cursor: loading || googleLoad ? "not-allowed" : "pointer",
            opacity: loading || googleLoad ? 0.5 : 1,
            fontSize:13.5, fontWeight:600, color:"#3c4043",
            boxShadow:"0 1px 6px rgba(15,27,45,.07)",
            transition:"box-shadow .15s",
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
          {googleLoad ? "Redirecting…" : "Continue with Google"}
        </button>

        {/* Sign in link */}
        <p style={{ textAlign:"center", margin:"7px 0 0", fontSize:12, color:"rgba(15,27,45,.48)" }}>
          Already have an account?{" "}
          <a href="/auth/login" style={{ color:"#D4971A", fontWeight:800, textDecoration:"none" }}>
            Sign In
          </a>
        </p>

        {/* Footer */}
        <div style={{ textAlign:"center", marginTop:8, paddingTop:8, borderTop:"1px solid rgba(212,151,26,.12)" }}>
          <p className="su-sg" style={{ margin:0, fontSize:9, fontWeight:900, letterSpacing:".17em", textTransform:"uppercase" }}>
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
