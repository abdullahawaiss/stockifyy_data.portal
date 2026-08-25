"use client";

import { useEffect, useRef, useState } from "react";

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
  const ref     = useRef<HTMLDivElement>(null);
  const [lightbox, setLightbox] = useState<string | null>(null);

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

  // Close lightbox on Escape
  useEffect(() => {
    if (!lightbox) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setLightbox(null); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightbox]);

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
          cursor:zoom-in;
        }
        .sc-card:hover{
          box-shadow:0 0 0 6px rgba(255,255,255,0.98),0 20px 52px rgba(0,0,0,0.70),0 6px 20px rgba(0,0,0,0.45);
        }
        .sc-card img{
          width:100%;height:100%;
          object-fit:cover;object-position:top center;
          display:block;pointer-events:none;user-select:none;-webkit-user-drag:none;
        }

        /* Lightbox */
        .sc-lb{
          position:fixed;inset:0;z-index:9999;
          display:flex;align-items:center;justify-content:center;
          background:rgba(0,0,0,0.88);
          backdrop-filter:blur(6px);
          animation:lbIn 0.22s ease;
          cursor:zoom-out;
        }
        @keyframes lbIn{from{opacity:0}to{opacity:1}}
        .sc-lb img{
          max-width:88vw;max-height:88vh;
          border-radius:10px;
          box-shadow:0 0 0 6px rgba(255,255,255,0.12),0 32px 80px rgba(0,0,0,0.80);
          object-fit:contain;
          animation:lbImgIn 0.28s cubic-bezier(0.22,1,0.36,1);
          pointer-events:none;
        }
        @keyframes lbImgIn{from{transform:scale(0.88);opacity:0}to{transform:scale(1);opacity:1}}
        .sc-lb-close{
          position:absolute;top:20px;right:24px;
          background:rgba(255,255,255,0.12);border:none;border-radius:50%;
          width:38px;height:38px;font-size:18px;color:#fff;cursor:pointer;
          display:flex;align-items:center;justify-content:center;
          transition:background 0.2s;
        }
        .sc-lb-close:hover{background:rgba(255,255,255,0.22)}

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
            onClick={() => setLightbox(c.s)}
          >
            <img src={c.s} alt="" draggable={false} />
          </div>
        ))}
      </div>

      {lightbox && (
        <div className="sc-lb" onClick={() => setLightbox(null)}>
          <button className="sc-lb-close" onClick={() => setLightbox(null)}>✕</button>
          <img src={lightbox} alt="" />
        </div>
      )}
    </>
  );
}
