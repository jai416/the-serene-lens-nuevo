# AGENTS.md — The Serene Lens

## Servicios Externos Integrados

### Microsoft Clarity (Analytics de comportamiento) — ✅ Completo
- `src/components/clarity-analytics.tsx` — script injection vía `next/script`
- ID del proyecto: `NEXT_PUBLIC_CLARITY_PROJECT_ID` en `.env`
- CSP actualizado para permitir `clarity.ms`
- Integrado en root layout, carga afterInteractive

### Sentry (Monitoreo de errores) — ✅ Completo (100%)
- `sentry.server.config.ts`, `sentry.client.config.ts`, `sentry.edge.config.ts` — todos inicializados
- `instrumentation.ts` carga la config correcta según runtime
- `api-response.ts:serverError()` captura automáticamente en Sentry
- `src/lib/sentry.ts` — helpers: `captureError`, `captureMessage`, `setSentryUser`
- Auth (`src/lib/auth.ts`) — `setSentryUser()` en session callback
- `ErrorBoundary` component con captura de errores React
- `tracesSampleRate: 0.1` en producción (10%)
- Fallback silencioso si no hay DSN
- CSP actualizado para Sentry endpoints
- `next.config.mjs` — remotePatterns incluye `res.cloudinary.com`

### Cloudinary (Imágenes CDN) — ✅ Completo (100%)
- `src/lib/cloudinary.ts` — lazy import (no rompe tests sin package)
- Funciones: `uploadImage`, `deleteImage`, `isConfigured`
- Integrado en `PUT /api/user/clinic` — logos base64 se suben a Cloudinary automáticamente
- Fallback a base64 si Cloudinary no está configurado
- Carpeta: `the-serene-lens/logos`
- `next.config.mjs` — `remotePatterns` incluye `res.cloudinary.com`
- CSP permite conexiones a Cloudinary

### Redis/Upstash (Caché persistente + Rate Limiting) — ✅ Completo (100%)
- `src/lib/redis.ts` — lazy import (no rompe tests sin package)
- Funciones: `redisGet`, `redisSet`, `redisDel`, `redisFlushAll`, `isRedisConfigured`
- `src/lib/cache.ts` rewrite: Redis como primario, memoria como fallback
- `src/lib/rate-limit.ts` rewrite: Redis como primario (sorted sets con TTL), DB como fallback
- Rate limits con Redis: auto-expiran vía TTL, sin necesidad de cleanup
- Fallback silencioso a DB/memoria si Redis no está configurado

### OpenWeatherMap (Clima real) — ✅ Completo
- `src/lib/weather.ts` — obtiene temperatura, condición, humedad, estación
- `analysis.service.ts` pasa clima real al prompt de IA
- Fallback: estación tropical según latitud y mes

