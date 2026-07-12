"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useSession } from "next-auth/react"
import { Home, Scan, History, Leaf, User } from "lucide-react"
import { cn } from "@/lib/utils"
import { ThemeToggleCompact } from "@/components/theme-toggle"
import { useLocale } from "@/lib/locale/locale-context"
import { t } from "@/lib/locale/translations"
import type { TranslationKey } from "@/lib/locale/translations"

const guestItems: Array<{ href: string; labelKey: TranslationKey; icon: any }> = [
  { href: "/", labelKey: "nav.home", icon: Home },
  { href: "/products", labelKey: "nav.products", icon: Leaf },
]

const authItems: Array<{ href: string; labelKey: TranslationKey; icon: any }> = [
  { href: "/", labelKey: "nav.home", icon: Home },
  { href: "/analysis", labelKey: "nav.analysis", icon: Scan },
  { href: "/dashboard/history", labelKey: "nav.history", icon: History },
  { href: "/products", labelKey: "nav.products", icon: Leaf },
  { href: "/dashboard/profile", labelKey: "nav.profile", icon: User },
]

export function MobileNav() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const { locale } = useLocale()
  const items = session ? authItems : guestItems

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-[#222222] border-t border-[#E8E8E8] dark:border-[#333333]">
      <div className="flex items-center justify-around py-2 px-1 pb-[calc(0.5rem+env(safe-area-inset-bottom))] overflow-x-auto scrollbar-hide">
        {items.map((item) => {
          const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href)
          return (
            <Link
              key={`${item.href}-${item.label}`}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-0.5 px-2 sm:px-4 py-1.5 rounded-xl transition-all duration-200 relative shrink-0",
                active
                  ? "text-[#88B078] dark:text-[#88B078]"
                  : "text-[#999999] dark:text-[#888888] hover:text-[#88B078] dark:hover:text-[#88B078]"
              )}
            >
              {active && (
                <span className="absolute -top-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[#88B078]" />
              )}
              <item.icon className="w-5 h-5" />
              <span className={cn("text-[10px] font-medium whitespace-nowrap", active ? "text-[#88B078] dark:text-[#88B078]" : "")}>{t(item.labelKey, locale)}</span>
            </Link>
          )
        })}
        <ThemeToggleCompact />
      </div>
    </nav>
  )
}
