"use client"

import { useRef, useState, useCallback, useEffect } from "react"
import { Camera, Loader2, X } from "lucide-react"
import { Button } from "@/components/ui/button"

interface WebcamCaptureProps {
  onCapture: (blob: Blob) => void
  onClose: () => void
}

export function WebcamCapture({ onCapture, onClose }: WebcamCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(true)
  const [captured, setCaptured] = useState(false)

  const startCamera = useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      const s = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      })
      setStream(s)
      if (videoRef.current) {
        videoRef.current.srcObject = s
      }
    } catch (err: any) {
      if (err.name === "NotAllowedError") {
        setError("Permiso denegado. Activa la cámara en los ajustes del navegador.")
      } else if (err.name === "NotFoundError") {
        setError("No se encontró ninguna cámara en este dispositivo.")
      } else {
        setError("No se pudo acceder a la cámara: " + (err.message || "Error desconocido"))
      }
    } finally {
      setLoading(false)
    }
  }, [])

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((t) => t.stop())
      setStream(null)
    }
  }, [stream])

  const capture = useCallback(() => {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas) return

    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    ctx.drawImage(video, 0, 0)
    canvas.toBlob(
      (blob) => {
        if (blob) {
          setCaptured(true)
          onCapture(blob)
        }
      },
      "image/jpeg",
      0.85
    )
  }, [onCapture])

  useEffect(() => {
    startCamera()
    return () => stopCamera()
  }, [startCamera, stopCamera])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-white rounded-2xl overflow-hidden max-w-lg w-full shadow-xl">
        <div className="flex items-center justify-between p-4 border-b border-[#E8E8E8]">
          <h3 className="font-semibold text-[#1A1A1A]">
            {captured ? "Foto capturada" : "Tomar foto"}
          </h3>
          <button
            onClick={() => { stopCamera(); onClose() }}
            className="p-1.5 rounded-lg hover:bg-[#F8F9FA]"
          >
            <X className="w-5 h-5 text-[#666666]" />
          </button>
        </div>

        <div className="p-4">
          <p className="text-xs text-[#666666] bg-[#E2ECE0] p-3 rounded-xl mb-4">
            La foto se usa solo para el análisis cosmético. No se comparte ni almacena fuera de tu cuenta.
          </p>

          <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-black mb-4">
            {loading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                <Loader2 className="w-8 h-8 animate-spin text-white" />
              </div>
            )}
            {error && (
              <div className="absolute inset-0 flex items-center justify-center bg-[#FEF2F2] p-4">
                <p className="text-sm text-center text-[#E07070]">{error}</p>
              </div>
            )}
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`w-full h-full object-cover ${captured ? "hidden" : ""}`}
            />
            <canvas ref={canvasRef} className="hidden" />
            {captured && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                <p className="text-white text-sm font-medium">Foto lista</p>
              </div>
            )}
          </div>

          <div className="flex gap-2">
            {captured ? (
              <>
                <Button variant="outline" className="flex-1" onClick={() => setCaptured(false)}>
                  <Camera className="w-4 h-4 mr-2" />
                  Repetir
                </Button>
                <Button
                  variant="primary"
                  className="flex-1"
                  onClick={() => { stopCamera(); onClose() }}
                >
                  Usar esta foto
                </Button>
              </>
            ) : (
              <Button
                variant="primary"
                className="w-full"
                onClick={capture}
                disabled={loading || !!error}
              >
                <Camera className="w-4 h-4 mr-2" />
                Capturar
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