## Project Status
**Next.js 16 + Prisma 7 + Groq AI + QvaPay/Transfermóvil + Telegram Bot.**
- Landing: benefit-driven hero ("Descubre lo que tu piel necesita") + trust signals (30s, privacidad, sin tarjeta)
- AI skin analysis (Groq Llama 3.2 11B Vision + qwen3-32b text), step-by-step 4-step wizard
- Locale system: EN/ES auto-detect + manual toggle (on top-header and profile)
- 2 payment providers: QvaPay (USD, tarjeta internacional), Transfermóvil (CUP, Cuba)
- Blog, products, ingredient analyzer, community (comments + spam filter)
- Admin panel: light mode (same palette as rest of app), users, payments, blog, products, guides, feature flags, analytics, health check, Telegram broadcast, AI blog generator, knowledge base sync
- PRO+ ($14.99/mo): PDF reports, dynamic routine, monthly comparison
- Digital guides: e-books sold via QvaPay, PDFs protected (not in public/)
- Telegram Bot: webhook, permission matrix (FREE trial 72h, PREMIUM+ unlimited, ESTHETICIAN total), TransferSMS detection
- DB-persistent queue: AnalysisJob polling every 3s, 2.5s throttle between jobs
- **7-day PREMIUM trial on registration**: new users get PREMIUM plan + `trialEndsAt = now + 7d`. Cron endpoint `POST /api/cron/cleanup-trials` degrades expired trials to FREE + resets analysis limits. Trial banner shown on pricing + subscription pages.
- **Annual plans**: `PREMIUM_ANNUAL` ($49.99/yr, save 16%) and `PRO_ANNUAL` ($99.99/yr) with 365-day subscription period. Webhook and verify route handle annual period correctly.
- **Lead Magnet**: `POST /api/lead-magnet` collects email, sends free skincare guide. Landing section with email form. Rate-limited (3/hr/IP).
- **Gift Packs**: `POST /api/payments/gift` buys a pack for another email, sends gift code via email. `POST /api/payments/redeem-gift` redeems code. Model: `GiftPack`. UI in pricing page.
- **User Reminders**: Profile page allows setting weekly/biweekly/monthly email reminders. `GET/PUT /api/user/reminders`. `GET /api/cron/send-reminders` sends due reminders.
- **Evolution Chart**: Upgraded to Recharts `LineChart` with 6 skin categories, trends grid, severity diff. Only shown to non-FREE users.
- **Share results**: Web Share API + clipboard fallback on analysis results page.
- **Before/After comparison**: New `PreviousAnalysesComparison` component on analysis results page. Shows trend indicators (improved/worsened/stable) for 6 skin categories vs the previous analysis.
- **Dynamic sitemap**: Now includes blog posts, products, and guides from DB (not just static pages).
- **Esthetician Referral Code System**: Each clinic auto-generates a unique `EST-XXXXXX` code. Clients enter it at registration to link their account to the esthetician. Dashboard shows referred count, marketing kit with share/flyer/email/discount tools.
- **No Redis, no BullMQ, no Stripe**

## Tests
- **19 test files, 194 tests**
- Coverage: lib utils, services, validations, API routes (webhook, lead-magnet, contact, challenges)
- Framework: Vitest v3

## Commands
| Command | Description |
|---------|-------------|
| `npm run dev` | Dev server (Turbopack) |
| `npm run build` | Production build |
| `npm test` | Vitest (194 tests, 19 suites) |
| `npm run test:watch` | Vitest watch mode |
| `npm run type-check` | `tsc --noEmit` |
| `npm run seed` | Seed DB (admin + demo + 41 products + 31 challenges + 11 guides) |
| `npm run seed:knowledge` | Seed RAG knowledge base |
| `npm run db:generate` | Regenerate Prisma client |
| `npm run db:push` | Push Prisma schema to DB |
| `npm run db:migrate` | Run Prisma migrations |

**IMPORTANT**: `npm run seed` must run on production after every deploy.

## Gotchas — Read Before Changing Anything

### 1. DB Atomicity: `$transaction` is real, but `Promise.all` in services is fire-and-forget

The codebase uses `db.$transaction()` in API routes (`activate-transfer`, `cancel-transfer`, `validate-transfer`, `webhook`) and `telegram-handlers.ts`. These ARE atomic.

However, the **service layer** (`analysis.service.ts`) runs critical steps as sequential `try/catch` blocks **outside** transactions:
- `AnalysisRepository.create()` → saves to DB (line 84)
- `db.skinDiary.upsert()` → auto-saves diary (line 119, wrapped in try/catch)
- `checkAndCompleteReferral()` → marks referral complete (line 131, wrapped in try/catch)

If the diary upsert fails, the analysis still saves. If the referral check fails, the referral stays incomplete. **These failures are silently swallowed.** When adding new post-analysis steps, wrap non-critical ones in `try/catch` so they don't break the flow, but be aware that partial failures leave inconsistent state.

**FIXED**: The QvaPay webhook handler (`webhook/route.ts`) now wraps payment update + pack/subscription creation in `db.$transaction()`. If the second call fails, the entire transaction rolls back and QvaPay can retry cleanly.

### 2. Queue Worker: Retry with capped attempts

`src/lib/queue.ts` processes jobs with up to `MAX_ATTEMPTS` (3) retries. On Groq API failure, the job re-queues as `PENDING` with an incremented `attempts` counter. After 3 failures, it's marked `FAILED`.

