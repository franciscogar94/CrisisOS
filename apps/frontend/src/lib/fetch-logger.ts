"use client";

export function installFetchLogger() {
  if (typeof window === "undefined") return;
  const w = window as unknown as { __fetchLoggerInstalled?: boolean };
  if (w.__fetchLoggerInstalled) return;
  w.__fetchLoggerInstalled = true;

  const orig = window.fetch.bind(window);
  window.fetch = async (input, init) => {
    const url =
      typeof input === "string"
        ? input
        : input instanceof URL
          ? input.href
          : input.url;

    if (!url.includes("/api/copilotkit")) return orig(input, init);

    const method = init?.method ?? "GET";
    const reqId = Math.random().toString(36).slice(2, 8);

    console.groupCollapsed(`%c[BFF → ${reqId}] ${method} ${url}`, "color:#06b6d4");
    if (init?.body) {
      const raw = init.body as string;
      try {
        console.log("body:", JSON.parse(raw));
      } catch {
        console.log("body (raw):", raw);
      }
    }
    console.groupEnd();

    const res = await orig(input, init);
    const ctype = res.headers.get("content-type") ?? "";

    if (ctype.includes("event-stream") && res.body) {
      const [a, b] = res.body.tee();
      void (async () => {
        const reader = a.getReader();
        const dec = new TextDecoder();
        let buf = "";
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buf += dec.decode(value, { stream: true });
          let idx: number;
          while ((idx = buf.indexOf("\n\n")) !== -1) {
            const chunk = buf.slice(0, idx);
            buf = buf.slice(idx + 2);
            if (!chunk.trim()) continue;
            const dataLine = chunk
              .split("\n")
              .find((l) => l.startsWith("data:"));
            const data = dataLine ? dataLine.slice(5).trim() : chunk;
            try {
              const parsed = JSON.parse(data);
              console.log(
                `%c[BFF ← ${reqId}] ${parsed.type ?? "event"}`,
                "color:#22c55e",
                parsed,
              );
            } catch {
              console.log(`%c[BFF ← ${reqId}] raw`, "color:#22c55e", chunk);
            }
          }
        }
        if (buf.trim()) console.log(`[BFF ← ${reqId}] tail`, buf);
      })();
      return new Response(b, {
        status: res.status,
        statusText: res.statusText,
        headers: res.headers,
      });
    }

    const clone = res.clone();
    const text = await clone.text();
    try {
      console.log(
        `%c[BFF ← ${reqId}] ${res.status} JSON`,
        "color:#22c55e",
        JSON.parse(text),
      );
    } catch {
      console.log(`%c[BFF ← ${reqId}] ${res.status} text`, "color:#22c55e", text);
    }
    return res;
  };
}
