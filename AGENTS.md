# AGENTS.md — The Serene Lens

## Commands
- `npm run dev` — start dev server (Turbopack by default in Next.js 16)
- `npm run build` — production build
- `npm run db:generate` — regenerate Prisma client
- `npm run db:push` — push Prisma schema to DB
- `npm run db:migrate` — run Prisma migrations
- `npm run db:studio` — Prisma Studio
- `npm run seed` — seed database

## Environment
All env vars documented in `.env.example`. Key vars:
- `DATABASE_URL` — PostgreSQL (Supabase)
- `NEXTAUTH_SECRET` — NextAuth secret
- `NEXT_PUBLIC_APP_URL` — base URL
- `OPENROUTER_API_KEY` — AI analysis API
- `STRIPE_*` — stripe payments (secret key, webhook, price IDs)
- `QVAPAY_*` — QvaPay payment gateway (fallback)
- `NEXT_PUBLIC_WHATSAPP_NUMBER` — WhatsApp contact
- `NEXT_PUBLIC_CUP_FALLBACK` — USD→CUP rate override

## Conventions
- Spanish UI, English code
- Mobile-first, glassmorphism (dark mode only via `@custom-variant dark &`)
- Tailwind v4 with `tw-animate-css` (NOT `tailwindcss-animate`)
- CSS animations only — no Framer Motion
- `sonner` for toasts (Toaster in root layout)
- Zod v4 (use `.issues` not `.errors`)
- Prisma v6 + next-auth v4 + `@auth/prisma-adapter` v2.8

## Key Decisions
- **PrismaAdapter type**: `PrismaAdapter(db) as any` — version mismatch between adapter v2.8 and next-auth v4.24
- **Auth guards**: Use `redirect()` from `next/navigation` in client components during render. Safe with React 19 + Next.js 16.
- **SessionProvider**: Configured with `refetchOnWindowFocus={false}` and `refetchInterval={5 * 60}` to prevent spurious re-renders. If infinite GET /  requests occur, add `--experimental-webpack` flag or configure webpack in next.config.ts to avoid Turbopack HMR issues on slow filesystems.
- **Webhook security**: QvaPay v1 has no built-in webhook auth; server calls `get_payment_info` API to verify payment status before upgrading user plan
- **Multi-provider payments**: Stripe (primary, card) + QvaPay (fallback, crypto). User chooses on pricing page.
- **Plan prices**: FREE (1 analysis/mo), PREMIUM ($4.99/mo unlimited), PRO ($9.99/mo unlimited). ULTRAPREMIUM renamed to PRO.
- **Packs**: one-time purchases that stack on any plan — BASIC (3 for $2.99), POPULAR (5 for $4.99), ADVANCED (15 for $9.99)
- **Usage tracking**: backend-enforced via `lib/usage.ts` — checks `analysisLimit`/`analysisUsed` + pack analyses at `/api/analyze`
- **Multi-photo AI**: All 6 uploaded photos are sent to the AI model via the `imagesBase64` array (was: only the first photo)
- **`findings` field removed**: The `SkinAnalysis.findings` DB field was dead code — never read in any frontend. Removed from schema and API.
- **No `.eslintrc` or `eslint.config.*`**: The project has no ESLint configuration, so `next lint` fails. Configure ESLint before enabling lint checks.
- **Turbopack default**: Next.js 16 uses Turbopack for both dev and build. If HMR causes infinite reloads on slow filesystems, see `next.config.ts` to configure webpack fallback.
- **Slow filesystem**: initial compile is 40-105s on this machine; subsequent requests cache and load in 1-4s
- **Delete `.next/`** if you get artifact build errors like `required-server-files.json` not found

## Performance Notes
- `SessionProvider` uses `refetchOnWindowFocus={false}` — prevents session fetch on every window focus event
- API routes return `Cache-Control: private, max-age=10, s-maxage=30` where appropriate
- `GET /api/analysis/[id]` uses `select` to avoid fetching unnecessary fields
- Prisma compound index `@@index([userId, createdAt])` speeds up history queries
- Image compression skips canvas processing for files < 100KB
- Protected pages (dashboard, admin) use render-time `redirect()` instead of `useEffect` redirect for immediate navigation

## Pricing & Plans
Prices defined in `src/lib/pricing.ts` — single source of truth.
- CUP conversion: `NEXT_PUBLIC_CUP_FALLBACK` (env) with fallback to 300
- Display: USD + CUP always shown together

## Page Structure
- `/` — landing page
- `/analysis` — upload 6 photos + questions (all photos sent to AI)
- `/analysis/results/[id]` — AI analysis results with FaceMap, auto-save
- `/products` — product scanner (sends single photo of ingredients label)
- `/products/[slug]` — product detail with ingredients
- `/pricing` — subscriptions + packs, USD/CUP, Stripe + QvaPay buttons
- `/blog` — articles with category filter
- `/blog/[slug]` — article body
- `/contact` — contact form (posts to `/api/contact`)
- `/dashboard/` — user dashboard, history, subscription (with usage display), profile
- `/admin/` — admin panel: users, payments (with provider column), messages, blog, products, analytics
- `/privacy`, `/terms` — legal pages

## API Routes (Payments)
- `POST /api/payments/create` — creates checkout session (Stripe or QvaPay). Body: `{ plan, provider }`
- `POST /api/payments/create-pack` — creates pack checkout. Body: `{ packType, provider }`
- `POST /api/payments/stripe-webhook` — Stripe webhook (subscriptions + packs)
- `POST /api/payments/webhook` — QvaPay webhook (subscriptions + packs)
- `GET /api/user/usage` — returns usage info for current user
- `GET /api/admin/analytics` — revenue by provider, plan distribution, conversion rate

## Known Issues
- **No ESLint config**: `eslint.config.*` or `.eslintrc.*` missing. Create one to enable linting.
- **Turbopack HMR on slow FS**: If the dev server causes infinite page reloads, switch to webpack: `next.config.ts` → add `experimental: { webpack: true }`
