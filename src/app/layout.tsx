import type { Metadata } from "next"
import "./globals.css"
import { Toaster } from "sonner"
import { AuthProvider } from "@/components/auth-provider"
import { QueryProvider } from "@/components/query-provider"
import { ThemeProvider } from "@/components/theme-provider"
import { Sidebar } from "@/components/layout/sidebar"
import { MobileNav } from "@/components/layout/mobile-nav"
import { ClientInit } from "@/components/client-init"

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://the-serene-lens-nuevo.onrender.com"),
  title: {
    template: "%s | The Serene Lens",
    default: "The Serene Lens | Observación Cosmética de tu Piel",
  },
  description:
    "Descubre las características visibles de tu piel con observaciones cosméticas personalizadas y recomendaciones educativas.",
  openGraph: {
    title: "The Serene Lens | Observación Cosmética de tu Piel",
    description: "Descubre tu piel y construye una rutina personalizada.",
    siteName: "The Serene Lens",
    locale: "es_ES",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "The Serene Lens | Observación Cosmética",
    description: "Descubre las características visibles de tu piel con observaciones personalizadas.",
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <meta name="google-site-verification" content="FyNhwOqJ_JWdfoU_RZPYAqSNuHeuCXUgjmwDqT1cGXw" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="preconnect" href="https://api.openrouter.ai" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://api.openrouter.ai" />
        <link rel="preconnect" href="https://api.qvapay.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://api.qvapay.com" />
        <link rel="preconnect" href="https://api.resend.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://api.resend.com" />
        <link rel="preconnect" href="https://app.posthog.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://app.posthog.com" />
        <link rel="preconnect" href="https://o4511315853246464.ingest.us.sentry.io" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://o4511315853246464.ingest.us.sentry.io" />
        <link rel="dns-prefetch" href="https://www.qvapay.com" />
        {process.env.NODE_ENV === "production" && (
          <script
            dangerouslySetInnerHTML={{
              __html: `
                if ("serviceWorker" in navigator) {
                  window.addEventListener("load", () => {
                    navigator.serviceWorker.register("/sw.js")
                  })
                }
              `,
            }}
          />
        )}
      </head>
      <body className="min-h-screen antialiased bg-[var(--surface)]">
        <ThemeProvider>
          <QueryProvider>
            <AuthProvider>
              <Sidebar />
              <main id="main-content" className="md:ml-[280px] min-h-screen pb-20 md:pb-0 bg-[var(--background)]">
                {children}
              </main>
              <MobileNav />
              <Toaster
                position="top-center"
                toastOptions={{
                  className:
                    "!bg-white dark:!bg-[#222920] !border-[#DDE7D3] dark:!border-[#3A4536] !rounded-2xl !shadow-[0_4px_12px_rgba(47,58,45,0.08)] dark:!shadow-[0_4px_12px_rgba(0,0,0,0.3)] !text-[#2F3A2D] dark:!text-[#E8EDE6]",
                  duration: 4000,
                  style: {
                    borderLeft: "4px solid #C2E09D",
                  },
                }}
              />
              <ClientInit />
            </AuthProvider>
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
