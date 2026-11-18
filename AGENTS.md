# AGENTS.md — The Serene Lens

## Decisiones Técnicas

### Guías — Imágenes SVG en lugar de JPG duplicados
- seed.ts usaba JPGs de Pexels reutilizados en múltiples guías (misma imagen para 3 guías distintas)
- **Solución**: Reemplazadas con SVGs temáticos de `/guides/*.svg` (50 SVGs únicos ya existentes de seed-guides.ts). Cada guía tiene su propio SVG acorde al tema.

### Homepage — SkinTest y LeadMagnet eliminados
- **Mini Test**: Se quitó el componente SkinTest de la landing page porque es una versión reducida que compite con el análisis real por IA
- **Lead Magnet**: Se quitó el formulario de captura de email para la guía gratuita (está en `/guides` y no necesita estar en la landing)
- **Orden**: HowItWorks → Features → ActionCards → Pricing → FAQ

### Admin Panel — Quick Access rediseñado
- Layout cambió de `grid-cols-9 gap-2` a `grid-cols-6 gap-3` con cards individuales (icono + borde + hover)
- Se añadieron métricas: nuevos esta semana, análisis del mes, pagos completados, guías vendidas, suscripciones activas

### Traducciones (Locale)
- El sistema existía pero solo cubría ~40% de las páginas del dashboard
- **Añadidas** +90 nuevas claves de traducción para history, subscription, report, diary, support, guides, challenges, referrals, social, clinic-settings, b2b, footer, sidebar

### IA con memoria (Mejora 1)
- El prompt de Groq incluye ahora los últimos 5 análisis del usuario con fechas, tipo de piel y hallazgos
- La IA recibe instrucciones explícitas de comparar patrones y dar seguimiento ("En tu último análisis vimos X, ahora notamos Y")
- Implementado en `src/lib/services/analysis.service.ts` y `src/lib/groq.ts`

### Productos guardados + Conflictos (Mejora 2)
- Nuevo modelo `UserSavedProduct` en Prisma
- Botón "Guardar producto" en cada ficha de producto
- Dashboard `/dashboard/products` para ver productos guardados
- `IngredientService` con 10 reglas de conflictos conocidos (retinol+BHA, niacina+vitamina C, etc.)
- Los conflictos se detectan automáticamente al guardar productos y al escanear ingredientes nuevos

### Insignias con propósito (Mejora 3)
- Modelos `Badge` y `UserBadge` en Prisma
- 8 insignias: primer análisis, rachas de 3/7/30 días, 5/10/25 análisis, mejora de hidratación
- Evaluación automática tras cada análisis via `BadgeService`
- Visualización en la página de historial via `BadgeDisplay` component

### Comunidad segmentada (Mejora 4)
- API completa con posts, comentarios, grupos y membresía
- 6 grupos por tipo de piel (grasa, seca, mixta, sensible, normal, general)
- La página `/community` detecta el `skinType` del usuario y muestra primero el grupo recomendado
- Seed script `seed-community.ts` para crear grupos e insignias

### Dashboard evolución FREE (Mejora 5)
- Se eliminó la restricción que bloqueaba el gráfico de evolución para usuarios FREE
- Gráfico Recharts con 6 métricas y tendencias visible para todos

### Alertas climáticas (Mejora 6)
- Cron `/api/cron/weather-alert` implementado: compara humedad y temperatura diaria
- Notifica cuando humedad cambia >20% o temperatura >5°C respecto al día anterior
- Crea `Notification` en la app y envía mensaje Telegram si el usuario tiene vinculado
- Nuevo modelo `WeatherLog` para almacenar histórico climático

### Arquitectura Telegram
- Comandos: `/asistente` (Gemini 2.0 Flash), `/start`, `/precios`, `/ayuda`, `/planes`, `/blog`, `/productos`, `/skin`, `/cancelar`
- `/asistente` requiere plan pago con límite diario según plan (10/25/50/100)
- Keyboard incluye botón "🤖 Asistente"

