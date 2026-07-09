# AGENTS.md — The Serene Lens

## Project Status (2026-07-08)
**Migración completa a Groq + Cola persistente DB + Sistema de guías seguro + Telegram avanzado.**
- Landing page, análisis de piel con IA (Groq Llama 3.2 11B Vision + Llama 3.1 8B text), historial, evolución
- Sistema de pagos QvaPay (planes + packs + guías digitales), webhooks idempotentes
- Blog, productos, ingredientes, comunidad (con comentarios + spam filter)
- Panel admin: usuarios (con rol VALIDADOR), pagos, mensajes, blog, productos, guías, feature flags, analytics, health check, conocimiento (Bot RAG), Telegram (broadcast), blog generator (IA)
- **PRO+ plan** ($14.99/mes): informe PDF, rutina dinámica, comparativa mensual
- **Guías Digitales**: e-books descargables vendidos vía QvaPay, PDFs protegidos (no en public/)
- **Telegram Bot**: webhook integrado, permission matrix (FREE trial 72h, PREMIUM+ total, ESTHETICIAN total), rate limit, TransferSMS regex detection
- **Bot RAG**: `searchKnowledge()` con scoring + `generateBotResponse()` con Groq Llama 3.1 8B
- **Paleta**: `#88B078` primary, `#F8F9FA` bg, `#1A1A1A` text, cards sin borders, `rounded-[20px]`
- **PayPal, QvaPay, Transfermóvil**: 3 proveedores de pago activos. PayPal real via REST API v2
- **Cola persistente en DB**: polling a `AnalysisJob` cada 3s, throttle 2.5s entre jobs
- Sin Stripe, sin BullMQ, sin Redis

## Test Commands
- `npm test` — run Vitest (170 tests across 15 suites)
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
- `src/lib/__tests__/email.test.ts` — 8 tests
- `src/lib/__tests__/webp.test.ts` — 6 tests
- `src/lib/services/__tests__/diary.service.test.ts` — 12 tests
- `src/lib/services/__tests__/challenge.service.test.ts` — 7 tests
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
- `DATABASE_URL` — PostgreSQL (Supabase con pgBouncer)
- `NEXTAUTH_SECRET` — NextAuth secret
- `NEXT_PUBLIC_APP_URL` — base URL (`https://the-serene-lens-nuevo.onrender.com`)
- `NEXTAUTH_URL` — NextAuth URL (`https://the-serene-lens-nuevo.onrender.com`)
- `GROQ_API_KEY` — AI analysis (vision + text)
- `GMAIL_USER` — Gmail SMTP user (used for all transactional emails)
- `GMAIL_APP_PASSWORD` — Gmail SMTP app password
- `RESEND_API_KEY` — legacy (no longer used)
- `CRON_SECRET` — cron job authorization (UV alerts, etc.)
- `NEXT_PUBLIC_POSTHOG_KEY`, `NEXT_PUBLIC_POSTHOG_HOST` — product analytics
- `NEXT_PUBLIC_SENTRY_DSN` — error tracking
- `NEXT_PUBLIC_WHATSAPP_NUMBER` — WhatsApp contact
- `NEXT_PUBLIC_CUP_FALLBACK` — USD→CUP rate override
- `ROOT_ADMIN_EMAIL` — email that gets ADMIN role on registration
- `PAYPAL_CLIENT_ID` — PayPal REST API client ID
- `PAYPAL_CLIENT_SECRET` — PayPal REST API secret
- `PAYPAL_SANDBOX` — set "true" for sandbox, omit for production

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
- Mobile-first
- Tailwind v4 with `tw-animate-css` (NOT `tailwindcss-animate`)
- CSS animations only — no Framer Motion
- `sonner` for toasts (Toaster in root layout)
- Zod v4 (use `.issues` not `.errors`)
- Prisma 7 + next-auth v4 + `@auth/prisma-adapter` v2.8

