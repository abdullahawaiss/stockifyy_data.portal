interface ChatHeaderProps {
  onMinimize: () => void;
  onClose: () => void;
  onClear: () => void;
}

export default function ChatHeader({ onMinimize, onClose, onClear }: ChatHeaderProps) {
  return (
    <div
      className="flex items-center justify-between px-4 py-3 rounded-t-2xl shrink-0"
      style={{ background: "linear-gradient(135deg,#07111F 0%,#0D2137 100%)", borderBottom: "1px solid rgba(212,175,55,0.2)" }}
    >
      {/* Left: identity */}
      <div className="flex items-center gap-2.5 min-w-0">
        {/* AI icon */}
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: "linear-gradient(135deg,rgba(212,175,55,0.25),rgba(212,175,55,0.1))", border: "1px solid rgba(212,175,55,0.35)" }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M12 2L13.09 8.26L19 6L15.45 11.09L21 12L15.45 12.91L19 18L13.09 15.74L12 22L10.91 15.74L5 18L8.55 12.91L3 12L8.55 11.09L5 6L10.91 8.26L12 2Z" fill="#D4AF37"/>
          </svg>
        </div>

        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-bold text-white leading-none">Stockify AI</span>
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 shrink-0" style={{ boxShadow: "0 0 5px #4ade80" }} />
          </div>
          <div className="text-[10px] mt-0.5" style={{ color: "rgba(212,175,55,0.7)" }}>
            Powered by Llama 3.3
          </div>
        </div>
      </div>

      {/* Right: actions */}
      <div className="flex items-center gap-1 shrink-0">
        <button
          onClick={onClear}
          title="Clear chat"
          className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors hover:bg-white/10"
          style={{ color: "rgba(255,255,255,0.5)" }}
          aria-label="Clear chat history"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/>
          </svg>
        </button>
        <button
          onClick={onMinimize}
          title="Minimize"
          className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors hover:bg-white/10"
          style={{ color: "rgba(255,255,255,0.5)" }}
          aria-label="Minimize chat"
        >
          <svg width="13" height="3" viewBox="0 0 13 3" fill="currentColor">
            <rect width="13" height="2.5" rx="1.25"/>
          </svg>
        </button>
        <button
          onClick={onClose}
          title="Close"
          className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors hover:bg-red-500/20"
          style={{ color: "rgba(255,255,255,0.5)" }}
          aria-label="Close chat"
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M1 1l10 10M11 1L1 11"/>
          </svg>
        </button>
      </div>
    </div>
  );
}
