export default function PrivacyPage() {
  return (
    <div className="min-h-screen px-4 py-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="font-serif text-3xl sm:text-4xl font-semibold mb-6">
          Política de <span className="gradient-text">Privacidad</span>
        </h1>

        <div className="space-y-6 text-sm text-on-surface-variant leading-relaxed">
          <section>
            <h2 className="font-serif text-lg font-semibold text-on-surface mb-2">Información que recopilamos</h2>
            <ul className="list-disc pl-4 space-y-1">
              <li><strong>Datos de cuenta:</strong> nombre, email, foto de perfil (si usas Google o GitHub).</li>
              <li><strong>Fotos de análisis:</strong> las imágenes que subes voluntariamente para la observación cosmética.</li>
              <li><strong>Datos demográficos:</strong> edad, sexo, clima, preocupaciones de piel y rutina que proporcionas.</li>
              <li><strong>Datos de uso:</strong> historial de análisis, productos escaneados, artículos leídos.</li>
              <li><strong>Datos de pago:</strong> no almacenamos información de tarjetas ni billeteras. QvaPay procesa los pagos directamente.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-serif text-lg font-semibold text-on-surface mb-2">Cómo usamos tu información</h2>
            <ul className="list-disc pl-4 space-y-1">
              <li>Proveer el servicio de observación cosmética y generar resultados personalizados.</li>
              <li>Mejorar la precisión del análisis mediante evaluación anónima de resultados.</li>
              <li>Enviar comunicaciones relacionadas con el servicio (cambios, actualizaciones).</li>
              <li>Cumplir con obligaciones legales y prevenir abusos.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-serif text-lg font-semibold text-on-surface mb-2">Tus fotos</h2>
            <div className="p-4 rounded-2xl bg-[rgba(183,255,42,0.06)] border border-primary/20 text-sm">
              <ul className="list-disc pl-4 space-y-1">
                <li>Las fotos se usan exclusivamente para el análisis solicitado.</li>
                <li>Se envían a la API de OpenRouter (Gemini Flash) para su procesamiento.</li>
                <li>No compartimos tus imágenes con terceros fuera del proceso de análisis.</li>
                <li>No usamos tus fotos para entrenar modelos de IA.</li>
                <li>Puedes solicitar la eliminación de tus datos en cualquier momento.</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="font-serif text-lg font-semibold text-on-surface mb-2">Almacenamiento y seguridad</h2>
            <ul className="list-disc pl-4 space-y-1">
              <li>Los datos se almacenan en PostgreSQL en Supabase, con cifrado en tránsito y en reposo.</li>
              <li>Las contraseñas se almacenan hasheadas con scrypt.</li>
              <li>Las sesiones se manejan con JWT firmados.</li>
              <li>Implementamos medidas de seguridad estándar para proteger tu información.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-serif text-lg font-semibold text-on-surface mb-2">Tus derechos</h2>
            <ul className="list-disc pl-4 space-y-1">
              <li><strong>Acceso:</strong> puedes ver todos tus datos en cualquier momento desde tu dashboard.</li>
              <li><strong>Corrección:</strong> puedes actualizar tu perfil y datos personales.</li>
              <li><strong>Eliminación:</strong> puedes solicitar la eliminación de tu cuenta y todos tus datos.</li>
              <li><strong>Exportación:</strong> puedes solicitar una copia de tus datos.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-serif text-lg font-semibold text-on-surface mb-2">Cookies</h2>
            <p>
              Usamos cookies esenciales para el funcionamiento de la autenticación y la sesión.
              No usamos cookies de rastreo ni publicitarias.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-lg font-semibold text-on-surface mb-2">Cambios a esta política</h2>
            <p>
              Notificaremos cualquier cambio material a esta política a través del servicio o por email.
              El uso continuado después de los cambios constituye aceptación de los mismos.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-lg font-semibold text-on-surface mb-2">Contacto</h2>
            <p>
              Para ejercer tus derechos o resolver dudas sobre privacidad, escríbenos a través
              de nuestro formulario de contacto o por WhatsApp.
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