## Key Decisions
- **ok() wrapper**: All API routes use `ok()`/`error()`/`unauthorized()`/`forbidden()`/`notFound()`/`serverError()` from `@/lib/api-response`. Returns `{ success: true, data: {...} }`. Frontend accesses via `d?.data?.X || d.X`. Exception: routes needing custom headers (Cache-Control) use `NextResponse.json` directly.
- **XSS sanitization en emails**: `sanitizeHtml()` de `@/lib/sanitize` se usa en TODOS los templates de email que interpolan datos de usuario
- **Payments**: PayPal + QvaPay + Transfermóvil. QvaPay via `app-id`/`app-secret` headers. PayPal via REST API v2 (access token + Orders/Capture). `Subscription.provider` default `"qvapay"`.
- **Email system**: Gmail SMTP via nodemailer (`src/lib/email.ts`). Replaces Resend. Templates: password reset, welcome, payment success, admin bulk. GMAIL_USER + GMAIL_APP_PASSWORD from `.env`.
- **Challenges display-only**: Challenge "Complete" button removed from frontend. Points tracked but cannot be earned manually.
- **Image compression >10MB**: Files over 10MB compressed with aggressive settings (640px, quality 0.4) instead of throwing an error.
- **Products API cache**: In-memory cache (`getCache`/`setCache`) con 1h TTL + CDN Cache-Control `s-maxage=3600`. Key por categoría+limit.
- **PrismaAdapter type**: `PrismaAdapter(db) as any` — version mismatch between adapter v2.8 and next-auth v4.24
- **Prisma 7 migration**: `prisma.config.ts` en root con datasource URL. Driver adapter `@prisma/adapter-pg` + `pg`. Imports desde `@/generated/prisma/client`.
- **Auth guards**: Use `redirect()` from `next/navigation` in client components during render.
- **SessionProvider**: `refetchOnWindowFocus={false}`, `refetchInterval={5 * 60}`, `refetchWhenOffline={false}`
- **Webhook security**: QvaPay v2 uses `app-id`/`app-secret` headers; webhook verifies payment status via GET `/v2/transaction/{uuid}`
- **Plan prices**: FREE (1 analysis/mo), PREMIUM ($4.99/mo unlimited), PRO ($9.99/mo unlimited). PRO_PLUS ($14.99/mo).
- **Pack prices**: BASIC $1.99 (3 analyses), POPULAR $4.99 (5), ADVANCED $6.99 (15). Expiran 30 días después de compra.
- **CUP rate**: Default 500 (`NEXT_PUBLIC_CUP_FALLBACK = 500`).
- **Usage tracking**: backend-enforced via `lib/usage.ts`
- **Multi-photo AI**: All uploaded photos sent to AI model via `imagesBase64` array
- **Login page at `/login`**: Email/password form, social (Google), register toggle.
- **Logo**: `public/logo.webp` (copia de favicon-icon.webp). Flower2 (lucide-react) usado solo en `/about`.
- **Cache**: `src/lib/cache.ts` — memory Map adapter con TTL. `getCache`/`setCache` para productos. `src/lib/cache/db-cache.ts` — memory Map + Supabase table (legacy).
- **Retry mechanism**: `src/lib/retry.ts` con `withRetry()`.
- **Webhook processor desacoplado**: `webhook-processor.ts` maneja lógica de negocio.
- **Cola persistente en DB**: `AnalysisJob` en Supabase. Polling cada 3s, throttle 2.5s. Reemplaza cola en memoria. No Redis/BullMQ.
- **Anti-fraud register**: `/api/register` rate limit 10 registros/IP en 24h.
- **Cron retención**: Notifica 3 días antes de expiración + degrada suscripciones vencidas.
- **Cron UV alerts**: `GET /api/cron/uv-alerts` — consulta Open-Meteo por coordenadas de usuarios PREMIUM+, alerta Telegram si UV≥8
- **Referidos**: `checkAndCompleteReferral` se ejecuta tras primer análisis (no al registrarse). Status inicial "pending".
- **System prompt Groq**: JSON con 8 secciones, etiquetas descriptivas (Leve/Moderado/Visible), sin porcentajes
- **Lazy env loading**: `getAuthEnv()`/`getPaymentsEnv()` con try/catch en vez de `getEnv()` module-level.
- **Feature flags via AppConfig table**: No external service; cached 60s.
- **OffscreenCanvas fallback**: Si falla validación de foto, retorna `pass: true` (permite subir con advertencia).
- **Spam filter en comentarios**: `approved: false` si contiene links, + notificación admin por Telegram.
- **ESTHETICIAN bypass total**: No aplica límite 3/día, ni freno concurrencia, ni cupos Telegram.
- **Admin dashboard auto-refresh**: 120s interval (antes 30s), botón RefreshCw manual con spinner.
- **Seasonal hero**: 2 estaciones tropicales (Cuba): seca (nov-abr) y lluviosa (may-oct). No hemisferio sur.
- **Guías seguras**: PDFs fuera de `public/`. Servidos por `GET /api/guides/download/[slug]` solo tras verificar pago.
- **TransferSMS**: Detección automática por regex del SMS en Telegram, con botones [✅ Confirmar] [❌ Rechazar].
- **`$transaction` → `Promise.all`**: pgBouncer con `?pgbouncer=true` no soporta transacciones multi-statement en Prisma 7.
- **Static RAG ingredients**: `src/lib/ingredient-kb.ts` — 6 concern categories, 22 ingredient entries.
- **Aging prediction prompt**: "Modelo analítico avanzado de IA especializado en estética cosmética" — NOT dermatologist.
- **Username**: auto-generado desde email en Google callback. Opcional en registro.

