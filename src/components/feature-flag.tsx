"use client"

import { useEffect, useState } from "react"

export function FeatureFlag({ flag, fallback = null, children }: {
  flag: string
  fallback?: React.ReactNode
  children: React.ReactNode
}) {
  const [enabled, setEnabled] = useState<boolean | null>(null)

  useEffect(() => {
    fetch(`/api/admin/feature-flags`)
      .then((r) => r.json())
      .then((d) => {
        setEnabled(d?.data?.flags?.[flag] ?? false)
      })
      .catch(() => setEnabled(false))
  }, [flag])

  if (enabled === null) return fallback
  if (!enabled) return fallback
  return <>{children}</>
}
