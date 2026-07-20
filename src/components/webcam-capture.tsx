"use client"

import { useRef, useState, useEffect, useCallback } from "react"
import { Camera, Loader2, RotateCcw, Check, X } from "lucide-react"
import { Button } from "@/components/ui/button"

interface Props {
  onCapture: (blob: Blob) => void
  onClose: () => void
}

export default function WebcamCapture({ onCapture, onClose }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [state, setState] = useState<"loading" | "ready" | "captured">("loading")
  const [error, setError] = useState("")
  const [capturedBlob, setCapturedBlob] = useState<Blob | null>(null)
  const [capturedUrl, setCapturedUrl] = useState<string | null>(null)

  const startCamera = useCallback(async () => {
    setState("loading")
    setError("")
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } },
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }
      setState("ready")
    } catch {
      setError("No se pudo acceder a la cámara. Verifica los permisos.")
      setState("ready")
    }
  }, [])

  useEffect(() => {
    startCamera()
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop())
      if (capturedUrl) URL.revokeObjectURL(capturedUrl)
    }
  }, [startCamera, capturedUrl])

  const capture = () => {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas) return
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    ctx.drawImage(video, 0, 0)
    canvas.toBlob((blob) => {
      if (!blob) return
      setCapturedBlob(blob)
      setCapturedUrl(URL.createObjectURL(blob))
      setState("captured")
    }, "image/jpeg", 0.85)
  }

  const retake = () => {
    if (capturedUrl) URL.revokeObjectURL(capturedUrl)
    setCapturedBlob(null)
    setCapturedUrl(null)
    setState("ready")
  }

  const confirm = () => {
    if (capturedBlob) onCapture(capturedBlob)
  }

  return (
    <div className="space-y-3">
      <div className="relative rounded-xl overflow-hidden border border-[#E8E8E8] bg-black aspect-[4/3] flex items-center justify-center">
        {state === "loading" && (
          <div className="flex items-center gap-2 text-white">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-sm">Iniciando cámara...</span>
          </div>
        )}

        {error && (
          <div className="text-red-400 text-sm p-4 text-center">{error}</div>
        )}

        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`w-full h-full object-contain ${state === "ready" ? "block" : "hidden"}`}
        />

        {state === "captured" && capturedUrl && (
          <img src={capturedUrl} alt="Captura" className="w-full h-full object-contain" />
        )}

        <canvas ref={canvasRef} className="hidden" />
      </div>

      <div className="flex gap-2">
        {state === "ready" && !error && (
          <Button variant="primary" onClick={capture} className="flex-1">
            <Camera className="w-4 h-4 mr-2" />
            Tomar foto
          </Button>
        )}

        {state === "captured" && (
          <>
            <Button variant="secondary" onClick={retake} className="flex-1">
              <RotateCcw className="w-4 h-4 mr-2" />
              Repetir
            </Button>
            <Button variant="primary" onClick={confirm} className="flex-1">
              <Check className="w-4 h-4 mr-2" />
              Usar esta foto
            </Button>
          </>
        )}

        <Button variant="ghost" onClick={onClose} size="icon">
          <X className="w-4 h-4" />
        </Button>
      </div>
    </div>
  )
}
