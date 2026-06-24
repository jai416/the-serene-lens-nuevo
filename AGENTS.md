# AGENTS.md — The Serene Lens

## Project Status (2026-06-24)
**Código completo.** Todas las features implementadas:
- Landing page, análisis de piel con IA, historial, evolución
- Sistema de pagos QvaPay (planes + packs), webhooks, suscripciones
- Blog, productos, ingredientes, comunidad
- Diario de piel, desafíos gamificados
- Panel admin: usuarios, pagos, mensajes, blog, productos, analytics, envío de emails, health check
- Sistema de unsubscribe (CAN-SPAM/GDPR)
- Feature flags, health check, queue system, Sentry replays
- SEO: 55 keywords con contexto para generación de artículos
- 163 tests, type check limpio

**Pendiente solo configuración manual:**
1. `npx prisma db push` — crear tablas nuevas en Supabase (EmailLog, Unsubscribe, Challenge, indexes)
2. `CRON_SECRET` — agregar env var en Render Dashboard
3. Google/GitHub OAuth — configurar callbacks (opcional)

**Verificado en producción (2026-06-24):**
- Render: `https://the-serene-lens-nuevo.onrender.com` respondiendo OK (health check: DB connected)
- QvaPay API: Conexión exitosa, facturas creándose correctamente (transaction_uuid + URL generados)
- QvaPay Webhook: Endpoint funcionando en Render (`/api/payments/webhook`)
- OpenRouter API: Conectado (modelos disponibles)
- PostHog: Conectado (API responde)
- Sentry: Conectado (sentry.io accesible)
- CRON_SECRET: Generado en `.env` (pendiente en Render Dashboard)
- **Resend**: ⚠️ Dominio `theserenelens.com` NO verificado. Emails caerán en SPAM. Verificar en Resend → Settings → Domains.

## Test Commands
- `npm test` — run Vitest (163 tests across 16 suites)
- `npm run test:watch` — watch mode
- `npm run e2e` — Playwright tests (not yet configured)

## Test Files
- `src/lib/services/__tests__/evolution.service.test.ts` — 8 tests: empty, single, trends, multi-point, malformed JSON
- `src/lib/services/__tests__/analysis.service.test.ts` — 4 tests: usage limit, file size, success, language
- `src/lib/services/__tests__/affiliate.service.test.ts` — 7 tests: db-cache mock, API failure, timeout, tag, URL building
- `src/lib/services/__tests__/sanitize.test.ts` — 11 tests: HTML escape, non-string, obj sanitization
- `src/lib/validations/__tests__/validations.test.ts` — 44 tests: all Zod schemas (including diary, challenge)
- `src/lib/__tests__/api-response.test.ts` — 10 tests: apiResponse, apiError, ok, error, unauthorized, forbidden, notFound, serverError
- `src/lib/__tests__/csrf.test.ts` — 8 tests: token generation, validation, timingSafeEqual, constants
- `src/lib/__tests__/cache.test.ts` — 7 tests: get/set/del/clear/TTL/complex data
- `src/lib/services/__tests__/email-sequence.test.ts` — 5 tests: sequence, days, name, URL, HTML
- `src/lib/__tests__/streaming.test.ts` — 9 tests: stream, events, error, close, generator, hook
- `src/lib/__tests__/webp.test.ts` — 6 tests: supportsWebP, optimizeToWebP
- `src/lib/services/__tests__/diary.service.test.ts` — 7 tests: CRUD, weekly trend
- `src/lib/services/__tests__/challenge.service.test.ts` — 7 tests: CRUD, stats, validations
- `src/lib/services/__tests__/admin-email.service.test.ts` — 5 tests: send, bulk, recipients, counts
- `src/app/api/payments/webhook/__tests__/webhook.test.ts` — 8 tests: validation, not found, already completed, QvaPay errors, pack/subscription processing
- Mock pattern: `vi.hoisted()` for variables used in `vi.mock()` factory (Vitest v3 hoisting requirement)

## Seed Data
- `npm run seed` — creates admin + demo users, 10 blog posts (5 categories), 10 products (8 categories)
- Blog categories: cuidado-basico, rutinas, ingredientes, proteccion-solar, problemas-de-piel
- Product categories: limpiadores, hidratantes, serums, proteccion-solar, exfoliantes, mascarillas, aceites, contornos