The `processing` flag + `THROTTLE_MS` (2.5s) timing means a stuck retry loop would freeze the entire queue. Always cap retries and mark as FAILED at the limit.

The `OffscreenCanvas` fallback on the client returns `pass: true` when validation fails (old phones, dark/blurry images). This means the backend receives images that may be completely unusable. If the Groq model returns unparseable JSON or empty responses, `extractJSON()` in `groq.ts` returns a **fallback object** with a user-friendly message ("repita el análisis con mejor luz") instead of throwing. This saves the job from failing on malformed AI output.

### 3. Telegram TransferSMS: No inline button race condition (yet)

Transfer validation in `telegram-handlers.ts` uses a **text-based confirmation flow**, not inline callback buttons:
- `/validar REF` → bot shows transfer details → user types "confirmar" → `conversationState` tracks the step
- `/activar REF` → same text-based flow

The `validar_idx_N` callback_data in `handlePendientes` is used only for the validation flow and goes through the same text confirmation. There is no direct "click button → activate immediately" path that two validators could race on.

However, batch operations (`/validar todos`, `/validar 1,2,3`) run in a `for` loop without locking. If two admins run batch validate simultaneously on the same transfers, the second will fail at the DB level (status already changed). The `try/catch` around each operation handles this gracefully.

### 4. Products cache: In-memory only, wiped on Render restart

`src/lib/cache.ts` uses a `Map` with TTL. On Render container restarts (deploy, inactivity, RAM spike), the cache empties. The first requests to `/api/products` after restart will be slow as the cache re-warms from DB. This is expected behavior — no code change needed, but monitor logs for cold-start latency.

### 5. Session: JWT refreshes from DB on every access

In `src/lib/auth.ts:76`, the adapter is cast as `any` due to version mismatch (adapter v2.8 vs next-auth v4.24). The `jwt` callback now calls `db.user.findUnique()` to refresh `name`, `plan`, `role`, and `username` from DB on every token refresh. This means plan changes (admin upgrades) reflect immediately without logout.

The `session` callback injects: `role`, `plan`, `id`, `name`, `email`, `username`. It does NOT inject `latitude`, `longitude`, or `telegramTrialStartedAt`.

### 6. `tsc --noEmit` timeout on low-memory machines

On machines with limited RAM (e.g. Render free tier, small VPS), `npx tsc --noEmit` may crash with a Bus Error or timeout. This is a memory issue, not a code error. The pre-commit hook runs `tsc --noEmit` — if it fails due to memory, use `git commit --no-verify` to bypass.

### 7. Annual plan period handling must be consistent

Three places set subscription periodEnd:
- `POST /api/payments/webhook` — correctly checks `plan.endsWith("_ANNUAL")` for 365 vs 30 days
- `POST /api/payments/verify` — same logic (copy from webhook)
- `billing.service.ts` — uses `getPlan(user.plan)` to check `analysesPerMonth === -1` instead of hardcoded plan list

When adding new plans, update ALL three files plus `getPlanLabel()` in `src/lib/utils.ts`.

### 7. Profile page: session-only data, no DB on mount

`/dashboard/profile` (`page.tsx`) does NOT fetch analyses or usage from DB on mount. It relies entirely on session data. The only DB call is `PUT /api/user/profile` when the user saves their name. This keeps the page fast and avoids unnecessary DB reads.

If you need analysis count / usage info on the profile, fetch it lazily (on click or via a dedicated component that loads independently).

### 8. Analysis page: `webcamSlot` conditional must be inside `return`

The WebcamCapture component is conditionally rendered (`{webcamSlot && <WebcamCapture .../>}`) inside the main JSX return. It must NOT be placed after the closing `</div>` tags — Turbopack will fail with "Expected '</', got 'ident'". Always keep inline conditionals within the JSX tree.

### 9. CSRF cookie must be readable by JavaScript

