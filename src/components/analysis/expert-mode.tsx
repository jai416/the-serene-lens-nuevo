"use client"

import { useState } from "react"

type Explanation = {
  que_significa: string
  por_que_ocurre: string[]
  ingredientes_clave: { nombre: string; para_que_sirve: string; como_usarlo: string }[]
  ajuste_rutina: string
  tiempo_mejora: string
}

export function ExpertMode({ analysisId, observations }: { analysisId: string; observations: string[] }) {
  const [selected, setSelected] = useState<string | null>(null)
  const [explanation, setExplanation] = useState<Explanation | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  async function handleClick(obs: string) {
    setSelected(obs)
    setLoading(true)
    setError("")
    setExplanation(null)
    try {
      const res = await fetch(`/api/analysis/${analysisId}/explain-observation`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ observation: obs }),
      })
      const data = await res.json()
      if (data.success) setExplanation(data.data.explanation)
      else setError("Error al obtener explicación")
    } catch {
      setError("Error de conexión")
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div className="space-y-2">
        <h3 className="font-semibold text-lg">🔬 Modo Experto</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">Haz clic en cualquier observación para saber más:</p>
        <div className="flex flex-wrap gap-2">
          {observations.map((obs, i) => (
            <button
              key={i}
              onClick={() => handleClick(obs)}
              className="px-3 py-1.5 bg-[#F8F9FA] dark:bg-gray-800 border border-[#E8E8E8] dark:border-gray-700 rounded-full text-sm hover:bg-[#88B078] hover:border-[#88B078] transition-colors"
            >
              {obs} 🔍
            </button>
          ))}
        </div>
      </div>

      {selected && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => { setSelected(null); setExplanation(null) }}>
          <div className="bg-white dark:bg-gray-900 rounded-2xl max-w-lg w-full max-h-[80vh] overflow-y-auto p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-xl font-bold">🔍 {selected}</h3>
              <button onClick={() => { setSelected(null); setExplanation(null) }} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>

            {loading && (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin w-8 h-8 border-4 border-[#88B078] border-t-transparent rounded-full" />
                <span className="ml-3 text-gray-500">Analizando...</span>
              </div>
            )}

            {error && <p className="text-red-500 text-center py-4">{error}</p>}

            {explanation && (
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-[#1A1A1A] dark:text-white mb-1">📖 ¿Qué significa?</h4>
                  <p className="text-gray-600 dark:text-gray-300">{explanation.que_significa}</p>
                </div>

                {explanation.por_que_ocurre?.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-[#1A1A1A] dark:text-white mb-1">🔬 ¿Por qué ocurre?</h4>
                    <ul className="list-disc list-inside space-y-1 text-gray-600 dark:text-gray-300">
                      {explanation.por_que_ocurre.map((c, i) => <li key={i}>{c}</li>)}
                    </ul>
                  </div>
                )}

                {explanation.ingredientes_clave?.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-[#1A1A1A] dark:text-white mb-2">🧴 Ingredientes clave</h4>
                    <div className="space-y-3">
                      {explanation.ingredientes_clave.map((ing, i) => (
                        <div key={i} className="p-3 bg-[#F8F9FA] dark:bg-gray-800 rounded-xl">
                          <p className="font-medium text-[#1A1A1A] dark:text-white">{ing.nombre}</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{ing.para_que_sirve}</p>
                          <p className="text-sm text-[#666666] dark:text-gray-400 mt-1">💡 <span className="italic">{ing.como_usarlo}</span></p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {explanation.ajuste_rutina && (
                  <div className="p-3 bg-[#FFF9E6] dark:bg-yellow-900/30 rounded-xl">
                    <h4 className="font-semibold text-[#1A1A1A] dark:text-white mb-1">🔄 Ajusta tu rutina</h4>
                    <p className="text-gray-600 dark:text-gray-300">{explanation.ajuste_rutina}</p>
                  </div>
                )}

                {explanation.tiempo_mejora && (
                  <div className="p-3 bg-[#88B078]/20 dark:bg-green-900/20 rounded-xl">
                    <h4 className="font-semibold text-[#1A1A1A] dark:text-white mb-1">⏱️ Tiempo estimado</h4>
                    <p className="text-gray-600 dark:text-gray-300">{explanation.tiempo_mejora}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
