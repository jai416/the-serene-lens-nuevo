"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Mail, ArrowLeft, AlertCircle, CheckCircle2, Loader2, KeyRound } from "lucide-react"
import Image from "next/image"
import Link from "next/link"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [resetLink, setResetLink] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    setSuccess(false)
    setResetLink("")

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error?.message || data.error || "Error al solicitar recuperación")
        return
      }

      setSuccess(true)
      if (data.resetUrl) setResetLink(data.resetUrl)
    } catch {
      setError("Error de conexión")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-[#F8F9FA] dark:bg-[#1A1F19]">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-[#88B078] flex items-center justify-center mx-auto mb-4">
            <Image src="/logo.webp" alt="The Serene Lens" width={28} height={28} className="w-7 h-7 object-cover" />
          </div>
          <Badge variant="mint" className="mb-4 rounded-full px-4 py-1.5 border-0">
            <KeyRound className="w-3.5 h-3.5 mr-2" />
            Recuperar Contraseña
          </Badge>
          <h1 className="font-serif text-3xl sm:text-4xl font-semibold text-[#1A1A1A] dark:text-[#E8DED5]">
            ¿Olvidaste tu Contraseña?
          </h1>
          <p className="text-[#666666] dark:text-[#9BAA93] mt-2 text-sm">
            Ingresa tu email y te enviaremos un enlace para restablecerla.
          </p>
        </div>

        <Card>
          <CardContent className="p-8">
            {error && (
              <div className="flex items-center gap-2 bg-[#FEF2F2] dark:bg-[#3B1F1F] border border-[#FECACA] dark:border-[#6B2A2A] rounded-xl px-4 py-3 mb-4 text-sm text-[#E07070] dark:text-[#FCA5A5]">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}

            {success ? (
                <div className="text-center">
                  <div className="w-14 h-14 rounded-2xl bg-[#88B078] flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 className="w-6 h-6 text-[#1A1A1A] dark:text-[#1A1F19]" />
                  </div>
                  <p className="text-sm text-[#666666] dark:text-[#9BAA93] mb-4">
                    {resetLink
                      ? "Modo desarrollo: usa el enlace para restablecer tu contraseña."
                      : "Si existe una cuenta con ese email, recibirás instrucciones para restablecer tu contraseña."}
                  </p>
                  {resetLink && (
                    <div className="p-3 rounded-xl bg-[#E2ECE0] dark:bg-[#211C17] border border-[#88B078] dark:border-[#222920] mb-4 break-all">
                      <a href={resetLink} className="text-sm text-[#1A1A1A] dark:text-[#E8DED5] underline font-medium">{resetLink}</a>
                    </div>
                  )}
                <Link href="/login">
                  <Button variant="primary" className="w-full py-5 h-auto">
                    Volver a iniciar sesión
                  </Button>
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium mb-1.5 text-[#1A1A1A] dark:text-[#E8DED5]">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9BAA93] dark:text-[#9BAA93]" />
                    <input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-white dark:bg-[#211C17] border border-[#E8E8E8] dark:border-[#222920] rounded-xl px-10 py-2.5 text-sm focus:outline-none focus:border-[#88B078] dark:focus:border-[#88B078] focus:ring-1 focus:ring-[#88B078] dark:focus:ring-[#88B078] transition-colors placeholder:text-[#9BAA93] dark:placeholder:text-[#9BAA93] text-[#1A1A1A] dark:text-[#E8DED5]"
                      placeholder="tu@email.com"
                      required
                    />
                  </div>
                </div>

                <Button type="submit" variant="primary" className="w-full py-5 h-auto text-base" disabled={loading}>
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Enviando...
                    </span>
                  ) : (
                    "Enviar enlace de recuperación"
                  )}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>

        <div className="text-center mt-6">
          <Link href="/login" className="text-sm text-[#666666] dark:text-[#9BAA93] hover:text-[#1A1A1A] dark:hover:text-[#E8EDE6] transition-colors inline-flex items-center gap-1.5">
            <ArrowLeft className="w-3.5 h-3.5" />
            Volver a iniciar sesión
          </Link>
        </div>
      </div>
    </div>
  )
}