The middleware sets `csrf-token` cookie via `response.cookies.set()` with `httpOnly: false` explicitly. If this were `httpOnly: true` (default in some Next.js versions), `document.cookie` could not read it and `getCsrfToken()` in `csrf-client.ts` would return empty string, causing all CSPF validations to fail with 403. Always keep `httpOnly: false` for CSRF cookies.

### 10. CSP headers duplicated — middleware CSP logic is dead code

Both `next.config.mjs` (via `async headers()`) and `middleware.ts` set Content-Security-Policy headers. Since Next.js processes `next.config.mjs` headers first, the middleware check `if (!existingCsp)` always finds an existing header and skips. The CSP block in middleware.ts (lines 64-67) is effectively dead code. When changing CSP, edit `next.config.mjs` only.

### 11. Analysis API returns 401 for unauthenticated users

`GET /api/analysis` previously returned `200 { analyses: [] }` for unauthenticated users. Now correctly returns 401. The `src/app/api/analysis/route.ts` line 11 was changed from `return ok({ analyses: [] })` to `return unauthorized()`.

### 12. Dashboard placeholder pages must have auth guards

`/dashboard/referrals`, `/dashboard/social`, and `/dashboard/support` are all client components that must guard with `useSession()` + `redirect()`. The support page already does API calls to `/api/support/messages` which the backend protects, but the frontend must prevent rendering without auth. Always add `useSession()` + early redirect to any new dashboard page.

### 13. QvaPay timeout and retry

`src/lib/payments.ts` now uses:
- 25s timeout (up from 10s) for all QvaPay API calls
- 1 automatic retry with 1s backoff for network errors
- `User-Agent` header to avoid Cloudflare blocks
- `Accept: application/json` header
- `getQvaPayPaymentStatus` now also has a proper timeout (was missing one)

The QvaPay API is behind Cloudflare (104.26.x.x). If 502 persists from Render, it's a network-level block, not a code issue.

### 14. `Span` wrapper for lucide icon tooltips

Lucide icons in React do not accept a `title` prop directly. Wrap them in `<span title="...">`:

```tsx
// ❌ <TrendingUp title="Mejoró" />
// ✅ <span title="Mejoró"><TrendingUp className="..." /></span>
```

### 15. Sitemap is async/dynamic

`src/app/sitemap.ts` now queries the database for blog posts, products, and guides. It uses `try/catch` to fall back to static pages if the DB is unreachable.

### 16. Esthetician Referral Code — Generated on Clinic creation, not customizable

`Clinic.referralCode` is auto-generated as `EST-XXXXXX` (6 random uppercase chars) on clinic creation in `PUT /api/user/clinic`. It is NOT customizable by the user — avoids collisions.

`User.referredByEstheticianId` links the user to the clinic when they register with a code. The registration flow in `src/lib/auth.ts`:
1. `registerUser` takes optional `estheticianCode`
2. Looks up `Clinic.findUnique({ where: { referralCode } })`
3. If found, sets `User.referredByEstheticianId = clinic.ownerId`
4. If code invalid, returns `error("Código de esteticista inválido")`

The login page has a "Código de Esteticista (opcional)" input in registration mode.

### 17. Marketing Kit Self-Service

Estheticians access `/dashboard/esthetician/marketing` to:
- View/share their referral code (copy, Web Share API, mailto link)
- Generate a 20% discount code tied to their clinic (stored in `DiscountCode`)
- See a preview flyer with their code and clinic name
- Use an email template with dynamic code insertion
- Track referred clients count

### 18. API responses use `d?.data?.X || d.X` pattern

API routes return `ok({...})` which wraps in `{ data: {...} }`. The esthetician marketing API (`/api/esthetician/marketing`) follows this convention. Frontend reads with `const body = d?.data || d`.

### Modelos de IA y Prompt

