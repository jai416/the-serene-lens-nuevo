"use client"

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"

export function FAQSection() {
  return (
    <section className="py-20 sm:py-28 px-4 sm:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-12">
          <Badge variant="secondary" className="mb-4 rounded-full px-4 py-1.5">
            Preguntas Frecuentes
          </Badge>
          <h2 className="font-serif text-3xl sm:text-4xl font-semibold mb-4 text-[#2F3A2D]">
            ¿Tienes Dudas?
          </h2>
        </div>

        <Card className="overflow-hidden">
          <CardContent className="p-0">
            <Accordion type="single" collapsible>
              <AccordionItem value="1">
                <AccordionTrigger className="px-6 py-4 text-sm font-medium text-[#2F3A2D]">
                  ¿Cómo funciona la observación cosmética?
                </AccordionTrigger>
                <AccordionContent className="px-6 pb-4 text-sm text-[#64705E]">
                  Nuestra IA analiza tus fotos y detecta patrones visuales como textura, poros, brillo y más.
                  Te damos observaciones descriptivas honestas, no porcentajes inventados.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="2">
                <AccordionTrigger className="px-6 py-4 text-sm font-medium text-[#2F3A2D]">
                  ¿Esto reemplaza una consulta profesional?
                </AccordionTrigger>
                <AccordionContent className="px-6 pb-4 text-sm text-[#64705E]">
                  No. Somos una herramienta educativa e informativa. Siempre consulta a un profesional de la salud
                  para cualquier preocupación sobre tu piel.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="3">
                <AccordionTrigger className="px-6 py-4 text-sm font-medium text-[#2F3A2D]">
                  ¿Puedo cancelar mi suscripción?
                </AccordionTrigger>
                <AccordionContent className="px-6 pb-4 text-sm text-[#64705E]">
                  Sí, en cualquier momento desde tu dashboard. Sin penalizaciones.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="4">
                <AccordionTrigger className="px-6 py-4 text-sm font-medium text-[#2F3A2D]">
                  ¿Mis datos están seguros?
                </AccordionTrigger>
                <AccordionContent className="px-6 pb-4 text-sm text-[#64705E]">
                  Usamos cifrado y mejores prácticas. Tus fotos nunca se comparten con terceros.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>
      </div>
    </section>
  )
}
