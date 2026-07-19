"use client"

import { ReactNode } from "react"
import { SessionProvider } from "next-auth/react"

export function AuthProvider({ children }: { children: ReactNode }) {
  return (
    <SessionProvider
      refetchOnWindowFocus={true}
      refetchWhenOffline={false}
      refetchInterval={5 * 60}
    >
      {children}
    </SessionProvider>
  )
}
