# AGENTS.md — The Serene Lens

## Project Status (2026-07-01)
**Código completo + auditoría + mejoras implementadas.**
- Landing page, análisis de piel con IA, historial, evolución
- Sistema de pagos QvaPay (planes + packs), webhooks, suscripciones
- **3 métodos de pago**: QvaPay, Transfermóvil (validar/activar), PayPal (mock)
- Blog, productos, ingredientes, comunidad (con comentarios)
- Diario de piel, desafíos gamificados (solo visualización, sin completar manual)
- Panel admin: usuarios, pagos, mensajes, blog, productos, guías, feature flags, analytics, health check
- Feature flags, health check, queue system
- SEO: 55 keywords con contexto para generación de artículos
- **PRO+ plan** ($14.99/mes): informe PDF, rutina dinámica, comparativa mensual
- **Modo Social**: comparación anónima de resultados con amigos
- **Guías Digitales**: e-books descargables vendidos vía QvaPay (con fileUrl en seed)
- **Sistema de Referidos Grupal**: invita 3 amigos → análisis gratis
- **Predictor de Envejecimiento**: proyección a 5 años con IA + RAG de ingredientes
- **Telegram Bot integrado como webhook**: /start, /status, /pending, /cliente, /validar, /activar, /reporte
- 174 tests, type check limpio, build exitoso (94 páginas estáticas)

**Pendiente solo configuración manual:**
1. `npx prisma db push` — sync tablas nuevas + enums
2. `CRON_SECRET` — agregar env var en Render Dashboard
3. Google/GitHub OAuth — configurar callbacks (opcional)
4. `npm run seed` en producción — poblar productos, guías y desafíos (ahora incluye fileUrl)
5. Subir PDFs reales a hosting y actualizar `fileUrl` en admin de guías

**Verificado en producción (2026-07-01 live tests):**
- 23/23 tests pasados en sitio en vivo
- Render: `https://the-serene-lens-nuevo.onrender.com` respondiendo OK
- QvaPay API: Conexión exitosa
- QvaPay Webhook: Endpoint funcionando
- OpenRouter API: Conectado
- PostHog: Conectado (errores de red por proxy, no del código)
- Sentry: DSN inválido (403 Forbidden), configs deshabilitadas
- CRON_SECRET: Generado en `.env` (pendiente en Render Dashboard)
- **Resend**: ✅ Clave actualizada (`re_ML6bsVSK_...`). Usando `onboarding@resend.dev` como from. Solo admin bulk emails.

## Test Commands
- `npm test` — run Vitest (174 tests across 16 suites)
- `npm run test:watch` — watch mode
- `npm run e2e` — Playwright tests (not yet configured)

## Test Files
- `src/lib/services/__tests__/evolution.service.test.ts` — 8 tests
- `src/lib/services/__tests__/analysis.service.test.ts` — 4 tests
- `src/lib/services/__tests__/affiliate.service.test.ts` — 7 tests
- `src/lib/services/__tests__/sanitize.test.ts` — 11 tests
- `src/lib/validations/__tests__/validations.test.ts` — 44 tests
- `src/lib/__tests__/api-response.test.ts` — 10 tests
- `src/lib/__tests__/csrf.test.ts` — 8 tests
- `src/lib/__tests__/cache.test.ts` — 7 tests
- `src/lib/services/__tests__/email-sequence.test.ts` — 5 tests
- `src/lib/__tests__/streaming.test.ts` — 9 tests
- `src/lib/__tests__/webp.test.ts` — 6 tests
- `src/lib/services/__tests__/diary.service.test.ts` — 7 tests
- `src/lib/services/__tests__/challenge.service.test.ts` — 7 tests
- `src/lib/services/__tests__/admin-email.service.test.ts` — 7 tests
- `src/app/api/payments/webhook/__tests__/webhook.test.ts` — 19 tests
- Mock pattern: `vi.hoisted()` for variables used in `vi.mock()` factory (Vitest v3 hoisting requirement)

