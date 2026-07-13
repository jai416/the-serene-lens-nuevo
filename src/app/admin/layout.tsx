"use client"

import { useSession } from "next-auth/react"
import { redirect } from "next/navigation"
import { ReactNode } from "react"

const adminColors = {
  bg: "bg-[#F8F9FA]",
  surface: "bg-white",
  card: "bg-white",
  border: "border-[#E8E8E8]",
  textPrimary: "text-[#1A1A1A]",
  textSecondary: "text-[#666666]",
  textMuted: "text-[#666666]",
  accent: "text-[#88B078]",
  accentBg: "bg-[#88B078]",
  accentHover: "hover:bg-[#6F9A5E]",
  success: "bg-[#88B078]",
  warning: "bg-[#FCEAA6]",
  danger: "bg-[#E07070]",
  inputBg: "bg-[#F8F9FA]",
  hoverBg: "hover:bg-[#F0F0F0]",
}

export default function AdminLayout({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession()

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-[#88B078] border-t-transparent rounded-full animate-spin" />
          <p className="text-[#666666] text-sm">Cargando panel...</p>
        </div>
      </div>
    )
  }

  if (!session) redirect("/login?callbackUrl=/admin")
  if (session.user.role !== "ADMIN") {
    return (
      <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center">
        <div className="text-center p-8 bg-white rounded-2xl border border-[#E8E8E8] max-w-md">
          <div className="w-12 h-12 rounded-full bg-[#FEF2F2] flex items-center justify-center mx-auto mb-4">
            <span className="text-[#E07070] text-xl font-bold">!</span>
          </div>
          <h1 className="text-xl font-bold text-[#E07070] mb-2">Acceso denegado</h1>
          <p className="text-sm text-[#666666] mb-1">No tienes permisos de administrador.</p>
          <p className="text-sm text-[#666666]">Tu rol: <code className="bg-[#F8F9FA] px-2 py-0.5 rounded text-[#88B078]">{session.user.role}</code></p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      <div className="bg-white border-b border-[#E8E8E8] px-6 py-3 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#88B078] flex items-center justify-center">
            <span className="text-white text-xs font-bold">A</span>
          </div>
          <span className="text-sm font-semibold text-[#1A1A1A]">Panel Admin</span>
        </div>
        <div className="flex items-center gap-4">
          <a href="/"
            className="text-xs text-[#666666] hover:bg-[#F0F0F0] px-3 py-1.5 rounded-lg transition-colors"
          >
            ← Volver al sitio
          </a>
          <div className="w-7 h-7 rounded-full bg-[#E2ECE0] flex items-center justify-center">
            <span className="text-xs font-medium text-[#88B078]">
              {(session.user.email || "A")[0].toUpperCase()}
            </span>
          </div>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-6 py-6">
        {children}
      </div>
    </div>
  )
}
