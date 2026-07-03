'use client'

import { useState, useEffect } from "react"

interface Step {
  title: string
  desc: string
}

const steps: Step[] = [
  {
    title: "👋 ¡Bienvenido a The Serene Lens!",
    desc: "Este es tu panel de control. Aquí verás todo sobre tu piel: análisis, evolución y más.",
  },
  {
    title: "🔬 Nuevo Análisis",
    desc: "Haz clic en 'Nuevo Análisis' para descubrir cómo es tu piel realmente. Solo necesitas 4 fotos.",
  },
  {
    title: "📊 Tu Historial",
    desc: "Revisa todos tus análisis anteriores y sigue la evolución de tu piel en el tiempo.",
  },
  {
    title: "⚙️ Tu Perfil",
    desc: "Configura tu cuenta, vincula Telegram y personaliza tu experiencia.",
  },
]

interface Props {
  onComplete?: () => void
}

export default function AppTour({ onComplete }: Props) {
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState(0)

  useEffect(() => {
    const completed = localStorage.getItem("tour_completed")
    if (!completed) setOpen(true)
  }, [])

  const handleComplete = () => {
    localStorage.setItem("tour_completed", "true")
    setOpen(false)
    onComplete?.()
  }

  if (!open) return null

  const current = steps[step]
  const isLast = step === steps.length - 1

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="relative mx-4 max-w-md rounded-2xl bg-white p-8 shadow-2xl dark:bg-gray-900">
        <button
          onClick={handleComplete}
          className="absolute right-4 top-4 text-lg text-gray-400 hover:text-gray-600"
        >
          Cerrar ✕
        </button>

        <h2 className="mb-2 text-xl font-bold">{current.title}</h2>
        <p className="mb-6 text-gray-600 dark:text-gray-300">{current.desc}</p>

        <div className="mb-4 flex justify-center gap-2">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`h-3 w-3 rounded-full ${
                i === step ? "bg-[#C2E09D]" : "bg-gray-300"
              }`}
            />
          ))}
        </div>

        <div className="flex items-center justify-between">
          {step > 0 ? (
            <button
              onClick={() => setStep(step - 1)}
              className="font-medium text-gray-500 hover:text-gray-700"
            >
              ← Anterior
            </button>
          ) : (
            <div />
          )}

          {isLast ? (
            <button
              onClick={handleComplete}
              className="rounded-lg bg-[#C2E09D] px-6 py-2 font-medium hover:bg-[#B0CF8D]"
            >
              ¡Listo! 🎉
            </button>
          ) : (
            <button
              onClick={() => setStep(step + 1)}
              className="rounded-lg bg-[#C2E09D] px-6 py-2 font-medium hover:bg-[#B0CF8D]"
            >
              Siguiente →
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
