"use client"

import { SessionProvider } from "next-auth/react"
import { ReactNode } from "react"

export function AuthProvider({ children }: { children: ReactNode }) {
  return (
    <SessionProvider
      refetchOnWindowFocus={false}
      refetchInterval={5 * 60}
      refetchWhenOffline={false}
    >
      {children}
    </SessionProvider>
  )
}
