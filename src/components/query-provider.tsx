"use client"

import { ReactNode, useState, createElement, ComponentType } from "react"

let ProviderComponent: ComponentType<{ children: ReactNode }> | null = null

try {
  const mod = Function('r', 'return require(r)')("@tanstack/react-query") as any
  if (mod?.QueryClientProvider && mod?.QueryClient) {
    const { QueryClientProvider, QueryClient } = mod
    ProviderComponent = function QP({ children }: { children: ReactNode }) {
      const [client] = useState(() => new QueryClient({
        defaultOptions: {
          queries: { staleTime: 30 * 1000, retry: 1, refetchOnWindowFocus: false },
        },
      }))
      return createElement(QueryClientProvider, { client }, children)
    }
  }
} catch {
  // @tanstack/react-query not installed — render children directly
}

export function QueryProvider({ children }: { children: ReactNode }) {
  if (!ProviderComponent) return <>{children}</>
  return createElement(ProviderComponent, null, children)
}