## Commands (Project)
- `npm run dev` — start dev server (Turbopack by default in Next.js 16)
- `npm run build` — production build
- `npm run db:generate` — regenerate Prisma client
- `npm run db:push` — push Prisma schema to DB
- `npm run db:migrate` — run Prisma migrations
- `npm run db:studio` — Prisma Studio
- `npm run seed` — seed database
- `npm run type-check` — TypeScript type check (`tsc --noEmit`)

## Environment
All env vars documented in `.env.example`. Key vars:
- `DATABASE_URL` — PostgreSQL (Supabase)
- `NEXTAUTH_SECRET` — NextAuth secret
- `NEXT_PUBLIC_APP_URL` — base URL (`https://the-serene-lens-nuevo.onrender.com`)
- `NEXTAUTH_URL` — NextAuth URL (`https://the-serene-lens-nuevo.onrender.com`)
- `OPENROUTER_API_KEY` — AI analysis API
- `QVAPAY_UUID`, `QVAPAY_SECRET`, `QVAPAY_API_URL` — QvaPay payment gateway (v2 API)
- `RESEND_API_KEY` — transactional + bulk emails (from: `noreply@theserenelens.com`)
- `CRON_SECRET` — cron job authorization (pendiente en Render)
- `NEXT_PUBLIC_POSTHOG_KEY`, `NEXT_PUBLIC_POSTHOG_HOST` — product analytics
- `NEXT_PUBLIC_SENTRY_DSN` — error tracking
- `NEXT_PUBLIC_WHATSAPP_NUMBER` — WhatsApp contact
- `NEXT_PUBLIC_CUP_FALLBACK` — USD→CUP rate override

## Visual Identity (v2.0)
Clean, professional skincare platform inspired by Apple Health, Headspace, Calm, Skin Bliss, CeraVe, Cetaphil, La Roche-Posay, The Ordinary — calm, minimalist healthcare aesthetic.

### Palette
- **Primary**: #C2E09D (soft sage green)
- **Secondary**: #ECFFD3 (light mint)
- **Tertiary**: #FFF6AD (soft yellow)
- **Background**: #F8FAF5 (off-white)
- **Surface**: #FFFFFF (white)
- **Text primary**: #2F3A2D (dark olive)
- **Text secondary**: #64705E (muted olive)
- **Borders**: #DDE7D3 (light sage)

### What was removed
- All neon glow effects (`neon-glow`, `neon-glow-strong`, `animate-neon-pulse`)
- All scan/facial detection animations (`animate-scan-line`, `animate-spin-slow`)
- All glassmorphism (`glass-card`, `glass-sidebar`, `glass-mobile-nav`)
- Cyberpunk/futuristic aesthetic
- Aggressive gradients, bright borders
- Top horizontal navbar — all navigation moved to sidebar
- Percentages in analysis results (replaced with descriptive labels)
- Scan/futuristic hero elements (replaced with natural illustration)

### Dark Mode
- Custom theme provider (`src/components/theme-provider.tsx`) — no external deps
- Toggle: sun/moon/system cycle in sidebar + mobile nav
- Stored in localStorage, respects `prefers-color-scheme`
- Dark palette: Background #1A1F19, Surface #222920, Primary #C2E09D, Text #E8EDE6
- Applied via `.dark` class on `<html>` element

### Cards
- White background (`#FFFFFF`)
- Border: `1px solid #DDE7D3`
- Radius: `20px`
- Shadow: subtle `0 1px 3px rgba(47,58,45,0.04), 0 2px 8px rgba(47,58,45,0.06)`
- No backdrop-filter, no glass effect

### Buttons
- **Primary**: `bg-[#C2E09D]` dark text, hover `bg-[#B0D48E]`
- **Secondary**: white bg, `border-[#C2E09D]`, dark text
- **Outline**: `border-[#DDE7D3]`
- No neon shadows, no glow effects

### Sidebar
- White/dark background with `border-r`, `w-[280px]`
- Active state: `bg-[#F0F5EC]` / `dark:bg-[#2E3829]`
- Inactive: `text-[#64705E]` hover `bg-[#F8FAF5]` / `dark:text-[#9BAA93]` hover `dark:bg-[#2A3228]`
- Logo: `#C2E09D` background with `Flower2` icon
- Nav items: Inicio, Análisis de piel, Historial, Mi Diario, Desafíos, Comunidad, Productos, Ingredientes, Plan, Cuenta
- Theme toggle: sun/moon/system cycle (bottom section)
- Premium card at bottom (gradient-primary background, links to `/pricing`)
- Mobile: dark/light drawer with backdrop overlay
- User section at bottom: profile, sign out (or login link)