## Performance Notes
- `SessionProvider` uses `refetchOnWindowFocus={false}`
- API routes return `Cache-Control: private, max-age=10, s-maxage=30` where appropriate
- `GET /api/analysis/[id]` uses `select` to avoid fetching unnecessary fields
- Prisma compound index `@@index([userId, createdAt])` speeds up history queries
- Image compression skips canvas processing for files < 100KB
- Protected pages use render-time `redirect()` for immediate navigation
- **Edge Runtime**: `/api/health` y `/api/og` usan edge
- **DNS prefetch**: Layout pre-conecta a Sentry, QvaPay
- **N+1 prevention**: `/api/analysis` incluye feedback con `select` mínimo
- **FAQ lazy-load**: `faq-section.tsx` con `next/dynamic`
- **Slow connection adaptation**: `use-slow-connection.ts` hook detects 2G/3G
- **Service worker**: `public/sw.js` — cache-first for static assets
- **Prisma indexes**: User(plan, role, createdAt), Payment(status, createdAt, userId+status), Subscription(provider, currentPeriodEnd), PurchasePack(status, userId+status, createdAt), WebhookEvent(provider, provider+eventType), SkinDiary(userId+date), Challenge(active, createdAt)
- **Lazy image loading**: `LazyChart` component with `next/dynamic` + skeleton
- **Feature flags**: `lib/feature-flags.ts` — AppConfig table, 60s cache
- **Products direct DB query**: No unstable_cache — Render serverless caching issues
- **LazyChart**: chart components lazy-loaded con `next/dynamic` + skeleton

## Security
- **Rate limiting**: DB-backed via `lib/rate-limit.ts` — `/api/contact` (5/hour/IP), `/api/feedback/survey` (10/day/user), `/api/register` (10/day/IP), `/api/payments/webhook` (30/min/IP), `/api/auth/forgot-password` (5/hour/IP), `/api/admin/emails/send` (5/hour/admin), `/api/analyze` (rate limited)
- **Input sanitization**: All user inputs stripped of HTML tags via regex before DB storage
- **CRON_SECRET**: Timing-safe comparison with `crypto.timingSafeEqual`
- **CSRF**: Token generation and validation in `lib/csrf.ts`
- **Auth guards**: `redirect()` from `next/navigation` in client components during render
- **Webhook security**: QvaPay verified via GET `/v2/transaction/{uuid}` with app credentials
- **No PII in analytics**: PostHog tracks events only
- **Correlation IDs**: Middleware injects `x-correlation-id` on every request
- **Sentry replays**: Session replay 0.1, error replay 1.0, text masking
- **Health check**: `/api/health` returns DB latency, queue stats, memory, uptime, version
- **Admin debug endpoint**: `/api/admin/debug` — DB counts (admin only)
- **Community XSS protection**: All posts/comments stripped of HTML via `stripHtml` + Zod validation
- **Email XSS protection**: All email templates sanitize user data via `sanitizeHtml()` before interpolation
- **Analyze security**: 5-point check — auth (session o x-api-key Telegram), ESTHETICIAN bypass, 3/día limit, concurrent throttle (≥2→QUEUED), Telegram cupo por tandas 12h
- **Guías seguras**: PDFs fuera de `public/`, servidos solo tras verificar `DigitalProductPurchase`

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
| ESTHETICIAN | — | Para Clínicas (logo, nombre, dirección, teléfono en PDF). Bypass total de límites |
| Pack Básico | $1.99 | 3 analyses, history unlocked, 30 days |
| Pack Popular | $4.99 | 5 analyses, comparison, 30 days |
| Pack Avanzado | $6.99 | 15 analyses, priority, 30 days |

