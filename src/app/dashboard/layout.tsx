"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  Scan,
  History,
  BookOpen,
  Trophy,
  FileText,
  Users,
  CreditCard,
  User,
  HelpCircle,
  Sparkles,
} from "lucide-react"

const sidebarLinks = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/analysis", label: "Nuevo Análisis", icon: Sparkles },
  { href: "/dashboard/history", label: "Historial", icon: History },
  { href: "/dashboard/diary", label: "Mi Diario", icon: BookOpen },
  { href: "/dashboard/challenges", label: "Desafíos", icon: Trophy },
  { href: "/dashboard/report", label: "Informe", icon: FileText },
  { href: "/dashboard/referrals", label: "Referidos", icon: Users },
  { href: "/dashboard/social", label: "Social", icon: Users },
  { href: "/dashboard/guides", label: "Mis Guías", icon: BookOpen },
  { href: "/dashboard/subscription", label: "Suscripción", icon: CreditCard },
  { href: "/dashboard/profile", label: "Perfil", icon: User },
  { href: "/dashboard/support", label: "Soporte", icon: HelpCircle },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem("dashboard_sidebar_collapsed")
    if (saved) setCollapsed(saved === "true")
  }, [])

  useEffect(() => {
    localStorage.setItem("dashboard_sidebar_collapsed", String(collapsed))
  }, [collapsed])

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard"
    return pathname.startsWith(href)
  }

  return (
    <div className="flex min-h-screen">
      <div className={cn("flex-1 min-w-0 transition-all duration-300")}>
        {children}
      </div>

      <aside
        className={cn(
          "sticky top-0 h-screen transition-all duration-300 border-l flex flex-col shrink-0",
          "bg-[#FFF8F0] border-[#E8DDD0]",
          collapsed ? "w-16" : "w-64"
        )}
      >
        <div className={cn("flex items-center p-3 border-b border-[#E8DDD0]", collapsed ? "justify-center" : "justify-between")}>
          {!collapsed && (
            <span className="text-xs font-semibold uppercase tracking-wider text-[#3D3229]/50">Menú</span>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-[#E8DDD0] transition-colors text-[#3D3229]"
            aria-label={collapsed ? "Expandir sidebar" : "Colapsar sidebar"}
          >
            {collapsed ? "▶" : "◀"}
          </button>
        </div>

        <nav className="flex-1 px-2 py-3 space-y-1 overflow-y-auto">
          {sidebarLinks.map((link) => {
            const active = isActive(link.href)
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "flex items-center gap-3 rounded-xl transition-all duration-200 group",
                  collapsed ? "justify-center p-3" : "px-3 py-2.5",
                  active
                    ? "bg-[#E8D5C4] text-[#3D3229]"
                    : "text-[#3D3229]/70 hover:bg-[#E8DDD0] hover:text-[#3D3229]"
                )}
                title={collapsed ? link.label : undefined}
              >
                <link.icon className={cn(
                  "w-5 h-5 shrink-0",
                  active ? "text-[#3D3229]" : "text-[#3D3229]/50 group-hover:text-[#3D3229]"
                )} />
                {!collapsed && (
                  <span className="text-sm font-medium truncate">{link.label}</span>
                )}
              </Link>
            )
          })}
        </nav>

        {!collapsed && (
          <div className="p-3 border-t border-[#E8DDD0]">
            <p className="text-[10px] text-[#3D3229]/40 text-center">
              The Serene Lens &copy; {new Date().getFullYear()}
            </p>
          </div>
        )}
      </aside>
    </div>
  )
}
