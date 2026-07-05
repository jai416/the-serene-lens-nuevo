"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
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
import { cn } from "@/lib/utils"

const tabs = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/analysis", label: "Nuevo Análisis", icon: Sparkles },
  { href: "/dashboard/history", label: "Historial", icon: History },
  { href: "/dashboard/diary", label: "Mi Diario", icon: BookOpen },
  { href: "/dashboard/challenges", label: "Desafíos", icon: Trophy },
  { href: "/dashboard/report", label: "Informe", icon: FileText },
  { href: "/dashboard/referrals", label: "Referidos", icon: Users },
  { href: "/dashboard/guides", label: "Mis Guías", icon: BookOpen },
  { href: "/dashboard/subscription", label: "Suscripción", icon: CreditCard },
  { href: "/dashboard/profile", label: "Perfil", icon: User },
  { href: "/dashboard/support", label: "Soporte", icon: HelpCircle },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <div className="min-h-screen bg-[#FFF8F0]">
      <div className="sticky top-0 z-30 bg-[#FFF8F0]/95 backdrop-blur-sm border-b border-[#E8DDD0] overflow-x-auto">
        <nav className="flex items-center gap-1 px-4 py-2 min-w-max">
          {tabs.map((tab) => {
            const active = tab.href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(tab.href)
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0",
                  active
                    ? "bg-[#E8D5C4] text-[#3D3229]"
                    : "text-[#3D3229]/60 hover:bg-[#E8DDD0] hover:text-[#3D3229]"
                )}
              >
                <tab.icon className="w-3.5 h-3.5" />
                {tab.label}
              </Link>
            )
          })}
        </nav>
      </div>
      <div className="p-4 md:p-6 lg:p-8 max-w-6xl mx-auto">
        {children}
      </div>
    </div>
  )
}
