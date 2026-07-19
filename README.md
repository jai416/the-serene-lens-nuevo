# The Serene Lens

Observación cosmética de tu piel con inteligencia artificial.

## Stack

| Capa | Tecnología |
|------|------------|
| Framework | Next.js 16 (Turbopack) |
| Base de datos | PostgreSQL (Supabase) + Prisma 7 |
| Autenticación | NextAuth v4 (JWT) + Google OAuth |
| AI | Groq (Llama 3.2 11B Vision + qwen3-32b) |
| Pagos | QvaPay (USD) + Transfermóvil (CUP) |
| Bot | Telegram (webhook, RAG, validación pagos) |
| Monitoreo | Sentry + Microsoft Clarity |
| Despliegue | Render |

## Funcionalidades principales

- **Análisis de piel con IA**: Sube selfies y recibe observaciones cosméticas personalizadas con rutinas AM/PM
- **Planes**: Essential (gratis), Premium ($4.99/mes), Pro ($9.99/mes), Pro+ ($14.99/mes), Esteticista ($29.99/mes)
- **Blog + Productos + Guías digitales**: Contenido educativo y tienda integrada
- **Panel Esteticista**: Gestión de pacientes propios, análisis, informes PDF, código de referido
- **Panel Admin**: Dashboard con métricas, usuarios, pagos, blog, productos, guías, Telegram, notificaciones
- **Diario de piel, Desafíos, Comunidad**: Seguimiento de evolución
- **Idioma**: Español e Inglés (detección automática + toggle manual)

## Enlaces

- **App**: https://the-serene-lens-nuevo.onrender.com
- **Admin**: `/admin`
- **Login**: `/login`

## Requisitos

- Node.js 20+
- PostgreSQL (Supabase recomendado)
- API keys: Groq, Gmail SMTP, QvaPay, Telegram Bot, Sentry, Clarity

## Comandos

```bash
npm run dev          # Desarrollo
npm run build        # Build producción
npm test             # Tests (Vitest, 240 tests)
npm run seed         # Seed de base de datos
npm run db:push      # Push schema a DB
```

## Licencia

Uso privado — The Serene Lens
