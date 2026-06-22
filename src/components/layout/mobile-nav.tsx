"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useSession } from "next-auth/react"
import { Home, Scan, History, Leaf, User } from "lucide-react"
import { cn } from "@/lib/utils"

const guestItems = [
  { href: "/", label: "Inicio", icon: Home },
  { href: "/products", label: "Productos", icon: Leaf },
]

const authItems = [
  { href: "/", label: "Inicio", icon: Home },
  { href: "/analysis", label: "Análisis", icon: Scan },
  { href: "/dashboard/history", label: "Historial", icon: History },
  { href: "/products", label: "Productos", icon: Leaf },
  { href: "/dashboard/profile", label: "Cuenta", icon: User },
]

export function MobileNav() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const items = session ? authItems : guestItems

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-[#DDE7D3]">
      <div className="flex items-center justify-around py-2 px-1 pb-[calc(0.5rem+env(safe-area-inset-bottom))] overflow-x-auto scrollbar-hide">
        {items.map((item) => {
          const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href)
          return (
            <Link
              key={`${item.href}-${item.label}`}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-0.5 px-2 sm:px-4 py-1.5 rounded-xl transition-all duration-200 relative shrink-0",
                active ? "text-[#2F3A2D]" : "text-[#8A9A82] hover:text-[#64705E]"
              )}
            >
              {active && (
                <span className="absolute -top-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[#C2E09D]" />
              )}
              <item.icon className="w-5 h-5" />
              <span className={cn("text-[10px] font-medium whitespace-nowrap", active ? "text-[#2F3A2D]" : "")}>{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
