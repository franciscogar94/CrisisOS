"use client";

import { useEffect, useRef, useState } from "react";
import {
  UseAgentUpdate,
  useAgent,
  useSuggestions,
} from "@copilotkit/react-core/v2";

function uid() {
  return `m-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function ChatPanel() {
  const { agent } = useAgent({
    updates: [UseAgentUpdate.OnMessagesChanged, UseAgentUpdate.OnRunStatusChanged],
  });
  const { suggestions } = useSuggestions();
  const [draft, setDraft] = useState("");
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const messages = (agent?.messages ?? []) as Array<{
    id: string;
    role: "user" | "assistant" | "system" | "tool";
    content?: string | unknown;
    toolCalls?: Array<{ id: string; function?: { name?: string; arguments?: string } }>;
  }>;
  const isRunning = agent?.isRunning ?? false;
  const visible = messages.filter((m) => m.role === "user" || m.role === "assistant");
  const empty = visible.length === 0;

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [visible.length, isRunning]);

  async function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || !agent) return;
    setDraft("");
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

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void send(draft);
    }
  }

  return (
    <aside className="flex w-[380px] shrink-0 flex-col border-r border-line bg-bg-2">
      {/* Header */}
      <div className="flex h-12 shrink-0 items-center justify-between border-b border-line px-4 font-mono text-xs">
        <span className="tracking-[0.24em] text-txt-low">// COPILOT</span>
        <div className="flex items-center gap-3">
          {!empty ? (
            <button
              type="button"
              onClick={() => agent?.setMessages([])}
              className="text-txt-low transition hover:text-txt-hi"
              title="Start a new conversation"
            >
              + NUEVO
            </button>
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
              <UserBubble key={m.id} text={asText(m.content)} />
            ) : (
              <AssistantBubble key={m.id} text={asText(m.content)} toolCalls={m.toolCalls} />
            ),
          )
        )}
        {isRunning ? <StreamingDot /> : null}
      </div>

      {/* Input */}
      <div className="shrink-0 border-t border-line p-3">
        <div className="flex items-center gap-2 border border-line bg-bg px-3 py-2.5 transition focus-within:border-brand">
          <span className="font-mono text-xs text-txt-low">›</span>
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={onKeyDown}
            rows={1}
            placeholder={empty ? "Describe the emergency…" : "Refine, escalate, or ask…"}
            className="max-h-32 flex-1 resize-none bg-transparent text-sm text-txt-hi placeholder:text-txt-low focus:outline-none"
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

function UserBubble({ text }: { text: string }) {
  return (
    <div className="flex gap-3">
      <div className="flex size-7 shrink-0 items-center justify-center border border-line-strong font-mono text-[10px] text-txt-low">
        FG
      </div>
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
