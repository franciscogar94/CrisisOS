"use client";

import { useEffect, useRef, useState } from "react";
import {
  UseAgentUpdate,
  useAgent,
  useCopilotChatConfiguration,
  useSuggestions,
  useThreads,
} from "@copilotkit/react-core/v2";
import type { AgentState } from "@/lib/leads/types";
import type { ChatMessage, ChatTransport } from "@/lib/leads/chat-transport";

const INITIALS_KEY = "crisisos.userInitials";
const DEFAULT_INITIALS = "YO";

function uid() {
  return `m-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function normalizeInitials(value: string): string {
  return value.replace(/[^A-Za-z0-9]/g, "").slice(0, 2).toUpperCase();
}

export function ChatPanel({
  onBack,
  onCloseMobile,
  transport,
  currentState,
  onApplyState,
  locale = "es",
}: {
  onBack?: () => void;
  onCloseMobile?: () => void;
  transport?: ChatTransport;
  currentState?: AgentState | null;
  onApplyState?: (next: AgentState) => void;
  locale?: "en" | "es";
} = {}) {
  const { agent } = useAgent({
    updates: [UseAgentUpdate.OnMessagesChanged, UseAgentUpdate.OnRunStatusChanged],
  });
  const { suggestions } = useSuggestions();
  const [draft, setDraft] = useState("");
  const [initials, setInitials] = useState(DEFAULT_INITIALS);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const [localMessages, setLocalMessages] = useState<ChatMessage[]>([]);
  const [localRunning, setLocalRunning] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const useLocal = transport !== undefined;

  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = window.localStorage.getItem(INITIALS_KEY);
    const next = normalizeInitials(saved ?? "");
    if (next) setInitials(next);
  }, []);

  function editInitials() {
    if (typeof window === "undefined") return;
    const input = window.prompt("Tus iniciales (máx 2 caracteres):", initials);
    if (input === null) return;
    const next = normalizeInitials(input) || DEFAULT_INITIALS;
    setInitials(next);
    window.localStorage.setItem(INITIALS_KEY, next);
  }

  const messages = (agent?.messages ?? []) as Array<{
    id: string;
    role: "user" | "assistant" | "system" | "tool";
    content?: string | unknown;
    toolCalls?: Array<{ id: string; function?: { name?: string; arguments?: string } }>;
  }>;
  const remoteVisible = messages.filter((m) => m.role === "user" || m.role === "assistant");
  const visible: Array<{
    id: string;
    role: "user" | "assistant";
    content?: string | unknown;
    toolCalls?: Array<{ id: string; function?: { name?: string; arguments?: string } }>;
  }> = useLocal
    ? localMessages.map((m) => ({ id: m.id, role: m.role, content: m.text }))
    : (remoteVisible as Array<{
        id: string;
        role: "user" | "assistant";
        content?: string | unknown;
        toolCalls?: Array<{ id: string; function?: { name?: string; arguments?: string } }>;
      }>);
  const isRunning = useLocal ? localRunning : (agent?.isRunning ?? false);
  const empty = visible.length === 0;

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [visible.length, isRunning]);

  // Auto-title untitled threads from first user message.
  const config = useCopilotChatConfiguration();
  const threadId = config?.threadId;
  const agentId = config?.agentId ?? "default";
  const { threads, renameThread } = useThreads({ agentId });
  const renamedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (useLocal) return;
    if (!threadId || renamedRef.current.has(threadId)) return;
    const thread = threads.find((t) => t.id === threadId);
    if (!thread) return;
    if (thread.name) {
      renamedRef.current.add(threadId);
      return;
    }
    const firstUser = messages.find((m) => m.role === "user");
    if (!firstUser) return;
    const text = asText(firstUser.content).trim();
    if (!text) return;
    const title = text.replace(/\s+/g, " ").slice(0, 60).trim();
    if (!title) return;
    renamedRef.current.add(threadId);
    void renameThread(threadId, title).catch((err) => {
      console.error("[ChatPanel] renameThread failed", err);
      renamedRef.current.delete(threadId);
    });
  }, [useLocal, threadId, threads, messages, renameThread]);

  async function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed) return;
    setDraft("");

    if (useLocal && transport) {
      if (localRunning) return;
      setLocalError(null);
      const userMsg: ChatMessage = { id: uid(), role: "user", text: trimmed };
      const next = [...localMessages, userMsg];
      setLocalMessages(next);
      setLocalRunning(true);
      try {
        const result = await transport.send({
          messages: next.map((m) => ({ role: m.role, text: m.text })),
          currentState: currentState ?? null,
          locale,
        });
        onApplyState?.(result.state);
        setLocalMessages((prev) => [
          ...prev,
          { id: uid(), role: "assistant", text: result.reply || "(sin respuesta)" },
        ]);
      } catch (err) {
        setLocalError((err as Error).message);
      } finally {
        setLocalRunning(false);
      }
      return;
    }

    if (!agent) return;
    agent.addMessage({ id: uid(), role: "user", content: trimmed });
    try {
      const maybeRun = (agent as { runAgent?: (params?: unknown) => Promise<unknown> }).runAgent;
      if (typeof maybeRun === "function") {
        await maybeRun.call(agent);
      }
    } catch (err) {
      console.error("[ChatPanel] runAgent failed", err);
    }
  }

  function resetMessages() {
    if (useLocal) {
      setLocalMessages([]);
      setLocalError(null);
    } else {
      agent?.setMessages([]);
    }
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void send(draft);
    }
  }

  return (
    <aside className="flex h-full w-full min-w-0 flex-1 flex-col border-r border-line bg-bg-2">
      {/* Header */}
      <div className="flex h-12 shrink-0 items-center justify-between border-b border-line px-4 font-mono text-xs">
        <div className="flex items-center gap-2">
          {onCloseMobile ? (
            <button
              type="button"
              onClick={onCloseMobile}
              aria-label="back to canvas"
              className="-ml-2 flex size-8 items-center justify-center text-txt-low transition hover:text-txt-hi md:hidden"
            >
              ‹
            </button>
          ) : null}
          <span className="tracking-[0.24em] text-txt-low">
            // COPILOT{useLocal && transport ? ` · ${transport.name.toUpperCase()}` : ""}
          </span>
        </div>
        <div className="flex items-center gap-3">
          {!empty ? (
            <>
              <button
                type="button"
                onClick={() => {
                  if (isRunning) return;
                  onBack?.();
                }}
                disabled={isRunning || !onBack}
                className="text-txt-low transition hover:text-txt-hi disabled:opacity-40 disabled:hover:text-txt-low"
                title="Open threads"
                aria-label="open threads"
              >
                ☰ THREADS
              </button>
              <button
                type="button"
                onClick={resetMessages}
                className="text-txt-low transition hover:text-txt-hi"
                title="Reset conversation"
              >
                + RESET
              </button>
            </>
          ) : null}
          {isRunning ? (
            <span className="inline-flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400">
              <span className="inline-block size-1.5 animate-pulse rounded-full bg-emerald-500" />
              streaming
            </span>
          ) : (
            <span className="text-txt-low">idle</span>
          )}
        </div>
      </div>

      {/* Messages / suggestions */}
      <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto p-4 text-sm">
        {empty ? (
          <>
            <div className="font-mono text-xs text-txt-low">Suggested prompts</div>
            {suggestions.length === 0 ? (
              <div className="text-xs text-txt-low">—</div>
            ) : (
              suggestions.map((s, i) => (
                <button
                  key={`${s.title}-${i}`}
                  type="button"
                  onClick={() => void send(s.message)}
                  className="group block w-full border border-line p-3 text-left transition hover:border-brand"
                >
                  <div className="text-txt-mid group-hover:text-txt-hi">{s.title}</div>
                  <div className="mt-1 font-mono text-[11px] text-txt-low group-hover:text-brand">
                    ⏎ deploy
                  </div>
                </button>
              ))
            )}
          </>
        ) : (
          visible.map((m) =>
            m.role === "user" ? (
              <UserBubble key={m.id} text={asText(m.content)} initials={initials} onEdit={editInitials} />
            ) : (
              <AssistantBubble key={m.id} text={asText(m.content)} toolCalls={m.toolCalls} />
            ),
          )
        )}
        {isRunning ? <StreamingDot /> : null}
        {useLocal && localError ? (
          <div className="rounded border border-red-500/40 bg-red-500/10 p-2 font-mono text-[11px] text-red-400">
            {localError}
          </div>
        ) : null}
      </div>

      {/* Input */}
      <div
        className="shrink-0 border-t border-line p-3"
        style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
      >
        <div className="flex items-center gap-2 border border-line bg-bg px-3 py-2.5 transition focus-within:border-brand">
          <span className="font-mono text-xs text-txt-low">›</span>
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={onKeyDown}
            rows={1}
            placeholder={empty ? "Describe the emergency…" : "Refine, escalate, or ask…"}
            disabled={isRunning}
            className="max-h-32 flex-1 resize-none bg-transparent text-base text-txt-hi placeholder:text-txt-low focus:outline-none disabled:opacity-60 md:text-sm"
          />
          <button
            type="button"
            onClick={() => void send(draft)}
            disabled={!draft.trim() || isRunning}
            className="rounded-sm border border-line border-b-2 px-1.5 py-0.5 font-mono text-[11px] text-txt-mid disabled:text-txt-low"
            aria-label="send"
          >
            ⏎
          </button>
        </div>
      </div>
    </aside>
  );
}

function UserBubble({
  text,
  initials,
  onEdit,
}: {
  text: string;
  initials: string;
  onEdit: () => void;
}) {
  return (
    <div className="flex gap-3">
      <button
        type="button"
        onClick={onEdit}
        title="Editar iniciales"
        aria-label="editar iniciales"
        className="flex size-7 shrink-0 items-center justify-center border border-line-strong font-mono text-[10px] text-txt-low transition hover:border-brand hover:text-txt-hi"
      >
        {initials}
      </button>
      <div className="flex-1 text-txt-mid">{text}</div>
    </div>
  );
}

function AssistantBubble({
  text,
  toolCalls,
}: {
  text: string;
  toolCalls?: Array<{ id: string; function?: { name?: string; arguments?: string } }>;
}) {
  return (
    <div className="flex gap-3">
      <div className="flex size-7 shrink-0 rotate-45 items-center justify-center border-2 border-brand">
        <div className="size-1.5 bg-brand" />
      </div>
      <div className="flex-1 space-y-2">
        {text ? <div className="text-txt-hi">{text}</div> : null}
        {toolCalls?.map((tc) => {
          const name = tc.function?.name ?? "tool";
          const args = tc.function?.arguments ?? "";
          return (
            <div key={tc.id} className="border-l-2 border-brand pl-3 font-mono text-[11px] text-txt-low">
              <div className="text-brand">tool · {name}</div>
              {args ? <div className="truncate">{args.slice(0, 120)}</div> : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function StreamingDot() {
  return (
    <div className="flex gap-3">
      <div className="flex size-7 shrink-0 rotate-45 items-center justify-center border-2 border-brand">
        <div className="size-1.5 bg-brand" />
      </div>
      <div className="flex-1">
        <span className="inline-flex gap-1 font-mono text-xs text-txt-low">
          <Dot delay="0s" />
          <Dot delay="0.15s" />
          <Dot delay="0.3s" />
        </span>
      </div>
    </div>
  );
}

function Dot({ delay }: { delay: string }) {
  return (
    <span
      className="inline-block size-1.5 animate-pulse rounded-full bg-brand"
      style={{ animationDelay: delay }}
    />
  );
}

function asText(content: unknown): string {
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content
      .map((c) =>
        c && typeof c === "object" && "type" in c && (c as { type: string }).type === "text"
          ? (c as { text: string }).text
          : "",
      )
      .join("");
  }
  return "";
}
