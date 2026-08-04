import { useRef, useEffect, KeyboardEvent } from "react";

interface ChatInputProps {
  value: string;
  onChange: (v: string) => void;
  onSend: () => void;
  isLoading: boolean;
  disabled?: boolean;
}

export default function ChatInput({ value, onChange, onSend, isLoading, disabled }: ChatInputProps) {
  const ref = useRef<HTMLTextAreaElement>(null);

  // Auto-grow textarea
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 100) + "px";
  }, [value]);

  function handleKey(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!isLoading && value.trim()) onSend();
    }
  }

  return (
    <div
      className="flex items-end gap-2 px-3 py-2.5 shrink-0"
      style={{ background: "white", borderTop: "1px solid var(--border)" }}
    >
      <textarea
        ref={ref}
        rows={1}
        value={value}
        onChange={e => onChange(e.target.value)}
        onKeyDown={handleKey}
        disabled={disabled || isLoading}
        placeholder="Apna sawal type karein…"
        aria-label="Chat message input"
        className="flex-1 resize-none rounded-xl px-3 py-2 text-[13px] outline-none transition-all"
        style={{
          background: "var(--light-bg)",
          border: "1.5px solid var(--border)",
          color: "var(--text-primary)",
          lineHeight: "1.5",
          maxHeight: 100,
          minHeight: 38,
        }}
        onFocus={e => (e.currentTarget.style.borderColor = "var(--gold)")}
        onBlur={e => (e.currentTarget.style.borderColor = "var(--border)")}
      />

      <button
        onClick={onSend}
        disabled={!value.trim() || isLoading || disabled}
        aria-label="Send message"
        className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 active:scale-95"
        style={{ background: "linear-gradient(135deg,#07111F,#0D2137)", border: "1px solid rgba(212,175,55,0.4)" }}
      >
        {isLoading ? (
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#D4AF37" strokeWidth="2.5" strokeLinecap="round" className="animate-spin">
            <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" strokeOpacity="0.3"/>
            <path d="M21 12a9 9 0 00-9-9"/>
          </svg>
        ) : (
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#D4AF37" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 2L11 13M22 2L15 22l-4-9-9-4 20-7z"/>
          </svg>
        )}
      </button>
    </div>
  );
}
