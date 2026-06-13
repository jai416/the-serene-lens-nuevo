import type { Metadata } from "next"
import "./globals.css"
import { Toaster } from "sonner"
import { AuthProvider } from "@/components/auth-provider"
import { Sidebar } from "@/components/layout/sidebar"
import { MobileNav } from "@/components/layout/mobile-nav"

export const metadata: Metadata = {
  title: "The Serene Lens | Observación Cosmética de tu Piel",
  description:
    "Descubre las características visibles de tu piel con observaciones cosméticas personalizadas y recomendaciones educativas.",
  openGraph: {
    title: "The Serene Lens | Observación Cosmética de tu Piel",
    description: "Descubre tu piel y construye una rutina personalizada.",
    siteName: "The Serene Lens",
    locale: "es_ES",
    type: "website",
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className="min-h-screen antialiased">
        <AuthProvider>
          <Sidebar />
          <main id="main-content" className="md:ml-[280px] min-h-screen pb-20 md:pb-0 pt-16 md:pt-0">
            {children}
          </main>
          <MobileNav />
          <Toaster
            position="top-center"
            toastOptions={{
              className:
                "!bg-[rgba(0,0,0,0.7)] !backdrop-blur-[25px] !border-[rgba(255,255,255,0.25)] !rounded-2xl !shadow-[0_8px_32px_rgba(0,0,0,0.20)]",
              duration: 4000,
            }}
          />
        </AuthProvider>
      </body>
    </html>
  )
}
