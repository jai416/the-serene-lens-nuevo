"use client"

import { Suspense, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Lock, Eye, EyeOff, ArrowLeft, AlertCircle, CheckCircle2, Loader2, KeyRound, Flower2 } from "lucide-react"
import Link from "next/link"

function ResetPasswordForm() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get("token") || ""
  const email = searchParams.get("email") || ""

  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  if (!token || !email) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-[#F8F9FA]">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <div className="w-14 h-14 rounded-2xl bg-[#FEF2F2] flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-6 h-6 text-[#E07070]" />
            </div>
            <h2 className="font-serif text-xl font-semibold mb-2 text-[#1A1A1A]">Enlace inválido</h2>
            <p className="text-sm text-[#666666] mb-6">Este enlace de recuperación no es válido o ha expirado.</p>
            <Link href="/forgot-password">
              <Button variant="primary" className="w-full py-5 h-auto">
                Solicitar nuevo enlace
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres")
      setLoading(false)
      return
    }

    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden")
      setLoading(false)
      return
    }

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, token, password }),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error?.message || data.error || "Error al restablecer contraseña")
        return
      }

      setSuccess(true)
    } catch {
      setError("Error de conexión")
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-[#F8F9FA]">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <div className="w-14 h-14 rounded-2xl gradient-primary flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-6 h-6 text-[#1A1A1A]" />
            </div>
            <h2 className="font-serif text-xl font-semibold mb-2 text-[#1A1A1A]">Contraseña actualizada</h2>
            <p className="text-sm text-[#666666] mb-6">Tu contraseña se ha restablecido correctamente.</p>
            <Link href="/login">
              <Button variant="primary" className="w-full py-5 h-auto">
                Iniciar sesión
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-[#F8F9FA]">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-[#88B078] flex items-center justify-center mx-auto mb-4">
            <Flower2 className="w-7 h-7 text-[#1A1A1A]" />
          </div>
          <Badge variant="mint" className="mb-4 rounded-full px-4 py-1.5 border-0">
            <KeyRound className="w-3.5 h-3.5 mr-2" />
            Nueva Contraseña
          </Badge>
          <h1 className="font-serif text-3xl sm:text-4xl font-semibold text-[#1A1A1A]">
            Restablece tu Contraseña
          </h1>
          <p className="text-[#666666] mt-2 text-sm">Ingresa tu nueva contraseña.</p>
        </div>

        <Card>
          <CardContent className="p-8">
            {error && (
              <div className="flex items-center gap-2 bg-[#FEF2F2] border border-[#FECACA] rounded-xl px-4 py-3 mb-4 text-sm text-[#E07070]">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="password" className="block text-sm font-medium mb-1.5 text-[#1A1A1A]">
                  Nueva contraseña
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9BAA93]" />
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-white border border-[#E8E8E8] rounded-xl px-10 py-2.5 text-sm focus:outline-none focus:border-[#88B078] focus:ring-1 focus:ring-[#88B078] transition-colors placeholder:text-[#9BAA93] text-[#1A1A1A]"
                    placeholder="Mínimo 6 caracteres"
                    required
                  />
                  <button
                    type="button"
                    aria-label="Mostrar contraseña"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9BAA93] hover:text-[#1A1A1A] transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium mb-1.5 text-[#1A1A1A]">
                  Confirmar contraseña
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9BAA93]" />
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full bg-white border border-[#E8E8E8] rounded-xl px-10 py-2.5 text-sm focus:outline-none focus:border-[#88B078] focus:ring-1 focus:ring-[#88B078] transition-colors placeholder:text-[#9BAA93] text-[#1A1A1A]"
                    placeholder="Repite la contraseña"
                    required
                  />
                </div>
              </div>

              <Button type="submit" variant="primary" className="w-full py-5 h-auto text-base" disabled={loading}>
                {loading ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Restableciendo...
                  </span>
                ) : (
                  "Restablecer contraseña"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="text-center mt-6">
          <Link href="/login" className="text-sm text-[#666666] hover:text-[#1A1A1A] transition-colors inline-flex items-center gap-1.5">
            <ArrowLeft className="w-3.5 h-3.5" />
            Volver a iniciar sesión
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordForm />
    </Suspense>
  )
}
