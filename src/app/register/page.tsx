"use client"

import { useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Suspense } from "react"
import { CardSkeleton } from "@/components/ui/skeleton"

/**
 * Alias de /login en modo registro.
 *
 * El CTA del flujo de invitado ("Crear cuenta gratis"), el kit de marketing de
 * la esteticista y el QR de referido apuntan a /register: sin esta página
 * devolvían 404. Se redirige al login abriendo el formulario de registro.
 */
function RegisterRedirect() {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const params = new URLSearchParams()
    params.set("mode", "register")
    const callbackUrl = searchParams.get("callbackUrl")
    if (callbackUrl && callbackUrl.startsWith("/") && !callbackUrl.startsWith("//")) {
      params.set("callbackUrl", callbackUrl)
    }
    const ref = searchParams.get("ref")
    if (ref) params.set("ref", ref)
    router.replace(`/login?${params.toString()}`)
  }, [router, searchParams])

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8F9FA]">
      <CardSkeleton />
    </div>
  )
}

export default function RegisterPage() {
  return (
    <Suspense fallback={null}>
      <RegisterRedirect />
    </Suspense>
  )
}
