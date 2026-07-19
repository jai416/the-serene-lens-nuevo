# Pagos en The Serene Lens

## Métodos de Pago

### QvaPay (USD — Tarjeta Internacional)
- **Usa**: Cualquier tarjeta internacional (Visa, Mastercard, etc.)
- **Sirve para**: Suscripciones Premium ($4.99/mes), Pro ($9.99/mes), Pro+ ($14.99/mes), Esteticista ($29.99/mes), anuales, paquetes de análisis y guías digitales
- **Proceso**: El usuario es redirigido a QvaPay → paga → webhook confirma → plan activado automáticamente
- **Estado**: Automático, no requiere intervención humana

### Transfermóvil (CUP — Cuba)
- **Usa**: Solo para suscripciones en CUP desde Cuba
- **Proceso**:
  1. Usuario solicita pago → admin genera referencia
  2. Usuario transfiere por Transfermóvil
  3. **Validador** confirma que la transferencia se realizó (`/validar REF`)
  4. **Admin** activa la suscripción (`/activar REF`)

## Solución de Problemas

### El usuario pagó por QvaPay pero no recibe el plan
1. Verificar en `/admin/payments` si el webhook llegó
2. Si el pago aparece "completed" pero el plan no cambió, ejecutar `/activar REF` manual
3. Si el pago no aparece, contactar a soporte de QvaPay

### El usuario pagó por Transfermóvil y nadie valida
1. Revisar `POST /api/cron/keep-alive` mantiene el bot activo
2. El validador debe usar `/pendientes` para ver transferencias pendientes
3. Si el bot no responde, revisar logs en `/admin/logs`

### Error 502 en QvaPay
- Timeout de 25s con 1 reintento automático
- Si persiste, es un bloqueo de red entre Render y Cloudflare (QvaPay)
- Contactar a soporte de QvaPay o probar desde otra IP

### Reembolsos
- QvaPay: Gestionar directamente desde el panel de QvaPay
- Transfermóvil: El admin puede cancelar desde `/admin/transfers`

## Notas
- Los pagos anuales (Premium $49.99/año, Pro $99.99/año) se manejan igual que los mensuales pero con periodo de 365 días
- Los paquetes de análisis (Gift Packs) no expiran
- Las guías digitales se habilitan inmediatamente después del pago
