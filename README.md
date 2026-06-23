# The Serene Lens

Observación cosmética de tu piel. Sube fotos guiadas, responde preguntas y recibe un análisis visual descriptivo con recomendaciones personalizadas. Sin porcentajes inventados ni diagnósticos médicos.

## Stack

- **Framework:** Next.js 16 (Turbopack)
- **Language:** TypeScript
- **Styling:** Tailwind CSS v4 + `tw-animate-css` — light mode only, palette verde sage
- **Database:** PostgreSQL via Supabase + Prisma 7 (20 modelos, driver adapter pg)
- **Auth:** NextAuth v4 with credentials + Google + GitHub + middleware protection
- **AI:** OpenRouter API (Gemini 2.0 Flash for skin analysis, bilingual prompt)
- **Payments:** QvaPay (v2 API) — USD & CUP
- **UI:** Radix UI (accordion, dialog, dropdown, select, tabs, switch) + Lucide icons + sonner toasts
- **Validation:** Zod v4 (strict schemas for all API routes)
- **Observability:** PostHog (events), Sentry (errors), structured logger
- **Testing:** Vitest v3 (100 tests across services, validations, utilities, streaming, webp, email)
- **PDF:** @react-pdf/renderer (lazy) — white-label reports for clinics
- **Charts:** Recharts (lazy) — evolution comparison
- **i18n:** next-intl (lazy) — ES/EN messages ready

## Getting Started

```bash
# 1. Clone and install
npm install --legacy-peer-deps

# 2. Copy environment variables
cp .env.example .env
# Fill in all vars (database, auth, payments, API keys)

# 3. Regenerate Prisma client
npm run db:generate

# 4. Push schema to database
npm run db:push

# 5. Seed sample data (10 blog posts, 10 products, admin + demo users)
npm run seed

# 6. Start dev server
npm run dev
```

## Design System

The Serene Lens uses a **clean, professional skincare** design system:

- **Primary:** `#C2E09D` (sage green) — no neon, no glow
- **Light mode only** — fondo `#F8FAF5`, surface blanco, texto `#2F3A2D`
- **Cards:** White background, `1px solid #DDE7D3`, `20px` radius, subtle shadow
- **Sidebar layout:** Fixed 280px left panel (desktop), hamburger drawer (mobile)
- **Mobile nav:** Bottom bar with 5 items (Inicio, Análisis, Historial, Rutinas, Cuenta)
- **All CSS animations** — no Framer Motion or JS animation libraries
- **No glassmorphism, no neon, no cyberpunk, no futuristic effects**
- **Toasts:** sonner with sage green left border accent

### Palette

| Token | Hex | Usage |
|-------|-----|-------|
| Primary | `#C2E09D` | Buttons, accents, icon backgrounds |
| Secondary | `#ECFFD3` | Light mint, badge backgrounds |
| Tertiary | `#FFF6AD` | Soft yellow, highlight accents |
| Background | `#F8FAF5` | Page background, section backgrounds |
| Surface | `#FFFFFF` | Cards, sidebar, inputs |
| Text | `#2F3A2D` | Primary text, headings |
| Text secondary | `#64705E` | Secondary text, descriptions |
| Borders | `#DDE7D3` | Card borders, inputs, dividers |

## Features

