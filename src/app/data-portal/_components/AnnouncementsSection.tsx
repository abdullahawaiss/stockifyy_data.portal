"use client";
import React, { useState, useMemo, useEffect } from "react";
import { TYPE_COLORS } from "../_data";
import type { AnnouncementItem } from "@/lib/market-data";

// ── types ──
type Category = "Board Meetings" | "Payouts" | "Insider Transactions" | "Result Announcements" | "Dividend Payout";
type AnnouncementRow = AnnouncementItem;

interface SimpleRow {
  symbol: string; title: string; heldDate: string; postingDate: string; cat: Category;
  detail?: { agenda?: string; venue?: string; eps?: string; dividend?: string; period?: string; shares?: string; type?: string; note?: string };
}

function catOf(type: string): Category {
  const t = type.toLowerCase();
  if (t.includes("board") || t.includes("director") || t.includes("meeting")) return "Board Meetings";
  if (t.includes("dividend") && t.includes("payout")) return "Dividend Payout";
  if (t.includes("dividend")) return "Dividend Payout";
  if (t.includes("result") || t.includes("financial") || t.includes("eps") || t.includes("earning")) return "Result Announcements";
  if (t.includes("insider") || t.includes("director") || t.includes("substantial")) return "Insider Transactions";
  return "Payouts";
}

function toSimpleRow(a: AnnouncementRow): SimpleRow {
  const d = new Date(a.announcementDate);
  const fmt = (dt: Date) => `${String(dt.getDate()).padStart(2,"0")}-${String(dt.getMonth()+1).padStart(2,"0")}-${dt.getFullYear()}`;
  return {
    symbol: a.symbol ?? "—",
    title:  a.title,
    heldDate:    fmt(d),
    postingDate: fmt(d),
    cat: catOf(a.announcementType),
  };
}

function toBoardRow(a: AnnouncementRow) {
  const d = new Date(a.announcementDate);
  const fmt = (dt: Date) => `${String(dt.getDate()).padStart(2,"0")}-${String(dt.getMonth()+1).padStart(2,"0")}-${dt.getFullYear()}`;
  return {
    symbol: a.symbol ?? "—",
    purpose: a.title,
    scheduledDate: fmt(d),
    time: "—",
    periodEnded: "",
  };
}

const CATS: Category[] = ["Board Meetings","Payouts","Insider Transactions","Result Announcements","Dividend Payout"];

