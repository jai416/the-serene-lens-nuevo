"use client"

import { useSession } from "next-auth/react"
import { redirect, usePathname } from "next/navigation"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Gift, Share2, FileText, Download, Copy, Check,
  Mail, Image, ArrowLeft, Loader2, CheckCircle2,
} from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"

interface MarketingData {
  clinic: { name: string; logo: string | null; referralCode: string; referredUsers: number }
  discountCode: { code: string; discount: number } | null
}

export default function MarketingKitPage() {
  const pathname = usePathname()
  const { data: session, status } = useSession()
  const user = session?.user as any
  const [data, setData] = useState<MarketingData | null>(null)
  const [loading, setLoading] = useState(true)
  const [discountLoading, setDiscountLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!session) return
    fetch("/api/esthetician/marketing")
      .then((r) => r.json())
      .then((d) => {
        const body = d?.data || d
        setData(body)
      })
      .catch(() => toast.error("Error al cargar kit de marketing"))
      .finally(() => setLoading(false))
  }, [session])

  const generateDiscount = async () => {
    setDiscountLoading(true)
    try {
      const res = await fetch("/api/esthetician/marketing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      })
      const d = await res.json()
      const body = d?.data || d
      if (!res.ok) throw new Error(body?.error || "Error")
      setData((prev) => prev ? { ...prev, discountCode: body.discountCode } : prev)
      toast.success("Código de descuento generado")
    } catch {
      toast.error("Error al generar código")
    } finally {
      setDiscountLoading(false)
    }
  }

  const copyCode = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      toast.success("¡Copiado!")
      setTimeout(() => setCopied(false), 2000)
    })
  }

  if (status === "loading") return <div className="p-8 text-center text-[#666666]">Cargando...</div>
  if (!session) redirect("/login?callbackUrl=" + encodeURIComponent(pathname))
  if (user?.plan !== "ESTHETICIAN") redirect("/dashboard/profile")

  if (loading) {
    return <div className="text-center py-12"><Loader2 className="w-8 h-8 animate-spin mx-auto text-[#88B078]" /></div>
  }

  if (!data?.clinic) {
    return (
      <div className="text-center py-12">
        <p className="text-[#666666] mb-4">Crea tu perfil de clínica primero</p>
        <Link href="/dashboard/clinic-settings">
          <Button variant="primary">Ir a Configuración</Button>
        </Link>
      </div>
    )
  }

  const { clinic, discountCode } = data
  const referralUrl = `${window.location.origin}/register?ref=${clinic.referralCode}`
  const emailSubject = encodeURIComponent("Te invito a descubrir tu piel con IA")
  const emailBody = encodeURIComponent(
    `¡Hola!\n\nEstoy usando The Serene Lens con mis clientes. Es una herramienta de análisis de piel con IA que me ayuda a dar seguimiento profesional a tu progreso.\n\nUsa mi código ${clinic.referralCode} al registrarte y obtén un descuento especial.\n\nRegístrate aquí: ${window.location.origin}/register`
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Link href="/dashboard/esthetician" className="text-xs text-[#666666] hover:text-[#1A1A1A] inline-flex items-center gap-1 mb-2">
            <ArrowLeft className="w-3 h-3" /> Volver al panel
          </Link>
          <h1 className="font-serif text-2xl font-semibold text-[#1A1A1A]">Kit de Marketing</h1>
          <p className="text-sm text-[#666666] mt-0.5">Recursos para hacer crecer tu práctica</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <Card className="p-4 border border-[#E8E8E8]/60">
          <CardContent className="p-0">
            <p className="text-xs text-[#666666] mb-1">Clientes Referidos</p>
            <p className="text-2xl font-bold text-[#1A1A1A]">{clinic.referredUsers}</p>
          </CardContent>
        </Card>
        <Card className="p-4 border border-[#E8E8E8]/60">
          <CardContent className="p-0">
            <p className="text-xs text-[#666666] mb-1">Código de Referido</p>
            <div className="flex items-center gap-2">
              <code className="text-lg font-bold text-[#88B078]">{clinic.referralCode}</code>
              <button onClick={() => copyCode(clinic.referralCode)} className="p-1.5 rounded-lg hover:bg-[#E2ECE0] transition-colors"
                aria-label="Copiar código de referido"
              >
                {copied ? <Check className="w-4 h-4 text-[#88B078]" /> : <Copy className="w-4 h-4 text-[#666666]" />}
              </button>
            </div>
          </CardContent>
        </Card>
        <Card className="p-4 border border-[#E8E8E8]/60">
          <CardContent className="p-0">
            <p className="text-xs text-[#666666] mb-1">Código de Descuento</p>
            {discountCode ? (
              <div className="flex items-center gap-2">
                <code className="text-lg font-bold text-[#D4A843]">{discountCode.code}</code>
                <Badge variant="mint" className="text-[10px]">{discountCode.discount}%</Badge>
                <button onClick={() => copyCode(discountCode.code)} className="p-1.5 rounded-lg hover:bg-[#FFF9E6] transition-colors"
                  aria-label="Copiar código de descuento"
                >
                  <Copy className="w-4 h-4 text-[#666666]" />
                </button>
              </div>
            ) : (
              <Button variant="primary" size="sm" onClick={generateDiscount} disabled={discountLoading}>
                {discountLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : <Gift className="w-3.5 h-3.5 mr-1.5" />}
                Generar
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Share Referral */}
      <Card className="p-5 border border-[#E8E8E8]/60">
        <CardContent className="p-0">
          <h2 className="font-semibold text-sm text-[#1A1A1A] mb-3 flex items-center gap-2">
            <Share2 className="w-4 h-4 text-[#D4A843]" />
            Comparte tu código
          </h2>
          <p className="text-xs text-[#666666] mb-4">
            Entrega este código a tus clientes para que lo usen al registrarse y obtengan un descuento.
            Tú verás cuántos clientes se registran con tu código.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button variant="primary" size="sm" onClick={() => copyCode(clinic.referralCode)}>
              {copied ? <Check className="w-3.5 h-3.5 mr-1.5" /> : <Copy className="w-3.5 h-3.5 mr-1.5" />}
              {copied ? "Copiado" : "Copiar código"}
            </Button>
            <Button variant="secondary" size="sm" onClick={() => {
              const text = `Únete a The Serene Lens con mi código ${clinic.referralCode} y obtén un descuento especial. Regístrate aquí: ${window.location.origin}/register`
              if (navigator.share) navigator.share({ title: "The Serene Lens", text })
              else copyCode(text)
            }}>
              <Share2 className="w-3.5 h-3.5 mr-1.5" />
              Compartir
            </Button>
            <a href={`mailto:?subject=${emailSubject}&body=${emailBody.replace(/{code}/g, clinic.referralCode)}`}
              className="inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-xl border border-[#E8E8E8] text-[#666666] hover:bg-[#E2ECE0] transition-colors gap-1.5">
              <Mail className="w-3.5 h-3.5" />
              Email
            </a>
          </div>
        </CardContent>
      </Card>

      {/* Resources */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Flyer */}
        <Card className="p-5 border border-[#E8E8E8]/60">
          <CardContent className="p-0">
            <div className="w-12 h-12 rounded-xl bg-[#FFF9E6] flex items-center justify-center mb-3">
              <Image className="w-6 h-6 text-[#D4A843]" />
            </div>
            <h2 className="font-semibold text-sm text-[#1A1A1A] mb-1">Flyer Digital</h2>
            <p className="text-xs text-[#666666] mb-4">Imagen promocional para compartir en WhatsApp o redes sociales</p>
            <div className="bg-[#F8F9FA] rounded-xl p-4 border border-[#E8E8E8]/60 mb-4">
              <div className="bg-white rounded-lg p-4 text-center border border-[#E8E8E8]">
                <div className="w-12 h-12 rounded-xl bg-[#88B078] flex items-center justify-center mx-auto mb-2">
                  <span className="text-white font-bold text-lg">SL</span>
                </div>
                <p className="font-serif text-sm font-semibold text-[#1A1A1A]">The Serene Lens</p>
                <p className="text-xs text-[#666666] mb-2">Análisis de piel con IA</p>
                <div className="bg-[#E2ECE0] rounded-lg px-3 py-2 inline-block">
                  <code className="text-sm font-bold text-[#88B078]">{clinic.referralCode}</code>
                </div>
                <p className="text-[10px] text-[#999999] mt-2">Usa este código al registrarte</p>
              </div>
            </div>
            <Button variant="secondary" size="sm" onClick={() => copyCode(clinic.referralCode)} className="w-full">
              <Download className="w-3.5 h-3.5 mr-1.5" />
              Descargar Flyer (copia el código)
            </Button>
          </CardContent>
        </Card>

        {/* Email Template */}
        <Card className="p-5 border border-[#E8E8E8]/60">
          <CardContent className="p-0">
            <div className="w-12 h-12 rounded-xl bg-[#FFF9E6] flex items-center justify-center mb-3">
              <Mail className="w-6 h-6 text-[#D4A843]" />
            </div>
            <h2 className="font-semibold text-sm text-[#1A1A1A] mb-1">Plantilla de Email</h2>
            <p className="text-xs text-[#666666] mb-4">Texto listo para enviar a tus clientes</p>
            <div className="bg-[#F8F9FA] rounded-xl p-4 border border-[#E8E8E8]/60 mb-4">
              <p className="text-xs font-medium text-[#1A1A1A] mb-1">Asunto:</p>
              <p className="text-xs text-[#666666] mb-3 italic">Te invito a descubrir tu piel con IA</p>
              <p className="text-xs font-medium text-[#1A1A1A] mb-1">Cuerpo:</p>
              <p className="text-xs text-[#666666] leading-relaxed">
                ¡Hola! Estoy usando The Serene Lens con mis clientes. Es una herramienta de análisis de piel con IA
                que me ayuda a dar seguimiento profesional a tu progreso.
                <br /><br />
                Usa mi código <strong className="text-[#88B078]">{clinic.referralCode}</strong> al registrarte
                {discountCode ? ` y obtén un ${discountCode.discount}% de descuento` : ""}.
                <br /><br />
                Regístrate aquí: {typeof window !== "undefined" ? window.location.origin + "/register" : ""}
              </p>
            </div>
            <a href={`mailto:?subject=${emailSubject}&body=${encodeURIComponent(
              `¡Hola!\n\nEstoy usando The Serene Lens con mis clientes. Es una herramienta de análisis de piel con IA que me ayuda a dar seguimiento profesional a tu progreso.\n\nUsa mi código ${clinic.referralCode} al registrarte${discountCode ? ` y obtén un ${discountCode.discount}% de descuento` : ""}.\n\nRegístrate aquí: ${typeof window !== "undefined" ? window.location.origin : ""}/register`
            )}`}
              className="inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-xl bg-[#88B078] text-white hover:bg-[#7A9D68] transition-colors gap-1.5">
              <Mail className="w-3.5 h-3.5" />
              Abrir en Email
            </a>
          </CardContent>
        </Card>
      </div>

      {/* Discount Code */}
      {discountCode && (
        <Card className="p-5 border border-[#E8E8E8]/60 bg-[#FFF9E6]">
          <CardContent className="p-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#FCEAA6] flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-[#D4A843]" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-[#1A1A1A]">Código de Descuento Activo</p>
                <p className="text-xs text-[#666666]">
                  Tus clientes obtienen {discountCode.discount}% de descuento al usar el código <strong>{discountCode.code}</strong>
                </p>
              </div>
              <Button variant="primary" size="sm" onClick={() => copyCode(discountCode.code)}>
                {copied ? <Check className="w-3.5 h-3.5 mr-1.5" /> : <Copy className="w-3.5 h-3.5 mr-1.5" />}
                {copied ? "Copiado" : "Copiar"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
