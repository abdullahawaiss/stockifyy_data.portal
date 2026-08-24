"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { usePathname } from "next/navigation";
import { useStockifyChat } from "@/hooks/useStockifyChat";
import ChatHeader from "./ChatHeader";
import ChatMessages from "./ChatMessages";
import ChatInput from "./ChatInput";
import SuggestedQuestions from "./SuggestedQuestions";
import type { PageContext } from "@/types/chat";

export default function StockifyChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(false); // controls mount timing for animation
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const pathname = usePathname();
  const windowRef = useRef<HTMLDivElement>(null);

  const pageContext: PageContext = {
    route: pathname,
    pageTitle: typeof document !== "undefined" ? document.title.split("|")[0].trim() : pathname,
  };

  const { messages, input, setInput, isLoading, sendMessage, clearChat } = useStockifyChat(pageContext);

  // Respect prefers-reduced-motion
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  // Animate mount: slight delay so CSS transition fires
  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
    } else {
      const t = setTimeout(() => setIsVisible(false), 280);
      return () => clearTimeout(t);
    }
  }, [isOpen]);

  // Escape key closes chat
  useEffect(() => {
    if (!isOpen) return;
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") setIsOpen(false); }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen]);

  // Focus trap inside open chat window
  useEffect(() => {
    if (!isOpen || !windowRef.current) return;
    const focusable = windowRef.current.querySelectorAll<HTMLElement>(
      'button, textarea, a[href], [tabindex]:not([tabindex="-1"])'
    );
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    function trap(e: KeyboardEvent) {
      if (e.key !== "Tab") return;
      if (e.shiftKey ? document.activeElement === first : document.activeElement === last) {
        e.preventDefault();
        (e.shiftKey ? last : first)?.focus();
      }
    }
    window.addEventListener("keydown", trap);
    return () => window.removeEventListener("keydown", trap);
  }, [isOpen]);

  const handleSend = useCallback(() => {
    sendMessage(input);
  }, [sendMessage, input]);

  const handleSuggestion = useCallback((q: string) => {
    sendMessage(q);
  }, [sendMessage]);

  // Show suggestions only when there's just the welcome message
  const showSuggestions = messages.length <= 1 && !isLoading;

  return (
    <>
      {/* CSS injected once */}
      <style>{`
        @keyframes chatPulse {
          0%,100% { transform: scale(1); opacity: 0.7; }
          50%      { transform: scale(1.55); opacity: 0; }
        }
        @keyframes chatSlideUp {
          from { opacity: 0; transform: translateY(16px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes chatSlideDown {
          from { opacity: 1; transform: translateY(0) scale(1); }
          to   { opacity: 0; transform: translateY(16px) scale(0.97); }
        }
        @keyframes chatDot {
          0%,80%,100% { transform: scale(0.6); opacity: 0.4; }
          40%          { transform: scale(1);   opacity: 1;   }
        }
        @keyframes robotBob {
          0%,100% { transform: translateY(0px); }
          50%      { transform: translateY(-3px); }
        }
        @keyframes robotBlink {
          0%,85%,100% { transform: scaleY(1); }
          92%          { transform: scaleY(0.07); }
        }
        @keyframes eyeLook {
          0%,18%        { transform: translateX(0px); }
          25%,42%       { transform: translateX(1.8px); }
          50%,67%       { transform: translateX(-1.8px); }
          75%,92%       { transform: translateX(0.9px); }
          100%          { transform: translateX(0px); }
        }
        @keyframes pupilLook {
          0%,18%        { transform: translateX(0px); }
          25%,42%       { transform: translateX(1.4px); }
          50%,67%       { transform: translateX(-1.4px); }
          75%,92%       { transform: translateX(0.7px); }
          100%          { transform: translateX(0px); }
        }
        @keyframes antennaGlow {
          0%,100% { opacity: 1; r: 2.5; }
          50%      { opacity: 0.4; r: 2; }
        }
        .robot-bob   { animation: robotBob 2.2s ease-in-out infinite; }
        .robot-eye   { transform-origin: center; animation: robotBlink 4.5s ease-in-out infinite, eyeLook 3.2s ease-in-out infinite; }
        .robot-eye2  { transform-origin: center; animation: robotBlink 4.5s ease-in-out 0.08s infinite, eyeLook 3.2s ease-in-out infinite; }
        .robot-pupil { animation: pupilLook 3.2s ease-in-out infinite; }
        .antenna-dot { animation: antennaGlow 1.4s ease-in-out infinite; }
        .chat-window-enter { animation: chatSlideUp 0.28s cubic-bezier(0.34,1.1,0.64,1) forwards; }
        .chat-window-exit  { animation: chatSlideDown 0.22s ease-in forwards; }
        @media (prefers-reduced-motion: reduce) {
          .chat-window-enter, .chat-window-exit { animation: none; }
        }
      `}</style>

      {/* Floating button */}
      <div
        style={{ position: "fixed", right: 20, bottom: 20, zIndex: 9999 }}
        aria-label="Open Stockify AI Assistant"
      >
        {/* Pulse ring — hidden when open or reduced-motion */}
        {!isOpen && !prefersReducedMotion && (
          <span
            className="absolute inset-0 rounded-full"
            style={{
              background: "rgba(212,175,55,0.35)",
              animation: "chatPulse 2.4s ease-out infinite",
              pointerEvents: "none",
            }}
          />
        )}

        <button
          onClick={() => setIsOpen(o => !o)}
          title={isOpen ? "Close Stockify AI" : "Ask Stockify AI"}
          aria-expanded={isOpen}
          aria-haspopup="dialog"
          className="relative w-[68px] h-[68px] rounded-full flex items-center justify-center transition-transform duration-200 hover:scale-110 active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400"
          style={{
            background: "linear-gradient(145deg,#0D2137 0%,#07111F 100%)",
            boxShadow: "0 8px 24px rgba(7,17,31,0.5), 0 0 0 2px rgba(212,175,55,0.55)",
          }}
        >
          {/* Robot icon — visible when closed */}
          <span
            className="transition-all duration-200"
            style={{ opacity: isOpen ? 0 : 1, transform: isOpen ? "scale(0.4) rotate(15deg)" : "scale(1)", position: "absolute" }}
          >
            <svg
              width="46" height="46" viewBox="0 0 38 38"
              fill="none" xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
              className={!prefersReducedMotion ? "robot-bob" : ""}
            >
              {/* Antenna stem */}
              <line x1="19" y1="4" x2="19" y2="9" stroke="#D4AF37" strokeWidth="1.8" strokeLinecap="round"/>
              {/* Antenna dot */}
              <circle className="antenna-dot" cx="19" cy="2.5" r="2.5" fill="#D4AF37"/>

              {/* Head */}
              <rect x="7" y="9" width="24" height="16" rx="5" fill="#0D2137" stroke="#D4AF37" strokeWidth="1.4"/>

              {/* Left eye socket */}
              <ellipse className="robot-eye" cx="13.5" cy="17" rx="3" ry="3" fill="#D4AF37"/>
              {/* Left pupil — moves with eye */}
              <circle className="robot-pupil" cx="13.5" cy="17" r="1.1" fill="#07111F"/>

              {/* Right eye socket */}
              <ellipse className="robot-eye2" cx="24.5" cy="17" rx="3" ry="3" fill="#D4AF37"/>
              {/* Right pupil — moves with eye */}
              <circle className="robot-pupil" cx="24.5" cy="17" r="1.1" fill="#07111F"/>

              {/* Mouth — happy line */}
              <path d="M14 22 Q19 25.5 24 22" stroke="#D4AF37" strokeWidth="1.5" strokeLinecap="round" fill="none"/>

              {/* Body */}
              <rect x="11" y="25" width="16" height="9" rx="3.5" fill="#0D2137" stroke="#D4AF37" strokeWidth="1.2"/>
              {/* Body panel dots */}
              <circle cx="16" cy="29.5" r="1.2" fill="#D4AF37" opacity="0.7"/>
              <circle cx="19" cy="29.5" r="1.2" fill="#D4AF37" opacity="0.5"/>
              <circle cx="22" cy="29.5" r="1.2" fill="#D4AF37" opacity="0.3"/>
            </svg>
          </span>

          {/* X icon — visible when open */}
          <span
            className="transition-all duration-200"
            style={{ opacity: isOpen ? 1 : 0, transform: isOpen ? "scale(1) rotate(0)" : "scale(0.4) rotate(-15deg)", position: "absolute" }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#D4AF37" strokeWidth="2.5" strokeLinecap="round">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </span>

          {/* Green online dot */}
          {!isOpen && (
            <span
              className="absolute top-0.5 right-0.5 w-3 h-3 rounded-full border-2 border-white"
              style={{ background: "#16A34A" }}
            />
          )}
        </button>
      </div>

      {/* Chat window */}
      {(isOpen || isVisible) && (
        <div
          ref={windowRef}
          role="dialog"
          aria-modal="true"
          aria-label="Stockify AI Assistant"
          className={isOpen ? "chat-window-enter" : "chat-window-exit"}
          style={{
            position: "fixed",
            right: 16,
            bottom: 90,
            zIndex: 9998,
            width: "min(340px, calc(100vw - 28px))",
            height: "min(460px, calc(100dvh - 110px))",
            display: "flex",
            flexDirection: "column",
            borderRadius: 20,
            overflow: "hidden",
            background: "#07111F",
            boxShadow: "0 24px 64px rgba(0,0,0,0.6), 0 0 0 1px rgba(212,175,55,0.22)",
          }}
        >
          <ChatHeader
            onMinimize={() => setIsOpen(false)}
            onClose={() => { setIsOpen(false); }}
            onClear={clearChat}
          />

          <ChatMessages messages={messages} isLoading={isLoading} />

          <SuggestedQuestions
            route={pathname}
            onSelect={handleSuggestion}
            visible={showSuggestions}
          />

          <ChatInput
            value={input}
            onChange={setInput}
            onSend={handleSend}
            isLoading={isLoading}
          />
        </div>
      )}
    </>
  );
}