### Precios actualizados
- PREMIUM: $4.99 → $7.99/mes; PREMIUM_ANUAL: $49.99 → $79.99/año
- ESTHETICIAN: $29.99 → $49.99/mes; ESTHETICIAN_ANUAL: $499.99/año
- PRO_PLUS_ANUAL: $199.99/año
- Pack 10: $4.99; Pack 25: $9.99

### Fixes posteriores
- `User` no tiene campo `skinType` — se obtiene del último `SkinAnalysis` en lugar del perfil del usuario
- `SKIN_TYPE_GROUPS` (array estático) no tiene `_count` — se usa el objeto de DB para acceder a members/posts
- `GEMINI_API_KEY` se configura en `.env` local y en variables de entorno de Render

### Decisiones de AI
- **NVIDIA `nvidia/nemotron-3.5-super-vl-120b-a12b`** como proveedor primario de visión (análisis de piel + escáner ingredientes). Fallback automático a Gemini si NVIDIA falla
  - `meta/llama-3.2-90b-vision-instruct` **murió el 2026-11-16** (EOL, HTTP 410). Nemotron es de razonamiento: consume ~400 tokens antes de responder → `MIN_MAX_TOKENS = 4096` en `nvidia-vision.ts`
- **Gemini `gemini-2.5-flash`** como fallback de visión (verificado HTTP 200)
  - `gemini-2.0-flash` **retirado por Google** (404 "no longer available"). `gemini-3.8-flash` y `gemini-flash-latest` daban 503 — no usar
- **Groq** para TODO el chat: RAG + `/asistente` — modelo **`openai/gpt-oss-120b`** (2026-11-16)
  - Key nueva `gsk_S8idx...` actualizada en `.env` y Render (la anterior daba 401)
  - `llama-3.3-70b-versatile`, `llama-3.1-8b-instant` y `meta-llama/llama-4-scout` **ya no existen** en esta key → migrados a `openai/gpt-oss-120b` (chat/comparativas) y `openai/gpt-oss-20b` (generación blog)
  - Modelos disponibles en la key: gpt-oss-120b/20b, qwen3.8-27b, allam-2-7b, whisper — **sin modelos vision** (otra vez)
  - `/api/user/comparison` con imágenes migrado de Groq → `vision.ts` (NVIDIA/Gemini), porque Groq no da visión
- `gemini-chat.ts` eliminado — `/asistente` migrado a Groq
- Rate limit de `/asistente` persiste en Redis (`checkRateLimit()` con key `asistente:daily:{userId}`)
- **Unified vision adapter**: `src/lib/vision.ts` intenta NVIDIA → Gemini secuencialmente

### Embudo de conversión (Nov 2026)
- **Plan Essential unificado a 3 análisis/mes** (antes: pricing.ts aplicaba 6 pero toda la UI decía 1 — corregido en pricing, translations EN/ES, telegram-responses, notifications, landing)
- **Análisis guest SIN registro**: `POST /api/analyze` acepta anónimos → 1/día por IP (`analyze:guest:{ip}`), NO guarda en DB, devuelve `{ guest: true, result }`. Si la IA falla se devuelve el intento (`clearRateLimit`). Componente `src/components/guest-result.tsx` muestra resultado + CTA de registro
- **Paywall post-análisis**: en `/analysis/results/[id]`, usuarios FREE ven card de upgrade → /pricing
- **Prueba social en landing**: sección con datos REALES (<30s, 50+ guías, 6 comunidades, 8 insignias) — sin métricas inventadas (coherente con "Sin Engaños")
- **Oferta de lanzamiento**: banner en /pricing comunicando el trial automático de 7 días Premium que ya existe en `auth.ts` (`trialEndsAt = now + 7d` en registro y OAuth)
- **PayPal NO sirve en Cuba** (decisión del usuario): QvaPay y Transfermóvil se mantienen como métodos reales. PayPal queda configurado pero es sandbox

