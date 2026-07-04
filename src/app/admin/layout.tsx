"use client"

import { useSession } from "next-auth/react"
import { redirect } from "next/navigation"
import { ReactNode } from "react"

const adminColors = {
  bg: "bg-[#0F1117]",
  surface: "bg-[#1A1D27]",
  card: "bg-[#22263A]",
  border: "border-[#2D3350]",
  textPrimary: "text-[#E2E8F0]",
  textSecondary: "text-[#8892B0]",
  textMuted: "text-[#5A6485]",
  accent: "text-[#7C8CFF]",
  accentBg: "bg-[#7C8CFF]",
  accentHover: "hover:bg-[#6B7BFF]",
  success: "bg-[#4ADE80]",
  warning: "bg-[#FBBF24]",
  danger: "bg-[#FB7185]",
  inputBg: "bg-[#2D3350]",
  hoverBg: "hover:bg-[#2D3350]",
}

export default function AdminLayout({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession()

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-[#0F1117] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-[#7C8CFF] border-t-transparent rounded-full animate-spin" />
          <p className="text-[#8892B0] text-sm">Cargando panel...</p>
        </div>
      </div>
    )
  }

  if (!session) redirect("/login?callbackUrl=/admin")
  if (session.user.role !== "ADMIN") {
    return (
      <div className="min-h-screen bg-[#0F1117] flex items-center justify-center">
        <div className="text-center p-8 bg-[#1A1D27] rounded-2xl border border-[#2D3350] max-w-md">
          <div className="w-12 h-12 rounded-full bg-[#FB7185]/20 flex items-center justify-center mx-auto mb-4">
            <span className="text-[#FB7185] text-xl font-bold">!</span>
          </div>
          <h1 className="text-xl font-bold text-[#FB7185] mb-2">Acceso denegado</h1>
          <p className="text-sm text-[#8892B0] mb-1">No tienes permisos de administrador.</p>
          <p className="text-sm text-[#5A6485]">Tu rol: <code className="bg-[#2D3350] px-2 py-0.5 rounded text-[#7C8CFF]">{session.user.role}</code></p>
        </div>
      </div>
    )
  }

  return (
    <div className={`min-h-screen ${adminColors.bg}`}>
      <div className={`${adminColors.surface} border-b ${adminColors.border} px-6 py-3 flex items-center justify-between sticky top-0 z-40`}>
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-lg ${adminColors.accentBg} flex items-center justify-center`}>
            <span className="text-white text-xs font-bold">A</span>
          </div>
          <span className={`text-sm font-semibold ${adminColors.textPrimary}`}>Admin Panel</span>
        </div>
        <div className="flex items-center gap-4">
          <a
            href="/"
            className={`text-xs ${adminColors.textSecondary} ${adminColors.hoverBg} px-3 py-1.5 rounded-lg transition-colors`}
          >
            ← Volver al sitio
          </a>
          <div className={`w-7 h-7 rounded-full ${adminColors.accentBg}/20 flex items-center justify-center`}>
            <span className={`text-xs font-medium ${adminColors.accent}`}>
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
