import { ArrowLeft, Shield, RefreshCw, Calendar, MessageCircle, Scale } from "lucide-react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"

export default function RefundsPage() {
  return (
    <div className="min-h-screen px-4 py-12" style={{ backgroundColor: "#F8F9FA" }}>
      <div className="max-w-3xl mx-auto">
        <Link href="/" className="inline-flex items-center gap-1.5 text-sm mb-6" style={{ color: "#666666" }}>
          <ArrowLeft className="w-4 h-4" /> Volver al inicio
        </Link>

        <Badge variant="mint" className="mb-4 rounded-full px-4 py-1.5 border-0">
          <Scale className="w-3.5 h-3.5 mr-2" />
          Política de Reembolsos
        </Badge>

        <h1 className="font-serif text-3xl sm:text-4xl font-semibold mb-3" style={{ color: "#1A1A1A" }}>
          Política de <span style={{ color: "#88B078" }}>Reembolsos</span>
        </h1>
        <p className="mb-8" style={{ color: "#666666" }}>Última actualización: Julio 2026</p>

        <Card className="mb-6" style={{ backgroundColor: "white", borderColor: "#E8E8E8" }}>
          <CardContent className="p-6 sm:p-8 space-y-6 text-sm leading-relaxed" style={{ color: "#1A1A1A" }}>
            <section>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: "#E2ECE0" }}>
                  <Shield className="w-5 h-5" style={{ color: "#88B078" }} />
                </div>
                <h2 className="font-serif text-lg font-semibold">Nuestro compromiso</h2>
              </div>
              <p style={{ color: "#666666" }}>
                En The Serene Lens queremos que estés completamente satisfecho con tu experiencia. 
                Sabemos que a veces las cosas no salen como esperabas, por eso tenemos una política 
                de reembolsos clara y justa.
              </p>
            </section>

            <section>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: "#E2ECE0" }}>
                  <RefreshCw className="w-5 h-5" style={{ color: "#88B078" }} />
                </div>
                <h2 className="font-serif text-lg font-semibold">¿Cuándo puedes solicitar un reembolso?</h2>
              </div>
              <ul className="space-y-2 pl-4" style={{ color: "#666666" }}>
                <li><strong className="text-[#1A1A1A]">Suscripciones mensuales/anuales:</strong> Reembolso completo dentro de los primeros 7 días desde la compra. Después de 7 días, no se realizan reembolsos por período parcial.</li>
                <li><strong className="text-[#1A1A1A]">Paquetes de análisis:</strong> No se realizan reembolsos una vez que al menos 1 análisis del paquete ha sido utilizado. Si no se ha usado ningún análisis, puedes solicitar reembolso dentro de los 7 días.</li>
                <li><strong className="text-[#1A1A1A]">Guías digitales:</strong> Por su naturaleza descargable, no se realizan reembolsos una vez descargadas.</li>
                <li><strong className="text-[#1A1A1A]">Error técnico comprobado:</strong> Si el servicio no funcionó por un error nuestro (fallo en la IA, imposibilidad de realizar análisis), evaluaremos tu caso y te ofreceremos una solución.</li>
              </ul>
            </section>

            <section>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: "#E2ECE0" }}>
                  <Calendar className="w-5 h-5" style={{ color: "#88B078" }} />
                </div>
                <h2 className="font-serif text-lg font-semibold">Plazos para solicitar</h2>
              </div>
              <p style={{ color: "#666666" }}>
                Debes solicitar el reembolso dentro de los plazos indicados para cada caso. 
                Las solicitudes fuera de plazo serán evaluadas discrecionalmente.
              </p>
            </section>

            <section>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: "#E2ECE0" }}>
                  <MessageCircle className="w-5 h-5" style={{ color: "#88B078" }} />
                </div>
                <h2 className="font-serif text-lg font-semibold">Alternativas al reembolso</h2>
              </div>
              <p className="mb-2" style={{ color: "#666666" }}>
                Antes de solicitar un reembolso en efectivo, considera estas alternativas que 
                suelen resolver la situación más rápido:
              </p>
              <ul className="space-y-2 pl-4" style={{ color: "#666666" }}>
                <li><strong className="text-[#1A1A1A]">Extensión de suscripción:</strong> Podemos añadir días o meses gratis a tu plan actual.</li>
                <li><strong className="text-[#1A1A1A]">Crédito en la cuenta:</strong> Recibe un crédito para usar en futuros análisis, paquetes o suscripciones.</li>
                <li><strong className="text-[#1A1A1A]">Upgrade sin costo:</strong> En algunos casos, podemos mejorar tu plan por un período sin cargo adicional.</li>
              </ul>
            </section>

            <section>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: "#E2ECE0" }}>
                  <Scale className="w-5 h-5" style={{ color: "#88B078" }} />
                </div>
                <h2 className="font-serif text-lg font-semibold">Decisión final</h2>
              </div>
              <p style={{ color: "#666666" }}>
                Cada solicitud de reembolso es evaluada individualmente. Nos reservamos el derecho 
                de aceptar o rechazar cualquier solicitud según nuestro criterio, especialmente en 
                casos de uso abusivo o solicitudes reiteradas. Siempre priorizamos la satisfacción 
                del cliente y buscaremos una solución justa para ambas partes.
              </p>
            </section>

            <section>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: "#E2ECE0" }}>
                  <MessageCircle className="w-5 h-5" style={{ color: "#88B078" }} />
                </div>
                <h2 className="font-serif text-lg font-semibold">¿Cómo solicitar un reembolso?</h2>
              </div>
              <p style={{ color: "#666666" }}>
                Para solicitar un reembolso, escríbenos a través de nuestro formulario de contacto 
                en la web o directamente por Telegram con el comando /contacto. Incluye tu email 
                registrado, el comprobante de pago y el motivo de la solicitud. Te responderemos 
                en un máximo de 48 horas.
              </p>
            </section>
          </CardContent>
        </Card>

        <div className="text-center mt-8">
          <Link href="/pricing" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all"
            style={{ backgroundColor: "#88B078", color: "#1A1A1A" }}>
            Ver planes y precios
          </Link>
        </div>
      </div>
    </div>
  )
}
