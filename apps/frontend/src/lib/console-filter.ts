"use client";

// Console noise filter — silences known CopilotKit/BFF errors when the
// runtime backend is intentionally absent (DEMO_MODE=gemini).
//
// Patterns are matched against the first stringified arg of console.error /
// console.warn / console.log. Anything not matching falls through unchanged.

const NOISE_PATTERNS: RegExp[] = [
  /\/api\/copilotkit/i,
  /Failed to load runtime info/i,
  /runtime_info_fetch_failed/i,
  /Agent (?:default|[\w-]+) not found/i,
  /\[CopilotKit\]/i,
  /\[BFF [→←]/,
  /Bad Gateway/i,
  /Runtime info request failed/i,
];

function matches(args: unknown[]): boolean {
  for (const a of args) {
    if (a == null) continue;
    let s: string;
    if (typeof a === "string") {
      s = a;
    } else if (a instanceof Error) {
      s = `${a.name}: ${a.message}`;
    } else {
      try {
        s = String(a);
      } catch {
        continue;
      }
    }
    if (!s) continue;
    if (NOISE_PATTERNS.some((p) => p.test(s))) return true;
  }
  return false;
}

export function installConsoleNoiseFilter() {
  if (typeof window === "undefined") return;
  const w = window as unknown as { __consoleFilterInstalled?: boolean };
  if (w.__consoleFilterInstalled) return;
  w.__consoleFilterInstalled = true;

  const wrap = <T extends "log" | "warn" | "error" | "info" | "debug">(level: T) => {
    const orig = console[level].bind(console) as (...args: unknown[]) => void;
    console[level] = ((...args: unknown[]) => {
      if (matches(args)) return;
      orig(...args);
    }) as Console[T];
  };

  wrap("error");
  wrap("warn");
  wrap("log");
  wrap("info");
  wrap("debug");
}