### Documentación
- **DOC-admin.md**: Solo contiene "cómo usar el panel admin"
- **DOC-validator.md**: Solo comandos y responsabilidades
- **DOC-payments.md**: Describe PayPal, Transfermóvil, precios actualizados, política de reembolsos
- **AGENTS.md**: Decisiones técnicas y mejoras recientes
- **README.md**: Documentación oficial de la app

### Auditoría profunda del panel admin y la web (Nov 2026)
**1. Schema de BD desfasado** — la migración QvaPay→PayPal se aplicó al código pero NUNCA a la base: faltaban `Payment.paypalOrderId` y `Subscription.paypalSubscriptionId` → `/api/admin/payments` y `/api/admin/analytics` devolvían **500**. Corregido con un push **aditivo** (los campos legacy de QvaPay se re-agregaron al schema para no perder datos, porque es el método real en Cuba).

**2. Gating de planes roto con las variantes `_ANNUAL`** — todos los features comparaban el plan por string exacto, así que quien compraba el plan anual quedaba **fuera**: las 4 APIs de esteticista devolvían **403** para `ESTHETICIAN_ANNUAL`. Creados `basePlan()`, `isEstheticianPlan()`, `hasProAccess()`, `hasProPlusAccess()` en `pricing.ts` y migrados **17 gates** (10 APIs + 7 UI).

**3. Base de conocimiento del bot envenenada** — el sync scrapeaba las propias páginas y quitaba los tags de TODO el HTML, así que 13 entradas guardaban el chrome de navegación ("The Serene Lens | ... Inicio Productos ...") truncado a 3000 chars. El bot respondía con eso. Ahora el sync extrae solo `<main>`, descarta script/nav/header/footer, rechaza contenidos <200 chars y no crea placeholders. Borradas 15 entradas basura (13 scrapeadas + 1 placeholder + "Predictor de Envejecimiento" de una feature ya borrada).

**4. APIs admin sin interfaz** (datos que salían de la DB pero no se mostraban) — 9 huérfanas. Construidas:
- `/admin/challenges` — CRUD de desafíos (31 en DB, visibles para el usuario en `/dashboard/challenges` sin forma de gestionarlos)
- `/admin/chat` — bandeja de soporte: lista de conversaciones, hilo y respuesta (la API existía desde siempre)
- `/dashboard/chat` — UI del usuario del chat de soporte (no existía: las APIs `/api/chat/*` no las usaba nadie)

**5. Bug de shape de respuesta** — `analysis/page.tsx` leía `data.analysis.id` pero `ok()` envuelve en `{success, data:{...}}` → "Cannot read properties of undefined (reading 'id')" al terminar un análisis. El resumen "Resumen General" era además **texto hardcodeado** en la página, no el `resumenGeneral` real de la IA.

### Auditoría de APIs (Nov 2026) — bugs críticos corregidos
- **`/api/products` devolvía SIEMPRE el catálogo vacío**: `getCache()` es async y no se esperaba → la
  Promise era truthy → `JSON.stringify(promise)` = `{}` y la página `/products` salía vacía. También
  el `setCache` sin await auto-invalidaba la caché en cada request
- **El webhook de PayPal revertía la transacción**: `payload: body` (objeto) en una columna `String`
  → `PrismaClientValidationError` → el `payment.update({status:"completed"})` y el `subscription.create`
  nunca se guardaban. Ahora `payload: JSON.stringify(body)`
- **Los packs PACK_10 y PACK_25 devolvían 400**: el enum del endpoint solo aceptaba
  BASIC/POPULAR/ADVANCED, y el "más popular" de la web era PACK_10. El `isPack` hardcodeado además
  caía en la rama de suscripción y creaba un plan inexistente → 1 análisis/mes y 0 packs entregados.
  Ahora se usa `getPack()` como fuente única
- **Password reset = account takeover**: el endpoint público devolvía el `resetUrl` con token válido a
  cualquiera que conozca el email. Mitigaciones: límite por email (3/h), se invalidan los tokens
  anteriores del mismo identificador y queda traza en el log. ⚠️ El enlace se sigue mostrando en
  pantalla porque el email está desactivado — si se reactiva el email, hay que devolverlo por email