- **Skin Observation** — guided photo assistant: 2 or 4 steps (A/B testable via `NEXT_PUBLIC_PHOTO_STEPS`). Validación de iluminación y calidad (blur + brightness).
- **Descriptive Categories** — textura, brillo, poros, uniformidad, sensibilidad aparente, grasa aparente. Etiquetas: Bajo/Moderado/Visible/Leve/Alto. **Nunca porcentajes.**
- **Analysis Results** — 8 secciones: Resumen, Tipo de piel, Observaciones, Factores en imagen, Recomendaciones, Rutina, Productos, Historial + disclaimer legal.
- **Evolution Tracking** — comparison across analyses with trend detection (improving/stable/worsening). PREMIUM/PRO only.
- **Analysis History** — auto-guarda cada análisis con fecha, observaciones y recomendaciones. Timeline cronológico.
- **Product Scanner** — take a photo of any cosmetic ingredient list and get a descriptive analysis
- **Product Catalog** — 10 products curated by skin type (limpiadores, hidratantes, serums, protectores solares, exfoliantes, mascarillas, aceites, contornos)
- **Affiliate Links** — optional Rainforest API integration for Amazon product search with affiliate tags
- **Usage Tracking** — Free (1/mo), Premium ($4.99/mo unlimited), Pro ($9.99/mo unlimited). Packs stack on any plan (expire 30 days).
- **Payments** — QvaPay (v2 API). Prices in USD with CUP conversion.
- **Blog** — 10 skincare articles across 5 categories with read tracking
- **B2B/Clinics** — white-label dashboard for clinics with patient analysis list + PDF report generation
- **Dashboard** — user profile, analysis history (with skeletons), subscription management with usage bars
- **Admin Panel** — manage users, payments (with provider split), products, blog posts, messages. Revenue analytics.
- **Streaming de Análisis** — SSE con 7 etapas de progreso (validating → compressing → analyzing → building → saving → complete). Edge runtime.
- **Generador SEO Automático** — 20 keywords predefinidas, genera artículos via OpenRouter, cron diario via cron-job.org.
- **Sistema de Email Secuencial** — 6 emails (Día 0-21) con templates HTML. Onboarding, conversión, re-engagement.
- **Email Sequence** — 6 emails automáticos (Día 0-21) vía Resend. Welcome, tips, urgency, upsell. Segmentación por comportamiento.
- **Landing Pages SEO** — 6 páginas optimizadas: /analizar-piel-gratis, /test-tipo-de-piel, /como-saber-mi-tipo-de-piel, /analisis-de-piel-con-ia, /rutina-skincare-personalizada, /ingredients-analyzer.
- **OG Dinámico** — Imágenes personalizadas con skinType, analysisId, observations.
- **Cron Retención** — Notifica suscripciones por expirar (3 días antes) + degrada suscripciones vencidas a FREE.
- **Email Secuencial** — 6 emails (Día 0-21) con templates HTML. Onboarding, conversión, re-engagement.
- **Contact Form** — direct messaging to admin
- **WhatsApp** — quick contact via configured number
- **Legal Consent** — required disclaimer: "Esta herramienta ofrece observaciones cosméticas orientativas..."
- **Password Reset** — token-based, 1hr expiry, scrypt hashing, dev mode shows link on-screen

## Environment Variables