## Seed Data
- `npm run seed` — creates admin + demo users, 10 blog posts (5 categories), 50 products (10 categories), 30 challenges (10 daily, 10 weekly, 10 monthly), 5 community posts, 5 digital products (e-books)
- Blog categories: cuidado-basico, rutinas, ingredientes, proteccion-solar, problemas-de-piel
- Product categories: limpiadores, hidratantes, serums, proteccion-solar, exfoliantes, mascarillas, aceites, contornos
- **IMPORTANT**: Seed must be run on production after deploy: `npm run seed`

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
- `RESEND_API_KEY` — bulk admin emails only (NOT used for registration/welcome)
- `CRON_SECRET` — cron job authorization (pendiente en Render)
- `NEXT_PUBLIC_POSTHOG_KEY`, `NEXT_PUBLIC_POSTHOG_HOST` — product analytics
- `NEXT_PUBLIC_SENTRY_DSN` — error tracking
- `NEXT_PUBLIC_WHATSAPP_NUMBER` — WhatsApp contact
- `NEXT_PUBLIC_CUP_FALLBACK` — USD→CUP rate override
- `ROOT_ADMIN_EMAIL` — email that gets ADMIN role on registration

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

### Dark Mode
- Custom theme provider (`src/components/theme-provider.tsx`) — no external deps
- Toggle: sun/moon/system cycle in sidebar + mobile nav
- Stored in localStorage, respects `prefers-color-scheme`
- Dark palette: Background #1A1F19, Surface #222920, Primary #C2E09D, Text #E8EDE6
- Applied via `.dark` class on `<html>` element

## Conventions
- Spanish UI, English code
- Mobile-first, light/dark mode support
- Tailwind v4 with `tw-animate-css` (NOT `tailwindcss-animate`)
- CSS animations only — no Framer Motion
- `sonner` for toasts (Toaster in root layout)
- Zod v4 (use `.issues` not `.errors`)
- Prisma 7 + next-auth v4 + `@auth/prisma-adapter` v2.8

