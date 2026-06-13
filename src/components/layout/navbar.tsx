"use client"

import Link from "next/link"
import { useSession, signOut } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Scan, Menu, X, User, LogOut, LayoutDashboard, Shield } from "lucide-react"
import { useState } from "react"
import { cn } from "@/lib/utils"

const links = [
  { href: "/analysis", label: "Análisis" },
  { href: "/products", label: "Productos" },
  { href: "/blog", label: "Blog" },
  { href: "/pricing", label: "Precios" },
]

export function Navbar() {
  const { data: session } = useSession()
  const [open, setOpen] = useState(false)

  return (
    <header className="fixed top-0 left-0 right-0 z-50">
      <div className="absolute inset-0 glass border-b border-white/20 dark:border-white/5" />
      <nav className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl gradient-primary flex items-center justify-center shadow-sm">
              <Scan className="w-4 h-4 text-white" />
            </div>
            <span className="font-serif text-lg font-semibold text-on-surface hidden sm:block">
              The Serene Lens
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-1">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="px-4 py-2 text-sm text-on-surface-variant hover:text-on-surface rounded-xl hover:bg-muted transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-2">
            {session ? (
              <>
                {(session.user as any)?.role === "ADMIN" && (
                  <Link href="/admin">
                    <Button variant="ghost" size="sm">
                      <Shield className="w-4 h-4 mr-1.5" />
                      Admin
                    </Button>
                  </Link>
                )}
                <Link href="/dashboard">
                  <Button variant="ghost" size="sm">
                    <LayoutDashboard className="w-4 h-4 mr-1.5" />
                    Dashboard
                  </Button>
                </Link>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => signOut()}
                >
                  <LogOut className="w-4 h-4 mr-1.5" />
                  Salir
                </Button>
              </>
            ) : (
              <Link href="/login">
                <Button size="sm" className="rounded-full">
                  <User className="w-4 h-4 mr-1.5" />
                  Entrar
                </Button>
              </Link>
            )}
          </div>

          <button
            onClick={() => setOpen(!open)}
            className="md:hidden p-2 rounded-xl hover:bg-muted transition-colors"
            aria-label="Menú"
          >
            {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </nav>

      {open && (
        <div className="md:hidden glass border-b border-white/20 dark:border-white/5 animate-fade-in">
          <div className="px-4 py-4 space-y-1">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="block px-4 py-3 text-sm text-on-surface-variant hover:text-on-surface rounded-xl hover:bg-muted transition-colors"
              >
                {link.label}
              </Link>
            ))}
            <hr className="my-2 border-outline/30" />
            {session ? (
              <>
                <Link
                  href="/dashboard"
                  onClick={() => setOpen(false)}
                  className="block px-4 py-3 text-sm font-medium rounded-xl hover:bg-muted transition-colors"
                >
                  Dashboard
                </Link>
                <button
                  onClick={() => signOut()}
                  className="block w-full text-left px-4 py-3 text-sm text-destructive rounded-xl hover:bg-muted transition-colors"
                >
                  Cerrar sesión
                </button>
              </>
            ) : (
              <Link
                href="/login"
                onClick={() => setOpen(false)}
                className="block px-4 py-3 text-sm font-medium text-primary rounded-xl hover:bg-muted transition-colors"
              >
                Iniciar sesión
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  )
}
