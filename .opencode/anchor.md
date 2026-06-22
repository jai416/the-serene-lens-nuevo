## Goal
Transformar "The Serene Lens" de herramienta funcional a negocio sostenible con validación de producto, adquisición orgánica, evolución de datos, B2B e internacionalización, optimizando rendimiento, UX, seguridad y observabilidad.

## Constraints & Preferences
- Next.js 16 + TypeScript + Prisma 7 + next-auth v4 + @auth/prisma-adapter v2.8
- Spanish UI, English code. Diseño v2.0: paleta sage (#C2E09D), fondo #F8FAF5, cards blancas, sin neon/glass/dark mode
- Doble pasarela: Stripe (USD) + QvaPay (CUP). Posicionamiento: "observación cosmética, no diagnóstico médico"
- Prohibido: contadores ficticios, testimonios inventados, logs de PII en PostHog, llamadas síncronas sin timeout
- Todas las deps nuevas son opcionales (lazy imports / dynamic require). Build funciona sin instalarlas
- `tsconfig.json` con `strict: true` ya configurado

## Progress
### Done
- **Seed expandido**: 10 blog posts (5 categorías), 10 productos (8 categorías), admin + demo users en `prisma/seed.ts`
- **Tests Vitest**: 100 tests, 11 suites (evolution.service, analysis.service, affiliate.service, sanitize, validations, api-response, csrf, cache, streaming, webp, email-sequence). Mock pattern: `vi.hoisted()` para variables en `vi.mock()` factories
- **Documentación**: README.md completo con features, estructura, APIs, tests, dev notes. AGENTS.md con sección de tests + seed data + comandos
- **N1 - Build Turbopack**: `next.config.ts` con `transpilePackages: ["lucide-react"]`, `compiler.removeConsole` en prod
- **N2 - CSRF**: `src/lib/csrf.ts` con `generateCsrfToken()` (crypto.randomBytes), `validateCsrfToken()` (timingSafeEqual), `CSRF_COOKIE_NAME`, `CSRF_HEADER_NAME`
- **N3 - API unificado**: `api-response.ts` devuelve `{ success: true, data }` / `{ success: false, error: { code, message } }`. `error-codes.ts` con 10 códigos (UNAUTHORIZED, FORBIDDEN, VALIDATION_ERROR, RATE_LIMITED, etc.). 24 API routes + 11 frontend files actualizados
- **N4 - CacheAdapter**: `cache.ts` refactorizado con interfaz `CacheAdapter`, `getCache<T>()`, `createRedisCache()` ready. Fallback memory/Map
- **N5 - Tests de integración**: 3 nuevos test files (`api-response.test.ts`, `csrf.test.ts`, `cache.test.ts`) = 25 tests adicionales
- **N6 - a11y**: `aria-label`, `aria-describedby`, `role="alert"`, `role="region"`, `role="status"`, `role="progressbar"` añadidos a button, card, badge, login, analysis, pricing
- **N7 - WebP**: `image-compression.ts` detecta soporte WebP via canvas, exporta a `image/webp` con fallback JPEG, ~30% menos peso
- **N8 - Repository pattern**: `src/lib/repositories/index.ts` con 6 repos (Analysis, User, Payment, Blog, Product, Feedback). Servicios actualizados (analysis.service.ts, evolution.service.ts, user.service.ts) usan repos en lugar de db directo
- **N9 - Logger estructurado**: `logger.ts` con correlation-id via `globalThis.__correlationStore`, JSON output, niveles debug/info/warn/error filtrados por entorno
- **N10 - Husky/lint-staged**: `.husky/pre-commit` hook, `lint-staged` config en package.json (tsc --noEmit + prettier). Nota: husky no instalado (npm install falló por corrupción node_modules)
- **N11 - PWA**: `public/manifest.json` con colores marca, `public/sw.js` con CacheFirst (static) + NetworkFirst (API), `public/icons/icon-192.svg`. Layout registra sw.js al cargar
- **N12 - Robots/Sitemap**: `robots.ts` con sitemap URL. `sitemap.ts` con changefreq/priority + productos dinámicos
- **N13 - Landing bundle**: FAQ extraído a `src/components/faq-section.tsx` con `next/dynamic`. 13KB de JavaScript no crítico movido a chunk separado
- **N2.1 - Cache híbrida DB**: `src/lib/cache/db-cache.ts` con `getDBCache`/`setDBCache`/`delDBCache`. Usa memory cache como hot layer + tabla `Cache` en Supabase como persistencia. Affiliate service ya usa `getDBCache`/`setDBCache`
- **N2.2 - Retry mechanism**: `src/lib/retry.ts` con `withRetry()` (backoff exponencial, maxRetries configurable, onRetry callback). OpenRouter envuelve ambos fetch calls con `withRetry`
- **N2.3 - OpenRouter retry**: `src/lib/openrouter.ts` — ambos fetch calls (POST + GET) envueltos con `withRetry({ maxRetries: 3, baseDelayMs: 1000 })`
- **Edge Runtime**: `/api/health` + `/api/og` marcados con `export const runtime = "edge"`
- **Evolution pre-calculation**: `src/lib/services/evolution-calculator.ts` con `recalculateAndSaveEvolution()` + `getCachedEvolution()`. `evolution.service.ts` exporta `getUserEvolution()` que checkea cache primero
- **Webhook service**: `src/lib/services/webhook.service.ts` con `recordWebhookEvent()`, `markWebhookProcessed()`, `markWebhookFailed()`, `retryFailedWebhooks()`. `src/lib/services/webhook-processor.ts` con `processWebhookByProvider()` para Stripe + QvaPay
- **revalidateTag**: Admin blog y products routes llaman `revalidateTag` tras create/update/delete (tags: "blog-posts", "products-catalog")
- **unstable_cache products**: `/api/products` usa `unstable_cache` con revalidate=3600s + tag "products-catalog"
- **Compound queries analytics**: `/api/admin/analytics` refactorizado a `db.$transaction()` — 6 queries en una transacción
- **Anti-fraud register**: `/api/register` rate limit — 3 registros por IP en 24h (in-memory Map)
- **N+1 fix history**: `/api/analysis` incluye `feedback` con `select` de campos mínimos
- **DNS prefetch**: Layout añade preconnect + dns-prefetch para OpenRouter, Stripe, PostHog
- **DB push + seed**: ejecutados — modelos (Feedback, Clinic, AffiliateClick, Cache, WebhookEvent, UserEvolution) aplicados, columnas migradas, 10 posts + 10 productos creados en Supabase
- **Streaming IA**: `src/lib/streaming.ts` con `AnalysisStream` (clase SSE), `createStreamGenerator`, `useAnalysisStream` (hook React). `/api/analyze/stream` con edge runtime, 7 etapas de progreso
- **WebP optimization**: `src/lib/webp.ts` con `supportsWebP()` (detección canvas) + `optimizeToWebP()` (conversión con fallback JPEG)
- **ESLint config**: `.eslintrc.json` con reglas import/order (alfabético, agrupado), no-unused-vars, no-console, resolver TypeScript
- **SEO Article Generator**: `src/lib/services/seo-generator.ts` genera artículos via OpenRouter con 20 keywords predefinidas. `/api/cron/generate-seo` ejecuta diariamente via cron-job.org
- **Email Sequence**: 6 emails automáticos (Día 0,1,3,7,14,21) via Resend. Templates HTML con branding. `/api/cron/emails` ejecuta diariamente
- **SEO Landing Pages**: 6 páginas optimizadas — `/analizar-piel-gratis`, `/test-tipo-de-piel`, `/como-saber-mi-tipo-de-piel`, `/analisis-de-piel-con-ia`, `/rutina-skincare-personalizada`, `/ingredients-analyzer`. JSON-LD implícito vía metadata
- **OG Dinámico**: `/api/og` acepta `skinType`, `analysisId`, `observations` para imágenes de compartir personalizadas
- **Register + Welcome Email**: `/api/register` envía email de bienvenida
- **Sitemap expandido**: 6 nuevas landing pages con priority 0.8-0.9
- **Cron jobs**: 3 endpoints cron — SEO (8am), emails (9am), retención (10am) — ejecutan diariamente via cron-job.org
- **Cron-job.org**: 3 jobs externos configurados (SEO 7882243 8am, emails 7882246 9am, retention 7882249 10am). Headers `x-cron-secret` con CRON_SECRET. Apuntan a `theserene-lens.onrender.com`
- **CRON_SECRET generado**: 64 hex chars en `.env` para autorizar endpoints de cron
- **Cron retención corregido**: Usa `sendEmail` con templates de renovación/expiración en vez de `sendPasswordResetEmail`
- **Sidebar corregido**: Link "Ingredientes" apunta a `/ingredients-analyzer` (antes duplicaba `/products`)

### In Progress
- *(none)*

### Blocked
- **npm install falla**: `node_modules` corrupto (ENOTEMPTY en varios paquetes). Solución: `rm -rf node_modules .next && npm install --legacy-peer-deps`
- **Husky no operativo**: depende de npm install. Config y .husky/pre-commit listos
- **Stripe env vars vacíos**: STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, todos los PRICE_IDs
- **DB unreachable from CLI**: Schema pushes no ejecutables localmente sin acceso a Supabase
- **CRON_SECRET pendiente de configurar en Render**: Generado en .env, falta agregar como env var en Render
- **PostHog/Sentry configurados en .env**: Falta verificar que funcionan en producción
- **Cron-job.org**: Jobs apuntan a `theserene-lens.onrender.com` — verificar dominio correcto

## Key Decisions
- **Servicios usan repositorios**: `analysis.service.ts` llama a `AnalysisRepository.create()` en lugar de `db.skinAnalysis.create()`. Tests mockean repos, no db. Desacopla Prisma → futura migración a MongoDB sin tocar lógica
- **Prisma 7 migration**: `prisma.config.ts` con datasource URL. Generator `prisma-client` + output `../src/generated/prisma`. Driver adapter `@prisma/adapter-pg` + `pg`. Imports desde `@/generated/prisma/client`.
- **Cache híbrida sin deps extra**: memory/Map para hot cache (rápido), tabla `Cache` en Supabase para persistencia entre deploys. `CacheAdapter` interface permite cambiar a Redis sin tocar negocio
- **Affiliate usa db-cache**: `affiliate.service.ts` importa `getDBCache`/`setDBCache` de `@/lib/cache/db-cache` para persistencia entre instancias serverless
- **80+ tests en 10 files**: priorizados servicios core + validaciones + utilidades. Mock de repos con `vi.hoisted()` (Vitest v3 requiere factory hoisting)
- **Streaming SSE con edge runtime**: `AnalysisStream` genera `ReadableStream` con `TextEncoder`. Hook `useAnalysisStream` usa `EventSource` en cliente. Route `/api/analyze/stream` es edge-compatible
- **SEO generator via OpenRouter**: Genera artículos con 20 keywords predefinidas. Cada artículo incluye enlace obligatorio a The Serene Lens. Cron diario via cron-job.org
- **Guest auth gating**: Análisis muestra card de login para guests. Sidebar/mobil-nav muestran links diferentes según sesión. Feedback buttons ocultos para guests. `handleAnalyze` redirige a login si no hay sesión.
- **Photo quality relajada**: `BLUR_THRESHOLD` de 30 a 12. `BRIGHTNESS_MIN` de 40 a 30. `BRIGHTNESS_MAX` de 220 a 230. Fallback graceful si `createImageBitmap` falla.
- **Service worker solo en producción**: En dev no se registra para evitar cache stale de HMR chunks. `sw.js` usa `networkFirst` para todo (incluidos `_next/` chunks).
- **CSP corregido**: Sentry DSN completo en `connect-src` en vez de wildcard inválido `o*.ingest.sentry.io`.
- **Proxy simplificado**: `src/proxy.ts` con export `proxy` (Next.js 16 convention). Sin `withAuth`. Verifica cookie de sesión directamente.
- **Email sequence sin dependencia de DB**: Templates generados en memoria con `buildEmailSequence()`. Processor verifica días desde registro. Resend lazy via dynamic import
- **Landing pages estáticas**: 6 páginas con contenido SEO optimizado, sin datos dinámicos. Generadas en build time
- **OG dinámico con DB lookup**: `/api/og?analysisId=xxx` busca skinType en DB y genera imagen personalizada. Edge runtime para performance
- **Register route limpio**: Usa `registerUser()` de auth.ts + envía welcome email. Sin referral.

## Next Steps
1. `rm -rf node_modules .next && npm install --legacy-peer-deps` (corregir node_modules corrupto + instalar deps Prisma 7)
2. `npx prisma generate` (generar client en src/generated/prisma/) — YA EJECUTADO
3. Configurar CRON_SECRET en Render Dashboard (env var)
4. Verificar cron-job.org apunta al dominio correcto de Render
5. Configurar Stripe keys reales + price IDs + webhook secret

## Critical Context
- Build 40-114s en filesystem lento; clean build con `rm -rf .next && npm run build`, timeout 600s. 61 rutas, 0 errores TS
- Next.js 16 usa Turbopack por defecto. `transpilePackages: ["lucide-react"]` añadido para evitar recompilaciones innecesarias
- `Function('return import("...")')()` usado para ocultar nombres de módulos del bundler (evita Module not found en build)
- CSP en next.config.ts: connect-src permite OpenRouter, Stripe, Supabase, PostHog, Sentry. `removeConsole` en prod
- `api-response.ts` ahora devuelve `{ success: true, data }` / `{ success: false, error: { code, message } }`. Frontend usa `data.error?.message || data.error`
- `logger.ts` genera JSON estructurado con correlation-id. `setCorrelationId()` usa `globalThis.__correlationStore`
- DB: PostgreSQL via Supabase. Schema con 19 modelos (últimos: Cache, WebhookEvent, UserEvolution). Seed ejecutado
- Rate limit /api/analyze: in-memory Map (5 req/min por userId+IP)
- `RESEND_API_KEY` configurada: `re_iH9ENaZw_3tj179tTrNWoQQbJMrzocR5g`
- `CRON_SECRET` generado: `6fa3cf59...` (64 hex chars) — necesario configurar en Render
- `CRONJOB_API_KEY` configurado: `TExK0d1GCHp1PsspdQIy5ylmGxttG78KL91Msm4FuTA=`
- `NEXT_PUBLIC_POSTHOG_KEY` configurado: `phc_mvSC7UH7TY4SBvyV6QZsHtamuW7sH23vzgZLDfGNuVQC`
- `NEXT_PUBLIC_SENTRY_DSN` configurado: `https://af0387dda5b03175c2f8ba3e58792082@o4511315853246464.ingest.us.sentry.io/4511608499601408`
- `NEXT_PUBLIC_POSTHOG_HOST` configurado: `https://app.posthog.com`
- Email processor segmenta por comportamiento: FREE sin análisis (onboarding), FREE con análisis (conversión), inactivos 14d (re-engagement)
- PWA soporte offline: sw.js registrado en layout, manifest.json con colores marca
- Streaming: 7 etapas — validating → compressing → analyzing-texture → analyzing-pores → analyzing-tone → building-results → complete
- SEO: 20 keywords, cron diario genera 2 artículos/día, publicados automáticamente
- Emails: secuencia Día 0 (welcome), 1 (tipo piel), 3 (escáner), 7 (expiración), 14 (evolución), 21 (descuento 30%)
- Retención: cron diario notifica 3 días antes de expiración + degrada suscripciones vencidas a FREE
- Sin email service, sin analytics key, sin Stripe keys, sin Sentry DSN configurados en .env
- `node_modules` corrupto (ENOTEMPTY). npm install falla para nuevas deps. Workaround: limpiar y reinstalar
- Prisma 7: driver adapter `@prisma/adapter-pg` + `pg` requerido. `prisma.config.ts` con datasource URL. Generated client en `src/generated/prisma/`
- PWA soporte offline: `sw.js` registrado en layout, IndexedDB listo para guardar progreso de análisis desconectado
- DB unreachable desde esta máquina: schema pushes y seeds solo ejecutables desde entorno con acceso a Supabase

## Relevant Files
- `/home/jai/theserene/.env`: RESEND_API_KEY, CRON_SECRET, CRONJOB_API_KEY, NEXT_PUBLIC_POSTHOG_KEY, NEXT_PUBLIC_POSTHOG_HOST, NEXT_PUBLIC_SENTRY_DSN configurados. Stripe keys vacías
- `/home/jai/theserene/next.config.ts`: transpilePackages, compiler.removeConsole, CSP, image formats optimizados, Supabase remotePatterns
- `/home/jai/theserene/src/lib/api-response.ts`: apiResponse<T>(), apiError(), ok(), error(), unauthorized(), forbidden(), notFound(), serverError()
- `/home/jai/theserene/src/lib/error-codes.ts`: 10 códigos con mensajes por defecto
- `/home/jai/theserene/src/lib/csrf.ts`: generateCsrfToken(), validateCsrfToken(), getCsrfTokenFromRequest()
- `/home/jai/theserene/src/lib/cache.ts`: CacheAdapter interface + memory/Map implementation + createRedisCache() stub
- `/home/jai/theserene/src/lib/cache/db-cache.ts`: getDBCache/setDBCache/delDBCache — memory hot cache + DB persistence
- `/home/jai/theserene/src/lib/retry.ts`: withRetry() con backoff exponencial
- `/home/jai/theserene/src/lib/logger.ts`: JSON estructurado con correlation-id, niveles debug/info/warn/error, filtro prod
- `/home/jai/theserene/src/lib/image-compression.ts`: WebP con fallback JPEG, compresión adaptativa
- `/home/jai/theserene/src/lib/webp.ts`: supportsWebP() + optimizeToWebP() con fallback JPEG
- `/home/jai/theserene/src/lib/streaming.ts`: AnalysisStream (SSE), createStreamGenerator, useAnalysisStream (hook React)
- `/home/jai/theserene/src/lib/seo-keywords.ts`: 20 keywords SEO predefinidas
- `/home/jai/theserene/src/lib/services/seo-generator.ts`: generateArticle() (con KEYWORD_CONTEXT), generateAndSaveArticle(), generateBatchArticles()
- `/home/jai/theserene/src/lib/repositories/index.ts`: 6 repositorios (Analysis, User, Payment, Blog, Product, Feedback) — imports desde `@/generated/prisma/client`
- `/home/jai/theserene/src/proxy.ts`: Auth proxy — protege /dashboard, /admin, /analysis. Login redirige a /dashboard
- `/home/jai/theserene/src/lib/db.ts`: PrismaClient con driver adapter pg — Prisma 7
- `/home/jai/theserene/src/lib/auth.ts`: NextAuth config con credentials + OAuth + callbacks + registerUser()
- `/home/jai/theserene/src/lib/openrouter.ts`: analyzeSkin(), scanProductIngredients(), callOpenRouterWithStream() — con withRetry
- `/home/jai/theserene/src/lib/services/analysis.service.ts`: usa AnalysisRepository + checkAndDeductUsage
- `/home/jai/theserene/src/lib/services/evolution.service.ts`: exporta getSkinEvolution + getUserEvolution (cache-aware)
- `/home/jai/theserene/src/lib/services/evolution-calculator.ts`: recalculateAndSaveEvolution + getCachedEvolution
- `/home/jai/theserene/src/lib/services/user.service.ts`: usa UserRepository
- `/home/jai/theserene/src/lib/services/webhook.service.ts`: recordWebhookEvent, markWebhookProcessed, markWebhookFailed, retryFailedWebhooks
- `/home/jai/theserene/src/lib/services/webhook-processor.ts`: processWebhookByProvider (Stripe + QvaPay) — importa WebhookEvent desde `@/generated/prisma/client`
- `/home/jai/theserene/src/lib/services/affiliate.service.ts`: searchAffiliateProducts, buildAffiliateLink — usa db-cache
- `/home/jai/theserene/src/lib/email.ts`: sendPasswordResetEmail() via Resend lazy, console.log fallback
- `/home/jai/theserene/src/lib/services/email-sequence.ts`: buildEmailSequence() (6 templates), sendEmail()
- `/home/jai/theserene/src/lib/services/email-processor.ts`: processEmailSequences() — segmentación por comportamiento
- `/home/jai/theserene/src/app/api/analyze/stream/route.ts`: SSE streaming con edge runtime, 7 etapas de progreso
- `/home/jai/theserene/src/app/api/og/route.tsx`: OG dinámico con skinType, analysisId, observations
- `/home/jai/theserene/src/app/api/register/route.ts`: register + welcome email
- `/home/jai/theserene/src/app/api/cron/generate-seo/route.ts`: Cron endpoint para generar artículos SEO — acepta `Authorization: Bearer` y `x-cron-secret`
- `/home/jai/theserene/src/app/api/cron/emails/route.ts`: Cron endpoint para email sequences — acepta `Authorization: Bearer` y `x-cron-secret`
- `/home/jai/theserene/src/app/api/cron/retention/route.ts`: Cron retención — notifica expiración + degrada suscripciones vencidas — acepta `Authorization: Bearer` y `x-cron-secret`
- `/home/jai/theserene/src/app/analizar-piel-gratis/page.tsx`: Landing SEO — análisis gratis
- `/home/jai/theserene/src/app/test-tipo-de-piel/page.tsx`: Landing SEO — test tipo piel
- `/home/jai/theserene/src/app/como-saber-mi-tipo-de-piel/page.tsx`: Landing SEO — guía tipo piel
- `/home/jai/theserene/src/app/analisis-de-piel-con-ia/page.tsx`: Landing SEO — análisis con IA
- `/home/jai/theserene/src/app/rutina-skincare-personalizada/page.tsx`: Landing SEO — rutina personalizada
- `/home/jai/theserene/src/app/ingredients-analyzer/page.tsx`: Landing SEO — analizador ingredientes
- `/home/jai/theserene/src/app/sitemap.ts`: Sitemap con 6 landing pages nuevas (priority 0.8-0.9)
- `/home/jai/theserene/.eslintrc.json`: Config ESLint con import/order, no-unused-vars, no-console, prefer-const, no-var, resolver TypeScript
- `/home/jai/theserene/.husky/pre-commit`: Hook lint-staged (tsc --noEmit + prettier)
- `/home/jai/theserene/src/lib/__tests__/streaming.test.ts`: 9 tests (stream, events, error, close, generator, hook)
- `/home/jai/theserene/src/lib/__tests__/webp.test.ts`: 6 tests (supportsWebP, optimizeToWebP)
- `/home/jai/theserene/src/lib/services/__tests__/email-sequence.test.ts`: 5 tests (sequence, days, name, URL, HTML)
- `/home/jai/theserene/src/lib/validations/__tests__/validations.test.ts`: 25 tests, todos los Zod schemas
- `/home/jai/theserene/src/lib/__tests__/api-response.test.ts`: 10 tests
- `/home/jai/theserene/src/lib/__tests__/csrf.test.ts`: 8 tests
- `/home/jai/theserene/src/lib/__tests__/cache.test.ts`: 7 tests
- `/home/jai/theserene/src/lib/services/__tests__/analysis.service.test.ts`: 4 tests
- `/home/jai/theserene/src/lib/services/__tests__/evolution.service.test.ts`: 8 tests
- `/home/jai/theserene/src/lib/services/__tests__/affiliate.service.test.ts`: 7 tests
- `/home/jai/theserene/src/lib/services/__tests__/sanitize.test.ts`: 11 tests
- `/home/jai/theserene/src/components/faq-section.tsx`: FAQ extraído para lazy-load
- `/home/jai/theserene/src/app/page.tsx`: FAQ dinámico con next/dynamic
- `/home/jai/theserene/src/app/layout.tsx`: PWA manifest link + sw.js registration + DNS preconnect + dns-prefetch
- `/home/jai/theserene/src/app/sitemap.ts`: changefreq/priority + productos dinámicos
- `/home/jai/theserene/prisma/seed.ts`: 10 blog posts, 10 productos, 2 usuarios — usa driver adapter para Prisma 7
- `/home/jai/theserene/vitest.config.ts`: Config Vitest con alias @/
- `/home/jai/theserene/public/manifest.json`: PWA manifest con colores marca
- `/home/jai/theserene/public/sw.js`: CacheFirst (static) + NetworkFirst (API) + clean activate
- `/home/jai/theserene/public/icons/icon-192.svg`: Icono placeholder
- `/home/jai/theserene/.husky/pre-commit`: Hook lint-staged (tsc --noEmit + prettier)
- `/home/jai/theserene/prisma/schema.prisma`: 19 modelos (User, Account, Session, VerificationToken, SkinAnalysis, BlogPost, Product, Payment, Subscription, PurchasePack, UsageTracking, Feedback, Clinic, AffiliateClick, ContactMessage, Cache, WebhookEvent, UserEvolution)
- `/home/jai/theserene/prisma.config.ts`: Prisma 7 config — datasource URL, migrations, seed
- `/home/jai/theserene/src/generated/prisma/`: Prisma 7 generated client (output path)
- `/home/jai/theserene/src/app/api/admin/blog/route.ts`: revalidateTag("blog-posts", {}) en POST/PUT/DELETE
- `/home/jai/theserene/src/app/api/admin/products/route.ts`: revalidateTag("products-catalog", {}) en POST/PUT/DELETE
- `/home/jai/theserene/src/app/api/admin/analytics/route.ts`: db.$transaction() — 5 queries batch
- `/home/jai/theserene/src/app/api/products/route.ts`: unstable_cache con revalidate=3600s + tag "products-catalog"
- `/home/jai/theserene/src/app/api/register/route.ts`: register + welcome email + rate limit 3/IP/24h
- `/home/jai/theserene/src/app/api/analysis/route.ts`: select mínimo en feedback (N+1 fix)
