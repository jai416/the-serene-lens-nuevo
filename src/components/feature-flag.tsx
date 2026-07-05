"use client"

import { useFeatureFlags } from "./feature-flag-provider"

export function FeatureFlag({ flag, fallback = null, children }: {
  flag: string
  fallback?: React.ReactNode
  children: React.ReactNode
}) {
  const { isEnabled } = useFeatureFlags()
  const enabled = isEnabled(flag)

  if (!enabled) return fallback
  return <>{children}</>
}
