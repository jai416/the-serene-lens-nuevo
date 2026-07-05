"use client"

import { useState, useEffect } from "react"
import { Quote, Star } from "lucide-react"

const testimonials = [
  {
    name: "María G.",
    location: "La Habana",
    text: "Llevaba años probando productos sin saber qué necesitaba mi piel. El análisis me dio claridad total y ahora tengo una rutina que realmente funciona.",
    rating: 5,
    skinType: "Piel mixta",
  },
  {
    name: "Carlos R.",
    location: "Miami",
    text: "Nunca pensé que una app pudiera analizar mi piel tan bien. Los resultados coincidieron con lo que me dijo mi dermatóloga. Impresionante.",
    rating: 5,
    skinType: "Piel grasa",
  },
  {
    name: "Ana L.",
    location: "Madrid",
    text: "La ruta de mejora de 30 días transformó mi piel. Pude ver cambios reales semana a semana. Súper recomendada.",
    rating: 5,
    skinType: "Piel sensible",
  },
  {
    name: "Laura M.",
    location: "Buenos Aires",
    text: "El predictor de envejecimiento me motivó a cuidarme más. Ver la proyección a 5 años fue un wake-up call que necesitaba.",
    rating: 5,
    skinType: "Piel seca",
  },
  {
    name: "Pedro S.",
    location: "CDMX",
    text: "La comunidad y los desafíos hacen que cuidar la piel sea divertido. He aprendido muchísimo sobre ingredientes y rutinas.",
    rating: 4,
    skinType: "Piel normal",
  },
]

export default function TestimonialsSection() {
  const [active, setActive] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setActive((prev) => (prev + 1) % testimonials.length)
    }, 4000)
    return () => clearInterval(timer)
  }, [])

  const t = testimonials[active]

  return (
    <section className="py-20 px-4 bg-[#F0F5EC] dark:bg-[#222920]">
      <div className="max-w-2xl mx-auto text-center">
        <div className="w-10 h-10 rounded-xl bg-[#C2E09D]/20 flex items-center justify-center mx-auto mb-4">
          <Quote className="w-5 h-5 text-[#C2E09D]" />
        </div>
        <h2 className="font-serif text-2xl sm:text-3xl font-semibold text-[#2F3A2D] dark:text-[#E8EDE6] mb-2">
          Lo que dicen nuestros usuarios
        </h2>
        <p className="text-sm text-[#64705E] dark:text-[#9BAA93] mb-10">
          Más de 10,000 análisis realizados con IA
        </p>

        <div className="relative min-h-[200px]">
          <div
            className="transition-all duration-500 ease-in-out"
            key={active}
          >
            <div className="flex justify-center gap-0.5 mb-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={`w-4 h-4 ${i < t.rating ? "text-[#FFD700] fill-[#FFD700]" : "text-[#DDE7D3] dark:text-[#3A4536]"}`}
                />
              ))}
            </div>
            <blockquote className="text-base sm:text-lg text-[#2F3A2D] dark:text-[#E8EDE6] leading-relaxed mb-6 italic">
              &ldquo;{t.text}&rdquo;
            </blockquote>
            <div className="flex items-center justify-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#C2E09D] flex items-center justify-center text-[#2F3A2D] font-semibold text-sm">
                {t.name[0]}
              </div>
              <div className="text-left">
                <p className="text-sm font-medium text-[#2F3A2D] dark:text-[#E8EDE6]">{t.name}</p>
                <p className="text-xs text-[#64705E] dark:text-[#9BAA93]">{t.location} · {t.skinType}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-center gap-2 mt-8">
          {testimonials.map((_, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                i === active ? "bg-[#C2E09D] w-6" : "bg-[#DDE7D3] dark:bg-[#3A4536]"
              }`}
              aria-label={`Testimonio ${i + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
