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

### Decisiones de AI
- **Gemini 2.0 Flash** para asistente Telegram (`/asistente`)
- **Groq** (`llama-3.2-11b-vision-preview`) para análisis de piel con imágenes
- Rate limit de `/asistente` en memoria (`Map<string, {count, date}>`), se reinicia al reiniciar server

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
| `src/lib/groq.ts` | Cliente Groq para visión IA |
| `src/lib/gemini-chat.ts` | Cliente Gemini 2.0 Flash para asistente |
| `src/app/api/cron/weather-alert/route.ts` | Alertas por cambios climáticos |
| `src/app/api/community/` | API completa de comunidad (grupos, posts, comentarios) |
| `src/app/community/page.tsx` | Comunidad segmentada por tipo de piel |
| `src/app/dashboard/products/page.tsx` | Productos guardados con detección de conflictos |
| `src/components/badge-display.tsx` | Visualización de insignias |
| `src/components/save-product-button.tsx` | Botón guardar producto |
| `prisma/seed-community.ts` | Seed de grupos e insignias |

## Próximas tareas pendientes
- Traducir pages restantes: subscription, report, diary, challenges, referrals, social, clinic-settings, b2b, error.tsx, esthetician/marketing
- Arreglar CSP duplicado (middleware.ts dead code)
- Verificar build en Render
