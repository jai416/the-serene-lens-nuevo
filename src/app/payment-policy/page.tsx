import { Card, CardContent } from "@/components/ui/card"

export default function PaymentPolicyPage() {
  return (
    <div className="min-h-screen px-4 py-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="font-serif text-3xl sm:text-4xl font-semibold mb-6">
          Política de <span className="gradient-text">Pagos</span>
        </h1>
        <p className="text-sm text-[#666666] mb-8">Última actualización: julio 2026</p>

        <div className="space-y-6 text-sm text-[#666666] leading-relaxed">
          <section>
            <h2 className="font-serif text-lg font-semibold text-[#1A1A1A] mb-2">1. Métodos de pago</h2>
            <ul className="list-disc pl-4 space-y-1">
              <li><strong>PayPal:</strong> pagos internacionales seguros con tarjeta de crédito/débito o saldo PayPal.</li>
              <li><strong>Transfermóvil:</strong> pagos en CUP para usuarios en Cuba.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-serif text-lg font-semibold text-[#1A1A1A] mb-2">2. Planes y precios</h2>
            <ul className="list-disc pl-4 space-y-1">
              <li><strong>PREMIUM:</strong> $7.99/mes o $79.99/año</li>
              <li><strong>PRO:</strong> $14.99/mes</li>
              <li><strong>ESTHETICIAN:</strong> $49.99/mes o $499.99/año</li>
            </ul>
          </section>

          <section>
            <h2 className="font-serif text-lg font-semibold text-[#1A1A1A] mb-2">3. Facturación</h2>
            <ul className="list-disc pl-4 space-y-1">
              <li>Los planes mensuales se renuevan automáticamente cada 30 días.</li>
              <li>Los planes anuales se renuevan cada 365 días.</li>
              <li>Recibirás un recibo por cada transacción.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-serif text-lg font-semibold text-[#1A1A1A] mb-2">4. Cancelaciones</h2>
            <ul className="list-disc pl-4 space-y-1">
              <li>Puedes cancelar en cualquier momento desde tu dashboard.</li>
              <li>Al cancelar, el acceso continúa hasta el final del período pagado.</li>
              <li>No se realizan reembolsos por períodos parciales no usados.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-serif text-lg font-semibold text-[#1A1A1A] mb-2">5. Reembolsos</h2>
            <ul className="list-disc pl-4 space-y-1">
              <li>No ofrecemos reembolsos por cambios de opinión.</li>
              <li>Los paquetes de análisis no son reembolsables.</li>
              <li>En caso de fallos técnicos comprobados, evaluamos cada caso individualmente.</li>
              <li>Para solicitar un reembolso, escribe a theserenelens@gmail.com.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-serif text-lg font-semibold text-[#1A1A1A] mb-2">6. Contacto</h2>
            <p>Para dudas sobre pagos:</p>
            <p className="mt-1"><strong>Email:</strong> theserenelens@gmail.com</p>
          </section>
        </div>
      </div>
    </div>
  )
}
