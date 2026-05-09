"use client";

import { useEffect, useState } from "react";
import type { Crisis } from "@/lib/leads/types";
import { useLocale } from "@/lib/i18n/context";
import { LocaleToggle } from "@/components/LocaleToggle";
import { ThemeToggle } from "@/components/ThemeToggle";

interface HeaderProps {
  title: string;
  subtitle: string;
  crisis: Crisis | null;
  weatherTemp?: number | null;
  weatherDesc?: string | null;
  onOpenChat?: () => void;
  onOpenThreads?: () => void;
  mobileView?: "canvas" | "chat";
}

export function Header({
  title,
  subtitle,
  crisis,
  weatherTemp,
  weatherDesc,
  onOpenChat,
  onOpenThreads,
  mobileView = "canvas",
}: HeaderProps) {
  const { t } = useLocale();
  const isCritical = crisis?.severity === "critical";
  const elapsed = useElapsed(crisis?.timestamp);

  return (
    <header className="flex h-12 shrink-0 items-center justify-between gap-2 border-b border-line bg-bg-2 px-3 sm:px-5">
      <div className="flex min-w-0 items-center gap-2 sm:gap-3">
        {onOpenThreads ? (
          <button
            type="button"
            onClick={onOpenThreads}
            aria-label="open threads"
            className="-ml-1 flex size-9 items-center justify-center text-txt-mid transition hover:text-txt-hi md:hidden"
          >
            ☰
          </button>
        ) : null}
        <Diamond pulse={isCritical} />
        <span className="font-mono text-xs tracking-[0.24em] text-txt-hi">CRISISOS</span>
        <span className="hidden sm:inline-flex">
          <StatusBadge crisis={crisis} />
        </span>
        {crisis ? (
          <span className="hidden truncate text-xs text-txt-mid sm:inline">
            {title} — {crisis.location.name ?? `${crisis.location.lat.toFixed(2)}, ${crisis.location.lng.toFixed(2)}`}
          </span>
        ) : (
          <span className="hidden truncate text-xs text-txt-low sm:inline">{subtitle}</span>
        )}
      </div>

      <div className="flex items-center gap-2 font-mono text-[11px] text-txt-mid sm:gap-3">
        {crisis && elapsed ? (
          <span className="hidden text-amber-700 dark:text-amber-400 sm:inline">T+ {elapsed}</span>
        ) : null}
        {crisis && elapsed ? (
          <span className="hidden sm:inline">
            <Pipe />
          </span>
        ) : null}
        {weatherTemp != null ? (
          <>
            <span className="hidden items-center gap-1.5 lg:inline-flex">
              <span className="inline-block size-1.5 rounded-full bg-amber-500" />
              {Math.round(weatherTemp)}°C
              {weatherDesc ? (
                <span className="max-w-[140px] truncate text-txt-low">· {weatherDesc}</span>
              ) : null}
            </span>
            <span className="hidden lg:inline">
              <Pipe />
            </span>
          </>
        ) : (
          <>
            <span className="hidden items-center gap-1.5 sm:inline-flex">
              <span className="inline-block size-1.5 rounded-full bg-emerald-500" />
              {t("header.agent_online") || "AGENT ONLINE"}
            </span>
            <span className="hidden sm:inline">
              <Pipe />
            </span>
          </>
        )}
        <span className="hidden sm:inline-flex">
          <ThemeToggle />
        </span>
        <span className="hidden sm:inline-flex">
          <LocaleToggle />
        </span>
        {onOpenChat ? (
          <button
            type="button"
            onClick={onOpenChat}
            aria-label={mobileView === "chat" ? "show canvas" : "show chat"}
            className="flex size-9 items-center justify-center border border-line text-txt-mid transition hover:border-brand hover:text-txt-hi md:hidden"
          >
            {mobileView === "chat" ? "▢" : "💬"}
          </button>
        ) : null}
      </div>
    </header>
  );
}

function Pipe() {
  return <span className="text-line-strong">|</span>;
}

function Diamond({ pulse }: { pulse: boolean }) {
  return (
    <div
      className={`flex size-5 rotate-45 items-center justify-center border-2 border-brand ${
        pulse ? "pulse-crit" : ""
      }`}
    >
      <div className="size-1.5 bg-brand" />
    </div>
  );
}

function StatusBadge({ crisis }: { crisis: Crisis | null }) {
  if (!crisis) {
    return (
      <span className="inline-flex items-center rounded-sm border border-line-strong px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-txt-mid">
        STANDBY
      </span>
    );
  }
  if (crisis.severity === "critical") {
    return (
      <span className="inline-flex items-center rounded-sm bg-red-500 px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-black">
        CRITICAL · ACTIVE
      </span>
    );
  }
  if (crisis.severity === "high") {
    return (
      <span className="inline-flex items-center rounded-sm bg-amber-500 px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-black">
        HIGH · ACTIVE
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-sm bg-brand px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-black">
      ACTIVE
    </span>
  );
}

function useElapsed(timestamp: string | undefined): string | null {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!timestamp) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [timestamp]);
  if (!timestamp) return null;
  const start = new Date(timestamp).getTime();
  if (Number.isNaN(start)) return null;
  const diff = Math.max(0, now - start);
  const total = Math.floor(diff / 1000);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
}

function pad(n: number) {
  return n.toString().padStart(2, "0");
}