## Key Decisions
- **ok() wrapper**: All API routes use `ok()`/`error()`/`unauthorized()`/`forbidden()`/`notFound()`/`serverError()` from `@/lib/api-response`. Returns `{ success: true, data: {...} }`. Frontend accesses via `d?.data?.X || d.X`. Exception: routes needing custom headers (Cache-Control) use `NextResponse.json` directly.
- **XSS sanitization en emails**: `sanitizeHtml()` de `@/lib/sanitize` se usa en TODOS los templates de email que interpolan datos de usuario (`name`, `clinic.name`, `skinType`, observaciones, recomendaciones). Protege contra `<script>` en nombres de usuario.
- **Stripe removed from schema**: `stripeCustomerId`, `stripePaymentId`, `stripeSubscriptionId` eliminados. `Subscription.provider` default cambiado a `"qvapay"`. Requiere `npx prisma db push`.
- **No email on registration**: Welcome message shown on-screen via `/dashboard?welcome=1` banner. No external email service needed for registration. Resend only used for admin bulk emails.
- **Challenges display-only**: Challenge "Complete" button removed from frontend. Challenges are view-only gamification. Points are tracked but cannot be earned manually.
- **Image compression >10MB**: Files over 10MB are compressed with aggressive settings (640px, quality 0.4) instead of throwing an error.
- **Products API direct DB**: No `unstable_cache` — Render serverless caches empty results. Products queried directly from DB on each request.
- **PrismaAdapter type**: `PrismaAdapter(db) as any` — version mismatch between adapter v2.8 and next-auth v4.24
- **Prisma 7 migration**: `prisma.config.ts` en root con datasource URL. Generator `prisma-client` con output `../src/generated/prisma`. Driver adapter `@prisma/adapter-pg` + `pg` requerido. Imports desde `@/generated/prisma/client`.
- **Auth guards**: Use `redirect()` from `next/navigation` in client components during render. Safe with React 19 + Next.js 16.
- **SessionProvider**: Configured with `refetchOnWindowFocus={false}`, `refetchInterval={5 * 60}`, `refetchWhenOffline={false}` to prevent spurious re-renders.
- **Webhook security**: QvaPay v2 uses `app-id`/`app-secret` headers for auth; webhook verifies payment status via GET `/v2/transaction/{uuid}`
- **Payments**: QvaPay only (v2 API). Auth via `app-id`/`app-secret` headers. Invoice creation at `/v2/create_invoice`.
- **Plan prices**: FREE (1 analysis/mo), PREMIUM ($4.99/mo unlimited), PRO ($9.99/mo unlimited). ULTRAPREMIUM renamed to PRO.
- **Pack prices**: BASIC $1.99 (3 analyses), POPULAR $4.99 (5), ADVANCED $6.99 (15).
- **Pack expiration**: Packs expire 30 days after purchase.
- **CUP rate**: Default 500 (`NEXT_PUBLIC_CUP_FALLBACK = 500`).
- **Usage tracking**: backend-enforced via `lib/usage.ts`
- **Multi-photo AI**: All uploaded photos sent to AI model via `imagesBase64` array
- **Login page at `/login`**: Email/password form, social logins, register toggle.
- **ESLint config**: `.eslintrc.json` con reglas import/order, no-unused-vars, no-console
- **Turbopack default**: Next.js 16 uses Turbopack for both dev and build.
- **`navbar.tsx` deleted**: All navigation in sidebar + mobile nav.
- `lib/validation.ts` eliminado — todo usa `lib/validations/index.ts`
- `next-intl` eliminado de dependencias
- **`Flower2` brand icon**: Represents skincare/nature.
- **Cache híbrida**: `src/lib/cache/db-cache.ts` — memory Map + Supabase table.
- **Retry mechanism**: `src/lib/retry.ts` con `withRetry()`.
- **Webhook processor desacoplado**: `webhook-processor.ts` maneja lógica de negocio.
- **Evolution pre-calculada**: `evolution-calculator.ts` cachea resultados.
- **Analytics en transacción**: `/api/admin/analytics` usa `db.$transaction()`.
- **Anti-fraud register**: `/api/register` rate limit 10 registros/IP en 24h.
- **Cron retención**: Notifica 3 días antes de expiración + degrada suscripciones vencidas.
- **Sidebar Ingredientes**: Link apunta a `/ingredients-analyzer`.
- **QvaPay v2 only (Stripe fully removed)**: Deleted all Stripe code files and env vars.
- **Lazy env loading in auth.ts/openrouter.ts**: `getAuthEnv()` with try/catch instead of module-level `getEnv()` crash. Providers use `process.env` directly.
- **Lazy env loading in payments.ts**: `getPaymentsEnv()` instead of `getEnv()` at module level.
- **In-memory queue over BullMQ**: No Redis dependency.
- **Feature flags via AppConfig table**: No external service; cached 60s.
- **Service layer pattern for diary/challenges**: Business logic separated from API routes.
- **Image compression adapts to connection**: Uses `navigator.connection.effectiveType`.
- **Sentry replays**: Session replay 0.1, error replay 1.0, text masking (DESHABILITADO — DSN inválido)
- **Admin email sender**: Resend batch API (100 per call), segment targeting.
- **Unsubscribe system**: CAN-SPAM/GDPR compliance. All email footers include `/unsubscribe`.
- **Admin panel auth check**: Each API route uses `getServerSession()` + `role !== "ADMIN"` check. No middleware-level admin protection.
- **Admin panel dark mode**: All admin pages support dark mode with `dark:` prefix classes.
- **Admin stats real metrics**: `newUsersThisWeek` computed from DB (not hardcoded 0). `activeUsers` = paid users count.
- **Mobile responsive CSS**: `@media (max-width: 640px)` and `(max-width: 480px)` breakpoints in `globals.css` for text sizes, buttons, inputs.
- **Profile page**: Has both "Cerrar sesión" (signOut) and "Eliminar cuenta" (delete account) buttons, visually separated.
- **Sentry init dedup**: `src/lib/sentry.ts` `initSentry()` is a no-op — Sentry auto-initializes via `sentry.client.config.ts`. Prevents replay rate override.
- **Payments Zod strict**: `create` uses `z.enum(["FREE","PREMIUM","PRO","PRO_PLUS"])` to reject invalid plan IDs early. `create-guide` has granular error logging per step.
- **Aging prediction prompt**: Positioned as "Modelo analítico avanzado de IA especializado en estética cosmética" — NOT a dermatologist. Summary avoids clinical language. Scores are visual-chart-only (0-100), not medical measurements.
- **Structured outputs (aging)**: Uses OpenRouter `response_format.json_schema` with `strict: true` to enforce exact JSON shape. No fallback key guessing (`y5` vs `5` etc.).
- **Static RAG ingredients**: `src/lib/ingredient-kb.ts` — 6 concern categories (manchas, arrugas, poros, sensibilidad, hidratación, acné), 22 ingredient entries with mechanism/evidence/concentration. `matchIngredientsToAnalysis()` matches user observations to relevant categories, `formatIngredientsForPrompt()` injects into aging prediction prompt.

