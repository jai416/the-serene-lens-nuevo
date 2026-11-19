# AI Growth Engine — Auditoría y Plan (NO implementado aún)

> **Estado**: PROPUESTA para revisión. No se ha implementado nada, no se han
> migrado esquemas ni instalado dependencias. Cumple con "audit only".

---

## 1. Mapa de la arquitectura existente

**Stack**: Next.js 16 (App Router, Turbopack) · Prisma 7 + PostgreSQL (Supabase) ·
NextAuth · Deploy en Render (free tier) · Redis Upstash (rate limits/caché) ·
Sentry + PostHog (observabilidad) · GitHub Actions (keep-alive) · cron-job.org (12 jobs)

**Ciclos de datos relevantes al crecimiento**:

```
Fuentes IA           Generación de contenido          Publicación
─────────           ─────────────────────           ─────────────
Groq gpt-oss-120b → bot RAG (/asistente)          → Telegram
Groq gpt-oss-20b  → blog generate (admin)         → BlogPost (published)
Groq gpt-oss-20b  → seo-generator (cron 4:00)     → BlogPost (published)
NVIDIA/Gemini     → análisis de piel              → SkinAnalysis
```

**Infraestructura de tareas programadas ya operativa**:
- `cron-job.org` con API (Bearer) y 12 jobs activos — patrón verificado
- `verifyCronSecret(req)` (fail-closed) en `src/lib/cron-auth.ts`
- Patrón de cron: `src/app/api/cron/*/route.ts` → `ok({...})` + `logger`
- Keep-alive por GitHub Actions cada 10 min (Render no duerme)

**Observabilidad**: `logger` estructurado con correlation-id → consola de Render,
Sentry para errores, PostHog para eventos (`signup_from_source` ya permite
atribuir campañas).

---

## 2. Modelos y sistemas de contenido reutilizables

| Modelo | Estado actual | Sirve para el Growth Engine |
|---|---|---|
| `BlogPost` | 14 artículos. Campos: title/slug/excerpt/content/image/category/tags/**published**/publishedAt/readTime/views | ✅ Contenido educativo — ya tiene CRUD + publicación + Vistas |
| `BotKnowledge` | 29 entradas limpias (seed) + CRUD + sync web | ✅ Base de conocimiento RAG (FAQ, ingredientes) |
| `DigitalProduct` | 64 guías con PDF/SVG | ✅ Guías descargables como lead magnet |
| `Challenge` / `Badge` | 31 desafíos, 8 insignias | ⚪ Gamificación (no relacionado directo) |
| `CommunityPost` / grupos | 6 grupos por tipo de piel | ⚪ Fuentes de preguntas reales de usuarios |
| `Notification` | Web notifications + campana | ✅ Distribución de nuevo contenido a usuarios |
| `WeatherLog` | Histórico climático | ⚪ Posible contexto para contenido localizado |

**Sistema de CMS existente (sí existe, es el panel admin)**:
- `/admin/blog` — CRUD completo + publicar/despublicar + **generador con IA**
- `/admin/guides` — CRUD de guías con PDF
- `/admin/knowledge` — CRUD de la base RAG + sync
- Estados actuales: solo `published: boolean` — **NO** tiene draft/review/approved/archived
- Auditoría: existe `AuditLog` (acciones admin) — reutilizable para revisiones

---

## 3. Puntos de integración

1. **`/api/cron/*`** — punto de entrada natural para el pipeline programado (mismo patrón que `generate-seo`)
2. **`src/lib/services/seo-generator.ts`** — ya resuelve "keyword → artículo → BlogPost". El Growth Engine es su evolución
3. **`groq-chat.ts` (`groqChatJSON`)** — proveedor de texto con reintentos ya probado (248 tests)
4. **`BotKnowledge` + bot RAG** — todo artículo nuevo puede autoalimentar el conocimiento del bot
5. **`Notification`** — distribución a usuarios existentes cuando se publica algo nuevo
6. **PostHog** — medición de rendimiento del contenido (vías existentes: `$pageview`, `analysis_started`...)

---

## 4. ¿Existe un CMS? — Sí, parcial

El panel admin **es** el CMS (blog/guides/knowledge con estados de publicación).

