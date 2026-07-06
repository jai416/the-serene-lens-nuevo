# AGENTS.md — The Serene Lens

## Project Status (2026-07-06)
**Migración completa a Groq + Rediseño UI + Bot RAG + Menú Telegram completo.**
- Landing page, análisis de piel con IA (Groq Llama 3.2 11B Vision), historial, evolución
- Sistema de pagos QvaPay (planes + packs), webhooks, suscripciones
- Blog, productos, ingredientes, comunidad (con comentarios)
- Panel admin tema oscuro slate/navy: usuarios con rol VALIDADOR, pagos, mensajes, blog, productos, guías, feature flags, analytics, health check, conocimiento (Bot RAG), Telegram (broadcast)
- **PRO+ plan** ($14.99/mes): informe PDF, rutina dinámica, comparativa mensual
- **Guías Digitales**: e-books descargables vendidos vía QvaPay
- **Telegram Bot**: webhook integrado, menú completo por rol (USER/VALIDATOR/ADMIN), internet search para admin/validator, sin sub-menús
- **Bot RAG**: `searchKnowledge()` con scoring + `generateBotResponse()` con Groq Llama 3.1 8B. Error log serializado correctamente
- **Paleta nueva**: `#88B078` primary, `#F8F9FA` bg, `#1A1A1A` text, cards sin borders, `rounded-[20px]`
- **Sin OpenRouter, sin Gemini**: 0 referencias en código. Groq API activa (30 req/min, 6K TPM, 14,400 req/day gratis)
- **Sin Stripe**: Eliminado del schema y código. Solo QvaPay
- Type check limpio, paleta vieja eliminada de 70+ archivos

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
- `GROQ_API_KEY` — AI analysis (vision + text)
- `RESEND_API_KEY` — bulk admin emails only (NOT used for registration/welcome)
- `CRON_SECRET` — cron job authorization (pendiente en Render)
- `NEXT_PUBLIC_POSTHOG_KEY`, `NEXT_PUBLIC_POSTHOG_HOST` — product analytics
- `NEXT_PUBLIC_SENTRY_DSN` — error tracking
- `NEXT_PUBLIC_WHATSAPP_NUMBER` — WhatsApp contact
- `NEXT_PUBLIC_CUP_FALLBACK` — USD→CUP rate override
- `ROOT_ADMIN_EMAIL` — email that gets ADMIN role on registration

## Visual Identity (v3.0)
Clean, professional skincare platform — calm, minimalist healthcare aesthetic.

### Palette
- **Primary**: #88B078 (sage green muted)
- **Primary muted**: #E2ECE0 (hover/badge backgrounds)
- **Background**: #F8F9FA (lienzo ultra claro)
- **Surface**: #FFFFFF (white)
- **Text main**: #1A1A1A (carbón profundo)
- **Text muted**: #666666 (gris neutro)
- **Borders**: #E8E8E8 (gris claro)
- **Gold bg**: #FFF9E6 (premium containers)
- **Gold btn**: #FCEAA6 (premium CTAs)

Light mode only. No dark mode.

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
- **Lazy env loading in auth.ts/groq.ts**: `getAuthEnv()` with try/catch instead of module-level `getEnv()` crash. Providers use `process.env` directly.
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
- **Static RAG ingredients**: `src/lib/ingredient-kb.ts` — 6 concern categories, 22 ingredient entries. `matchIngredientsToAnalysis()` / `formatIngredientsForPrompt()` injects into aging prediction prompt.

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
- `src/app/api/aging-predict/route.ts` — Aging prediction API with RAG ingredient injection.

## New Pages (2026-06-25)
- `/pricing/success` — payment confirmation after QvaPay redirect
- `/pricing/cancel` — payment cancellation page
- `/dashboard/social` — dedicated social comparison with how-it-works
- `/dashboard/guides` — purchased guides list with download buttons
- `/dashboard/report` — PDF report generator (PRO+ only)
- `/dashboard/referrals` — referral group management

## Changelog (2026-07-03) — Telegram 3-roles + 15 mejoras + Personalidad + Live Chat + Tickets + Tour + Modo Experto

### Telegram Bot — Sistema Completo de Gestión (3 Roles)

**Rol 1 — Usuario Normal** (sin token):
- `/start`, `/web`, `/precios`, `/status`, `/ayuda`, `/skincare`, `/contacto`, `/meme`, `/feedback`, `/recordatorio`, `/recomendar`
- ReplyKeyboard con botones abajo del chat (como Binance/Spotify)