## Performance Notes
- `SessionProvider` uses `refetchOnWindowFocus={false}`
- API routes return `Cache-Control: private, max-age=10, s-maxage=30` where appropriate
- `GET /api/analysis/[id]` uses `select` to avoid fetching unnecessary fields
- Prisma compound index `@@index([userId, createdAt])` speeds up history queries
- Image compression skips canvas processing for files < 100KB
- Protected pages use render-time `redirect()` for immediate navigation
- `turbopack.root` configured in `next.config.ts`
- **Edge Runtime**: `/api/health` y `/api/og` usan edge
- **Compound queries**: Analytics usa `db.$transaction()`
- **DNS prefetch**: Layout pre-conecta a Resend, Sentry, QvaPay
- **N+1 prevention**: `/api/analysis` incluye feedback con `select` mínimo
- **FAQ lazy-load**: `faq-section.tsx` con `next/dynamic`
- **Seasonal hero**: Messages based on Southern Hemisphere seasons (Cuba)
- **Explainable AI**: AI returns `observationExplanations` and `confidenceReason`
- **Age-based recommendations**: AI prompt includes decade-specific skincare priorities
- **Slow connection adaptation**: `use-slow-connection.ts` hook detects 2G/3G
- **Service worker**: `public/sw.js` — cache-first for static assets
- **Queue system**: `lib/queue.ts` — in-memory queue with retry
- **Admin dashboard auto-refresh**: 10s interval
- **Prisma indexes**: User(plan, role, createdAt), Payment(status, createdAt, userId+status), Subscription(provider, currentPeriodEnd), PurchasePack(status, userId+status, createdAt), WebhookEvent(provider, provider+eventType), SkinDiary(userId+date), Challenge(active, createdAt)
- **Lazy image loading**: `LazyChart` component with `next/dynamic` + skeleton
- **Feature flags**: `lib/feature-flags.ts` — AppConfig table, 60s cache
- **Products direct DB query**: No unstable_cache — Render serverless caching issues

## Security
- **Rate limiting**: DB-backed via `lib/rate-limit.ts` — `/api/contact` (5/hour/IP), `/api/feedback/survey` (10/day/user), `/api/register` (10/day/IP in-memory), `/api/payments/webhook` (30/min/IP), `/api/auth/forgot-password` (5/hour/IP), `/api/admin/emails/send` (5/hour/admin), `/api/analyze/stream` (rate limited)
- **Input sanitization**: All user inputs stripped of HTML tags via regex before DB storage
- **CRON_SECRET**: Timing-safe comparison with `crypto.timingSafeEqual`
- **CSRF**: Token generation and validation in `lib/csrf.ts`
- **Auth guards**: `redirect()` from `next/navigation` in client components during render
- **Webhook security**: QvaPay verified via GET `/v2/transaction/{uuid}` with app credentials
- **No PII in analytics**: PostHog tracks events only
- **Correlation IDs**: Middleware injects `x-correlation-id` on every request
- **Sentry replays**: Session replay 0.1, error replay 1.0, text masking
- **Structured logging**: `logger.child()` with service context
- **Health check**: `/api/health` returns DB latency, queue stats, memory, uptime, version
- **Admin debug endpoint**: `/api/admin/debug` — shows user count, analysis count, payment count (admin only)
- **Community XSS protection**: All posts/comments stripped of HTML via `stripHtml` + Zod validation
- **Email XSS protection**: All email templates sanitize user data (`name`, `clinic.name`, `skinType`, observations, recommendations) via `sanitizeHtml()` before interpolation