- **Visión (análisis de piel, product scanner):** `llama-3.2-11b-vision-preview` en Groq (gratis)
- **Texto (chat, RAG, SEO, blog):** `qwen3-32b` en Groq (gratis) — mejora soporte multilingual vs. anterior `llama-3.1-8b-instant`
- Sin OpenRouter, sin Gemini. Solo Groq free tier.
- **System prompt dinámico** (`groq.ts`): Se construye con `buildSystemPrompt(context)` que recibe `age`, `concerns`, `gender`, `climate`, `routine` del usuario. Así el análisis se personaliza según la edad, preocupaciones y clima del usuario.
- **User prompt**: Pide explícitamente evaluar textura, poros, hidratación, sebo, pigmentación, líneas de expresión, ojeras y uniformidad del tono.
- **Salida**: JSON con 8 secciones, severidades descriptivas (no porcentajes), rutinas AM/PM adaptadas al clima tropical.

## Environment

All env vars in `.env.example`. Key vars:
- `DATABASE_URL` — PostgreSQL (Supabase)
- `GROQ_API_KEY` — AI analysis (vision + text)
- `GMAIL_USER` / `GMAIL_APP_PASSWORD` — SMTP for all transactional emails
- `CRON_SECRET` — cron job authorization

- `ROOT_ADMIN_EMAIL` — gets ADMIN role on registration
- `NEXT_PUBLIC_APP_URL` — `https://the-serene-lens-nuevo.onrender.com`

## Conventions

- Spanish UI, English code
- Mobile-first, light mode only (no dark mode)
- Tailwind v4 with `tw-animate-css` (NOT `tailwindcss-animate`)
- CSS animations only — no Framer Motion
- `sonner` for toasts (Toaster in root layout)
- Zod v4 — use `.issues` not `.errors`
- Prisma 7 + next-auth v4 + `@auth/prisma-adapter` v2.8
- `ok()`/`error()`/`unauthorized()`/`forbidden()`/`notFound()`/`serverError()` from `@/lib/api-response` for all API routes
- Frontend reads API responses as `d?.data?.X || d.X`
- `vi.hoisted()` for Vitest v3 mock variables

## Key Architecture

- **Prisma 7 with driver adapter**: `@prisma/adapter-pg` + `pg`. Config in `prisma.config.ts`. Imports from `@/generated/prisma/client`.
- **DB**: PostgreSQL via Supabase. `src/lib/db.ts` creates a singleton `PrismaClient` with a `pg.Pool`.
- **Auth**: NextAuth v4 JWT strategy. `PrismaAdapter(db) as any`. Google/GitHub providers optional (env-gated). Auto-links OAuth to existing credentials accounts.
- **Payments**: QvaPay via `app-id`/`app-secret` headers. Transfermóvil manual validation via Telegram bot. Webhook idempotency via `WebhookEvent.processedAt`.
- **Queue**: `src/lib/queue.ts` — `AnalysisQueue` class. Polls `AnalysisJob` every 3s, processes one at a time, 2.5s throttle. Starts automatically in production.
- **Groq AI**: Vision: `llama-3.2-11b-vision-preview` (skin analysis). Text: `qwen3-32b` (chat, RAG, SEO, blog). System prompt is JSON with 8 sections. Descriptive severity labels (Leve/Moderado/Visible), no percentages. Prompt explicitly says "NOT a dermatologist."
- **Locale**: EN/ES via React context. Auto-detects from `navigator.language`, stored in localStorage. Manual toggle in top-header and profile page. Translations in `src/lib/locale/translations.ts`.
- **Feature flags**: `AppConfig` table, 60s cache. No external service.
- **Rate limiting**: DB-backed via `lib/rate-limit.ts`.
- **Emails**: Gmail SMTP via nodemailer (`src/lib/email.ts`). XSS protection via `sanitizeHtml()`.
- **Caching**: In-memory `Map` + TTL for products. DB cache (`db-cache.ts`) for other data.

## Palette

- Primary: `#88B078` (sage green)
- Primary muted: `#E2ECE0`
- Background: `#F8F9FA`
- Surface: `#FFFFFF`
- Text: `#1A1A1A`
- Muted text: `#666666`
- Borders: `#E8E8E8`
- Gold bg: `#FFF9E6`, Gold btn: `#FCEAA6`

## API Routes

