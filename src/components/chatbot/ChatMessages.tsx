import { useEffect, useRef, useState } from "react";
import type { ChatMessage } from "@/types/chat";

/* ── Minimal markdown → React nodes ─────────────────────────────────── */
function renderMarkdown(text: string) {
  const nodes: React.ReactNode[] = [];
  const lines = text.split("\n");
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Heading
    if (/^#{1,3}\s/.test(line)) {
      nodes.push(
        <p key={i} className="font-bold mt-1" style={{ color: "var(--navy)" }}>
          {inlineFormat(line.replace(/^#{1,3}\s/, ""))}
        </p>
      );
      i++; continue;
    }

    // Horizontal rule / disclaimer separator
    if (line.trim() === "---") {
      nodes.push(<hr key={i} className="my-2 border-gray-200" />);
      i++; continue;
    }

    // Unordered list
    if (/^[-*•]\s/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^[-*•]\s/.test(lines[i])) {
        items.push(lines[i].replace(/^[-*•]\s/, ""));
        i++;
      }
      nodes.push(
        <ul key={`ul-${i}`} className="list-disc pl-4 space-y-0.5 my-1">
          {items.map((it, j) => <li key={j}>{inlineFormat(it)}</li>)}
        </ul>
      );
      continue;
    }

    // Ordered list
    if (/^\d+\.\s/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\d+\.\s/.test(lines[i])) {
        items.push(lines[i].replace(/^\d+\.\s/, ""));
        i++;
      }
      nodes.push(
        <ol key={`ol-${i}`} className="list-decimal pl-4 space-y-0.5 my-1">
          {items.map((it, j) => <li key={j}>{inlineFormat(it)}</li>)}
        </ol>
      );
      continue;
    }

    // Empty line → spacer
    if (line.trim() === "") {
      nodes.push(<div key={i} className="h-1" />);
      i++; continue;
    }

    // Paragraph
    nodes.push(<p key={i} className="leading-relaxed">{inlineFormat(line)}</p>);
    i++;
  }

  return nodes;
}

function inlineFormat(text: string): React.ReactNode[] {
  // Split on **bold**, *italic*, `code`, [text](url), *disclaimer*
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`|\[[^\]]+\]\([^)]+\))/g);
  return parts.map((part, i) => {
    if (/^\*\*[^*]+\*\*$/.test(part)) return <strong key={i}>{part.slice(2, -2)}</strong>;
    if (/^\*[^*]+\*$/.test(part))   return <em key={i}>{part.slice(1, -1)}</em>;
    if (/^`[^`]+`$/.test(part))     return <code key={i} className="px-1 rounded text-[11px]" style={{ background: "rgba(7,17,31,0.07)", fontFamily: "monospace" }}>{part.slice(1, -1)}</code>;
    const link = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (link) return <a key={i} href={link[2]} target="_blank" rel="noopener noreferrer" className="underline" style={{ color: "var(--navy)" }}>{link[1]}</a>;
    return part;
  });
}

/* ── Typing indicator ─────────────────────────────────────────────── */
function TypingIndicator() {
  return (
    <div className="flex items-center gap-1 px-3 py-2.5 rounded-2xl rounded-bl-sm w-fit" style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(212,175,55,0.2)" }}>
      {[0, 1, 2].map(i => (
        <span
          key={i}
          className="w-1.5 h-1.5 rounded-full"
          style={{
            background: "var(--text-muted)",
            animation: `chatDot 1.2s ease-in-out ${i * 0.2}s infinite`,
          }}
        />
      ))}
    </div>
  );
}

/* ── Single message bubble ─────────────────────────────────────────── */
function MessageBubble({ msg }: { msg: ChatMessage }) {
  const [copied, setCopied] = useState(false);
  const isUser = msg.role === "user";
  const time = new Date(msg.timestamp).toLocaleTimeString("en-PK", { hour: "2-digit", minute: "2-digit", hour12: true });

  async function copy() {
    await navigator.clipboard.writeText(msg.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className={`flex flex-col gap-0.5 ${isUser ? "items-end" : "items-start"}`}>
      <div
        className={`max-w-[86%] px-3 py-2.5 rounded-2xl text-[13px] leading-relaxed ${
          isUser ? "rounded-br-sm" : "rounded-bl-sm"
        } ${msg.isError ? "border border-red-200" : ""}`}
        style={
          isUser
            ? { background: "var(--navy)", color: "white" }
            : { background: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.88)", border: "1px solid rgba(212,175,55,0.18)" }
        }
      >
        {isUser ? (
          <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>
        ) : (
          <div className="space-y-1 text-[13px]">{renderMarkdown(msg.content)}</div>
        )}
      </div>

      <div className={`flex items-center gap-2 px-1 ${isUser ? "flex-row-reverse" : "flex-row"}`}>
        <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>{time}</span>
        {!isUser && (
          <button
            onClick={copy}
            className="text-[10px] flex items-center gap-0.5 transition-opacity hover:opacity-70"
            style={{ color: "var(--text-muted)" }}
            aria-label="Copy message"
          >
            {copied ? (
              <><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2.5" strokeLinecap="round"><path d="M20 6L9 17l-5-5"/></svg> Copied</>
            ) : (
              <><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg> Copy</>
            )}
          </button>
        )}
      </div>
    </div>
  );
}

/* ── Main export ───────────────────────────────────────────────────── */
export default function ChatMessages({ messages, isLoading }: { messages: ChatMessage[]; isLoading: boolean }) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  return (
    <div
      className="flex-1 overflow-y-auto px-3 py-3 space-y-3"
      style={{ background: "#07111F" }}
      role="log"
      aria-live="polite"
      aria-label="Chat messages"
    >
      {messages.map(msg => <MessageBubble key={msg.id} msg={msg} />)}
      {isLoading && (
        <div className="flex items-start">
          <TypingIndicator />
        </div>
      )}
      <div ref={bottomRef} />
    </div>
  );
}
