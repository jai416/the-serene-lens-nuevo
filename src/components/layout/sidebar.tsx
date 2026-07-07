"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useSession, signOut } from "next-auth/react"
import { cn } from "@/lib/utils"
import {
  Home,
  Scan,
  History,
  Leaf,
  Package,
  Beaker,
  TrendingUp,
  User,
  Settings,
  LogOut,
  Menu,
  X,
  Flower2,
  Crown,
  ArrowRight,
  BookOpen,
  Bookmark,
  Trophy,
  LayoutDashboard,
  FileText,
  HelpCircle,
} from "lucide-react"
import { useState } from "react"

const guestLinks = [
  { href: "/", label: "Inicio", icon: Home },
  { href: "/products", label: "Productos", icon: Package },
  { href: "/ingredients-analyzer", label: "Ingredientes", icon: Beaker },
]

const authLinks = [
  { href: "/", label: "Inicio", icon: Home },
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/analysis", label: "Análisis de piel", icon: Scan },
  { href: "/dashboard/history", label: "Historial", icon: History },
  { href: "/dashboard/diary", label: "Rutinas", icon: BookOpen },
  { href: "/dashboard/challenges", label: "Desafíos", icon: Trophy },
  { href: "/products", label: "Productos", icon: Package },
  { href: "/guides", label: "Guías", icon: BookOpen },
  { href: "/ingredients-analyzer", label: "Ingredientes", icon: Beaker },
  { href: "/dashboard/subscription", label: "Plan", icon: TrendingUp },
  { href: "/dashboard/report", label: "Informe", icon: FileText },
  { href: "/dashboard/guides", label: "Mis Guías", icon: Bookmark },
  { href: "/dashboard/support", label: "Soporte", icon: HelpCircle },
  { href: "/dashboard/profile", label: "Cuenta", icon: User },
]

