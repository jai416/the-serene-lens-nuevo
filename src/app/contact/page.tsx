import { Card, CardContent } from "@/components/ui/card"
import { Mail, MessageSquare, AlertCircle } from "lucide-react"

export default function ContactPage() {
  return (
    <div className="min-h-screen px-4 py-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="font-serif text-3xl sm:text-4xl font-semibold mb-6">
          <span className="gradient-text">Contacto</span>
        </h1>
        <p className="text-sm text-[#666666] mb-8">Estamos aquí para ayudarte.</p>

        <div className="grid sm:grid-cols-2 gap-4 mb-8">
          <Card>
            <CardContent className="p-6">
              <Mail className="w-6 h-6 text-[#1A1A1A] mb-3" />
              <h2 className="font-serif text-lg font-semibold text-[#1A1A1A] mb-1">Email</h2>
              <p className="text-sm text-[#666666]">theserenelens@gmail.com</p>
              <p className="text-xs text-[#666666] mt-1">Respuesta en 24-48 horas.</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <MessageSquare className="w-6 h-6 text-[#1A1A1A] mb-3" />
              <h2 className="font-serif text-lg font-semibold text-[#1A1A1A] mb-1">Telegram</h2>
              <p className="text-sm text-[#666666]">@TheSereneLensBot</p>
              <p className="text-xs text-[#666666] mt-1">Soporte rápido por el bot.</p>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-[#FFF9E6] border-[#FCEAA6]">
          <CardContent className="p-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-[#1A1A1A] flex-shrink-0 mt-0.5" />
              <div>
                <h2 className="font-serif text-base font-semibold text-[#1A1A1A] mb-1">Atención</h2>
                <p className="text-sm text-[#666666]">
                  Este no es un canal de emergencias médicas. Si tienes una urgencia dermatológica, contacta a un profesional de la salud inmediatamente.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
