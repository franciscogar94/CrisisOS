import { MCPServer, text, widget } from "mcp-use/server";
import { z } from "zod";
import { generateCrisis, fetchWeather } from "./src/lib/crisis/generate";
import { TYPE_LABEL_ES, SEVERITY_LABEL_ES } from "./src/lib/crisis/templates";
import { SAMPLE_CRISIS } from "./src/lib/crisis/sample";

const server = new MCPServer({
  name: "crisis-manager-mcp",
  title: "Crisis Manager MCP",
  version: "1.0.0",
  description:
    "Crisis Manager — generate a structured emergency response plan from a free-form description and render it as an interactive dashboard widget. Detects crisis type (earthquake/flood/fire/etc.), severity, and location; populates safe zones, evacuation checklist, resource have/need bars, service alerts and a response timeline. Best-effort live weather via Open-Meteo.",
  baseUrl: process.env.MCP_URL || "http://localhost:3011",
  favicon: "favicon.ico",
  websiteUrl: "https://mcp-use.com",
  icons: [
    {
      src: "icon.svg",
      mimeType: "image/svg+xml",
      sizes: ["512x512"],
    },
  ],
});

server.tool(
  {
    name: "generate-crisis",
    description:
      "Generate a complete emergency response plan from a description. Examples: 'Terremoto magnitud 7 en Santiago de Chile', 'Inundación severa en Lima', 'Wildfire near Valparaíso'. Returns an interactive dashboard widget with crisis details, safe zones, evacuation checklist, resource status, service alerts, response timeline and live weather.",
    schema: z.object({
      description: z
        .string()
        .min(1)
        .describe(
          "Free-form crisis description. Mention type (terremoto/flood/fire/etc.), severity (magnitud N or grave/moderado/leve), and location (Santiago/Lima/Buenos Aires/etc.).",
        ),
    }),
    widget: {
      name: "crisis-dashboard",
      invoking: "Generando plan de respuesta…",
      invoked: "Plan listo",
    },
  },
  async ({ description }) => {
    const data = await generateCrisis(description);
    const c = data.crisis;
    const summary =
      `Generado plan de respuesta · ${TYPE_LABEL_ES[c.type]} en ${c.location.name} ` +
      `(severidad ${SEVERITY_LABEL_ES[c.severity]}). ` +
      `${data.safeZones.length} zonas seguras, ${data.checklist.length} ítems en checklist, ` +
      `${data.resources.length} categorías de recursos, ${data.alerts.length} alertas de servicios.`;
    return widget({
      props: data,
      output: text(summary),
    });
  },
);

server.tool(
  {
    name: "show-crisis-sample",
    description:
      "Render the Crisis Manager dashboard with a baked-in sample (Santiago earthquake, severity high). Useful for previewing the layout without a description.",
    schema: z.object({}),
    widget: {
      name: "crisis-dashboard",
      invoking: "Cargando muestra…",
      invoked: "Muestra lista",
    },
  },
  async () => {
    return widget({
      props: SAMPLE_CRISIS,
      output: text(
        "Cargada crisis de muestra: terremoto severidad alta en Santiago de Chile.",
      ),
    });
  },
);

server.tool(
  {
    name: "fetch-weather",
    description:
      "Fetch a current-weather snapshot from Open-Meteo (free, no API key). Returns temperature, wind speed, humidity and a short description.",
    schema: z.object({
      lat: z.number().describe("Latitude of the location to query."),
      lng: z.number().describe("Longitude of the location to query."),
    }),
  },
  async ({ lat, lng }) => {
    const w = await fetchWeather(lat, lng);
    if (!w) {
      return text(
        "No fue posible obtener el clima actual desde Open-Meteo. Reintentar en unos segundos.",
      );
    }
    return text(
      `Clima actualizado · ${w.temperature.toFixed(1)}°C, ` +
        `viento ${w.windSpeed.toFixed(1)} km/h, humedad ${w.humidity}%. ${w.description}.`,
    );
  },
);

server.listen().then(() => {
  console.log("Crisis Manager MCP server running on port 3011");
});
