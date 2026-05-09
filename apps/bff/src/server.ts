import { serve } from "@hono/node-server";
import { Hono } from "hono";
import {
  CopilotKitIntelligence,
  CopilotRuntime,
  createCopilotEndpoint,
} from "@copilotkit/runtime/v2";
import { LangGraphAgent } from "@copilotkit/runtime/langgraph";

// Intelligence wiring is conditional. Enable it (real thread persistence
// backed by Postgres + Redis) by setting `INTELLIGENCE_ENABLED=1`.
//
// When OFF (default): the runtime is headless. Browsers can't connect to
// `ws://localhost:4403` from a remote tunnel (ngrok / Cloud Run), so we
// stream SSE through the BFF's HTTP tunnel and provide our own in-memory
// PATCH/GET/DELETE for /api/copilotkit/threads/* below.
//
// When ON: the runtime delegates thread ops to the Intelligence service
// at INTELLIGENCE_API_URL / INTELLIGENCE_GATEWAY_WS_URL. Use it for fully
// local stacks where the browser can resolve the WS URL directly.
const intelligenceEnabled =
  process.env.INTELLIGENCE_ENABLED === "1" ||
  process.env.INTELLIGENCE_ENABLED === "true";

const intelligence = intelligenceEnabled
  ? new CopilotKitIntelligence({
      apiKey:
        process.env.INTELLIGENCE_API_KEY ??
        "cpk_sPRVSEED_seed0privat0longtoken00",
      apiUrl: process.env.INTELLIGENCE_API_URL ?? "http://localhost:4203",
      wsUrl: process.env.INTELLIGENCE_GATEWAY_WS_URL ?? "ws://localhost:4403",
    })
  : undefined;

const agent = new LangGraphAgent({
  deploymentUrl:
    process.env.LANGGRAPH_DEPLOYMENT_URL ?? "http://localhost:8123",
  graphId: "default",
  langsmithApiKey: process.env.LANGSMITH_API_KEY ?? "",
  // 60 (vs LangGraph default 25) leaves headroom for the deepagents planner
  // loop on multi-step turns like "draft email + queue".
  assistantConfig: {
    recursion_limit: Number(process.env.LANGGRAPH_RECURSION_LIMIT ?? 60),
  },
});

const copilotApp = createCopilotEndpoint({
  basePath: "/api/copilotkit",
  runtime: new CopilotRuntime({
    ...(intelligence && { intelligence }),
    identifyUser: () => ({ id: "default", name: "Hackathon User" }),
    licenseToken: process.env.COPILOTKIT_LICENSE_TOKEN,
    agents: { default: agent },
    openGenerativeUI: true,
    a2ui: { injectA2UITool: false },
    mcpApps: {
      servers: [
        {
          type: "http",
          url: process.env.MCP_SERVER_URL || "http://localhost:3001/mcp",
          serverId: "manufact_local",
        },
      ],
    },
  }),
});

// Parent Hono app — registers our handlers BEFORE delegating to the
// CopilotKit runtime, so we can short-circuit problematic paths.
const app = new Hono();

// When Intelligence IS wired, it owns thread persistence (Postgres-backed).
// When it's NOT wired (default), CopilotRuntime would 422 every thread op,
// so we provide an in-memory fallback that survives while the process lives.
if (!intelligenceEnabled) {
  const threadNames = new Map<string, string>();
  const threadCreatedAt = new Map<string, string>();

  const touchThread = (id: string, name?: string) => {
    if (name !== undefined) threadNames.set(id, name);
    if (!threadCreatedAt.has(id)) {
      threadCreatedAt.set(id, new Date().toISOString());
    }
  };

  const serializeThread = (id: string) => ({
    id,
    name: threadNames.get(id) ?? "",
    agentId: "default",
    createdAt: threadCreatedAt.get(id) ?? new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  // PATCH /api/copilotkit/threads/:id — rename a thread.
  // Body: {"name": "string"} → 200 {id, name, agentId, createdAt, updatedAt}
  app.patch("/api/copilotkit/threads/:id", async (c) => {
    const id = c.req.param("id");
    const body = await c.req.json().catch(() => ({}));
    const name = body?.name;
    if (typeof name !== "string" || !name.trim()) {
      return c.json({ error: "Missing or invalid `name` in body" }, 400);
    }
    touchThread(id, name.trim());
    return c.json(serializeThread(id), 200);
  });

  // DELETE /api/copilotkit/threads/:id — remove from the local store.
  app.delete("/api/copilotkit/threads/:id", (c) => {
    const id = c.req.param("id");
    threadNames.delete(id);
    threadCreatedAt.delete(id);
    return c.json({ id, deleted: true }, 200);
  });

  // GET /api/copilotkit/threads?agentId=default — list threads with rename
  // applied. Filter by agentId when present.
  app.get("/api/copilotkit/threads", (c) => {
    const agentId = c.req.query("agentId");
    if (agentId && agentId !== "default") return c.json({ threads: [] }, 200);
    const threads = Array.from(threadNames.keys()).map(serializeThread);
    return c.json({ threads }, 200);
  });
}

// Some CopilotKit clients probe the runtime base path before hitting
// /agent/:id/run. The v2 runtime registers .all("*") for /api/copilotkit
// and returns 404 internally for the bare path. Intercept here and
// return an empty 200 so the client probe doesn't 404.
app.all("/api/copilotkit", (c) => c.json({}, 200));

// Mount the CopilotKit runtime — receives any path that didn't match above.
app.route("/", copilotApp);

// Rewrite known 5xx error bodies into structured `{ error, hint, command }`
// payloads the UI can render as actionable toasts. Conservative matching —
// we only remap when we can identify the failure from the body, so unknown
// 5xx errors fall through unchanged.
app.use("*", async (c, next) => {
  await next();
  const status = c.res.status;
  if (status < 500 || status > 599) return;
  const cloned = c.res.clone();
  const ctype = cloned.headers.get("content-type") || "";
  if (!ctype.includes("json") && !ctype.includes("text")) return;
  let body: string;
  try {
    body = await cloned.text();
  } catch {
    return;
  }
  const isThreadFkey =
    body.includes("threads_user_id_fkey") ||
    (body.includes("Failed to initialize thread") &&
      body.includes("user_id"));
  if (isThreadFkey) {
    const remapped = {
      error: "Postgres user seed missing",
      hint: "Run `npm run seed` to seed the default user, then retry.",
      command: "npm run seed",
    };
    c.res = new Response(JSON.stringify(remapped), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
    return;
  }

  // AgentThreadLockedError: a prior run errored mid-stream and the LangGraph
  // SDK's per-thread lock didn't release. The thread is unrecoverable; the
  // hint tells the user to start a new conversation.
  const isThreadLocked =
    body.includes("AgentThreadLockedError") ||
    /Thread\s+[0-9a-f-]{36}\s+is locked/i.test(body);
  if (isThreadLocked) {
    const remapped = {
      error: "Thread is locked",
      hint:
        "A previous turn errored mid-stream and didn't release the run " +
        "lock. Start a new conversation (sidebar → +) to continue.",
      command: "new-thread",
    };
    c.res = new Response(JSON.stringify(remapped), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
    return;
  }
});

const port = Number(process.env.PORT) || 4000;

serve({ fetch: app.fetch, port }, () => {
  console.log(`BFF ready at http://localhost:${port}`);
});