**Rol 2 — Validador** (token vía `/validator TOKEN`):
- `/validar REF`, `/validar 1,2,3`, `/validar todos` (batch), `/pendientes`, `/buscar`, `/historial`, `/validatorhelp`
- Botones inline en `/pendientes` para validar con 1 clic

**Rol 3 — Admin** (token vía `/admin TOKEN`):
- Todo lo de validador + `/activar`, `/cliente` (con enlace admin), `/reporte` (tabla markdown), `/usuarios`, `/trending`, `/analisis ID`, `/broadcast`, `/logs`, `/alerta`, `/promocion`, `/whois`, `/adminhelp`

**Tokens**: `TELEGRAM_ADMIN_TOKEN`, `TELEGRAM_VALIDATOR_TOKEN` en `.env` (reemplazan `ADMIN_TELEGRAM_IDS`/`VALIDATOR_TELEGRAM_IDS`)
**Modelos nuevos**: `TelegramAuth` (chatId+role en DB), `TelegramLog` (actividad), `TelegramAlert` (suscripción eventos), `DiscountCode`, `TelegramReminder`, `BotFeedback`

### Personality Engine (telegram-responses.ts)
- Tono de marca cálido, cercano, profesional
- Multi-variant picker (3-4 variantes aleatorias por respuesta)
- Time-of-day greetings (🌅/☀️/🌆/🌙 + nombre)
- Role-aware: admin ve stats al entrar, validador ve cola, user normal ve bienvenida simple
- Multi-step flows: `/validar REF` → pide "confirmar" → ejecuta
- Conversational memory: `conversationState` Map para diálogos multi-paso
- Smart links: enlaces descriptivos sin URLs crudas
- Recomendación personalizada vía `/recomendar` según último skinType
- Fallback conversacional: detecta keywords en texto libre (precio, web, hola, etc.)

### Live Chat Widget
- `src/components/chat/live-chat-widget.tsx` — Botón flotante 💬 + panel de chat
- Session persistida en localStorage, polling cada 5s
- API: `POST /api/chat/session`, `GET/POST /api/chat/messages`
- Admin panel: `GET /api/admin/chat/sessions`, reply, view messages
- Telegram fallback: si admin no responde en 5 minutos, `notifyAdmins("new_chat", msg)`
- Modelo: `ChatMessage` (sessionId, userId, message, isAdmin, read)

### Support Tickets
- `src/app/dashboard/support/` — Página de tickets con formulario + lista
- `src/app/dashboard/support/[id]/` — Detalle con hilo de respuestas
- API: CRUD completo + admin respond + notificaciones in-app
- Modelos: `SupportTicket` (userId, subject, message, status, priority), `SupportTicketResponse`

### Quick Feedback Post-Análisis
- `src/components/feedback/quick-feedback.tsx` — 👍/👎 después del análisis
- API: `POST /api/feedback/quick`
- Guarda en tabla `Feedback` existente (rating 5/1)

### Interactive Tour
- `src/components/tour/app-tour.tsx` — Tour de 4 pasos al primer ingreso al dashboard
- Overlay con backdrop, progreso, navegación
- Persistencia en localStorage `tour_completed`

### Modo Experto (AI)
- `src/app/api/analysis/[id]/explain-observation/route.ts` — Explica observación con IA
- `src/components/analysis/expert-mode.tsx` — Componente modal con causas, ingredientes, ajuste rutina
- Cada observación es clickeable → modal explicativo con Groq

### Ruta de Mejora (AI)
- `src/app/api/analysis/[id]/improvement-plan/route.ts` — Plan 30 días con IA
- `src/components/analysis/improvement-plan.tsx` — 4 semanas con metas, tips, productos
- Botón "🚀 Generar mi Ruta de Mejora" en resultados

### Conversational Bot
- Keywords detection en mensajes de texto libre (precio→handlePrecios, etc.)
- Mensaje amigable cuando no entiende

### Modelos Nuevos Prisma
- `TelegramAuth`, `TelegramLog`, `TelegramAlert`, `DiscountCode`, `TelegramReminder`, `BotFeedback`
- `SupportTicket`, `SupportTicketResponse`, `ChatMessage`

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
- **Guías PDF reales**: 11 PDFs generados en `public/guides/`. Seed actualizado. Pendiente deploy + `npm run seed` para actualizar DB.
- **CSRF (fixed)**: Token generado en `middleware.ts` via Web Crypto API, cookie `csrf-token` seteada. Frontend lee con `getCsrfToken()` y envía en header `x-csrf-token`.
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

