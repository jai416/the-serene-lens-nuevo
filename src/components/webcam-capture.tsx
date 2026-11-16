"use client"

import { useRef, useState, useEffect, useCallback } from "react"
import { Camera, Loader2, RotateCcw, Check, X, SwitchCamera } from "lucide-react"
import { Button } from "@/components/ui/button"

interface Props {
  onCapture: (blob: Blob) => void
  onClose: () => void
}

type Facing = "environment" | "user"

export default function WebcamCapture({ onCapture, onClose }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const capturedUrlRef = useRef<string | null>(null)
  const [state, setState] = useState<"loading" | "ready" | "captured">("loading")
  const [error, setError] = useState("")
  const [facing, setFacing] = useState<Facing>("environment")
  const [canFlip, setCanFlip] = useState(false)
  const [capturedBlob, setCapturedBlob] = useState<Blob | null>(null)
  const [capturedUrl, setCapturedUrl] = useState<string | null>(null)

  const startCamera = useCallback(async (targetFacing?: Facing) => {
    const want: Facing = targetFacing ?? "environment"
    setState("loading")
    setError("")
    try {
      // Detección de contexto seguro: en HTTP (no localhost) mediaDevices no existe
      if (!navigator.mediaDevices?.getUserMedia) {
        setError("Tu navegador no permite acceder a la cámara. Asegúrate de estar en una conexión segura (HTTPS) y de usar un navegador moderno.")
        setState("ready")
        return
      }

      // Parar stream anterior (al girar la cámara o al reintentar)
      streamRef.current?.getTracks().forEach((t) => t.stop())

      // Cadena de intentos: cámara trasera EXACTA (móvil) → trasera flexible → cualquier cámara (escritorio)
      const attempts: MediaStreamConstraints[] = [
        { video: { facingMode: { exact: want }, width: { ideal: 1280 }, height: { ideal: 720 } } },
        { video: { facingMode: want, width: { ideal: 1280 }, height: { ideal: 720 } } },
        { video: { width: { ideal: 1280 }, height: { ideal: 720 } } },
      ]
      let stream: MediaStream | null = null
      let lastErr: unknown = null
      for (const constraints of attempts) {
        try {
          stream = await navigator.mediaDevices.getUserMedia(constraints)
          break
        } catch (e) {
          lastErr = e
        }
      }
      if (!stream) throw lastErr instanceof Error ? lastErr : new Error("camera_failed")

      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }
      setFacing(want)
      setState("ready")

      // ¿Hay más de una cámara para poder girar?
      try {
        const devices = await navigator.mediaDevices.enumerateDevices()
        setCanFlip(devices.filter((d) => d.kind === "videoinput").length > 1)
      } catch {
        setCanFlip(false)
      }
    } catch (e) {
      const name = e instanceof Error ? e.name : ""
      if (name === "NotAllowedError" || name === "SecurityError") {
        setError("Permiso de cámara denegado. Haz clic en el ícono de cámara o candado en la barra de direcciones para permitir el acceso y vuelve a intentar.")
      } else if (name === "NotFoundError" || name === "OverconstrainedError") {
        setError("No se detectó ninguna cámara en este dispositivo.")
      } else if (name === "NotReadableError") {
        setError("La cámara está en uso por otra aplicación. Ciérrala y reintenta.")
      } else {
        setError("No se pudo acceder a la cámara. Verifica los permisos.")
      }
      setState("ready")
    }
  }, [])

  // IMPORTANTE: capturedUrl NO es dependencia — si lo fuera, al capturar la foto
  // el effect se re-ejecutaría, pararía el stream y reiniciaría la cámara,
  // perdiendo la imagen capturada. La cámara solo se detiene al desmontar.
  useEffect(() => {
    startCamera()
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop())
      if (capturedUrlRef.current) URL.revokeObjectURL(capturedUrlRef.current)
    }
  }, [startCamera])

  const flip = () => {
    startCamera(facing === "environment" ? "user" : "environment")
  }

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
      const url = URL.createObjectURL(blob)
      setCapturedBlob(blob)
      setCapturedUrl(url)
      capturedUrlRef.current = url
      setState("captured")
    }, "image/jpeg", 0.85)
  }

  const retake = () => {
    if (capturedUrl) URL.revokeObjectURL(capturedUrl)
    capturedUrlRef.current = null
    setCapturedBlob(null)
    setCapturedUrl(null)
    setState("ready")
  }

  const confirm = () => {
    if (capturedUrlRef.current) {
      URL.revokeObjectURL(capturedUrlRef.current)
      capturedUrlRef.current = null
    }
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
          className={`w-full h-full object-contain ${state === "ready" && !error ? "block" : "hidden"}`}
        />

        {state === "captured" && capturedUrl && (
          <img src={capturedUrl} alt="Captura" className="w-full h-full object-contain" />
        )}

        <canvas ref={canvasRef} className="hidden" />
      </div>

      <div className="flex gap-2">
        {error && (
          <Button variant="primary" onClick={() => startCamera()} className="flex-1">
            <RotateCcw className="w-4 h-4 mr-2" />
            Reintentar cámara
          </Button>
        )}

        {state === "ready" && !error && (
          <>
            <Button variant="primary" onClick={capture} className="flex-1">
              <Camera className="w-4 h-4 mr-2" />
              Tomar foto
            </Button>
            {canFlip && (
              <Button
                variant="secondary"
                onClick={flip}
                title={facing === "environment" ? "Cambiar a cámara frontal" : "Cambiar a cámara trasera"}
              >
                <SwitchCamera className="w-4 h-4 mr-2" />
                Girar
              </Button>
            )}
          </>
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
