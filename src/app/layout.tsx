import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Toaster } from "sonner"

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
})
import { AuthProvider } from "@/components/auth-provider"
import { QueryProvider } from "@/components/query-provider"
import { ThemeProvider } from "@/components/theme-provider"
import { Sidebar } from "@/components/layout/sidebar"
import { TopHeader } from "@/components/layout/top-header"
import { MobileNav } from "@/components/layout/mobile-nav"
import { ClientInit } from "@/components/client-init"
import { LiveChatWrapper } from "@/components/chat/live-chat-wrapper"
import { FeatureFlagProvider } from "@/components/feature-flag-provider"

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
    <html lang="es" suppressHydrationWarning className={inter.variable}>
      <head>
        <meta name="google-site-verification" content="FyNhwOqJ_JWdfoU_RZPYAqSNuHeuCXUgjmwDqT1cGXw" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="preconnect" href="https://api.groq.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://api.groq.com" />
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
              <FeatureFlagProvider>
                <Sidebar />
                <main id="main-content" className="md:ml-[280px] min-h-screen pb-20 md:pb-0 bg-[var(--background)]">
                  <TopHeader />
                  {children}
                </main>
                <MobileNav />
                <LiveChatWrapper />
                <Toaster
                  position="top-center"
                  toastOptions={{
                    className:
                      "!bg-white dark:!bg-[#222222] !border-[#E8E8E8] dark:!border-[#333333] !rounded-2xl !shadow-[0_4px_12px_rgba(0,0,0,0.08)] dark:!shadow-[0_4px_12px_rgba(0,0,0,0.3)] !text-[#1A1A1A] dark:!text-[#F0F0F0]",
                    duration: 4000,
                    style: {
                      borderLeft: "4px solid #88B078",
                    },
                  }}
                />
                <ClientInit />
              </FeatureFlagProvider>
            </AuthProvider>
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
