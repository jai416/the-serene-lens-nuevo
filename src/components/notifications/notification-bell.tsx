"use client"

import { useEffect, useState, useRef, useCallback } from "react"
import { useSession } from "next-auth/react"
import { Bell, BellDot, CheckCheck, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"

type Notification = {
  id: string
  title: string
  message: string
  link: string | null
  read: boolean
  createdAt: string
}

type NotifData = {
  notifications: Notification[]
  unreadCount: number
}

function timeAgo(dateStr: string) {
  const now = Date.now()
  const date = new Date(dateStr).getTime()
  const diff = now - date
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "ahora"
  if (mins < 60) return `hace ${mins} min`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `hace ${hrs}h`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `hace ${days}d`
  return new Date(dateStr).toLocaleDateString("es-ES", { day: "numeric", month: "short" })
}

export function NotificationBell() {
  const { data: session } = useSession()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [data, setData] = useState<NotifData | null>(null)
  const [loading, setLoading] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const fetchNotifs = useCallback(async () => {
    if (!session?.user) return
    setLoading(true)
    try {
      const res = await fetch("/api/notifications?page=1&limit=5")
      const d = await res.json()
      if (d.success && Array.isArray(d.data?.notifications)) setData(d.data)
    } catch {
    } finally {
      setLoading(false)
    }
  }, [session])

  useEffect(() => {
    fetchNotifs()
    const interval = setInterval(fetchNotifs, 30000)
    return () => clearInterval(interval)
  }, [fetchNotifs])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    if (open) document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [open])

  if (!session?.user) return null

  async function markAsRead(id: string, link?: string | null) {
    try {
      await fetch(`/api/notifications/${id}`, { method: "PATCH" })
      setData((prev) => {
        if (!prev) return prev
        return {
          ...prev,
          unreadCount: Math.max(0, prev.unreadCount - 1),
          notifications: prev.notifications.map((n) =>
            n.id === id ? { ...n, read: true } : n
          ),
        }
      })
      if (link) router.push(link)
    } catch {}
  }

  async function markAllRead() {
    try {
      await fetch("/api/notifications/read-all", { method: "POST" })
      setData((prev) => {
        if (!prev) return prev
        return {
          ...prev,
          unreadCount: 0,
          notifications: prev.notifications.map((n) => ({ ...n, read: true })),
        }
      })
    } catch {}
  }

  const unread = data?.unreadCount ?? 0

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative flex items-center justify-center w-10 h-10 rounded-2xl bg-[#E2ECE0] dark:bg-[#2A3A2A] border border-[#88B078]/30 dark:border-[#88B078]/30 text-[#88B078] dark:text-[#88B078] hover:bg-[#88B078] dark:hover:bg-[#88B078] hover:text-white dark:hover:text-white shadow-sm hover:shadow-md transition-all duration-200"
        aria-label="Notificaciones"
      >
        {unread > 0 ? (
          <>
            <BellDot className="w-4.5 h-4.5" />
            <span className="absolute -top-1 -right-1 w-4.5 h-4.5 rounded-full bg-[#E07070] text-white text-[9px] font-bold flex items-center justify-center ring-2 ring-white dark:ring-[#222222]">
              {unread > 9 ? "9+" : unread}
            </span>
          </>
        ) : (
          <Bell className="w-4.5 h-4.5" />
        )}
      </button>

      {open && (
        <div
          className={cn(
            "absolute right-0 top-full mt-3 w-[360px] rounded-2xl bg-white dark:bg-[#222222] border border-[#E8E8E8] dark:border-[#333333] shadow-[0_12px_40px_rgba(0,0,0,0.12)] dark:shadow-[0_12px_40px_rgba(0,0,0,0.5)] overflow-hidden z-50"
          )}
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#E8E8E8] dark:border-[#333333]">
            <span className="text-sm font-semibold text-[#1A1A1A] dark:text-[#F0F0F0]">
              Notificaciones
            </span>
            {unread > 0 && (
              <button
                onClick={markAllRead}
                className="flex items-center gap-1 text-xs font-medium text-[#666666] dark:text-[#999999] hover:text-[#1A1A1A] dark:hover:text-[#F0F0F0] transition-colors"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                Marcar todo como leído
              </button>
            )}
          </div>

          <div className="max-h-[340px] overflow-y-auto">
            {loading && !data ? (
              <div className="p-6 text-center text-sm text-[#999999] dark:text-[#888888]">
                Cargando...
              </div>
            ) : !Array.isArray(data?.notifications) || data.notifications.length === 0 ? (
              <div className="p-6 text-center text-sm text-[#999999] dark:text-[#888888]">
                No tienes notificaciones
              </div>
            ) : (
              data.notifications.map((n) => (
                <button
                  key={n.id}
                  onClick={() => markAsRead(n.id, n.link)}
                  className={cn(
                    "w-full text-left px-4 py-3 flex items-start gap-3 transition-colors hover:bg-[#F8F9FA] dark:hover:bg-[#2A2A2A] border-b border-[#E8E8E8]/50 dark:border-[#333333]/50 last:border-b-0",
                    !n.read && "bg-[#F8F9FA] dark:bg-[#2A2A2A]"
                  )}
                >
                  <div
                    className={cn(
                      "w-2 h-2 rounded-full mt-1.5 shrink-0",
                      n.read ? "bg-transparent" : "bg-[#88B078]"
                    )}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#1A1A1A] dark:text-[#F0F0F0] truncate">
                      {n.title}
                    </p>
                    <p className="text-xs text-[#666666] dark:text-[#999999] mt-0.5 line-clamp-2">
                      {n.message}
                    </p>
                    <p className="text-[10px] text-[#999999] dark:text-[#888888] mt-1">
                      {timeAgo(n.createdAt)}
                    </p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      markAsRead(n.id)
                    }}
                    className="shrink-0 p-1 rounded-lg text-[#999999] dark:text-[#888888] hover:text-[#666666] dark:hover:text-[#999999] hover:bg-[#E2ECE0] dark:hover:bg-[#2A3A2A] transition-colors"
                    aria-label="Eliminar"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
