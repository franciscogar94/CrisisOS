# Submission checklist — CrisisOS · 9 May 2026 · 18:00 Santiago

> **Portal**: https://santiago.aitinkerers.org/hackathons/h_LoGdPiECnm4/entries
> **Track elegido**: Agentic Interfaces

---

## Lo que el hackathon exige (3 entregables obligatorios)

- [ ] **Repo GitHub público** con README claro (✅ README ya escrito en root del repo)
- [ ] **Video demo 2-3 min** (working code, sin slides, sin mockups) → script en `video-script.md`
- [ ] **Post LinkedIn o X** con tags de sponsors → copies en `social-post.md`

---

## Orden recomendado para los próximos ~30 minutos

### Fase 1 — Repo público (5 min)

- [ ] Verificar que el repo `franciscogar94/CrisisOS` es **público** en GitHub
  - Si está privado: settings → change visibility → public
- [ ] Commitear y pushear los nuevos docs:
  ```bash
  cd /Users/digibot/Developer/CrisisOS
  git add README.md dev-docs/STARTER_KIT_README.md dev-docs/submission/
  git commit -m "docs: hackathon submission (README, video script, social post)"
  git push
  ```
- [ ] Smoke test: abrir el repo en una ventana incógnita y confirmar que el README se ve bien renderizado

### Fase 2 — Warm-up del demo (3 min)

- [ ] Abrir https://crisisos-frontend-264648594075.southamerica-west1.run.app en incógnita
- [ ] Hacer 1 prompt de prueba: `Genera un plan para terremoto magnitud 7 en Santiago`
- [ ] Confirmar que el header del canvas se actualiza
- [ ] Si tarda >20s la primera vez (cold start), repetir 2 veces para tener Cloud Run caliente

### Fase 3 — Grabar video (10-15 min, incluye 1-2 takes)

- [ ] Cerrar todo lo que pueda notificar (Slack, mail, mensajes)
- [ ] Browser limpio en incógnita, zoom 100%, 1080p mínimo
- [ ] Grabar siguiendo `video-script.md`
- [ ] Subir a YouTube como **"no listado"** (no público todavía, no privado)
- [ ] Copiar el link de YouTube

### Fase 4 — Post de redes (5 min)

- [ ] Elegir LinkedIn o X (o ambos)
- [ ] Copiar el copy de `social-post.md` que corresponda
- [ ] Adjuntar screenshot o trozo del video
- [ ] Verificar handles de sponsors antes de publicar
- [ ] **Publicar** y copiar el link del post

### Fase 5 — Submission al portal (3 min)

- [ ] Ir a https://santiago.aitinkerers.org/hackathons/h_LoGdPiECnm4/entries
- [ ] Completar el formulario:
  - Nombre del proyecto: **CrisisOS**
  - Track: **Agentic Interfaces**
  - Repo: link a GitHub
  - Video: link de YouTube
  - Post: link al post publicado
  - Equipo: nombres de Persona A y Persona B
- [ ] **Submit antes de las 18:00** (no hay segunda oportunidad)

---

## Margen de seguridad

| Fase | Tiempo estimado | Buffer |
| --- | --- | --- |
| 1. Repo | 5 min | — |
| 2. Warm-up | 3 min | — |
| 3. Video | 15 min | 5 min para retake |
| 4. Post | 5 min | — |
| 5. Submission | 3 min | — |
| **Total** | **31 min** | **+5 min buffer** |

Total con buffer: **36 min**. Empezando 16:45 → cierra 17:21. Margen real al deadline (18:00): **~40 min**.

---

## Criterios de judging — auto-check

| Criterio | Peso | Estado |
| --- | --- | --- |
| Innovation & Creativity | 25% | ✅ Pivot del starter al Crisis Manager (NO copia el demo). README lo dice explícitamente. |
| Technical Implementation | 25% | ✅ AG-UI con 16 tools, README claro, stack documentado. ⚠️ Verificar commit history limpio antes de push. |
| Accuracy & Reliability | 20% | ✅ Demo end-to-end funciona en producción. Warm-up de Cloud Run mitiga cold start. |
| UX & Interface Design | 15% | ❓ Depende de qué frontend grabamos (lead-flavored vs Persona A mergeado) |
| Scalability & Potential Impact | 15% | ✅ Crisis management en país sísmico, pitch claro en video y README. |

---

## Si algo falla

- **Repo no se puede hacer público**: el formulario probablemente acepta repo privado con invitación al jurado. Como fallback, agregar usuarios del jurado como collaborators.
- **Video no sale en 15 min**: priorizar grabar el tramo del demo (0:20–1:30). Los demás tramos pueden ser más cortos o omitirse.
- **Cloud Run se cae**: tenés stack local listo (`npm run dev`). Grabar contra `localhost:3010` con frontend pegado al BFF de prod o local. El video sigue válido.
- **El post no se publica a tiempo**: publicarlo INMEDIATAMENTE después del submission. La regla pide el link del post; si el portal lo permite editar después, mejor.

---

## Después del deadline

- Apagar Cloud Run para no quemar créditos: `gcloud run services list` y `gcloud run services delete` los que ya no necesites.
- Rotar la API key de Gemini (apareció en transcripts previos).
- Hacer un session_summary de engram con todo lo entregado.