// Category icons (SVG paths)
const CAT_ICONS: Record<Category, React.ReactNode> = {
  "Board Meetings": (
    <svg width="13" height="13" viewBox="0 0 20 20" fill="none" style={{display:"inline",marginRight:4,verticalAlign:"middle"}}>
      <rect x="2" y="4" width="16" height="13" rx="2" stroke="currentColor" strokeWidth="1.6"/>
      <path d="M6 2v4M14 2v4M2 9h16" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
    </svg>
  ),
  "Payouts": (
    <svg width="13" height="13" viewBox="0 0 20 20" fill="none" style={{display:"inline",marginRight:4,verticalAlign:"middle"}}>
      <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="1.6"/>
      <path d="M10 6v8M7.5 8.5C7.5 7.4 8.6 7 10 7s2.5.4 2.5 1.5-1 1.5-2.5 1.5-2.5.5-2.5 1.5S8.6 13 10 13s2.5-.4 2.5-1.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
    </svg>
  ),
  "Insider Transactions": (
    <svg width="13" height="13" viewBox="0 0 20 20" fill="none" style={{display:"inline",marginRight:4,verticalAlign:"middle"}}>
      <circle cx="10" cy="7" r="3.5" stroke="currentColor" strokeWidth="1.6"/>
      <path d="M3 17c0-3.3 3.1-6 7-6s7 2.7 7 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
    </svg>
  ),
  "Result Announcements": (
    <svg width="13" height="13" viewBox="0 0 20 20" fill="none" style={{display:"inline",marginRight:4,verticalAlign:"middle"}}>
      <path d="M4 10l4 4 8-8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      <rect x="2" y="2" width="16" height="16" rx="2" stroke="currentColor" strokeWidth="1.6"/>
    </svg>
  ),
  "Dividend Payout": (
    <svg width="13" height="13" viewBox="0 0 20 20" fill="none" style={{display:"inline",marginRight:4,verticalAlign:"middle"}}>
      <path d="M10 3v14M4 7l6-4 6 4M4 13l6 4 6-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
};

// ── helpers ──
function parseDate(ddmmyyyy: string) {
  const [d,m,y] = ddmmyyyy.split("-").map(Number);
  return new Date(y, m-1, d);
}
function todayPKT() {
  return new Date(new Date().toLocaleString("en-US",{timeZone:"Asia/Karachi"}));
}
function getDateLabel(scheduledDate: string) {
  const meetingDay = parseDate(scheduledDate);
  const now = todayPKT();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const diff = Math.round((meetingDay.getTime()-today.getTime())/86400000);
  if (diff===0) return "Today";
  if (diff===1) return "Tomorrow";
  if (diff<0)  return "Past";
  return `${diff}d`;
}
function getCountdown(scheduledDate: string, time: string) {
  if (getDateLabel(scheduledDate)!=="Today") return null;
  const [d,m,y] = scheduledDate.split("-").map(Number);
  const [h,min] = time.split(":").map(Number);
  const meetDt = new Date(y,m-1,d,h,min,0);
  const diff = meetDt.getTime()-Date.now();
  if (diff<=0) return "Now / Live";
  const hh=Math.floor(diff/3600000), mm=Math.floor((diff%3600000)/60000), ss=Math.floor((diff%60000)/1000);
  return `${hh}h ${mm}m ${ss}s`;
}

// ── Avatar ──
function Avatar({ symbol }: { symbol: string }) {
  const colors = ["#07111F","#1E40AF","#065F46","#92400E","#6B21A8","#9F1239","#164E63"];
  const [trySvg, setTrySvg]   = useState(true);
  const [imgFailed, setImgFailed] = useState(false);

  const src = trySvg ? `/logos/${symbol}.svg` : `/logos/${symbol}.png`;

  if (!imgFailed) {
    return (
      <div className="w-8 h-8 rounded-full shrink-0 overflow-hidden border"
        style={{borderColor:"var(--border)",background:"var(--card-bg)"}}>
        <img
          src={src}
          alt={symbol}
          width={32} height={32}
          className="w-full h-full object-cover"
          onError={() => {
            if (trySvg) setTrySvg(false);
            else setImgFailed(true);
          }}
        />
      </div>
    );
  }

  return (
    <div className="w-8 h-8 rounded-full flex items-center justify-center text-[9px] font-black text-white shrink-0"
      style={{background:colors[symbol.charCodeAt(0)%colors.length]}}>
      {symbol.slice(0,2)}
    </div>
  );
}

// ── Detail chip ──
function Chip({label,value,accent}:{label:string;value:string;accent?:boolean}) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[9px] font-bold uppercase tracking-wider" style={{color:"var(--text-muted)"}}>{label}</span>
      <span className="text-[11px] font-semibold" style={{color:accent?"var(--gold)":"var(--text-primary)"}}>{value}</span>
    </div>
  );
}