### Telegram Bot — Webhook + Secret
- **`src/app/api/telegram/webhook/route.ts`**: Added `x-telegram-bot-api-secret-token` verification. Only enforced when `TELEGRAM_WEBHOOK_SECRET` env var is set (safe for deploy without config).
- **`.env`**: Added `TELEGRAM_WEBHOOK_SECRET=f896ab7f054d734e34cade6c39269b152b418042`
- **`render.yaml`**: Added `TELEGRAM_WEBHOOK_SECRET` env var entry
- **`.env.example`**: Added `TELEGRAM_WEBHOOK_SECRET` placeholder
- **Webhook URL set**: `curl -X POST "https://api.telegram.org/bot{TOKEN}/setWebhook"` con `secret_token`
- **Verificado**: `getWebhookInfo` → URL activa, 0 pending updates

### CSRF Fix — Token Flow Completo
- **Causa raíz**: `validateCsrf()` se agregó a 9 endpoints de pago pero nunca se generó ni sirvió el token al cliente → 403 en producción
- **`src/middleware.ts`**: Genera `csrf-token` cookie via `crypto.randomUUID()` (Edge-compatible) si no existe. `SameSite=Strict`, expira 1h.
- **`src/lib/csrf-client.ts`**: Nueva función `getCsrfToken()` que lee la cookie desde `document.cookie`
- **Páginas actualizadas**: `pricing/page.tsx`, `dashboard/subscription/page.tsx`, `guides/page.tsx`, `pricing/success/page.tsx` — todas agregan `x-csrf-token: getCsrfToken()` en cada `fetch()` POST de pagos

### Guías PDF Reales
- **`scripts/generate-guides-pdf.mjs`**: Script Node.js que genera 11 PDFs con `pdf-lib`, contenido real en español, word-wrap, portada, footer, numeración.
- **`public/guides/*.pdf`**: 11 PDFs (2.6-3.5 KB c/u) almacenados en `public/guides/` → servidos estáticamente en `/guides/slug.pdf`
- **`prisma/seed.ts`**: `PLACEHOLDER_PDF` (W3C dummy) reemplazado por `BASE_GUIDE_URL = APP_URL + "/guides"`, cada guía apunta a su PDF real
- **`scripts/generate-guides-pdf.ts`**: Versión TypeScript (requiere tsx)

### Bugs Fixeados
- **PayPal redirige bien** (`pricing/page.tsx`): Ahora acepta `payload.url || payload.approvalUrl` — antes solo leía `url` pero API devuelve `approvalUrl`
- **Dashboard Transfer funciona** (`dashboard/subscription/page.tsx`): `handleTransfer` ahora envía `amount: 4.99` (PREMIUM) en vez de `amount: 0` que fallaba validación
- **Dashboard PayPal** (`dashboard/subscription/page.tsx`): Mismo fix que pricing — acepta `approvalUrl`

### Live Tests (2026-07-02 — VERIFICACIÓN COMPLETA)
```
=== Pages (9/9 ✅ 200) ===
/ → 200  /about → 200  /pricing → 200  /guides → 200
/blog → 200  /contact → 200  /login → 200  /dashboard → 200
/ingredients-analyzer → 200

=== APIs GET (3/3 ✅ 200) ===
/api/guides → 200  /api/health → 200  /api/community/posts → 200

=== APIs POST sin auth (4/4 ✅ 403 CSRF bloquea) ===
create → 403  create-paypal → 403  create-transfer → 403  create-guide → 403

=== Guías PDF (11/11 ✅ 200) ===
guia-piel-grasa.pdf → 200  eliminar-manchas-30-dias.pdf → 200
rutina-antiedad-40.pdf → 200  ingredientes-evitar.pdf → 200
proteccion-solar-anual.pdf → 200  rutina-principiantes.pdf → 200
guia-acne-completa.pdf → 200  ingredientes-activos.pdf → 200
skincare-tropical.pdf → 200  guia-exfoliacion.pdf → 200
skincare-masculino.pdf → 200

=== Telegram Webhook ===
URL activa ✅ (https://the-serene-lens-nuevo.onrender.com/api/telegram/webhook)
Pending updates: 0
```

## Changelog (2026-07-04) — Gemini Directo + Admin Theme + Bot RAG + Validator Role

