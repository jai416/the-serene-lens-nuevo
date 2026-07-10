"use client"

import { useSession } from "next-auth/react"
import { NotificationBell } from "@/components/notifications/notification-bell"

const premiumPlans = new Set(["PREMIUM", "PRO", "PRO_PLUS", "ESTHETICIAN"])

export function TopHeader() {
  const { data: session } = useSession()

  if (!session?.user) return null

  const isPremium = premiumPlans.has(session.user.plan || "")

  return (
    <header className="sticky top-0 z-30 flex items-center justify-end gap-4 px-6 py-3 bg-white/80 dark:bg-[#222222]/80 backdrop-blur-md border-b border-[#E8E8E8] dark:border-[#333333]">
      <NotificationBell />
      <div className="flex items-center gap-3 pl-4 border-l border-[#E8E8E8] dark:border-[#333333]">
        <div className="w-9 h-9 rounded-full bg-[#88B078] dark:bg-[#88B078] flex items-center justify-center text-sm font-semibold text-white shadow-sm">
          {session.user.name?.charAt(0)?.toUpperCase() || "U"}
        </div>
        <div className="hidden sm:block">
          <p className="text-sm font-medium text-[#1A1A1A] dark:text-[#F0F0F0]">
            {session.user.name || "Usuario"}
          </p>
          {isPremium && (
            <p className="text-xs font-medium text-[#88B078]">Usuario Premium</p>
          )}
        </div>
      </div>
    </header>
  )
}