// ── BOARD MEETINGS tab ──
function BoardMeetingsTab({search, data}:{search:string; data: ReturnType<typeof toBoardRow>[]}) {
  const [mounted, setMounted] = useState(false);
  const [,setTick] = useState(0);
  useEffect(()=>{ setMounted(true); const id=setInterval(()=>setTick(t=>t+1),1000);return()=>clearInterval(id);},[]);
  const [expanded,setExpanded] = useState<number|null>(null);

  const rows = useMemo(()=>data.filter((m)=>
    !search||m.symbol?.toLowerCase().includes(search.toLowerCase())||m.purpose?.toLowerCase().includes(search.toLowerCase())
  ),[search, data]);

  return (
    <table className="w-full text-sm border-collapse">
      <thead>
        <tr style={{background:"var(--light-bg)",borderBottom:"1px solid var(--border)"}}>
          <th className="px-4 py-2.5 text-left text-[10px] font-bold uppercase tracking-wide" style={{color:"var(--text-muted)",width:130}}>Symbol</th>
          <th className="px-4 py-2.5 text-left text-[10px] font-bold uppercase tracking-wide" style={{color:"var(--text-muted)"}}>Purpose</th>
          <th className="px-4 py-2.5 text-center text-[10px] font-bold uppercase tracking-wide" style={{color:"var(--text-muted)",width:80}}>Time</th>
          <th className="px-4 py-2.5 text-right text-[10px] font-bold uppercase tracking-wide" style={{color:"var(--text-muted)",width:100}}>When</th>
          <th style={{width:36}}/>
        </tr>
      </thead>
      <tbody>
        {rows.length===0?(
          <tr><td colSpan={5} className="px-4 py-10 text-center text-sm" style={{color:"var(--text-muted)"}}>No results found</td></tr>
        ):rows.map((m,i)=>{
          const dateLabel=getDateLabel(m.scheduledDate);
          const countdown=mounted?getCountdown(m.scheduledDate,m.time):null;
          const isToday=dateLabel==="Today";
          const isOpen=expanded===i;
          return (
            <React.Fragment key={i}>
              <tr className="border-t cursor-pointer select-none"
                style={{borderColor:"var(--border)",background:isOpen||isToday?"var(--light-bg)":""}}
                onClick={()=>setExpanded(p=>p===i?null:i)}
                onMouseEnter={e=>{if(!isOpen&&!isToday)e.currentTarget.style.background="var(--light-bg)"}}
                onMouseLeave={e=>{if(!isOpen&&!isToday)e.currentTarget.style.background=""}}>
                <td className="px-4 py-2.5">
                  <div className="flex items-center gap-2">
                    <Avatar symbol={m.symbol}/>
                    <span className="font-mono font-semibold text-[11px] px-1.5 py-0.5 rounded" style={{color:"var(--navy)",background:"var(--navy-tint)",letterSpacing:"0.04em"}}>{m.symbol}</span>
                  </div>
                </td>
                <td className="px-4 py-2.5">
                  <div className="text-[12px]" style={{color:"var(--text-primary)"}}>{m.purpose}</div>
                  <div className="text-[10px] mt-0.5" style={{color:"var(--text-muted)"}}>{m.periodEnded}</div>
                </td>
                <td className="px-4 py-2.5 text-center tabular-nums text-[11px]" style={{color:"var(--navy)"}}>{m.time}</td>
                <td className="px-4 py-2.5 text-right">
                  {isToday?(
                    <div>
                      <span className="inline-block px-1.5 py-0.5 rounded text-[9px] font-bold"
                        style={{background:"rgba(212,175,55,0.12)",color:"var(--gold)"}}>Today</span>
                      {countdown&&<div className="text-[8px] mt-0.5 tabular-nums" style={{color:"#16A34A"}}>{countdown}</div>}
                    </div>
                  ):(
                    <span className="text-[10px] font-medium" style={{color:"var(--text-muted)"}}>{dateLabel}</span>
                  )}
                </td>
                <td className="px-3 py-2.5 text-right">
                  <svg className={`inline-block transition-transform duration-200${isOpen?" rotate-180":""}`}
                    width="13" height="13" viewBox="0 0 20 20" fill="none"
                    style={{color:isOpen?"var(--gold)":"var(--text-muted)"}}>
                    <path d="M5 7.5L10 12.5L15 7.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </td>
              </tr>
              {isOpen&&(
                <tr style={{borderColor:"var(--border)"}}>
                  <td colSpan={5} className="px-4 pb-3 pt-0" style={{background:"var(--light-bg)"}}>
                    <div className="rounded-xl p-3 flex flex-wrap gap-x-6 gap-y-2.5 mt-1"
                      style={{background:"var(--card-bg)",border:"1px solid var(--border)",borderTop:"2px solid var(--gold)"}}>
                      <Chip label="Date" value={m.scheduledDate}/>
                      <Chip label="Time" value={m.time}/>
                      <Chip label="Period" value={m.periodEnded}/>
                      <Chip label="Purpose" value={m.purpose}/>
                    </div>
                  </td>
                </tr>
              )}
            </React.Fragment>
          );
        })}
      </tbody>
    </table>
  );
}

