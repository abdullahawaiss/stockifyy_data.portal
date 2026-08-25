"use client";

import { useEffect, useRef, useState } from "react";

const CARDS = [
  { s:"/login/card1.png",  l: 1,  t:  0,  r:-12, w:42, d:7.2, dl:0.00, a:10, z:2, ar:"3/4",  name:"Moiz Shahzad",  role:"Director" },
  { s:"/login/card2.png",  l:37,  t: -2,  r:  9, w:33, d:9.0, dl:1.40, a:14, z:6, ar:"3/4",  name:"Mufeez Azeez",  role:"Chief Executive Officer" },
  { s:"/login/card4.png",  l:64,  t:  3,  r:-17, w:34, d:6.8, dl:0.80, a: 8, z:6, ar:"3/4",  name:"Sohail Farooq", role:"Chairman" },
  { s:"/login/card3.png",  l: 0,  t: 28,  r: 18, w:35, d:8.5, dl:2.10, a:12, z:3, ar:"4/3",  name:"M. Sufiyan",    role:"Director" },
  { s:"/login/card5.png",  l:34,  t: 26,  r: -5, w:30, d:7.5, dl:0.30, a:10, z:2, ar:"4/3",  name:"",             role:"" },
  { s:"/login/card6.png",  l:64,  t: 30,  r: 22, w:36, d:9.5, dl:1.90, a:13, z:3, ar:"3/4",  name:"",             role:"" },
  { s:"/login/card7.png",  l: 5,  t: 56,  r:-20, w:38, d:8.0, dl:0.60, a: 9, z:4, ar:"3/4",  name:"Saad Arshad",  role:"Director" },
  { s:"/login/card8.png",  l:48,  t: 52,  r: 13, w:32, d:7.0, dl:2.80, a:11, z:3, ar:"4/3",  name:"",             role:"" },
  { s:"/login/card9.png",  l:12,  t: 72,  r: 15, w:43, d:8.8, dl:1.10, a:15, z:2, ar:"4/3",  name:"",             role:"" },
  { s:"/login/card10.png", l:57,  t: 68,  r:-15, w:33, d:7.8, dl:2.40, a: 8, z:3, ar:"3/4",  name:"Islamabad Team", role:"" },
];

const ENTRY_DUR  = 0.9;
const ENTRY_BASE = 0.15;

function buildCSS(): string {
  return CARDS.map((c, i) => {
    const ed  = ENTRY_BASE + i * 0.09;
    const fst = ed + ENTRY_DUR + 0.12;
    return `
      @keyframes scIn${i}{
        from{opacity:0;transform:rotate(${c.r}deg) scale(0.88) translateY(40px)}
        to  {opacity:1;transform:rotate(${c.r}deg) scale(1)    translateY(0px)}
      }
      @keyframes scFl${i}{
        0%,100%{transform:rotate(${c.r}deg) translateY(0px)}
        50%    {transform:rotate(${c.r}deg) translateY(-${c.a}px)}
      }
      @media(prefers-reduced-motion:no-preference){
        .sc-${i}{
          animation:
            scIn${i} ${ENTRY_DUR}s cubic-bezier(0.22,1,0.36,1) ${ed}s  forwards,
            scFl${i} ${c.d}s       ease-in-out                 ${fst}s  infinite;
        }
      }
      @media(prefers-reduced-motion:reduce){
        .sc-${i}{opacity:1;transform:rotate(${c.r}deg)}
      }
    `;
  }).join("");
}