## Page Structure
- `/` — landing page: hero with seasonal messages (tropical), badge + title + CTAs, 4 action cards, quick skin test, how-it-works, features, pricing preview, FAQ, legal disclaimer
- `/about` — founding story, mission, values, CTA
- `/login` — sign in / register page (email/password, Google)
- `/analysis` — 4-step guided wizard: Consent → Photo Assistant → Questions → Processing → redirect to results
- `/analysis/results/[id]` — 8 sections with explainable AI, no percentages, descriptive labels
- `/products` — product scanner + catalog (50 products from seed)
- `/products/[slug]` — product detail with ingredients + Schema.org JSON-LD
- `/guides` — digital products store (5 e-books from seed)
- `/join/[code]` — referral group join landing page
- `/blog` — articles with category filter
- `/blog/[slug]` — article body + Schema.org JSON-LD
- `/dashboard/` — user dashboard with welcome banner on first visit (`?welcome=1`)
- `/dashboard/history` — chronological timeline of past analyses
- `/dashboard/subscription` — plan status, usage bars, payment history
- `/dashboard/profile` — user profile + sign out + delete account
- `/dashboard/diary` — daily skin diary (próximamente)
- `/dashboard/challenges` — gamification challenges (display-only, no complete button)
- `/dashboard/referrals` — referral group management
- `/dashboard/guides` — purchased guides list
- `/dashboard/report` — PDF report generator (PRO+ only)
- `/pricing` — subscriptions + packs, USD/CUP, QvaPay payments
- `/pricing/success` — payment confirmation after QvaPay redirect
- `/pricing/cancel` — payment cancellation page
- `/contact` — contact form
- `/ingredients-analyzer` — SEO landing page
- `/admin/` — admin panel: stats, users, payments, messages, blog, products, guías, feature flags, analytics, health check
- `/admin/users` — user management with role/plan editing (FREE/PREMIUM/PRO/PRO+/ESTHETICIAN)
- `/admin/payments` — payment history
- `/admin/transfers` — transfer validation (Transfermóvil)
- `/admin/blog` — blog post management + "Generar Borrador con IA" button
- `/admin/products` — product management
- `/admin/messages` — contact messages
- `/admin/emails` — bulk email sender (Gmail SMTP) + push notifications with tab selector
- `/admin/notifications` — send push notifications to user segments
- `/admin/guides` — digital product CRUD (create/toggle/delete guides)
- `/admin/feature-flags` — feature flag management (create/toggle ON/OFF)
- `/unsubscribe` — unsubscribe page for marketing emails

## Photo Upload (Guided Assistant)
- `/analysis` — 4 photo steps shown one at a time
  - Paso 1: Foto frontal (obligatoria)
  - Paso 2: Perfil izquierdo (obligatoria)
  - Paso 3: Perfil derecho (obligatoria)
  - Paso 4: Acercamiento opcional de zona de interés
- Photos validated for type, size (<10MB, compressed if larger), blur, brightness
- OffscreenCanvas fallback: si falla validación, permite subir igual

## Photo Quality Validation
- `src/lib/photo-quality.ts` — client-side validation
- Uses `OffscreenCanvas` + `createImageBitmap`
- Blur detection: Laplacian variance ≥ 30 passes
- Brightness check: 40–220 passes

## Analysis Results
- 8 organized sections: Resumen General, Tipo de Piel, Observaciones (con severidad Leve/Moderado/Visible), Factores, Recomendaciones, Rutina (mañana/noche), Productos, Historial
- Legal disclaimer at bottom
- No percentages — only descriptive labels and severity badges

## Legal Pages
- `/terms` — medical disclaimer, AI limitations, subscription terms
- `/privacy` — data collection, storage, user rights, cookies

## Auth Flow
- `/login` — sign-in form (credentials + Google)
- `POST /api/register` — creates user account (acepta username opcional), sends welcome email, redirects to `/dashboard?welcome=1`
- `/forgot-password` — generates reset token
- `/reset-password` — validates token, updates password
- **Middleware**: `/login` redirects authenticated users to `/dashboard`
- **Admin users**: Created with `role: "ADMIN"` when email matches `ROOT_ADMIN_EMAIL`
- **Google callback**: auto-genera `username` desde email si no existe

