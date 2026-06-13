"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Scan, History, User } from "lucide-react"
import { cn } from "@/lib/utils"

const items = [
  { href: "/", label: "Inicio", icon: Home },
  { href: "/analysis", label: "Análisis", icon: Scan },
  { href: "/dashboard/history", label: "Historial", icon: History },
  { href: "/dashboard/profile", label: "Perfil", icon: User },
]

export function MobileNav() {
  const pathname = usePathname()

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 glass-mobile-nav">
      <div className="flex items-center justify-around py-2 px-1 pb-[calc(0.5rem+env(safe-area-inset-bottom))] overflow-x-auto scrollbar-hide">
        {items.map((item) => {
          const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-0.5 px-2 sm:px-4 py-1.5 rounded-xl transition-all duration-200 relative shrink-0",
                active ? "text-primary" : "text-muted-foreground hover:text-on-surface"
              )}
            >
              {active && (
                <span className="absolute -top-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary neon-glow" />
              )}
              <item.icon className={cn("w-5 h-5", active && "neon-glow")} />
              <span className={cn("text-[10px] font-medium whitespace-nowrap", active ? "text-primary" : "")}>{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