## Pricing & Plans
Prices defined in `src/lib/pricing.ts` — single source of truth.
- CUP conversion: `NEXT_PUBLIC_CUP_FALLBACK` (env) with fallback to **500**
- Display: USD + CUP always shown together
- Packs expire 30 days after purchase

| Product | Price | Details |
|---------|-------|---------|
| Essential (FREE) | $0 | 1 analysis/mo, forever |
| Premium | $4.99/mo | Unlimited analyses, history, evolution comparison |
| Pro | $9.99/mo | Everything Premium, priority processing, early access |
| **Pro+** | **$14.99/mo** | **Everything Pro + PDF reports, dynamic routine, monthly comparison, priority support (1h)** |
| Pack Básico | $1.99 | 3 analyses, history unlocked, 30 days |
| Pack Popular | $4.99 | 5 analyses, comparison, 30 days |
| Pack Avanzado | $6.99 | 15 analyses, priority, 30 days |

## Page Structure
- `/` — landing page: hero with seasonal messages, badge + title + CTAs, 4 action cards, quick skin test, how-it-works, features, pricing preview, FAQ, legal disclaimer
- `/about` — founding story, mission, values, CTA
- `/login` — sign in / register page (email/password, Google, GitHub)
- `/analysis` — 4-step guided wizard: Consent → Photo Assistant → Questions → Processing → redirect to results
- `/analysis/results/[id]` — 8 sections with explainable AI, no percentages, descriptive labels
- `/products` — product scanner + catalog (50 products from seed)
- `/products/[slug]` — product detail with ingredients + Schema.org JSON-LD
- `/guides` — digital products store (5 e-books from seed)
- `/join/[code]` — referral group join landing page
- `/blog` — articles with category filter
- `/blog/[slug]` — article body + Schema.org JSON-LD
- `/community` — forum with categories, post creation, **comments (view + write)**
- `/dashboard/` — user dashboard with welcome banner on first visit (`?welcome=1`) + **social comparison component**
- `/dashboard/history` — chronological timeline of past analyses
- `/dashboard/subscription` — plan status, usage bars, payment history
- `/dashboard/profile` — user profile + **sign out button** + delete account
- `/dashboard/diary` — daily skin diary with calendar grid
- `/dashboard/challenges` — gamification challenges (**display-only, no complete button**)
- `/dashboard/referrals` — referral program management
- `/pricing` — subscriptions + packs, USD/CUP, QvaPay payments
- `/contact` — contact form
- `/ingredients-analyzer` — SEO landing page
- `/admin/` — admin panel: stats, users, payments, messages, blog, products, guías, feature flags, analytics, health check
- `/admin/users` — user management with role/plan editing (FREE/PREMIUM/PRO/PRO+/ESTHETICIAN)
- `/admin/payments` — payment history
- `/admin/blog` — blog post management
- `/admin/products` — product management
- `/admin/messages` — contact messages
- `/admin/emails` — bulk email sender with segment targeting (all/free/premium/pro/proPlus/active/inactive/new)
- `/admin/guides` — digital product CRUD (create/toggle/delete guides)
- `/admin/feature-flags` — feature flag management (create/toggle ON/OFF)
- `/unsubscribe` — unsubscribe page for marketing emails
- `/api/admin/debug` — debug endpoint showing DB counts (admin only)

## Photo Upload (Guided Assistant)
- `/analysis` — 4 photo steps shown one at a time
  - Paso 1: Foto frontal (obligatoria)
  - Paso 2: Perfil izquierdo (obligatoria)
  - Paso 3: Perfil derecho (obligatoria)
  - Paso 4: Acercamiento opcional de zona de interés
