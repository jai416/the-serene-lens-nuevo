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
import { ThemeToggle } from "@/components/theme-toggle"

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
    <div className="flex flex-col h-full bg-white dark:bg-[#222920]">
      <div className="p-6">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#2F3A2D] dark:bg-[#C2E09D] flex items-center justify-center">
            <Flower2 className="w-5 h-5 text-white dark:text-[#2F3A2D]" />
          </div>
          <div>
            <span className="font-serif text-lg font-semibold text-[#2F3A2D] dark:text-[#E8EDE6]">The Serene Lens</span>
            <span className="text-[10px] text-[#64705E] dark:text-[#9BAA93] block leading-tight">Observación Cosmética</span>
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
                  ? "bg-[#F0F5EC] dark:bg-[#2E3829] text-[#2F3A2D] dark:text-[#E8EDE6]"
                  : "text-[#64705E] dark:text-[#9BAA93] hover:bg-[#F8FAF5] dark:hover:bg-[#2A3228] hover:text-[#2F3A2D] dark:hover:text-[#E8EDE6]"
              )}
            >
              <link.icon className={cn("w-4.5 h-4.5 shrink-0", active ? "text-[#2F3A2D] dark:text-[#E8EDE6]" : "text-[#8A9A82] dark:text-[#7A8A72]")} />
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
                ? "bg-[#F0F5EC] dark:bg-[#2E3829] text-[#2F3A2D] dark:text-[#E8EDE6]"
                : "text-[#64705E] dark:text-[#9BAA93] hover:bg-[#F8FAF5] dark:hover:bg-[#2A3228] hover:text-[#2F3A2D] dark:hover:text-[#E8EDE6]"
            )}
          >
            <Settings className="w-4.5 h-4.5 shrink-0 text-[#8A9A82] dark:text-[#7A8A72]" />
            Admin
          </Link>
        )}

        {/* ─── Premium Card ─── */}
        <div className="pt-4 px-1">
          <div className="p-4 rounded-2xl bg-[#2F3A2D] dark:bg-[#C2E09D] border border-[#2F3A2D]/30 dark:border-[#C2E09D]/30">
            <Sparkles className="w-5 h-5 text-white dark:text-[#2F3A2D] mb-2" />
            <p className="text-sm font-semibold text-white dark:text-[#2F3A2D] mb-1">Premium</p>
            <p className="text-xs text-[#ECFFD3] dark:text-[#2F3A2D]/80 leading-relaxed mb-3">
              Análisis ilimitados, historial completo y rutinas personalizadas.
            </p>
            <Link
              href="/pricing"
              onClick={() => setMobileOpen(false)}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-[#C2E09D] dark:text-[#2F3A2D] hover:text-white dark:hover:text-[#2F3A2D]/80 transition-colors"
            >
              Ver planes
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </nav>

      <div className="p-3 border-t border-[#DDE7D3] dark:border-[#3A4536]">
        <ThemeToggle />
        {session ? (
          <div className="space-y-1 mt-1">
            <Link
              href="/dashboard/profile"
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-3 px-4 py-2.5 text-sm rounded-xl text-[#64705E] dark:text-[#9BAA93] hover:bg-[#F8FAF5] dark:hover:bg-[#2A3228] hover:text-[#2F3A2D] dark:hover:text-[#E8EDE6] transition-all duration-200"
            >
              <User className="w-4.5 h-4.5 shrink-0 text-[#8A9A82] dark:text-[#7A8A72]" />
              <span className="truncate">{session.user.name || session.user.email}</span>
            </Link>
            <button
              onClick={() => signOut()}
              className="flex items-center gap-3 px-4 py-2.5 text-sm rounded-xl text-[#64705E] dark:text-[#9BAA93] hover:bg-[#F8FAF5] dark:hover:bg-[#2A3228] hover:text-[#2F3A2D] dark:hover:text-[#E8EDE6] transition-all duration-200 w-full text-left"
            >
              <LogOut className="w-4.5 h-4.5 shrink-0 text-[#8A9A82] dark:text-[#7A8A72]" />
              Cerrar sesión
            </button>
          </div>
        ) : (
          <Link
            href="/login"
            onClick={() => setMobileOpen(false)}
            className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium rounded-xl bg-[#C2E09D] text-[#2F3A2D] hover:bg-[#B0D48E] transition-all duration-200 mt-1"
          >
            <User className="w-4.5 h-4.5 shrink-0" />
            Iniciar sesión
          </Link>
        )}
        <p className="text-[10px] text-[#8A9A82] dark:text-[#7A8A72] text-center mt-2">
          &copy; {new Date().getFullYear()} The Serene Lens
        </p>
      </div>
    </div>
  )

  return (
    <>
      <aside className="hidden md:flex fixed left-0 top-0 h-screen w-[280px] z-40 flex-col border-r border-[#DDE7D3] dark:border-[#3A4536] bg-white dark:bg-[#222920]">
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
          "md:hidden fixed top-0 left-0 h-screen w-[280px] z-50 bg-white dark:bg-[#222920] flex-col transition-transform duration-300 border-r border-[#DDE7D3] dark:border-[#3A4536]",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {sidebarContent}
      </aside>

      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="md:hidden fixed top-4 left-4 z-50 w-10 h-10 rounded-xl bg-white dark:bg-[#222920] border border-[#DDE7D3] dark:border-[#3A4536] flex items-center justify-center shadow-sm"
        aria-label="Menú"
      >
        {mobileOpen ? <X className="w-5 h-5 text-[#2F3A2D] dark:text-[#E8EDE6]" /> : <Menu className="w-5 h-5 text-[#2F3A2D] dark:text-[#E8EDE6]" />}
      </button>
    </>
  )
}
