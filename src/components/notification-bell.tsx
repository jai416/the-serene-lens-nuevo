"use client"

import { useState, useEffect, useCallback } from "react"
import { useSession } from "next-auth/react"
import Link from "next/link"
import { Bell, BellRing } from "lucide-react"

export default function NotificationBell() {
  const { data: session } = useSession()
  const [unread, setUnread] = useState(0)

  const fetchUnread = useCallback(async () => {
    if (!session?.user?.id) return
    try {
      const res = await fetch("/api/notifications/unread-count")
      if (res.ok) {
        const d = await res.json()
        setUnread(d?.data?.count ?? d?.count ?? 0)
      }
    } catch {}
  }, [session])

  useEffect(() => {
    fetchUnread()
    const interval = setInterval(fetchUnread, 30000)
    return () => clearInterval(interval)
  }, [fetchUnread])

  if (!session?.user) return null

  return (
    <Link href="/dashboard/notifications" className="relative p-2 rounded-xl hover:bg-[#E2ECE0] transition-colors" aria-label="Notificaciones">
      {unread > 0 ? (
        <>
          <BellRing className="w-5 h-5 text-[#88B078]" />
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] flex items-center justify-center font-bold">
            {unread > 9 ? "9+" : unread}
          </span>
        </>
      ) : (
        <Bell className="w-5 h-5 text-[#666666]" />
      )}
    </Link>
  )
}
