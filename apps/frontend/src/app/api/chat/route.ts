// Server-only chat route. Takes message history + current AgentState, asks
// Gemini to (a) reply naturally and (b) emit an updated AgentState. Returns
// both. Single round-trip, no streaming.
//
// API key (GEMINI_API_KEY) is read from server env only — never bundled to
// the client. Loaded from apps/frontend/.env.local.

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import type { AgentState } from "@/lib/leads/types";
import { emptyFilter } from "@/lib/leads/state";

export const runtime = "nodejs";

const MessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  text: z.string(),
});

const RequestSchema = z.object({
  messages: z.array(MessageSchema).min(1).max(50),
  currentState: z.unknown().optional(),
  locale: z.enum(["en", "es"]).default("es"),
});

const PROVIDER = (process.env.GEMINI_PROVIDER ?? "aistudio").toLowerCase();
const MODEL = process.env.GEMINI_MODEL ?? "gemini-2.5-flash";

const SYSTEM_PROMPT = `You are CrisisOS, a crisis-management AI assistant powering an emergency operations canvas.

Behavior:
- The user describes emergencies in natural language (any locale).
- You ALWAYS respond with STRICT JSON: { "reply": string, "state": AgentState }.
- "reply": short conversational response (1–3 sentences) acknowledging what you did and inviting follow-up.
- "state": the COMPLETE NEW AgentState after applying the user's intent. Always return the full object — don't return diffs.
- If the user's message is unrelated to crisis ops or unclear, keep the current state untouched and reply asking for clarification.
- If the current state is empty (crisis: null) and the user described a new emergency, fabricate a realistic, internally-consistent operations canvas (4–6 safeZones, 8–12 checklist items, 6–10 resources, 3–5 alerts, 7–10 timeline entries, weather).
- If the user asks to modify something (e.g. "mark item 3 done", "add a hospital", "increase water need to 1000"), apply the change and return the updated full state.
- All free-text content MUST be in the requested locale ("es" = Spanish, "en" = English).
- All ids: short kebab-case strings unique within their list.
- All timestamps ISO 8601 UTC, identical to the provided "now" value.
- Output MUST be raw JSON, no prose, no markdown, no code fences.`;

const STATE_SHAPE = `AgentState shape:
{
  "crisis": null | { "id": str, "type": "earthquake"|"flood"|"fire"|"hurricane"|"tornado"|"tsunami"|"chemical"|"other", "severity": "low"|"moderate"|"high"|"critical", "title": str, "description": str, "location": { "lat": num, "lng": num, "name": str }, "affectedRadius": num, "timestamp": str },
  "safeZones": [{ "id": str, "name": str, "type": "shelter"|"hospital"|"fire_station"|"police"|"assembly_point", "location": { "lat": num, "lng": num }, "capacity"?: num, "status": "open"|"full"|"closed", "distance"?: num, "phone"?: str, "notes"?: str }],
  "checklist": [{ "id": str, "text": str, "checked": bool, "priority": "immediate"|"short-term"|"long-term", "category": str }],
  "resources": [{ "id": str, "name": str, "category": "water"|"food"|"medical"|"shelter"|"communication"|"transport"|"tools", "have": num, "need": num, "unit": str, "critical": bool }],
  "alerts": [{ "id": str, "service": "water"|"electricity"|"gas"|"communications"|"internet"|"transport", "status": "operational"|"degraded"|"outage"|"unknown", "message": str, "updatedAt": str }],
  "timeline": [{ "id": str, "phase": "first_5_min"|"first_hour"|"first_day"|"first_week", "action": str, "completed": bool, "order": num }],
  "weather": null | { "temperature": num, "windSpeed": num, "humidity": num, "description": str, "alerts": [str] },
  "header": { "title": str, "subtitle": str },
  "activeModule": "overview"|"map"|"checklist"|"resources"|"timeline"|"alerts"
}

Output JSON shape: { "reply": str, "state": <full AgentState above> }`;