## API Routes (Analysis)
- `POST /api/analyze` — 5-point security check, crea AnalysisJob, retorna jobId
- `GET /api/analyze/queue-status?jobId=` — polling de posición en cola
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
- `POST /api/community/posts/[id]/comments` — add comment (spam filter: links → approved:false + notify admin)

## API Routes (Admin Emails)
- `POST /api/admin/emails/send` — send bulk emails via Gmail SMTP (nodemailer)
- `GET /api/admin/emails/history` — email send history
- `POST /api/unsubscribe` — unsubscribe from marketing emails
- `GET /api/unsubscribe?email=` — check if email is unsubscribed

## API Routes (Payments)
- `POST /api/payments/create` — creates QvaPay invoice (plan or pack)
- `POST /api/payments/create-pack` — creates QvaPay pack invoice
- `POST /api/payments/create-guide` — create QvaPay invoice for guide purchase
- `POST /api/payments/webhook` — QvaPay webhook (idempotente via WebhookEvent.processedAt)
- `POST /api/payments/create-paypal` — creates PayPal order real via REST API v2, retorna approvalUrl
- `POST /api/payments/capture-paypal` — captura orden PayPal after approval, actualiza suscripción
- `POST /api/payments/validate-transfer` — validator marks transfer as confirmed
- `POST /api/payments/activate-transfer` — admin activates subscription from transfer
- `POST /api/payments/cancel-transfer` — cancel a transfer
- `GET /api/user/usage` — usage info for current user
- `GET /api/admin/analytics` — revenue, plan distribution, conversion rate
- `GET /api/admin/stats` — full dashboard stats (users, analyses, payments, guides, referrals, etc.)
- `GET /api/admin/users` — list all users (admin only)
- `PUT /api/admin/users` — update user role/plan (admin only)
- `PUT /api/user/clinic` — update clinic info (logo, name, address, phone) for ESTHETICIAN
- `GET /api/user/clinic` — get clinic info for current ESTHETICIAN user
- `GET /api/admin/payments` — list all payments (admin only)
- `GET /api/admin/debug` — debug DB counts (admin only)
- `POST /api/admin/notifications/send` — send push notification to user segment (all/free/premium/pro/proPlus/new/telegram)
- `GET /api/admin/notifications` — unread group completion notifications (admin only)
- `POST /api/admin/notifications` — mark notification as read (admin only)
- `GET /api/admin/guides` — list all digital products (admin only)
- `POST /api/admin/guides` — create digital product (admin only)
- `PATCH /api/admin/guides/[id]` — update digital product (admin only)
- `DELETE /api/admin/guides/[id]` — delete digital product (admin only)
- `GET /api/guides` — list available digital products (sin fileUrl)
- `GET /api/guides/download/[slug]` — download purchased guide PDF (verifica pago)

## API Routes (Admin Blog Generator)
- `POST /api/admin/blog/generate` — genera borrador con Groq Llama 3.1 8B (keyword + contexto)

## API Routes (Referral Groups)
- `GET /api/referral` — list user's referral groups
- `POST /api/referral` — create new referral group
- `GET /api/referral/[code]` — get group info (public)
- `POST /api/referral/[code]` — join referral group (auth required)

## API Routes (PRO+ Features)
- `POST /api/aging-predict` — aging prediction with structured outputs + RAG ingredient injection
- `GET /api/user/monthly-comparison` — monthly analysis comparison (PRO+ only)
- `GET /api/user/dynamic-routine` — dynamic routine based on season + skin type (PRO+ only)
- `GET /api/user/social-comparison` — anonymous comparison with friends' results

## API Routes (Admin Messages)
- `GET /api/admin/messages` — list contact messages
- `PATCH /api/admin/messages` — mark read / reply to message

## API Routes (Cron)
- `GET /api/cron/uv-alerts` — alertas UV por Telegram si ≥8 (protegido con CRON_SECRET)

## Prisma Models (2026-07-08)
- `User`: +username (único), +telegramTrialStartedAt, +isTelegramPremiumActive, +latitude, +longitude
- `AnalysisJob`: nuevo — cola persistente (id, userId, status, attempts, createdAt, etc.)
- `Comment`: +approved (default true) — spam filter
- `Referral`: +firstAnalysisAt — se completa al primer análisis, no al registro
- `DigitalProduct`: e-books (title, slug, price, fileUrl, category)
- `DigitalProductPurchase`: purchase records for digital products
- `GroupAnalytics`: tracks referral group progress
- `Referral`: individual referral records (referrerId, referredId, code, groupId, status, discountPrice)

