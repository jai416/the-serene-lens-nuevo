export default function TermsPage() {
  return (
    <div className="min-h-screen pt-24 pb-16 px-4">
      <div className="max-w-3xl mx-auto">
        <h1 className="font-serif text-3xl sm:text-4xl font-semibold mb-6">
          Términos y <span className="gradient-text">Condiciones</span>
        </h1>

        <div className="prose prose-sm sm:prose-base max-w-none dark:prose-invert prose-headings:font-serif">
          <h2>1. Aceptación de términos</h2>
          <p className="text-muted-foreground">
            Al usar The Serene Lens, aceptas estos términos. Si no estás de acuerdo, no uses el servicio.
          </p>

          <h2>2. Descripción del servicio</h2>
          <p className="text-muted-foreground">
            The Serene Lens es una herramienta de análisis de piel con inteligencia artificial.
            Los resultados son informativos y no constituyen un diagnóstico médico.
          </p>

          <h2>3. Limitación de responsabilidad</h2>
          <p className="text-muted-foreground">
            El análisis proporcionado por IA es solo para fines informativos y educativos.
            No reemplaza el consejo, diagnóstico o tratamiento de un profesional médico.
            Siempre consulta a un dermatólogo o profesional de la salud para cualquier preocupación sobre tu piel.
          </p>

          <h2>4. Suscripciones y pagos</h2>
          <p className="text-muted-foreground">
            Las suscripciones se renuevan automáticamente cada mes. Puedes cancelar en cualquier momento.
            Los pagos son procesados por QvaPay. No almacenamos información de pago.
          </p>

          <h2>5. Cancelación</h2>
          <p className="text-muted-foreground">
            Puedes cancelar tu suscripción desde tu dashboard. El acceso continúa hasta el final del período pagado.
          </p>
        </div>
      </div>
    </div>
  )
}