**Lo que falta para el flujo editorial del spec**:
- Estados `draft → review → approved → published → archived` (hoy solo booleano `published`)
- Historial de revisiones (hoy solo `updatedAt`)
- Campos de fuente/fecha de fuente (hoy no existen en BlogPost)
- Cola de revisión con aprobación humana

**Propuesta**: añadir a `BlogPost` (sin romper lo existente):
```
status          String  @default("published")  // draft|review|approved|published|archived
sourceUrl       String?
sourceName      String?
sourceDate      DateTime?
reviewNotes     String?
reviewedById    String?
contentOrigin   String  @default("human")      // human|ai-assisted|ai-generated
```
`published` se mantiene y se deriva de `status` durante la transición (o se
depreca tras migrar los reads).

---

## 5. MVP de Trend Intelligence — propuesta

**Principio del spec aplicado**: UN orquestador + herramientas, NO 6 agentes.

```
                 ┌──────────────────────────────┐
   cron 6:00 ───▶│  1. COLLECTOR (herramienta)   │  RSS/APIs → hechos crudos
   (diario)      └──────────────┬───────────────┘
                                ▼
                 ┌──────────────────────────────┐
                 │  2. ANALISTA (Groq gpt-oss)  │  puntúa 7 dimensiones
                 │     tendencia + credibilidad │  → TrendCandidate
                 └──────────────┬───────────────┘
                                ▼
                 ┌──────────────────────────────┐
                 │  3. ESTRATEGA (Groq)         │  ¿cubre nuestro contenido?
                 │     decide: descartar /      │  evita duplicados
                 │     draft / urgente          │
                 └──────────────┬───────────────┘
                                ▼
                 ┌──────────────────────────────┐
                 │  4. REDACTOR (Groq)          │  artículo en Markdown
                 │     + verificación factual   │  con fuentes citadas
                 └──────────────┬───────────────┘
                                ▼
              status: review  →  (tú apruebas en /admin)  →  publish
```

**Por qué no 6 agentes**: research/analyst/strategist/writer son 4 llamadas
secuenciales al MISMO LLM con distintos prompts (hoy ya hay3 patrones
probados: generate-seo, blog-generate, bot-rag). "Growth Agent" y "Analytics
Agent" son tareas programadas simples (publicar en calendario + leer PostHog),
no agentes. Se implementan como **módulos con contratos claros** dentro de un
cron, con opción de añadir un orquestador dedicado más adelante si el volumen
lo justifica.

**Scoring (7 dimensiones, 0-10)** — salida JSON del Analista:
`momentum` (señal de búsqueda/discusión), `credibility` (calidad de fuentes),
`evidence` (respaldo científico — PubMed/COSING), `relevanceTopic`,
`relevanceAudience` (piel latina, clima caribeño, Cuba), `opportunity`
(hueco de contenido), `overlap` (10 = ya lo cubrimos → descartar).
**Regla dura**: `viral ≠ efectivo` — un trending sin evidencia científica
puntuа ≤4 en `evidence` → máximo "review", jamás auto-publicado.

---

## 6. Estructuras de BD propuestas (NO migrar aún)

```prisma
model Trend {
  id            String   @id @default(cuid())
  title         String
  slug          String   @unique
  summary       String
  category      String            // ingredient|concern|research|faq|product
  scoreTotal    Float
  scoreMomentum Float
  scoreCredibility Float
  scoreEvidence Float
  scoreRelevanceTopic Float
  scoreRelevanceAudience Float
  scoreOpportunity Float
  scoreOverlap  Float
  status        String   @default("detected") // detected|scored|drafting|review|rejected|published
  firstSeenAt   DateTime @default(now())
  lastSeenAt    DateTime @default(now())
  createdAt     DateTime @default(now())
  @@index([status]) @@index([category]) @@index([scoreTotal])
}

model TrendSource {
  id         String   @id @default(cuid())
  trendId    String
  url        String
  title      String
  publisher  String
  publishedAt DateTime?
  fetchedAt  DateTime @default(now())
  credibilityScore Float?
  excerpt    String?
  trend      Trend @relation(fields: [trendId], references: [id], onDelete: Cascade)
  @@unique([trendId, url])     // anti-duplicados a nivel de BD
  @@index([trendId])
}

model ContentDraft {          // propuesta de contenido con historial
  id           String   @id @default(cuid())
  trendId      String?
  type         String             // article|explainer|faq|guide|instagram|reel|carousel|trend-report
  title        String
  body         String            // Markdown
  status       String   @default("draft") // draft|review|approved|published|archived
  riskLevel    String   @default("normal") // normal|claims  ← exige revisión si claims
  sourceUrls   String[]           // hechos citados
  generatedBy  String             // prompt/modelo usado (trazabilidad)
  version      Int      @default(1)
  blogPostId   String?            // si se publica como artículo
  reviewedById String?
  reviewNotes  String?
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
  @@index([status]) @@index([type]) @@index([trendId])
}

model ContentRevision {       // historial inmutable
  id          String   @id @default(cuid())
  draftId     String
  version     Int
  title       String
  body        String
  status      String
  editedBy    String?  // null = motor IA
  editedAt    DateTime @default(now())
  draft       ContentDraft @relation(fields: [draftId], references: [id], onDelete: Cascade)
  @@unique([draftId, version])
}
```

