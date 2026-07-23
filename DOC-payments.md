# Pagos en The Serene Lens

## Pasarelas
- **PayPal (USD)**: Principal → tarjeta internacional o saldo PayPal
- **Transfermóvil (CUP)**: Solo Cuba → requiere validación manual
- **QvaPay**: ❌ Eliminado completamente del código (Julio 2026)

## Planes y Precios

### Suscripciones (USD)
| Plan | Mensual | Anual |
|------|---------|-------|
| Essential | Gratis | — |
| Premium | $7.99 | $79.99 |
| Pro | $9.99 | $99.99 |
| Pro+ | $14.99 | $199.99 |
| Esteticista | $49.99 | $499.99 |

### Packs de Análisis
| Pack | Precio |
|------|--------|
| Pack 10 análisis | $4.99 |
| Pack 25 análisis | $9.99 |

## Métodos de Pago

### PayPal (USD)
- **Flujo**: CreateOrder → usuario autoriza en PayPal → webhook `CHECKOUT.ORDER.APPROVED` → `capturePayPalOrder()` → plan activado
- **API**: REST API directa via `src/lib/paypal.ts` (sin SDK npm). Funciones: `createPayPalOrder()`, `capturePayPalOrder()`, `verifyPayPalOrder()`
- **Models**: `paypalOrderId` / `paypalSubscriptionId` en Prisma (QvaPay IDs eliminados)
- **Endpoints**: `/api/payments/create`, `create-pack`, `create-guide`, `webhook`, `verify`, `verify-guide`
- **Sandbox**: `.env.local` con `PAYPAL_API_URL=https://api-m.sandbox.paypal.com`
- **Producción**: `PAYPAL_API_URL=https://api-m.paypal.com` (default en `env.ts`)
- **CSRF protegido**: Todos los endpoints de pago tienen CSRF vía `validateCsrf()`

### Transfermóvil (CUP)
- Solo para suscripciones en CUP desde Cuba
- **Proceso**:
  1. Usuario solicita pago → admin genera referencia
  2. Usuario transfiere por Transfermóvil
  3. **Validador** confirma con `/validar REF`
  4. **Admin** activa con `/activar REF`

### Asistente IA (Groq llama-3.3-70b-versatile)
- Disponible vía Telegram `/asistente` para usuarios con plan pago
- Límites diarios: Premium 10, Pro 25, Pro+ 50, Esteticista 100

## Solución de Problemas

### PayPal: usuario pagó pero no recibe el plan
1. Verificar en `/admin/payments` si el webhook llegó
2. Si `PAYPAL_API_URL` no está en Render Dashboard → default es producción
3. Timeout de 25s con 1 reintento automático
4. Contactar a PayPal Support si el webhook no llega

### Transfermóvil: nadie valida
1. `POST /api/cron/keep-alive` mantiene el bot activo
2. `/pendientes` para ver transferencias pendientes
3. Si el bot no responde, revisar logs en `/admin/logs`

### Reembolsos
- Política completa en `/refunds`
- Suscripciones: reembolso completo primeros 7 días
- Packs no usados: reembolso en 7 días
- Guías digitales: no reembolsables
- PayPal: Gestionar desde panel de PayPal
- Transfermóvil: Admin cancela desde `/admin/transfers`

## Notas
- Packs de análisis no expiran (pero pack credits expiran en 30d, se consumen antes que free credits)
- Guías digitales se habilitan inmediatamente después del pago
- Anual = mismo flujo que mensual pero periodo de 365 días
