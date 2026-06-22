const PHOTO_STEPS_ENV = process.env.NEXT_PUBLIC_PHOTO_STEPS || "4"

export const PHOTO_STEPS_MODE = PHOTO_STEPS_ENV === "2" ? "2" : "4"

export interface PhotoStepConfig {
  id: string
  label: string
  description: string
  tip: string
  exampleLabel: string
  required: boolean
}

export function getPhotoSteps(): PhotoStepConfig[] {
  if (PHOTO_STEPS_MODE === "2") {
    return [
      {
        id: "front",
        label: "Foto frontal",
        description: "Toma una foto de tu rostro mirando directamente a la cámara.",
        tip: "Buena iluminación natural, rostro centrado, sin filtros.",
        exampleLabel: "Rostro completo, frente a la cámara",
        required: true,
      },
      {
        id: "side",
        label: "Perfiles",
        description: "Toma una foto que muestre ambos perfiles (izquierdo y derecho).",
        tip: "Unifica los dos perfiles en una sola captura.",
        exampleLabel: "Ambos perfiles",
        required: true,
      },
    ]
  }

  return [
    {
      id: "front",
      label: "Foto frontal",
      description: "Toma una foto de tu rostro mirando directamente a la cámara.",
      tip: "Buena iluminación natural, rostro centrado, sin filtros.",
      exampleLabel: "Rostro completo, frente a la cámara",
      required: true,
    },
    {
      id: "left",
      label: "Perfil izquierdo",
      description: "Gira tu rostro hacia la izquierda para mostrar el perfil.",
      tip: "Mantén la misma iluminación y distancia.",
      exampleLabel: "Perfil lateral izquierdo",
      required: true,
    },
    {
      id: "right",
      label: "Perfil derecho",
      description: "Gira tu rostro hacia la derecha para mostrar el perfil.",
      tip: "Asegúrate de que todo el perfil sea visible.",
      exampleLabel: "Perfil lateral derecho",
      required: true,
    },
    {
      id: "closeup",
      label: "Acercamiento (opcional)",
      description: "Acerca la cámara a una zona de interés.",
      tip: "Este paso es opcional.",
      exampleLabel: "Acercamiento a zona de interés",
      required: false,
    },
  ]
}
