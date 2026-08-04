export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number; // ms since epoch — JSON-serialisable for localStorage
  isError?: boolean;
}

export interface PageContext {
  route: string;
  pageTitle: string;
}

export interface ChatRequest {
  message: string;
  history: Array<{ role: "user" | "model"; text: string }>;
  pageContext: PageContext;
}

export interface ChatResponse {
  reply: string;
  error?: string;
}