### Mobile Navigation
- Fixed bottom bar visible on mobile (`md:hidden`)
- 5 items: Inicio, Análisis, Historial, Productos, Cuenta
- Dark mode support with `dark:` Tailwind classes
- White/dark background, `border-t`, active state dot indicator

## Conventions
- Spanish UI, English code
- Mobile-first, light/dark mode support
- Tailwind v4 with `tw-animate-css` (NOT `tailwindcss-animate`)
- CSS animations only — no Framer Motion
- `sonner` for toasts (Toaster in root layout)
- Zod v4 (use `.issues` not `.errors`)
- Prisma 7 + next-auth v4 + `@auth/prisma-adapter` v2.8

## Key Decisions
- **PrismaAdapter type**: `PrismaAdapter(db) as any` — version mismatch between adapter v2.8 and next-auth v4.24
- **Prisma 7 migration**: `prisma.config.ts` en root con datasource URL. Generator `prisma-client` con output `../src/generated/prisma`. Driver adapter `@prisma/adapter-pg` + `pg` requerido. Imports desde `@/generated/prisma/client`.
- **Auth guards**: Use `redirect()` from `next/navigation` in client components during render. Safe with React 19 + Next.js 16.
- **SessionProvider**: Configured with `refetchOnWindowFocus={false}`, `refetchInterval={5 * 60}`, `refetchWhenOffline={false}` to prevent spurious re-renders.
- **Turbopack root**: `next.config.ts` sets `turbopack.root` to the project directory to prevent Next.js from picking up a parent-level `package-lock.json` that causes HMR issues and repeated API calls.
- **Webhook security**: QvaPay v2 uses `app-id`/`app-secret` headers for auth; webhook verifies payment status via GET `/v2/transaction/{uuid}`
- **Payments**: QvaPay only (v2 API). Auth via `app-id`/`app-secret` headers. Invoice creation at `/v2/create_invoice`.
- **Plan prices**: FREE (1 analysis/mo), PREMIUM ($4.99/mo unlimited), PRO ($9.99/mo unlimited). ULTRAPREMIUM renamed to PRO.
- **Pack prices**: BASIC $1.99 (3 análises), POPULAR $4.99 (5), ADVANCED $6.99 (15). Plans unchanged (FREE $0, PREMIUM $4.99, PRO $9.99).
- **Pack expiration**: Packs expire 30 days after purchase. `lib/usage.ts` filters packs by `createdAt >= now - 30 days`. No schema change needed — `createdAt` field on `PurchasePack` is used.
- **CUP rate**: Default changed from 300 to 500 (`NEXT_PUBLIC_CUP_FALLBACK = 500`).
- **Usage tracking**: backend-enforced via `lib/usage.ts` — checks `analysisLimit`/`analysisUsed` + pack analyses (non-expired only) at `/api/analyze`
- **Multi-photo AI**: All uploaded photos are sent to the AI model via the `imagesBase64` array (was: only the first photo)
- **`findings` field removed**: The `SkinAnalysis.findings` DB field was dead code — never read in any frontend. Removed from schema and API.
- **Login page at `/login`**: Created to replace the broken `signIn: "/"` config. Includes email/password form, social logins, and register toggle. Calls `POST /api/register` + `signIn("credentials")`.
- **ESLint config**: `.eslintrc.json` con reglas import/order (alfabético, agrupado), no-unused-vars, no-console, prefer-const, no-var, resolver TypeScript.
- **Turbopack default**: Next.js 16 uses Turbopack for both dev and build.
- **Slow filesystem**: initial compile is 40-105s on this machine; subsequent requests cache and load in 1-4s
- **Delete `.next/`** if you get artifact build errors like `required-server-files.json` not found
- **`navbar.tsx` deleted**: Top horizontal navigation removed entirely. All navigation is in the sidebar + mobile nav.
- **`Flower2` brand icon**: Replaced `Scan` icon across sidebar, hero, footer. Represents skincare/nature.
- **`gradient-primary`**: Subtle green gradient `linear-gradient(135deg, #C2E09D, #DAF0B8)` kept for icon backgrounds and accent elements.
- **CSS variables kept**: `text-muted-foreground`, `text-on-surface-variant`, `bg-muted`, `border-outline` etc. redefined in `globals.css@theme` with new palette values — they work correctly.
- **No percentages in results**: Analysis results use descriptive labels (Bajo, Moderado, Visible, Leve, Alto) — never percentages.
- **Cache híbrida**: `src/lib/cache/db-cache.ts` — memory Map como hot cache + tabla `Cache` en Supabase como persistencia. Affiliate service usa `getDBCache`/`setDBCache` para persistencia entre instancias serverless.
- **Retry mechanism**: `src/lib/retry.ts` con `withRetry()` (backoff exponencial, 3 retries default). OpenRouter envuelve ambos fetch calls.
- **Webhook processor desacoplado**: `webhook-processor.ts` maneja lógica de negocio (upgrade de plan, gestión de suscripciones). `webhook.service.ts` solo maneja registro + reintentos.
- **Evolution pre-calculada**: `evolution-calculator.ts` cachea resultados en modelo `UserEvolution`. `getUserEvolution()` checkea cache antes de recalcular.
- **Analytics en transacción**: `/api/admin/analytics` usa `db.$transaction()` — 6 consultas en un roundtrip a Supabase.
- **revalidateTag en Next.js 16**: requiere segundo argumento `{}` (CacheLifeConfig). Admin routes lo usan para invalidar "blog-posts" y "products-catalog".
- **unstable_cache products**: `/api/products` cachea con revalidate=3600s + tag "products-catalog".
- **Anti-fraud register**: `/api/register` rate limit 3 registros/IP en 24h (in-memory Map).
- **Cron retención**: Notifica 3 días antes de expiración + degrada suscripciones vencidas. Usa `sendEmail` (no `sendPasswordResetEmail`). Cron diario 10am via cron-job.org.
- **Sidebar Ingredientes**: Link apunta a `/ingredients-analyzer` (landing SEO), no a `/products`.
- **CRON_SECRET**: Generado con `crypto.randomBytes(32)`, en `.env`. Necesario como env var en Render para autorizar cron endpoints.
- **QvaPay v2 only (Stripe fully removed)**: Deleted all Stripe code files and env vars. Dead code completely cleaned.
- **Lazy env loading in payments.ts**: `getEnv()` at module level caused crashes on Render when env vars missing. Changed to `getPaymentsEnv()`.
- **In-memory queue over BullMQ**: No Redis dependency; queue system is swappable to BullMQ later.
- **Feature flags via AppConfig table**: No external service; cached 60s; admin API + React component.
- **Service layer pattern for diary/challenges**: Business logic separated from API routes; enables testing and reuse.
- **Image compression adapts to connection**: Uses `navigator.connection.effectiveType` for dynamic quality/resolution.
- **Sentry replays**: Session replay 0.1 sampling, error replay 1.0, text masking for privacy compliance.
- **Admin email sender**: Resend batch API (100 per call), segment targeting, 3 HTML templates, unsubscribe compliance, email logging.
- **Unsubscribe system**: Required by CAN-SPAM/GDPR. All email footers include `/unsubscribe` link. Unsubscribe records stored in DB, excluded from bulk sends.

