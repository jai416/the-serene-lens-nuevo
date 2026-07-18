"use client"

import { Component, type ReactNode } from "react"
import { captureError } from "@/lib/sentry"

interface Props {
  children: ReactNode
  fallback?: ReactNode
  context?: string
}

interface State {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    captureError(error, {
      context: this.props.context || "ErrorBoundary",
      componentStack: errorInfo.componentStack,
    })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback
      return (
        <div className="flex flex-col items-center justify-center min-h-[200px] p-8">
          <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mb-4">
            <span className="text-red-500 text-xl font-bold">!</span>
          </div>
          <h2 className="text-lg font-semibold text-[#1A1A1A] mb-2">Algo salió mal</h2>
          <p className="text-sm text-[#666666] mb-4 text-center">
            Ocurrió un error inesperado. Intenta recargar la página.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 rounded-xl bg-[#88B078] text-white text-sm font-medium hover:bg-[#6F9A5E] transition-colors"
          >
            Recargar página
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
