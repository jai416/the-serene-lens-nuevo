"use client"

import { useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

const questions = [
  {
    id: 1,
    text: "¿Tu piel se siente tirante después de lavarla?",
    options: ["Sí", "A veces", "No"],
  },
  {
    id: 2,
    text: "¿Tienes brillos en la zona T?",
    options: ["Siempre", "A veces", "Nunca"],
  },
  {
    id: 3,
    text: "¿Usas protector solar diariamente?",
    options: ["Sí", "A veces", "No"],
  },
]

type SkinType = {
  label: string
  description: string
}

function getResult(answers: string[]): SkinType {
  const [q1, q2, q3] = answers

  if (q1 === "Sí" && q2 === "Nunca") {
    return {
      label: "Piel seca",
      description:
        "Tu piel tiende a ser reseca y con sensibilidad. Necesita hidratación constante y protección solar diaria.",
    }
  }

  if (q2 === "Siempre" || (q2 === "A veces" && q1 === "No")) {
    return {
      label: "Piel grasa o mixta",
      description:
        "Tu piel produce exceso de sebo, especialmente en la zona T. Controla los brillos con productos adecuados.",
    }
  }

  if (q1 === "A veces" && q2 === "A veces") {
    return {
      label: "Piel mixta",
      description:
        "Tu piel combina zonas grasas y secas. Necesita un cuidado equilibrado para cada zona.",
    }
  }

  if (q3 === "No") {
    return {
      label: "Piel con riesgo de daño solar",
      description:
        "No usar protector solar regularmente puede acelerar el envejecimiento y manchas. Es hora de protegerla.",
    }
  }

  return {
    label: "Piel normal a bien cuidada",
    description:
      "Tu piel mantiene un buen equilibrio. Continúa con tu rutina y protege tu piel del sol diariamente.",
  }
}

export function SkinTest() {
  const [current, setCurrent] = useState(0)
  const [answers, setAnswers] = useState<string[]>([])
  const [selectedOption, setSelectedOption] = useState<string | null>(null)
  const [result, setResult] = useState<SkinType | null>(null)

  const isLastQuestion = current === questions.length - 1
  const question = questions[current]

  function handleSelect(option: string) {
    setSelectedOption(option)
  }

  function handleNext() {
    if (!selectedOption) return

    const newAnswers = [...answers, selectedOption]
    setAnswers(newAnswers)

    if (isLastQuestion) {
      setResult(getResult(newAnswers))
      return
    }

    setCurrent(current + 1)
    setSelectedOption(null)
  }

  if (result) {
    return (
      <Card className="mx-auto w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-[#1A1A1A]">Tu resultado</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div
            className="rounded-[16px] px-4 py-3 text-center text-lg font-semibold text-[#1A1A1A]"
            style={{ backgroundColor: "#88B078" }}
          >
            {result.label}
          </div>
          <p className="text-center text-sm text-[#666666]">{result.description}</p>
        </CardContent>
        <CardFooter className="flex flex-col items-center gap-3">
          <p className="text-xs text-[#666666]">
            Este es un resultado genérico. Para un análisis real de tu piel:
          </p>
          <Link
            href="/login"
            className="inline-flex items-center rounded-full bg-[#88B078] px-6 py-2.5 text-sm font-medium text-[#1A1A1A] transition-colors hover:bg-[#78A068]"
          >
            ¿Quieres el análisis real? Regístrate →
          </Link>
        </CardFooter>
      </Card>
    )
  }

  return (
    <Card className="mx-auto w-full max-w-md">
      <CardHeader>
        <CardTitle className="text-[#1A1A1A]">Mini Test de Piel</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-center gap-2">
          {questions.map((_, i) => (
            <div
              key={i}
              className={`h-2 w-2 rounded-full transition-colors ${
                i <= current ? "bg-[#88B078]" : "bg-[#E8E8E8]"
              }`}
            />
          ))}
        </div>

        <p className="text-center text-base font-medium text-[#1A1A1A]">{question.text}</p>

        <div className="flex flex-col gap-3">
          {question.options.map((option) => (
            <button
              key={option}
              onClick={() => handleSelect(option)}
              className={`rounded-[12px] border px-4 py-3 text-sm font-medium transition-all ${
                selectedOption === option
                  ? "border-[#88B078] bg-[#88B078]/20 text-[#1A1A1A]"
                  : "border-[#E8E8E8] bg-white text-[#666666] hover:border-[#88B078] hover:bg-[#F8F9FA]"
              }`}
            >
              {option}
            </button>
          ))}
        </div>
      </CardContent>
      <CardFooter className="flex justify-center">
        <button
          onClick={handleNext}
          disabled={!selectedOption}
          className="rounded-full bg-[#88B078] px-8 py-2.5 text-sm font-medium text-[#1A1A1A] transition-colors hover:bg-[#78A068] disabled:cursor-not-allowed disabled:opacity-40"
        >
          {isLastQuestion ? "Ver resultado" : "Siguiente"}
        </button>
      </CardFooter>
    </Card>
  )
}