- Photos validated for type, size (<10MB, compressed if larger), blur, brightness

## Photo Quality Validation
- `src/lib/photo-quality.ts` — client-side validation
- Uses `OffscreenCanvas` + `createImageBitmap`
- Blur detection: Laplacian variance ≥ 30 passes
- Brightness check: 40–220 passes

## Analysis Results
- 8 organized sections: Resumen General, Tipo de Piel, Observaciones, Factores, Recomendaciones, Rutina, Productos, Historial
- Legal disclaimer at bottom
- No percentages — only descriptive labels and severity badges

## Legal Pages
- `/terms` — medical disclaimer, AI limitations, subscription terms
- `/privacy` — data collection, storage, user rights, cookies

## Auth Flow
- `/login` — sign-in form (credentials + social)
- `POST /api/register` — creates user account, **no email sent**, redirects to `/dashboard?welcome=1`
- `/forgot-password` — generates reset token
- `/reset-password` — validates token, updates password
- **Middleware**: `/login` redirects authenticated users to `/dashboard`
- **Admin users**: Created with `role: "ADMIN"` when email matches `ROOT_ADMIN_EMAIL`

## API Routes (Analysis)
- `POST /api/analyze` — requires auth, checks usage, saves skinType, deducts usage
- `GET /api/analysis` — list user's analyses
- `GET /api/analysis/[id]` — single analysis detail

## API Routes (Diary & Challenges)
- `GET /api/skin-diary` — diary entries (last 30 days) + weekly trend
- `POST /api/skin-diary` — create or update diary entry
- `DELETE /api/skin-diary/[id]` — delete diary entry
- `GET /api/challenges` — active challenges with user completion status + total points
- `POST /api/challenges` — complete a challenge (kept in API but **no UI button**)
- `GET /api/admin/challenges` — list all challenges (admin only)
- `POST /api/admin/challenges` — create new challenge (admin only)
- `PATCH /api/admin/challenges/[id]` — update challenge (admin only)
- `DELETE /api/admin/challenges/[id]` — deactivate challenge (admin only)
- `GET /api/admin/feature-flags` — list all feature flags (admin only)
- `POST /api/admin/feature-flags` — create/update feature flag (admin only)

## API Routes (Community)
- `GET /api/community/posts` — list posts with pagination, categories, comment counts
- `POST /api/community/posts` — create new post
- `GET /api/community/posts/[id]/comments` — list comments for a post
- `POST /api/community/posts/[id]/comments` — add comment to a post

## API Routes (Admin Emails)
- `POST /api/admin/emails/send` — send bulk emails via Resend batch API
- `GET /api/admin/emails/history` — email send history
- `POST /api/unsubscribe` — unsubscribe from marketing emails
- `GET /api/unsubscribe?email=` — check if email is unsubscribed

## API Routes (Payments)
- `POST /api/payments/create` — creates QvaPay invoice
- `POST /api/payments/create-pack` — creates QvaPay pack invoice (accepts extra fields)
- `POST /api/payments/webhook` — QvaPay webhook
- `GET /api/user/usage` — usage info for current user
- `GET /api/admin/analytics` — revenue, plan distribution, conversion rate
- `GET /api/admin/stats` — full dashboard stats (users, analyses, payments, guides, referrals, etc.)
- `GET /api/admin/users` — list all users (admin only)
- `PUT /api/admin/users` — update user role/plan (admin only)
- `GET /api/admin/payments` — list all payments (admin only)
- `GET /api/admin/debug` — debug DB counts (admin only)
- `GET /api/admin/notifications` — unread group completion notifications (admin only)
- `POST /api/admin/notifications` — mark notification as read (admin only)
- `GET /api/admin/guides` — list all digital products (admin only)
- `POST /api/admin/guides` — create digital product (admin only)
- `PATCH /api/admin/guides/[id]` — update digital product (admin only)
- `DELETE /api/admin/guides/[id]` — delete digital product (admin only)

