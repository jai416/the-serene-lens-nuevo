"use client"

import { useSession } from "next-auth/react"
import { redirect, usePathname, useRouter } from "next/navigation"
import { useEffect, useState, useCallback } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Bell, ChevronRight, CheckCheck, Loader2 } from "lucide-react"
import { formatDate } from "@/lib/utils"
import { toast } from "sonner"
import { useLocale } from "@/lib/locale/locale-context"
import { CardSkeleton } from "@/components/ui/skeleton"

interface Notification {
  id: string
  title: string
  message: string
  link: string | null
  read: boolean
  createdAt: string
}

export default function NotificationsPage() {
  const pathname = usePathname()
  const router = useRouter()
  const { locale } = useLocale()
  const { data: session, status } = useSession()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications")
      if (!res.ok) return
      const json = await res.json()
      const items = json?.data?.notifications ?? json?.notifications ?? []
      setNotifications(Array.isArray(items) ? items : [])
    } catch {
      toast.error("Error al cargar notificaciones")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (session) fetchNotifications()
  }, [session, fetchNotifications])

  const handleMarkRead = useCallback(async (id: string, link?: string | null) => {
    await fetch("/api/notifications", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    })
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    )
    if (link) router.push(link)
  }, [router])

  const handleMarkAllRead = useCallback(async () => {
    await fetch("/api/notifications", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    })
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
    toast.success(locale === "en" ? "All marked as read" : "Todo marcado como leído")
  }, [locale])

  if (status === "loading") {
    return (
      <div className="px-4 py-8">
        <div className="max-w-3xl mx-auto space-y-4">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      </div>
    )
  }

  if (!session) {
    redirect("/login?callbackUrl=" + encodeURIComponent(pathname))
  }

  const unreadCount = notifications.filter((n) => !n.read).length

  return (
    <div className="px-4 py-6 md:py-8">
      <div className="max-w-3xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#E2ECE0] flex items-center justify-center">
              <Bell className="w-5 h-5 text-[#88B078]" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-[#1A1A1A]">
                {locale === "en" ? "Notifications" : "Notificaciones"}
              </h1>
              {unreadCount > 0 && (
                <p className="text-xs text-[#666666]">
                  {locale === "en"
                    ? `You have ${unreadCount} unread`
                    : `Tienes ${unreadCount} sin leer`}
                </p>
              )}
            </div>
          </div>
          {unreadCount > 0 && (
            <Button
              variant="secondary"
              size="sm"
              className="gap-1.5 text-xs"
              onClick={handleMarkAllRead}
            >
              <CheckCheck className="w-3.5 h-3.5" />
              {locale === "en" ? "Mark all as read" : "Marcar todo como leído"}
            </Button>
          )}
        </div>

        {/* List */}
        {loading ? (
          <div className="space-y-3">
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
          </div>
        ) : notifications.length === 0 ? (
          <Card className="p-10 border border-[#E8E8E8]/60">
            <CardContent className="p-0 flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-2xl bg-[#F0F0F0] flex items-center justify-center mb-4">
                <Bell className="w-7 h-7 text-[#BBBBBB]" />
              </div>
              <h2 className="text-base font-semibold text-[#1A1A1A] mb-1">
                {locale === "en" ? "No notifications" : "No tienes notificaciones"}
              </h2>
              <p className="text-xs text-[#666666] max-w-xs">
                {locale === "en"
                  ? "We'll notify you when something important happens"
                  : "Te avisaremos cuando ocurra algo importante"}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {notifications.map((n) => (
              <button
                key={n.id}
                onClick={() => handleMarkRead(n.id, n.link)}
                className="w-full text-left"
              >
                <Card
                  className={`p-4 transition-all duration-200 border ${
                    n.read
                      ? "border-[#E8E8E8]/40 bg-white"
                      : "border-[#E8E8E8] bg-white shadow-sm"
                  } hover:-translate-y-0.5 cursor-pointer`}
                >
                  <CardContent className="p-0 flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        {!n.read && (
                          <span className="w-2 h-2 rounded-full bg-green-500 shrink-0" />
                        )}
                        <p
                          className={`text-sm truncate ${
                            n.read ? "text-[#666666]" : "text-[#1A1A1A] font-medium"
                          }`}
                        >
                          {n.title}
                        </p>
                      </div>
                      <p className="text-xs text-[#888888] mt-1 line-clamp-2">
                        {n.message}
                      </p>
                      <p className="text-[10px] text-[#AAAAAA] mt-1.5">
                        {formatDate(n.createdAt)}
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-[#BBBBBB] shrink-0 mt-1" />
                  </CardContent>
                </Card>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
