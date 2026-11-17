# The Serene Lens

Observación cosmética de tu piel con inteligencia artificial.

## Stack

| Capa | Tecnología |
|------|------------|
| Framework | Next.js 16 (Turbopack) + React 19 |
| Base de datos | PostgreSQL (Supabase) + Prisma 7 |
| Autenticación | NextAuth v4 (JWT + credentials + Google + GitHub) |
| AI Visión | NVIDIA `nemotron-3.5-super-vl-120b` (primario) + Gemini `gemini-2.5-flash` (fallback) |
| AI Chat (RAG + `/asistente`) | Groq `openai/gpt-oss-120b` |
| Pagos | Transfermóvil (CUP, Cuba) + PayPal (USD). Packs y regalos |
| Bot | Telegram (webhook con `after()`, RAG, `/asistente`, validación de pagos) |
| Notificaciones | Sistema propio web + Redis (Upstash). Email desactivado (stubs) |
| Monitoreo | Sentry + Microsoft Clarity |
| Despliegue | Render |

## Funcionalidades principales

- **Análisis de piel con IA**: Sube selfies y recibe observaciones cosméticas personalizadas con rutinas AM/PM.
  La IA recuerda tu historial completo y compara progreso.
- **1 análisis gratis sin registro**: sube tus fotos, obtén el resultado y crea la cuenta solo si quieres guardarlo.
- **3 análisis/mes en Essential** (gratis) + **prueba de Premium de 7 días** al registrarte.
- **Planes**: Essential $0, Premium $7.99, Pro $9.99, Pro+ $14.99, Esteticista $49.99 (anuales disponibles).
- **Chat de soporte en vivo** (`/dashboard/chat`): hablas con el equipo y responden en el panel admin.
- **Asistente IA**: Chat con Groq vía Telegram (`/asistente`). Límite diario según plan.
- **Notificaciones web**: Campana en sidebar, dashboard de notificaciones, expiran a las 48h. Reemplaza al email.
- **Productos guardados**: Guarda productos y detecta conflictos entre ingredientes (retinol + BHA, niacina + vitamina C…).
- **Insignias y desafíos**: Logros por rachas y análisis completados + desafíos gamificados semanales/mensuales.
- **Comunidad segmentada**: Grupos por tipo de piel (grasa, seca, mixta, sensible, normal, general). Paginación cursor-based.
- **Evolución visual**: Gráficos Recharts con tendencias de textura, brillo, poros, uniformidad, sensibilidad y grasa.
- **Alertas climáticas**: Notificaciones automáticas cuando humedad o temperatura cambian significativamente.
- **Blog + Productos + Guías digitales**: 64 guías con SVG y PDF únicos, tienda integrada.
- **Escáner de ingredientes por webcam**: Captura foto y analiza con visión IA (NVIDIA/Gemini).
- **Panel Esteticista**: Gestión de pacientes propios, análisis, informes PDF, código QR de referido.
- **Panel Admin**: Métricas, usuarios, pagos, Transfermóvil, blog, productos, guías, desafíos, chat de soporte,
  Telegram, base de conocimiento del bot y notificaciones push.
- **Diario de piel, Desafíos**: Seguimiento diario con rachas.
- **Idioma**: Español e Inglés (detección automática + toggle manual).

## Seguridad

- **CSRF**: 46 endpoints de mutación protegidos con `validateCsrf()`
- **Logger estructurado**: Todos los errores pasan por `logger.error()` (sin `console.log/error` raw)
- **Tipado estricto**: `strict: true` en tsconfig. Sin `as any` en código fuente
- **Sin URLs hardcodeadas**: Todas las URLs usan `NEXT_PUBLIC_APP_URL` desde env vars
- **XSS sanitizado**: `dangerouslySetInnerHTML` sanitiza scripts y event handlers
- **Rate limits**: Upstash Redis con fallback a DB. La IP real se extrae con `getClientIp()`
  (`x-forwarded-for` trae IPs variables detrás de Cloudflare yrompería el límite)
- **N+1 queries eliminados**: Batch operations con `createMany`/`updateMany`
- **Límites por plan correctos**: el plan anual da los mismos accesos que el mensual (`basePlan()`)

## Enlaces

- **App**: https://the-serene-lens-nuevo.onrender.com
- **Admin**: `/admin` (rol ADMIN)
- **Login**: `/login`

## Requisitos

- Node.js 20+ (Render usa Node 22)
- PostgreSQL (Supabase)
- API keys: NVIDIA (visión primaria) o Gemini (fallback), Groq (chat RAG + `/asistente`),
  PayPal, Telegram Bot, Sentry, Clarity, OpenWeatherMap, Redis Upstash
- `.npmrc` con `legacy-peer-deps=true` (necesario por `@sentry/nextjs` con Next.js 16)

## Comandos