### Analysis
- `POST /api/analyze` — 5-point security check, creates AnalysisJob, returns jobId
- `GET /api/analyze/queue-status?jobId=` — poll queue position
- `GET /api/analysis` — list user's analyses
- `GET /api/analysis/[id]` — single analysis detail

### Payments
- `POST /api/payments/create` — QvaPay invoice (plan or pack)
- `POST /api/payments/create-pack` — QvaPay pack invoice
- `POST /api/payments/create-guide` — QvaPay invoice for guide
- `POST /api/payments/webhook` — QvaPay webhook (idempotent)
- `POST /api/payments/validate-transfer` — validator confirms transfer
- `POST /api/payments/activate-transfer` — admin activates (uses `$transaction`)
- `POST /api/payments/cancel-transfer` — cancel transfer

### Admin
- `GET/PUT /api/admin/users` — user management
- `GET /api/admin/payments` — payment history
- `GET /api/admin/stats` — dashboard stats
- `GET /api/admin/analytics` — revenue + plan distribution
- `POST /api/admin/emails/send` — bulk email (Gmail SMTP)
- `POST /api/admin/notifications/send` — push notifications by segment
- `GET/POST /api/admin/challenges` — challenge CRUD
- `GET/POST/PATCH/DELETE /api/admin/guides` — digital product CRUD
- `GET/POST /api/admin/feature-flags` — feature flag management
- `GET/POST /api/admin/messages` — contact messages
- `POST /api/admin/blog/generate` — AI blog draft (Groq)

### Esthetician
- `GET/PUT /api/user/clinic` — ESTHETICIAN clinic profile (auto-generates referralCode on create)
- `GET /api/esthetician/clients` — list/paginate clinic's own patients (limit 200)
- `POST /api/esthetician/clients` — add patient to clinic
- `PATCH/DELETE /api/esthetician/clients/[id]` — update/delete patient
- `GET /api/esthetician/marketing` — clinic referral info + discount code status
- `POST /api/esthetician/marketing` — generate discount code (20%, 50 uses, 1yr)
- `GET /api/esthetician/referred` — list referred users via referral code

### User
- `GET /api/user/usage` — usage info
- `GET /api/user/monthly-comparison` — PRO+ monthly comparison
- `GET /api/user/dynamic-routine` — PRO+ dynamic routine

### Community
- `GET/POST /api/community/posts` — posts with pagination
- `GET/POST /api/community/posts/[id]/comments` — comments (spam filter)

### Guides
- `GET /api/guides` — available guides (no fileUrl)
- `GET /api/guides/download/[slug]` — download purchased guide (verifies payment)

### Referrals
- `GET/POST /api/referral` — user's referral groups
- `GET/POST /api/referral/[code]` — join group

### Other
- `GET /api/cron/uv-alerts` — UV alerts via Telegram (CRON_SECRET protected)
- `POST /api/lead-magnet` — collects email, sends free guide (rate-limited, CSRF protected)
- `POST /api/payments/gift` — buy gift pack for another email (sends gift code)
- `POST /api/payments/redeem-gift` — redeem gift code (requires matching email)
- `GET/PUT /api/user/reminders` — user reminder preferences
- `GET /api/cron/send-reminders` — send due email reminders (CRON_SECRET protected)
- `POST /api/contact` — public contact form (rate-limited 5/hr/IP, no auth required)
- `POST /api/aging-predict` — aging prediction (PRO+)
- `POST /api/skin-diary` — diary CRUD
- `GET/POST /api/challenges` — challenges (display-only, no UI complete button)

## Prisma Models
- `User`: username (unique), telegramTrialStartedAt, isTelegramPremiumActive, latitude, longitude, referredByEstheticianId (nullable FK → Clinic.ownerId)
- `Clinic`: referralCode (unique, auto-generated `EST-XXXXXX`), licenseNumber, logo. Relación `clients → Client[]`, `referredUsers → User[]`
- `Client`: modelo propio del esteticista (name, email, phone, notes). Vinculado a `Clinic` y opcionalmente a `SkinAnalysis.clientId`
- `AnalysisJob`: persistent queue (userId, status, photos, body, result, priority)
- `Comment`: approved (default true) — spam filter
- `Referral`: firstAnalysisAt — completes on first analysis, not registration
- `DigitalProduct`: e-books (title, slug, price, fileUrl, category)
- `DigitalProductPurchase`: purchase records
- `GroupAnalytics`: referral group progress
- `AppConfig`: feature flags (single-row table, 60s cache)
- `RateLimit`: DB-backed rate limiting
- `LeadMagnet`: email captures for free guide download
- `GiftPack`: gift pack purchases with gift code, redemption tracking
- `UserReminder`: reminder frequency/enabled per user
- `AuditLog`: userId, action, targetId, targetType, details, ip, userAgent, createdAt

