# The Serene Lens

Observación cosmética de tu piel. Sube 6 fotos, responde preguntas y recibe un análisis visual descriptivo con recomendaciones personalizadas. Sin porcentajes inventados ni diagnósticos médicos.

## Stack

- **Framework:** Next.js 16 (Turbopack)
- **Language:** TypeScript
- **Styling:** Tailwind CSS v4 + `tw-animate-css` — dark mode only, neon green glassmorphism
- **Database:** PostgreSQL via Supabase + Prisma v6
- **Auth:** NextAuth v4 with credentials + Google + GitHub providers
- **AI:** OpenRouter API (Gemini 2.0 Flash for skin analysis)
- **Payments:** Stripe (primary) + QvaPay (fallback) — USD & CUP
- **UI:** Radix UI (accordion) + Lucide icons + sonner toasts
- **Validation:** Zod v4

## Getting Started

```bash
# 1. Clone and install
npm install

# 2. Copy environment variables
cp .env.example .env
# Fill in all vars (database, auth, payments, API keys)

# 3. Regenerate Prisma client
npm run db:generate

# 4. Push schema to database
npm run db:push

# 5. Seed sample data
npm run seed

# 6. Start dev server
npm run dev
```

## Design System

The Serene Lens uses a **neon green glassmorphism** design system:

- **Primary:** `#B7FF2A` — neon green with CSS glow animation
- **Dark mode only** — no light mode, tropical green gradient background
- **Glass cards:** `rgba(255,255,255,0.10)` background, `blur(25px)`, `24px` border radius (built into Card component)
- **Sidebar layout:** Fixed 280px left panel (desktop), hamburger drawer (mobile)
- **Mobile nav:** Bottom bar with 4 items (Inicio, Análisis, Historial, Perfil)
- **All CSS animations** — no Framer Motion or JS animation libraries
- **Border radius:** 24px cards, 12px sidebar items, 8px small elements

### Custom CSS classes

| Class | Usage |
|-------|-------|
| `glass-card` | Default card with blur + border + shadow |
| `glass-card-strong` | Elevated card (dimmer, stronger blur) |
| `glass-sidebar` | Fixed sidebar backdrop |
| `glass-sidebar-item` | Navigation link with hover/active states |
| `glass-mobile-nav` | Bottom navigation bar |
| `neon-glow` | Green glow shadow |
| `neon-glow-strong` | Intense green glow |
| `neon-border` | Green border highlight |
| `gradient-text` | Green-to-lightgreen gradient text |
| `gradient-primary` | Green button gradient |

## Features

- **Skin Observation** — upload 6 photos (front, sides, closeups). All 6 sent to AI for analysis.
- **Descriptive Categories** — textura (uniforme/levemente irregular/irregular), brillo (bajo/moderado/alto), poros (poco/moderadamente/visibles), uniformidad, sensibilidad aparente, grasa aparente. No fake percentages.
- **FaceMap** — visual representation of analyzed zones (frente, nariz, mejillas, mentón)
- **Analysis History** — auto-saves every analysis with results and recommendations
- **Product Scanner** — take a photo of any cosmetic ingredient list and get a descriptive analysis (no alarmist language)
- **Product Catalog** — browse products curated by skin type
- **Usage Tracking** — Free (1/mo), Premium ($4.99/mo unlimited), Pro ($9.99/mo unlimited). Packs stack on any plan.
- **Payments** — Stripe (card) + QvaPay (crypto). Prices in USD with CUP conversion.
- **Blog** — skincare articles with categories and read tracking
- **Dashboard** — user profile, analysis history, subscription management with usage bars
- **Admin Panel** — manage users, payments (with provider split), products, blog posts, messages. Revenue analytics.
- **Contact Form** — direct messaging to admin
- **WhatsApp** — quick contact via configured number
- **Legal Consent** — required disclaimer: "No diagnostica enfermedades, no sustituye a dermatólogos ni profesionales de la salud"

## Environment Variables