## Performance Notes
- `SessionProvider` uses `refetchOnWindowFocus={false}` — prevents session fetch on every window focus event
- API routes return `Cache-Control: private, max-age=10, s-maxage=30` where appropriate
- `GET /api/analysis/[id]` uses `select` to avoid fetching unnecessary fields
- Prisma compound index `@@index([userId, createdAt])` speeds up history queries
- Image compression skips canvas processing for files < 100KB
- Protected pages (dashboard, admin) use render-time `redirect()` instead of `useEffect` redirect for immediate navigation
- `turbopack.root` configured in `next.config.ts` to prevent wrong lockfile detection and HMI issues
- **Cache híbrida**: `db-cache.ts` cachea en memory primero, persiste en DB. Affiliate products cachean 24h
- **unstable_cache**: `/api/products` cachea con revalidate=3600s + tag — evita hits DB en cada request
- **revalidateTag**: Admin blog/products routes invalidan caché tras crear/editar/eliminar
- **Edge Runtime**: `/api/health` y `/api/og` usan edge — 0 cold starts
- **Compound queries**: Analytics usa `db.$transaction()` — reduce roundtrips a Supabase
- **DNS prefetch**: Layout pre-conecta a Resend, Sentry, QvaPay
- **N+1 prevention**: `/api/analysis` incluye feedback con `select` mínimo
- **FAQ lazy-load**: `faq-section.tsx` con `next/dynamic` — ~15KB off main bundle
- **Seasonal hero**: Messages based on Southern Hemisphere seasons (Cuba)
- **Explainable AI**: AI returns `observationExplanations` and `confidenceReason` for user transparency
- **Age-based recommendations**: AI prompt includes decade-specific skincare priorities
- **Slow connection adaptation**: `use-slow-connection.ts` hook detects 2G/3G, reduces image compression quality/resolution
- **Service worker**: `public/sw.js` — cache-first for static assets, stale-while-revalidate for pages, network-first for APIs
- **Queue system**: `lib/queue.ts` — in-memory queue with retry, exponential backoff, auto-cleanup. Swappable to BullMQ+Redis.
- **Admin dashboard auto-refresh**: 10s interval, "Hoy" metrics (newUsersToday, analysesToday), timestamp
- **Prisma indexes**: Added indexes on User(plan, role, createdAt), Payment(status, createdAt, userId+status), Subscription(provider, currentPeriodEnd), PurchasePack(status, userId+status, createdAt), WebhookEvent(provider, provider+eventType), SkinDiary(userId+date), Challenge(active, createdAt)
- **Lazy image loading**: `LazyChart` component wraps `EvolutionChart` with `next/dynamic` + skeleton
- **Feature flags**: `lib/feature-flags.ts` — AppConfig table, 60s cache, admin API + React component