function hydrateState(raw: unknown): AgentState {
  const r = (raw ?? {}) as Partial<AgentState> & Record<string, unknown>;
  return {
    crisis: (r.crisis as AgentState["crisis"]) ?? null,
    safeZones: Array.isArray(r.safeZones) ? (r.safeZones as AgentState["safeZones"]) : [],
    checklist: Array.isArray(r.checklist) ? (r.checklist as AgentState["checklist"]) : [],
    resources: Array.isArray(r.resources) ? (r.resources as AgentState["resources"]) : [],
    alerts: Array.isArray(r.alerts) ? (r.alerts as AgentState["alerts"]) : [],
    timeline: Array.isArray(r.timeline) ? (r.timeline as AgentState["timeline"]) : [],
    weather: (r.weather as AgentState["weather"]) ?? null,
    filter: emptyFilter,
    highlightedZoneIds: [],
    selectedZoneId: null,
    header: (r.header as AgentState["header"]) ?? { title: "CrisisOS", subtitle: "" },
    activeModule: (r.activeModule as AgentState["activeModule"]) ?? "overview",
  };
}

async function callGemini(systemText: string, userText: string): Promise<unknown> {
  const body = {
    systemInstruction: { role: "system", parts: [{ text: systemText }] },
    contents: [{ role: "user", parts: [{ text: userText }] }],
    generationConfig: {
      responseMimeType: "application/json",
      temperature: 0.7,
    },
  };

  if (PROVIDER === "vertex") {
    const token = process.env.GOOGLE_OAUTH_TOKEN;
    const project = process.env.GOOGLE_CLOUD_PROJECT;
    const location = process.env.GOOGLE_CLOUD_LOCATION ?? "us-central1";
    if (!token || !project) throw new Error("Vertex needs GOOGLE_OAUTH_TOKEN + GOOGLE_CLOUD_PROJECT");
    const url = `https://${location}-aiplatform.googleapis.com/v1/projects/${project}/locations/${location}/publishers/google/models/${MODEL}:generateContent`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`Vertex ${res.status}: ${(await res.text()).slice(0, 500)}`);
    const data = await res.json();
    const text: string | undefined = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error("Vertex returned no text part");
    return JSON.parse(text);
  }

  const key = process.env.GEMINI_API_KEY;
  if (!key || key.startsWith("stub-")) {
    throw new Error("GEMINI_API_KEY missing or stub. Put a real AI Studio key in apps/frontend/.env.local.");
  }
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(MODEL)}:generateContent?key=${encodeURIComponent(key)}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`AI Studio ${res.status}: ${(await res.text()).slice(0, 500)}`);
  const data = await res.json();
  const text: string | undefined = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error("AI Studio returned no text part");
  return JSON.parse(text);
}

function formatHistory(messages: { role: "user" | "assistant"; text: string }[]): string {
  return messages
    .map((m) => `[${m.role.toUpperCase()}] ${m.text}`)
    .join("\n");
}

export async function POST(req: NextRequest) {
  let payload: z.infer<typeof RequestSchema>;
  try {
    payload = RequestSchema.parse(await req.json());
  } catch (err) {
    return NextResponse.json({ error: "Invalid request", detail: (err as Error).message }, { status: 400 });
  }

  const now = new Date().toISOString();
  const userText = [
    `Locale: ${payload.locale}`,
    `Now (use as timestamp): ${now}`,
    ``,
    STATE_SHAPE,
    ``,
    `Current state:`,
    JSON.stringify(payload.currentState ?? null),
    ``,
    `Conversation so far:`,
    formatHistory(payload.messages),
    ``,
    `Respond now with raw JSON { "reply": str, "state": <AgentState> }.`,
  ].join("\n");

  try {
    const raw = (await callGemini(SYSTEM_PROMPT, userText)) as { reply?: string; state?: unknown };
    const state = hydrateState(raw.state);
    const reply = typeof raw.reply === "string" ? raw.reply : "";
    return NextResponse.json({ reply, state });
  } catch (err) {
    console.error("[/api/chat] failed", err);
    return NextResponse.json({ error: "Chat failed", detail: (err as Error).message }, { status: 502 });
  }
}
