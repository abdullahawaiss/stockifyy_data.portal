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
          className="relative w-14 h-14 rounded-full flex items-center justify-center transition-transform duration-200 hover:scale-110 active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400"
          style={{
            background: "linear-gradient(135deg,#07111F 0%,#0D2137 60%,#07111F 100%)",
            boxShadow: "0 8px 24px rgba(7,17,31,0.45), 0 0 0 1.5px rgba(212,175,55,0.5)",
          }}
        >
          {/* Icon transitions between sparkle (closed) and X (open) */}
          <span
            className="transition-all duration-200"
            style={{ opacity: isOpen ? 0 : 1, transform: isOpen ? "rotate(90deg) scale(0.5)" : "rotate(0) scale(1)", position: "absolute" }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M12 2L13.5 8.5L20 7L16 12L20 17L13.5 15.5L12 22L10.5 15.5L4 17L8 12L4 7L10.5 8.5L12 2Z" fill="#D4AF37"/>
            </svg>
          </span>
          <span
            className="transition-all duration-200"
            style={{ opacity: isOpen ? 1 : 0, transform: isOpen ? "rotate(0) scale(1)" : "rotate(-90deg) scale(0.5)", position: "absolute" }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#D4AF37" strokeWidth="2.5" strokeLinecap="round">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </span>

          {/* Notification dot */}
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
            width: "min(380px, calc(100vw - 32px))",
            height: "min(540px, calc(100dvh - 120px))",
            display: "flex",
            flexDirection: "column",
            borderRadius: 20,
            overflow: "hidden",
            boxShadow: "0 24px 64px rgba(7,17,31,0.28), 0 0 0 1px rgba(212,175,55,0.18)",
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