- **8 crons aceptaban `Bearer undefined`** si faltaba `CRON_SECRET` (comparación por string).
  Ahora todos usan `verifyCronSecret(req)`, que falla cerrado
- **Webhook de Telegram fail-open**: sin `TELEGRAM_WEBHOOK_SECRET` no validaba nada. Ahora se bloquea
  (503) si no está configurado
- **IDOR**: `analysis.userId = null` (análisis de cliente de esteticista) lo podía reclamar o leer
  cualquier usuario autenticado. Ahora solo la esteticista propietaria
- **Path traversal** en la descarga de guías (`fileUrl` de la DB sin sanear) → ahora se resuelve
  dentro de `public/guides` y se verifica el prefijo
- **`POST /api/chat/messages` sin sesión** → cualquiera escribía en cualquier chat. Ahora exige sesión,
  limita a 20 msg/min y 2000 caracteres
- **Exploit de regalos**: crear un regalo y canjearlo daba packs gratis ilimitados. Ahora hay límite
  de 2 regalos/día por usuario y 5 canjes/hora
- **Recompensa de racha de 7 días** se cobraba dos veces el mismo día y además se Otorgaba sobre
  `analysisLimit`, un campo legacy que el límite real ignora. Ahora se otorga como `PurchasePack`
  (que sí cuenta) y solo al pasar de 6 a 7 días
- **Shape de respuesta**: `/guides` leía `purchases` (la API devuelve `guides`), `/dashboard/b2b` y
  `/forgot-password` leían la respuesta sin desenvolver `data` → panel B2B vacío y enlace de
  recuperación nunca mostrado
- **Límites de paginación negativos** (`?limit=-5`) provocaban 500 de Prisma → ahora se acotan
- **`analysisBodySchema` es `.strict()`** pero el endpoint inyecta `clientId` → cualquier análisis de
  cliente era rechazado por validación

### Auditoría de APIs (Nov 2026) — cierre
- 29 endpoints sin ningún llamador en la UI. Decisión: **NO borrarlos** — varios son el soporte del
  bot de Telegram y de los pagos (gift/link-telegram), y otros están "reservados" para el embudo
  (chat, community comments/likes, check-in). Revisar cuando haya métricas de uso reales
- CSRF de admin: **cerrado** — las 18 mutaciones admin validan `validateCsrf` y toda la UI admin
  usa `apiFetch` (que inyecta el header)
- `admin/analytics`: pasa de cargar la tabla Payment entera a `aggregate` (evita OOM)
- Paginación ausente en `admin/payments`, `admin/users`, `admin/messages`, `admin/audit-logs`
  → añadir `take`+`skip` cuando crezca el volumen (hoy es pequeño)

### Funnel de adquisición por Telegram (Nov 2026)
`src/lib/telegram-analyze.ts` — el bot ignoraba las fotos (`if (!msg?.text) return`), así que el
canal más importante en Cuba estaba muerto:
- **Entradas**: botón "Analizar" en el teclado público, CTA en el saludo, lenguaje natural
  ("analiza mi piel") y comando `/analizar`
- **Flujo**: foto(s) → descarga vía `getFile` → guarda hasta 3 (TTL 30 min) → `/listo` o la 3ª
  foto dispara `analyzeSkinWithGroq` (visión unificada NVIDIA → Gemini)
- **Límites**: 3 análisis/día por chat (con devolución del intento si la IA falla) + cooldown
  de 1 foto/min por chat
- **CTA**: el resultado termina con el enlace a `/register?callbackUrl=/analysis&from=telegram`
- **Verificación**: el webhook acepta updates con el `TELEGRAM_WEBHOOK_SECRET` (403 sin él);
  los comandos quedan en la tabla `TelegramLog`

