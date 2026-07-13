"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useSession, signOut } from "next-auth/react"
import { cn } from "@/lib/utils"
import Image from "next/image"
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
  Crown,
  ArrowRight,
  BookOpen,
  Bookmark,
  Trophy,
  FileText,
  HelpCircle,
} from "lucide-react"
import { useState } from "react"
import { useLocale } from "@/lib/locale/locale-context"
import { t } from "@/lib/locale/translations"
import type { TranslationKey } from "@/lib/locale/translations"

const guestLinks: Array<{ href: string; labelKey: TranslationKey; icon: any }> = [
  { href: "/", labelKey: "nav.home", icon: Home },
  { href: "/products", labelKey: "nav.products", icon: Package },
  { href: "/ingredients-analyzer", labelKey: "nav.ingredients", icon: Beaker },
]

const authLinks: Array<{ href: string; labelKey: TranslationKey; icon: any }> = [
  { href: "/", labelKey: "nav.home", icon: Home },
  { href: "/analysis", labelKey: "nav.analysis", icon: Scan },
  { href: "/dashboard/history", labelKey: "nav.history", icon: History },
  { href: "/dashboard/diary", labelKey: "nav.diary", icon: BookOpen },
  { href: "/dashboard/challenges", labelKey: "nav.challenges", icon: Trophy },
  { href: "/products", labelKey: "nav.products", icon: Package },
  { href: "/guides", labelKey: "nav.guides", icon: BookOpen },
  { href: "/ingredients-analyzer", labelKey: "nav.ingredients", icon: Beaker },
  { href: "/dashboard/subscription", labelKey: "sidebar.plan", icon: TrendingUp },
  { href: "/dashboard/report", labelKey: "sidebar.report", icon: FileText },
  { href: "/dashboard/guides", labelKey: "sidebar.myGuides", icon: Bookmark },
  { href: "/dashboard/support", labelKey: "nav.support", icon: HelpCircle },
  { href: "/dashboard/profile", labelKey: "nav.profile", icon: User },
]

export function Sidebar() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const { locale } = useLocale()
  const [mobileOpen, setMobileOpen] = useState(false)
  const links = session ? authLinks : guestLinks

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/"
    return pathname.startsWith(href)
  }

  const sidebarContent = (
    <div className="flex flex-col h-full bg-white">
      <div className="p-6 pb-4">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#88B078] flex items-center justify-center shadow-sm overflow-hidden">
            <Image src="/logo.webp" alt="The Serene Lens" width={40} height={40} className="w-full h-full object-cover" />
          </div>
          <div>
            <span className="block text-lg font-semibold leading-tight text-[#1A1A1A]">{t("app.name", locale)}</span>
            <span className="text-[11px] text-[#666666] block leading-tight">{t("sidebar.tagline", locale)}</span>
          </div>
        </Link>
      </div>

      <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto scrollbar-hide">
        {links.map((link) => {
          const active = isActive(link.href)
          return (
            <Link
              key={`${link.href}-${link.labelKey}`}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "flex items-center gap-3 px-4 py-2.5 text-sm font-medium rounded-xl transition-all duration-200",
                active
                  ? "bg-[#E2ECE0] text-[#1A1A1A]"
                  : "text-[#666666] hover:bg-[#F8F9FA] hover:text-[#1A1A1A]"
              )}
            >
              <link.icon className={cn("w-4.5 h-4.5 shrink-0", active ? "text-[#88B078]" : "text-[#999999]")} />
              {t(link.labelKey, locale)}
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
                ? "bg-[#E2ECE0] text-[#1A1A1A]"
                : "text-[#666666] hover:bg-[#F8F9FA] hover:text-[#1A1A1A]"
            )}
          >
            <Settings className="w-4.5 h-4.5 shrink-0" />
            {t("nav.admin", locale)}
          </Link>
        )}

        {(session?.user as any)?.plan === "ESTHETICIAN" && (
          <Link
            href="/dashboard/esthetician"
            onClick={() => setMobileOpen(false)}
            className={cn(
              "flex items-center gap-3 px-4 py-2.5 text-sm font-medium rounded-xl transition-all duration-200",
              isActive("/dashboard/esthetician")
                ? "bg-[#E2ECE0] text-[#1A1A1A]"
                : "text-[#666666] hover:bg-[#F8F9FA] hover:text-[#1A1A1A]"
            )}
          >
            <User className="w-4.5 h-4.5 shrink-0" />
            {t("nav.esthetician", locale)}
          </Link>
        )}

        <div className="pt-4 px-1">
          <div className="p-5 rounded-2xl bg-[#FFF9E6] border border-[#FCEAA6]/50">
            <Crown className="w-5 h-5 text-[#D4A843] mb-2" />
            <p className="text-sm font-semibold text-[#1A1A1A] mb-1">
              {t("sidebar.premiumVersion", locale)}
            </p>
            <p className="text-xs text-[#666666] leading-relaxed mb-3">
              {t("sidebar.premiumDesc", locale)}
            </p>
            <Link
              href="/pricing"
              onClick={() => setMobileOpen(false)}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#1A1A1A] bg-[#FCEAA6] rounded-full px-4 py-2 hover:bg-[#F5E090] transition-colors"
            >
              {t("sidebar.upgradeNow", locale)}
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </nav>

      <div className="p-3 border-t border-[#E8E8E8]">
        {session ? (
          <div className="space-y-1">
              <Link
                href="/dashboard/profile"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-3 px-4 py-2.5 text-sm rounded-xl text-[#666666] hover:bg-[#E2ECE0] hover:text-[#1A1A1A] transition-all duration-200"
              >
                <User className="w-4.5 h-4.5 shrink-0 text-[#88B078]" />
                <span className="truncate">{session.user.name || session.user.email}</span>
              </Link>
            <button
              onClick={() => signOut()}
              className="flex items-center gap-3 px-4 py-2.5 text-sm rounded-xl text-[#666666] hover:bg-[#E2ECE0] hover:text-[#1A1A1A] transition-all duration-200 w-full text-left"
            >
              <LogOut className="w-4.5 h-4.5 shrink-0 text-[#88B078]" />
              {t("nav.logout", locale)}
            </button>
          </div>
        ) : (
          <Link
            href="/login"
            onClick={() => setMobileOpen(false)}
            className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium rounded-xl bg-[#88B078] text-white hover:bg-[#78A068] transition-all duration-200 mt-1"
          >
            <User className="w-4.5 h-4.5 shrink-0" />
            {t("sidebar.login", locale)}
          </Link>
        )}
        <p className="text-[10px] text-[#999999] text-center mt-2">
          &copy; {new Date().getFullYear()} The Serene Lens
        </p>
      </div>
    </div>
  )

  return (
    <>
      <aside className="hidden md:flex fixed left-0 top-0 h-screen w-[280px] z-40 flex-col border-r border-[#E8E8E8] bg-white">
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
          "md:hidden fixed top-0 left-0 h-screen w-[280px] z-50 bg-white flex-col transition-transform duration-300 border-r border-[#E8E8E8]",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {sidebarContent}
      </aside>

      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="md:hidden fixed top-4 left-4 z-50 w-10 h-10 rounded-xl bg-white border border-[#E8E8E8] flex items-center justify-center shadow-sm"
        aria-label={t("sidebar.menuLabel", locale)}
      >
        {mobileOpen ? <X className="w-5 h-5 text-[#1A1A1A]" /> : <Menu className="w-5 h-5 text-[#1A1A1A]" />}
      </button>
    </>
  )
}
