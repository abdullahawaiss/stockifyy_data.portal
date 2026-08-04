"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import type { ChatMessage, PageContext } from "@/types/chat";

const STORAGE_KEY = "stockify_chat_history";
const MAX_HISTORY = 40; // keep last 40 messages in localStorage
const MAX_API_HISTORY = 10; // last 10 turns sent to Gemini (cost control)

function genId() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

function loadHistory(): ChatMessage[] {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as ChatMessage[];
    return Array.isArray(parsed) ? parsed.slice(-MAX_HISTORY) : [];
  } catch {
    return [];
  }
}

function saveHistory(msgs: ChatMessage[]) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(msgs.slice(-MAX_HISTORY)));
  } catch { /* storage full — silently ignore */ }
}

export function useStockifyChat(pageContext: PageContext) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const initialized = useRef(false);

  // Hydrate from sessionStorage once on mount
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    const history = loadHistory();
    if (history.length > 0) {
      setMessages(history);
    } else {
      setMessages([{
        id: genId(),
        role: "assistant",
        content: "Assalam-o-Alaikum! Main Stockify AI Assistant hoon. Main aapko financial data, reports, dashboards aur portal use karne mein help kar sakta hoon. Aap kya janna chahte hain?",
        timestamp: Date.now(),
      }]);
    }
  }, []);

  // Persist to sessionStorage whenever messages change
  useEffect(() => {
    if (!initialized.current) return;
    saveHistory(messages);
  }, [messages]);

  const sendMessage = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isLoading) return;

    // Cancel any in-flight request
    abortRef.current?.abort();
    abortRef.current = new AbortController();

    const userMsg: ChatMessage = {
      id: genId(),
      role: "user",
      content: trimmed,
      timestamp: Date.now(),
    };

    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    // Build the conversation history to send (exclude welcome message, last N turns)
    const apiHistory = messages
      .filter(m => !m.isError)
      .slice(-MAX_API_HISTORY)
      .map(m => ({ role: m.role === "user" ? "user" : "model" as const, text: m.content }));

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: abortRef.current.signal,
        body: JSON.stringify({ message: trimmed, history: apiHistory, pageContext }),
      });

      if (!res.ok) {
        const status = res.status;
        throw new Error(
          status === 429
            ? "AI assistant par filhal zyada requests aa rahi hain. Thori dair baad dobara try karein."
            : `HTTP ${status}`
        );
      }

      const data = await res.json();
      if (data.error) throw new Error(data.error);

      setMessages(prev => [...prev, {
        id: genId(),
        role: "assistant",
        content: data.reply,
        timestamp: Date.now(),
      }]);
    } catch (err) {
      if ((err as Error).name === "AbortError") return;

      const isNetworkError = err instanceof TypeError && err.message.includes("fetch");
      setMessages(prev => [...prev, {
        id: genId(),
        role: "assistant",
        content: isNetworkError
          ? "Connection issue detect hua hai. Apna internet check karke retry karein."
          : ((err as Error).message.startsWith("AI assistant") || (err as Error).message.startsWith("Sorry"))
            ? (err as Error).message
            : "Sorry, Stockify AI is waqt response generate nahi kar pa raha. Please dobara try karein.",
        timestamp: Date.now(),
        isError: true,
      }]);
    } finally {
      setIsLoading(false);
    }
  }, [messages, isLoading, pageContext]);

  const clearChat = useCallback(() => {
    abortRef.current?.abort();
    setIsLoading(false);
    const welcome: ChatMessage = {
      id: genId(),
      role: "assistant",
      content: "Assalam-o-Alaikum! Main Stockify AI Assistant hoon. Main aapko financial data, reports, dashboards aur portal use karne mein help kar sakta hoon. Aap kya janna chahte hain?",
      timestamp: Date.now(),
    };
    setMessages([welcome]);
    saveHistory([welcome]);
  }, []);

  return { messages, input, setInput, isLoading, sendMessage, clearChat };
}
