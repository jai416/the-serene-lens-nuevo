"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function OfflinePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8F9FA]">
      <Card className="max-w-md mx-6 text-center border-0 shadow-none bg-transparent">
        <CardContent className="p-0">
          <div className="w-16 h-16 bg-[#88B078] rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">📶</span>
          </div>
          <h1 className="text-2xl font-semibold text-[#1A1A1A] mb-2">
            Estás offline
          </h1>
          <p className="text-[#666666] mb-6">
            No te preocupes, nuestra app está diseñada para funcionar sin conexión.
            Vuelve cuando tengas internet para continuar.
          </p>
          <Button
            variant="primary"
            onClick={() => window.location.reload()}
          >
            Reintentar
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
