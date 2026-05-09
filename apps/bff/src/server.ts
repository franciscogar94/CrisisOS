import { serve } from "@hono/node-server";
import { Hono } from "hono";
import {
  CopilotRuntime,
  createCopilotEndpoint,
} from "@copilotkit/runtime/v2";
import { LangGraphAgent } from "@copilotkit/runtime/langgraph";

// Intelligence intentionally not wired: forces hand-off to ws://localhost:4403,
// which remote clients (e.g. frontend partner via ngrok) cannot resolve.
// Without it the runtime streams SSE through the same HTTP tunnel that already
// works. Trade-off: no thread persistence (refresh = new conversation).

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
    // intelligence,  // Headless demo — Cloud Run image legacy-services bug. Re-enable when fixed.
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