// ── RESULT ANNOUNCEMENTS tab ──
function ResultAnnouncementsTab({search, data}:{search:string; data: SimpleRow[]}) {
  const [expanded,setExpanded] = useState<number|null>(null);
  const rows = useMemo(()=>data.filter((r)=>
    !search||r.symbol?.toLowerCase().includes(search.toLowerCase())||r.title?.toLowerCase().includes(search.toLowerCase())
  ).map(r => ({ symbol: r.symbol, period: r.heldDate, eps: null as string|null, payout: null as string|null, announced: r.heldDate }))
  ,[search, data]);

  return (
    <table className="w-full text-sm border-collapse">
      <thead>
        <tr style={{background:"var(--light-bg)",borderBottom:"1px solid var(--border)"}}>
          <th className="px-4 py-2.5 text-left text-[10px] font-bold uppercase tracking-wide" style={{color:"var(--text-muted)",width:130}}>Symbol</th>
          <th className="px-4 py-2.5 text-left text-[10px] font-bold uppercase tracking-wide" style={{color:"var(--text-muted)"}}>Period</th>
          <th className="px-4 py-2.5 text-right text-[10px] font-bold uppercase tracking-wide" style={{color:"var(--text-muted)",width:100}}>EPS</th>
          <th className="px-4 py-2.5 text-right text-[10px] font-bold uppercase tracking-wide" style={{color:"var(--text-muted)",width:110}}>Payout</th>
          <th className="px-4 py-2.5 text-right text-[10px] font-bold uppercase tracking-wide" style={{color:"var(--text-muted)",width:110}}>Announced</th>
          <th style={{width:36}}/>
        </tr>
      </thead>
      <tbody>
        {rows.length===0?(
          <tr><td colSpan={6} className="px-4 py-10 text-center text-sm" style={{color:"var(--text-muted)"}}>No results found</td></tr>
        ):rows.map((r,i)=>{
          const isOpen=expanded===i;
          return (
            <React.Fragment key={i}>
              <tr className="border-t cursor-pointer select-none"
                style={{borderColor:"var(--border)",background:isOpen?"var(--light-bg)":""}}
                onClick={()=>setExpanded(p=>p===i?null:i)}
                onMouseEnter={e=>{if(!isOpen)e.currentTarget.style.background="var(--light-bg)"}}
                onMouseLeave={e=>{if(!isOpen)e.currentTarget.style.background=""}}>
                <td className="px-4 py-2.5">
                  <div className="flex items-center gap-2">
                    <Avatar symbol={r.symbol}/>
                    <span className="font-mono font-semibold text-[11px] px-1.5 py-0.5 rounded" style={{color:"var(--navy)",background:"var(--navy-tint)",letterSpacing:"0.04em"}}>{r.symbol}</span>
                  </div>
                </td>
                <td className="px-4 py-2.5 text-[11px]" style={{color:"var(--text-secondary)"}}>{r.period}</td>
                <td className="px-4 py-2.5 text-right tabular-nums text-[12px] font-bold" style={{color:"var(--gold)"}}>{r.eps??<span style={{color:"var(--text-muted)"}}>—</span>}</td>
                <td className="px-4 py-2.5 text-right text-[11px]" style={{color:"#16A34A"}}>{r.payout||<span style={{color:"var(--text-muted)"}}>—</span>}</td>
                <td className="px-4 py-2.5 text-right tabular-nums text-[11px]" style={{color:"var(--text-muted)"}}>{r.announced}</td>
                <td className="px-3 py-2.5 text-right">
                  <svg className={`inline-block transition-transform duration-200${isOpen?" rotate-180":""}`}
                    width="13" height="13" viewBox="0 0 20 20" fill="none"
                    style={{color:isOpen?"var(--gold)":"var(--text-muted)"}}>
                    <path d="M5 7.5L10 12.5L15 7.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </td>
              </tr>
              {isOpen&&(
                <tr>
                  <td colSpan={6} className="px-4 pb-3 pt-0" style={{background:"var(--light-bg)"}}>
                    <div className="rounded-xl p-3 flex flex-wrap gap-x-6 gap-y-2.5 mt-1"
                      style={{background:"var(--card-bg)",border:"1px solid var(--border)",borderTop:"2px solid var(--gold)"}}>
                      <Chip label="Period" value={r.period}/>
                      {r.eps&&<Chip label="EPS" value={r.eps} accent/>}
                      {r.payout&&<Chip label="Payout" value={r.payout} accent/>}
                      <Chip label="Announced" value={r.announced}/>
                    </div>
                  </td>
                </tr>
              )}
            </React.Fragment>
          );
        })}
      </tbody>
    </table>
  );
}