See `.env.example` for all required variables. Key ones:
- `DATABASE_URL` — Supabase PostgreSQL
- `NEXTAUTH_SECRET` — NextAuth encryption key
- `NEXTAUTH_URL` — base URL (http://localhost:3000 in dev)
- `OPENROUTER_API_KEY` — AI analysis
- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, pricing IDs
- `QVAPAY_UUID`, `QVAPAY_SECRET`, `QVAPAY_URL`, `QVAPAY_API_URL`, `QVAPAY_TAX_RATE`
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` — Google OAuth
- `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET` — GitHub OAuth
- `NEXT_PUBLIC_WHATSAPP_NUMBER` — WhatsApp contact
- `NEXT_PUBLIC_CUP_FALLBACK` — USD→CUP rate override (default 500)
- `NEXT_PUBLIC_PHOTO_STEPS` — "2" or "4" for A/B testing
- `RESEND_API_KEY` — transactional emails
- `CRON_SECRET` — cron job authorization (generated, add to Render env vars)
- `CRONJOB_API_KEY` — cron-job.org API key for external cron scheduling
- `NEXT_PUBLIC_POSTHOG_KEY`, `NEXT_PUBLIC_POSTHOG_HOST` — product analytics
- `NEXT_PUBLIC_SENTRY_DSN` — error tracking
- `RAINFOREST_API_KEY` — affiliate product search

## Project Structure

```
src/
├── app/
│   ├── api/              # REST API routes (auth, analyze, admin, payments, health, cron)
│   ├── analysis/         # Analysis page (guided photo assistant) + results/[id]
│   ├── dashboard/        # Dashboard, history, subscription, profile, b2b
│   ├── admin/            # Admin panel (users, payments, blog, products, analytics)
│   ├── blog/             # Blog listing + [slug] with schema.org JSON-LD
│   ├── products/         # Product catalog + scanner + [slug]
│   ├── pricing/          # Plans + packs (QvaPay)
│   ├── layout.tsx        # Root layout: metadataBase, QueryProvider, ClientInit
│   ├── middleware.ts      # Auth + security headers
│   └── globals.css       # Design system: light mode, sage green palette
├── components/
│   ├── ui/               # Card, Button, Badge, Skeleton — sage green, no neon/glass
│   └── layout/           # Sidebar (fixed 280px), MobileNav, BottomBar
├── lib/
│   ├── auth.ts           # NextAuth config (credentials + OAuth providers + callbacks)
│   ├── env.ts            # Zod strict validation, fails fast
│   ├── logger.ts         # Structured logger (info/warn/error/debug) with correlation-id
│   ├── sanitize.ts       # HTML sanitizer for API inputs
│   ├── openrouter.ts     # AI prompt with bilingual support, no medical language, retry wrapper
│   ├── image-compression.ts  # Always compressed ≤ original, skips small files
│   ├── pricing.ts        # Single source of truth for plan/pack prices
│   ├── usage.ts          # Backend usage enforcement (checkAndDeductUsage)
│   ├── rate-limit.ts     # In-memory rate limiter (5 req/min for /api/analyze)
│   ├── cache.ts          # TTL cache adapter (node-cache or Map fallback)
│   ├── cache/db-cache.ts # Hybrid cache: memory hot layer + DB persistence
│   ├── retry.ts          # Exponential backoff retry (withRetry)
│   ├── csrf.ts           # CSRF token generation + validation (crypto.timingSafeEqual)
│   ├── api-response.ts   # Unified API response format { success, data/error }
│   ├── error-codes.ts    # 10 standard error codes (UNAUTHORIZED, FORBIDDEN, etc.)
│   ├── tracking.ts       # 10 PostHog business events
│   ├── photo-quality.ts  # Client-side blur + brightness validation
│   ├── photo-steps.ts    # A/B config for 2 or 4 photo steps
│   ├── email.ts          # Resend lazy (console.log fallback)
│   ├── stripe-server.ts  # DELETED (Stripe removed)
│   ├── repositories/     # Repository pattern: Analysis, User, Payment, Blog, Product, Feedback
│   ├── services/         # Service layer: analysis, user, payment, evolution, affiliate, feedback, billing, webhook
│   └── validations/      # Zod strict schemas for all API routes
├── types/
│   └── next-auth.d.ts    # NextAuth type augmentation (role, plan)
└── prisma/
    ├── schema.prisma     # 19 modelos: User, SkinAnalysis, BlogPost, Product, Payment, Cache, WebhookEvent, UserEvolution, etc.
    └── seed.ts           # 10 blog posts, 10 products, admin + demo users
```

## Auth System

| Feature | Implementation |
|---------|---------------|
| Credentials | Email + password, scrypt hashing, Prisma adapter |
| Google OAuth | OAuth 2.0 with callback |
| GitHub OAuth | OAuth 2.0 with callback |
| Session | JWT strategy with refetch interval 5min |
| Middleware | Protects `/dashboard/*`, `/admin/*`, `/analysis/*` |
| Rate limiting | 5 requests/min per user+IP for analyze endpoint |
| Password reset | Token-based, 1hr expiry, scrypt hashing, dev fallback |
| autoComplete | Todos los inputs con atributos correctos |

### Protected Routes

- `/dashboard/*` — middleware redirects to `/login?callbackUrl=...` if no session
- `/admin/*` — middleware redirects to `/login?callbackUrl=...` if not ADMIN role
- `/analysis/*` — middleware redirects to `/login?callbackUrl=...` if no session

## Pricing

| Plan | Price | Analyses | Features |
|------|-------|----------|----------|
| FREE | $0 | 1/mo | Basic analysis, blog access |
| PREMIUM | $4.99/mo | Unlimited | History, evolution, routines, products |
| PRO | $9.99/mo | Unlimited | Priority, support, early access, evolution charts |

### Packs (one-time, stack on any plan, expire 30 days)

- **BASIC** — 3 analyses for $1.99
- **POPULAR** — 5 analyses for $4.99
- **ADVANCED** — 15 analyses for $6.99

### Additional Plan

- **ESTHETICIAN** — $19.99/mo, B2B clinic dashboard, white-label reports, patient management

## API Endpoints

| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/analyze` | Upload photos + demographics → AI analysis (rate limited) |
| GET | `/api/analysis` | List user's analyses |
| GET | `/api/analysis/[id]` | Get single analysis |
| POST | `/api/analysis/[id]/feedback` | Submit thumbs up/down feedback |
| POST | `/api/analysis/[id]/save` | Auto-save analysis to user |
| POST | `/api/product-scan` | Scan product ingredients photo |
| GET | `/api/user/usage` | Get user's plan + remaining analyses |
| GET | `/api/user/evolution` | Evolution data (PREMIUM/PRO only) |
| GET | `/api/user/profile` | Get user profile |
| DELETE | `/api/user/delete-account` | Delete user + cascade all data |
| POST | `/api/auth/forgot-password` | Generate password reset token |
| POST | `/api/auth/reset-password` | Validate token + update password |
| POST | `/api/register` | Create user account |
| POST | `/api/contact` | Submit contact form |
| POST | `/api/feedback` | Submit feedback (Zod strict) |
| POST | `/api/payments/create` | Create QvaPay invoice |
| POST | `/api/payments/create-pack` | Create QvaPay pack invoice |
| GET | `/api/admin/analytics` | Revenue by provider, plan distribution |
| POST | `/api/cron/retention` | Retention cron (3d before expiry, downgrade on expiry) — 10am daily |
| POST | `/api/reports/generate` | Generate white-label PDF for B2B |
| GET | `/api/health` | Healthcheck (edge runtime, DB verification) |
| GET | `/api/og` | Dynamic OG image (800×418, skinType/analysisId) |
| POST | `/api/analyze/stream` | Streaming analysis with SSE (7 stages) |
| POST | `/api/cron/generate-seo` | Generate SEO article (cron) |
| POST | `/api/cron/emails` | Process email sequences (cron) |

## Testing

```bash
# Run unit tests (100 tests)
npm test

# Watch mode
npm run test:watch

# E2E (Playwright)
npm run e2e
```

### Test coverage

- `evolution.service.test.ts` — 8 tests: empty, single analysis, trends (improving/stable/worsening), multi-point, malformed JSON
- `analysis.service.test.ts` — 4 tests: usage limit, file size limit, success flow, language passthrough
- `affiliate.service.test.ts` — 7 tests: db-cache caching, API failure, timeout, non-ok response, affiliate tag, URL building
- `sanitize.test.ts` — 11 tests: HTML escaping (all 6 characters), non-string input, safe text, object sanitization
- `validations.test.ts` — 25 tests: analysisBody, contact, profile, feedback, clinic, register schemas
- `api-response.test.ts` — 10 tests: ok, error, unauthorized, forbidden, notFound, serverError, format
- `csrf.test.ts` — 8 tests: token generation, validation, timingSafeEqual, constants
- `cache.test.ts` — 7 tests: get/set/del/clear/TTL/complex data
- `streaming.test.ts` — 9 tests: stream, events, error, close, generator, hook
- `webp.test.ts` — 6 tests: supportsWebP, optimizeToWebP
- `email-sequence.test.ts` — 5 tests: sequence, days, name, URL, HTML

## Dev Notes

- **Turbopack default**: Next.js 16 uses Turbopack for both dev and build. Configured with `turbopack.root` to avoid lockfile confusion.
- **First compile**: 40-105s on slow filesystems. Subsequent requests cache and load in 1-4s.
- **SessionProvider**: `refetchOnWindowFocus={false}`, `refetchInterval={5 * 60}`, `refetchWhenOffline={false}`.
- **Lazy imports**: All optional deps (Recharts, next-intl, @react-pdf/renderer) use `Function('return import("...")')()` to hide from bundler. Build works without them.
- **Service layer**: Business logic extracted from API routes into `src/lib/services/` — AnalysisService, UserService, PaymentService, etc.
- **Security headers**: CSP, X-Frame-Options DENY, X-Content-Type-Options, Referrer-Policy configured in next.config.ts.
- **Rate limiting**: In-memory Map (5 req/min for analyze, 3 registrations/IP/24h for register), resets on server restart — sufficient for MVP.
- **Photo validation**: Client-side blur (Laplacian variance ≥ 30) + brightness (40-220) before upload. Actionable error messages.
- **Image compression**: Always compresses via canvas; falls back if compressed > original. Skips files < 100KB.
- **ESLint config**: `.eslintrc.json` con reglas import/order, no-unused-vars, no-console, prefer-const, no-var, resolver TypeScript.
- **Delete `.next/`** if you get artifact build errors like `required-server-files.json` not found after schema changes.
- **QvaPay v2 API**: Auth via `app-id`/`app-secret` headers. Invoice at `/v2/create_invoice`.
- **Email service configured**: Resend API key set. Password reset works via email. Email sequences automated (6 emails Día 0-21).
- **`findings` field removed**: Was dead code — never read in any frontend component.
- **CSP script-src**: Uses `'unsafe-inline'` (required by Next.js). All other CSP directives are restrictive.
- **Prisma compound index**: `SkinAnalysis` has `@@index([userId, createdAt])` for fast history queries.
- **Prisma models**: 19 total — User, Account, Session, VerificationToken, SkinAnalysis, BlogPost, Product, Payment, Subscription, PurchasePack, UsageTracking, Feedback, Clinic, AffiliateClick, ContactMessage, Cache, WebhookEvent, UserEvolution.
- **Prisma 7**: Driver adapter required (`@prisma/adapter-pg` + `pg`). Config in `prisma.config.ts`. Generated client at `src/generated/prisma/`. Imports from `@/generated/prisma/client`.
- **Prisma 7 seed**: `prisma/seed.ts` uses driver adapter directly. Run with `npm run seed`.
- **PostHog events**: 10 business events (analysis_started, analysis_completed, photo_uploaded, payment_success, etc.). Lazy init.
- **Sentry**: Lazy captureError wrapper. Only active if `NEXT_PUBLIC_SENTRY_DSN` is set.
- **DB seed**: 2 users (admin + demo), 10 blog posts (5 categories), 10 products (8 categories). Run with `npm run seed`.
- **Prisma 7 seed**: `prisma/seed.ts` uses driver adapter (`@prisma/adapter-pg` + `pg`). Imports from `../src/generated/prisma/client`.
- **Cache híbrida**: `db-cache.ts` combina memory Map (hot) + tabla `Cache` (persistencia). Affiliate usa `getDBCache`/`setDBCache`.
- **Retry wrapper**: `withRetry()` en OpenRouter — backoff exponencial, 3 retries.
- **revalidateTag Next.js 16**: Requiere 2do arg `{}`. Admin routes lo usan para blog/products.
- **unstable_cache**: `/api/products` cacheado 3600s con tag "products-catalog".
- **Evolution cache**: `UserEvolution` modelo precálcula + cachea resultados de evolución.
- **Webhook processor**: `webhook-processor.ts` maneja QvaPay. `webhook.service.ts` registra/reintenta.
- **Anti-fraud**: `/api/register` rate limit 3 cuentas/IP en 24h. In-memory Map.
- **Edge Runtime**: `/api/health` y `/api/og` en edge — sin cold starts.
- **Compound queries**: Analytics usa `db.$transaction()` — 6 queries en un roundtrip.
- **N+1 prevention**: `/api/analysis` incluye feedback con `select` mínimo.
- **DNS prefetch**: Layout pre-conecta a OpenRouter, QvaPay, PostHog.
- **Cron retención**: Notifica 3 días antes de expiración + degrada suscripciones vencidas. Usa `sendEmail` con templates HTML. Cron diario 10am.
- **CRON_SECRET**: Generado con `crypto.randomBytes(32)`. Necesario como env var en Render para autorizar los 3 cron endpoints.
- **Cron-job.org**: 3 jobs externos (SEO 8am, emails 9am, retención 10am). Headers `x-cron-secret`. API key en `CRONJOB_API_KEY`. Jobs: SEO (7882243), emails (7882246), retention (7882249).
- **Sidebar Ingredientes**: Link apunta a `/ingredients-analyzer` (landing SEO), no a `/products`.
- **Email processor**: Segmentación por comportamiento — FREE sin análisis (onboarding Día 0-3), FREE con análisis (conversión Día 7-14), inactivos 14d (re-engagement Día 21).
- **Cron-job.org**: 3 jobs externos (SEO 8am, emails 9am, retención 10am). Headers `x-cron-secret`. API key en `CRONJOB_API_KEY`.
