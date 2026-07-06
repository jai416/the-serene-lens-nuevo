"use client"

import { useState } from "react"

type WeekPlan = {
  numero: number
  titulo: string
  enfoque: string
  metas: string[]
  tips: string[]
  productos_sugeridos: string[]
}

type Plan = {
  resumen: string
  objetivo_principal: string
  semanas: WeekPlan[]
  seguimiento: string
}

export function ImprovementPlan({ analysisId }: { analysisId: string }) {
  const [plan, setPlan] = useState<Plan | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  async function generate() {
    setLoading(true)
    setError("")
    setPlan(null)
    try {
      const res = await fetch(`/api/analysis/${analysisId}/improvement-plan`, { method: "POST" })
      const data = await res.json()
      if (data.success) setPlan(data.data.plan)
      else setError("Error al generar plan")
    } catch {
      setError("Error de conexión")
    } finally {
      setLoading(false)
    }
  }

  if (plan) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">🗺️ Ruta de Mejora</h2>
          <button onClick={() => setPlan(null)} className="text-sm text-gray-500 hover:text-gray-700">✕ Cerrar</button>
        </div>
        <div className="p-4 bg-[#88B078]/20 dark:bg-green-900/20 rounded-xl">
          <p className="font-semibold text-[#1A1A1A] dark:text-white">🎯 {plan.objetivo_principal}</p>
          <p className="text-gray-600 dark:text-gray-300 mt-1">{plan.resumen}</p>
        </div>
        {(plan.semanas || []).map((week) => (
          <div key={week.numero} className="border border-[#E8E8E8] dark:border-gray-700 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="bg-[#88B078] text-[#1A1A1A] w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm">S{week.numero}</span>
              <div>
                <h3 className="font-semibold">{week.titulo}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">{week.enfoque}</p>
              </div>
            </div>
            <div className="space-y-3 ml-10">
              <div>
                <p className="text-sm font-medium text-[#666666] dark:text-gray-400 mb-1">🎯 Metas</p>
                <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-300 space-y-0.5">
                  {(week.metas || []).map((m, i) => <li key={i}>{m}</li>)}
                </ul>
              </div>
              {week.tips?.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-[#666666] dark:text-gray-400 mb-1">💡 Tips</p>
                  <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-300 space-y-0.5">
                    {week.tips.map((t, i) => <li key={i}>{t}</li>)}
                  </ul>
                </div>
              )}
              {week.productos_sugeridos?.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-[#666666] dark:text-gray-400 mb-1">🧴 Productos sugeridos</p>
                  <div className="flex flex-wrap gap-1">
                    {week.productos_sugeridos.map((p, i) => (
                      <span key={i} className="px-2 py-0.5 bg-[#F8F9FA] dark:bg-gray-800 rounded-full text-xs">{p}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
        <div className="p-4 bg-[#E2ECE0] dark:bg-green-900/20 rounded-xl">
          <h4 className="font-semibold text-[#1A1A1A] dark:text-white mb-1">📊 Seguimiento</h4>
          <p className="text-gray-600 dark:text-gray-300">{plan.seguimiento}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 bg-[#F8F9FA] dark:bg-gray-800 rounded-xl">
      <h3 className="font-semibold text-lg mb-2">🗺️ Ruta de Mejora de 30 Días</h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Genera un plan personalizado con metas semanales basado en tu análisis de piel.</p>
      {error && <p className="text-red-500 text-sm mb-2">{error}</p>}
      <button
        onClick={generate}
        disabled={loading}
        className="px-6 py-2.5 bg-[#88B078] hover:bg-[#B0CF8D] disabled:opacity-50 rounded-xl font-medium transition-colors flex items-center gap-2"
      >
        {loading ? (
          <>
            <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
            Generando...
          </>
        ) : (
          "🚀 Generar mi Ruta de Mejora"
        )}
      </button>
    </div>
  )
}
