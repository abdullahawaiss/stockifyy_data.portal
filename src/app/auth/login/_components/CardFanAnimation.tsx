"use client";

import { useEffect, useRef } from "react";

// All 10 uploaded images, scattered across the right panel
// l=left%, t=top%, r=rotate°, w=width%, d=floatDuration, dl=floatDelay, a=floatAmplitude, z=zIndex, ar=aspectRatio
const CARDS = [
  // Top row: card1, card2, card4
  { s:"/login/card1.png",  l: 1,  t:  0,  r:-12, w:42, d:7.2, dl:0.00, a:10, z:2, ar:"3/4" },
  { s:"/login/card2.png",  l:37,  t: -2,  r:  9, w:33, d:9.0, dl:1.40, a:14, z:6, ar:"3/4" },
  { s:"/login/card4.png",  l:64,  t:  3,  r:-17, w:34, d:6.8, dl:0.80, a: 8, z:6, ar:"3/4" },
  // Middle row
  { s:"/login/card3.png",  l: 0,  t: 28,  r: 18, w:35, d:8.5, dl:2.10, a:12, z:3, ar:"4/3" },
  { s:"/login/card5.png",  l:34,  t: 26,  r: -5, w:30, d:7.5, dl:0.30, a:10, z:2, ar:"4/3" },
  { s:"/login/card6.png",  l:64,  t: 30,  r: 22, w:36, d:9.5, dl:1.90, a:13, z:3, ar:"3/4" },
  // Bottom row
  { s:"/login/card7.png",  l: 5,  t: 56,  r:-20, w:38, d:8.0, dl:0.60, a: 9, z:4, ar:"3/4" },
  { s:"/login/card8.png",  l:48,  t: 52,  r: 13, w:32, d:7.0, dl:2.80, a:11, z:3, ar:"4/3" },
  { s:"/login/card9.png",  l:12,  t: 72,  r: 15, w:43, d:8.8, dl:1.10, a:15, z:2, ar:"4/3" },
  { s:"/login/card10.png", l:57,  t: 68,  r:-15, w:33, d:7.8, dl:2.40, a: 8, z:3, ar:"3/4" },
];

const ENTRY_DUR = 0.7;
const ENTRY_BASE = 0.08;

function buildCSS(): string {
  return CARDS.map((c, i) => {
    const ed  = ENTRY_BASE + i * 0.09;
    const fst = ed + ENTRY_DUR + 0.12;
    return `
      @keyframes scIn${i}{
        from{opacity:0;transform:rotate(${c.r}deg) scale(0.80) translateY(22px)}
        to  {opacity:1;transform:rotate(${c.r}deg) scale(1)    translateY(0px) }
      }
      @keyframes scFl${i}{
        0%,100%{transform:rotate(${c.r}deg) translateY(0px)}
        50%    {transform:rotate(${c.r}deg) translateY(-${c.a}px)}
      }
      @media(prefers-reduced-motion:no-preference){
        .sc-${i}{
          animation:
            scIn${i} ${ENTRY_DUR}s cubic-bezier(0.34,1.4,0.64,1) ${ed}s  forwards,
            scFl${i} ${c.d}s       ease-in-out                   ${fst}s infinite;
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

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const cards = el.querySelectorAll<HTMLElement>("[data-sc]");
    const onVis = () => {
      const state = document.hidden ? "paused" : "running";
      cards.forEach(c => { c.style.animationPlayState = state; });
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
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
        }
        .sc-card img{
          width:100%;height:100%;
          object-fit:cover;object-position:top center;
          display:block;pointer-events:none;user-select:none;-webkit-user-drag:none;
        }
        ${buildCSS()}
      `}</style>

      <div className="sc-wrap" ref={ref} aria-hidden="true">
        {CARDS.map((c, i) => (
          <div
            key={i}
            data-sc
            className={`sc-card sc-${i}`}
            style={{ left:`${c.l}%`, top:`${c.t}%`, width:`${c.w}%`, aspectRatio:c.ar, zIndex:c.z }}
          >
            <img src={c.s} alt="" draggable={false} />
          </div>
        ))}
      </div>
    </>
  );
}