See `.env.example` for all required variables. Key ones:
- `DATABASE_URL` — Supabase PostgreSQL
- `OPENROUTER_API_KEY` — AI analysis
- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, pricing IDs
- `QVAPAY_*` — fallback payment gateway
- `NEXT_PUBLIC_WHATSAPP_NUMBER` — WhatsApp contact
- `NEXT_PUBLIC_CUP_FALLBACK` — USD→CUP rate override (default 300)

## Project Structure

```
src/
├── app/
│   ├── api/              # REST API routes (auth, analyze, admin, payments)
│   ├── analysis/         # Analysis page (6-step wizard) + results/[id]
│   ├── dashboard/        # Dashboard, history, subscription, profile
│   ├── admin/            # Admin panel (users, payments, blog, products)
│   ├── layout.tsx        # Root layout: Sidebar + MobileNav, no top navbar
│   └── globals.css       # Design system: neon green, glass, dark mode
├── components/
│   ├── ui/               # Card (glass default), Button (neon/glass), Badge (neon)
│   └── layout/           # Sidebar (fixed 280px), MobileNav (bottom bar)
├── lib/
│   ├── openrouter.ts     # AI prompt with exact categories, no medical language
│   ├── image-compression.ts  # Always compressed ≤ original, skips small files
│   ├── pricing.ts        # Single source of truth for plan/pack prices
│   ├── usage.ts          # Backend usage enforcement (checkAndDeductUsage)
│   ├── stripe-server.ts  # Lazy Stripe client (avoids build crash without env)
│   └── utils.ts          # cn(), formatDate(), getPlanLabel(), etc.
└── prisma/
    ├── schema.prisma     # User, SkinAnalysis (no findings field), Subscription, PurchasePack, UsageTracking
    └── seed.ts           # Sample data: users, blog posts, products, prices
```

## Pricing

| Plan | Price | Analyses | Features |
|------|-------|----------|----------|
| FREE | $0 | 1/mo | Basic analysis, blog access |
| PREMIUM | $4.99/mo | Unlimited | History, routines, products |
| PRO | $9.99/mo | Unlimited | Priority, support, early access |

### Packs (one-time, stack on any plan)

- **BASIC** — 3 analyses for $2.99
- **POPULAR** — 5 analyses for $4.99
- **ADVANCED** — 15 analyses for $9.99

## API Key Endpoints

| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/analyze` | Upload 6 photos + demographics → AI analysis |
| GET | `/api/analysis` | List user's analyses (with `select` + `take: 50`) |
| GET | `/api/analysis/[id]` | Get single analysis (with auth check) |
| POST | `/api/analysis/[id]/save` | Auto-save analysis to user (with ownership check) |
| POST | `/api/product-scan` | Scan product ingredients photo |
| GET | `/api/user/usage` | Get user's plan + remaining analyses |

## Dev Notes

- **Turbopack default**: Next.js 16 uses Turbopack for both dev and build. No `--no-turbopack` flag (removed in v16).
- **First compile**: 40-105s on slow filesystems. Subsequent requests cache and load in 1-4s.
- **SessionProvider**: Configured with `refetchOnWindowFocus={false}` and `refetchInterval={5*60}` to prevent session re-fetch loops on window focus.
- **Multi-photo AI**: All 6 uploaded photos are sent to the AI model in a single request.
- **Image compression**: Always compresses via canvas; falls back to original if compressed > original. Skips compression for files < 100KB.
- **Cache headers**: GET API routes return `Cache-Control: private, max-age=10, s-maxage=30` where appropriate.
- **No ESLint config**: Project has no `.eslintrc.*` — `npm run lint` will fail until configured.
- **Delete `.next/`** if you get artifact build errors like `required-server-files.json` not found after schema changes.
- **DB unreachable from CLI**: Schema pushes must run when Supabase is accessible.
- **Stripe env vars**: Must be set before Stripe payments work in production.
- **Compound index**: `SkinAnalysis` has `@@index([userId, createdAt])` for fast history queries.
- **`findings` field removed**: Was dead code — never read in any frontend component.
