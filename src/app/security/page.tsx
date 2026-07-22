import { Card, CardContent } from "@/components/ui/card"
import { Shield, Lock, Key, Server, CreditCard, MessageCircle, Database, Eye, FileText, Mail } from "lucide-react"

const sections = [
  {
    id: "alcance",
    title: "1. Alcance",
    icon: Shield,
    content: (
      <p>Esta política aplica a toda la infraestructura de The Serene Lens: aplicación web, bot de Telegram, base de datos PostgreSQL, APIs internas y externas, y datos de usuarios.</p>
    ),
  },
  {
    id: "autenticacion",
    title: "2. Autenticación y Autorización",
    icon: Lock,
    content: (
      <>
        <h3 className="font-medium text-[#1A1A1A] mt-3 mb-1">Contraseñas</h3>
        <ul className="list-disc pl-4 space-y-1">
          <li>Almacenadas con algoritmo scrypt (salt de 16 bytes, clave de 64 bytes)</li>
          <li>Hash nativo (Node.js crypto) sin dependencias externas</li>
          <li>Mínimo 6 caracteres, sin límite máximo</li>
          <li>Se recomienda el uso de contraseñas únicas para cada servicio</li>
        </ul>
        <h3 className="font-medium text-[#1A1A1A] mt-3 mb-1">Sesiones</h3>
        <ul className="list-disc pl-4 space-y-1">
          <li>JWT firmado con NEXTAUTH_SECRET (mínimo 32 caracteres aleatorios)</li>
          <li>Cookie httpOnly y secure en producción</li>
          <li>SameSite=Lax para prevenir CSRF</li>
          <li>Sesión refrescada desde base de datos en cada petición</li>
        </ul>
        <h3 className="font-medium text-[#1A1A1A] mt-3 mb-1">Protección contra fuerza bruta</h3>
        <ul className="list-disc pl-4 space-y-1">
          <li>Límite de 5 intentos fallidos por email en ventana de 15 minutos</li>
          <li>Límite de 10 intentos por IP en ventana de 1 minuto</li>
          <li>El contador se reinicia al iniciar sesión exitosamente</li>
        </ul>
        <h3 className="font-medium text-[#1A1A1A] mt-3 mb-1">Roles</h3>
        <ul className="list-disc pl-4 space-y-1">
          <li><strong>USER</strong> — acceso estándar a la plataforma</li>
          <li><strong>VALIDATOR</strong> — puede verificar pagos Transfermóvil</li>
          <li><strong>ADMIN</strong> — acceso total al panel administrativo</li>
          <li><strong>ESTHETICIAN</strong> — acceso a herramientas profesionales</li>
        </ul>
      </>
    ),
  },
  {
    id: "csp",
    title: "3. Content Security Policy (CSP)",
    icon: FileText,
    content: (
      <div className="bg-[#F8F9FA] rounded-xl p-4 font-mono text-xs space-y-1">
        <p>default-src &apos;self&apos;</p>
        <p>script-src &apos;self&apos; &apos;unsafe-inline&apos; &apos;unsafe-eval&apos; https://us-assets.i.posthog.com</p>
        <p>style-src &apos;self&apos; &apos;unsafe-inline&apos;</p>
        <p>img-src &apos;self&apos; data: blob: https://*.supabase.co https://avatars.githubusercontent.com https://lh3.googleusercontent.com</p>
        <p>font-src &apos;self&apos; data:</p>
        <p>connect-src &apos;self&apos; https://api-m.paypal.com https://*.supabase.co https://api.groq.com https://app.posthog.com https://api.telegram.org</p>
        <p>frame-src &apos;self&apos;</p>
        <p>frame-ancestors &apos;none&apos;</p>
        <p>object-src &apos;none&apos;</p>
        <p>base-uri &apos;self&apos;</p>
        <p>form-action &apos;self&apos;</p>
      </div>
    ),
  },
  {
    id: "api",
    title: "4. Seguridad en API",
    icon: Key,
    content: (
      <>
        <h3 className="font-medium text-[#1A1A1A] mt-3 mb-1">Rate Limiting</h3>
        <ul className="list-disc pl-4 space-y-1">
          <li><strong>/api/register</strong> — 10 solicitudes/día/IP</li>
          <li><strong>/api/contact</strong> — 5 solicitudes/hora/IP</li>
          <li><strong>/api/auth/forgot-password</strong> — 5 solicitudes/hora</li>
          <li><strong>/api/auth/reset-password</strong> — 10 solicitudes/hora</li>
          <li><strong>/api/payments/webhook</strong> — 30 solicitudes/minuto</li>
          <li><strong>/api/admin/*</strong> — 30 solicitudes/minuto</li>
          <li><strong>/api/lead-magnet</strong> — 3 solicitudes/hora/IP</li>
          <li><strong>Bot /consultar</strong> — 10 consultas/minuto</li>
          <li><strong>Bot general</strong> — 4 segundos entre comandos</li>
        </ul>
        <h3 className="font-medium text-[#1A1A1A] mt-3 mb-1">CSRF</h3>
        <ul className="list-disc pl-4 space-y-1">
          <li>Todas las rutas POST/PATCH/DELETE protegidas con token CSRF</li>
          <li>Excepciones: /api/auth/*, /api/register, /api/telegram/webhook, /api/cron/*, /api/chat, /api/contact, /api/lead-magnet</li>
          <li>Cookie CSRF con httpOnly: false para acceso JavaScript</li>
        </ul>
        <h3 className="font-medium text-[#1A1A1A] mt-3 mb-1">Validación de entrada</h3>
        <ul className="list-disc pl-4 space-y-1">
          <li>Zod para validación de esquemas en todas las rutas</li>
          <li>Sanitización HTML en entradas de usuario (community, contacto)</li>
          <li>Prevención de XSS en templates de email</li>
        </ul>
      </>
    ),
  },
  {
    id: "pagos",
    title: "5. Seguridad en Pagos",
    icon: CreditCard,
    content: (
      <>
        <h3 className="font-medium text-[#1A1A1A] mt-3 mb-1">PayPal (USD)</h3>
        <ul className="list-disc pl-4 space-y-1">
          <li>Webhooks autenticados por IP y token</li>
          <li>Transacciones atómicas con $transaction de Prisma</li>
          <li>Verificación idempotente con WebhookEvent.processedAt</li>
          <li>Rate limiting: 30 solicitudes/minuto</li>
          <li>Timeout de 25s con reintento automático</li>
        </ul>
        <h3 className="font-medium text-[#1A1A1A] mt-3 mb-1">Transfermóvil (CUP)</h3>
        <ul className="list-disc pl-4 space-y-1">
          <li>Doble verificación: validador confirma el pago, administrador activa el acceso</li>
          <li>Transacciones atómicas con bloqueo de concurrencia</li>
          <li>Registro de auditoría en cada acción con IP y User-Agent</li>
          <li>Prevención de activación duplicada con verificación de estado</li>
        </ul>
        <h3 className="font-medium text-[#1A1A1A] mt-3 mb-1">Datos de pago</h3>
        <ul className="list-disc pl-4 space-y-1">
          <li>No almacenamos números de tarjeta de crédito</li>
          <li>Solo conservamos registros de transacción (monto, fecha, plan)</li>
          <li>El procesamiento se realiza a través de pasarelas externas (PayPal)</li>
        </ul>
      </>
    ),
  },
  {
    id: "basedatos",
    title: "6. Seguridad en la Base de Datos",
    icon: Database,
    content: (
      <>
        <h3 className="font-medium text-[#1A1A1A] mt-3 mb-1">Conexión</h3>
        <ul className="list-disc pl-4 space-y-1">
          <li>PostgreSQL en Supabase (AWS us-east-2)</li>
          <li>Conexión SSL/TLS obligatoria</li>
          <li>Pool de conexiones con límite configurado</li>
        </ul>
        <h3 className="font-medium text-[#1A1A1A] mt-3 mb-1">Consultas</h3>
        <ul className="list-disc pl-4 space-y-1">
          <li>Uso de Prisma ORM (previene SQL injection)</li>
          <li>Transacciones atómicas para operaciones críticas de pago</li>
        </ul>
        <h3 className="font-medium text-[#1A1A1A] mt-3 mb-1">Índices</h3>
        <ul className="list-disc pl-4 space-y-1">
          <li>User: email, plan, role, telegramId, trialEndsAt</li>
          <li>Payment: userId, status, createdAt</li>
          <li>Subscription: userId, status, currentPeriodEnd</li>
          <li>SkinAnalysis: userId, createdAt, skinType</li>
          <li>AuditLog: userId, action, createdAt</li>
        </ul>
      </>
    ),
  },
  {
    id: "telegram",
    title: "7. Seguridad en Telegram",
    icon: MessageCircle,
    content: (
      <ul className="list-disc pl-4 space-y-1">
        <li>Webhook protegido con X-Telegram-Bot-Api-Secret-Token</li>
        <li>Roles verificados en cada comando</li>
        <li>Cooldown de 4 segundos entre comandos</li>
        <li>Rate limiting en consultas al RAG (10/minuto)</li>
        <li>Confirmación en dos pasos para acciones críticas (validar/activar)</li>
      </ul>
    ),
  },
  {
    id: "incidentes",
    title: "8. Manejo de Incidentes",
    icon: Eye,
    content: (
      <>
        <p className="mb-2">Reportar incidentes de seguridad a: <strong>theserenelens@gmail.com</strong></p>
        <p className="mb-2">Tiempo de respuesta objetivo: 24 horas</p>
        <h3 className="font-medium text-[#1A1A1A] mt-3 mb-1">Procedimiento</h3>
        <ol className="list-decimal pl-4 space-y-1">
          <li>Identificar y aislar el incidente</li>
          <li>Evaluar el impacto y los datos afectados</li>
          <li>Notificar a los usuarios afectados (si aplica)</li>
          <li>Implementar la corrección</li>
          <li>Documentar y prevenir recurrencia</li>
        </ol>
      </>
    ),
  },
  {
    id: "auditoria",
    title: "9. Auditoría",
    icon: Eye,
    content: (
      <>
        <h3 className="font-medium text-[#1A1A1A] mt-3 mb-1">Eventos registrados</h3>
        <ul className="list-disc pl-4 space-y-1">
          <li>Validaciones de transferencia (validador)</li>
          <li>Activaciones de pago (administrador)</li>
          <li>Cancelaciones de transferencia</li>
          <li>Acciones administrativas en el panel</li>
        </ul>
        <h3 className="font-medium text-[#1A1A1A] mt-3 mb-1">Información registrada</h3>
        <ul className="list-disc pl-4 space-y-1">
          <li>ID del usuario que ejecutó la acción</li>
          <li>Tipo de acción y recurso afectado</li>
          <li>Dirección IP y User-Agent</li>
          <li>Marca de tiempo exacta</li>
          <li>Detalles adicionales de la operación</li>
        </ul>
        <p className="mt-2">Los registros de auditoría se conservan por 1 año.</p>
      </>
    ),
  },
  {
    id: "cumplimiento",
    title: "10. Cumplimiento",
    icon: Server,
    content: (
      <>
        <p className="mb-2">Esta política se revisa trimestralmente.</p>
        <h3 className="font-medium text-[#1A1A1A] mt-3 mb-1">Tiempos de corrección por severidad</h3>
        <ul className="list-disc pl-4 space-y-1">
          <li><strong>CRÍTICA:</strong> 24 horas</li>
          <li><strong>ALTA:</strong> 72 horas</li>
          <li><strong>MEDIA:</strong> 7 días</li>
          <li><strong>BAJA:</strong> 30 días</li>
        </ul>
      </>
    ),
  },
  {
    id: "contacto",
    title: "11. Contacto de Seguridad",
    icon: Mail,
    content: (
      <>
        <p><strong>Email:</strong> theserenelens@gmail.com</p>
        <p className="mt-1"><strong>Tiempo de respuesta esperado:</strong> 24 horas</p>
      </>
    ),
  },
]

export default function SecurityPage() {
  return (
    <div className="min-h-screen px-4 py-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="font-serif text-3xl sm:text-4xl font-semibold mb-6">
          Política de <span className="gradient-text">Seguridad</span>
        </h1>
        <p className="text-sm text-[#666666] mb-8">Última actualización: julio 2026</p>

        {/* TOC */}
        <Card className="mb-8 bg-[#F8F9FA] border-[#E8E8E8]">
          <CardContent className="p-5">
            <h2 className="font-serif text-base font-semibold text-[#1A1A1A] mb-3">Índice</h2>
            <nav className="grid sm:grid-cols-2 gap-1">
              {sections.map((s) => (
                <a key={s.id} href={`#${s.id}`} className="text-sm text-[#666666] hover:text-[#88B078] transition-colors">
                  {s.title}
                </a>
              ))}
            </nav>
          </CardContent>
        </Card>

        <div className="space-y-6 text-sm text-[#666666] leading-relaxed">
          {sections.map((s) => (
            <section key={s.id} id={s.id}>
              <div className="flex items-center gap-2 mb-2">
                <s.icon className="w-4 h-4 text-[#88B078]" />
                <h2 className="font-serif text-lg font-semibold text-[#1A1A1A]">{s.title}</h2>
              </div>
              {s.content}
            </section>
          ))}
        </div>

        <div className="p-4 rounded-2xl bg-[#FFF9E6] border border-[#FCEAA6] mt-8">
          <p className="text-sm text-[#1A1A1A]">
            <strong>AVISO IMPORTANTE:</strong> Esta política de seguridad se actualiza periódicamente.
            Si encuentras una vulnerabilidad, repórtala de inmediato a theserenelens@gmail.com.
          </p>
        </div>
      </div>
    </div>
  )
}
