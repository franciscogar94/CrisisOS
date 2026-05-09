# Video demo script — CrisisOS (2-3 min, sin slides)

> **Reglas del hackathon que NO podemos romper:**
> - Working code en pantalla todo el tiempo. **Cero slides, cero mockups.**
> - Si decimos "esto es solo un mockup" → descalificación.
> - Duración máxima: **3 minutos**. Apuntar a 2:30 para tener margen.
> - Mostrar el track elegido: **Agentic Interfaces**.

---

## Estructura (target: 2:30)

| Tramo | Duración | Pantalla | Voz |
| --- | --- | --- | --- |
| 1. Hook | 0:00–0:20 | Frontend en producción ya cargado | Problema real |
| 2. Demo principal | 0:20–1:30 | Chat sidebar → canvas se actualiza live | El agente "actuando" |
| 3. Iteración conversacional | 1:30–2:00 | Segundo prompt edita el plan | Bidireccionalidad |
| 4. MCP en Claude/ChatGPT | 2:00–2:20 | Misma cosa desde Claude | Tres surfaces, mismo agente |
| 5. Cierre técnico | 2:20–2:30 | README en pantalla | Stack y decisiones |

---

## Guion (español neutro — versión recomendada)

### 1. Hook (0:00–0:20)

**Pantalla:** frontend en `https://crisisos-frontend-264648594075.southamerica-west1.run.app/leads`, canvas vacío, chat sidebar visible.

**Voz:**
> "Chile es uno de los países más sísmicos del mundo. Cuando ocurre un terremoto, la primera hora se decide con planes que los equipos improvisan. Esto es CrisisOS: un agente que arma el plan en segundos y lo dibuja en una interfaz que sigues editando hablando con él."

### 2. Demo principal (0:20–1:30)

**Pantalla:** clic en el chat sidebar.

**Acción:** tipear lentamente (que el espectador alcance a leer):

```
Genera un plan de respuesta para un terremoto magnitud 7 en Santiago de Chile
```

**Voz mientras el agente piensa:**
> "Aquí no hay templates. El agente es LangGraph corriendo Gemini Flash 3.1 en Cloud Run. Cada decisión que toma se traduce en una llamada de tool del protocolo AG-UI, y cada tool muta el estado del canvas. Lo van a ver en vivo."

**Esperar el `STATE_SNAPSHOT`.** Cuando el header del canvas se actualice a "Terremoto · Santiago de Chile / Severidad alta · radio 15 km · 8 zonas seguras · 4 acciones inmediatas":

**Voz:**
> "Severidad, radio de impacto, zonas seguras, acciones inmediatas. Todo generado, todo estructurado, todo renderizado por el agente, no por nosotros."

> Si el frontend de Persona A está mergeado: hacer scroll por el canvas mostrando los componentes (mapa, checklist, tabla de recursos). Voz: "Mapa de evacuación, checklist priorizada, tabla de recursos asignados — el agente eligió qué componentes renderizar, no un router del frontend."

### 3. Iteración conversacional (1:30–2:00)

**Pantalla:** mismo chat, segundo prompt.

**Acción:** tipear:

```
Agrega 3 zonas seguras adicionales en Las Condes
```

**Voz:**
> "Esto es por qué elegimos AG-UI y no una capa de Generative UI puramente declarativa: el estado es bidireccional. El agente lee lo que ya está en el canvas, lo extiende, y el frontend se repinta sin que toquemos nada."

**Esperar el segundo `STATE_SNAPSHOT`** y mostrar las nuevas zonas en el canvas.

### 4. MCP en Claude o ChatGPT (2:00–2:20)

**Pantalla:** abrir Claude Web (o ChatGPT) con el conector MCP de CrisisOS instalado.

**Acción:** tipear el mismo prompt en Claude.

**Voz:**
> "El mismo agente, expuesto como servidor MCP con `mcp-use`. Tres tools, un widget unificado. Funciona en Claude, en ChatGPT, en cualquier host MCP. Una sola lógica de crisis, tres superficies."

> Si el MCP no responde a tiempo (>15s), saltar este tramo y agregar 10s al cierre técnico.

### 5. Cierre técnico (2:20–2:30)

**Pantalla:** README del repo en GitHub, scrolling rápido por la sección "Stack" y "What we built".

**Voz:**
> "Frontend Next.js, BFF Hono, agente LangGraph en Python, MCP server en TypeScript, todo en GCP Cloud Run en la región de Santiago. Repo público, README con la arquitectura, deploy reproducible. Esto es CrisisOS — agentic interfaces aplicadas a algo que importa."

**Última frame:** logo o título del repo, 1 segundo.

---

## Guion (inglés — versión alternativa para audiencia internacional)

### 1. Hook (0:00–0:20)

> "Chile is one of the most seismic countries on Earth. When the next big earthquake hits, the first hour is decided by plans that emergency teams improvise on the fly. This is CrisisOS: an agent that builds that plan in seconds and renders it on a canvas you keep editing by talking to it."

### 2. Main demo (0:20–1:30)

Type: `Generate a response plan for a magnitude 7 earthquake in Santiago, Chile`

> "No templates here. The agent is LangGraph running Gemini Flash 3.1 on Cloud Run. Every decision it makes translates into an AG-UI tool call, and every tool mutates the canvas state. Watch."

When STATE_SNAPSHOT lands:

> "Severity, impact radius, safe zones, immediate actions. All generated, all structured, all rendered by the agent — not by us."

### 3. Conversational iteration (1:30–2:00)

Type: `Add 3 more safe zones in Las Condes`

> "This is why we picked AG-UI over a pure declarative Gen UI layer: state is bidirectional. The agent reads what's already on the canvas, extends it, and the frontend repaints with no manual sync."

### 4. MCP in Claude / ChatGPT (2:00–2:20)

> "Same agent, exposed as an MCP server with mcp-use. Three tools, one unified widget. Works in Claude, in ChatGPT, in any MCP host. One crisis logic, three surfaces."

### 5. Technical close (2:20–2:30)

> "Next.js frontend, Hono BFF, LangGraph Python agent, TypeScript MCP server — all on GCP Cloud Run in the Santiago region. Public repo, full architecture in the README, reproducible deploy. This is CrisisOS — agentic interfaces applied to something that matters."

---

## Tips de grabación (en orden de criticidad)

1. **Browser limpio.** Modo incógnito, zoom 100%, sin extensiones, sin notificaciones, sin tabs extra.
2. **Resolución mínima 1080p.** El jurado ve el video proyectado.
3. **Audio externo si tienen.** El audio del laptop matará la presentación.
4. **Ensayar el demo 1 vez antes de grabar.** El primer hit del agente puede ser frío (cold start de Cloud Run, ~5–8s extra). Hacer un warm-up off-camera.
5. **No leer el script.** Tenerlo a la vista pero hablar natural. Las pausas naturales valen más que la perfección.
6. **Si algo se cae, NO mostrar pantallas de error.** Cortar la grabación, recargar, volver a grabar el tramo.
7. **Subir a YouTube como "no listado"** y pegar el link en el formulario de submission.

---

## Plan B si el demo se cae en grabación

- Si el agente tarda >20s: cortar, hacer warm-up, regrabar.
- Si el `STATE_SNAPSHOT` no llega: revisar `BFF_URL` en `.env.local`, regrabar.
- Si Claude/ChatGPT MCP falla: omitir tramo 4, extender cierre técnico (decir "el conector MCP está documentado en el repo, lo pueden instalar").
- Si TODO se cae: grabar contra `localhost` con stack local. El video sigue válido, solo cambia la URL en pantalla.
