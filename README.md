# The Serene Lens

Observación cosmética de tu piel con inteligencia artificial.

## Stack

| Capa | Tecnología |
|------|------------|
| Framework | Next.js 16 (Turbopack) |
| Base de datos | PostgreSQL (Supabase) + Prisma 7 |
| Autenticación | NextAuth v4 (JWT) + Google OAuth |
| AI Visión | Groq (Llama 3.2 11B Vision — análisis de piel) |
| AI Asistente | Gemini 2.0 Flash (Telegram /asistente) |
| Pagos | QvaPay (USD) + Transfermóvil (CUP) |
| Bot | Telegram (webhook, RAG, /asistente, validación pagos) |
| Monitoreo | Sentry + Microsoft Clarity |
| Despliegue | Render |

## Funcionalidades principales

- **Análisis de piel con IA**: Sube selfies y recibe observaciones cosméticas personalizadas con rutinas AM/PM. La IA recuerda tu historial completo de análisis y compara progreso.
- **Planes**: Essential (gratis), Premium ($7.99/mes), Pro ($9.99/mes), Pro+ ($14.99/mes), Esteticista ($49.99/mes). Anuales y packs de análisis disponibles.
- **Asistente IA**: Chat con Gemini 2.0 Flash vía Telegram (`/asistente`). Límite diario según plan.
- **Productos guardados**: Guarda tus productos favoritos y detecta conflictos entre ingredientes (retinol + BHA, niacina + vitamina C, etc.).
- **Insignias**: Logros automáticos por rachas, análisis completados y mejora de hidratación.
- **Comunidad segmentada**: Grupos por tipo de piel (grasa, seca, mixta, sensible, normal, general).
- **Evolución visual**: Gráficos Recharts con tendencias de textura, brillo, poros, uniformidad, sensibilidad y grasa. Disponible para todos los planes.
- **Alertas climáticas**: Notificaciones automáticas cuando humedad o temperatura cambian significativamente.
- **Blog + Productos + Guías digitales**: Contenido educativo y tienda integrada.
- **Panel Esteticista**: Gestión de pacientes propios, análisis, informes PDF, código de referido.
- **Panel Admin**: Dashboard con métricas, usuarios, pagos, blog, productos, guías, Telegram, notificaciones.
- **Diario de piel, Desafíos**: Seguimiento diario con streaks.
- **Idioma**: Español e Inglés (detección automática + toggle manual).

## Enlaces

- **App**: https://the-serene-lens-nuevo.onrender.com
- **Admin**: `/admin`
- **Login**: `/login`

## Requisitos

- Node.js 20+
- PostgreSQL (Supabase recomendado)
- API keys: Groq, Gemini, Gmail SMTP, QvaPay, Telegram Bot, Sentry, Clarity, OpenWeatherMap

## Comandos

```bash
npm run dev              # Desarrollo
npm run build            # Build producción
npm test                 # Tests (Vitest, 240 tests)
npm run seed             # Seed principal
npm run seed:knowledge   # Seed base de conocimiento RAG
npm run seed:guides      # Seed guías digitales
npm run seed:community   # Seed grupos e insignias
npm run db:push          # Push schema a DB
npm run test:gemini      # Test del cliente Gemini
```

## Mejoras recientes

| Mejora | Descripción |
|--------|-------------|
| IA con memoria | El prompt incluye historial completo de análisis (últimos 5) |
| Productos guardados | Guarda productos y detecta conflictos entre ingredientes |
| Insignias | Logros automáticos: rachas, análisis, mejora de hidratación |
| Comunidad segmentada | Grupos por tipo de piel con posts, comentarios y membresía |
| Evolución FREE | Gráfico de evolución disponible para todos los planes |
| Alertas climáticas | Notificaciones por cambios de humedad/temperatura |

## Licencia

Uso privado — The Serene Lens
