"use client"

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react"

type FeatureFlagValue = {
  enabled: boolean
  message?: string
  redirectUrl?: string
}

type FeatureFlags = Record<string, FeatureFlagValue>

type FeatureFlagContextType = {
  flags: FeatureFlags
  loading: boolean
  isEnabled: (name: string) => boolean
  getFlag: (name: string) => FeatureFlagValue | undefined
  refresh: () => Promise<void>
}

const FeatureFlagContext = createContext<FeatureFlagContextType>({
  flags: {},
  loading: true,
  isEnabled: () => true,
  getFlag: () => undefined,
  refresh: async () => {},
})

export const useFeatureFlags = () => useContext(FeatureFlagContext)

export function FeatureFlagProvider({ children }: { children: ReactNode }) {
  const [flags, setFlags] = useState<FeatureFlags>({})
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/feature-flags")
      if (res.ok) {
        const data = await res.json()
        const flagsData = data?.data || data
        const flattened: FeatureFlags = {}
        if (Array.isArray(flagsData)) {
          for (const flag of flagsData) {
            try {
              flattened[flag.key] = typeof flag.value === "string" ? JSON.parse(flag.value) : flag.value
            } catch {
              flattened[flag.key] = { enabled: flag.value === "true" }
            }
          }
        }
        setFlags(flattened)
      }
    } catch {
      // Silently fail - flags disabled by default
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  const isEnabled = useCallback(
    (name: string) => flags[name]?.enabled ?? true,
    [flags]
  )

  const getFlag = useCallback(
    (name: string) => flags[name],
    [flags]
  )

  return (
    <FeatureFlagContext.Provider value={{ flags, loading, isEnabled, getFlag, refresh }}>
      {children}
    </FeatureFlagContext.Provider>
  )
}