## Telegram Bot Commands

**USER** (FREE trial 72h, PREMIUM+ unlimited): `/start`, `/web`, `/precios`, `/status`, `/ayuda`, `/skincare`, `/contacto`, `/meme`, `/recomendar`, `/feedback`, `/recordatorio`, `/mi_rutina`, `/diario`, `/test_piel`

**VALIDATOR**: `/validar REF`, `/pendientes`, `/buscar TEXTO`, `/historial EMAIL`, `/consultar TEXTO`, `/validatorhelp`

**ADMIN**: all validator commands + `/activar REF`, `/reporte`, `/usuarios`, `/trending`, `/cliente EMAIL`, `/analisis ID`, `/broadcast TEXTO`, `/logs`, `/alerta TEXTO`, `/promocion TEXTO`, `/whois ID`, `/adminhelp`

## Page Structure

- `/` — landing: hero (tropical seasons), 4 action cards, quick skin test, how-it-works, features, pricing, FAQ
- `/login` — sign in / register (email/password, Google)
- `/analysis` — 4-step guided wizard: Consent → Photos (4 angles) → Questions → Processing
- `/analysis/results/[id]` — 8 sections, explainable AI, severity labels, no percentages
- `/products` — product catalog (50 from seed)
- `/products/[slug]` — product detail + Schema.org
- `/guides` — digital products store
- `/blog` — articles with category filter
- `/dashboard/` — user dashboard, welcome banner (`?welcome=1`)
- `/dashboard/history`, `/dashboard/subscription`, `/dashboard/profile`, `/dashboard/diary`, `/dashboard/challenges`, `/dashboard/referrals`, `/dashboard/guides`, `/dashboard/report`
- `/dashboard/esthetician` — Panel esteticista: pacientes propios (Client model), stats, código de referido, herramientas
- `/dashboard/esthetician/marketing` — Kit de Marketing: compartir código, generar descuento, flyer, plantilla email
- `/dashboard/clinic-settings` — Editar perfil profesional (logo, nombre, licencia, dirección, teléfono)
- `/pricing` — subscriptions + packs, USD/CUP, QvaPay payments
- `/admin/` — admin panel: stats, users, payments, blog, products, guides, feature flags, analytics, health check, emails, notifications
- `/terms`, `/privacy` — legal pages

## Photo Upload

4 steps shown one at a time: frontal (required), left profile (required), right profile (required), close-up (optional).
Client-side validation via `src/lib/photo-quality.ts` (OffscreenCanvas). Fallback: `pass: true` on error (allows upload with warning). Files >10MB compressed (640px, quality 0.4).

## Security

- Rate limiting: DB-backed (`lib/rate-limit.ts`) — see full table below
- **Brute force protection**: 5 intentos fallidos por email en 15 min, 10 por IP/min
- **Transfermóvil concurrencia**: `updateMany` con verificación `status = "validated"` dentro de `$transaction`
- **AuditLog mejorado**: registra IP y User-Agent en cada acción admin
- **Admin logs**: `/admin/logs` con tabla paginada, filtros por acción y búsqueda
- **Página de seguridad**: `/security` con política completa (CSP, rate limits, incidentes)
- Input sanitization: HTML tags stripped via regex before DB
- CRON_SECRET: timing-safe comparison (`crypto.timingSafeEqual`)
- CSRF: token validation in `lib/csrf-middleware.ts`
- Email XSS: `sanitizeHtml()` on all email templates interpolating user data
- Community XSS: `stripHtml` + Zod validation on posts/comments
- Correlation IDs: middleware injects `x-correlation-id`
- Health check: `/api/health` (DB latency, queue stats, memory, uptime)