### Gemini Directo + Keys Round-Robin
- **`src/lib/gemini-keys.ts`**: Sistema round-robin con `getNextGeminiKey()`. Soporta `GEMINI_API_KEY_1` a `_10`. Key count: `getGeminiKeyCount()`.
- **`src/lib/gemini.ts`**: `analyzeSkinWithGemini()` — análisis de piel directo a Gemini (NO OpenRouter). Compresión 512px, retry backoff, prompt JSON-only.
- **`src/app/api/analyze/stream/route.ts`**: Migrado de OpenRouter a Gemini directo + caché (`getCachedAnalysis`/`setCachedAnalysis`) + límite diario (`checkAndDeductUsage`)
- **`.env`**: 7 Gemini keys configuradas (6 keys `AQ.*` + 1 key `AIzaSy*`). Rotación automática round-robin.
- **`.env.example`**: Actualizado con sección Gemini completa.
- **Cuba workaround eliminado**: `src/lib/country-detect.ts` eliminado. OpenRouter fallback a Gemini es genérico.

### Admin Panel — Tema Oscuro Slate/Navy
- **All admin pages**: Migradas de verde oliva a `#0F1117` fondo / `#22263A` cards / `#7C8CFF` accent / `#E2E8F0` texto / `#8892B0` secondary
- **Style approach**: `style={}` objects instead of Tailwind dark: prefixes for admin-specific theme

### Base de Conocimiento (Bot RAG)
- **Nuevo modelo Prisma**: `BotKnowledge` con hierarchy/subcategory/source/sourceUrl/priority/synonyms/versioning (validFrom/validUntil/version/updatedBy) + confidence tracking (helpfulCount/unhelpfulCount/lastUsedAt)
- **Nuevo modelo**: `BotFeedback` (knowledgeId, userId, chatId, helpful boolean)
- **Nuevo modelo**: `BotLog` (chatId, userId, command, message)
- **`src/lib/bot-knowledge.ts`**: `searchKnowledge()` con scoring (title 10pts, keywords 8pts, synonyms 6pts, content 4pts + bonus frase exacta)
- **`src/lib/bot-rag.ts`**: `generateBotResponse()` busca en knowledge base, construye prompt con contexto, llama Gemini Flash. Fallback a respuesta directa sin IA.
- **`prisma/seed-knowledge.ts`**: 18 entradas completas con toda la documentación del sitio (qué es, análisis, precios, pagos, modo experto, ruta mejora, predictor, comunidad, soporte, blog, guías, referidos, Transfermóvil, diario, desafíos, ingredientes, privacidad)
- **Knowledge sync**: `POST /api/admin/knowledge/sync` — lee sitemap de 14 páginas, extrae contenido, crea/actualiza BotKnowledge
- **Knowledge API**: `GET/POST /api/admin/knowledge`, `PATCH/DELETE /api/admin/knowledge/[id]`
- **Admin knowledge page**: `src/app/admin/knowledge/page.tsx` — CRUD + sync + toggle activación + badges

### Admin Telegram Page
- **`src/app/admin/telegram/page.tsx`**: Broadcast masivo, lista usuarios vinculados con desvincular
- **`POST /api/admin/telegram/broadcast`**: Envía mensaje a todos los `telegramId` en DB, batch 30 msg/s, devuelve sent/failed

### Messages Page Overhaul
- **`src/app/admin/messages/page.tsx`**: Agrupa por plan (PRO/PRO+ primero → ESTHETICIAN → otros). Muestra nombre, email, plan, fecha. Selección con detalle expandido.
- **`ContactMessage`**: Ahora vinculado a `User` via `userId` (relación opcional)

### Product Scanner Caché
- **`src/app/api/product-scan/route.ts`**: SHA-256 hash de imagen, caché 7 días en tabla `Cache`. Devuelve `cached: true/false`

### Health Check Extendido
- **`src/app/api/health/route.ts`**: Verifica DB, Gemini keys count, Cache status, Rate limit, Feature flags. Devuelve uptime, versión, memoria, queue stats

### Feature Flags Overhaul
- **`src/lib/feature-flags.ts`**: JSON config `{ enabled, message, redirectUrl }`. Admin page con editor de mensaje y redirección personalizados

### Revenue por Proveedor
- **Admin dashboard**: Muestra QvaPay + Transfermóvil + PayPal con barra de colores proporcional

### Rol VALIDADOR
- **`src/app/admin/users/page.tsx`**: Rediseñada con tema slate, agrega selector VALIDATOR al dropdown de roles, info box explicando qué hace un validador
- **`src/lib/validations/index.ts`**: `adminUserUpdateSchema` ahora acepta `"VALIDATOR"` en el enum de roles
- **`src/app/api/admin/users/route.ts`**: `GET` ahora incluye `telegramId` en la respuesta

