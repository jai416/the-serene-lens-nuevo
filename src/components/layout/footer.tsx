import Link from "next/link"
import { Scan, MessageCircle } from "lucide-react"

const whatsappNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || ""

export function Footer() {
  return (
    <footer className="border-t border-outline/20 bg-surface">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid sm:grid-cols-3 gap-8">
          <div>
            <Link href="/" className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
                <Scan className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="font-serif text-base font-semibold">The Serene Lens</span>
            </Link>
            <p className="text-sm text-muted-foreground">
              Análisis de piel con IA para una rutina más inteligente.
            </p>
          </div>

          <div>
            <h4 className="font-medium text-sm mb-3">Producto</h4>
            <div className="space-y-2">
              <Link href="/analysis" className="block text-sm text-muted-foreground hover:text-on-surface transition-colors">Análisis</Link>
              <Link href="/products" className="block text-sm text-muted-foreground hover:text-on-surface transition-colors">Productos</Link>
              <Link href="/pricing" className="block text-sm text-muted-foreground hover:text-on-surface transition-colors">Precios</Link>
            </div>
          </div>

          <div>
            <h4 className="font-medium text-sm mb-3">Información</h4>
            <div className="space-y-2">
              <Link href="/blog" className="block text-sm text-muted-foreground hover:text-on-surface transition-colors">Blog</Link>
              <Link href="/contact" className="block text-sm text-muted-foreground hover:text-on-surface transition-colors">Contacto</Link>
              <Link href="/privacy" className="block text-sm text-muted-foreground hover:text-on-surface transition-colors">Privacidad</Link>
              <Link href="/terms" className="block text-sm text-muted-foreground hover:text-on-surface transition-colors">Términos</Link>
              {whatsappNumber && (
                <a
                  href={`https://wa.me/${whatsappNumber}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-sm text-muted-foreground hover:text-green-500 transition-colors"
                >
                  <MessageCircle className="w-3.5 h-3.5 inline mr-1" />
                  WhatsApp
                </a>
              )}
            </div>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-outline/20 text-center text-xs text-muted-foreground">
          <p>© {new Date().getFullYear()} The Serene Lens. Todos los derechos reservados.</p>
          <p className="mt-1">
            Los resultados del análisis son informativos y no sustituyen una consulta médica profesional.
          </p>
        </div>
      </div>
    </footer>
  )
}
