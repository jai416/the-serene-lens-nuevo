"use client"

import { Suspense, useState } from "react"
import { signIn } from "next-auth/react"
import { useSearchParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Mail, Lock, Eye, EyeOff, LogIn, UserPlus, ArrowLeft, AlertCircle } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { toast } from "sonner"
import { SocialLoginButtons } from "@/components/social-login-buttons"
import { logger } from "@/lib/logger"
import { getCsrfToken } from "@/lib/csrf-client"

const errorMessages: Record<string, string> = {
  CredentialsSignin: "Email o contraseña incorrectos",
  OAuthAccountNotLinked: "Este email ya está vinculado a otro método de inicio de sesión",
  OAuthSignin: "Error al iniciar sesión con el proveedor",
  OAuthCallback: "Error al iniciar sesión con el proveedor",
  AccessDenied: "No tienes permisos para acceder a esta página",
  default: "Error de autenticación",
}

function LoginForm() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const rawCallback = searchParams.get("callbackUrl") || "/dashboard"
  const callbackUrl =
    rawCallback.startsWith("/") && !rawCallback.startsWith("//") ? rawCallback : "/dashboard"
  const errorParam = searchParams.get("error")

  const [isRegister, setIsRegister] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(errorParam ? errorMessages[errorParam] || errorMessages.default : "")
  const [form, setForm] = useState({ email: "", password: "", name: "", estheticianCode: "" })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      if (isRegister) {
        const payload: Record<string, string> = { email: form.email, password: form.password }
        if (form.name) payload.name = form.name
        if (form.estheticianCode) payload.estheticianCode = form.estheticianCode.trim()

        const res = await fetch("/api/register", {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-csrf-token": getCsrfToken() },
          body: JSON.stringify(payload),
        })
        const data = await res.json()
        if (!res.ok) {
          setError(data.error?.message || data.error || "Error al registrarse")
          return
        }
        toast.success("Cuenta creada correctamente")
        router.push("/dashboard?welcome=1")
        return
      }

      const result = await signIn("credentials", {
        email: form.email,
        password: form.password,
        redirect: false,
      })

      if (result?.error) {
        setError(errorMessages[result.error] || "Email o contraseña incorrectos")
        return
      }

      if (!result?.ok) {
        setError("Error al iniciar sesión")
        return
      }

      toast.success("Sesión iniciada correctamente")
      router.push(callbackUrl)
    } catch (err) {
      logger.error("Login error:", { error: err })
      setError("Error de conexión")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-[#F8F9FA]">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-[#88B078] flex items-center justify-center mx-auto mb-4 overflow-hidden">
            <Image src="/logo.webp" alt="The Serene Lens" width={56} height={56} className="w-full h-full object-cover" />
          </div>
          <Badge variant="mint" className="mb-4 rounded-full px-4 py-1.5 border-0">
            {isRegister ? <UserPlus className="w-3.5 h-3.5 mr-2" /> : <LogIn className="w-3.5 h-3.5 mr-2" />}
            {isRegister ? "Crear Cuenta" : "Iniciar Sesión"}
          </Badge>
          <h1 className="font-serif text-3xl sm:text-4xl font-semibold text-[#1A1A1A]">
            {isRegister ? "Únete a " : "Bienvenido a "}
            The Serene Lens
          </h1>
          <p className="text-[#666666] mt-2 text-sm">
            {isRegister
              ? "Crea tu cuenta y comienza a observar tu piel"
              : "Accede a tus análisis y rutinas personalizadas"}
          </p>
        </div>

        <Card>
          <CardContent className="p-8">
            {error && (
              <div id="login-error" role="alert" className="flex items-center gap-2 bg-[#FEF2F2] border border-[#FECACA] rounded-xl px-4 py-3 mb-4 text-sm text-[#E07070]">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {isRegister && (
                <div>
                  <label htmlFor="name" className="block text-sm font-medium mb-1.5 text-[#1A1A1A]">
                    Nombre
                  </label>
                  <div className="relative">
                    <UserPlus aria-hidden="true" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9BAA93]" />
                    <input
                      id="name"
                      name="name"
                      type="text"
                      autoComplete="name"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      className="w-full bg-white border border-[#E8E8E8] rounded-xl px-10 py-2.5 text-sm focus:outline-none focus:border-[#88B078] focus:ring-1 focus:ring-[#88B078] transition-colors placeholder:text-[#9BAA93] text-[#1A1A1A]"
                      placeholder="Tu nombre"
                      aria-label="Nombre"
                    />
                  </div>
                </div>
              )}

              <div>
                <label htmlFor="email" className="block text-sm font-medium mb-1.5 text-[#1A1A1A]">
                  Email
                </label>
                  <div className="relative">
                    <Mail aria-hidden="true" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9BAA93]" />
                    <input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete={isRegister ? "email" : "username"}
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      className="w-full bg-white border border-[#E8E8E8] rounded-xl px-10 py-2.5 text-sm focus:outline-none focus:border-[#88B078] focus:ring-1 focus:ring-[#88B078] transition-colors placeholder:text-[#9BAA93] text-[#1A1A1A]"
                      placeholder="tu@email.com"
                      aria-label="Email"
                      aria-describedby={error ? "login-error" : undefined}
                      required
                    />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium mb-1.5 text-[#1A1A1A]">
                  Contraseña
                </label>
                  <div className="relative">
                    <Lock aria-hidden="true" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9BAA93]" />
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete={isRegister ? "new-password" : "current-password"}
                      value={form.password}
                      onChange={(e) => setForm({ ...form, password: e.target.value })}
                      className="w-full bg-white border border-[#E8E8E8] rounded-xl px-10 py-2.5 text-sm focus:outline-none focus:border-[#88B078] focus:ring-1 focus:ring-[#88B078] transition-colors placeholder:text-[#9BAA93] text-[#1A1A1A]"
                      placeholder="••••••••"
                      aria-label="Contraseña"
                      aria-describedby={error ? "login-error" : undefined}
                      required
                    />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9BAA93] hover:text-[#1A1A1A] transition-colors"
                    aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {isRegister && (
                <div>
                  <label htmlFor="estheticianCode" className="block text-sm font-medium mb-1.5 text-[#1A1A1A]">
                    Código de Esteticista <span className="text-[#999999]">(opcional)</span>
                  </label>
                  <div className="relative">
                    <UserPlus aria-hidden="true" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9BAA93]" />
                    <input
                      id="estheticianCode"
                      name="estheticianCode"
                      type="text"
                      value={form.estheticianCode}
                      onChange={(e) => setForm({ ...form, estheticianCode: e.target.value })}
                      className="w-full bg-white border border-[#E8E8E8] rounded-xl px-10 py-2.5 text-sm focus:outline-none focus:border-[#88B078] focus:ring-1 focus:ring-[#88B078] transition-colors placeholder:text-[#9BAA93] text-[#1A1A1A]"
                      placeholder="EST-ABC123"
                      aria-label="Código de Esteticista"
                    />
                  </div>
                  <p className="text-xs text-[#999999] mt-1">
                    Si un esteticista te dio un código, ingrésalo para vincular tu cuenta
                  </p>
                </div>
              )}

              <Button type="submit" variant="primary" className="w-full py-5 h-auto text-base" disabled={loading}>
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-[#1A1A1A]/30 border-t-[#1A1A1A] rounded-full animate-spin" />
                    {isRegister ? "Creando cuenta..." : "Iniciando sesión..."}
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    {isRegister ? <UserPlus className="w-4 h-4" /> : <LogIn className="w-4 h-4" />}
                    {isRegister ? "Crear Cuenta" : "Iniciar Sesión"}
                  </span>
                )}
              </Button>

              {!isRegister && (
                <div className="text-center">
                  <Link href="/forgot-password" className="text-xs text-[#666666] hover:text-[#1A1A1A] transition-colors">
                    ¿Olvidaste tu contraseña?
                  </Link>
                </div>
              )}
            </form>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[#E8E8E8]" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-white px-3 text-[#9BAA93]">O continúa con</span>
              </div>
            </div>

            <SocialLoginButtons />

            <div className="text-center mt-6">
              <p className="text-sm text-[#666666]">
                {isRegister ? "¿Ya tienes cuenta?" : "¿No tienes cuenta?"}{" "}
                <button
                  type="button"
                  onClick={() => {
                    setIsRegister(!isRegister)
                    setError("")
                  }}
                  className="text-[#1A1A1A] hover:underline font-medium"
                >
                  {isRegister ? "Inicia sesión" : "Regístrate gratis"}
                </button>
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="text-center mt-6">
          <Link href="/" className="text-sm text-[#666666] hover:text-[#1A1A1A] transition-colors inline-flex items-center gap-1.5">
            <ArrowLeft className="w-3.5 h-3.5" />
            Volver al inicio
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  )
}
