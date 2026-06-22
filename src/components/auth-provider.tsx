"use client"

import { ReactNode } from "react"
import { SessionProvider } from "next-auth/react"

export function AuthProvider({ children }: { children: ReactNode }) {
  return (
    <SessionProvider
      refetchOnWindowFocus={false}
      refetchWhenOffline={false}
    >
      {children}
    </SessionProvider>
  )
}
