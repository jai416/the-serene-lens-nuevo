"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Bookmark, BookmarkCheck } from "lucide-react"

interface Props {
  productId: string
  className?: string
}

export function SaveProductButton({ productId, className = "" }: Props) {
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(false)

  const toggleSave = async () => {
    setLoading(true)
    try {
      if (saved) {
        const res = await fetch("/api/user/saved-products", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ productId }),
        })
        if (res.ok) setSaved(false)
      } else {
        const res = await fetch("/api/user/saved-products", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ productId }),
        })
        if (res.ok) setSaved(true)
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={toggleSave}
      disabled={loading}
      className={className}
    >
      {saved ? (
        <BookmarkCheck className="w-4 h-4 mr-1.5 text-[#88B078]" />
      ) : (
        <Bookmark className="w-4 h-4 mr-1.5" />
      )}
      {saved ? "Guardado" : "Guardar producto"}
    </Button>
  )
}
