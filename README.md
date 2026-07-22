# The Serene Lens

Observación cosmética de tu piel con inteligencia artificial.

## Stack

| Capa | Tecnología |
|------|------------|
| Framework | Next.js 16 (Turbopack) |
| Base de datos | PostgreSQL (Supabase) + Prisma 7 |
| Autenticación | NextAuth v4 (JWT) + Google OAuth |
| AI Visión | Gemini 2.0 Flash (análisis de piel, escáner ingredientes). ⚠️ `GEMINI_API_KEY` no configurada en Render |
| AI Chat (RAG + `/asistente`) | Groq `llama-3.3-70b-versatile` (chat sin imágenes). ✅ Funcional en Render |
| Pagos | PayPal (USD) + Transfermóvil (CUP) |
| Bot | Telegram (webhook, RAG, `/asistente`, validación pagos) |
| Notificaciones | Sistema propio web + Redis (Upstash). Email desactivado (stubs) |
| Monitoreo | Sentry + Microsoft Clarity |
| Despliegue | Render |

## Funcionalidades principales

- **Análisis de piel con IA**: Sube selfies y recibe observaciones cosméticas personalizadas con rutinas AM/PM. La IA recuerda tu historial completo de análisis y compara progreso.
- **Planes**: Essential (gratis, 6 análisis/mes), Premium ($7.99/mes), Pro ($14.99/mes), Pro+ ($14.99/mes), Esteticista ($49.99/mes). Anuales y packs de análisis disponibles.
- **Asistente IA**: Chat con Groq `llama-3.3-70b-versatile` vía Telegram (`/asistente`). Límite diario según plan.
- **Notificaciones web**: Campana en sidebar con contador de no leídos, dashboard de notificaciones, expiran a las 48h. Reemplaza completamente al email.
- **Productos guardados**: Guarda tus productos favoritos y detecta conflictos entre ingredientes (retinol + BHA, niacina + vitamina C, etc.).
- **Insignias**: Logros automáticos por rachas, análisis completados y mejora de hidratación.
- **Comunidad segmentada**: Grupos por tipo de piel (grasa, seca, mixta, sensible, normal, general).
- **Evolución visual**: Gráficos Recharts con tendencias de textura, brillo, poros, uniformidad, sensibilidad y grasa. Disponible para todos los planes.
- **Alertas climáticas**: Notificaciones automáticas cuando humedad o temperatura cambian significativamente.
- **Blog + Productos + Guías digitales**: Contenido educativo y tienda integrada. 50 guías con SVGs y PDFs únicos.
- **Escáner de ingredientes por webcam**: Captura foto de ingredientes con la cámara y analiza con Groq Vision.
- **Panel Esteticista**: Gestión de pacientes propios, análisis, informes PDF, código QR de referido (fallback a API externa).
- **Panel Admin**: Dashboard con métricas, usuarios, pagos, blog, productos, guías, Telegram, notificaciones push.
- **Diario de piel, Desafíos**: Seguimiento diario con streaks.
- **Idioma**: Español e Inglés (detección automática + toggle manual).

## Enlaces

- **App**: https://the-serene-lens-nuevo.onrender.com
- **Admin**: `/admin`
- **Login**: `/login`

## Requisitos

- Node.js 20+
- PostgreSQL (Supabase recomendado)
- API keys: Gemini (solo visión: análisis piel + escáner), Groq (chat RAG + `/asistente`), PayPal, Telegram Bot, Sentry, Clarity, OpenWeatherMap, Redis Upstash
- `.npmrc` con `legacy-peer-deps=true` (necesario por `@sentry/nextjs` con Next.js 16)

## Comandos

```bash
npm run dev              # Desarrollo
npm run build            # Build producción
npm test                 # Tests (Vitest, 240+ tests)
npm run seed             # Seed principal (productos, challenges, digital products)
npm run seed:guides      # Seed guías digitales (64 guías con SVGs/PDFs)
npm run seed:community   # Seed comunidades (6 grupos, 8 insignias)
npm run seed:knowledge   # Seed base de conocimiento RAG
npm run db:push          # Push schema a DB

```

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
| IA con memoria | El prompt incluye historial completo de análisis (últimos 5) |
| Productos guardados | Guarda productos y detecta conflictos entre ingredientes |
| Insignias | Logros automáticos: rachas, análisis, mejora de hidratación |
| Comunidad segmentada | Grupos por tipo de piel con posts, comentarios y membresía |
| Evolución FREE | Gráfico de evolución disponible para todos los planes |
| Alertas climáticas | Notificaciones por cambios de humedad/temperatura |
| Escáner webcam | Analiza ingredientes con foto desde la cámara |
| Webhook Telegram async | `after()` de Next.js 16 + rate limits persistentes en Redis |
| Notificaciones web | Reemplaza email. Campana en sidebar, dashboard, cleanup 48h |
| Guías con SVGs únicos | 50 SVGs generados por categoría, cada guía con PDF propio |
| QR sin dependencia | Fallback a `api.qrserver.com` (qrcode npm no disponible) |
| Visión IA migrada a Gemini | Groq descontinuó todos sus modelos vision. Migrado a Gemini 2.0 Flash. Solo análisis piel + escáner ingredientes (sin aging demo, sin `/asistente`). ⚠️ `GEMINI_API_KEY` debe configurarse en Render Dashboard |
| `/asistente` migrado a Groq | Antes usaba Gemini Chat, ahora usa Groq `llama-3.3-70b-versatile` (mismo modelo que RAG). Ya no requiere `GEMINI_API_KEY` |
| Aging demo eliminado | Componente y API route removidos. Era código muerto (no se importaba en ninguna página) |

## Licencia

Uso privado — The Serene Lens
