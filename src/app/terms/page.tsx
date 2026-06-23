export default function TermsPage() {
  return (
    <div className="min-h-screen px-4 py-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="font-serif text-3xl sm:text-4xl font-semibold mb-6">
          Términos y <span className="gradient-text">Condiciones</span>
        </h1>

        <div className="space-y-6 text-sm text-on-surface-variant leading-relaxed">
          <section>
            <h2 className="font-serif text-lg font-semibold text-on-surface mb-2">1. Aceptación de términos</h2>
            <p>
              Al acceder o usar The Serene Lens, aceptas estos términos en su totalidad.
              Si no estás de acuerdo, no uses el servicio.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-lg font-semibold text-on-surface mb-2">2. Descripción del servicio</h2>
            <p>
              The Serene Lens es una herramienta de observación cosmética que utiliza inteligencia artificial
              para analizar fotografías del rostro y proporcionar observaciones visuales descriptivas sobre
              características de la piel como textura, poros, brillo y uniformidad.
            </p>
            <p className="mt-2">
              <strong>No es un dispositivo médico ni un servicio de diagnóstico.</strong>
              Los resultados generados son observaciones visuales automatizadas con fines informativos y educativos.
              No reemplazan ni pretenden reemplazar el consejo, diagnóstico o tratamiento de un profesional
              de la salud calificado.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-lg font-semibold text-on-surface mb-2">3. Descargo médico</h2>
            <div className="p-4 rounded-2xl bg-destructive/10 border border-destructive/20 text-sm">
              <p className="font-semibold text-destructive mb-1">ADVERTENCIA IMPORTANTE</p>
              <ul className="list-disc pl-4 space-y-1">
                <li>Esta herramienta no diagnostica enfermedades de la piel.</li>
                <li>No sustituye una consulta con un dermatólogo o profesional de la salud.</li>
                <li>No debe usarse para tomar decisiones médicas.</li>
                <li>La IA puede cometer errores: puede no detectar condiciones visibles o puede sugerir observaciones inexactas.</li>
                <li>Si tienes alguna preocupación sobre tu piel, consulta a un profesional de la salud.</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="font-serif text-lg font-semibold text-on-surface mb-2">4. Limitaciones de la IA</h2>
            <ul className="list-disc pl-4 space-y-1">
              <li>El análisis se basa únicamente en fotografías y la información que proporcionas.</li>
              <li>Factores como iluminación, calidad de imagen, maquillaje o ángulo pueden afectar los resultados.</li>
              <li>La IA no puede detectar condiciones internas, alergias, infecciones o enfermedades.</li>
              <li>Las recomendaciones cosméticas son sugerencias generales, no prescripciones.</li>
              <li>Siempre realiza una prueba de parche antes de usar nuevos productos.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-serif text-lg font-semibold text-on-surface mb-2">5. Suscripciones, paquetes y pagos</h2>
            <h3 className="font-medium mt-3 mb-1">Suscripciones mensuales</h3>
            <ul className="list-disc pl-4 space-y-1">
              <li>Se renuevan automáticamente cada mes.</li>
              <li>Puedes cancelar en cualquier momento desde tu dashboard.</li>
              <li>Al cancelar, el acceso continúa hasta el final del período pagado.</li>
            </ul>
            <h3 className="font-medium mt-3 mb-1">Paquetes de análisis</h3>
            <ul className="list-disc pl-4 space-y-1">
              <li>Compra única de un número determinado de análisis.</li>
              <li>Los análisis se consumen al usar el servicio.</li>
              <li>Válidos por 30 días desde la compra. Los no usados después de 30 días pierden su validez.</li>
              <li>No reembolsables.</li>
            </ul>
            <h3 className="font-medium mt-3 mb-1">Procesamiento de pagos</h3>
            <ul className="list-disc pl-4 space-y-1">
              <li>Los pagos se procesan a través de QvaPay.</li>
              <li>No almacenamos información de pago en nuestros servidores.</li>
              <li>Los precios se muestran en USD con conversión aproximada a CUP.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-serif text-lg font-semibold text-on-surface mb-2">6. Uso aceptable</h2>
            <ul className="list-disc pl-4 space-y-1">
              <li>Debes ser mayor de 18 años o tener consentimiento parental.</li>
              <li>No subas fotos que no sean de tu rostro.</li>
              <li>No uses el servicio para fines ilegales o no autorizados.</li>
              <li>No intentes manipular, engañar o explotar el sistema de análisis.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-serif text-lg font-semibold text-on-surface mb-2">7. Limitación de responsabilidad</h2>
            <p>
              The Serene Lens no se hace responsable por decisiones tomadas basadas en los resultados del análisis.
              El uso del servicio es bajo tu propio riesgo. En ningún caso seremos responsables por daños directos,
              indirectos, incidentales o consecuentes relacionados con el uso del servicio.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-lg font-semibold text-on-surface mb-2">8. Cancelación y reembolsos</h2>
            <p>
              Puedes cancelar tu suscripción en cualquier momento. No ofrecemos reembolsos por períodos parciales
              no usados. Los paquetes de análisis no son reembolsables una vez comprados.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-lg font-semibold text-on-surface mb-2">9. Contacto</h2>
            <p>
              Para preguntas sobre estos términos, contáctanos a través de nuestro formulario de contacto
              o por WhatsApp.
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
