export default function PrivacyPage() {
  return (
    <div className="min-h-screen pt-24 pb-16 px-4">
      <div className="max-w-3xl mx-auto">
        <h1 className="font-serif text-3xl sm:text-4xl font-semibold mb-6">
          Política de <span className="gradient-text">Privacidad</span>
        </h1>

        <div className="prose prose-sm sm:prose-base max-w-none dark:prose-invert prose-headings:font-serif">
          <p className="text-muted-foreground">
            En The Serene Lens valoramos tu privacidad. Esta política describe cómo recopilamos, usamos y protegemos tu información.
          </p>

          <h2>Información que recopilamos</h2>
          <ul>
            <li>Información de cuenta (nombre, email)</li>
            <li>Fotos que subes para el análisis de piel</li>
            <li>Información de pago procesada a través de QvaPay (no almacenamos datos de pago)</li>
          </ul>

          <h2>Cómo usamos tu información</h2>
          <ul>
            <li>Proveer el servicio de análisis de piel con IA</li>
            <li>Mejorar nuestros algoritmos de análisis</li>
            <li>Enviar comunicaciones relacionadas con el servicio</li>
          </ul>

          <h2>Tus fotos</h2>
          <p className="text-muted-foreground">
            Las fotos que subes se usan únicamente para el análisis. No compartimos tus imágenes con terceros.
            Puedes solicitar la eliminación de tus datos en cualquier momento.
          </p>

          <h2>Contacto</h2>
          <p className="text-muted-foreground">
            Si tienes preguntas sobre esta política, escríbenos a través de nuestro formulario de contacto.
          </p>
        </div>
      </div>
    </div>
  )
}
