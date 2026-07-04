import { db } from "@/lib/db"

const knowledgeBase = [
  {
    title: "¿Qué es The Serene Lens?",
    category: "general",
    subcategory: "faq",
    priority: 10,
    source: "web",
    sourceUrl: "/",
    keywords: ["qué es", "app", "skincare", "ia", "análisis", "piel"],
    synonyms: ["que es", "aplicacion", "funciona", "hace", "trata"],
    content: `The Serene Lens es una plataforma que analiza tu piel con inteligencia artificial para darte observaciones cosméticas reales y personalizadas.

Características principales:
- Análisis de piel con IA usando 4 fotos de tu rostro
- Sin porcentajes inventados: solo descripciones reales de textura, brillo, poros, uniformidad, sensibilidad y grasa aparente
- Historial de evolución para ver el progreso de tu piel
- Recomendaciones y rutinas personalizadas
- Comunidad para compartir experiencias
- Guías digitales descargables

Planes disponibles:
- FREE: 1 análisis gratis al mes
- PREMIUM ($4.99/mes): análisis ilimitados e historial
- PRO ($9.99/mes): prioridad y soporte rápido
- PRO+ ($14.99/mes): informes PDF, rutina dinámica y comparativa mensual`
  },
  {
    title: "¿Cómo funciona el análisis de piel?",
    category: "analysis",
    subcategory: "tutorial",
    priority: 10,
    source: "web",
    sourceUrl: "/analysis",
    keywords: ["análisis", "fotos", "pasos", "funciona", "proceso", "escaneo"],
    synonyms: ["analisis", "como se usa", "como hacer", "subir fotos", "tomar fotos"],
    content: `El análisis de piel en The Serene Lens sigue un proceso guiado de 3 pasos:

Paso 1: Subes 4 fotos de tu rostro
- Foto frontal (obligatoria)
- Perfil izquierdo (obligatoria)
- Perfil derecho (obligatoria)
- Acercamiento de zona de interés (opcional)

Paso 2: Respondes preguntas sobre tu rutina
- Preocupaciones principales (manchas, arrugas, acné, etc.)
- Edad y género
- Clima donde vives
- Rutina actual de skincare

Paso 3: Recibes tu análisis completo

Resultados que obtienes:
- Tipo de piel (seca, grasa, mixta, normal, sensible)
- Textura, poros, brillo, uniformidad
- Sensibilidad aparente y grasa aparente
- Observaciones detalladas con explicaciones
- Recomendaciones personalizadas
- Rutina sugerida (mañana y noche)

Todo el proceso toma menos de 5 minutos. Las fotos se comprimen automáticamente para proteger tu privacidad.`
  },
  {
    title: "Planes y precios",
    category: "pricing",
    subcategory: "faq",
    priority: 10,
    source: "web",
    sourceUrl: "/pricing",
    keywords: ["precios", "planes", "pago", "suscripción", "costo", "premium", "pro"],
    synonyms: ["precio", "planes", "cuanto cuesta", "valor", "mensualidad", "gratis", "free"],
    content: `The Serene Lens ofrece 4 planes de suscripción:

1. FREE (Gratuito)
   - 1 análisis al mes
   - Acceso básico al historial
   - Sin límite de tiempo

2. PREMIUM ($4.99/mes)
   - Análisis ilimitados
   - Historial completo de evolución
   - Comparativa mes a mes

3. PRO ($9.99/mes)
   - Todo lo de PREMIUM
   - Prioridad en procesamiento
   - Soporte prioritario
   - Acceso anticipado a nuevas funciones

4. PRO+ ($14.99/mes)
   - Todo lo de PRO
   - Informes PDF descargables
   - Rutina dinámica personalizada
   - Comparativa mensual detallada
   - Soporte prioritario 1h

También ofrecemos packs de análisis sin suscripción:
- Pack Básico (3 análisis): $1.99
- Pack Popular (5 análisis): $4.99
- Pack Avanzado (15 análisis): $6.99

Todos los precios están en USD. Aceptamos QvaPay, Transfermóvil (Cuba) y PayPal.`
  },
  {
    title: "Métodos de pago",
    category: "pricing",
    subcategory: "faq",
    priority: 9,
    source: "web",
    sourceUrl: "/pricing",
    keywords: ["pagar", "pago", "métodos", "transfermóvil", "qvapay", "paypal", "cuba"],
    synonyms: ["metodos", "como pagar", "forma de pago", "pagos", "divisa", "usd", "cup"],
    content: `Aceptamos 3 métodos de pago para adaptarnos a todos los usuarios:

1. QvaPay (principal)
   - Pago en USD con tarjetas internacionales
   - Procesamiento instantáneo
   - Ideal para usuarios fuera de Cuba

2. Transfermóvil (Cuba)
   - Pago en CUP desde Cuba
   - Validación manual por un administrador
   - Procesamiento en 24-48 horas
   - Recibes un código de referencia para validar tu pago

3. PayPal (internacional)
   - Pago seguro con PayPal
   - Disponible globalmente
   - Procesamiento automático

Tasa de cambio CUP: El sistema usa una tasa actualizada automáticamente. Si hay problemas con el API de cambio, usa el valor configurado en NEXT_PUBLIC_CUP_FALLBACK (default: 500).`
  },
  {
    title: "Modo Experto: explicaciones detalladas",
    category: "analysis",
    subcategory: "faq",
    priority: 8,
    source: "web",
    sourceUrl: "/analysis/results",
    keywords: ["experto", "explicación", "observaciones", "detalles", "ia", "causas"],
    synonyms: ["expert", "explicacion", "por que", "motivo", "razon", "significa"],
    content: `El Modo Experto es una función que te permite hacer clic en cualquier observación de tu análisis para obtener una explicación detallada generada por IA.

Al hacer clic en una observación (ej: "Brillo alto en zona T"), el sistema te muestra:
- Qué significa esa característica
- Posibles causas (genética, ambiente, rutina)
- Ingredientes recomendados para mejorar
- Cómo ajustar tu rutina según esa observación
- Tiempo estimado de mejora con el cuidado adecuado

Esta función está disponible para todos los planes, pero los usuarios PRO y PRO+ tienen acceso prioritario a explicaciones más detalladas.`
  },
  {
    title: "Ruta de Mejora: plan 30 días",
    category: "analysis",
    subcategory: "guide",
    priority: 8,
    source: "web",
    sourceUrl: "/analysis/results",
    keywords: ["mejora", "plan", "rutina", "30 días", "metas", "progreso"],
    synonyms: ["ruta de mejora", "plan de mejora", "mejorar", "progreso", "30 dias"],
    content: `La Ruta de Mejora es un plan personalizado de 30 días que se genera después de tu análisis.

Incluye:
- Semana 1-2: Metas a corto plazo y ajustes básicos
- Semana 3-4: Metas avanzadas y productos sugeridos
- Tips diarios basados en tu tipo de piel
- Productos recomendados según tus observaciones
- Recordatorios para seguir tu rutina

La Ruta de Mejora se adapta automáticamente según tus resultados y preocupaciones. Los usuarios PRO+ pueden descargarla como informe PDF.`
  },
  {
    title: "Predictor de Envejecimiento",
    category: "analysis",
    subcategory: "faq",
    priority: 7,
    source: "web",
    sourceUrl: "/analysis/results",
    keywords: ["envejecimiento", "predecir", "futuro", "arrugas", "5 años"],
    synonyms: ["predictor", "edad", "envejecer", "proyeccion", "futuro"],
    content: `El Predictor de Envejecimiento es una herramienta exclusiva para usuarios PRO+ que proyecta cómo podría verse tu piel en 5 años según tus hábitos actuales.

Utiliza:
- Tus fotos actuales
- Tu tipo de piel y observaciones
- Base de datos de ingredientes (más de 20 ingredientes analizados)
- Patrones de envejecimiento por tipo de piel

Los resultados incluyen:
- Puntuación estimada (solo visual, no médica)
- Áreas de mayor preocupación a futuro
- Recomendaciones preventivas
- Ingredientes clave para incorporar a tu rutina

Importante: Esta es una proyección estimada con fines educativos, no un diagnóstico médico.`
  },
  {
    title: "Comunidad y foros",
    category: "general",
    subcategory: "faq",
    priority: 5,
    source: "web",
    sourceUrl: "/community",
    keywords: ["comunidad", "foro", "compartir", "publicar", "comentarios"],
    synonyms: ["comunidad", "foro", "social", "publicaciones", "posts"],
    content: `La comunidad de The Serene Lens es un espacio donde los usuarios pueden compartir sus experiencias, tips y resultados.

Funciones:
- Crear publicaciones sobre skincare
- Comentar en publicaciones de otros usuarios
- Categorías organizadas por tema
- Sistema de likes y reputación

Para publicar, solo necesitas iniciar sesión. Todos los miembros pueden crear publicaciones y comentar.`
  },
  {
    title: "Soporte y tickets",
    category: "support",
    subcategory: "faq",
    priority: 8,
    source: "web",
    sourceUrl: "/dashboard/support",
    keywords: ["soporte", "ayuda", "ticket", "problema", "error", "contacto"],
    synonyms: ["support", "ayuda", "contactar", "reportar", "queja", "duda"],
    content: `Si tienes algún problema o duda, puedes crear un ticket de soporte desde tu dashboard.

Pasos:
1. Ve a tu Dashboard > Soporte
2. Haz clic en "Nuevo Ticket"
3. Escribe el asunto y tu mensaje
4. Selecciona la prioridad (baja, normal, alta, urgente)

Un administrador te responderá a la brevedad. Los usuarios PRO+ tienen prioridad en la respuesta con tiempo estimado de 1 hora.

También puedes contactarnos directamente por:
- Email: A través del formulario de contacto en la web
- WhatsApp: +53 51819744
- Telegram: Usando el bot oficial`
  },
  {
    title: "Chat en vivo y soporte en tiempo real",
    category: "support",
    subcategory: "faq",
    priority: 7,
    source: "web",
    sourceUrl: "/",
    keywords: ["chat", "vivo", "tiempo real", "mensaje", "admin"],
    synonyms: ["live chat", "chat en vivo", "mensaje directo", "hablar con admin"],
    content: `El chat en vivo está disponible en la esquina inferior derecha de la pantalla (icono 💬).

Cómo funciona:
- Abre el chat haciendo clic en el icono flotante
- Escribe tu mensaje
- Un administrador te responderá en tiempo real
- Si el admin no responde en 5 minutos, se envía una notificación por Telegram

El chat es ideal para consultas rápidas que no requieren un ticket de soporte completo.

Los mensajes se guardan en tu sesión, así que puedes retomar la conversación después.`
  },
  {
    title: "Blog de skincare",
    category: "blog",
    subcategory: "faq",
    priority: 5,
    source: "web",
    sourceUrl: "/blog",
    keywords: ["blog", "artículos", "tips", "consejos", "skincare", "rutina"],
    synonyms: ["articulos", "blog", "leer", "consejos", "tips"],
    content: `El blog de The Serene Lens tiene artículos sobre cuidado de la piel escritos por expertos en cosmética.

Categorías disponibles:
- Cuidado básico: limpieza, hidratación, protección solar
- Rutinas: cómo estructurar tu rutina diaria
- Ingredientes: guía de ingredientes activos
- Protección solar: importancia y cómo elegir el FPS adecuado
- Problemas de piel: manchas, acné, arrugas, sensibilidad

Cada artículo incluye:
- Información respaldada por evidencia cosmética
- Recomendaciones de productos
- Tiempo de lectura estimado
- Compartir en redes sociales`
  },
  {
    title: "Guías digitales descargables",
    category: "general",
    subcategory: "guide",
    priority: 6,
    source: "web",
    sourceUrl: "/guides",
    keywords: ["guías", "digitales", "pdf", "descargar", "ebook", "libro"],
    synonyms: ["guias", "pdf", "descargable", "ebook", "manual"],
    content: `Las guías digitales son e-books descargables con información detallada sobre cuidado de la piel.

Guías disponibles:
- Guía para piel grasa
- Cómo eliminar manchas en 30 días
- Rutina anti-edad para +40
- Ingredientes que debes evitar
- Protección solar anual
- Rutina para principiantes
- Guía completa de acné
- Ingredientes activos explicados
- Skincare tropical (para climas húmedos)
- Guía de exfoliación
- Skincare masculino

Cada guía cuesta entre $1.99 y $4.99 USD. Se pagan con QvaPay y se descargan inmediatamente en PDF.`
  },
  {
    title: "Sistema de referidos",
    category: "general",
    subcategory: "faq",
    priority: 6,
    source: "web",
    sourceUrl: "/dashboard/referrals",
    keywords: ["referidos", "invitar", "amigos", "compartir", "grupo", "recomendar"],
    synonyms: ["referidos", "invitar amigos", "compartir", "recomendar", "grupo"],
    content: `El sistema de referidos te permite invitar a tus amigos a The Serene Lens y obtener beneficios.

Cómo funciona:
1. Crea un grupo de referidos desde tu dashboard
2. Comparte el código único con tus amigos
3. Cuando 3 amigos se registren usando tu código y completen su análisis, ¡todos reciben un análisis gratis!

Beneficios:
- Análisis gratis para ti y tus amigos
- Seguimiento del progreso de tu grupo
- Sin límite de grupos que puedas crear

Los códigos de referido se comparten fácilmente por WhatsApp, Telegram o redes sociales.`
  },
  {
    title: "Transfermóvil: cómo pagar desde Cuba",
    category: "pricing",
    subcategory: "tutorial",
    priority: 9,
    source: "web",
    sourceUrl: "/pricing",
    keywords: ["transfermóvil", "cuba", "cup", "pago", "código", "referencia", "validar"],
    synonyms: ["transfermovil", "cuba", "cup", "pago desde cuba", "validar pago", "referencia"],
    content: `Para pagar con Transfermóvil desde Cuba:

1. Selecciona el plan que deseas (PREMIUM, PRO o PRO+)
2. Elige "Transfermóvil" como método de pago
3. Se generará un código de referencia único
4. Realiza la transferencia desde tu aplicación Transfermóvil a la cuenta indicada
5. Guarda el número de referencia de tu transferencia
6. Vuelve a la web y valida tu pago con el código de referencia

Después del pago:
- Un administrador validará tu pago (generalmente en 24-48 horas)
- Recibirás una notificación cuando tu plan esté activo
- También puedes consultar el estado desde tu perfil

Cuenta para transferencias: 9238129970692986
Titular: Margelys Romero Mederos`
  },
  {
    title: "Diario de piel",
    category: "analysis",
    subcategory: "faq",
    priority: 5,
    source: "web",
    sourceUrl: "/dashboard/diary",
    keywords: ["diario", "piel", "seguimiento", "diario", "check-in"],
    synonyms: ["diario", "diario de piel", "check in", "registro diario", "estado"],
    content: `El Diario de Piel te permite llevar un registro diario de cómo se siente y se ve tu piel.

Características:
- Registro diario con puntuación (1-10)
- Notas sobre cómo se siente tu piel cada día
- Calendario visual con tu progreso mensual
- Gráfico de tendencia semanal
- Auto-registro después de cada análisis

Llevar un diario te ayuda a:
- Identificar patrones en tu piel
- Ver qué productos funcionan mejor
- Compartir información valiosa con tu esteticista
- Ver tu evolución a largo plazo`
  },
  {
    title: "Desafíos gamificados",
    category: "general",
    subcategory: "faq",
    priority: 4,
    source: "web",
    sourceUrl: "/dashboard/challenges",
    keywords: ["desafíos", "gamificación", "puntos", "retos", "logros"],
    synonyms: ["desafios", "retos", "logros", "puntos", "gamificacion"],
    content: `Los desafíos son retos gamificados para mantener tu rutina de skincare.

Tipos de desafíos:
- Diarios: metas pequeñas para cada día (ej: "Aplica protector solar hoy")
- Semanales: retos de una semana (ej: "Usa mascarilla 2 veces esta semana")
- Mensuales: metas a largo plazo (ej: "Completa tu rutina 25 días este mes")

Cada desafío completado te da puntos. Acumula puntos para desbloquear logros especiales.

Los desafíos se actualizan automáticamente y puedes ver tu progreso en tiempo real desde tu dashboard.`
  },
  {
    title: "Análisis de ingredientes de productos",
    category: "product",
    subcategory: "faq",
    priority: 7,
    source: "web",
    sourceUrl: "/products",
    keywords: ["ingredientes", "productos", "escanear", "analizar", "scanner"],
    synonyms: ["ingredientes", "productos", "scanner", "analizar producto", "composicion"],
    content: `El analizador de ingredientes te permite escanear productos de skincare para conocer su composición.

Cómo usarlo:
1. Ve a la sección "Productos" o usa la cámara desde el análisis
2. Toma una foto de la lista de ingredientes del producto
3. La IA analiza los ingredientes y te dice cuáles son beneficiosos y cuáles evitar

Resultados:
- Lista completa de ingredientes detectados
- Análisis por categoría: buenos, con precaución, evitar
- Resumen en lenguaje simple
- Recomendaciones según tu tipo de piel

El escáner funciona con cualquier producto, solo necesitas una foto clara de la etiqueta de ingredientes.`
  },
  {
    title: "Preguntas frecuentes sobre privacidad",
    category: "general",
    subcategory: "faq",
    priority: 6,
    source: "web",
    sourceUrl: "/privacy",
    keywords: ["privacidad", "datos", "fotos", "seguridad", "protección"],
    synonyms: ["privacidad", "datos personales", "fotos", "seguridad", "proteccion de datos"],
    content: `Política de privacidad de The Serene Lens:

- Tus fotos se usan solo para el análisis y se almacenan de forma segura
- No compartimos tus datos con terceros sin tu consentimiento
- Puedes eliminar tu cuenta y todos tus datos en cualquier momento desde tu perfil
- Las imágenes se comprimen antes de enviarse a la IA
- No guardamos las imágenes originales después del análisis
- Usamos encriptación SSL para toda la transmisión de datos
- Los pagos se procesan a través de proveedores seguros (QvaPay, PayPal)

Tienes derecho a:
- Acceder a tus datos personales
- Solicitar la corrección de datos incorrectos
- Solicitar la eliminación de tus datos
- Retirar tu consentimiento en cualquier momento
- Exportar tus datos en formato portable

Para ejercer tus derechos, contacta a: hereirajaison@gmail.com`
  },
]

async function seed() {
  console.log("🌱 Sembrando base de conocimiento del bot...")

  for (const entry of knowledgeBase) {
    const existing = await db.botKnowledge.findFirst({
      where: { title: entry.title },
    })

    if (existing) {
      await db.botKnowledge.update({
        where: { id: existing.id },
        data: {
          ...entry,
          version: existing.version + 1,
        },
      })
      console.log(`  Actualizado: ${entry.title}`)
    } else {
      await db.botKnowledge.create({
        data: {
          ...entry,
          enabled: true,
        },
      })
      console.log(`  Creado: ${entry.title}`)
    }
  }

  console.log("✅ Base de conocimiento sembrada correctamente")
}

seed().catch((e) => {
  console.error("Error al sembrar knowledge base:", e)
  process.exit(1)
})