### Instrumentación del embudo (PostHog, Nov 2026)
Tres eventos para medir guest → registro → pago:
- `guest_analysis_done` — un invitado completó su análisis (deja la marca
  `tsl_guest_analysis_done` en localStorage). Se emite desde `analysis/page.tsx`
- `signup_from_guest` — registro con la marca anterior presente. Se emite desde `login/page.tsx`
- `trial_to_paid` — pago completado con prueba activa. Se emite desde `pricing/success/page.tsx`
- Ya existían: `analysis_started`, `analysis_photo_uploaded`, `analysis_abandoned`,
  `payment_success`, `payment_failed`

Para ver el embudo: PostHog → Insights → **Funnel** con esos 3 nombres, ventana de 14 días.

### Verificación end-to-end en producción (17 Nov 2026)
Recorrido completo con usuario nuevo (registro → trial Premium → análisis → resultados):
- Registro con CSRF de la cookie `csrf-token` (64 hex, la del middleware). Ojo: la cookie de next-auth
  (`__Host-next-auth.csrf-token`) es otra y solo sirve para el callback de credenciales
- El trial de 7 días Premium se activa solo al registrarse ✓
- Análisis logueado → 200 en ~26s con NVIDIA, devuelve `analysis.id` + `result`
- Registro en DB con forma canónica v2: 6 métricas, `confidence`, `confidenceReason`, `resumenGeneral`,
  `observations[]`, `routine.morning/evening` ✓
- La página de resultados ahora calcula **6 categorías** (antes 0) y muestra el resumen real de la IA

### Forma canónica de los datos de análisis (`src/lib/analysis-shape.ts`)
La columna `SkinAnalysis.observations` guardaba un array plano de strings mientras la mayoría de consumidores la leían como objeto con métricas → la página de resultados salía con "No determinada / 0 categorías" y el gráfico de evolución nunca tenía datos.
- Canónico v2: `{ v, skinType, observations[], texture, shine, pores, uniformity, apparentSensitivity, apparentOil, confidence, resumenGeneral, routine, ... }`
- `parseObservations()` tolera array legacy (array plano) y objeto legacy
- `toAnalysisView()` = único mapeo a la vista de UI (resultados y comparativas comparten mapper)
- El prompt de IA ahora pide las **6 métricas por categoría** (etiquetas Bajo/Leve/Moderado/Visible/Alto) + `confidence`
- Migrados los 11 consumidores (resultados, evolución, insignias, comparativas, social, informes, telegram, historial, dashboard)

## Archivos clave recientes

| Archivo | Propósito |
|---------|-----------|
| `src/lib/services/badge.service.ts` | Evaluación y asignación de insignias |
| `src/lib/services/ingredient.service.ts` | Detección de conflictos entre ingredientes |
| `src/lib/services/analysis.service.ts` | Análisis de piel con historial completo |
| `src/lib/gemini-vision.ts` | Visión IA con Gemini 2.0 Flash (análisis piel + escáner ingredientes) — fallback |
| `src/lib/nvidia-vision.ts` | Visión IA con NVIDIA Llama 3.2 90B Vision (proveedor primario) |
| `src/lib/analysis-shape.ts` | Forma canónica de los datos de análisis + parsers tolerantes a legacy |
| `src/lib/client-ip.ts` | IP real del cliente para rate limits (x-forwarded-for con IPs variables) |
| `src/app/admin/challenges/page.tsx` | Gestión de desafíos gamificados (API existía sin UI) |
| `src/app/admin/chat/page.tsx` | Bandeja de soporte (responde a los chats de los usuarios) |
| `src/app/dashboard/chat/page.tsx` | Chat de soporte del usuario (las APIs no las usaba nadie) |
| `src/lib/vision.ts` | Adapter unificado: intenta NVIDIA primero, cae a Gemini |
| `src/lib/groq.ts` | Análisis de piel (usa vision.ts internamente) |
| `src/lib/groq-chat.ts` | Chat Groq con `llama-3.3-70b-versatile` para RAG + `/asistente` |
| `src/app/api/cron/weather-alert/route.ts` | Alertas por cambios climáticos |
| `src/app/api/community/` | API completa de comunidad (grupos, posts, comentarios) |
| `src/app/community/page.tsx` | Comunidad segmentada por tipo de piel |
| `src/app/dashboard/products/page.tsx` | Productos guardados con detección de conflictos |
| `src/components/badge-display.tsx` | Visualización de insignias |
| `src/components/save-product-button.tsx` | Botón guardar producto |
| `src/components/webcam-capture.tsx` | Captura de foto con cámara para escanear ingredientes |
| `src/components/qr-code-image.tsx` | Generador de QR para enlace de referido (fallback a API externa) |
| `src/app/api/telegram/webhook/route.ts` | Webhook Telegram con after(), Redis, access check |
| `prisma/seed-community.ts` | Seed de grupos e insignias |