**Impacto en lo existente**: `BlogPost` recibe 7 columnas nuevas (additive).
Nada existente se borra ni cambia de significado.

---

## 7. Fuentes gratuitas — verificadas hoy (curl real)

| Fuente | Estado | Uso en el MVP | Notas |
|---|---|---|---|
| **PubMed E-utilities** | ✅ HTTP 200 (149 resultados prueba) | Evidencia científica para `evidence` | Gratis, sin key, límite 3 req/s sin key |
| **COSING (Comisión Europea)** | ✅ HTTP 200 (2.5s) | Ficha oficial de ingredientes INCI | La fuente autoritativa para ingredientes |
| **Wikipedia REST API** | ✅ 200 | Explicadores de ingredientes | Gratis, sin key |
| **Openverse (CC images)** | ✅ 200 (240 resultados) | Imágenes libres para artículos | Gratis, sin key |
| **arXiv API** | ✅ 200 | Papers recientes (secundario) | Gratis |
| **DuckDuckGo Instant Answer** | ✅ 200 (cobertura limitada) | Fact-check rápido | Gratis, sin key |
| **Google Trends** | ❌ **404 — API oficial eliminada (2017)** | — | Sin API oficial. Alternativas: solo tendencias propias (búsquedas internas) o pagado |
| **Reddit JSON público** | ❌ HTML bloqueado | — | Requiere OAuth (gratuito) o no usar |
| **Groq gpt-oss-20b/120b** | ✅ clave activa | Todo el texto (analista/estratega/redactor) | Tier gratuito con límites; ya en producción |

**Sobre "trends de búsqueda"** (el punto más débil del spec gratis):
Google no ofrece API gratuita. Opciones reales para el MVP:
1. **Señales propias**: búsquedas internas (`/api/products?q=`), queries del
   bot RAG, preguntas de la comunidad → GRATIS y más relevante que Google Trends
2. **Reddit OAuth gratuito** (script app) para r/SkincareAddiction +
   r/AsianBeauty — volumen real de preocupaciones
3. Dejar Trends como "v2 pagado" (SerpAPI/Exploding Topics ~$50/mes) — NO en el MVP

---

## 8. Plan de implementación por hitos pequeños

**M0 — Aprobación** (hoy): tú revisas este documento. Sin código.
*(requisito del spec: "Do not implement anything until I review")*

**M1 — Esquemas + recolector (2 días)**
- Proponer migración de `Trend`, `TrendSource` (additive) → tu aprobación → aplicar
- `GET /api/cron/trends-collect` (Bearer): PubMed + COSING + Wikipedia → `Trend`/`TrendSource`
- Job cron-job.org diario 6:00 · retries con backoff · logs con correlation-id
- **Criterio**: 10 tendencias nuevas en BD con ≥2 fuentes cada una

**M2 — Scoring + Estratega (2 días)**
- `POST /api/cron/trends-score` → scoring 7 dimensiones con Groq (JSON estricto)
- Anti-duplicado: overlap contra `BlogPost.title/tags` + `BotKnowledge.title` (embedding-lite: keywords) y `TrendSource.url` único por BD
- **Criterio**: cada Trend con `scoreTotal` y `status` correcto; ninguno con evidencia ≤4 pasa a draft auto

