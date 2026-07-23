## Goal
Estabilizar y lanzar plataforma con IA funcional (Gemini visión + Groq chat), notificaciones web, guías únicas, migración completa de email a notificaciones internas, y soporte PayPal.

## Constraints & Preferences
- Gemini 2.0 Flash solo para visión (análisis piel + escáner ingredientes). Groq `llama-3.3-70b-versatile` para TODO el chat (RAG + `/asistente`)
- PayPal sandbox (USD) + Transfermóvil (CUP/Cuba). QvaPay eliminado del código
- Paleta light mode only: primary `#88B078`, bg `#F8F9FA`, text `#1A1A1A`
- Locale EN/ES auto-detect + toggle manual
- Email desactivado: todas las funciones reemplazadas por stubs. Notificaciones web son el reemplazo. Password reset devuelve link directo en pantalla
- `.npmrc legacy-peer-deps=true` requerido permanentemente por `@sentry/nextjs` vs Next.js 16

## Progress
### Done
- **QvaPay → PayPal migración completa**: Prisma schema (todos los modelos actualizados a `paypalOrderId`/`paypalSubscriptionId`). Nuevo `src/lib/paypal.ts` con `createPayPalOrder()`, `capturePayPalOrder()`, `verifyPayPalOrder()`. API routes de create, create-pack, create-guide, webhook, verify, verify-guide migradas. Frontend pages (pricing, subscription, admin, guides) actualizadas. `src/lib/payments.ts` eliminado. CSP, layout, render.yaml, seed-knowledge, .opencode/anchor.md actualizados. `prisma generate` ejecutado
- **PayPal sandbox configurado**: `.env.local` con `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`, `PAYPAL_API_URL=https://api-m.sandbox.paypal.com`. Credenciales verificadas — access token obtenido exitosamente
- **CSRF añadido a 25 endpoints**: feedback (4), notifications (3), analysis (4), skin-diary (2), user (4), contact (1), community (7)
- **Logger reemplazó console.log/error**: 13 instancias migradas (api-response, sentry, auth, health, admin challenges, emails, guides, user, check-in)
- **Blog XSS sanitizado**: `dangerouslySetInnerHTML` en `blog/[slug]/page.tsx` ahora sanitiza scripts, event handlers y `javascript:`
- **N+1 queries eliminados**: `badge.service.ts` (Promise.all + createMany), `cleanup-trials/route.ts` (updateMany), `send-reminders/route.ts` (createMany), `telegram-handlers.ts` (validate/activate/broadcast usan batch updateMany + createMany)
- **Paginación cursor-based**: community posts y comments ahora soportan `?cursor=` con `hasMore`
- **CSP actualizado**: connect-src incluye `generativelanguage.googleapis.com`, `api.groq.com`, `api-m.paypal.com`, `api-m.sandbox.paypal.com`, `api.qrserver.com`
- **Preconnect añadido**: Gemini API, Groq, PayPal en `layout.tsx`
- **removeConsole: true**: console.log no llega al cliente en producción
- **Service worker lazyOnload**: inline script convertido a `<Script strategy="lazyOnload">`
- **Performance hero image**: `priority` en hero de homepage, `loading="lazy"` en productos
- **revalidateTag corregido**: 9 calls ahora pasan segundo argumento `"max"` (Next.js 16.2.11 requiere 2 args)
- **Imports no usados removidos**: `Clock`, `MessageSquare` de dashboard/page.tsx
- **`as any` → tipos reales**: dashboard, esthetician, history pages
- **Manifest duplicado removido**: `layout.tsx`
- **`typeof window === "undefined"` removido**: analysis/page.tsx (archivo `"use client"`)
- **`public/robots.txt` eliminado**: competía con dynamic `robots.ts`
- **`localhost:3000` fallback eliminado**: forgot-password/route.ts
- **Tests**: 239/239 pasando en 27 archivos (webhook.test.ts reescrito para PayPal)
- **Commits**: `dc6b87b`, `99c1ec3`, `5064cff`, `96419e3`, `d5259b3`, `91d96cd` — todos pusheados a main
- **CSRF delete-account fix**: `DELETE()` ahora acepta `NextRequest` y pasa `req` a `validateCsrf` (antes creaba fake Request vacío = bypass total)
- **JSON.parse safety**: comparison route envuelve `JSON.parse(clean)` en try/catch con error explícito
- **Bot-knowledge N+1 fix**: `forEach` con fire-and-forget reemplazado por `Promise.allSettled` + `map`
- **Auth empty catch blocks**: 4 `.catch(() => {})` ahora loggean error vía `logger.error()` (welcome notification, rate limit clear, trial setup, username gen)
- **Zod validation community groups POST**: `createGroupSchema` con name/slug/description/image validados via `safeParse`