## API Routes (Referral Groups)
- `GET /api/referral` — list user's referral groups
- `POST /api/referral` — create new referral group
- `GET /api/referral/[code]` — get group info (public)
- `POST /api/referral/[code]` — join referral group (auth required)

## API Routes (PRO+ Features)
- `POST /api/aging-predict` — aging prediction with structured outputs + RAG ingredient injection (requires auth + latest analysis)
- `GET /api/user/monthly-comparison` — monthly analysis comparison (PRO+ only)
- `GET /api/user/dynamic-routine` — dynamic routine based on season + skin type (PRO+ only)
- `GET /api/user/social-comparison` — anonymous comparison with friends' results
- `GET /api/guides` — list available digital products
- `POST /api/payments/create-guide` — create QvaPay invoice for guide purchase

## New Models (2026-06-26)
- `GroupAnalytics` — tracks referral group progress (groupId, referrerId, invitedCount, completedCount, totalRevenue, status, expiresAt)
- `Referral` — individual referral records (referrerId, referredId, code, groupId, status, discountPrice)
- `DigitalProduct` — e-books and digital guides (title, slug, price, fileUrl, category)
- `DigitalProductPurchase` — purchase records for digital products

## New Files (2026-06-26)
- `src/lib/ingredient-kb.ts` — Static ingredient knowledge base for RAG. 6 concern categories, 22 entries with mechanism/evidence/concentration. Functions: `matchIngredientsToAnalysis()`, `formatIngredientsForPrompt()`
- `src/app/api/aging-predict/route.ts` — Aging prediction API. Structured outputs via OpenRouter JSON Schema. RAG ingredient injection. Sanitizes scores/trends.

## New Pages (2026-06-25)
- `/pricing/success` — payment confirmation after QvaPay redirect
- `/pricing/cancel` — payment cancellation page
- `/dashboard/social` — dedicated social comparison with how-it-works
- `/dashboard/guides` — purchased guides list with download buttons
- `/dashboard/report` — PDF report generator (PRO+ only)
- `/dashboard/referrals` — referral group management

## Changelog (2026-07-01) — Auditoría + Mejoras

### Bugs Fixeados
- **`src/middleware.ts`**: `x-response-time` siempre mostraba 0ms (cálculo después de respuesta). Fix: mover `start` antes de `NextResponse.next()`.
- **`src/middleware.ts`**: Admin guard no cubría `/api/admin/*` routes. Fix: agregado `request.nextUrl.pathname.startsWith("/api/admin")`.
- **`src/app/pricing/page.tsx`**: `TransferData` interface usaba `reference` y `accountNumber` pero API devuelve `referenceCode` y `account`. Fix: ambos campos aceptados con fallback.
- **`src/lib/telegram-handlers.ts`**: HTML injection por interpolación directa en `formatPaymentRow()` y `/cliente`. Fix: usar `sanitizeHtml()` de `@/lib/sanitize`.

### Seguridad
- **CSRF implementado**: Nueva `src/lib/csrf-middleware.ts` — validación en todas las mutations POST de pagos:
  - `/api/payments/create-transfer`, `create`, `create-pack`, `create-paypal`, `create-guide`, `verify-guide`
  - `/api/payments/validate-transfer`, `activate-transfer`, `cancel-transfer`
  - Se salta en desarrollo (`NODE_ENV=development`)
