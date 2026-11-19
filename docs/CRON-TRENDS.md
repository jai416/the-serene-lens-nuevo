# CRON — Trends Collector (AI Growth Engine M1)

Recolector diario de tendencias de skincare. Descubre candidatos de fuentes
**verificadas** (científicas + enciclopédicas oficiales) y los contrasta con
**señales internas** (preguntas reales de usuarios). No inventa momentum: en M1
no se puntúa nada, solo se recolecta evidencia.

## Endpoint

```
GET/POST /api/cron/trends-collect
Authorization: Bearer $CRON_SECRET        (o header x-cron-secret)
```

- Autenticación: `verifyCronSecret()` — **falla cerrado** si `CRON_SECRET` no está
  configurado (mismo patrón que el resto de crons).
- Respuesta: `{ success, data: { created, updated, skipped, failed, withInternalSignal } }`
- Logs: `logger.info("Trends collection finished", …)` en la consola de Render.

## Job en cron-job.org

| Campo | Valor |
|---|---|
| Nombre | `Trends Collect` |
| URL | `https://the-serene-lens-nuevo.onrender.com/api/cron/trends-collect` |
| Method | `GET` |
| Headers | `Authorization: Bearer <CRON_SECRET>` |
| Schedule | `0 6 * * *` (06:00 America/Havana, diario) |
| Reintentos | habilitados (3) — el endpoint es idempotente (upsert por slug) |

⚠️ El job **no está creado todavía**: hazlo tras aplicar la migración de M1
(ver abajo). Ver `docs/CRON-SETUP.md` para el patrón con la API de cron-job.org.

## Fuentes (allowlist anti-SSRF)

`src/lib/trends/sources.ts` tiene un `Set` de hosts permitidos. Cualquier URL
que no apunte exactamente a uno de ellos **no se fetchea jamás** (se rechaza
antes de hacer la petición). Además: sin credenciales en la URL, sin IPs
directas, `redirect: "error"` (una redirección no puede escapar de la
allowlist), timeout de 15s y 1 reintento con backoff de 1s.

| Host | Uso | Coste |
|---|---|---|
| `eutils.ncbi.nlm.nih.gov` | PubMed — papers de los últimos 90 días (evidencia) | gratis, ≤3 req/s sin key |
| `en.wikipedia.org` | explicadores de ingredientes | gratis |
| `ec.europa.eu` (COSING) | ficha oficial INCI de la UE | gratis |

**Fuentes verificadas como NO usadas** (documentado para no reintentar a ciegas):
- Google Trends: la API oficial fue eliminada en 2017 (HTTP 404 verificado).
- Reddit: bloquea el JSON público sin OAuth (verificado con curl).

## Señales internas vs. tendencia de mercado

`collectInternalSignals()` busca términos de los 12 temas curados en los últimos
100 `ContactMessage` y 100 `CommunityPost`. Se guarda en dos campos separados:

- `Trend.origin`: `external` | `internal` | `both`
- `Trend.internalMentions`: nº de coincidencias

**Regla**: `internalMentions` es interés de *nuestra* audiencia, **no** momentum
de mercado. El M2 (scoring) debe puntuar `momentum` con fuentes externas y tratar
la señal interna como `relevanceAudience`, nunca al revés.

## Reglas del recolector

- **Mínimo 2 fuentes verificadas** por tendencia → si no, `skipped` (no se
  fabrica tendencia con una sola fuente).
- **Anti-duplicados**: `Trend.slug` único + `TrendSource @@unique([trendId, url])`
  a nivel de BD. Re-ejecutar el cron actualiza `lastSeenAt`, no duplica.
- **Cortesía**: 400 ms entre temas (PubMed pide ≤3 req/s).
- **Límite por ejecución**: `collectTrends(6)` → 6 temas máximo por día
  (≈18 peticiones externas). No consume Groq (M1 no usa IA).
- **Fallo aislado**: un tema que falla incrementa `failed` y el batch continúa.

## Migración (requiere consentimiento)

`prisma/schema.prisma` añade `Trend` y `TrendSource` (aditivo, no toca nada
existente). **No aplicar a producción sin confirmación explícita del usuario.**

⚠️ **Este proyecto NO usa `prisma migrate`** (no hay carpeta `prisma/migrations`)
y el `DATABASE_URL` local apunta **directamente a la BD de producción** de
Supabase. Por eso **NUNCA ejecutar `prisma migrate dev` aquí**: aplicaría el
cambio en producción sin pasar por revisión.

Procedimiento correcto:

```bash
# 1. Generar el SQL (diff) y REVISARLO — debe ser solo CREATE TABLE/INDEX
npx prisma migrate diff --from-config-datasource --to-schema prisma/schema.prisma --script
#    M1: CREATE TABLE "Trend" + CREATE TABLE "TrendSource" + índices + 1 FK
#    sobre las NUEVAS tablas. Cero ALTER sobre tablas existentes.

# 2. Backup previo (estrategia de rollback real)
pg_dump "$DATABASE_URL" --no-owner --file=backup-$(date +%Y%m%d).sql
#    (Supabase además retiene snapshots/PITR — esto es la red de seguridad local)

# 3. SOLO con consentimiento explícito del usuario: aplicar
npx prisma db execute --file <sql-revisado>

# 4. Verificar: el diff debe quedar VACÍO tras aplicar
npx prisma migrate diff --from-config-datasource --to-schema prisma/schema.prisma --script
```

**Rollback**: la migración es aditiva (2 tablas nuevas, cero cambios en tablas
existentes). Para revertir:

```sql
DROP TABLE "TrendSource";
DROP TABLE "Trend";
```

No afecta a ningún dato existente.

## Tests

`src/lib/__tests__/trends-collector.test.ts` — allowlist SSRF, retry,
dedup por slug, señal interna → `origin=both`, skipping con <2 fuentes, y
continuidad del batch tras un fallo. Fetch y DB mockeados (sin red real).
