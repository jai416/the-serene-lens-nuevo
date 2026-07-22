import { Card, CardContent } from "@/components/ui/card"

export default function TermsPage() {
  return (
    <div className="min-h-screen px-4 py-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="font-serif text-3xl sm:text-4xl font-semibold mb-6">
          Términos y <span className="gradient-text">Condiciones</span>
        </h1>
        <p className="text-sm text-[#666666] mb-8">Última actualización: julio 2026</p>

        <div className="space-y-6 text-sm text-[#666666] leading-relaxed">
          <section>
            <h2 className="font-serif text-lg font-semibold text-[#1A1A1A] mb-2">1. Aceptación de términos</h2>
            <p>
              Al acceder o usar The Serene Lens, aceptas estos términos en su totalidad.
              Si no estás de acuerdo, no uses el servicio.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-lg font-semibold text-[#1A1A1A] mb-2">2. Descripción del servicio</h2>
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
            <h2 className="font-serif text-lg font-semibold text-[#1A1A1A] mb-2">3. Descargo médico</h2>
            <Card className="bg-[#FFF0F0] border-[#E07070]">
              <CardContent className="p-4 text-sm">
                <p className="font-semibold text-[#E07070] mb-1">ADVERTENCIA IMPORTANTE</p>
                <ul className="list-disc pl-4 space-y-1 text-[#666666]">
                  <li>Esta herramienta no diagnostica enfermedades de la piel.</li>
                  <li>No sustituye una consulta con un dermatólogo o profesional de la salud.</li>
                  <li>No debe usarse para tomar decisiones médicas.</li>
                  <li>La IA puede cometer errores: puede no detectar condiciones visibles o puede sugerir observaciones inexactas.</li>
                  <li>Si tienes alguna preocupación sobre tu piel, consulta a un profesional de la salud.</li>
                  <li>No uses este servicio para emergencias médicas.</li>
                </ul>
              </CardContent>
            </Card>
          </section>

          <section>
            <h2 className="font-serif text-lg font-semibold text-[#1A1A1A] mb-2">4. Tratamiento de imágenes con IA</h2>
            <p className="mb-2">
              Al usar The Serene Lens, aceptas que tus fotos sean procesadas por inteligencia artificial
              (Gemini 2.0 Flash de Google) para generar observaciones cosméticas.
            </p>
            <ul className="list-disc pl-4 space-y-1">
              <li><strong>Consentimiento explícito:</strong> Debes aceptar este término antes de subir cualquier foto. No hay casillas pre-marcadas.</li>
              <li><strong>Uso limitado:</strong> Las fotos se usan exclusivamente para el análisis solicitado. No se usan para entrenar modelos de IA.</li>
              <li><strong>Transparencia:</strong> Este es un sistema de IA, no un dermatólogo humano. Los resultados son observaciones cosméticas, no diagnósticos.</li>
              <li><strong>Retiro de consentimiento:</strong> Puedes revocar tu permiso en cualquier momento y solicitar la eliminación de tus fotos y datos escribiendo a theserenelens@gmail.com.</li>
              <li><strong>Eliminación:</strong> Puedes borrar tus fotos y análisis desde tu dashboard en cualquier momento.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-serif text-lg font-semibold text-[#1A1A1A] mb-2">5. Cuentas de usuario</h2>
            <ul className="list-disc pl-4 space-y-1">
              <li>Eres responsable de mantener la confidencialidad de tu contraseña</li>
              <li>Debes proporcionar información precisa y actualizada</li>
              <li>No puedes compartir tu cuenta con otras personas</li>
              <li>Debes notificar inmediatamente cualquier uso no autorizado</li>
              <li>Nos reservamos el derecho de suspender cuentas que violen estos términos</li>
              <li>Debes ser mayor de 13 años para usar el servicio</li>
            </ul>
          </section>

          <section>
            <h2 className="font-serif text-lg font-semibold text-[#1A1A1A] mb-2">5. Planes y pagos</h2>
            <h3 className="font-medium text-[#1A1A1A] mt-3 mb-1">Plan gratuito (FREE)</h3>
            <ul className="list-disc pl-4 space-y-1">
              <li>Análisis limitados (1 por mes)</li>
              <li>Funcionalidades básicas sin costo</li>
            </ul>
            <h3 className="font-medium text-[#1A1A1A] mt-3 mb-1">Planes de pago</h3>
            <ul className="list-disc pl-4 space-y-1">
              <li><strong>Mensuales:</strong> se renuevan automáticamente cada 30 días</li>
              <li><strong>Anuales:</strong> se renuevan cada 365 días (ahorro del 16%)</li>
              <li>Puedes cancelar en cualquier momento desde /dashboard/subscription</li>
              <li>La cancelación no genera reembolso del período ya pagado</li>
              <li>Al cancelar, el acceso continúa hasta el final del período pagado</li>
            </ul>
            <h3 className="font-medium text-[#1A1A1A] mt-3 mb-1">Paquetes de análisis</h3>
            <ul className="list-disc pl-4 space-y-1">
              <li>Compra única, no se renuevan automáticamente</li>
              <li>Vencen 30 días después de la compra si no se usan</li>
              <li>No son reembolsables</li>
            </ul>
            <h3 className="font-medium text-[#1A1A1A] mt-3 mb-1">Prueba gratuita</h3>
            <ul className="list-disc pl-4 space-y-1">
              <li>Los nuevos usuarios reciben 7 días de plan PREMIUM gratis</li>
              <li>Al expirar, el plan se degrada automáticamente a FREE</li>
              <li>Solo una prueba gratuita por usuario</li>
            </ul>
            <h3 className="font-medium text-[#1A1A1A] mt-3 mb-1">Procesamiento de pagos</h3>
            <ul className="list-disc pl-4 space-y-1">
              <li>PayPal (USD, tarjeta internacional) — procesamiento automático</li>
              <li>Transfermóvil (CUP, Cuba) — procesamiento con verificación humana</li>
              <li>No almacenamos información de tarjetas en nuestros servidores</li>
            </ul>
          </section>

          <section>
            <h2 className="font-serif text-lg font-semibold text-[#1A1A1A] mb-2">6. Limitaciones de la IA</h2>
            <ul className="list-disc pl-4 space-y-1">
              <li>El análisis se basa únicamente en fotografías y la información que proporcionas</li>
              <li>Factores como iluminación, calidad de imagen, maquillaje o ángulo pueden afectar los resultados</li>
              <li>La IA no puede detectar condiciones internas, alergias, infecciones o enfermedades</li>
              <li>Las recomendaciones cosméticas son sugerencias generales, no prescripciones</li>
              <li>Siempre realiza una prueba de parche antes de usar nuevos productos</li>
              <li>No garantizamos resultados específicos del uso de productos recomendados</li>
            </ul>
          </section>

          <section>
            <h2 className="font-serif text-lg font-semibold text-[#1A1A1A] mb-2">7. Propiedad intelectual</h2>
            <ul className="list-disc pl-4 space-y-1">
              <li>La plataforma, el código, el diseño y el contenido son propiedad de The Serene Lens</li>
              <li>Los análisis generados son para uso personal del usuario</li>
              <li>No puedes reproducir, distribuir o modificar el servicio sin autorización</li>
              <li>Las marcas comerciales de productos mencionados pertenecen a sus respectivos dueños</li>
            </ul>
          </section>

          <section>
            <h2 className="font-serif text-lg font-semibold text-[#1A1A1A] mb-2">8. Contenido del usuario</h2>
            <ul className="list-disc pl-4 space-y-1">
              <li>Las fotos que subes para análisis son tuyas</li>
              <li>Nos otorgas una licencia limitada para procesarlas con IA</li>
              <li>No compartimos tus fotos con terceros</li>
              <li>No subas fotos de otras personas sin su consentimiento</li>
            </ul>
          </section>

          <section>
            <h2 className="font-serif text-lg font-semibold text-[#1A1A1A] mb-2">9. Uso aceptable</h2>
            <ul className="list-disc pl-4 space-y-1">
              <li>No uses el servicio para fines ilegales o no autorizados</li>
              <li>No intentes manipular, engañar o explotar el sistema de análisis</li>
              <li>No crees cuentas múltiples para evadir límites</li>
              <li>No uses bots o automatización no autorizada</li>
              <li>No intentes vulnerar la seguridad de la plataforma</li>
            </ul>
          </section>

          <section>
            <h2 className="font-serif text-lg font-semibold text-[#1A1A1A] mb-2">10. Limitación de responsabilidad</h2>
            <p>
              The Serene Lens es una herramienta informativa y educativa. No reemplaza el consejo médico profesional.
              No garantizamos resultados específicos. El servicio se proporciona &quot;tal cual&quot;, sin garantías
              de disponibilidad continua. En ningún caso seremos responsables por daños directos, indirectos,
              incidentales o consecuentes relacionados con el uso del servicio. Nuestra responsabilidad máxima
              se limita al monto pagado en los últimos 12 meses.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-lg font-semibold text-[#1A1A1A] mb-2">11. Cancelación y terminación</h2>
            <ul className="list-disc pl-4 space-y-1">
              <li>Puedes cancelar tu suscripción en /dashboard/subscription</li>
              <li>Puedes eliminar tu cuenta contactando a soporte</li>
              <li>No ofrecemos reembolsos por períodos parciales no usados</li>
              <li>Los paquetes de análisis no son reembolsables</li>
              <li>Al terminar la cuenta, perderás acceso a tus análisis y datos</li>
            </ul>
          </section>

          <section>
            <h2 className="font-serif text-lg font-semibold text-[#1A1A1A] mb-2">12. Ley aplicable</h2>
            <p>
              Estos términos se rigen por las leyes de la República de Cuba. Cualquier disputa se resolverá
              en los tribunales de La Habana, Cuba. Para usuarios fuera de Cuba, aplica la ley de su país de residencia.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-lg font-semibold text-[#1A1A1A] mb-2">13. Cambios a los términos</h2>
            <p>
              Podemos modificar estos términos en cualquier momento. Notificaremos cambios significativos por email.
              El uso continuado del servicio constituye aceptación de los cambios.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-lg font-semibold text-[#1A1A1A] mb-2">14. Contacto</h2>
            <p>Para preguntas sobre estos términos:</p>
            <p className="mt-1"><strong>Email:</strong> theserenelens@gmail.com</p>
          </section>
        </div>
      </div>
    </div>
  )
}