// Parse DPS amount from title/content text
function parseDps(title: string, content: string | null | undefined): string {
  const text = `${title} ${content ?? ""}`;
  // "Rs. 3.50 per share" / "@ Rs3.5" / "DPS: Rs 2.5" / "2.50 per share"
  const m =
    text.match(/Rs\.?\s*([\d,]+\.?\d*)\s*(?:\/-)?\s*per\s*share/i) ??
    text.match(/@\s*Rs\.?\s*([\d,]+\.?\d*)/i) ??
    text.match(/DPS\s*[:\-=]?\s*Rs\.?\s*([\d,]+\.?\d*)/i) ??
    text.match(/dividend\s*of\s*Rs\.?\s*([\d,]+\.?\d*)/i) ??
    text.match(/(?:interim|final|special)\s*(?:cash\s*)?dividend.*?Rs\.?\s*([\d,]+\.?\d*)/i);
  if (m) return `Rs ${parseFloat(m[1].replace(/,/g, "")).toFixed(2)}`;
  // Percentage dividend
  const p = text.match(/([\d.]+)\s*%\s*(?:cash\s*)?dividend/i);
  if (p) return `${p[1]}%`;
  return "—";
}

// ── DIVIDEND PAYOUT tab ──
function DividendPayoutTab({search, data, raw}:{search:string; data: SimpleRow[]; raw: import("@/lib/market-data").AnnouncementItem[]}) {
  const rows = useMemo(()=>data.filter((d)=>
    !search||d.symbol.toLowerCase().includes(search.toLowerCase())
  ).map(d => {
    const src = raw.find(r => r.symbol === d.symbol && new Date(r.announcementDate).toDateString() === parseDate(d.heldDate).toDateString());
    const amount = src ? parseDps(src.title, src.content) : "—";
    const type = src?.title?.toLowerCase().includes("final") ? "Final"
      : src?.title?.toLowerCase().includes("interim") ? "Interim"
      : src?.title?.toLowerCase().includes("special") ? "Special" : "Dividend";
    return { symbol: d.symbol, type, amount, exDate: d.heldDate, payDate: d.heldDate, yield: "—" };
  }), [search, data, raw]);

  return (
    <table className="w-full text-sm border-collapse">
      <thead>
        <tr style={{background:"var(--light-bg)",borderBottom:"1px solid var(--border)"}}>
          <th className="px-4 py-2.5 text-left text-[10px] font-bold uppercase tracking-wide" style={{color:"var(--text-muted)",width:130}}>Symbol</th>
          <th className="px-4 py-2.5 text-center text-[10px] font-bold uppercase tracking-wide" style={{color:"var(--text-muted)",width:80}}>Type</th>
          <th className="px-4 py-2.5 text-right text-[10px] font-bold uppercase tracking-wide" style={{color:"var(--text-muted)",width:100}}>Amount</th>
          <th className="px-4 py-2.5 text-right text-[10px] font-bold uppercase tracking-wide" style={{color:"var(--text-muted)",width:120}}>Ex-Date</th>
          <th className="px-4 py-2.5 text-right text-[10px] font-bold uppercase tracking-wide" style={{color:"var(--text-muted)",width:120}}>Pay Date</th>
          <th className="px-4 py-2.5 text-right text-[10px] font-bold uppercase tracking-wide" style={{color:"var(--text-muted)",width:80}}>Yield</th>
        </tr>
      </thead>
      <tbody>
        {rows.length===0?(
          <tr><td colSpan={6} className="px-4 py-10 text-center text-sm" style={{color:"var(--text-muted)"}}>No results found</td></tr>
        ):rows.map((d,i)=>(
          <tr key={i} className="border-t"
            style={{borderColor:"var(--border)"}}
            onMouseEnter={e=>e.currentTarget.style.background="var(--light-bg)"}
            onMouseLeave={e=>e.currentTarget.style.background=""}>
            <td className="px-4 py-2.5">
              <div className="flex items-center gap-2">
                <Avatar symbol={d.symbol}/>
                <span className="font-mono font-semibold text-[11px] px-1.5 py-0.5 rounded" style={{color:"var(--navy)",background:"var(--navy-tint)",letterSpacing:"0.04em"}}>{d.symbol}</span>
              </div>
            </td>
            <td className="px-4 py-2.5 text-center">
              <span className="text-[9px] px-1.5 py-0.5 rounded font-semibold"
                style={{
                  background:d.type==="Final"?"rgba(30,64,175,0.08)":"rgba(212,175,55,0.1)",
                  color:d.type==="Final"?"#1E40AF":"var(--gold)",
                }}>{d.type}</span>
            </td>
            <td className="px-4 py-2.5 text-right tabular-nums text-[12px] font-bold" style={{color:"var(--navy)"}}>{d.amount}</td>
            <td className="px-4 py-2.5 text-right tabular-nums text-[11px]" style={{color:"var(--text-secondary)"}}>{d.exDate}</td>
            <td className="px-4 py-2.5 text-right tabular-nums text-[11px]" style={{color:"var(--text-muted)"}}>{d.payDate}</td>
            <td className="px-4 py-2.5 text-right tabular-nums text-[11px] font-semibold" style={{color:"#16A34A"}}>{d.yield}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// ── SIMPLE rows tab (Payouts / Insider Transactions) ──
function SimpleTab({cat,search,data}:{cat:Category;search:string;data:SimpleRow[]}) {
  const [expanded,setExpanded] = useState<number|null>(null);
  const rows = useMemo(()=>data
    .filter(a=>a.cat===cat)
    .filter(a=>!search||a.symbol.toLowerCase().includes(search.toLowerCase())||a.title.toLowerCase().includes(search.toLowerCase()))
  ,[cat,search,data]);

  return (
    <table className="w-full text-sm border-collapse">
      <thead>
        <tr style={{background:"var(--light-bg)",borderBottom:"1px solid var(--border)"}}>
          <th className="px-4 py-2.5 text-left text-[10px] font-bold uppercase tracking-wide" style={{color:"var(--text-muted)",width:130}}>Symbol</th>
          <th className="px-4 py-2.5 text-left text-[10px] font-bold uppercase tracking-wide" style={{color:"var(--text-muted)"}}>Title</th>
          <th className="px-4 py-2.5 text-right text-[10px] font-bold uppercase tracking-wide" style={{color:"var(--text-muted)",width:120}}>Held Date</th>
          <th className="px-4 py-2.5 text-right text-[10px] font-bold uppercase tracking-wide" style={{color:"var(--text-muted)",width:120}}>Posting Date</th>
          <th style={{width:36}}/>
        </tr>
      </thead>
      <tbody>
        {rows.length===0?(
          <tr><td colSpan={5} className="px-4 py-10 text-center text-sm" style={{color:"var(--text-muted)"}}>No results found</td></tr>
        ):rows.map((a,i)=>{
          const isOpen=expanded===i;
          const d=a.detail;
          return (
            <React.Fragment key={i}>
              <tr className="border-t cursor-pointer select-none"
                style={{borderColor:"var(--border)",background:isOpen?"var(--light-bg)":""}}
                onClick={()=>setExpanded(p=>p===i?null:i)}
                onMouseEnter={e=>{if(!isOpen)e.currentTarget.style.background="var(--light-bg)"}}
                onMouseLeave={e=>{if(!isOpen)e.currentTarget.style.background=""}}>
                <td className="px-4 py-2.5"><div className="flex items-center gap-2"><Avatar symbol={a.symbol}/><span className="font-mono font-semibold text-[11px] px-1.5 py-0.5 rounded" style={{color:"var(--navy)",background:"var(--navy-tint)",letterSpacing:"0.04em"}}>{a.symbol}</span></div></td>
                <td className="px-4 py-2.5 text-[12px]" style={{color:"var(--text-primary)"}}>{a.title}</td>
                <td className="px-4 py-2.5 text-right tabular-nums text-[11px]" style={{color:"var(--text-secondary)"}}>{a.heldDate}</td>
                <td className="px-4 py-2.5 text-right tabular-nums text-[11px]" style={{color:"var(--text-muted)"}}>{a.postingDate}</td>
                <td className="px-3 py-2.5 text-right">
                  <svg className={`inline-block transition-transform duration-200${isOpen?" rotate-180":""}`}
                    width="13" height="13" viewBox="0 0 20 20" fill="none"
                    style={{color:isOpen?"var(--gold)":"var(--text-muted)"}}>
                    <path d="M5 7.5L10 12.5L15 7.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </td>
              </tr>
              {isOpen&&d&&(
                <tr>
                  <td colSpan={5} className="px-4 pb-3 pt-0" style={{background:"var(--light-bg)"}}>
                    <div className="rounded-xl p-3 flex flex-wrap gap-x-6 gap-y-2.5 mt-1"
                      style={{background:"var(--card-bg)",border:"1px solid var(--border)",borderTop:"2px solid var(--gold)"}}>
                      {d.period&&<Chip label="Period" value={d.period}/>}
                      {d.dividend&&<Chip label="Dividend" value={d.dividend} accent/>}
                      {d.type&&<Chip label="Type" value={d.type}/>}
                      {d.shares&&<Chip label="Shares" value={d.shares}/>}
                      {d.note&&<div className="w-full pt-2 border-t text-[10px]" style={{borderColor:"var(--border)",color:"var(--text-muted)"}}><b>Note:</b> {d.note}</div>}
                    </div>
                  </td>
                </tr>
              )}
            </React.Fragment>
          );
        })}
      </tbody>
    </table>
  );
}

// ── Main export ──
export default function AnnouncementsSection({ initialData }: { initialData?: AnnouncementRow[] }) {
  const [cat, setCat]       = useState<Category>("Board Meetings");
  const [search, setSearch] = useState("");
  const [allRows, setAllRows] = useState<AnnouncementRow[]>(() => initialData ?? []);
  // loading = true only if we have NO server data at all
  const [loading, setLoading] = useState(initialData === undefined);

  useEffect(() => {
    if (Array.isArray(initialData)) return; // server already sent data (even if empty)
    fetch("/api/portal/announcements?limit=50")
      .then(r => r.json())
      .then(d => setAllRows(d.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [initialData]);

  const simpleRows = useMemo(() => allRows.map(toSimpleRow), [allRows]);
  const boardRows  = useMemo(() => allRows.filter(a => catOf(a.announcementType) === "Board Meetings").map(toBoardRow), [allRows]);
  const counts: Record<Category, number> = useMemo(() => ({
    "Board Meetings":       allRows.filter(a => catOf(a.announcementType) === "Board Meetings").length,
    "Payouts":              allRows.filter(a => catOf(a.announcementType) === "Payouts").length,
    "Insider Transactions": allRows.filter(a => catOf(a.announcementType) === "Insider Transactions").length,
    "Result Announcements": allRows.filter(a => catOf(a.announcementType) === "Result Announcements").length,
    "Dividend Payout":      allRows.filter(a => catOf(a.announcementType) === "Dividend Payout").length,
  }), [allRows]);

  const today = new Date();
  const weekAgo = new Date(today); weekAgo.setDate(today.getDate() - 7);
  const dateRange = `${weekAgo.getDate()} ${weekAgo.toLocaleString("en",{month:"short"})} – ${today.getDate()} ${today.toLocaleString("en",{month:"short"})} ${today.getFullYear()}`;

  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <h2 className="text-base font-black" style={{color:"var(--navy)"}}>PSX Announcements</h2>
        <div className="flex-1 h-px" style={{background:"var(--border)"}}/>
        <span className="text-[10px] font-semibold px-2 py-1 rounded" style={{background:"var(--navy-tint)",color:"var(--text-muted)"}}>
          {dateRange}
        </span>
      </div>

      <div className="card overflow-hidden">
        {/* Tabs + Search */}
        <div className="flex flex-wrap items-center border-b px-1" style={{borderColor:"var(--border)",background:"var(--light-bg)"}}>
          <div className="flex flex-1 flex-wrap">
            {CATS.map(c=>(
              <button key={c}
                onClick={()=>{setCat(c);setSearch("");}}
                className="flex items-center gap-1 px-3 py-3 text-[12px] font-semibold whitespace-nowrap transition-all"
                style={{
                  color:cat===c?"var(--navy)":"var(--text-muted)",
                  background:"transparent",
                  border:"none",
                  borderBottom:cat===c?"2px solid var(--navy)":"2px solid transparent",
                  cursor:"pointer",
                }}>
                {CAT_ICONS[c]}
                {c}
                <span className="ml-1 text-[9px] px-1.5 py-0.5 rounded-full font-bold"
                  style={{background:cat===c?"var(--navy-tint)":"transparent",color:cat===c?"var(--navy)":"var(--text-muted)"}}>
                  {loading ? "…" : counts[c]}
                </span>
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative my-1 mr-2">
            <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" width="12" height="12" viewBox="0 0 20 20" fill="none">
              <circle cx="8.5" cy="8.5" r="5.75" stroke="var(--text-muted)" strokeWidth="1.8"/>
              <path d="M13.5 13.5L17.5 17.5" stroke="var(--text-muted)" strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
            <input type="text" placeholder="Search" value={search} onChange={e=>setSearch(e.target.value)}
              className="pl-8 pr-3 py-1.5 rounded-lg text-xs outline-none w-36"
              style={{background:"var(--card-bg)",border:"1px solid var(--border)",color:"var(--text-primary)"}}/>
          </div>
        </div>

        {/* Loading skeleton */}
        {loading && (
          <div className="px-4 py-8 flex flex-col gap-3">
            {Array.from({length:6}).map((_,i)=>(
              <div key={i} className="flex items-center gap-3 animate-pulse">
                <div className="w-8 h-8 rounded-full shrink-0" style={{background:"var(--light-bg)"}}/>
                <div className="flex-1 h-4 rounded" style={{background:"var(--light-bg)"}}/>
                <div className="w-20 h-4 rounded" style={{background:"var(--light-bg)"}}/>
              </div>
            ))}
          </div>
        )}

        {/* Tab content */}
        {!loading && cat==="Board Meetings"       && <BoardMeetingsTab      search={search} data={boardRows}/>}
        {!loading && cat==="Result Announcements" && <ResultAnnouncementsTab search={search} data={simpleRows.filter(r=>r.cat==="Result Announcements")}/>}
        {!loading && cat==="Dividend Payout"      && <DividendPayoutTab     search={search} data={simpleRows.filter(r=>r.cat==="Dividend Payout")} raw={allRows}/>}
        {!loading && (cat==="Payouts"||cat==="Insider Transactions") && <SimpleTab cat={cat} search={search} data={simpleRows}/>}
      </div>
    </div>
  );
}
