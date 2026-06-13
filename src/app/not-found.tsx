import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Home } from "lucide-react"

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <p className="text-6xl font-serif font-bold gradient-text mb-4">404</p>
        <h1 className="font-serif text-2xl font-semibold mb-2">Página no encontrada</h1>
        <p className="text-muted-foreground text-sm mb-6">
          La página que buscas no existe o ha sido movida.
        </p>
        <Link href="/">
          <Button className="rounded-full">
            <Home className="w-4 h-4 mr-2" />
            Volver al inicio
          </Button>
        </Link>
      </div>
    </div>
  )
}
