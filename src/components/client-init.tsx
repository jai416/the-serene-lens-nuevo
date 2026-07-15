"use client"

import { useEffect } from "react"
import { initAnalytics, identifyUser } from "@/lib/analytics"

export function ClientInit() {
  useEffect(() => {
    initAnalytics()
  }, [])

  useEffect(() => {
    fetch("/api/auth/session")
      .then((res) => res.json())
      .then((session) => {
        if (session?.user) {
          identifyUser(session.user.id, {
            email: session.user.email || undefined,
            name: session.user.name || undefined,
            plan: (session.user as any).plan || "FREE",
          })
        }
      })
      .catch(() => {})
  }, [])

  return null
}