## Security
- **Rate limiting**: DB-backed via `lib/rate-limit.ts` — `/api/contact` (5/hour/IP), `/api/feedback/survey` (10/day/user), `/api/register` (3/day/IP in-memory)
- **Input sanitization**: All user inputs stripped of HTML tags via regex before DB storage
- **CRON_SECRET**: Timing-safe comparison with `crypto.timingSafeEqual`
- **CSRF**: Token generation and validation in `lib/csrf.ts`
- **Auth guards**: `redirect()` from `next/navigation` in client components during render
- **Webhook security**: QvaPay verified via GET `/v2/transaction/{uuid}` with app credentials
- **No PII in analytics**: PostHog tracks events only, no email/name in logs
- **Correlation IDs**: Middleware injects `x-correlation-id` on every request for tracing
- **Sentry replays**: Session replay 0.1, error replay 1.0, text masking, media blocking for privacy
- **Structured logging**: `logger.child()` with service context, typed `.http()`, `.db()`, `.auth()`, `.payment()` methods
- **Health check**: `/api/health` returns DB latency, queue stats, memory usage, uptime, version

## Pricing & Plans
Prices defined in `src/lib/pricing.ts` — single source of truth.
- CUP conversion: `NEXT_PUBLIC_CUP_FALLBACK` (env) with fallback to **500**
- Display: USD + CUP always shown together
- Packs expire 30 days after purchase (filtered in `lib/usage.ts` via `createdAt >= cutoff`)

| Product | Price | Details |
|---------|-------|---------|
| Essential (FREE) | $0 | 1 analysis/mo, forever |
| Premium | $4.99/mo | Unlimited analyses, history, evolution comparison |
| Pro | $9.99/mo | Everything Premium, priority processing, early access |
| Pack Básico | $1.99 | 3 analyses, history unlocked, 30 days |
| Pack Popular | $4.99 | 5 analyses, comparison, 30 days |
| Pack Avanzado | $6.99 | 15 analyses, priority, 30 days |