- **Security headers agregados** en `middleware.ts`: `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`
- **CSP actualizado**: Incluye `https://api.telegram.org` en `connect-src`
- **Rate limit**: Pendiente migrar a in-memory (ver #1 en Top 10 mejoras)

### Transfermóvil
- **Zod validation**: `create-transfer/route.ts` ahora valida plan y amount contra `getPlan()`/`getPack()`, rechaza montos que no coinciden
- **Race condition fix**: `generateReferenceCode()` usa `crypto.randomBytes(3)` en vez de `count()` race-prone
- **Cancelación**: Nuevo endpoint `POST /api/payments/cancel-transfer` para admins
- **Paginación**: `GET /api/admin/transfers` acepta `?page=&limit=` (default 50, max 100)

### Guías Digitales
- **fileUrl en seed**: Todas las guías incluyen `fileUrl` (placeholder PDF de W3C). Admin puede actualizar desde panel.
- **Admin download**: `GET /api/admin/guides/download?slug=X` para admins. Botón en `/guides` para admin abre `fileUrl` directamente.
- **API pública incluye fileUrl**: `/api/guides` ahora devuelve `fileUrl` para que admins puedan descargar sin comprar.

### Telegram Bot
- **HTML sanitization**: `formatPaymentRow()` y `/cliente` usan `sanitizeHtml()` existente
- **Nueva función**: `getUserByTelegramId()` para consultar DB por telegramId

### General
- **Consistencia API**: Todas las rutas de pagos ahora usan `ok()`/`error()`/`serverError()` en vez de `NextResponse.json` directo
- **try/catch en todas las rutas**: create-transfer, validate-transfer, activate-transfer, cancel-transfer ahora manejan errores con `serverError()`
- **Nuevo endpoint admin**: `GET /api/admin/guides/download?slug=X` para admins

### Tests
- **174 tests pasan** (Vitest, 16 suites)
- **Type check limpio** (`tsc --noEmit`)
- **Live tests**: 23/23 tests pasan en `https://the-serene-lens-nuevo.onrender.com`
  - 9 páginas cargan (200)
  - 4 APIs GET retornan datos válidos
  - 8 APIs POST rechazan sin auth (401)
  - 2 páginas 404 funcionan
  - Script: `scripts/test-live.sh`

## Known Issues
- **Resend domain NO verificado**: Only used for admin bulk emails. Registration uses on-screen welcome banner.
- **npm install falla**: `rm -rf node_modules .next && npm install --legacy-peer-deps`
- **Prisma 7 driver adapter**: Requires `pg` + `@prisma/adapter-pg`
- **DB push pendiente**: `npx prisma db push` for Stripe field removal + new tables + `@relation` to UserEvolution/AffiliateClick
- **CRON_SECRET pendiente**: Add env var in Render Dashboard
- **Seed en producción**: Ejecutar `npm run seed` después de deploy para poblar productos, guías y desafíos
- **Guías sin PDF real**: Seed usa placeholder de W3C. Subir PDFs reales y actualizar `fileUrl` en admin.
- **CSRF saltado en dev**: `validateCsrf()` retorna `true` si `NODE_ENV=development`
- **Cancel-transfer endpoint**: Creado pero requiere deploy para estar disponible en producción
- **Bot getQvaPayPaymentStatus sin AbortController**: Pendiente agregar timeout (ver auditoría)

## Changelog (2026-07-01) — Resend + Styling + Subscription Buttons

### Email (Resend)
- **`src/lib/email.ts`**: Already used `onboarding@resend.dev` — verified correct
- **`.env`**: `RESEND_API_KEY` actualizada con clave del usuario
- All email files (`cron/email-sequence`, `email-sequence.ts`, `admin-email.service.ts`) already fallback to `onboarding@resend.dev`

### Admin Email Panel Styling
- **`src/app/admin/emails/page.tsx`**: Segment count labels changed from `text-[#64705E]` (barely visible) to `text-[#2F3A2D]` (dark/readable)
- **Table headers**: Changed from `text-[#64705E]` to `text-[#2F3A2D] font-semibold`

### Payment Buttons — Unificado
- **`src/app/pricing/page.tsx`**: PayPal buttons now use same `variant` prop as QvaPay instead of hardcoded `bg-blue-500`. Todos los botones (PayPal, QvaPay, Transfermóvil) usan el theme verde consistente.
- **`src/app/dashboard/subscription/page.tsx`**: Added inline 3-button payment section (QvaPay, PayPal, Transfermóvil) for FREE users to upgrade to Premium. Includes loading states and error handling.
- Also added `useRouter`, `DollarSign`, `WalletCards` imports and `handleSubscribe`/`handlePayPal`/`handleTransfer` handlers.

### Git
- Commit `4adb53a`: "Auditoría y mejoras: CSRF, seguridad, Transfermóvil, guías, estilos, tests, email"
- Pushed to `origin/main`