export function Sidebar() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const [mobileOpen, setMobileOpen] = useState(false)
  const links = session ? authLinks : guestLinks

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/"
    return pathname.startsWith(href)
  }

  const sidebarContent = (
    <div className="flex flex-col h-full bg-white dark:bg-[#222222]">
      <div className="p-6 pb-4">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#88B078] dark:bg-[#88B078] flex items-center justify-center shadow-sm">
            <Flower2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="block text-lg font-semibold leading-tight text-[#1A1A1A] dark:text-[#F0F0F0]">The Serene Lens</span>
            <span className="text-[11px] text-[#666666] dark:text-[#999999] block leading-tight">Conoce mejor tu piel</span>
          </div>
        </Link>
      </div>

      <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto scrollbar-hide">
        {links.map((link) => {
          const active = isActive(link.href)
          return (
            <Link
              key={`${link.href}-${link.label}`}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "flex items-center gap-3 px-4 py-2.5 text-sm font-medium rounded-xl transition-all duration-200",
                active
                  ? "bg-[#E2ECE0] dark:bg-[#2A3A2A] text-[#1A1A1A] dark:text-[#F0F0F0]"
                  : "text-[#666666] dark:text-[#999999] hover:bg-[#F8F9FA] dark:hover:bg-[#2A2A2A] hover:text-[#1A1A1A] dark:hover:text-[#F0F0F0]"
              )}
            >
              <link.icon className={cn("w-4.5 h-4.5 shrink-0", active ? "text-[#88B078]" : "text-[#999999] dark:text-[#777777]")} />
              {link.label}
            </Link>
          )
        })}

        {session?.user?.role === "ADMIN" && (
          <Link
            href="/admin"
            onClick={() => setMobileOpen(false)}
            className={cn(
              "flex items-center gap-3 px-4 py-2.5 text-sm font-medium rounded-xl transition-all duration-200",
              isActive("/admin")
                ? "bg-[#E2ECE0] dark:bg-[#2A3A2A] text-[#1A1A1A] dark:text-[#F0F0F0]"
                : "text-[#666666] dark:text-[#999999] hover:bg-[#F8F9FA] dark:hover:bg-[#2A2A2A] hover:text-[#1A1A1A] dark:hover:text-[#F0F0F0]"
            )}
          >
            <Settings className="w-4.5 h-4.5 shrink-0" />
            Admin
          </Link>
        )}

        <div className="pt-4 px-1">
          <div className="p-5 rounded-2xl bg-[#FFF9E6] dark:bg-[#3A3A2A] border border-[#FCEAA6]/50 dark:border-[#4A4A2A]/50">
            <Crown className="w-5 h-5 text-[#D4A843] mb-2" />
            <p className="text-sm font-semibold text-[#1A1A1A] dark:text-[#F0F0F0] mb-1">
              Versión Premium
            </p>
            <p className="text-xs text-[#666666] dark:text-[#999999] leading-relaxed mb-3">
              Desbloquea análisis ilimitados e historial completo
            </p>
            <Link
              href="/pricing"
              onClick={() => setMobileOpen(false)}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#1A1A1A] bg-[#FCEAA6] dark:bg-[#4A4A2A] dark:text-[#F0F0F0] rounded-full px-4 py-2 hover:bg-[#F5E090] dark:hover:bg-[#5A5A3A] transition-colors"
            >
              Mejorar ahora
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </nav>

      <div className="p-3 border-t border-[#E8E8E8] dark:border-[#333333]">
        {session ? (
          <div className="space-y-1">
              <Link
                href="/dashboard/profile"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-3 px-4 py-2.5 text-sm rounded-xl text-[#666666] dark:text-[#999999] hover:bg-[#E2ECE0] dark:hover:bg-[#2A3A2A] hover:text-[#1A1A1A] dark:hover:text-[#F0F0F0] transition-all duration-200"
              >
                <User className="w-4.5 h-4.5 shrink-0 text-[#88B078]" />
                <span className="truncate">{session.user.name || session.user.email}</span>
              </Link>
            <button
              onClick={() => signOut()}
              className="flex items-center gap-3 px-4 py-2.5 text-sm rounded-xl text-[#666666] dark:text-[#999999] hover:bg-[#E2ECE0] dark:hover:bg-[#2A3A2A] hover:text-[#1A1A1A] dark:hover:text-[#F0F0F0] transition-all duration-200 w-full text-left"
            >
              <LogOut className="w-4.5 h-4.5 shrink-0 text-[#88B078]" />
              Cerrar sesión
            </button>
          </div>
        ) : (
          <Link
            href="/login"
            onClick={() => setMobileOpen(false)}
            className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium rounded-xl bg-[#88B078] text-white hover:bg-[#78A068] transition-all duration-200 mt-1"
          >
            <User className="w-4.5 h-4.5 shrink-0" />
            Iniciar sesión
          </Link>
        )}
        <p className="text-[10px] text-[#999999] dark:text-[#888888] text-center mt-2">
          &copy; {new Date().getFullYear()} The Serene Lens
        </p>
      </div>
    </div>
  )

  return (
    <>
      <aside className="hidden md:flex fixed left-0 top-0 h-screen w-[280px] z-40 flex-col border-r border-[#E8E8E8] dark:border-[#333333] bg-white dark:bg-[#222222]">
        {sidebarContent}
      </aside>

      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-black/20"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={cn(
          "md:hidden fixed top-0 left-0 h-screen w-[280px] z-50 bg-white dark:bg-[#222222] flex-col transition-transform duration-300 border-r border-[#E8E8E8] dark:border-[#333333]",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {sidebarContent}
      </aside>

      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="md:hidden fixed top-4 left-4 z-50 w-10 h-10 rounded-xl bg-white dark:bg-[#222222] border border-[#E8E8E8] dark:border-[#333333] flex items-center justify-center shadow-sm"
        aria-label="Menú"
      >
        {mobileOpen ? <X className="w-5 h-5 text-[#1A1A1A] dark:text-[#F0F0F0]" /> : <Menu className="w-5 h-5 text-[#1A1A1A] dark:text-[#F0F0F0]" />}
      </button>
    </>
  )
}
