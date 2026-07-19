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
- Cada item tiene un contenedor tipo card con icono en fondo verde claro, texto centrado
- Se añadieron métricas: nuevos esta semana, análisis del mes, pagos completados, guías vendidas, suscripciones activas

### Traducciones (Locale)
- El sistema existía pero solo cubría ~40% de las páginas del dashboard
- **Añadidas** +90 nuevas claves de traducción para history, subscription, report, diary, support, guides, challenges, referrals, social, clinic-settings, b2b, footer, sidebar
- **Traducidas**: footer, sidebar, history, support, guides completamente

### Documentación
- **DOC-admin.md**: Limpiado — solo contiene "cómo usar el panel admin" (quitaron secciones de cron, rate limiting, lead magnet, gift packs, reminders)
- **DOC-validator.md**: Limpiado — solo comandos y responsabilidades
- **DOC-payments.md**: Creado — describe QvaPay, Transfermóvil, solución de problemas
- **AGENTS.md**: Eliminado el antiguo (461 líneas) — reemplazado con este resumen conciso
- **README.md**: Creado como documentación oficial de la app

## Próximas tareas pendientes
- Traducir pages restantes: subscription, report, diary, challenges, referrals, social, clinic-settings, b2b, error.tsx, esthetician/marketing
- Arreglar CSP duplicado (middleware.ts dead code)
- Verificar build en Render