### Webhook Telegram refactorizado con `after()`
- `after()` de Next.js 16 para responder 200 OK instantáneamente y procesar en background
- Cooldown spam migrado de Map en memoria a `checkRateLimit()` con Redis (Upstash)
- Siempre retorna 200 OK incluso en catch (evita reintentos infinitos de Telegram)
- `secret_token` validado con header `X-Telegram-Bot-Api-Secret-Token`
- Lógica de routing extraída a `processUpdate()` para claridad
- `checkTelegramAccess()` extraída como función reutilizable para comandos restringidos

### Rate limits persistentes en Redis
- Asistente rate limit migrado a `checkRateLimit()` con key `asistente:daily:{userId}` en Upstash
- Cooldown spam de comandos también usa `checkRateLimit()` con key `cooldown:telegram:{chatId}`
- Eliminados todos los Map en memoria que se perdían al reiniciar Render

### FREE limit extendido
- `analysesPerMonth: 6` en pricing.ts (antes 1)

### Escáner de ingredientes por webcam
- Nuevo componente `WebcamCapture` (`src/components/webcam-capture.tsx`)
- Botón "Escanear con cámara" en `/ingredients-analyzer` que activa la cámara trasera
- Captura foto → la envía al mismo endpoint `/api/product-scan` para OCR con Groq Vision
- Compatible con permisos de cámara en mobile y desktop

### Código QR para esteticistas
- Nuevo componente `QRCodeImage` (`src/components/qr-code-image.tsx`) que genera QR del enlace de referido
- Añadido al kit de marketing del esteticista (`/dashboard/esthetician/marketing`)
- El QR codifica `{origin}/register?ref={referralCode}`
- Botón para descargar QR como PNG
- Usa `api.qrserver.com` como backend (qrcode npm no instalable por timeout de red en esta máquina)

### Comunidad con caché
- `getUserSkinType()` envuelta en `cache()` de React para evitar DB roundtrips innecesarios
- `Promise.all()` para paralelizar consultas

### "Ver más" en comunidad
- Posts largos (>150 chars) muestran botón "Ver más" / "Show more"
- Nuevas claves de traducción: `community.showMore`, `community.showLess`

### Modelo Groq actualizado
- `llama-3.2-11b-vision-preview` fue deprecado por Groq
- Se intentó reemplazar por `meta-llama/llama-4-scout-17b-16e-instruct` pero ese modelo tampoco existe en Groq
- Todos los modelos vision de Groq fueron descontinuados (`model_decommissioned`)
- **Solución**: Migrar la visión (análisis de piel y escáner de ingredientes) a **Gemini 2.0 Flash**. 
- Nuevo archivo `src/lib/gemini-vision.ts` con funciones `analyzeImageWithGemini()` y `analyzeMultipleImagesWithGemini()`
- `src/lib/groq.ts` ahora usa Gemini internamente (el API pública `analyzeSkinWithGroq` no cambia)
- `src/lib/product-scanner.ts` usa `analyzeImageWithGemini()` directamente
- Groq se usa para TODO el chat (`llama-3.3-70b-versatile` en `groq-chat.ts`) — tanto RAG como `/asistente`
- `gemini-chat.ts` eliminado: `/asistente` migrado a Groq (ya no depende de `GEMINI_API_KEY`)
- Aging demo eliminado: componente y API route removidos (código muerto, no se usaba)