### Rate Limiting por Ruta

| Ruta | Límite | Ventana |
|------|--------|---------|
| `/api/register` | 10 | día/IP |
| `/api/contact` | 5 | hora/IP |
| `/api/auth/forgot-password` | 5 | hora |
| `/api/auth/reset-password` | 10 | hora |
| `/api/payments/webhook` | 30 | minuto |
| `/api/admin/*` | 30 | minuto |
| `/api/lead-magnet` | 3 | hora/IP |
| Login (email) | 5 | 15 min |
| Login (IP) | 10 | minuto |
| Bot /consultar | 10 | minuto/chatId |

## Relevant Source Files

- `src/lib/queue.ts` — DB-persisted job queue (polls AnalysisJob every 3s)
- `src/lib/groq.ts` — system prompt (8 sections, severity labels, no percentages), retry on 429 only
- `src/lib/auth.ts` — registerUser, Google callback auto-username, jwt callback refreshes from DB

- `src/lib/cache.ts` — in-memory Map + TTL (products API)
- `src/lib/prisma-error.ts` — centralized `handlePrismaError(e)` helper (P2003/P2025/P2002)
- `src/lib/services/analysis.service.ts` — analysis flow with fire-and-forget diary + referral steps
- `src/lib/services/group.service.ts` — referral group logic
- `src/lib/telegram-handlers.ts` — all command handlers, text-based confirmation flow
- `src/lib/photo-quality.ts` — OffscreenCanvas with fallback (pass: true on error)
- `src/lib/ingredient-kb.ts` — static ingredient RAG knowledge base (6 categories, 22 entries)
- `src/components/webcam-capture.tsx` — reusable modal with getUserMedia, privacy explanation, JPEG capture
- `src/components/locale-switcher.tsx` — EN/ES language toggle button
- `src/lib/locale/translations.ts` — Translation dictionaries (50+ keys per locale)
- `src/lib/locale/locale-context.tsx` — React context + provider for locale state
- `src/lib/locale/index.ts` — Barrel export
- `src/middleware.ts` — excludes `/api/auth`, `/api/register`, `/api/telegram/webhook`, `/api/cron`, `/api/chat`, `/api/contact`, `/api/lead-magnet` from CSRF check
- `src/app/api/payments/webhook/route.ts` — QvaPay webhook (uses $transaction)
- `src/app/api/payments/activate-transfer/route.ts` — $transaction con updateMany + verificación status
- `src/app/api/admin/logs/route.ts` — API de registros de auditoría con paginación y filtros
- `src/app/admin/logs/page.tsx` — Página de logs en vivo del panel admin
- `src/app/security/page.tsx` — Política de seguridad completa (11 secciones)
- `src/app/dashboard/profile/page.tsx` — session-only profile (no DB fetch on mount), clean info table, locale switcher
- `src/app/dashboard/esthetician/page.tsx` — Panel esteticista: pacientes propios, stats, código de referido, herramientas
- `src/app/dashboard/esthetician/marketing/page.tsx` — Kit de Marketing: compartir código, flyer, email template, descuento
- `src/app/api/esthetician/marketing/route.ts` — GET marketing data + POST generate discount code
- `src/app/api/esthetician/referred/route.ts` — GET referred users list
- `src/app/api/esthetician/clients/route.ts` — GET/POST clientes propios del esteticista (con paginación/búsqueda/límite 200)
- `src/app/api/esthetician/clients/[id]/route.ts` — PATCH/DELETE cliente individual
- `src/app/api/user/clinic/route.ts` — PUT actualizado con `licenseNumber` y auto-generación de `referralCode`
- `src/app/dashboard/clinic-settings/page.tsx` — Editar perfil clínica con logo upload (base64)
- `src/app/login/page.tsx` — Registro con campo "Código de Esteticista (opcional)"
- `prisma/schema.prisma` — all models
