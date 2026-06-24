"use client"

import { useEffect, useRef } from "react"
import { toast } from "sonner"

export function NewUserToast() {
  const lastCount = useRef<number | null>(null)

  useEffect(() => {
    const check = async () => {
      try {
        const res = await fetch("/api/admin/stats")
        if (!res.ok) return
        const data = await res.json()
        const current = data?.stats?.users
        if (current != null && lastCount.current != null && current > lastCount.current) {
          const diff = current - lastCount.current
          toast.success(`${diff} nuevo${diff > 1 ? "s" : ""} usuario${diff > 1 ? "s" : ""}`, {
            description: "El panel se ha actualizado",
            duration: 5000,
          })
        }
        if (current != null) lastCount.current = current
      } catch {}
    }

    const interval = setInterval(check, 10000)
    return () => clearInterval(interval)
  }, [])

  return null
}
