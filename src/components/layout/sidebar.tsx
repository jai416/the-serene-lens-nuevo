"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useSession, signOut } from "next-auth/react"
import { cn } from "@/lib/utils"
import {
  Home,
  LayoutDashboard,
  Scan,
  History,
  Package,
  Newspaper,
  CreditCard,
  User,
  Shield,
  LogOut,
  Menu,
  X,
} from "lucide-react"
import { useState } from "react"

const links = [
  { href: "/", label: "Inicio", icon: Home },
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/analysis", label: "Análisis", icon: Scan },
  { href: "/dashboard/history", label: "Historial", icon: History },
  { href: "/products", label: "Productos", icon: Package },
  { href: "/blog", label: "Blog", icon: Newspaper },
  { href: "/pricing", label: "Planes", icon: CreditCard },
  { href: "/dashboard/profile", label: "Perfil", icon: User },
]

export function Sidebar() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const [mobileOpen, setMobileOpen] = useState(false)

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/"
    return pathname.startsWith(href)
  }

  const sidebarContent = (
    <div className="flex flex-col h-full">
      <div className="p-6">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl gradient-primary flex items-center justify-center shadow-lg neon-glow">
            <Scan className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <span className="font-serif text-lg font-semibold text-on-surface">The Serene Lens</span>
            <span className="text-[10px] text-muted-foreground block leading-tight">Observación Cosmética</span>
          </div>
        </Link>
      </div>

      <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto scrollbar-hide">
        {links.map((link) => {
          const active = isActive(link.href)
          return (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "flex items-center gap-3 px-4 py-2.5 text-sm font-medium rounded-xl transition-all duration-200",
                active
                  ? "glass-sidebar-item active"
                  : "glass-sidebar-item text-on-surface-variant"
              )}
            >
              <link.icon className={cn("w-4.5 h-4.5 shrink-0", active ? "text-primary" : "")} />
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
                ? "glass-sidebar-item active"
                : "glass-sidebar-item text-on-surface-variant"
            )}
          >
            <Shield className="w-4.5 h-4.5 shrink-0" />
            Admin
          </Link>
        )}
      </nav>

      <div className="p-3 border-t border-white/10">
        {session ? (
          <div className="space-y-1">
            <Link
              href="/dashboard/profile"
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-3 px-4 py-2.5 text-sm rounded-xl glass-sidebar-item text-on-surface-variant"
            >
              <User className="w-4.5 h-4.5 shrink-0" />
              <span className="truncate">{session.user.name || session.user.email}</span>
            </Link>
            <button
              onClick={() => signOut()}
              className="flex items-center gap-3 px-4 py-2.5 text-sm rounded-xl glass-sidebar-item text-on-surface-variant w-full text-left"
            >
              <LogOut className="w-4.5 h-4.5 shrink-0" />
              Cerrar sesión
            </button>
          </div>
        ) : (
          <Link
            href="/login"
            onClick={() => setMobileOpen(false)}
            className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium rounded-xl glass-sidebar-item text-primary"
          >
            <User className="w-4.5 h-4.5 shrink-0" />
            Iniciar sesión
          </Link>
        )}
        <p className="text-[10px] text-muted-foreground/50 text-center mt-2">
          &copy; {new Date().getFullYear()} The Serene Lens
        </p>
      </div>
    </div>
  )

  return (
    <>
      <aside className="hidden md:flex fixed left-0 top-0 h-screen w-[280px] z-40 glass-sidebar flex-col">
        {sidebarContent}
      </aside>

      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={cn(
          "md:hidden fixed top-0 left-0 h-screen w-[280px] z-50 glass-sidebar flex-col transition-transform duration-300",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {sidebarContent}
      </aside>

      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="md:hidden fixed top-4 left-4 z-50 w-10 h-10 rounded-xl glass-card-strong flex items-center justify-center"
        aria-label="Menú"
      >
        {mobileOpen ? <X className="w-5 h-5 text-on-surface" /> : <Menu className="w-5 h-5 text-on-surface" />}
      </button>
    </>
  )
}