## Telegram Bot Commands

### USER (FREE trial 72h, PREMIUM+ ilimitado)
| Comando | Descripción |
|---------|-------------|
| `/start` | Menú principal |
| `/web` | Ir a la web |
| `/precios` | Ver planes |
| `/status` | Estado de mi cuenta |
| `/ayuda` | Ayuda general |
| `/skincare` | Tip del día |
| `/contacto` | Contactar soporte |
| `/meme` | Meme skincare |
| `/recomendar` | Recomendar a un amigo |
| `/feedback` | Dar feedback |
| `/recordatorio` | Configurar recordatorio |
| `/mi_rutina` | Ver mi rutina actual |
| `/diario` | Últimos 7 días de análisis |
| `/test_piel` | Test rápido de tipo de piel |

### VALIDATOR
| Comando | Descripción |
|---------|-------------|
| `/validar REF` | Validar transferencia |
| `/pendientes` | Ver transferencias pendientes |
| `/buscar TEXTO` | Buscar usuario/pago |
| `/historial EMAIL` | Historial de pagos |
| `/consultar TEXTO` | Consultar IA sobre skincare |
| `/validatorhelp` | Ayuda detallada |

### ADMIN
| Comando | Descripción |
|---------|-------------|
| `/pendientes` | Transferencias pendientes |
| `/validar REF` | Validar transferencia |
| `/activar REF` | Activar plan |
| `/reporte` | Reporte de ingresos |
| `/usuarios` | Estadísticas usuarios |
| `/trending` | Tendencias de uso |
| `/cliente EMAIL` | Info cliente + enlace admin |
| `/analisis ID` | Ver análisis completo |
| `/broadcast TEXTO` | Enviar mensaje a todos |
| `/logs` | Últimos errores del bot |
| `/alerta TEXTO` | Enviar alerta a admins |
| `/promocion TEXTO` | Crear promoción |
| `/whois ID` | Info por Telegram ID |
| `/consultar TEXTO` | Consultar IA sobre skincare |
| `/adminhelp` | Ayuda detallada |

## Relevant Source Files
- `src/lib/paypal.ts` — PayPal REST API utility (getAccessToken, createOrder, captureOrder, verifyOrder)
- `src/lib/cache.ts` — in-memory cache adapter with TTL (Map + expiresAt)
- `src/lib/queue.ts` — DB-persisted job queue (polling AnalysisJob every 3s)
- `src/lib/groq.ts` — system prompt JSON 8 sections, severity labels, no percentages
- `src/lib/auth.ts` — registerUser with username, Google callback auto-username
- `src/lib/services/analysis.service.ts` — new prompt mapping, referral hook
- `src/lib/telegram-handlers.ts` — all command handlers (+mi_rutina, +diario, +test_piel), inline keyboard menus, callback handlers
- `src/lib/telegram-responses.ts` — static response messages
- `src/lib/photo-quality.ts` — OffscreenCanvas with fallback (pass: true on error)
- `src/lib/ingredient-kb.ts` — static ingredient RAG knowledge base
- `src/lib/validations/index.ts` — zod schemas (+username in registerSchema)
- `src/app/api/payments/create-paypal/route.ts` — create PayPal order endpoint
- `src/app/api/payments/capture-paypal/route.ts` — capture PayPal after approval
- `src/app/api/admin/notifications/send/route.ts` — send notifications by segment
- `src/app/api/user/clinic/route.ts` — ESTHETICIAN clinic profile CRUD
- `src/app/api/products/route.ts` — products API with in-memory cache (1h TTL)
- `src/lib/email.ts` — Gmail SMTP nodemailer transporter + templates (password reset, welcome, payment success, admin bulk)
- `src/app/api/admin/emails/send/route.ts` — admin bulk email endpoint by segment
- `src/app/admin/emails/page.tsx` — admin email/push notification UI with tab selector
- `src/app/admin/page.tsx` — admin dashboard with refresh button + PayPal revenue
- `src/app/pricing/success/page.tsx` — handles QvaPay + PayPal payment verification
- `src/app/dashboard/subscription/page.tsx` — subscription page with PayPal button
- `src/app/pricing/page.tsx` — pricing page with ESTHETICIAN "Para Clínicas" badge
- `prisma/schema.prisma` — User (+username, telegram fields, lat/lng), AnalysisJob, Comment.approved, Referral.firstAnalysisAt