### In Progress
- Esperar que el usuario instale dependencias localmente y haga deploy en Render

### Blocked
- **`GEMINI_API_KEY` expirada/inválida**: da 403 Forbidden. Necesita renovarse en Google AI Studio
- **`GROQ_API_KEY` expirada**: da 403 Forbidden. Necesita renovarse en consola de Groq
- **`PAYPAL_CLIENT_ID`/`PAYPAL_CLIENT_SECRET` no configurados en Render Dashboard**: solo están en `.env.local`. Render no los tiene
- **Build Bus error en local**: segfault módulo nativo (Prisma/SWC). Solo en esta máquina, en Render funciona
- **`PAYPAL_API_URL` en Render**: default es producción (`api-m.paypal.com`). Para sandbox necesita setearse explícitamente

## Key Decisions
- **QvaPay reemplazado por PayPal**: QvaPay eliminado completamente del código (env vars, lib, API routes, frontend, docs). PayPal implementado vía REST API. Transfermóvil se mantiene para Cuba
- **CSRF priorizado en endpoints críticos**: 25 endpoints cubiertos (feedback, notifications, analysis, user, contact, community). Restantes ~45 endpoints admin tienen prioridad media
- **Gemini y Groq APIs actualmente no funcionales**: ambas keys expiradas. Sin renovación no funcionan análisis piel, escáner ni chat RAG
- **`revalidateTag("x", "max")`**: Next.js 16.2.11 cambió la firma — segundo argumento requerido

## Next Steps
1. ⚠️ **Renovar `GEMINI_API_KEY`** en Google AI Studio (la actual da 403)
2. ⚠️ **Renovar `GROQ_API_KEY`** en consola de Groq (también da 403)
3. ⚠️ **Configurar `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET` y `PAYPAL_API_URL` en Render Dashboard**
4. **Trigger Manual Deploy en Render** para que tome todos los cambios de los últimos 6 commits
5. **Verificar build exitoso** en Render Dashboard
6. **Configurar `TELEGRAM_BOT_TOKEN` en Render** si se desea UV alerts funcionales

## Critical Context
- **Render URL**: `https://the-serene-lens-nuevo.onrender.com`
- **Último commit**: `91d96cd` (fix: CSRF, JSON.parse, N+1, Zod validation, empty catch blocks)
- **Modelos**: Gemini 2.0 Flash para visión (análisis piel, escáner ingredientes). Groq `llama-3.3-70b-versatile` para chat RAG + `/asistente`. **No hay modelos vision disponibles en Groq**
- **Gemini API**: `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent`
- **PayPal API**: sandbox `https://api-m.sandbox.paypal.com` (en `.env.local`). Producción `https://api-m.paypal.com` (default en `env.ts` si no se configura)
- **Groq API**: `https://api.groq.com/openai/v1/chat/completions`
- **`.npmrc legacy-peer-deps=true`**: crítico para build con Sentry + Next.js 16
- **Redis Upstash**: configurado para rate limits y contadores
- **Email desactivado**: `src/lib/email.ts` es stub. Notificaciones web son canal activo. Password reset muestra link en pantalla
- **CRON_SECRET local**: `6fa3cf59eb56ed8979b033cb109a3939f3f626b4efad80e2e7e8d0c0feaba29b`
- **API keys locales**: `GEMINI_API_KEY` y `GROQ_API_KEY` ambas expiradas (403). Las de Render son independientes
- **PayPal sandbox credentials en `.env.local`**: `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`, `PAYPAL_API_URL=https://api-m.sandbox.paypal.com` — NO commiteados (`.env.local` en `.gitignore`)
- **Tests**: 239 pasando, 27 archivos
- **CSRF**: 25 endpoints cubiertos, ~45 admin endpoints restantes (prioridad media)