### Live Chat + Tour (de changelog anterior)
- `LiveChatWidget` movido a Client Component wrapper (`live-chat-wrapper.tsx`) para evitar error `ssr: false`
- `next.config.ts` fix: `__dirname` reemplazado por `fileURLToPath(import.meta.url)` para ESM
- Interactive Tour, Quick Feedback, Modo Experto, Ruta de Mejora, Personality Engine del changelog anterior

### Git
- Commit `4adb53a`: "Auditoría y mejoras: CSRF, seguridad, Transfermóvil, guías, estilos, tests, email"
- Commit `e605c77`: "Update AGENTS.md with Resend key, styling fixes, subscription buttons"
- Commit `a0e19f6`: "Add TELEGRAM_WEBHOOK_SECRET to webhook, render.yaml, .env.example"
- Commit `66b76d0`: "Fix webhook secret check: only enforce when env var is set"
- Commit `1c11757`: "Fix CSRF bloqueando pagos: generar token en middleware, enviar desde frontend"
- Commit `40b9f03`: "Guías PDF reales + fix PayPal/Transfer dashboard + seed"
- Commit `ce61fa2` (2026-07-04): "Gemini directo + Bot RAG + Admin slate + Validator role + fixes"
- All pushed to `origin/main`

## Test Results (2026-07-04 — Verificación Completa en Producción)

### Estado del Deploy
- Código más reciente commit `ce61fa2` PUESHEADO a GitHub ✅
- Render (free tier) aún no completa el build — la versión anterior sigue sirviendo contenido
- El build en Render hará `npm install && npm run build` (Turbopack nativo en Render sí funciona)

### Páginas Públicas (todas 200 ✅)
```
/ → 200  /about → 200  /pricing → 200  /blog → 200
/contact → 200  /login → 200  /products → 200  /guides → 200
/ingredients-analyzer → 200  /terms → 200  /privacy → 200
```

### APIs Públicas (todas OK ✅)
- `/api/health` → `status: ok`, DB ok, uptime registrado
- `/api/guides` → 11 guías digitales con fileUrl
- `/api/products` → 10 productos
- `/api/blog` → 10 artículos
- `/api/community/posts` → 6 posts

### APIs Autenticadas (con sesión de newtest@gmail.com ✅)
- `/api/analysis` → `analyses: []` (sin análisis aún)
- `/api/user/usage` → FREE plan, 1 análisis restante
- `/api/user/monthly-comparison` → `hasData: false`
- `/api/user/social-comparison` → `hasComparison: false`
- `/api/referral` → `groups: []`
- `/api/skin-diary` → `[]`
- `/api/challenges` → 30 desafíos, 0 completados
- `/api/feedback/survey` → funciona (rating 5)
- `/dashboard` → 200
- `/dashboard/history` → 200
- `/dashboard/profile` → 200
- `/dashboard/subscription` → 200

### Control de Acceso Admin ✅
- `/admin` → 307 redirect a `/` (usuario no admin)
- `/admin/users` → 307 redirect a `/`
- `/api/admin/stats` → 307 redirect

### Type Check
- `tsc --noEmit` → solo error preexistente `trusted-types` (no bloqueante)
- Sin nuevos errores de tipo introducidos

### Issues Corregidos
1. **Admin layout**: Template literal roto — `className="... ${adminColors.accentBg} ..."` estaba en string normal, no template literal. Fix: usar backticks.
2. **Telegram admin page**: `handleUnlink()` enviaba `telegramId: null` pero Zod schema `.strict()` lo rechazaba. Fix: agregar `telegramId: z.string().nullable().optional()` al schema.
3. **Admin users GET no filtraba telegramLinked**: La página de Telegram cargaba TODOS los usuarios. Fix: agregar query param `?telegramLinked=true` al GET handler.
4. **Falta seed:knowledge script**: Agregado `"seed:knowledge": "tsx prisma/seed-knowledge.ts"` a package.json.

### Pendiente Post-Deploy (ejecutar en Render Shell o local con acceso DB)
1. Render termine el build y deploy automático (commit `ce61fa2`)
2. `npx prisma db push --accept-data-loss` — sincronizar schema (BotKnowledge, BotFeedback, BotLog, etc.)
3. `npm run seed:knowledge` — poblar 18 entradas de base de conocimiento
4. `npm run seed` — poblar productos/guías/desafíos si no existen
5. Usar admin → `/admin/knowledge` → "Sincronizar con la web" para auto-generar entradas desde sitemap
6. Usar admin → `/admin/users` → cambiar rol de validador a usuarios
7. Configurar `GEMINI_API_KEY_1` a `_7` en Render Dashboard (ya en .env local)

