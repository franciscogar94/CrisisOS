# Post para LinkedIn / X — CrisisOS submission

> **Requisito del hackathon:** publicar en LinkedIn o X con tags de los sponsors. El link del post va al formulario de submission.

---

## Versión LinkedIn (recomendada — más espacio, mejor para el jurado)

```
🚨 CrisisOS — un agente que arma planes de respuesta a emergencias en segundos.

Construido en un día para el Generative UI Global Hackathon de @AI Tinkerers Santiago. Track: Agentic Interfaces.

El problema: Chile es uno de los países más sísmicos del mundo. La primera hora después de un terremoto se decide con planes que los equipos de emergencia improvisan. Hoy se hace mirando mapas y llamando por teléfono.

CrisisOS achica ese loop. Describes el evento ("terremoto magnitud 7 en Santiago") y un agente LangGraph corriendo Gemini Flash 3.1 te genera el plan estructurado: severidad, radio de impacto, zonas seguras, acciones inmediatas, asignación de recursos. Cada decisión del agente es una llamada de tool del protocolo AG-UI que muta el estado del canvas en vivo.

Lo más interesante de la implementación:

✅ AG-UI usado a fondo: 16 frontend tools (13 mutadores + 3 render), estado bidireccional agente↔canvas vía STATE_SNAPSHOT.
✅ Runtime gemini-flash-react: 15s end-to-end vs 41s del deep planner del starter.
✅ Tres superficies, un agente: web canvas, chat embebido, y servidor MCP instalable como conector en Claude o ChatGPT.
✅ Stack completo en producción: GCP Cloud Run en southamerica-west1 (Santiago), Cloud SQL, Memorystore, VPC Connector. Cinco servicios, deploy reproducible.

Lo que NO copiamos del starter: el demo de lead-triage de Notion. Reescribimos el agente, el state, los tools y el MCP server alrededor de gestión de crisis. Lo decimos en el README porque honestidad técnica importa.

Demo en vivo:
https://crisisos-frontend-264648594075.southamerica-west1.run.app

Repo:
https://github.com/franciscogar94/CrisisOS

Stack: @CopilotKit · @LangChain · @Google DeepMind (Gemini) · @Manufact (mcp-use) · GCP Cloud Run

#GenerativeUI #AgenticInterfaces #AI #Chile #Hackathon #BenditaIA
```

**Tags obligatorios** (verificar handles antes de publicar):
- AI Tinkerers HQ
- Google DeepMind
- CopilotKit
- Manufact
- Bendita IA / @benditaia

---

## Versión X / Twitter (corta — thread de 3 tweets)

**Tweet 1:**
```
🚨 CrisisOS — agente que arma planes de respuesta a emergencias en segundos.

Construido en 1 día para @AITinkerers Santiago. Track: Agentic Interfaces.

Demo: https://crisisos-frontend-264648594075.southamerica-west1.run.app

Thread 👇
```

**Tweet 2:**
```
Tipeas "terremoto magnitud 7 en Santiago" → LangGraph + Gemini Flash 3.1 generan el plan estructurado: severidad, radio, zonas seguras, acciones inmediatas.

Cada decisión del agente = un tool call AG-UI que muta el canvas en vivo.

16 frontend tools. State bidireccional. Sin polling.
```

**Tweet 3:**
```
Stack completo en GCP Cloud Run (Santiago). 5 servicios live.

Tres superficies, un agente: web canvas + chat embebido + MCP server instalable en Claude/ChatGPT.

Repo: https://github.com/franciscogar94/CrisisOS

@copilotkit · @LangChainAI · @googledeepmind · @manufact_ai
#GenerativeUI #AgenticInterfaces
```

---

## Versión inglés (LinkedIn — para audiencia internacional / jurado global)

```
🚨 CrisisOS — an AI co-pilot that builds emergency response plans in seconds.

Built in one day for the Generative UI Global Hackathon, Santiago chapter. Track: Agentic Interfaces.

The problem: Chile is one of the most seismic countries on Earth. The first hour after a major earthquake is decided by plans emergency teams improvise on the fly — today it's done staring at maps and making phone calls.

CrisisOS shrinks that loop. You describe the event ("magnitude 7 earthquake in Santiago") and a LangGraph agent running Gemini Flash 3.1 generates the structured plan: severity, impact radius, safe zones, immediate actions, resource allocation. Every agent decision is an AG-UI tool call that mutates the canvas state live.

What's interesting under the hood:

✅ AG-UI used with depth: 16 frontend tools (13 mutators + 3 render), bidirectional state via STATE_SNAPSHOT.
✅ gemini-flash-react runtime: 15s end-to-end vs 41s with the starter's deep planner.
✅ Three surfaces, one agent: web canvas, embedded chat, and an MCP server installable as a connector in Claude or ChatGPT.
✅ Full production stack on GCP Cloud Run in southamerica-west1 (Santiago) — five services, reproducible deploy.

What we deliberately did NOT copy from the starter: the Notion lead-triage demo. We rewrote the agent, the canvas state, the tools, and the MCP server around crisis management. We say so in the README because technical honesty matters.

Live demo:
https://crisisos-frontend-264648594075.southamerica-west1.run.app

Repo:
https://github.com/franciscogar94/CrisisOS

Stack: @CopilotKit · @LangChain · @GoogleDeepMind (Gemini) · @Manufact (mcp-use) · GCP Cloud Run

#GenerativeUI #AgenticInterfaces #AI #Chile #Hackathon
```

---

## Checklist antes de publicar

- [ ] Verificar que el handle correcto de cada sponsor esté en el post (LinkedIn y X usan formatos distintos)
- [ ] Adjuntar screenshot o video corto del demo (LinkedIn permite video nativo, mejor que link)
- [ ] Confirmar que el repo es **público** antes de pegar el link
- [ ] Confirmar que la URL de la demo está viva (curl la frontend antes de postear)
- [ ] Pegar el link del post publicado en el formulario de submission del portal AI Tinkerers