## Page Structure
- `/` — landing page: hero with seasonal messages (climate-aware), badge + title + CTAs, 4 action cards (Análisis, Historial, Rutinas, Ingredientes), quick skin test (3 questions), how-it-works, features, pricing preview, FAQ, legal disclaimer
- `/about` — founding story: "Soy un programador que se hartó de apps de skincare que inventaban porcentajes." Mission, values (honesty, transparency, no fake percentages), CTA
- `/login` — sign in / register page (email/password, Google, GitHub). NextAuth `signIn` page set to `/login`
- `/analysis` — 4-step guided wizard: Consent → Photo Assistant (frontal/perfil izq/perfil der/acercamiento opcional, one at a time with validation) → Questions (age, sex, climate, concern, routine) → Processing → redirect to results
- `/analysis/results/[id]` — 8 sections: Resumen General, Tipo de Piel Observado, Observaciones Detectadas (with explainable AI tooltips), Factores Observados, Recomendaciones, Rutina, Productos, Historial + legal disclaimer + satisfaction survey + social sharing. No percentages, only descriptive labels. Auto-saves to user history.
- `/products` — product scanner (sends single photo of ingredients label) + catalog
- `/products/[slug]` — product detail with ingredients + Schema.org JSON-LD
- `/blog/[slug]` — article body + Schema.org JSON-LD
- `/community` — forum with categories, post creation, comments
- `/dashboard/diary` — daily skin diary with calendar grid, feeling tracking
- `/dashboard/challenges` — gamification challenges with points
- `/dashboard/referrals` — referral program management
- `/products/[slug]` — product detail with ingredients
- `/pricing` — subscriptions + packs, USD/CUP, QvaPay payments
- `/blog` — articles with category filter
- `/blog/[slug]` — article body
- `/contact` — contact form (posts to `/api/contact`)
- `/dashboard/` — user dashboard, quick access cards, recent analyses
- `/dashboard/history` — chronological timeline of past analyses
- `/dashboard/subscription` — plan status, usage bars, payment history
- `/dashboard/profile` — user profile form
- `/ingredients-analyzer` — SEO landing page for ingredient scanning
- `/admin/` — admin panel: users, payments, messages, blog, products, analytics, emails, health check (DB latency, queue, memory, uptime)
- `/admin/emails` — bulk email sender: segment targeting (all/free/premium/pro/active/inactive/new), 3 templates (announcement/promotion/newsletter), preview mode, send history
- `/unsubscribe` — unsubscribe page for marketing emails (linked from all email footers)

## Photo Upload (Guided Assistant)
- `/analysis` — 4 photo steps shown one at a time, not a grid
  - Paso 1: Foto frontal (obligatoria)
  - Paso 2: Perfil izquierdo (obligatoria)
  - Paso 3: Perfil derecho (obligatoria)
  - Paso 4: Acercamiento opcional de zona de interés
- Each step shows: instruction, tip (lighting/position), visual example hint
- Progress dots indicator at top
- Photos validated for type, size (<10MB), blur, brightness before accepting
- Can navigate back/forward between steps

## Photo Quality Validation
- `src/lib/photo-quality.ts` — client-side validation of uploaded photos before analysis
- Uses `OffscreenCanvas` + `createImageBitmap` to analyze image data without DOM manipulation
- **Blur detection**: Laplacian variance across the image. Threshold: variance ≥ 30 passes
- **Brightness check**: Average grayscale luminance. Threshold: 40–220 passes
- `validatePhoto(file: File)` returns `PhotoQualityResult` with `{ pass, blur, brightness }` diagnostics
- Called in `handlePhoto` callback in analysis page — runs AFTER `compressImage()`. If `!result.pass`, sets inline error and does NOT accept the photo
- Error messages are actionable: "Foto muy borrosa", "Foto muy oscura", "Foto muy sobreexpuesta" with guidance on how to fix

## Analysis Results
- 8 organized sections, each in a card:
  1. Resumen General — overview + key stats (skin type, confidence, categories observed, recommendations count)
  2. Tipo de Piel Observado — descriptive classification with caveat
  3. Observaciones Detectadas — table of factors with severity badges (Bajo/Moderado/Visible/Leve/Alto)
  4. Factores Observados en la Imagen — bullet list of detailed observations
  5. Recomendaciones Cosméticas — actionable suggestions
  6. Rutina Sugerida — morning + evening routine cards with numbered steps
  7. Productos Compatibles — link to catalog + ingredient scanner
  8. Historial Relacionado — link to history + new analysis CTA
- Legal disclaimer always shown at bottom: "Esta herramienta ofrece observaciones cosméticas orientativas..."
- No percentages anywhere — only descriptive labels and severity badges

## Legal Pages
- `/terms` — expanded terms: medical disclaimer, AI limitations (lighting, quality, makeup can affect results), subscription/pack terms (30-day expiration, QvaPay), acceptable use, liability limitation.
- `/privacy` — expanded privacy: what data collected (photos sent to OpenRouter for analysis, not used for training), storage (Supabase, encrypted), user rights (access, correction, deletion, export), cookies (essential only).