```bash
npm run dev              # Desarrollo
npm run build            # Build producción (~10 min)
npm test                 # Tests (Vitest, 244 tests, 27 archivos)
npm run type-check       # tsc --noEmit
npm run seed             # Seed principal (productos, challenges, digital products)
npm run seed:guides      # Seed guías digitales (64 guías con SVGs/PDFs)
npm run seed:community   # Seed comunidades (6 grupos, 8 insignias)
npm run seed:knowledge   # Seed base de conocimiento RAG (30 entradas)
npm run db:push          # Sincroniza el schema Prisma con la DB (¡revisar el diff antes!)
```

> ⚠️ **Schema y base de datos**: si cambias `prisma/schema.prisma`, la DB de producción no se
> actualiza sola. Antes de `npx prisma db push`, revisa el diff:
> `npx prisma migrate diff --from-config-datasource --to-schema prisma/schema.prisma --script`
> Un `DROP COLUMN` borra datos reales.

## Cron Jobs (configurar en cron-job.org)

Ver `CRON-SETUP.md` para configuración detallada. Todos requieren header `Authorization: Bearer <CRON_SECRET>`.

| Endpoint | Frecuencia | Método | Propósito |
|----------|-----------|--------|-----------|
| `/api/cron/keep-alive` | Cada 10 min | GET | Evita que Render duerma |
| `/api/cron/cleanup-notifications` | Diario 3:00 | POST | Elimina notificaciones >48h |
| `/api/cron/cleanup-trials` | Diario 3:05 | POST | Expira trials vencidos |
| `/api/cron/cleanup-cache` | Diario 3:10 | POST | Limpia caché expirada |
| `/api/cron/cleanup-rate-limit` | Diario 3:15 | POST | Limpia rate limits viejos |
| `/api/cron/generate-seo` | Diario 4:00 | POST | Genera 1 artículo SEO |
| `/api/cron/send-reminders` | Diario 8:00 | GET | Recordatorios de usuarios |
| `/api/cron/weather-alert` | Diario 9:00 | GET | Alertas climáticas |
| `/api/cron/uv-alerts` | Diario 12:00 | GET | Alerta UV ≥8 |
| `/api/cron/retention` | Semanal (lun) | POST | Re-engancha inactivos |

## Mejoras recientes

| Mejora | Descripción |
|--------|-------------|
| Forma canónica del análisis | Una sola estructura de datos (`analysis-shape.ts`) + 11 consumidores migrados. Antes la página decía "No determinada / 0 categorías" y la evolución nunca tenía datos |
| Análisis sin registro | 1 análisis gratis al día por IP, con paywall de registro al terminar |
| Panel de esteticista desbloqueado | El plan anual (`*_ANNUAL`) quedaba fuera de 17 features. Todo el gating usa ahora `basePlan()` |
| Schema de BD sincronizado | PayPal en código pero no en la DB → `/admin/payments` y `/admin/analytics` daban 500 |
| RAG limpio | El sync guardaba el chrome de navegación en 13 entradas del bot. Ahora extrae solo `<main>` |
| Chat de soporte | Bandeja en `/admin/chat` + chat del usuario en `/dashboard/chat` (las APIs no las usaba nadie) |
| Gestión de desafíos | `/admin/challenges` (los 31 desafíos eran visibles para el usuario, sin forma de gestionarlos) |
| Paywall post-análisis | Los usuarios FREE ven qué desbloquea Premium al terminar su análisis |
| CSRF masivo | 46 endpoints de mutación protegidos |
| Logger estructurado | Todos los console.* reemplazados por logger |
| Sin `as any` | ~25 casts eliminados, types existentes en next-auth.d.ts |
| Sin URLs hardcodeadas | 44 referencias a render.com reemplazadas por env vars |
| IA con memoria | El prompt incluye historial completo de análisis (últimos 10) |
| Insignias y desafíos | Logros automáticos + desafíos gamificados |
| Comunidad segmentada | Grupos por tipo de piel con posts, comentarios y membresía |
| Alertas climáticas | Notificaciones por cambios de humedad/temperatura |
| Escáner webcam | Analiza ingredientes con foto desde la cámara (trasera por defecto + botón girar) |
| Webhook Telegram async | `after()` de Next.js 16 + rate limits persistentes en Redis |
| Notificaciones web | Reemplaza email. Campana en sidebar, dashboard, cleanup 48h |
| QvaPay → PayPal | Schema y API migrados a PayPal (los campos legacy se conservan sin perder datos) |
| Emojis fuera | ~400 emojis eliminados (28 archivos), sustituidos por iconos lucide |

## Documentación

| Documento | Contenido |
|-----------|-----------|
| `AGENTS.md` | Decisiones técnicas, hallazgos de auditoría y estado del proyecto |
| `README.md` | Este documento: stack, funcionalidades, comandos |
| `DOC-admin.md` | Panel de administración: páginas, endpoints y seguridad |
| `DOC-validator.md` | Rol VALIDADOR: validación de pagos por Transfermóvil |
| `DOC-payments.md` | Pasarelas, planes, packs y solución de problemas |
| `CRON-SETUP.md` | Configuración de los cron jobs en cron-job.org |

## Licencia

Uso privado — The Serene Lens
