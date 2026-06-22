## Goal
Transformar "The Serene Lens" de herramienta funcional a negocio sostenible con validación de producto, adquisición orgánica, evolución de datos, B2B e internacionalización, optimizando rendimiento, UX, seguridad y observabilidad.

## Constraints & Preferences
- Next.js 16 + TypeScript + Prisma 7 + next-auth v4 + @auth/prisma-adapter v2.8
- Spanish UI, English code. Diseño v2.0: paleta sage (#C2E09D), fondo #F8FAF5, cards blancas, sin neon/glass/dark mode
- Doble pasarela: Stripe (USD) + QvaPay (CUP). Posicionamiento: "observación cosmética, no diagnóstico médico"
- Prohibido: contadores ficticios, testimonios inventados, logs de PII en PostHog, llamadas síncronas sin timeout
- `tsconfig.json` con `strict: true` ya configurado
- URL de producción: `https://the-serene-lens-nuevo.onrender.com`

## Progress
### Done
- **Prisma 7 migration completa**: schema, config, db.ts, seed, imports, generate ejecutado. 21 modelos (RateLimit, AppConfig agregados)
- **Seed**: admin + demo users, 10 blog posts (5 categorías), 10 productos (8 categorías)
- **Tests Vitest**: 104 tests, 12 suites. Mock pattern: `vi.hoisted()` para Vitest v3
- **N1 - Build Turbopack**: `next.config.ts` con `transpilePackages`, `compiler.removeConsole`, CSP
- **N2 - CSRF**: `csrf.ts` con timingSafeEqual
- **N3 - API unificado**: `api-response.ts` + `error-codes.ts`. 24+ API routes
- **N4 - CacheAdapter**: `cache.ts` con interfaz, memory/Map, createRedisCache stub
- **N5 - Tests**: 12 test files, 104 tests
- **N6 - a11y**: aria-label, role="alert", role="status"
- **N7 - WebP**: image-compression.ts, webp.ts
- **N8 - Repository pattern**: 6 repos en `repositories/index.ts`
- **N9 - Logger estructurado**: correlation-id, JSON output
- **N12 - Robots/Sitemap**: sitemap.ts + robots.ts
- **N13 - Landing bundle**: FAQ lazy-load
- **Cache híbrida DB**: memory hot cache + tabla Cache Supabase
- **Retry mechanism**: `retry.ts` con backoff exponencial
- **Streaming SSE**: `AnalysisStream`, `createStreamGenerator`, `useAnalysisStream` hook
- **SEO Article Generator**: 20 keywords, cron diario via cron-job.org
- **Email Sequence**: 6 emails automáticos (Día 0-21) via Resend
- **SEO Landing Pages**: 6 páginas optimizadas
- **OG Dinámico**: `/api/og` con skinType, analysisId, productName
- **Cron jobs**: 3 endpoints — SEO (8am), emails (9am), retención (10am)
- **Cron-job.org**: 3 jobs apuntan a `the-serene-lens-nuevo.onrender.com`
- **Edge Runtime eliminado**: health, og, analyze/stream ahora usan Node.js runtime (Prisma compatibility)
- **crypto lazy import**: `auth.ts` usa `await import("crypto")` — sin warning Edge Runtime
- **Function() eval eliminado**: sentry.ts, analytics.ts, email.ts, email-sequence.ts usan `import()` nativo con try/catch. Paquetes opcionales instalados (posthog-js, @sentry/nextjs, resend)
- **Rate limiter DB-backed**: tabla `RateLimit` en Supabase. Reemplaza Map en memoria
- **Cron auth timing-safe**: `verifyCronSecret()` centralizado con `crypto.timingSafeEqual()`
- **QvaPay webhook blindado**: Solo confía en `getQvaPayPaymentStatus()` via GET. Nunca usa status del body
- **Post-AI sanitización**: `containsPercentages()` + `stripPercentages()` en openrouter.ts
- **SSE keep-alive**: Heartbeat `: keepalive\n\n` cada 4s en AnalysisStream
- **Photo validation yield**: `scheduler.yield()` antes de crear ImageBitmap
- **CUP rate dinámico**: tabla `AppConfig` en Supabase, `getCUPRate()` con unstable_cache (30min)
- **pricing.ts separado**: Sync constants para bundle cliente, `cup-rate.ts` async para server
- **Delete account blindado**: Limpieza de imageUrl + Supabase Storage (best-effort) + cascade completo (UserEvolution incluido)
- **Pack consumption order**: Pack credits primero (expiran en 30d), free credits después (resetea mensual)
- **SEO generator slug fix**: Usa keyword slug en vez de AI-generated slug (previene duplicados)
- **B2B rate limit**: register route con rate limit 10/IP/24h. analyze route ya usa userId:ip (no bloquea clínicas)
- **OAuth account linking**: `signIn` callback en auth.ts — auto-linka OAuth a cuenta existente con mismo email
- **Create-pack fallback QvaPay**: Si Stripe no está configurado, auto-fallback a QvaPay (sin 400)
- **Create fallback QvaPay**: Mismo fix para suscripciones
- **URL actualizada**: Todos los fallbacks hardcoded apuntan a `https://the-serene-lens-nuevo.onrender.com`
- **query-provider.tsx**: Componente pass-through (sin react-query dependency)
- **global.d.ts**: Tipos para `scheduler.yield()`
- **Schema actualizado**: RateLimit + AppConfig models agregados

### In Progress
- **CRON_SECRET env var en Render Dashboard**: Verificar que esté configurada como env var en Render

### Blocked
- **DB unreachable from CLI**: Schema pushes y seeds solo ejecutables desde entorno con acceso a Supabase
- **Stripe env vars vacíos**: STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, PRICE_IDs — fallback automático a QvaPay

## Key Decisions
- **Servicios usan repositorios**: Desacopla Prisma de lógica de negocio
- **Prisma 7 con driver adapter**: `@prisma/adapter-pg` + `pg`. `prisma.config.ts`
- **Cache híbrida sin deps extra**: memory/Map hot cache + tabla Cache en Supabase
- **Streaming SSE con edge runtime**: `AnalysisStream` + hook `useAnalysisStream`
- **SEO generator con contexto por keyword**: 20 keywords con instrucciones específicas
- **Email segmentation por comportamiento**: FREE sin análisis→onboarding, con análisis→conversión
- **Landing pages estáticas**: 6 páginas SEO sin datos dinámicos
- **OG dinámico con DB lookup**: Busca skinType en DB para imagen personalizada
- **Cron auth dual header**: Endpoints aceptan `Authorization: Bearer` y `x-cron-secret`
- **Guest auth gating**: Análisis requiere login. Sidebar/mobil-nav muestran links según sesión
- **Photo quality valida antes de comprimir**: Evita que compresión WebP degrade imagen
- **Service worker solo en producción**: En dev no se registra para evitar cache stale
- **Proxy sin withAuth**: Cookie check directo evita loop infinito
- **Rate limiter DB-backed**: Supabase en vez de Map en memoria (serverless-safe)
- **CUP rate from AppConfig**: Tabla de 1 registro, cache 30min, fallback a env var
- **Pack credits first**: Expiran en 30d, se usan antes que free monthly credits
- **SEO slug from keyword**: Previene duplicados cuando AI genera slug diferente
- **QvaPay auto-fallback**: Si Stripe no configurado, usa QvaPay automáticamente
- **OAuth auto-linking**: Cuenta OAuth se linka a credentials existente con mismo email

## Next Steps
1. Ejecutar seed en la DB de producción (Render Shell o Supabase Dashboard)
2. Configurar Stripe keys reales + price IDs (opcional — QvaPay funciona como fallback)
3. Configurar CRON_SECRET como env var en Render Dashboard
4. Verificar cron-job.org apunta a `the-serene-lens-nuevo.onrender.com`

## Critical Context
- **Build**: 0 warnings, 104 tests, ~2.5min con Turbopack
- **URL producción**: `https://the-serene-lens-nuevo.onrender.com`
- **DB**: PostgreSQL via Supabase. 21 modelos. Schema en `prisma/schema.prisma`
- **Auth**: NextAuth v4 + credentials + Google + GitHub. Auto-linking en signIn callback
- **Pagos**: QvaPay (CUP) como pasarela principal. Stripe como fallback cuando esté configurado
- **Cron**: 3 jobs via cron-job.org → `the-serene-lens-nuevo.onrender.com/api/cron/*`
- **Rate limit**: analyze (5/min por userId:ip), register (10/IP/24h), DB-backed
- **Env vars clave**: RESEND_API_KEY, CRON_SECRET, CRONJOB_API_KEY, POSTHOG_KEY, SENTRY_DSN
- **Paquetes opcionales instalados**: posthog-js, @sentry/nextjs, resend, @supabase/supabase-js
- **Funciones server-only**: `cup-rate.ts` (getCUPRate), `auth.ts` (registerUser, hashPassword)
- **Funciones client-safe**: `pricing.ts` (PLANS, PACKS, CUP_RATE como fallback)
- **Streaming**: 7 etapas, keep-alive heartbeat cada 4s
- **SEO**: 20 keywords, slug del keyword (no del AI), cron diario
- **Emails**: 6 templates, segmentación por comportamiento, Resend lazy
- **Delete account**: Limpia imageUrl, Supabase Storage (best-effort), UserEvolution, cascade completo
- **Pack consumption**: Pack credits primero, free credits después

## Relevant Files
- `/home/jai/theserene/.env`: URL producción `the-serene-lens-nuevo.onrender.com`. Stripe keys vacías
- `/home/jai/theserene/prisma/schema.prisma`: 21 modelos (incluye RateLimit, AppConfig)
- `/home/jai/theserene/src/lib/auth.ts`: NextAuth + credentials + OAuth auto-linking + crypto lazy import
- `/home/jai/theserene/src/lib/cron-auth.ts`: `verifyCronSecret()` con crypto.timingSafeEqual
- `/home/jai/theserene/src/lib/rate-limit.ts`: DB-backed (Supabase tabla RateLimit)
- `/home/jai/theserene/src/lib/cup-rate.ts`: getCUPRate() con unstable_cache + AppConfig lookup
- `/home/jai/theserene/src/lib/pricing.ts`: Sync constants (PLANS, PACKS, CUP_RATE). Sin DB import
- `/home/jai/theserene/src/lib/usage.ts`: Pack credits primero, free credits después
- `/home/jai/theserene/src/lib/openrouter.ts`: analyzeSkin + stripPercentages post-AI
- `/home/jai/theserene/src/lib/streaming.ts`: AnalysisStream + keep-alive heartbeat + emit() helper
- `/home/jai/theserene/src/lib/photo-quality.ts`: validatePhoto + scheduler.yield()
- `/home/jai/theserene/src/lib/sentry.ts`: import() nativo con try/catch
- `/home/jai/theserene/src/lib/analytics.ts`: import() nativo con try/catch
- `/home/jai/theserene/src/lib/email.ts`: import() nativo con try/catch
- `/home/jai/theserene/src/lib/services/email-sequence.ts`: import() nativo con try/catch
- `/home/jai/theserene/src/lib/services/seo-generator.ts`: slug usa selected.slug (no AI)
- `/home/jai/theserene/src/lib/services/payment.service.ts`: getCUPRate() async
- `/home/jai/theserene/src/app/api/user/delete-account/route.ts`: Storage cleanup + UserEvolution
- `/home/jai/theserene/src/app/api/payments/create-pack/route.ts`: Auto-fallback QvaPay
- `/home/jai/theserene/src/app/api/payments/create/route.ts`: Auto-fallback QvaPay
- `/home/jai/theserene/src/app/api/payments/webhook/route.ts`: QvaPay verification via GET
- `/home/jai/theserene/src/app/api/cron/generate-seo/route.ts`: verifyCronSecret
- `/home/jai/theserene/src/app/api/cron/emails/route.ts`: verifyCronSecret
- `/home/jai/theserene/src/app/api/cron/retention/route.ts`: verifyCronSecret
- `/home/jai/theserene/src/app/api/analyze/route.ts`: await checkRateLimit (DB-backed)
- `/home/jai/theserene/src/app/api/register/route.ts`: Rate limit 10/IP/24h
- `/home/jai/theserene/src/components/query-provider.tsx`: Pass-through (sin react-query)
- `/home/jai/theserene/src/global.d.ts`: Scheduler types
