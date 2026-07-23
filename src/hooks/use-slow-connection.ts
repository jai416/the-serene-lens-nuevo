"use client"

import { useEffect, useState } from "react"

export function useSlowConnection(): boolean {
  const [isSlow, setIsSlow] = useState(false)

  useEffect(() => {
    if (!("connection" in navigator)) return

    const connection = (navigator as { connection?: { effectiveType?: string; addEventListener: (e: string, f: () => void) => void; removeEventListener: (e: string, f: () => void) => void } }).connection
    if (!connection) return

    const check = () => {
      setIsSlow(connection.effectiveType === "slow-2g" || connection.effectiveType === "2g" || connection.effectiveType === "3g")
    }

    check()
    connection.addEventListener("change", check)
    return () => connection.removeEventListener("change", check)
  }, [])

  return isSlow
}