## Relevant Files
- `src/lib/paypal.ts`: NUEVO — `createPayPalOrder()`, `capturePayPalOrder()`, `verifyPayPalOrder()`, `isPaypalConfigured()`
- `src/lib/payments.ts`: ELIMINADO — reemplazado por paypal.ts
- `src/lib/env.ts`: MODIFICADO — QVAPAY_* → PAYPAL_*. `GEMINI_API_KEY` añadido al schema. `EXCHANGERATE_API_KEY`, `RESEND_API_KEY` eliminados
- `src/app/api/payments/*.ts`: TODOS REFACTORED — QvaPay → PayPal (create, create-pack, create-guide, webhook, verify, verify-guide)
- `src/app/api/payments/webhook/__tests__/webhook.test.ts`: REESCRITO — 23 tests para PayPal flow
- `src/app/api/contact/route.ts`: MODIFICADO — CSRF añadido
- `src/app/api/feedback/*.ts`: MODIFICADO — CSRF añadido (4 endpoints)
- `src/app/api/notifications/*.ts`: MODIFICADO — CSRF añadido (3 endpoints)
- `src/app/api/analysis/[id]/*.ts`: MODIFICADO — CSRF añadido (4 endpoints)
- `src/app/api/skin-diary/route.ts`: MODIFICADO — CSRF añadido
- `src/app/api/user/*.ts`: MODIFICADO — CSRF añadido (4 endpoints); delete-account CSRF bugfix
- `src/app/api/user/comparison/route.ts`: MODIFICADO — JSON.parse try/catch + CSRF
- `src/app/api/community/*.ts`: MODIFICADO — CSRF añadido (7 endpoints), paginación cursor-based, Zod validation POST
- `src/app/api/community/groups/route.ts`: MODIFICADO — Zod `createGroupSchema` con `safeParse`
- `src/lib/telegram-handlers.ts`: MODIFICADO — N+1 eliminado (validate/activate/broadcast batch ops)
- `src/lib/services/badge.service.ts`: MODIFICADO — N+1 eliminado (Promise.all + createMany)
- `src/app/api/cron/cleanup-trials/route.ts`: MODIFICADO — N+1 eliminado (updateMany)
- `src/app/api/cron/send-reminders/route.ts`: MODIFICADO — N+1 eliminado (createMany)
- `src/app/blog/[slug]/page.tsx`: MODIFICADO — sanitización XSS en contenido HTML
- `src/app/layout.tsx`: MODIFICADO — preconnect Gemini/Groq/PayPal, service worker lazyOnload, manifest duplicado removido
- `src/app/page.tsx`: MODIFICADO — hero image `priority`
- `src/app/products/page.tsx`: MODIFICADO — product images `loading="lazy"`
- `src/app/analysis/page.tsx`: MODIFICADO — `typeof window` guard removido, lazy loading en imágenes
- `src/app/dashboard/page.tsx`: MODIFICADO — imports no usados removidos, `as any` → tipo real
- `src/app/dashboard/esthetician/page.tsx`: MODIFICADO — `as any` → tipo real
- `src/app/dashboard/history/page.tsx`: MODIFICADO — `any[]` → `EvolutionPoint[]`
- `src/app/dashboard/error.tsx`: MODIFICADO — `console.error` → `logger.error`
- `src/app/analysis/error.tsx`: MODIFICADO — `console.error` → `logger.error`
- `src/lib/api-response.ts`: MODIFICADO — `console.error` → `logger.error`
- `src/lib/sentry.ts`: MODIFICADO — `console.error` → `logger.error`
- `src/lib/auth.ts`: MODIFICADO — `console.error` → `logger.error`, 4 `.catch(() => {})` → `logger.error`
- `src/lib/bot-knowledge.ts`: MODIFICADO — `forEach` fire-and-forget → `Promise.allSettled`
- `next.config.mjs`: MODIFICADO — `removeConsole: true`, CSP domains añadidos
- `prisma/schema.prisma`: MODIFICADO — `User.qvapayId` eliminado
- `prisma/seed-knowledge.ts`: MODIFICADO — QvaPay → PayPal (3 referencias)
- `render.yaml`: MODIFICADO — QVAPAY_* → PAYPAL_*
- `public/robots.txt`: ELIMINADO — competía con dynamic `robots.ts`