export default function CardFanAnimation() {
  const ref = useRef<HTMLDivElement>(null);
  const [activeIdx, setActiveIdx] = useState<number | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const cards = el.querySelectorAll<HTMLElement>("[data-sc]");

    const onVis = () => {
      const state = document.hidden ? "paused" : "running";
      cards.forEach(c => { c.style.animationPlayState = state; });
    };
    document.addEventListener("visibilitychange", onVis);

    const cleanups: (() => void)[] = [];
    cards.forEach((card) => {
      const rot = Number(card.dataset.rot ?? 0);
      const onEnter = () => {
        card.style.transition = "transform 0.32s cubic-bezier(0.22,1,0.36,1), box-shadow 0.32s ease";
        card.style.transform  = `rotate(${rot}deg) scale(1.06) translateY(-8px)`;
        card.style.zIndex     = "99";
        card.style.animationPlayState = "paused";
      };
      const onLeave = () => {
        card.style.transition = "transform 0.42s cubic-bezier(0.22,1,0.36,1), box-shadow 0.42s ease";
        card.style.transform  = `rotate(${rot}deg) scale(1) translateY(0px)`;
        card.style.zIndex     = card.dataset.z ?? "";
        setTimeout(() => {
          card.style.transition = "";
          card.style.transform  = "";
          card.style.animationPlayState = document.hidden ? "paused" : "running";
        }, 450);
      };
      card.addEventListener("mouseenter", onEnter);
      card.addEventListener("mouseleave", onLeave);
      cleanups.push(() => {
        card.removeEventListener("mouseenter", onEnter);
        card.removeEventListener("mouseleave", onLeave);
      });
    });

    return () => {
      document.removeEventListener("visibilitychange", onVis);
      cleanups.forEach(fn => fn());
    };
  }, []);

  return (
    <>
      <style>{`
        .sc-wrap{position:absolute;inset:0;pointer-events:none;overflow:hidden}
        .sc-card{
          position:absolute;
          border-radius:6px;
          overflow:hidden;
          background:#fff;
          box-shadow:0 0 0 5px rgba(255,255,255,0.90),0 10px 36px rgba(0,0,0,0.58),0 2px 8px rgba(0,0,0,0.38);
          opacity:0;
          will-change:transform,opacity;
          transform-origin:center center;
          pointer-events:auto;
          cursor:pointer;
        }
        .sc-card:hover{
          box-shadow:0 0 0 6px rgba(255,255,255,0.98),0 20px 52px rgba(0,0,0,0.70),0 6px 20px rgba(0,0,0,0.45);
        }
        .sc-card img{
          width:100%;height:100%;
          object-fit:cover;object-position:top center;
          display:block;pointer-events:none;user-select:none;-webkit-user-drag:none;
        }
        /* Name overlay — slides up from bottom on click */
        .sc-overlay{
          position:absolute;bottom:0;left:0;right:0;
          background:linear-gradient(to top, rgba(5,10,20,0.92) 0%, rgba(5,10,20,0.60) 70%, transparent 100%);
          padding:28px 12px 12px;
          transform:translateY(100%);
          transition:transform 0.30s cubic-bezier(0.22,1,0.36,1), opacity 0.30s ease;
          opacity:0;
          pointer-events:none;
        }
        .sc-overlay.show{
          transform:translateY(0);
          opacity:1;
        }
        .sc-name{
          display:block;
          color:#fff;
          font-size:13px;
          font-weight:700;
          letter-spacing:0.03em;
          line-height:1.3;
          text-shadow:0 1px 4px rgba(0,0,0,0.6);
        }
        .sc-role{
          display:block;
          color:#D78B02;
          font-size:10px;
          font-weight:600;
          letter-spacing:0.06em;
          text-transform:uppercase;
          margin-top:2px;
          text-shadow:0 1px 4px rgba(0,0,0,0.5);
        }
        ${buildCSS()}
      `}</style>

      <div className="sc-wrap" ref={ref} aria-hidden="true">
        {CARDS.map((c, i) => (
          <div
            key={i}
            data-sc
            data-rot={c.r}
            data-z={c.z}
            className={`sc-card sc-${i}`}
            style={{ left:`${c.l}%`, top:`${c.t}%`, width:`${c.w}%`, aspectRatio:c.ar, zIndex:c.z }}
            onClick={() => setActiveIdx(activeIdx === i ? null : i)}
          >
            <img src={c.s} alt={c.name || ""} draggable={false} />
            {c.name && (
              <div className={`sc-overlay${activeIdx === i ? " show" : ""}`}>
                <span className="sc-name">{c.name}</span>
                {c.role && <span className="sc-role">{c.role}</span>}
              </div>
            )}
          </div>
        ))}
      </div>
    </>
  );
}
