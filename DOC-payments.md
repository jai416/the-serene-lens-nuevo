# Pagos en The Serene Lens

## Pasarelas
- **Transfermóvil (CUP)** — método real para clientes en Cuba. Validación manual (ver flujo abajo)
- **PayPal (USD)** — para clientes fuera de Cuba. Automático vía webhook
- **QvaPay** — los campos legacy (`qvapayId`, `remoteId`, `qvapayInvoiceId`) se conservan en el schema
  y en la base de datos para no perder registros. **PayPal no funciona en Cuba**, por eso Transfermóvil
  es el canal principal y QvaPay no se borró.

## Planes y Precios

### Suscripciones (USD)
| Plan | Mensual | Anual | Análisis |
|------|---------|-------|----------|
| Essential | Gratis | — | 3 al mes |
| Premium | $7.99 | $79.99 | Ilimitados |
| Pro | $9.99 | $99.99 | Ilimitados |
| Pro+ | $14.99 | $199.99 | Ilimitados |
| Esteticista | $49.99 | $499.99 | Ilimitados + 200 clientes |

> Todos los usuarios **registrados** reciben además una **prueba de Premium de 7 días**
> (`trialEndsAt` se fija en el registro y en el login con OAuth).

### Packs de Análisis
| Pack | Análisis | Precio |
|------|----------|--------|
| Basic | 3 | $1.99 |
| Popular | 5 | $4.99 |
| Pack 10 | 10 | $4.99 |
| Avanzado | 15 | $6.99 |
| Pack 25 | 25 | $9.99 |

Los créditos de pack **caducan a los 30 días** y se consumen antes que los del plan.

## Métodos de Pago

### PayPal (USD)
- **Flujo**: CreateOrder → usuario autoriza en PayPal → webhook `CHECKOUT.ORDER.APPROVED` → `capturePayPalOrder()` → plan activado
- **API**: REST API directa via `src/lib/paypal.ts` (sin SDK npm). Funciones: `createPayPalOrder()`, `capturePayPalOrder()`, `verifyPayPalOrder()`
- **Models**: `paypalOrderId` (Payment) / `paypalSubscriptionId` (Subscription) / `paypalOrderId` (DigitalProductPurchase)
- **Endpoints**: `/api/payments/create`, `create-pack`, `create-guide`, `webhook`, `verify`, `verify-guide`
- **CSRF protegido**: todos los endpoints de cobro validan `validateCsrf()` (el webhook no, lo llama PayPal)
- **Entorno**: `PAYPAL_API_URL` — `https://api-m.sandbox.paypal.com` (sandbox) o `https://api-m.paypal.com` (producción, default en `env.ts`)
- **Variables en Render**: `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`, `PAYPAL_API_URL`

### Transfermóvil (CUP)
- Solo para suscripciones en CUP desde Cuba
- **Proceso**:
  1. Usuario solicita pago → admin genera referencia
  2. Usuario transfiere por Transfermóvil
  3. **Validador** confirma con `/validar REF` (o desde `/admin/transfers`)
  4. **Admin** activa con `/activar REF` → crea la suscripción y el pago

### Gift (regalo)
- El usuario compra un pack de regalo (`/api/payments/gift`) y lo redimee con un código (`/api/payments/redeem-gift`)

## IA y pagos
- **Asistente IA** (Telegram `/asistente`): Groq `openai/gpt-oss-120b`
- Límites diarios: Premium 10, Pro 25, Pro+ 50, Esteticista 100

## Solución de Problemas

### PayPal: usuario pagó pero no recibe el plan
1. Verificar en `/admin/payments` si el webhook llegó
2. Si `PAYPAL_API_URL` no está en Render Dashboard → el default es producción
3. Timeout de 25s con 1 reintento automático
4. Contactar a PayPal Support si el webhook no llega

### Transfermóvil: nadie valida
1. `POST /api/cron/keep-alive` mantiene el bot activo
2. `/pendientes` para ver transferencias pendientes, o `/admin/transfers`
3. Si el bot no responde, revisar logs en `/admin/logs`

### La app da error 500 en pagos (admin/payments o admin/analytics)
Sintoma: `The column "Payment.paypalOrderId" does not exist in the current database`.
Causa: el schema de Prisma se actualizó en código pero no en la base de datos.
Solución: `npx prisma db push` (revisar antes el diff con `prisma migrate diff`).

### Reembolsos
- Política completa en `/refunds`
- Suscripciones: reembolso completo primeros 7 días
- Packs no usados: reembolso en 7 días
- Guías digitales: no reembolsables
- PayPal: gestionar desde el panel de PayPal
- Transfermóvil: el admin cancela desde `/admin/transfers`

## Notas
- Anual = mismo flujo que mensual, periodo de 365 días
- El plan se compara por su **plan base** (sin `_ANNUAL`): un `ESTHETICIAN_ANNUAL` tiene los mismos
  accesos que `ESTHETICIAN` (ver `basePlan()` en `src/lib/pricing.ts`)