### Guías — SVGs únicos generados
- Script `scripts/generate-guide-svgs.ts` genera 50 SVGs únicos con colores por categoría
- Cada SVG tiene título, categoría, ícono representativo y diseño gradient
- PDFs individuales generados para cada guía en `public/guides/*.pdf`
- `seed-guides.ts` actualizado: cada guía tiene su propio `fileUrl` (`/guides/{slug}.pdf`)
- Fallback de imagen agregado a `guides/page.tsx` (como en products page)

### Email reemplazado por notificaciones web
- `src/lib/email.ts`变成了 stub: todas las funciones devuelven "Próximamente", nunca envía emails reales
- Nuevo `src/lib/notifications.ts`: crea notificaciones web en DB (modelo `Notification`)
- Notificaciones expiran a las 48h via cron `/api/cron/cleanup-notifications`
- Campana de notificaciones (`NotificationBell`) en sidebar con contador no leídos
- Dashboard `/dashboard/notifications` con lista completa de notificaciones
- APIs existentes: `GET /api/notifications`, `PUT /api/notifications`, `PATCH /api/notifications/[id]`
- Todos los callers de email reemplazados:
  - Registro: crea `createWelcomeNotification`
  - Auth: crea `createWelcomeNotification`
  - Payment success: crea `createPaymentSuccessNotification`
  - Gift: crea `createGiftNotification`
  - Password reset: devuelve resetUrl directamente en API response
  - Retention cron: crea `createRetentionNotification`
  - Reminder cron: crea `createReminderNotification`
  - Trial cleanup cron: crea `createTrialEndedNotification`
  - Lead magnet: ya no envía email, solo guarda en DB
  - Admin email blast: crea notificaciones web
  - Cron emails: marca todas como web-only

### Admin — Back buttons traducidos
- 10 páginas admin cambiadas de "Volver al panel" hardcoded a `t("common.back", locale)`

### Login — Telegram section en perfil
- Nueva sección en `/dashboard/profile` que muestra estado de Telegram vinculado
- Si no está vinculado, muestra instrucciones para vincular con `@TheSereneLensBot`
- Muestra `telegramId` del usuario si ya está vinculado

### Homepage — Precios actualizados + Footer
- PREMIUM: $7.99/mes ($79.99/año)
- PRO: $14.99/mes
- ESTHETICIAN: $49.99/mes ($499.99/año)
- Nuevo footer con links: /privacy, /terms, /payment-policy, /contact, /about
- Nuevas páginas: /payment-policy, /contact

### Notification Bell (sidebar)
- Componente `NotificationBell` con badge de contador no leídos
- Sidebar item "Notificaciones" en sección Cuenta (con traducción `sidebar.notifications`)
- Claves de traducción agregadas para EN/ES

### Orphaned `notification-bell.tsx` eliminado
- Existían dos archivos: `src/components/notification-bell.tsx` (dead code, 45 líneas) y `src/components/notifications/notification-bell.tsx` (activo, 200+ líneas)
- Se eliminó `src/components/notification-bell.tsx` del repo

### Admin emails → Notificaciones
- La página `/admin/emails` se renombró de "Correo Electrónico" a "Notificaciones"
- Se eliminó el modo email (stub) y el toggle Email/Push
- Ahora solo envía notificaciones web push por segmento

### Password reset con copia
- Al solicitar restablecimiento de contraseña, el enlace se muestra en pantalla con botón "Copiar enlace"
- Ya no depende de email (que es stub)

### Fixes de build
- `src/lib/telegram-handlers.ts`: se agregó `id: true` al `select` de Prisma (faltaba el campo, causaba TS error)
- `src/components/qr-code-image.tsx`: se eliminó el `import("qrcode")` dinámico para evitar error de módulo no encontrado

