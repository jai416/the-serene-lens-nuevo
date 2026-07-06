'use client'

import { useState } from "react"

interface Props {
  analysisId: string
  onComplete?: () => void
}

export default function QuickFeedback({ analysisId, onComplete }: Props) {
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleVote = async (helpful: boolean) => {
    setLoading(true)
    try {
      const res = await fetch("/api/feedback/quick", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ analysisId, helpful }),
      })
      if (!res.ok) throw new Error()
      setSubmitted(true)
      onComplete?.()
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <div className="mt-6 rounded-xl bg-[#F8F9FA] p-4 text-center dark:bg-gray-800">
        <p className="font-medium">¡Gracias por tu opinión! 🌿</p>
      </div>
    )
  }

  return (
    <div className="mt-6 rounded-xl bg-[#F8F9FA] p-4 text-center dark:bg-gray-800">
      <p className="mb-3 font-medium">¿Te ayudó a entender tu piel?</p>
      <div className="flex justify-center gap-4">
        <button
          onClick={() => handleVote(true)}
          disabled={loading}
          className="rounded-lg bg-[#88B078] px-6 py-2 font-medium transition-colors hover:bg-[#B0CF8D] disabled:opacity-50"
        >
          👍 Sí
        </button>
        <button
          onClick={() => handleVote(false)}
          disabled={loading}
          className="rounded-lg bg-gray-200 px-6 py-2 font-medium transition-colors hover:bg-gray-300 disabled:opacity-50 dark:bg-gray-700 dark:hover:bg-gray-600"
        >
          👎 No
        </button>
      </div>
    </div>
  )
}
