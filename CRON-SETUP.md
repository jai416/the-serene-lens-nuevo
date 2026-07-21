# Configuración de Cron Jobs en cron-job.org

## Requisitos previos

1. Crear cuenta en [cron-job.org](https://cron-job.org)
2. Tener configurada la variable `CRON_SECRET` en Render (Dashboard → Environment)
3. La URL base de Render: `https://the-serene-lens-nuevo.onrender.com`

## Configuración general (para cada cron)

Al crear cada tarea en cron-job.org:

| Campo | Valor |
|---|---|
| **Method** | Ver tabla abajo (GET o POST) |
| **Headers** | `Authorization: Bearer <tu_CRON_SECRET>` |
| **Content Type** | `application/json` (solo si el método es POST) |
| **Timeout** | 30 segundos |

> Reemplaza `<tu_CRON_SECRET>` por el valor real de `CRON_SECRET` de tus variables de entorno en Render.

---

## 1. Keep Alive (crítico — evita que Render duerma)

Previene que Render detenga el servidor por inactividad. **El más importante.**

| Campo | Valor |
|---|---|
| **Title** | Keep Alive |
| **URL** | `https://the-serene-lens-nuevo.onrender.com/api/cron/keep-alive` |
| **Method** | GET |
| **Schedule** | Cada 10 minutos (en "Minutes" escribir `*/10`) |
| **Headers** | `Authorization: Bearer <tu_CRON_SECRET>` |

---

## 2. Cleanup Notificaciones

Elimina notificaciones con más de 48 horas.

| Campo | Valor |
|---|---|
| **Title** | Cleanup Notificaciones |
| **URL** | `https://the-serene-lens-nuevo.onrender.com/api/cron/cleanup-notifications` |
| **Method** | POST |
| **Schedule** | Diario a las 3:00 UTC |
| **Headers** | `Authorization: Bearer <tu_CRON_SECRET>` |

---

## 3. Cleanup Trials

Expira trials vencidos y downgradea usuarios a FREE.

| Campo | Valor |
|---|---|
| **Title** | Cleanup Trials |
| **URL** | `https://the-serene-lens-nuevo.onrender.com/api/cron/cleanup-trials` |
| **Method** | POST |
| **Schedule** | Diario a las 3:05 UTC |
| **Headers** | `Authorization: Bearer <tu_CRON_SECRET>` |

---

## 4. Cleanup Cache

Limpia entradas de caché expiradas.

| Campo | Valor |
|---|---|
| **Title** | Cleanup Cache |
| **URL** | `https://the-serene-lens-nuevo.onrender.com/api/cron/cleanup-cache` |
| **Method** | POST |
| **Schedule** | Diario a las 3:10 UTC |
| **Headers** | `Authorization: Bearer <tu_CRON_SECRET>` |

---

## 5. Cleanup Rate Limit

Limpia registros de rate limit antiguos.

| Campo | Valor |
|---|---|
| **Title** | Cleanup Rate Limit |
| **URL** | `https://the-serene-lens-nuevo.onrender.com/api/cron/cleanup-rate-limit` |
| **Method** | POST |
| **Schedule** | Diario a las 3:15 UTC |
| **Headers** | `Authorization: Bearer <tu_CRON_SECRET>` |

---

## 6. Send Reminders

Envía recordatorios configurados por los usuarios.

| Campo | Valor |
|---|---|
| **Title** | Send Reminders |
| **URL** | `https://the-serene-lens-nuevo.onrender.com/api/cron/send-reminders` |
| **Method** | GET |
| **Schedule** | Diario a las 8:00 UTC |
| **Headers** | `Authorization: Bearer <tu_CRON_SECRET>` |

---

## 7. Weather Alert

Detecta cambios climáticos significativos y notifica a los usuarios.

| Campo | Valor |
|---|---|
| **Title** | Weather Alert |
| **URL** | `https://the-serene-lens-nuevo.onrender.com/api/cron/weather-alert` |
| **Method** | GET |
| **Schedule** | Diario a las 9:00 UTC |
| **Headers** | `Authorization: Bearer <tu_CRON_SECRET>` |

---

## 8. UV Alerts

Alerta a esteticistas cuando el índice UV supera 8.

| Campo | Valor |
|---|---|
| **Title** | UV Alerts |
| **URL** | `https://the-serene-lens-nuevo.onrender.com/api/cron/uv-alerts` |
| **Method** | GET |
| **Schedule** | Diario a las 12:00 UTC |
| **Headers** | `Authorization: Bearer <tu_CRON_SECRET>` |

---

## 9. SEO Generator

Genera 1 artículo SEO automáticamente por día.

| Campo | Valor |
|---|---|
| **Title** | SEO Generator |
| **URL** | `https://the-serene-lens-nuevo.onrender.com/api/cron/generate-seo` |
| **Method** | POST |
| **Schedule** | Diario a las 4:00 UTC |
| **Headers** | `Authorization: Bearer <tu_CRON_SECRET>` |

> También acepta GET en la misma URL.

---

## 10. Retention (semanal)

Re-engancha usuarios inactivos (>30 días) con una notificación.

| Campo | Valor |
|---|---|
| **Title** | Retention |
| **URL** | `https://the-serene-lens-nuevo.onrender.com/api/cron/retention` |
| **Method** | POST |
| **Schedule** | Cada lunes a las 3:20 UTC |
| **Headers** | `Authorization: Bearer <tu_CRON_SECRET>` |

---

## 11. Emails (one-off, opcional)

Marca notificaciones antiguas sin email como enviadas. Solo es necesario ejecutarlo **una vez** (o ignorarlo).

| Campo | Valor |
|---|---|
| **Title** | Emails Migration |
| **URL** | `https://the-serene-lens-nuevo.onrender.com/api/cron/emails` |
| **Method** | POST |
| **Schedule** | Una sola ejecución manual (o diario si prefieres) |
| **Headers** | `Authorization: Bearer <tu_CRON_SECRET>` |

---

## Resumen de frecuencias

| Cron | Frecuencia | Método |
|---|---|---|
| Keep Alive | Cada 10 min | GET |
| Cleanup Notifications | Diario 3:00 | POST |
| Cleanup Trials | Diario 3:05 | POST |
| Cleanup Cache | Diario 3:10 | POST |
| Cleanup Rate Limit | Diario 3:15 | POST |
| Send Reminders | Diario 8:00 | GET |
| Weather Alert | Diario 9:00 | GET |
| UV Alerts | Diario 12:00 | GET |
| SEO Generator | Diario 4:00 | POST |
| Retention | Semanal (lun 3:20) | POST |
| Emails | One-off | POST |

## Notas

- Los horarios escalonados (3:00, 3:05, 3:10, 3:15) evitan picos de carga en la base de datos
- El `CRON_SECRET` debe ser el **mismo** que está configurado en las variables de entorno de Render
- En cron-job.org, los headers se agregan en la pestaña "Advanced" → "Add HTTP Header"
- El Keep Alive es el único verdaderamente crítico: sin él, Render free tier detiene el servidor después de 15 min sin actividad