## Estado crítico — API Keys (verificado 2026-11-16)
- **Render configurado vía API** (`rnd_iIU...`): `NVIDIA_API_KEY`, `PAYPAL_*`, `GROQ_API_KEY` (nueva) añadidas; `QVAPAY_*` **se mantienen** (PayPal no sirve en Cuba — decisión del usuario)
- **GROQ key nueva `gsk_S8idx...`** verificada (200) — modelo cambiado a `openai/gpt-oss-120b` en código
- **GEMINI_API_KEY en Render** funciona con `gemini-2.5-flash` (código migrado desde `gemini-2.0-flash` retirado)
- **NVIDIA**: key válida, modelo `nvidia/nemotron-3.5-super-vl-120b-a12b` verificado con imagen real
- El bot de Telegram `/asistente` usa Groq con el nuevo modelo

### Test de APIs en producción (2026-11-16)
- **185 endpoints probados: 184 OK, 0 rotas** (200×21, 401×98, 403×53, 404×6, 405×6, 400×1)
- Los 401/403 son respuestas correctas de auth/CSRF; los 404 son recursos fake esperados; 405 = método equivocado
- `/api/health`: DB ok (60ms), Groq "1 clave configurada" (pero la key es inválida al usarla)
- Script: `/tmp/opencode/api_test.py`, resultados: `/tmp/opencode/api_results.json`

### Fixes de código (Julio 2026)
- **CSRF añadido a +46 endpoints**: +39 anteriores + product-scan, analyze, analyze/stream, register, chat/messages, chat/session, lead-magnet
- **Empty catch blocks loggean errores**: ~25 catch blocks en API routes y lib ahora usan `logger.error()` en vez de silenciar (register, reset-password, gift, analyze/stream, community, product-scan, weather-alert, analysis-cache, analysis.service, payment.service, auth.ts, bot-knowledge)
- **`as any` eliminados**: ~25 casts removidos de session.user (plan/role ya tipados en next-auth.d.ts), navigator.connection, globalThis, Prisma dynamic keys, Record<string, any>, clarity window
- **Hardcoded URLs eliminados**: 44 referencias a `the-serene-lens-nuevo.onrender.com` reemplazadas por `process.env.NEXT_PUBLIC_APP_URL || ""`
- **N+1 queries**: badge.service, cleanup-trials, send-reminders, telegram-handlers, bot-knowledge
- **Paginación cursor-based**: community posts/comments
- **CSP actualizado**: Gemini, Groq, PayPal, QRServer
- **Tests**: 229 pasando en 25 archivos

## Estado del build en Render
- `fa45213` (NVIDIA vision + CSRF +46 + TS fixes) **desplegado y verificado en producción** (el endpoint register ya responde con el CSRF nuevo)
- Siguiente push: embudo de conversión + emojis + modelos de IA corregidos → hacer deploy con clear cache vía API:
  `POST /v1/services/srv-d8arlkuq1p3s73drdc0g/deploys` con `{"clear_cache": "true"}`

## Monitoreo de Visión IA
- `nvidia-vision.ts` y `gemini-vision.ts` envían errores a Sentry mediante `captureError` y `captureMessage`
- Auth errors (401/403) = disparan `captureMessage("NVIDIA_API_KEY inválida" / "GEMINI_API_KEY expirada")` → visible en Sentry Dashboard
- Network errors y fallos inesperados = `captureError()` con contexto
- `NVIDIA_API_KEY` es opcional en `env.ts` (Zod). `GEMINI_API_KEY` sigue siendo requerida como fallback

## Próximas tareas pendientes
- Push final + deploy con clear cache en Render (pendiente: tests + build)
- Verificar análisis real end-to-end en producción tras el deploy
- Verificar chat `/asistente` y RAG con el nuevo modelo Groq en producción
- Configurar `TELEGRAM_BOT_TOKEN`/`TELEGRAM_BOT_SECRET_TOKEN` en Render si se desean UV alerts y Telegram como auth de API
