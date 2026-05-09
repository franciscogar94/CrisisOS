"use client";

import { useThreads } from "@copilotkit/react-core/v2";
import { useLocale } from "@/lib/i18n/context";
import type { Locale } from "@/lib/i18n/dictionary";

interface ThreadsPanelProps {
  agentId: string;
  threadId: string | undefined;
  onSelect: (threadId: string | undefined) => void;
  onClose: () => void;
}

interface PanelThread {
  id: string;
  name: string | null;
  updatedAt: string;
}

function formatRelative(
  iso: string,
  locale: Locale,
  t: (key: string, params?: Record<string, string | number>) => string,
): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  const diff = Date.now() - date.getTime();
  const sec = Math.round(diff / 1000);
  const min = Math.round(sec / 60);
  const hr = Math.round(min / 60);
  const day = Math.round(hr / 24);
  if (sec < 60) return t("threads.relative.now");
  if (min < 60) return t("threads.relative.minutes", { n: min });
  if (hr < 24) return t("threads.relative.hours", { n: hr });
  if (day < 7) return t("threads.relative.days", { n: day });
  return new Intl.DateTimeFormat(locale === "es" ? "es-ES" : "en-US", {
    month: "short",
    day: "numeric",
  }).format(date);
}

export function ThreadsPanel({ agentId, threadId, onSelect, onClose }: ThreadsPanelProps) {
  const { t, locale } = useLocale();
  const { threads, deleteThread, isLoading, hasMoreThreads, fetchMoreThreads } = useThreads({
    agentId,
    includeArchived: false,
    limit: 20,
  }) as {
    threads: PanelThread[];
    deleteThread: (id: string) => Promise<void> | void;
    isLoading: boolean;
    hasMoreThreads: boolean;
    fetchMoreThreads: () => Promise<void> | void;
  };

  return (
    <aside className="fixed inset-0 z-50 flex w-full flex-col border-r border-line bg-bg-2 md:relative md:inset-auto md:z-auto md:w-[280px] md:shrink-0">
      <div className="flex h-12 shrink-0 items-center justify-between border-b border-line px-4 font-mono text-xs">
        <span className="tracking-[0.24em] text-txt-low">// {t("threads.title")}</span>
        <button
          type="button"
          onClick={onClose}
          aria-label={t("threads.close_aria")}
          className="text-txt-low transition hover:text-txt-hi"
        >
          ×
        </button>
      </div>

      <div className="shrink-0 border-b border-line p-3">
        <button
          type="button"
          onClick={() => {
            onSelect(undefined);
            onClose();
          }}
          className="w-full border border-line px-3 py-2 text-left font-mono text-xs text-txt-mid transition hover:border-brand hover:text-txt-hi"
        >
          {t("threads.new")}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {isLoading && threads.length === 0 ? (
          <div className="px-2 py-4 font-mono text-xs text-txt-low">{t("threads.loading")}</div>
        ) : threads.length === 0 ? (
          <div className="px-2 py-4 font-mono text-xs text-txt-low">{t("threads.empty")}</div>
        ) : (
          <ul className="space-y-1">
            {threads.map((thread) => {
              const active = thread.id === threadId;
              const displayName = thread.name ?? t("threads.untitled");
              return (
                <li key={thread.id} className="group relative">
                  <button
                    type="button"
                    onClick={() => {
                      onSelect(thread.id);
                      onClose();
                    }}
                    className={[
                      "block w-full border px-3 py-2 pr-9 text-left transition",
                      active
                        ? "border-brand bg-bg text-txt-hi"
                        : "border-transparent text-txt-mid hover:border-line hover:text-txt-hi",
                    ].join(" ")}
                  >
                    <div className="truncate text-sm">{displayName}</div>
                    <div className="mt-0.5 font-mono text-[10px] text-txt-low">
                      {formatRelative(thread.updatedAt, locale, t)}
                    </div>
                  </button>
                  <button
                    type="button"
                    aria-label={t("threads.delete_aria")}
                    onClick={async (e) => {
                      e.stopPropagation();
                      if (!window.confirm(t("threads.delete_confirm", { name: displayName }))) return;
                      await deleteThread(thread.id);
                      if (active) onSelect(undefined);
                    }}
                    className="absolute right-2 top-2 hidden size-6 items-center justify-center font-mono text-xs text-txt-low transition hover:text-red-500 group-hover:flex"
                  >
                    ×
                  </button>
                </li>
              );
            })}
          </ul>
        )}

        {hasMoreThreads ? (
          <button
            type="button"
            onClick={() => void fetchMoreThreads()}
            className="mt-2 w-full px-3 py-2 font-mono text-[11px] text-txt-low transition hover:text-txt-hi"
          >
            {t("threads.load_more")}
          </button>
        ) : null}
      </div>
    </aside>
  );
}
