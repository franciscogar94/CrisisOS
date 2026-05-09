// Chat transport abstraction. Lets ChatPanel send messages to a Gemini
// route instead of (or alongside) the CopilotKit agent flow.

import type { AgentState } from "./types";

export type ChatRole = "user" | "assistant";

export interface ChatMessage {
  id: string;
  role: ChatRole;
  text: string;
}

export interface ChatTransportInput {
  messages: { role: ChatRole; text: string }[];
  currentState: AgentState | null;
  locale: "en" | "es";
}

export interface ChatTransportResult {
  reply: string;
  state: AgentState;
}

export interface ChatTransport {
  name: string;
  send(input: ChatTransportInput): Promise<ChatTransportResult>;
}

export const geminiTransport: ChatTransport = {
  name: "gemini",
  async send({ messages, currentState, locale }) {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages, currentState, locale }),
    });
    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      throw new Error(`/api/chat ${res.status}: ${detail.slice(0, 300)}`);
    }
    return (await res.json()) as ChatTransportResult;
  },
};
