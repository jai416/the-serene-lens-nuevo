"use client"

import { useSession } from "next-auth/react"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, ArrowRight, CreditCard } from "lucide-react"

export default function PricingSuccessPage() {
  const { data: session } = useSession()

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-16">
      <Card className="max-w-md w-full p-8 text-center">
        <CardContent className="p-0 space-y-6">
          <div className="w-16 h-16 rounded-full bg-[#C2E09D]/20 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8 text-[#C2E09D]" />
          </div>

          <div>
            <Badge variant="primary" className="mb-4 rounded-full px-4 py-1.5 border-0">
              <CreditCard className="w-3.5 h-3.5 mr-2" />
              Pago Exitoso
            </Badge>
            <h1 className="font-serif text-2xl font-semibold text-[#2F3A2D] dark:text-[#E8EDE6] mb-2">
              ¡Gracias por tu compra!
            </h1>
            <p className="text-sm text-[#64705E] dark:text-[#9BAA93]">
              Tu plan ha sido activado. Ya puedes disfrutar de todas las funciones de tu suscripción.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <Link href="/dashboard">
              <Button variant="primary" className="w-full">
                Ir al Dashboard
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
            <Link href="/analysis">
              <Button variant="secondary" className="w-full">
                Comenzar un análisis
              </Button>
            </Link>
          </div>

          {session && (
            <p className="text-xs text-[#8A9A82] dark:text-[#7A8A72]">
              Sesión activa como {session.user.email}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
