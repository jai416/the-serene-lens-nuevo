"use client"

import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { XCircle, ArrowRight, RefreshCw } from "lucide-react"

export default function PricingCancelPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-16">
      <Card className="max-w-md w-full p-8 text-center">
        <CardContent className="p-0 space-y-6">
          <div className="w-16 h-16 rounded-full bg-[#F0F5EC] dark:bg-[#2E3829] flex items-center justify-center mx-auto">
            <XCircle className="w-8 h-8 text-[#A89888] dark:text-[#7A8A72]" />
          </div>

          <div>
            <Badge variant="secondary" className="mb-4 rounded-full px-4 py-1.5 border-0">
              <RefreshCw className="w-3.5 h-3.5 mr-2" />
              Pago Cancelado
            </Badge>
            <h1 className="font-serif text-2xl font-semibold text-[#3D3229] dark:text-[#E8DED5] mb-2">
              Pago cancelado
            </h1>
            <p className="text-sm text-[#8A7A6A] dark:text-[#A89888]">
              No se ha procesado ningún cargo. Puedes intentar de nuevo cuando quieras.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <Link href="/pricing">
              <Button variant="primary" className="w-full">
                Ver planes
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button variant="secondary" className="w-full">
                Volver al dashboard
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