**M3 — Redactor + borradores con revisión (3 días)**
- `ContentDraft` + `ContentRevision` (migración additive)
- Genera artículo Markdown con fuentes citadas → `status: draft` (o `review` si `riskLevel: claims`)
- UI en `/admin`: cola "Borradores para revisar" → aprobar/rechazar/editar → publicar crea `BlogPost`
- `ContentRevision` guarda cada versión al editar
- **Criterio**: artículo generado → aprobado → publicado → visible en `/blog` con historial

**M4 — Distribución + calendario Instagram (2 días)**
- Al publicar: `Notification` a usuarios (ya existe el sistema) + entrada de calendario semanal
- `ContentDraft` type `instagram|reel|carousel` → captions/scripts (mismo redactor, otro prompt)
- Exportar calendario a CSV/JSON para que lo pegues en Meta Business Suite (sin API de IG en MVP — la API de IG requiere app aprobada)
- **Criterio**: 1 calendario semanal generado con 7 slots

**M5 — Analytics Loop (1 día)**
- PostHog: vistas por artículo (`$pageview` con path) → informe semanal al Telegram del admin (patrón ya probado con `daily-report`)
- Alimenta `scoreOpportunity` del M2 con datos reales de rendimiento
- **Criterio**: informe semanal con top-3 artículos y caídas

**Total MVP: ~10 días**. Cada hito es mergeable y usable por separado.

---

## 9. Riesgos (seguridad, coste, fiabilidad)

**Seguridad**
- 🔴 **Revisión humana obligatoria para `riskLevel: claims`** — tratamientos,
  enfermedades y seguridad jamás auto-publicados (regla del spec). Implementar
  como guard en el endpoint de publicación, no solo en la UI
- 🔴 **Secretos**: las claves viven en `.env`/Render env vars. Los cron usan
  `Bearer CRON_SECRET` fail-closed ✓. No loguear cuerpos completos con datos
  de usuarios (patrón ya corregido en auditorías previas)
- 🟡 **SSRF**: los recolectores solo deben permitir hosts de la allowlist
  (dominios de fuentes verificadas), nunca URLs de usuario
- 🟡 **Prompt injection**: el contenido de RSS/Reddit entra en prompts →
  delimitar como "dato, no instrucción" y saneado (patrón `stripHtml` ya existe)

**Coste**
- ✅ Groq tier gratuito ya en uso (límites: ~30 req/min en gpt-oss). Un
  pipeline diario de ~10-20 llamadas no lo agota
- ✅ Fuentes de datos: 100% gratuitas verificadas
- ⚠️ NVIDIA/Gemini solo para visión — **no** usarlos en este pipeline
- ⚠️ Riesgo real: si escalas a varios artículos/día + scoring, vigilar el
  rate limit de Groq → backoff + límite diario configurable por env var

**Fiabilidad**
- 🟡 **Reddit bloqueado** sin OAuth → MVP sin Reddit (o OAuth en v2)
- 🟡 **Google Trends sin API** → el "momentum" del MVP usa señales propias;
  documentarlo para no prometer lo que no hay
- 🟡 **Duplicados**: triple capa (URL única en BD, overlap contra BlogPost/
  BotKnowledge, y revisión humana antes de publicar)
- 🟢 Patrones de retry/backoff/logs ya existen en el proyecto y se reutilizan
- 🟢 Los cron de cron-job.org notifican fallos por email (ya notificó el de UV)

---

## 10. Preguntas para tu aprobación (M0)

1. **¿Apruebas la dirección** (orquestador secuencial +4 etapas, sin6 agentes)?
2. **¿Apruebas las 2 migraciones** propuestas (`Trend`+`TrendSource` en M1;
   `ContentDraft`+`ContentRevision`+7 columnas en BlogPost en M3)? → se
   aplican solo con tu consentimiento explícito, una por hito, diff antes
3. **¿Momentum sin Google Trends es aceptable** para el MVP (señales propias +
   Reddit en v2), o quieres presupuestar SerpAPI desde el inicio?
4. **¿Quién revisa los borradores?** — solo tu cuenta admin, o también VALIDATOR?
5. **¿Auto-publicar solo el tipo "article educativo bajo riesgo"** cuando
   `riskLevel: normal` y `scoreTotal ≥ 7`, o siempre exigir aprobación manual
   en el MVP?
