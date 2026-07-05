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
  Sparkles,
  ArrowRight,
  Users,
  BookOpen,
  Trophy,
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
  { href: "/analysis", label: "Análisis de piel", icon: Scan },
  { href: "/dashboard/history", label: "Historial", icon: History },
  { href: "/dashboard/diary", label: "Mi Diario", icon: BookOpen },
  { href: "/dashboard/challenges", label: "Desafíos", icon: Trophy },
  { href: "/community", label: "Comunidad", icon: Users },
  { href: "/products", label: "Productos", icon: Package },
  { href: "/guides", label: "Guías", icon: BookOpen },
  { href: "/ingredients-analyzer", label: "Ingredientes", icon: Beaker },
  { href: "/dashboard/subscription", label: "Plan", icon: TrendingUp },
  { href: "/dashboard/report", label: "Informe", icon: FileText },
  { href: "/dashboard/referrals", label: "Referidos", icon: Users },
  { href: "/dashboard/social", label: "Social", icon: Users },
  { href: "/dashboard/guides", label: "Mis Guías", icon: BookOpen },
  { href: "/dashboard/esthetician", label: "Esteticista", icon: Users },
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
    <div className="flex flex-col h-full bg-white">
      <div className="p-6">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#C2E09D] flex items-center justify-center">
            <Flower2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="block text-lg font-semibold leading-tight text-[#2F3A2D]">The Serene <span className="text-[#C2E09D]">Lens</span></span>
            <span className="text-[10px] text-[#64705E] block leading-tight">Observación Cosmética</span>
          </div>
        </Link>
      </div>

      <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto scrollbar-hide">
        {links
          .filter((link) => {
            if (link.href === "/dashboard/esthetician") {
              return session?.user?.plan === "ESTHETICIAN" || session?.user?.role === "ADMIN"
            }
            return true
          })
          .map((link) => {
          const active = isActive(link.href)
          return (
            <Link
              key={`${link.href}-${link.label}`}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "flex items-center gap-3 px-4 py-2.5 text-sm font-medium rounded-xl transition-all duration-200",
                active
                  ? "bg-[#F0F5EC] text-[#2F3A2D]"
                  : "text-[#64705E] hover:bg-[#F8FAF5] hover:text-[#2F3A2D]"
              )}
            >
              <link.icon className={cn("w-4.5 h-4.5 shrink-0", active ? "text-[#C2E09D]" : "text-[#DDE7D3]")} />
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
                ? "bg-[#F0F5EC] text-[#2F3A2D]"
                : "text-[#64705E] hover:bg-[#F8FAF5] hover:text-[#2F3A2D]"
            )}
          >
            <Settings className="w-4.5 h-4.5 shrink-0" />
            Admin
          </Link>
        )}

        <div className="pt-4 px-1">
          <div className="p-4 rounded-2xl bg-[#C2E09D]">
            <Sparkles className="w-5 h-5 text-white mb-2" />
            <p className="text-sm font-semibold text-white mb-1">Premium</p>
            <p className="text-xs text-white/80 leading-relaxed mb-3">
              Desbloquea análisis avanzados
            </p>
            <Link
              href="/pricing"
              onClick={() => setMobileOpen(false)}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-white hover:text-white/80 transition-colors"
            >
              Mejorar ahora
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </nav>

      <div className="p-3 border-t border-[#DDE7D3]">
        {session ? (
          <div className="space-y-1">
            <Link
              href="/dashboard/profile"
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-3 px-4 py-2.5 text-sm rounded-xl text-[#64705E] hover:bg-[#F8FAF5] hover:text-[#2F3A2D] transition-all duration-200"
            >
              <User className="w-4.5 h-4.5 shrink-0 text-[#DDE7D3]" />
              <span className="truncate">{session.user.name || session.user.email}</span>
            </Link>
            <button
              onClick={() => signOut()}
              className="flex items-center gap-3 px-4 py-2.5 text-sm rounded-xl text-[#64705E] hover:bg-[#F8FAF5] hover:text-[#2F3A2D] transition-all duration-200 w-full text-left"
            >
              <LogOut className="w-4.5 h-4.5 shrink-0 text-[#DDE7D3]" />
              Cerrar sesión
            </button>
          </div>
        ) : (
          <Link
            href="/login"
            onClick={() => setMobileOpen(false)}
            className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium rounded-xl bg-[#C2E09D] text-white hover:bg-[#B0D48E] transition-all duration-200 mt-1"
          >
            <User className="w-4.5 h-4.5 shrink-0" />
            Iniciar sesión
          </Link>
        )}
        <p className="text-[10px] text-[#8A9A82] text-center mt-2">
          &copy; {new Date().getFullYear()} The Serene Lens
        </p>
      </div>
    </div>
  )

  return (
    <>
      <aside className="hidden md:flex fixed left-0 top-0 h-screen w-[280px] z-40 flex-col border-r border-[#DDE7D3] bg-white">
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
          "md:hidden fixed top-0 left-0 h-screen w-[280px] z-50 bg-white flex-col transition-transform duration-300 border-r border-[#DDE7D3]",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {sidebarContent}
      </aside>

      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="md:hidden fixed top-4 left-4 z-50 w-10 h-10 rounded-xl bg-white border border-[#DDE7D3] flex items-center justify-center shadow-sm"
        aria-label="Menú"
      >
        {mobileOpen ? <X className="w-5 h-5 text-[#2F3A2D]" /> : <Menu className="w-5 h-5 text-[#2F3A2D]" />}
      </button>
    </>
  )
}
