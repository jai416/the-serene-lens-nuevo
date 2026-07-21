# AGENTS.md — The Serene Lens

## Decisiones Técnicas

### Guías — Imágenes SVG en lugar de JPG duplicados
- seed.ts usaba JPGs de Pexels reutilizados en múltiples guías (misma imagen para 3 guías distintas)
- **Solución**: Reemplazadas con SVGs temáticos de `/guides/*.svg` (50 SVGs únicos ya existentes de seed-guides.ts). Cada guía tiene su propio SVG acorde al tema.

### Homepage — SkinTest y LeadMagnet eliminados
- **Mini Test**: Se quitó el componente SkinTest de la landing page porque es una versión reducida que compite con el análisis real por IA
- **Lead Magnet**: Se quitó el formulario de captura de email para la guía gratuita (está en `/guides` y no necesita estar en la landing)
- **Orden**: AgingDemo → HowItWorks → Features → ActionCards → Pricing → FAQ

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
- **Gemini 2.0 Flash** para análisis de piel con imágenes (reemplazó a Groq cuyos modelos vision fueron descontinuados)
- **Gemini 2.0 Flash** para asistente Telegram (`/asistente`)
- **Groq** (`llama-3.3-70b-versatile`) para chat del bot (RAG, respuestas sin imágenes)
- Rate limit de `/asistente` persiste en Redis (`checkRateLimit()` con key `asistente:daily:{userId}`)

### Documentación
- **DOC-admin.md**: Solo contiene "cómo usar el panel admin"
- **DOC-validator.md**: Solo comandos y responsabilidades
- **DOC-payments.md**: Describe QvaPay, Transfermóvil, precios actualizados, política de reembolsos
- **AGENTS.md**: Decisiones técnicas y mejoras recientes
- **README.md**: Documentación oficial de la app

## Archivos clave recientes

| Archivo | Propósito |
|---------|-----------|
| `src/lib/services/badge.service.ts` | Evaluación y asignación de insignias |
| `src/lib/services/ingredient.service.ts` | Detección de conflictos entre ingredientes |
| `src/lib/services/analysis.service.ts` | Análisis de piel con historial completo |
| `src/lib/gemini-vision.ts` | Visión IA con Gemini 2.0 Flash (reemplaza a Groq para imágenes) |
| `src/lib/groq.ts` | Análisis de piel (usa Gemini internamente) |
| `src/lib/groq-chat.ts` | Chat Groq con `llama-3.3-70b-versatile` para RAG |
| `src/lib/gemini-chat.ts` | Cliente Gemini 2.0 Flash para asistente Telegram |
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
- **Solución**: Migrar toda la visión (análisis de piel, escáner de ingredientes, aging demo) a **Gemini 2.0 Flash**
- Nuevo archivo `src/lib/gemini-vision.ts` con funciones `analyzeImageWithGemini()` y `analyzeMultipleImagesWithGemini()`
- `src/lib/groq.ts` ahora usa Gemini internamente (el API pública `analyzeSkinWithGroq` no cambia)
- `src/lib/product-scanner.ts` usa `analyzeImageWithGemini()` directamente
- `src/app/api/aging-demo/route.ts` usa `analyzeImageWithGemini()` directamente
- Groq sigue usándose solo para chat sin imágenes (`llama-3.3-70b-versatile` en `groq-chat.ts`)

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

## Próximas tareas pendientes
- Monitorear build en Render tras push de fixes (qrcode, telegram-handlers)
- Verificar que `/api/cron/cleanup-notifications` aparezca tras el build (daba 404 en Render)
- Configurar `TELEGRAM_BOT_TOKEN` en Render si se desea UV alerts
- Commit de `CRON-SETUP.md` (documentación, no crítico)
