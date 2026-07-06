import { db } from "@/lib/db"

const knowledgeBase = [
  {
    title: "Rutina completa para piel grasa",
    category: "product",
    subcategory: "guide",
    priority: 8,
    source: "knowledge",
    sourceUrl: "",
    keywords: ["piel grasa", "rutina grasa", "control grasa", "sebo", "brillo", "oil-free"],
    synonyms: ["piel grasa", "grasosa", "brillo facial", "controlar grasa", "exceso sebo"],
    content: `Rutina recomendada para piel grasa:

Mañana:
1. Limpiador en gel con ácido salicílico (libera poros y reduce grasa)
2. Tónico equilibrante sin alcohol (niacinamida regula sebo)
3. Hidratante oil-free en gel o loción (ácido hialurónico, sin aceites)
4. Protector solar oil-free SPF 50 (mineral o matificante)

Noche:
1. Doble limpieza: limpiador suave + gel con salicílico
2. Exfoliación química 2-3 veces/semana (ácido salicílico 2%, glicólico 5-10%)
3. Sérum de niacinamida 5-10% (reduce poros y regula grasa)
4. Hidratante ligero sin aceite

Ingredientes clave: niacinamida, ácido salicílico, zinc, arcilla kaolin, retinoides (noche). Evitar: aceites comedogénicos (coco, palma), alcohol denat, fragancias.`
  },
  {
    title: "Rutina completa para piel seca",
    category: "product",
    subcategory: "guide",
    priority: 8,
    source: "knowledge",
    sourceUrl: "",
    keywords: ["piel seca", "rutina seca", "hidratación", "ceramidas", "barrera cutánea"],
    synonyms: ["piel seca", "deshidratada", "tirante", "reseca", "falta hidratacion"],
    content: `Rutina recomendada para piel seca:

Mañana:
1. Limpiador en crema o leche (sin sulfatos, pH balanceado)
2. Tónico hidratante (sin alcohol, con ácido hialurónico)
3. Sérum de ácido hialurónico (aplicar sobre piel húmeda)
4. Crema hidratante rica (con ceramidas, manteca de karité)
5. Protector solar hidratante SPF 50

Noche:
1. Limpiador en crema (doble limpieza con aceite desmaquillante si usas maquillaje)
2. Exfoliación suave 1 vez/semana (ácido láctico o PHA)
3. Sérum nutritivo (escualano, ceramidas, ácidos grasos)
4. Crema nocturna rica (niacinamida 2-4%, péptidos)
5. Opcional: aceite facial sellador (escualano, rosa mosqueta)

Ingredientes clave: ácido hialurónico, ceramidas, escualano, manteca de karité, glicerina, avena coloidal. Evitar: sulfatos agresivos (SLS), alcohol denat, exfoliación excesiva.`
  },
  {
    title: "Protección solar: guía completa",
    category: "product",
    subcategory: "guide",
    priority: 9,
    source: "knowledge",
    sourceUrl: "",
    keywords: ["protector solar", "spf", "fps", "rayos uv", "protección", "reaplicar"],
    synonyms: ["protector solar", "bloqueador", "filtro solar", "spf", "fps", "crema con color"],
    content: `Guía completa de protección solar:

¿Por qué es importante?
- Previene envejecimiento prematuro (80% del envejecimiento es por sol)
- Reduce riesgo de cáncer de piel
- Previene manchas y hiperpigmentación
- Protege la barrera cutánea

¿Qué SPF elegir?
- SPF 30: bloquea 97% de rayos UVB
- SPF 50: bloquea 98% (mínimo recomendado para rostro)
- SPF 50+: protección extra para pieles sensibles o muy claras

¿Cómo aplicarlo?
- Cantidad: 2 dedos de producto para rostro y cuello
- Tiempo: 15-30 minutos antes de exposición solar
- Reaplicar cada 2 horas (o después de sudar/nadar)
- No olvidar: orejas, cuello, dorso de manos, labios

¿Físico vs Químico?
- Físico (mineral): óxido de zinc, dióxido de titanio — ideal para piel sensible
- Químico: avobenzona, octinoxato — textura más ligera, sin white cast

Datos clave: Usa protector solar incluso en días nublados (80% de rayos UV penetran nubes). Los rayos UVA atraviesan vidrios. En Cuba la radiación UV es alta todo el año.`
  },
  {
    title: "Ácido hialurónico: guía completa",
    category: "product",
    subcategory: "ingredient",
    priority: 7,
    source: "knowledge",
    sourceUrl: "",
    keywords: ["ácido hialurónico", "hialurónico", "hidratación", "moléculas", "sérum"],
    synonyms: ["acido hialuronico", "hialuronico", "hidratacion", "acido hialuronico beneficios"],
    content: `Guía completa del ácido hialurónico (AH):

¿Qué es? Molécula presente naturalmente en la piel que retiene hasta 1000 veces su peso en agua.

Beneficios:
- Hidratación profunda inmediata
- Rellena líneas finas temporalmente
- Mejora elasticidad y firmeza
- Acelera regeneración de barrera cutánea
- Compatible con todo tipo de piel

Tipos por peso molecular:
- Alto peso (AH): hidrata superficie, efecto película
- Medio peso: penetra capas medias, hidratación prolongada
- Bajo peso (AH fragmentado): penetra más profundo, efecto relleno
- AH reticulado: mayor duración, ideal para fórmulas con textura gel
- Multi-peso: combinación de varios tamaños (recomendado)

Cómo usarlo:
1. Aplicar sobre piel húmeda (potencia su efecto)
2. Usar en mañana después de limpiador, antes de crema
3. Sellar con crema hidratante para evitar que se evapore
4. Combinar bien con: vitamina C (mañana), niacinamida, péptidos

Concentraciones: desde 0.5% (mantenimiento) hasta 2-3% (hidratación intensa).`
  },
  {
    title: "Retinol: guía para principiantes",
    category: "product",
    subcategory: "ingredient",
    priority: 7,
    source: "knowledge",
    sourceUrl: "",
    keywords: ["retinol", "retinoide", "antiedad", "arrugas", "principiantes", "introducción"],
    synonyms: ["retinol", "retinal", "retinoide", "vitamina a", "antiedad", "anti edad"],
    content: `Guía completa de retinol para principiantes:

¿Qué es? El retinol es un derivado de la vitamina A, uno de los ingredientes más estudiados y efectivos en cosmética.

Beneficios:
- Estimula producción de colágeno (reduce arrugas)
- Acelera renovación celular (textura más uniforme)
- Reduce poros obstruidos y acné
- Mejora hiperpigmentación y manchas
- Uniforma el tono de la piel

Cómo empezar (método gradual):
- Semana 1-2: aplicar 1 vez cada 3 noches
- Semana 3-4: aplicar 1 vez cada 2 noches
- Semana 5+: aplicar noche sí, noche no (o diario si toleras)
- Cantidad: una pequeña gota (tamaño de arveja)

Reglas de ORO:
1. Siempre de noche (el sol lo degrada)
2. Protector solar OBLIGATORIO en mañana
3. Nunca mezclar con ácidos exfoliantes (glicólico, salicílico) misma noche
4. No aplicar en piel húmeda (irrita más)
5. Usar la técnica "sándwich": crema hidratante → retinol → crema hidratante

Concentraciones para empezar: 0.1% o 0.25% (máximo 0.3% para primer retinol).`

  },
  {
    title: "Niacinamida: beneficios y uso",
    category: "product",
    subcategory: "ingredient",
    priority: 7,
    source: "knowledge",
    sourceUrl: "",
    keywords: ["niacinamida", "vitamina b3", "poros", "manchas", "sebo", "barrera"],
    synonyms: ["niacinamida", "vitamina b3", "nicotinamida", "niacina"],
    content: `Guía de niacinamida (vitamina B3):

La niacinamida es uno de los ingredientes más versátiles y mejor tolerados en skincare.

Beneficios principales:
- Regula la producción de sebo (ideal para piel grasa/mixta)
- Reduce apariencia de poros dilatados
- Fortalece la barrera cutánea (aumenta ceramidas)
- Disminuye inflamación y enrojecimiento
- Ayuda a uniformar el tono (manchas y decoloración)
- Sinergia con otros activos (compatible con casi todo)

Concentraciones recomendadas:
- 2-4%: mantenimiento, piel sensible, principiantes
- 5%: balance ideal mayoría de usuarios
- 10%: tratamiento intensivo (puede causar hormigueo)

Cómo usarla:
- Mañana y/o noche (muy versátil)
- Textura: sérum o crema
- Aplicar después de limpiador, antes de hidratante
- Combinaciones ganadoras:
  - Con ácido hialurónico (hidratación + regulación)
  - Con protector solar (potencia protección)
  - Con retinol (reduce irritación del retinol)

Contraindicaciones: Muy segura, baja irritación. Rara vez causa brotes iniciales (purga suave) o enrojecimiento en altas concentraciones.`
  },
  {
    title: "Vitamina C: cómo y cuándo usarla",
    category: "product",
    subcategory: "ingredient",
    priority: 7,
    source: "knowledge",
    sourceUrl: "",
    keywords: ["vitamina c", "ácido ascórbico", "antioxidante", "luminosidad", "manchas", "colágeno"],
    synonyms: ["vitamina c", "acido ascorbico", "antioxidante", "l ascorbico", "vitamin c"],
    content: `Guía de vitamina C tópica (ácido ascórbico):

La vitamina C es el antioxidante más estudiado en cosmética.

Beneficios:
- Antioxidante potente (neutraliza radicales libres)
- Estimula producción de colágeno (previene arrugas)
- Reduce manchas oscuras y uniforma tono
- Potencia la eficacia del protector solar
- Ilumina y da luminosidad a la piel

Concentraciones:
- 5-10%: mantenimiento, piel sensible
- 10-15%: balance eficacia/tolerancia
- 15-20%: máxima potencia (puede irritar)

Cómo usarla correctamente:
- APLICAR EN MAÑANA (nunca en noche)
- Primero: limpiador → vitamina C (esperar 2 min) → hidratante → SPF
- Dato clave: la vitamina C + protector solar = protección antioxidante 8x mayor
- No mezclar con: retinol (misma rutina), ácidos exfoliantes fuertes

Presentaciones:
- Ácido ascórbico puro (L-AA): más efectivo pero inestable
- Derivados (ascorbyl phosphate, ascorbyl glucoside): más estables, menos irritantes
- Con vitamina E + ácido ferúlico: fórmula gold standard (mayor estabilidad)

Almacenamiento: botella oscura, lugar fresco, sin luz directa. Usar en 3 meses.`
  },
  {
    title: "Cómo identificar tu tipo de piel en casa",
    category: "product",
    subcategory: "guide",
    priority: 7,
    source: "knowledge",
    sourceUrl: "",
    keywords: ["tipo de piel", "identificar", "test", "grasa", "seca", "mixta", "normal", "sensible"],
    synonyms: ["tipo de piel", "como saber mi tipo de piel", "identificar piel", "test de piel"],
    content: `Cómo identificar tu tipo de piel desde casa:

Método del papel absorbente:
1. Lava tu rostro con un limpiador suave
2. No apliques ningún producto después
3. Espera 1 hora
4. Presiona suavemente un papel absorbente o tissue en diferentes zonas:
   - Zona T (frente, nariz, barbilla)
   - Mejillas

Resultados:
- Grasa: papel se impregna en toda la cara, especialmente zona T
- Mixta: papel se impregna en zona T pero no en mejillas
- Seca: papel casi no recoge grasa, piel se siente tirante
- Normal: papel recoge grasa moderada y uniforme

Método de observación visual:
Observa tu piel al despertar (sin lavar):
- Grasa: aspecto brillante en toda la cara
- Mixta: brillo en zona T, normal en mejillas
- Seca: aspecto opaco, posible descamación, sensación tirante
- Normal: equilibrio, ni muy brillante ni muy opaca

Señales de piel sensible:
- Enrojecimiento frecuente
- Picazón o ardor al aplicar productos
- Reacción a cambios de temperatura
- Rosácea o cuperosis visible

Importante: tu tipo de piel puede cambiar con estaciones, edad, hormonas y clima.`
  },
  {
    title: "Errores comunes en skincare",
    category: "product",
    subcategory: "guide",
    priority: 6,
    source: "knowledge",
    sourceUrl: "",
    keywords: ["errores", "skincare", "rutina", "malos hábitos", "exfoliación", "limpieza"],
    synonyms: ["errores", "malos habitos", "errores comunes", "no hacer", "evitar"],
    content: `Errores comunes en el cuidado de la piel y cómo evitarlos:

1. Exfoliar demasiado
- Error: exfoliar todos los días (daña la barrera)
- Correcto: 1-3 veces por semana según tipo de piel

2. No usar protector solar
- Error: solo usar cuando hay sol
- Correcto: todos los días, incluso nublado

3. Saltarse la limpieza nocturna
- Error: dormir con maquillaje o protector solar
- Correcto: limpiar siempre antes de dormir

4. Usar demasiados activos
- Error: aplicar 5+ sérums diferentes (irrita la piel)
- Correcto: máximo 2-3 activos por rutina, rotar días

5. Aplicar productos en orden incorrecto
- Error: crema antes que sérum (bloquea absorción)
- Correcto: más ligero a más denso (tóner → sérum → crema → aceite)

6. Ignorar el cuello y escote
- Error: solo cuidar el rostro
- Correcto: extender todos los productos al cuello

7. Cambiar productos muy seguido
- Error: probar algo nuevo cada semana
- Correcto: darle 4-6 semanas a cada producto

8. Usar agua muy caliente
- Error: lavar con agua caliente (reseca)
- Correcto: agua tibia o fría

9. Aplicar retinol sin protección solar
- Error: usar retinol sin SPF (manchas y sensibilidad)
- Correcto: SPF 50 obligatorio cada mañana

10. No limpiar el teléfono/fundas de almohada
- Error: apoyar el rostro sobre superficies sucias
- Correcto: limpiar funda cada semana, el teléfono con alcohol`
  },
  {
    title: "Cómo leer una etiqueta INCI de ingredientes",
    category: "product",
    subcategory: "guide",
    priority: 7,
    source: "knowledge",
    sourceUrl: "",
    keywords: ["inci", "etiqueta", "ingredientes", "leer", "composición", "orden"],
    synonyms: ["inci", "lista ingredientes", "como leer ingredientes", "etiqueta producto", "componentes"],
    content: `Cómo leer la lista de ingredientes (INCI) de un producto cosmético:

La lista INCI (International Nomenclature of Cosmetic Ingredients) es obligatoria en todos los productos cosméticos.

Reglas básicas:
- Los ingredientes se listan en ORDEN DECRECIENTE de concentración
- Los primeros 3-5 ingredientes son los que más contiene el producto
- Los que están al final tienen menos de 1% de concentración
- Los ingredientes activos suelen aparecer entre la mitad y el final

Identificando ingredientes clave:
- Bueno: ingredientes activos como niacinamida (5°-15° puesto), retinol (mitad-final)
- Precaución: alcohol denat (primeros puestos = puede resecar)
- Evitar: parabenos (methylparaben, propylparaben), sulfatos agresivos (sodium lauryl sulfate)

Ingredientes comunes y su propósito:
- Humectantes: glycerin, hyaluronic acid, propylene glycol — atraen agua
- Emolientes: squalane, dimethicone, caprylic/capric triglyceride — suavizan
- Oclusivos: petroleum, lanolin, shea butter — sellan hidratación
- Tensioactivos: sodium coco-sulfate, cocamidopropyl betaine — limpian
- Conservantes: phenoxyethanol, sodium benzoate, potassium sorbate — evitan contaminación
- Fragancias: parfum, limonene, linalool — aroma (pueden irritar)

Tips:
- Si buscas un activo específico, mira que esté en la primera mitad de la lista
- Las fragancias y aceites esenciales aparecen al final (baja concentración)
- Ingredientes con nombres químicos largos son seguros en cosmética
- "Dermocompatible" y "hypoallergenic" no están regulados — siempre revisa la lista`
  },
  {
    title: "Skincare según la edad",
    category: "product",
    subcategory: "guide",
    priority: 6,
    source: "knowledge",
    sourceUrl: "",
    keywords: ["edad", "skincare por edad", "20s", "30s", "40s", "50s", "antiedad"],
    synonyms: ["edad", "20 años", "30 años", "40 años", "50 años", "antiedad por edad", "rutina por edad"],
    content: `Recomendaciones de skincare según tu década:

20s — Prevención y hábitos
- Limpiador suave, hidratante ligero, SPF 50 diario
- Incorporar antioxidantes (vitamina C en mañana)
- Si hay acné: ácido salicílico o niacinamida
- NO necesitas retinol todavía (excepto para acné)
- Objetivo: crear hábitos que durarán toda la vida

30s — Primeros signos y prevención avanzada
- Añadir retinol suave (0.1-0.3%) para renovación celular
- Ácido hialurónico para hidratación profunda
- Péptidos para estimular colágeno
- Antioxidantes + SPF (imprescindible)
- Objetivo: prevenir líneas finas y mantener firmeza

40s — Tratamiento intensivo
- Retinol medio (0.5-1%) o retinaldehído
- Vitamina C + ácido ferúlico para luminosidad
- Ácido glicólico para renovación y manchas
- Ceramidas para fortalecer barrera cutánea
- Cuidado del contorno de ojos con cafeína/péptidos
- Objetivo: estimular colágeno, tratar manchas

50+ — Hidratación y nutrición profunda
- Retinol u otros retinoides según tolerancia
- Ácido hialurónico + ceramidas + escualano
- Crema rica con péptidos y lípidos
- Tratamiento de manchas con ácido kójico, azelaico
- Ingredientes reafirmantes (DMAE, proteínas de seda)
- Objetivo: hidratación intensa y renovación segura

Para todas las edades: protector solar, hidratación, constancia, y productos según tu tipo de piel específico.`
  },
  {
    title: "Relación entre alimentación y piel",
    category: "product",
    subcategory: "guide",
    priority: 5,
    source: "knowledge",
    sourceUrl: "",
    keywords: ["alimentación", "dieta", "comida", "nutrición", "piel", "colágeno"],
    synonyms: ["alimentacion", "dieta", "comida", "nutricion", "piel sana", "colageno natural"],
    content: `Cómo la alimentación afecta tu piel:

Alimentos que benefician la piel:
- Ricos en omega-3: salmón, sardinas, nueces, chía, linaza (antiinflamatorio natural)
- Ricos en vitamina C: cítricos, kiwi, fresas, pimiento rojo (estimula colágeno)
- Ricos en zinc: ostras, semillas de calabaza, garbanzos (ayuda con acné)
- Ricos en antioxidantes: berries, té verde, cacao puro, espinacas
- Colágeno: caldo de huesos, gelatina sin sabor, suplementos con vitamina C

Alimentos que pueden afectar negativamente:
- Azúcar refinada: glicación → rompe colágeno y elastina
- Lácteos en exceso: pueden exacerbar acné en personas sensibles
- Alcohol: deshidrata, dilata vasos, empeora rosácea
- Comida ultraprocesada: inflamación sistémica

Hidratación:
- 8 vasos de agua al día (mínimo)
- Tés e infusiones sin azúcar también cuentan
- La piel deshidratada se ve opaca y acentúa líneas finas

Mitos:
- "El chocolate causa acné" → Falso (el cacao puro no, el azúcar sí)
- "Beber mucha agua elimina arrugas" → Parcialmente cierto (hidrata pero no elimina)
- "Los suplementos de colágeno funcionan" → Evidencia mixta (mejor con vitamina C)

Dato clave: la piel es el último órgano en recibir nutrientes. Una dieta equilibrada se refleja en la piel después de semanas o meses de constancia.`
  },
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