## Auth Flow
- `/login` — sign-in form (credentials + social). Created because `auth.ts` had `signIn: "/"` causing all `/api/auth/signin` redirects to loop back to home.
- `POST /api/register` — creates user account. Calls `registerUser()` from `lib/auth.ts`.
- `/forgot-password` — enter email, generates reset token stored in `VerificationToken` model (1hr expiry). In dev mode, shows reset link on-screen.
- `/reset-password` — reads `token` + `email` from URL, creates new password. Validates token, updates password (scrypt), deletes used token.
- `POST /api/auth/forgot-password` — generates token via `crypto.randomUUID()`, stores in `VerificationToken`, returns reset link.
- `POST /api/auth/reset-password` — validates token via `identifier_token` compound key, updates password, deletes token.
- Dashboard redirects (`redirect("/api/auth/signin")`) still use NextAuth's endpoint which now redirects to `/login?callbackUrl=...` preserving return path.
- Sidebar and homepage CTA link directly to `/login`.
- "¿Olvidaste tu contraseña?" link appears below the login form.
- **Middleware**: `/login` page redirects authenticated users to `/dashboard` (via `authorized: false`).
- **Admin users**: Created with `plan: "PRO"` (not "ULTRAPREMIUM") to match pricing definitions.

## API Routes (Analysis)
- `POST /api/analyze` — requires auth, checks usage BEFORE calling AI (no wasted API calls), saves `skinType` from AI result, deducts usage atomically. Returns `{ analysis, result }`.

## API Routes (Diary & Challenges)
- `GET /api/skin-diary` — returns diary entries (last 30 days) + weekly trend
- `POST /api/skin-diary` — create or update diary entry (date, feeling 1-5, notes)
- `DELETE /api/skin-diary/[id]` — delete diary entry (ownership enforced)
- `GET /api/challenges` — returns active challenges with user completion status + total points
- `POST /api/challenges/[id]/complete` — mark challenge as completed, return points earned
- `GET /api/admin/challenges` — list all challenges (admin only)
- `POST /api/admin/challenges` — create new challenge (admin only)
- `PATCH /api/admin/challenges/[id]` — update challenge (admin only)
- `DELETE /api/admin/challenges/[id]` — deactivate challenge (admin only)
- `GET /api/admin/feature-flags` — list all feature flags (admin only)
- `POST /api/admin/feature-flags` — create/update feature flag (admin only)

## API Routes (Admin Emails)
- `POST /api/admin/emails/send` — send bulk emails via Resend batch API. Body: `{ subject, html, segment, preview?, previewEmail? }`. Segments: all, free, premium, pro, active, inactive, new. Preview mode sends only to admin email.
- `GET /api/admin/emails/history` — email send history with pagination + recipient counts per segment
- `POST /api/unsubscribe` — unsubscribe from marketing emails. Body: `{ email, reason? }`. Stored in Unsubscribe model.
- `GET /api/unsubscribe?email=` — check if email is unsubscribed

## API Routes (Payments)
- `POST /api/payments/create` — creates QvaPay invoice. Body: `{ plan, provider }`
- `POST /api/payments/create-pack` — creates QvaPay pack invoice. Body: `{ packType, provider }`
- `POST /api/payments/webhook` — QvaPay webhook (subscriptions + packs)
- `GET /api/user/usage` — returns usage info for current user
- `GET /api/admin/analytics` — revenue by provider, plan distribution, conversion rate

## Known Issues
- **Resend domain NO verificado**: `theserenelens.com` no está verificado en Resend. Los emails caerán en SPAM. Solución: ir a Resend → Settings → Domains → agregar y verificar `theserenelens.com` con registros DNS (DKIM/SPF).
- **npm install falla**: `node_modules` corrupto (ENOTEMPTY). Solución: `rm -rf node_modules .next && npm install --legacy-peer-deps`
- **Prisma 7 driver adapter**: Requires `pg` + `@prisma/adapter-pg` installed. `prisma generate` must run after install.
- **DB push pendiente**: Ejecutar `npx prisma db push` desde entorno con acceso a Supabase para crear tablas `EmailLog`, `Unsubscribe`, `Challenge`, indexes.
- **CRON_SECRET pendiente**: Agregar env var `CRON_SECRET` en Render Dashboard (valor en `.env`). Los cron endpoints no funcionarán sin esto.
