"use client"

import { useRef, useState, useEffect } from "react"
import { Download, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"

interface Props {
  url: string
  size?: number
}

export default function QRCodeImage({ url, size = 200 }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null)
  const [generating, setGenerating] = useState(true)

  useEffect(() => {
    let cancelled = false
    setGenerating(true)

    const generate = async () => {
      try {
        const QRCode = (await import("qrcode")).default
        const dataUrl = await QRCode.toDataURL(url, {
          width: size,
          margin: 2,
          color: { dark: "#1A1A1A", light: "#FFFFFF" },
        })
        if (!cancelled) setQrDataUrl(dataUrl)
      } catch {
        const fallbackUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(url)}`
        if (!cancelled) setQrDataUrl(fallbackUrl)
      } finally {
        if (!cancelled) setGenerating(false)
      }
    }

    generate()
    return () => { cancelled = true }
  }, [url, size])

  const download = () => {
    if (!qrDataUrl) return
    const a = document.createElement("a")
    a.href = qrDataUrl
    a.download = "theserene-qr.png"
    a.click()
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-center">
        {qrDataUrl ? (
          <img
            src={qrDataUrl}
            alt="QR Code"
            width={size}
            height={size}
            className="rounded-xl border border-[#E8E8E8]"
          />
        ) : (
          <div
            className="rounded-xl border border-[#E8E8E8] bg-[#F8F9FA] flex items-center justify-center"
            style={{ width: size, height: size }}
          >
            {generating && <Loader2 className="w-6 h-6 animate-spin text-[#88B078]" />}
          </div>
        )}
      </div>
      <Button variant="secondary" size="sm" onClick={download} disabled={!qrDataUrl} className="w-full">
        <Download className="w-3.5 h-3.5 mr-1.5" />
        Descargar QR
      </Button>
    </div>
  )
}
