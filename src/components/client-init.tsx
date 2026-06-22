"use client"

import { useEffect } from "react"
import { initSentry } from "@/lib/sentry"
import { initAnalytics, identifyUser } from "@/lib/analytics"

export function ClientInit() {
  useEffect(() => {
    initSentry()
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
