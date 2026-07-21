import { Card, CardContent } from "@/components/ui/card"

export default function PrivacyPage() {
  return (
    <div className="min-h-screen px-4 py-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="font-serif text-3xl sm:text-4xl font-semibold mb-6">
          Política de <span className="gradient-text">Privacidad</span>
        </h1>
        <p className="text-sm text-[#666666] mb-8">Última actualización: julio 2026</p>

        <div className="space-y-6 text-sm text-[#666666] leading-relaxed">
          <section>
            <h2 className="font-serif text-lg font-semibold text-[#1A1A1A] mb-2">1. Información que recopilamos</h2>
            <h3 className="font-medium text-[#1A1A1A] mt-3 mb-1">Información que nos proporcionas directamente:</h3>
            <ul className="list-disc pl-4 space-y-1">
              <li>Nombre, dirección de correo electrónico y contraseña (registro)</li>
              <li>Fotos de tu rostro (para el análisis de piel con IA)</li>
              <li>Datos demográficos: edad, género, tipo de piel, preocupaciones cutáneas</li>
              <li>Ubicación geográfica aproximada (para alertas UV y clima tropical)</li>
              <li>Nombre de usuario de Telegram (si usas el bot)</li>
              <li>Comunicaciones con nuestro equipo de soporte</li>
            </ul>
            <h3 className="font-medium text-[#1A1A1A] mt-3 mb-1">Información recopilada automáticamente:</h3>
            <ul className="list-disc pl-4 space-y-1">
              <li>Dirección IP y ubicación aproximada</li>
              <li>Tipo de navegador y dispositivo</li>
              <li>Páginas visitadas y duración de la visita</li>
              <li>Estado de pago y tipo de suscripción</li>
            </ul>
            <h3 className="font-medium text-[#1A1A1A] mt-3 mb-1">Información de pago:</h3>
            <ul className="list-disc pl-4 space-y-1">
              <li>Los pagos se procesan a través de QvaPay o Transfermóvil</li>
              <li>NO almacenamos números de tarjeta de crédito ni datos bancarios</li>
              <li>Solo conservamos el registro de la transacción (monto, fecha, plan)</li>
            </ul>
          </section>

          <section>
            <h2 className="font-serif text-lg font-semibold text-[#1A1A1A] mb-2">2. Cómo usamos tu información</h2>
            <h3 className="font-medium text-[#1A1A1A] mt-3 mb-1">Para proporcionar el servicio:</h3>
            <ul className="list-disc pl-4 space-y-1">
              <li>Analizar las fotos de tu piel usando inteligencia artificial (Gemini 2.0 Flash)</li>
              <li>Generar rutinas de cuidado personalizadas</li>
              <li>Recomendar productos según tu tipo de piel</li>
              <li>Enviar recordatorios de cuidado de la piel</li>
            </ul>
            <h3 className="font-medium text-[#1A1A1A] mt-3 mb-1">Para mejorar el servicio:</h3>
            <ul className="list-disc pl-4 space-y-1">
              <li>Analizar patrones de uso anonimizados para optimizar la plataforma</li>
              <li>Realizar investigaciones sobre efectividad de rutinas</li>
            </ul>
            <h3 className="font-medium text-[#1A1A1A] mt-3 mb-1">Para comunicarnos contigo:</h3>
            <ul className="list-disc pl-4 space-y-1">
              <li>Confirmaciones de pago y estado de suscripción</li>
              <li>Notificaciones de expiración de prueba gratuita</li>
              <li>Recordatorios de cuidado (si activaste la función)</li>
              <li>Respuesta a consultas de soporte</li>
            </ul>
            <p className="mt-2"><strong>Base legal:</strong> consentimiento al registrarte, ejecución del contrato, interés legítimo y obligaciones legales.</p>
          </section>

          <section>
            <h2 className="font-serif text-lg font-semibold text-[#1A1A1A] mb-2">3. Tus fotos</h2>
            <Card className="bg-[#E2ECE0]/30 border-[#88B078]">
              <CardContent className="p-4 text-sm">
                <ul className="list-disc pl-4 space-y-1">
                  <li>Las fotos se usan exclusivamente para el análisis solicitado.</li>
                  <li>Se envían a la API de Gemini (Google) para su procesamiento con IA.</li>
                  <li>No compartimos tus imágenes con terceros fuera del proceso de análisis.</li>
                  <li>No usamos tus fotos para entrenar modelos de IA. Google no entrena sus modelos con tus imágenes.</li>
                  <li>Puedes eliminar tus fotos y análisis en cualquier momento desde tu dashboard.</li>
                  <li>Puedes solicitar la eliminación completa de tus datos escribiendo a theserenelens@gmail.com.</li>
                </ul>
              </CardContent>
            </Card>
          </section>

          <section>
            <h2 className="font-serif text-lg font-semibold text-[#1A1A1A] mb-2">4. Almacenamiento y seguridad</h2>
            <ul className="list-disc pl-4 space-y-1">
              <li>Base de datos PostgreSQL en Supabase (AWS us-east-2) con cifrado en tránsito (TLS) y en reposo.</li>
              <li>Contraseñas almacenadas con scrypt (algoritmo de hash resistente).</li>
              <li>Sesiones con JWT firmados y cookie httpOnly.</li>
              <li>Protección CSRF en todas las rutas de escritura.</li>
              <li>Rate limiting para prevenir abusos en todas las APIs.</li>
              <li>Auditoría de todas las acciones administrativas.</li>
            </ul>
            <h3 className="font-medium text-[#1A1A1A] mt-3 mb-1">Retención de datos:</h3>
            <ul className="list-disc pl-4 space-y-1">
              <li>Datos de cuenta: mientras la cuenta esté activa</li>
              <li>Fotos y análisis: puedes eliminarlos en cualquier momento</li>
              <li>Registros de pago: 5 años (obligación fiscal)</li>
              <li>Registros de auditoría: 1 año</li>
            </ul>
          </section>

          <section>
            <h2 className="font-serif text-lg font-semibold text-[#1A1A1A] mb-2">5. Tus derechos</h2>
            <ul className="list-disc pl-4 space-y-1">
              <li><strong>Acceso:</strong> solicita una copia de todos tus datos</li>
              <li><strong>Rectificación:</strong> corrige tus datos en tu perfil</li>
              <li><strong>Supresión:</strong> solicita la eliminación de tu cuenta y datos</li>
              <li><strong>Portabilidad:</strong> recibe tus datos en formato estructurado</li>
              <li><strong>Oposición:</strong> oponte al procesamiento de tus datos</li>
              <li><strong>Retirar consentimiento:</strong> en cualquier momento</li>
            </ul>
            <p className="mt-2">Para ejercer tus derechos, escribe a: <strong>theserenelens@gmail.com</strong></p>
          </section>

          <section>
            <h2 className="font-serif text-lg font-semibold text-[#1A1A1A] mb-2">6. Compartición con terceros</h2>
            <h3 className="font-medium text-[#1A1A1A] mt-3 mb-1">Proveedores de servicio necesarios:</h3>
            <ul className="list-disc pl-4 space-y-1">
              <li><strong>Gemini (Google)</strong> — procesamiento de IA para análisis de piel y escáner de ingredientes</li>
              <li><strong>Groq</strong> — procesamiento de IA para chat y asistente virtual</li>
              <li><strong>Supabase</strong> — alojamiento de base de datos</li>
              <li><strong>Render</strong> — alojamiento de la aplicación</li>
              <li><strong>Google</strong> — inicio de sesión OAuth (opcional)</li>
              <li><strong>QvaPay</strong> — procesamiento de pagos internacionales</li>
            </ul>
            <p className="mt-2"><strong>NO</strong> compartimos tus datos con anunciantes, redes publicitarias, vendedores de datos ni compañías farmacéuticas.</p>
          </section>

          <section>
            <h2 className="font-serif text-lg font-semibold text-[#1A1A1A] mb-2">7. Cookies</h2>
            <p>Usamos cookies esenciales para el funcionamiento:</p>
            <ul className="list-disc pl-4 space-y-1">
              <li><strong>next-auth.session-token</strong> — sesión de usuario</li>
              <li><strong>csrf-token</strong> — seguridad contra CSRF</li>
              <li><strong>locale</strong> — preferencia de idioma (EN/ES)</li>
            </ul>
            <p className="mt-1">Usamos PostHog para análisis de uso anonimizado. Puedes desactivarlo desde la configuración de tu navegador.</p>
          </section>

          <section>
            <h2 className="font-serif text-lg font-semibold text-[#1A1A1A] mb-2">8. Transferencia internacional de datos</h2>
            <p>Tus datos se almacenan en servidores en Estados Unidos (AWS us-east-2). Al usar el servicio, consientes la transferencia internacional de tus datos.</p>
          </section>

          <section>
            <h2 className="font-serif text-lg font-semibold text-[#1A1A1A] mb-2">9. Menores de edad</h2>
            <p>El servicio está dirigido a mayores de 13 años. No recopilamos intencionadamente datos de menores. Si eres padre/madre y descubres que tu hijo ha proporcionado datos, contáctanos.</p>
          </section>

          <section>
            <h2 className="font-serif text-lg font-semibold text-[#1A1A1A] mb-2">10. Cambios a esta política</h2>
            <p>Notificaremos cambios significativos por email. La versión actualizada se publica en esta página. El uso continuado después de los cambios constituye aceptación.</p>
          </section>

          <section>
            <h2 className="font-serif text-lg font-semibold text-[#1A1A1A] mb-2">11. Contacto</h2>
            <p>Para ejercer tus derechos o resolver dudas sobre privacidad:</p>
            <p className="mt-1"><strong>Email:</strong> theserenelens@gmail.com</p>
          </section>

          <div className="p-4 rounded-2xl bg-[#FFF9E6] border border-[#FCEAA6] mt-8">
            <p className="text-sm text-[#1A1A1A]">
              <strong>AVISO IMPORTANTE:</strong> The Serene Lens es una herramienta de apoyo para el cuidado de la piel basada en inteligencia artificial. NO sustituye el diagnóstico, tratamiento o consejo de un dermatólogo o médico profesional. Siempre consulta a un profesional de la salud para condiciones médicas.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