---

## Changelog (2026-07-06) — UI Redesign Completo + Performance + Assets

### 🎨 Rediseño Visual Completo (Paleta Nueva)
- **Paleta anterior eliminada por completo**: 0 referencias a `#C2E09D`, `#2F3A2D`, `#64705E`, `#DDE7D3`, `#F8FAF5`, `#F0F5EC`, `#ECFFD3`, `#FFF6AD`, `#8A9A82`, `#B0D48E`, `#E8EDE4`
- **70 archivos actualizados** con la nueva paleta vía búsqueda y reemplazo masivo
- **Tokens nuevos**:
  - `primary`: `#88B078` (verde brand)
  - `primary-muted`: `#E2ECE0` (fondo de item activo)
  - `bg-main`: `#F8F9FA` (lienzo ultra claro)
  - `text-main`: `#1A1A1A` (carbón profundo)
  - `text-muted`: `#666666` (gris neutro)
  - `accent-gold-bg`: `#FFF9E6` (container premium)
  - `accent-gold-btn`: `#FCEAA6` (CTA premium)
  - `border`: `#E8E8E8` (gris claro)
- **Cards**: Sin borders duros, sombras suaves `shadow-sm`, `rounded-[20px]`

### 📐 Layout Rediseñado
- **Sidebar (izquierda)**: Brand `Flower2` + "The Serene Lens" + "Conoce mejor tu piel". Items nav con estado activo verde sobre fondo `#E2ECE0`. Premium widget al fondo con `Crown` dorado, fondo `#FFF9E6`, botón `#FCEAA6`
- **TopHeader (nuevo)**: Barra sticky con `NotificationBell` inline + avatar circular + nombre + badge "Usuario Premium" en verde
- **Dashboard**: Hero con círculos orgánicos decorativos, grid "¿Qué quieres hacer hoy?" (4 cards con icon-bg pastel), módulo "Tu progreso" con SVG bezier chart + circular gauge, widgets laterales (último análisis + recordatorios + banner solar)
- **Root layout**: `NotificationBell` movido del float al TopHeader. Toaster con nuevos colores

### 🚀 Performance & UX
- **Skeleton loaders**: Guides page reemplazó spinner `<Loader2>` por `<CardSkeleton>` con shimmer effect
- **Custom scrollbar**: 6px delgado, redondeado, `#E8E8E8`/dark `#444`. Estilo Firefox vía `scrollbar-width: thin`
- **next/font Inter**: Cargado via `next/font/google` con `display: swap` y `variable: "--font-inter"`. Sin request externa a Google Fonts. Elimina CLS
- **`<Image>` en guides**: Reemplazado `<img>` por `<Image>` de Next.js (WebP automático, lazy loading, prevención de layout shift)
- **ISR + Cache-Control**:
  - `products/[slug]`: `revalidate = 3600` (ISR: se regenera cada hora)
  - `/api/products`: `Cache-Control: public, s-maxage=3600, stale-while-revalidate=600`
  - `/api/guides`: `Cache-Control: public, s-maxage=3600, stale-while-revalidate=600`
  - `force-dynamic` eliminado del endpoint products (ahora cacheable)
- **Prisma select**: Ya optimizado en `/api/products` y `/api/guides` (solo campos necesarios) ✅
- **next/dynamic**: Ya usado para `FAQSection`, `SkinTest`, `AgingDemo`, `EvolutionChart`, `SkinReportDownload` ✅

### 📥 Script Asset Downloader
- **`scripts/download-assets.ts`** (nuevo): Script autónomo que descarga imágenes faltantes
  - Productos → `/public/images/products/` (47 archivos: Pexels por ID + Unsplash por keyword según categoría)
  - Covers de guías → `/public/guides-covers/` (10 covers Pexels)
  - Placeholders de guías → `/public/guides/` (50 SVGs con branding)
  - Skip automático si el archivo ya existe
  - Timeout 15s por descarga, errores no detienen el bucle
  - Ejecutar: `npm run download:assets`

### ✅ Tests & Type Check
- **Type check**: `exit 0` ✅
- **Tests**: 162/162 pasan en 14 suites ✅
