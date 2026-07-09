# AGENTS.md — The Serene Lens

## Project Status
**Next.js 16 + Prisma 7 + Groq AI + QvaPay/PayPal/Transfermóvil + Telegram Bot.**
- Landing, AI skin analysis (Groq Llama 3.2 11B Vision + Llama 3.1 8B text), history, evolution
- 3 payment providers: QvaPay (CUP), PayPal (REST API v2 USD), Transfermóvil (manual)
- Blog, products, ingredient analyzer, community (comments + spam filter)
- Admin: users, payments, blog, products, guides, feature flags, analytics, health check, Telegram broadcast, AI blog generator
- PRO+ ($14.99/mo): PDF reports, dynamic routine, monthly comparison
- Digital guides: e-books sold via QvaPay, PDFs protected (not in public/)
- Telegram Bot: webhook, permission matrix (FREE trial 72h, PREMIUM+ unlimited, ESTHETICIAN total), TransferSMS detection
- DB-persistent queue: AnalysisJob polling every 3s, 2.5s throttle between jobs
- **No Redis, no BullMQ, no Stripe**

## Commands
| Command | Description |
|---------|-------------|
| `npm run dev` | Dev server (Turbopack) |
| `npm run build` | Production build |
| `npm test` | Vitest (170+ tests, 15 suites) |
| `npm run test:watch` | Vitest watch mode |
| `npm run type-check` | `tsc --noEmit` |
| `npm run seed` | Seed DB (admin + demo + 50 products + 30 challenges + 5 guides) |
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

### 5. Session: `PrismaAdapter(db) as any` hides missing fields

In `src/lib/auth.ts:76`, the adapter is cast as `any` due to version mismatch (adapter v2.8 vs next-auth v4.24). The `session` callback (line 215) only injects `role` and `plan`:

```typescript
session.user.role = token.role as string
session.user.plan = token.plan as string
session.user.id = token.sub!
```

It does NOT inject `username`, `latitude`, `longitude`, or `telegramTrialStartedAt`. TypeScript won't catch this because of the `as any`. If a frontend component tries to access `session.user.username`, it will be `undefined`. The session type in `next-auth`.d.ts may declare these fields, but they won't be populated at runtime.

## Environment

All env vars in `.env.example`. Key vars:
- `DATABASE_URL` — PostgreSQL (Supabase)
- `GROQ_API_KEY` — AI analysis (vision + text)
- `GMAIL_USER` / `GMAIL_APP_PASSWORD` — SMTP for all transactional emails
- `CRON_SECRET` — cron job authorization
- `PAYPAL_CLIENT_ID` / `PAYPAL_CLIENT_SECRET` — PayPal REST API
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
- **Payments**: QvaPay via `app-id`/`app-secret` headers. PayPal via REST API v2. Transfermóvil manual validation via Telegram bot. Webhook idempotency via `WebhookEvent.processedAt`.
- **Queue**: `src/lib/queue.ts` — `AnalysisQueue` class. Polls `AnalysisJob` every 3s, processes one at a time, 2.5s throttle. Starts automatically in production.
- **Groq AI**: System prompt is JSON with 8 sections. Descriptive severity labels (Leve/Moderado/Visible), no percentages. Prompt explicitly says "NOT a dermatologist."
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
- `POST /api/payments/create-paypal` — PayPal order → returns approvalUrl
- `POST /api/payments/capture-paypal` — capture PayPal after approval
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

### User
- `GET/PUT /api/user/clinic` — ESTHETICIAN clinic profile
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
- `POST /api/aging-predict` — aging prediction (PRO+)
- `POST /api/skin-diary` — diary CRUD
- `GET/POST /api/challenges` — challenges (display-only, no UI complete button)

## Prisma Models
- `User`: username (unique), telegramTrialStartedAt, isTelegramPremiumActive, latitude, longitude
- `AnalysisJob`: persistent queue (userId, status, photos, body, result, priority)
- `Comment`: approved (default true) — spam filter
- `Referral`: firstAnalysisAt — completes on first analysis, not registration
- `DigitalProduct`: e-books (title, slug, price, fileUrl, category)
- `DigitalProductPurchase`: purchase records
- `GroupAnalytics`: referral group progress
- `AppConfig`: feature flags (single-row table, 60s cache)
- `RateLimit`: DB-backed rate limiting

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
- `/pricing` — subscriptions + packs, USD/CUP, QvaPay payments
- `/admin/` — admin panel: stats, users, payments, blog, products, guides, feature flags, analytics, health check, emails, notifications
- `/terms`, `/privacy` — legal pages

## Photo Upload

4 steps shown one at a time: frontal (required), left profile (required), right profile (required), close-up (optional).
Client-side validation via `src/lib/photo-quality.ts` (OffscreenCanvas). Fallback: `pass: true` on error (allows upload with warning). Files >10MB compressed (640px, quality 0.4).

## Security

- Rate limiting: DB-backed (`lib/rate-limit.ts`) — `/api/contact` 5/hr, `/api/register` 10/day/IP, `/api/payments/webhook` 30/min, `/api/auth/forgot-password` 5/hr, `/api/admin/emails/send` 5/hr
- Input sanitization: HTML tags stripped via regex before DB
- CRON_SECRET: timing-safe comparison (`crypto.timingSafeEqual`)
- CSRF: token validation in `lib/csrf-middleware.ts`
- Email XSS: `sanitizeHtml()` on all email templates interpolating user data
- Community XSS: `stripHtml` + Zod validation on posts/comments
- Correlation IDs: middleware injects `x-correlation-id`
- Sentry replays: session 0.1, error 1.0, text masking
- Health check: `/api/health` (DB latency, queue stats, memory, uptime)

## Relevant Source Files

- `src/lib/queue.ts` — DB-persisted job queue (polls AnalysisJob every 3s)
- `src/lib/groq.ts` — system prompt (8 sections, severity labels, no percentages), retry on 429 only
- `src/lib/auth.ts` — registerUser, Google callback auto-username, session callback (role + plan only)
- `src/lib/paypal.ts` — PayPal REST API utility
- `src/lib/cache.ts` — in-memory Map + TTL (products API)
- `src/lib/services/analysis.service.ts` — analysis flow with fire-and-forget diary + referral steps
- `src/lib/services/group.service.ts` — referral group logic
- `src/lib/telegram-handlers.ts` — all command handlers, text-based confirmation flow
- `src/lib/photo-quality.ts` — OffscreenCanvas with fallback (pass: true on error)
- `src/lib/ingredient-kb.ts` — static ingredient RAG knowledge base (6 categories, 22 entries)
- `src/app/api/payments/webhook/route.ts` — QvaPay webhook (sequential ops, no $transaction)
- `src/app/api/payments/activate-transfer/route.ts` — uses $transaction (atomic)
- `prisma/schema.prisma` — all models
