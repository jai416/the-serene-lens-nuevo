"use client"

import { useSession } from "next-auth/react"
import { redirect, usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { BookmarkCheck, AlertTriangle, Info, Trash2, ExternalLink } from "lucide-react"
import { ListSkeleton } from "@/components/ui/skeleton"
interface Product {
  id: string
  name: string
  slug: string
  description: string
  category: string
  ingredients: string | null
  image: string
}

interface SavedProduct {
  id: string
  createdAt: string
  product: Product
}

interface Conflict {
  type: "warning" | "caution"
  ingredients: [string, string]
  description: string
  suggestion: string
}

export default function MyProductsPage() {
  const pathname = usePathname()
  const { data: session, status } = useSession()
  const [saved, setSaved] = useState<SavedProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [conflicts, setConflicts] = useState<Conflict[]>([])

  const fetchSaved = () => {
    fetch("/api/user/saved-products")
      .then((res) => res.ok ? res.json() : { data: { savedProducts: [] } })
      .then(async (data) => {
        const items = data?.data?.savedProducts || data?.savedProducts || []
        setSaved(Array.isArray(items) ? items : [])

        // Detect conflicts between all saved products
        if (items.length >= 2) {
          const allConflicts: Conflict[] = []
          for (let i = 0; i < items.length; i++) {
            for (let j = i + 1; j < items.length; j++) {
              const p1 = items[i].product
              const p2 = items[j].product
              if (p1.ingredients && p2.ingredients) {
                try {
                  const res = await fetch("/api/ingredients/check-conflicts", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ ingredients: p1.ingredients, savedProductIngredients: [p2.ingredients] }),
                  })
                  const result = await res.json()
                  const conflictsData = result?.data?.conflicts || result?.conflicts || []
                  allConflicts.push(...conflictsData)
                } catch {}
              }
            }
          }
          // Deduplicate
          const seen = new Set()
          setConflicts(allConflicts.filter((c) => {
            const key = `${c.ingredients.sort().join("-")}`
            if (seen.has(key)) return false
            seen.add(key)
            return true
          }))
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    if (session) fetchSaved()
  }, [session])

  if (status === "loading") {
    return (
      <div className="min-h-screen px-4 py-8">
        <div className="max-w-3xl mx-auto space-y-4">
          <ListSkeleton rows={5} />
        </div>
      </div>
    )
  }

  if (!session) redirect("/login?callbackUrl=" + encodeURIComponent(pathname))

  const removeProduct = async (productId: string) => {
    await fetch("/api/user/saved-products", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId }),
    })
    fetchSaved()
  }

  return (
    <div className="min-h-screen px-4 py-8">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <Badge variant="mint" className="mb-4 rounded-full px-4 py-1.5 border-0">
            <BookmarkCheck className="w-3.5 h-3.5 mr-2" />
            Mis Productos
          </Badge>
          <h1 className="font-serif text-3xl sm:text-4xl font-semibold text-[#1A1A1A]">
            Mis Productos
          </h1>
          <p className="text-sm text-[#666666] mt-2">
            Guarda tus productos favoritos y descubre si hay conflictos entre sus ingredientes.
          </p>
        </div>

        {conflicts.length > 0 && (
          <div className="mb-8 space-y-3">
            <h2 className="text-lg font-semibold text-[#1A1A1A] flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-[#D4A574]" />
              Posibles conflictos detectados
            </h2>
            {conflicts.map((c, i) => (
              <Card key={i} className={`border-l-4 ${c.type === "warning" ? "border-l-[#DC2626]" : "border-l-[#D4A574]"}`}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className={`w-5 h-5 mt-0.5 ${c.type === "warning" ? "text-[#DC2626]" : "text-[#D4A574]"}`} />
                    <div>
                      <p className="text-sm font-medium text-[#1A1A1A]">
                        {c.ingredients[0]} + {c.ingredients[1]}
                      </p>
                      <p className="text-xs text-[#666666] mt-1">{c.description}</p>
                      <p className="text-xs text-[#88B078] mt-1">{c.suggestion}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {loading ? (
          <ListSkeleton rows={5} />
        ) : saved.length === 0 ? (
          <Card className="p-8 text-center">
            <CardContent className="p-0">
              <div className="w-14 h-14 rounded-2xl bg-[#E2ECE0] flex items-center justify-center mx-auto mb-4">
                <BookmarkCheck className="w-6 h-6 text-[#1A1A1A]" />
              </div>
              <p className="text-[#666666] mb-4">Aún no has guardado productos.</p>
              <Link href="/products">
                <Button variant="outline">Explorar productos</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {saved.map((s) => (
              <Card key={s.id} className="transition-all duration-200">
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-[#E2ECE0] flex items-center justify-center flex-shrink-0">
                      <span className="text-lg">{s.product.category === "serum" ? "🧴" : s.product.category === "cleanser" ? "🧼" : "🧪"}</span>
                    </div>
                    <div className="min-w-0">
                      <Link href={`/products/${s.product.slug}`}>
                        <p className="text-sm font-medium text-[#1A1A1A] hover:underline truncate">
                          {s.product.name}
                        </p>
                      </Link>
                      <p className="text-xs text-[#666666] truncate">{s.product.description}</p>
                      {s.product.ingredients && (
                        <div className="flex items-center gap-1 mt-1">
                          <Info className="w-3 h-3 text-[#9BAA93]" />
                          <span className="text-[10px] text-[#9BAA93]">
                            {s.product.ingredients.slice(0, 80)}...
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-2">
                    <Link href={`/products/${s.product.slug}`}>
                      <Button variant="ghost" size="icon" className="w-8 h-8">
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                    </Link>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="w-8 h-8 text-[#DC2626]"
                      onClick={() => removeProduct(s.product.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <div className="mt-8 text-center">
          <Link href="/products">
            <Button variant="outline" className="gap-2">
              <ExternalLink className="w-4 h-4" />
              Explorar más productos
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
