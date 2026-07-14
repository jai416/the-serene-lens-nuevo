import "dotenv/config"
import { Pool } from "pg"
import { PrismaPg } from "@prisma/adapter-pg"
import { PrismaClient } from "../src/generated/prisma/client"
import crypto from "crypto"

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const db = new PrismaClient({ adapter })

async function hashPassword(password: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const salt = crypto.randomBytes(16).toString("hex")
    crypto.scrypt(password, salt, 64, (err, derivedKey) => {
      if (err) reject(err)
      resolve(`${salt}:${derivedKey.toString("hex")}`)
    })
  })
}

async function main() {
  console.log("Seeding database...")

  const adminEmail = process.env.ROOT_ADMIN_EMAIL || "admin@theserenelens.com"
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || "admin123"

  const admin = await db.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      name: "Admin",
      password: await hashPassword(adminPassword),
      role: "ADMIN",
      plan: "PRO",
    },
  })
  console.log(`Admin user: ${admin.email} (password: ${adminPassword})`)

  const demo = await db.user.upsert({
    where: { email: "demo@theserenelens.com" },
    update: {},
    create: {
      email: "demo@theserenelens.com",
      name: "Demo User",
      password: await hashPassword("demo123"),
      role: "USER",
      plan: "FREE",
    },
  })
  console.log(`Demo user: ${demo.email} (password: demo123)`)

  const posts = [
    {
      title: "¿Cómo identificar tu tipo de piel?",
      slug: "como-identificar-tu-tipo-de-piel",
      excerpt: "Aprende a reconocer las características de tu piel para elegir los productos adecuados.",
      content: `Identificar tu tipo de piel es el primer paso para una rutina de cuidado efectiva.

## Piel Normal
- Textura suave y uniforme
- Poros poco visibles
- Sin imperfecciones frecuentes
- Brillo equilibrado

## Piel Seca
- Sensación de tirantez después del lavado
- Textura áspera o escamosa
- Poros casi invisibles
- Enrojecimiento ocasional

## Piel Grasa
- Brillo visible especialmente en zona T
- Poros dilatados
- Tendencia a imperfecciones
- Maquillaje se desvanece rápido

## Piel Mixta
- Zona T brillante (frente, nariz, barbilla)
- Mejillas normales o secas
- Poros más visibles en zona T
- Es el tipo más común

## Piel Sensible
- Enrojecimiento frecuente
- Reacciones a productos
- Sensación de ardor o picazón
- Visiblemente irritada

Recuerda que esta es una guía informativa. Consulta a un dermatólogo para un diagnóstico profesional.`,
      image: "https://cdn-icons-png.flaticon.com/512/3076/3076641.png",
      category: "cuidado-basico",
      tags: "piel,tipos de piel,cuidado facial",
      published: true,
      readTime: 5,
    },
    {
      title: "Rutina básica de cuidado facial: Mañana vs Noche",
      slug: "rutina-basica-cuidado-facial",
      excerpt: "Descubre la diferencia entre tu rutina de día y de noche para maximizar los beneficios.",
      content: `Una rutina facial efectiva se divide en dos momentos clave: mañana y noche.

## Rutina de Mañana
1. **Limpieza suave** - Retira el exceso de grasa acumulado durante la noche
2. **Tónico** - Equilibra el pH de la piel
3. **Sérum** - Ingredientes activos ligeros
4. **Hidratante** - Crema ligera
5. **Protector solar** - PASO MÁS IMPORTANTE

## Rutina de Noche
1. **Doble limpieza** - Desmaquillante + limpiador facial
2. **Exfoliación** (2-3 veces por semana)
3. **Tónico**
4. **Sérum** - Ingredientes reparadores
5. **Hidratante** - Crema más nutritiva
6. **Contorno de ojos**

La noche es cuando la piel se regenera, por eso los productos más potentes se aplican antes de dormir.`,
      image: "https://cdn-icons-png.flaticon.com/512/3076/3076644.png",
      category: "rutinas",
      tags: "rutina,cuidado facial,mañana,noche",
      published: true,
      readTime: 4,
    },
    {
      title: "Ingredientes cosméticos: Guía para principiantes",
      slug: "ingredientes-cosmeticos-guia",
      excerpt: "Conoce los ingredientes más comunes en cosmética y cómo benefician tu piel.",
      content: `Entender los ingredientes de tus productos es clave para elegir lo mejor para tu piel.

## Humectantes
- **Ácido Hialurónico**: Atrae y retiene la humedad
- **Glicerina**: Humectante suave y efectivo
- **Escualano**: Similar al sebo natural de la piel

## Emolientes
- **Manteca de Karité**: Nutre y suaviza
- **Aceite de Jojoba**: Similar al sebo natural
- **Ceramidas**: Reparan la barrera cutánea

## Exfoliantes
- **AHA** (Ácido Glicólico, Láctico): Exfoliación química superficial
- **BHA** (Ácido Salicílico): Penetra poros, ideal para piel grasa

## Antioxidantes
- **Vitamina C**: Ilumina y protege
- **Vitamina E**: Hidrata y repara
- **Niacinamida**: Regula sebo y poros

Recuerda: más ingredientes no significa mejor. La concentración y formulación importan más que la lista larga de ingredientes.`,
      image: "https://cdn-icons-png.flaticon.com/512/3076/3076647.png",
      category: "ingredientes",
      tags: "ingredientes,cosmética,guía",
      published: true,
      readTime: 6,
    },
    {
      title: "Protector solar: Todo lo que debes saber",
      slug: "protector-solar-guia-completa",
      excerpt: "Mitos, verdades y cómo elegir el FPS adecuado para tu tipo de piel.",
      content: `El protector solar es el producto más importante de cualquier rutina de cuidado facial.

## ¿Qué significa FPS?
FPS significa Factor de Protección Solar. Un FPS 15 bloquea el 93% de los rayos UVB, FPS 30 bloquea el 97%, y FPS 50 bloquea el 98%. Ningún protector bloquea el 100%.

## Protección UVA vs UVB
- **UVB**: Queman la piel, responsables de las quemaduras solares
- **UVA**: Penetran más profundo, causan envejecimiento prematuro y arrugas
- Busca protectores de **amplio espectro** que cubran ambos

## ¿Cada cuánto aplicarlo?
Cada 2 horas si estás al aire libre. Inmediatamente después de nadar o sudar. Incluso en días nublados — hasta el 80% de los rayos UV atraviesan las nubes.

## ¿Necesito FPS si estoy en interiores?
Sí. La luz azul de pantallas y la luz indirecta que entra por ventanas también afectan la piel. Un FPS 30 diario es recomendable incluso en casa.

## Protector químico vs físico
- **Químico**: Se absorbe en la piel, textura ligera, sin residuo blanco
- **Físico (mineral)**: Crea una barrera reflectante, ideal para piel sensible, puede dejar residuo blanco

Conclusión: el mejor protector es el que usas todos los días. Elige el que más te guste y hazlo parte de tu rutina.`,
      image: "https://cdn-icons-png.flaticon.com/512/3076/3076650.png",
      category: "proteccion-solar",
      tags: "protector solar,FPS,UV,protección solar",
      published: true,
      readTime: 7,
    },
    {
      title: "Acné adulto: causas y tratamiento",
      slug: "acne-adulto-causas-tratamiento",
      excerpt: "El acné no es solo cosa de adolescentes. Descubre por qué aparece en la edad adulta y cómo tratarlo.",
      content: `El acné adulto afecta a muchas personas después de los 25 años. Conoce sus causas y soluciones.

## Causas principales
1. **Estrés**: Aumenta el cortisol, que estimula la producción de sebo
2. **Cambios hormonales**: Ciclo menstrual, embarazo, menopausia
3. **Dieta**: Alimentos con alto índice glucémico pueden desencadenar brotes
4. **Productos comedogénicos**: Algunos cosméticos obstruyen los poros
5. **Falta de sueño**: Afecta la regeneración celular y el equilibrio hormonal

## Tratamiento efectivo
- **Limpieza suave**: No más de dos veces al día, evitar jabones agresivos
- **Ingredientes clave**: Ácido salicílico (BHA), peróxido de benzoilo, niacinamida
- **Hidratación**: Incluso la piel grasa necesita hidratación no comedogénica
- **Protector solar**: Algunos tratamientos aumentan la sensibilidad al sol

## Cuándo consultar a un dermatólogo
- Si el acné persiste después de 3 meses de cuidado constante
- Si deja cicatrices o manchas oscuras
- Si afecta tu autoestima o calidad de vida`,
      image: "https://cdn-icons-png.flaticon.com/512/3076/3076653.png",
      category: "problemas-de-piel",
      tags: "acné,adulto,tratamiento,causas",
      published: true,
      readTime: 6,
    },
    {
      title: "Skincare minimalista: menos es más",
      slug: "skincare-minimalista-rutina-efectiva",
      excerpt: "Una rutina efectiva no necesita 10 pasos. Aprende a simplificar tu cuidado facial.",
      content: `El skincare minimalista se basa en usar solo lo necesario para mantener tu piel saludable.

## Los 3 pasos esenciales
1. **Limpieza**: Mañana y noche, adaptada a tu tipo de piel
2. **Hidratación**: Devuelve la humedad después de la limpieza
3. **Protección solar**: Cada mañana, sin excepción

## ¿Qué puedes añadir?
- **Sérum** si tienes una preocupación específica (manchas, arrugas, acné)
- **Exfoliante** 1-2 veces por semana
- **Contorno de ojos** si lo necesitas

## Beneficios de simplificar
- Menos irritación y reacciones
- Más económico
- Fácil de mantener consistencia
- Identificas más rápido qué funciona y qué no

Tu piel no necesita 15 productos. Necesita los correctos para ti.`,
      image: "https://cdn-icons-png.flaticon.com/512/3076/3076656.png",
      category: "rutinas",
      tags: "minimalista,rutina,simplificar",
      published: true,
      readTime: 4,
    },
    {
      title: "Vitamina C: guía completa del antioxidante estrella",
      slug: "vitamina-c-guia-completa",
      excerpt: "Todo lo que necesitas saber sobre la vitamina C en cosmética: beneficios, concentraciones y cómo usarla.",
      content: `La vitamina C es uno de los ingredientes más estudiados y efectivos en el cuidado de la piel.

## Beneficios principales
1. **Ilumina la piel**: Reduce manchas oscuras y unifica el tono
2. **Estimula colágeno**: Ayuda a prevenir líneas finas y arrugas
3. **Protección antioxidante**: Neutraliza radicales libres del sol y contaminación
4. **Potencia el protector solar**: Funciona en sinergia con el FPS

## Concentraciones recomendadas
- **10%**: Efectiva para principiantes, baja irritación
- **15%**: Concentración óptima para la mayoría de las pieles
- **20%**: Máxima efectividad, puede irritar pieles sensibles

## Cómo usarla
- Aplicar por la mañana después de la limpieza
- Esperar 2-3 minutos antes de aplicar hidratante
- Siempre seguida de protector solar
- Almacenar en lugar oscuro y fresco (la vitamina C es fotosensible)

## ¿Quién puede usarla?
Casi todo tipo de piel, excepto aquellas con alergia conocida. Las pieles sensibles deben empezar con concentraciones bajas (10%) y espaciar su uso.`,
      image: "https://cdn-icons-png.flaticon.com/512/3076/3076659.png",
      category: "ingredientes",
      tags: "vitamina C,antioxidante,iluminador",
      published: true,
      readTime: 7,
    },
    {
      title: "Retinoides para principiantes: guía completa",
      slug: "retinoides-guia-principiantes",
      excerpt: "Los retinoides son el gold standard antienvejecimiento. Aprende a incorporarlos sin irritación.",
      content: `Los retinoides son derivados de la vitamina A y el ingrediente más respaldado por la ciencia para el antienvejecimiento.

## ¿Qué hacen?
- Aceleran la renovación celular
- Estimulan la producción de colágeno
- Reducen líneas finas y arrugas
- Mejoran la textura y el tono de la piel
- Ayudan con el acné

## Tipos de retinoides
- **Retinol**: El más común en cosmética de venta libre
- **Retinaldehído**: Más potente que retinol, menos irritante que retinoico
- **Ácido Retinoico**: Solo con receta médica
- **Retinoides sintéticos**: Como adapaleno, disponibles sin receta

## Cómo empezar
1. **Una vez por semana** durante las primeras 2 semanas
2. **Dos veces por semana** las semanas 3-4
3. **Tres veces por semana** si tu piel lo tolera
4. Aplicar siempre por la noche (son fotosensibles)

## Reglas de oro
- Usa protector solar SÍ O SÍ todas las mañanas
- No combines con otros activos fuertes (AHA/BHA) al inicio
- Aplica sobre piel seca para reducir irritación
- La "purga" inicial (brotes) es normal las primeras 4-6 semanas`,
      image: "https://cdn-icons-png.flaticon.com/512/3076/3076662.png",
      category: "ingredientes",
      tags: "retinoides,retinol,antienvejecimiento",
      published: true,
      readTime: 8,
    },
    {
      title: "Hidratación de la piel: mitos y realidades",
      slug: "hidratacion-piel-mitos-realidades",
      excerpt: "Separamos los mitos más comunes sobre la hidratación facial de lo que realmente dice la ciencia.",
      content: `La hidratación es el pilar del cuidado de la piel, pero hay mucha desinformación.

## Mito 1: "La piel grasa no necesita hidratación"
**Realidad**: Todo tipo de piel necesita hidratación. Cuando la piel grasa no se hidrata, puede producir más sebo para compensar, empeorando el problema.

## Mito 2: "Beber mucha agua hidrata la piel directamente"
**Realidad**: La hidratación interna es importante para la salud general, pero el agua que bebes no se distribuye directamente a la capa córnea de la piel de forma significativa.

## Mito 3: "Los sérums de ácido hialurónico hidratan desde dentro"
**Realidad**: El ácido hialurónico atrae la humedad del ambiente hacia la piel, no desde el interior. Funciona mejor en ambientes húmedos y debe sellarse con una crema.

## Mito 4: "Una crema más grasa hidrata más"
**Realidad**: La hidratación la aportan los humectantes (glicerina, AH). Los aceites y mantecas son emolientes que sellan la hidratación, no la crean.

## Claves para una hidratación efectiva
1. Aplica productos en capas, del más líquido al más espeso
2. No dejes que una capa se seque completamente antes de la siguiente
3. Usa ingredientes humectantes (glicerina, AH) + emolientes (ceramidas, escualano)
4. No olvides el protector solar — la piel deshidratada es más vulnerable al daño solar`,
      image: "https://cdn-icons-png.flaticon.com/512/3076/3076665.png",
      category: "cuidado-basico",
      tags: "hidratación,mitos,piel,humectantes",
      published: true,
      readTime: 6,
    },
    {
      title: "Cómo leer etiquetas de cosméticos: guía práctica",
      slug: "como-leer-etiquetas-cosmeticos",
      excerpt: "Aprende a interpretar el INCI de cualquier producto cosmético y elige con conocimiento.",
      content: `El INCI (International Nomenclature of Cosmetic Ingredients) es el sistema de nomenclatura internacional para ingredientes cosméticos.

## Regla básica
Los ingredientes aparecen en **orden descendente de concentración**. El primero es el más abundante y el último el menos abundante.

## Cómo identificar ingredientes clave
- **Humectantes**: Glycerin, Hyaluronic Acid, Sodium PCA, Propanediol
- **Emolientes**: Squalane, Cetearyl Alcohol, Shea Butter, Jojoba Oil
- **Activos**: Ascorbic Acid (Vit C), Retinol, Niacinamide, Salicylic Acid
- **Conservantes**: Phenoxyethanol, Ethylhexylglycerin, Sodium Benzoate
- **Detergentes**: Sodium Lauryl Sulfate (SLS), Cocamidopropyl Betaine

## Lo que NO debes hacer
- No juzgues un producto por un solo ingrediente "malo"
- No creas que "natural" siempre es mejor
- No asumas que más ingredientes = mejor producto

## Lo mínimo que debe tener un buen producto
1. Nombre del ingrediente activo en los primeros 5-7 puestos
2. Conservantes adecuados (para que no se contamine)
3. Envase que proteja los ingredientes (opaco, dosificador)

Con esta guía podrás leer cualquier etiqueta y tomar decisiones informadas sobre lo que aplicas en tu piel.`,
      image: "https://cdn-icons-png.flaticon.com/512/3076/3076668.png",
      category: "ingredientes",
      tags: "INCI,etiquetas,ingredientes",
      published: true,
      readTime: 7,
    },
    {
      title: "Cuidado facial en clima tropical: rutina para la humedad",
      slug: "cuidado-facial-clima-tropical",
      excerpt: "El clima húmedo de Cuba exige ajustes en tu rutina. Aprende a mantener tu piel equilibrada sin importar la humedad.",
      content: `El trópico cubano tiene características únicas que afectan tu piel. Aprende a adaptar tu rutina.
      
## ¿Cómo afecta la humedad a tu piel?
La humedad alta (80%+ en Cuba) significa que tu piel ya recibe suficiente humedad del aire. Los humectantes pesados pueden ser contraproducentes.

## Temporada seca (noviembre - abril)
- Vientos alisios secan la piel
- Necesitas hidratación más intensa
- Buenos ingredientes: ácido hialurónico, glicerina, ceramidas
- Protector solar SPF 50+ obligatorio

## Temporada lluviosa (mayo - octubre)
- Humedad al 90%, calor intenso
- Rutina más ligera: gel hidratante en lugar de crema
- Exfoliación 2-3 veces por semana para evitar poros tapados
- Busca texturas oil-free y no comedogénicas

## Ingredientes estrella para el trópico
- **Niacinamida**: Regula el sebo, ideal para el calor
- **Ácido Salicílico**: Mantiene poros limpios en clima húmedo
- **Aloe Vera**: Calma y refresca después del sol
- **Vitamina C**: Protege del daño solar acumulativo

## Lo que debes evitar
- Cremas muy pesadas oclusivas
- Productos con aceites comedogénicos
- Exfoliación excesiva (la humedad no justifica frotar más)
- Saltarte el protector solar porque "está nublado"`,
      image: "https://cdn-icons-png.flaticon.com/512/3076/3076671.png",
      category: "cuidado-basico",
      tags: "clima tropical,humedad,Cuba,verano",
      published: true,
      readTime: 7,
    },
    {
      title: "Cómo adaptar tu skincare entre temporada seca y lluviosa",
      slug: "adaptar-skincare-temporada-seca-lluviosa",
      excerpt: "Cuba tiene dos estaciones bien marcadas. Tu rutina de skincare también debería cambiar entre noviembre y mayo.",
      content: `En Cuba, las estaciones afectan directamente cómo debes cuidar tu piel. Aprende a hacer la transición.

## Transición a temporada seca (noviembre)
**Cambios en tu piel:**
- Más tirantez después del lavado
- Zonas secas en mejillas y contorno de boca
- Menos brillo en zona T

**Ajustes necesarios:**
- Cambia tu limpiador a uno más cremoso (menos surfactante)
- Añade un sérum con ácido hialurónico
- Usa una crema nocturna más nutritiva
- Reduce exfoliación a 1 vez por semana

## Transición a temporada lluviosa (mayo)
**Cambios en tu piel:**
- Más brillo y sensación grasa
- Poros más visibles
- Posibles brotes por el calor y la humedad

**Ajustes necesarios:**
- Cambia a limpiador en espuma o gel
- Reduce la hidratación a texturas ligeras (gel, loción)
- Aumenta exfoliación 2-3 veces por semana
- Incorpora niacinamida o zinc para controlar sebo
- Protector solar oil-free

## Productos que funcionan todo el año
- Protector solar SPF 50+ (sin excepción)
- Sérum de vitamina C por las mañanas
- Limpieza suave (nunca jabón de lavar ropa)

## Señales de que necesitas cambiar tu rutina
- Tu crema habitual ahora te deja la piel pegajosa
- Sientes la piel tirante al llegar la seca
- Aparecen brotes sin razón aparente
- El maquillaje se desvanece más rápido`,
      image: "https://cdn-icons-png.flaticon.com/512/3076/3076674.png",
      category: "rutinas",
      tags: "temporada,seca,lluviosa,Cuba,transición",
      published: true,
      readTime: 8,
    },
    {
      title: "Protección solar en el Caribe: lo que funciona realmente",
      slug: "proteccion-solar-caribe",
      excerpt: "El sol caribeño es implacable. Guía práctica para elegir y aplicar protector solar en condiciones extremas de radiación UV.",
      content: `Cuba tiene índices UV extremos (11+) la mayor parte del año. Esto no es un juego — la protección solar correcta puede marcar la diferencia.

## ¿FPS 30 o 50?
Para el Caribe: **SPF 50+ siempre**. La diferencia entre FPS 30 (97% bloqueo) y FPS 50 (98%) es pequeña en teoría, pero en la práctica, la mayoría de las personas aplica menos cantidad de la necesaria, reduciendo la protección real.

## Filtros químicos vs físicos en el trópico
**Químicos (recomendados para el Caribe):**
- Textura más ligera, agradable con el calor
- Se absorben rápido, no se corren con el sudor
- Algunos pueden irritar piel sensible

**Físicos (minerales):**
- Más estables al sol, no se degradan tan rápido
- Pueden dejar residuo blanco (no ideal en piel morena)
- Más espesos, pueden sentirse pesados con el calor

## Cómo aplicar correctamente
1. **Cantidad**: Un dedo completo para cara y cuello
2. **Tiempo**: 15-20 minutos antes de exponerte
3. **Reaplicación**: Cada 2 horas si estás al aire libre
4. **Después del agua**: Inmediatamente (incluso si es resistente al agua)
5. **Zonas olvidadas**: Orejas, parte posterior del cuello, dorso de manos, empeine

## Protectores solares que amamos
- Texturas en gel o agua para el calor
- Con ácido hialurónico para no resecar
- Oil-free para no obstruir poros
- Resistentes al agua y al sudor`,
      image: "https://cdn-icons-png.flaticon.com/512/3076/3076677.png",
      category: "proteccion-solar",
      tags: "protector solar,Caribe,UV,Cuba,FPS",
      published: true,
      readTime: 8,
    },
    {
      title: "Manchas por el sol: prevención y tratamiento para piel latina",
      slug: "manchas-sol-piel-latina",
      excerpt: "Las pieles latinas tienen tendencia a la hiperpigmentación. Aprende a prevenir y tratar las manchas solares.",
      content: `La piel latina (fototipos III-V) produce más melanina, lo que la protege mejor del cáncer de piel pero la hace más propensa a manchas.

## ¿Por qué salen manchas?
- Exposición solar acumulativa (la causa #1 en Cuba)
- Cambios hormonales (melasma, común en mujeres)
- Inflamación post-acné (cicatrices oscuras)
- Fricción o presión constante en la piel

## Prevención (más efectivo que tratar)
1. **Protector solar SPF 50+ todos los días** (llueva o truene)
2. **Sombrero de ala ancha** para exposición prolongada
3. **Buscar sombra** entre 10am y 4pm
4. **No reventar granos** (cada grano puede dejar una mancha)

## Ingredientes para tratar manchas
- **Vitamina C**: Ilumina y previene nueva pigmentación
- **Niacinamida**: Reduce transferencia de melanina
- **Ácido Tranexámico**: Efectivo para melasma
- **Arbutina**: Despigmentante natural suave
- **Ácido Kójico**: Inhibe producción de melanina
- **Retinoides**: Aceleran renovación celular

## Tratamientos profesionales
- Peeling químico (en manos de expertos)
- Láser Q-switched para manchas profundas
- Microneedling con despigmentantes
- Siempre bajo supervisión profesional

## Rutina anti-manchas para el trópico
**Mañana**: Limpieza → Vitamina C → Protector solar SPF 50+
**Noche**: Doble limpieza → Tratamiento (arbutina/retinol) → Hidratante ligera`,
      image: "https://cdn-icons-png.flaticon.com/512/3076/3076680.png",
      category: "problemas-de-piel",
      tags: "manchas,sol,hiperpigmentación,melasma,piel latina",
      published: true,
      readTime: 9,
    },
  ]

  for (const post of posts) {
    await db.blogPost.upsert({
      where: { slug: post.slug },
      update: {},
      create: {
        ...post,
        publishedAt: new Date(),
      },
    })
  }
  console.log(`${posts.length} blog posts created`)

  const CATEGORY_IMAGES: Record<string, string[]> = {
    limpiadores: ["/images/products/product-01.jpg", "/images/products/product-02.jpg", "/images/products/pexels-7691100.jpg", "/images/products/pexels-7691101.jpg", "/images/products/pexels-7691102.jpg", "/images/products/pexels-7691103.jpg", "/images/products/pexels-7691095.jpg"],
    serums: ["/images/products/product-03.jpg", "/images/products/product-04.jpg", "/images/products/pexels-7321646.jpg", "/images/products/pexels-7321647.jpg", "/images/products/pexels-7321648.jpg", "/images/products/pexels-7321650.jpg", "/images/products/pexels-7691096.jpg", "/images/products/pexels-7691097.jpg"],
    hidratantes: ["/images/products/product-05.jpg", "/images/products/product-06.jpg", "/images/products/pexels-7691104.jpg", "/images/products/pexels-7691105.jpg", "/images/products/pexels-7691106.jpg", "/images/products/pexels-7691107.jpg"],
    "proteccion-solar": ["/images/products/product-07.jpg", "/images/products/product-08.jpg", "/images/products/pexels-7691165.jpg", "/images/products/pexels-7691166.jpg", "/images/products/pexels-7691167.jpg"],
    contornos: ["/images/products/product-09.jpg", "/images/products/product-10.jpg", "/images/products/pexels-8076225.jpg"],
    exfoliantes: ["/images/products/product-11.jpg"],
    mascarillas: ["/images/products/product-12.jpg", "/images/products/product-13.jpg", "/images/products/product-14.jpg", "/images/products/pexels-4760317.jpg", "/images/products/pexels-4760318.jpg", "/images/products/pexels-6167865.jpg", "/images/products/pexels-6167866.jpg"],
    aceites: ["/images/products/product-15.jpg", "/images/products/product-16.jpg", "/images/products/product-17.jpg", "/images/products/pexels-7321507.jpg", "/images/products/pexels-7321508.jpg"],
  }
  const catCounters: Record<string, number> = {}
  function productImage(name: string, category: string): string {
    const images = CATEGORY_IMAGES[category]
    if (!images || images.length === 0) return `/images/products/product-01.jpg`
    if (!catCounters[category]) catCounters[category] = 0
    const idx = catCounters[category] % images.length
    catCounters[category]++
    return images[idx]
  }

  const products = [
    { name: "Limpiador Facial Suave", slug: "limpiador-facial-suave", description: "Limpiador suave que remueve impurezas sin resecar. Ideal para uso diario mañana y noche. Formulado con glicerina y extracto de manzanilla para calmar la piel mientras limpia.", shortDesc: "Limpieza suave para todo tipo de piel", image: productImage("Limpiador Facial Suave", "limpiadores"), category: "limpiadores", skinTypes: "normal,mixta,seca", ingredients: "Agua, Glicerina, Extracto de Manzanilla, Cocamidopropil Betaína, Ácido Cítrico", isActive: true },
    { name: "Protector Solar SPF 50+", slug: "protector-solar-spf-50", description: "Protección solar de amplio espectro SPF 50+. Textura ligera que no deja residuo blanco. Resistente al agua por 40 minutos.", shortDesc: "Protección solar alta, textura ligera", image: productImage("Protector Solar SPF 50+", "proteccion-solar"), category: "proteccion-solar", skinTypes: "all", ingredients: "Óxido de Zinc, Dióxido de Titanio, Vitamina E, Aloe Vera, Ácido Hialurónico", isActive: true },
    { name: "Sérum Vitamina C 15%", slug: "serum-vitamina-c-15", description: "Sérum con Vitamina C estabilizada al 15% para iluminar y unificar el tono de la piel.", shortDesc: "Ilumina y unifica el tono", image: productImage("Sérum Vitamina C 15%", "serums"), category: "serums", skinTypes: "normal,mixta,seca,madura", ingredients: "Ácido Ascórbico, Vitamina E, Ácido Ferúlico, Ácido Hialurónico", isActive: true },
    { name: "Crema Hidratante con Ácido Hialurónico", slug: "crema-hidratante-acido-hialuronico", description: "Crema hidratante ligera con ácido hialurónico de triple peso molecular. Hidratación profunda sin sensación grasa.", shortDesc: "Hidratación profunda, textura ligera", image: productImage("Crema Hidratante AH", "hidratantes"), category: "hidratantes", skinTypes: "normal,mixta,grasa", ingredients: "Ácido Hialurónico, Glicerina, Escualano, Ceramidas, Pantenol", isActive: true },
    { name: "Contorno de Ojos con Cafeína", slug: "contorno-ojos-cafeina", description: "Contorno de ojos revitalizante con cafeína y péptidos. Reduce bolsas y ojeras, ilumina la mirada.", shortDesc: "Revitaliza y reduce ojeras", image: productImage("Contorno Ojos Cafeína", "contornos"), category: "contornos", skinTypes: "all", ingredients: "Cafeína, Péptidos, Ácido Hialurónico, Vitamina C, Alantoína", isActive: true },
    { name: "Exfoliante Químico AHA 10%", slug: "exfoliante-quimico-aha-10", description: "Exfoliante químico con AHA al 10%. Renueva la textura, reduce manchas y unifica el tono.", shortDesc: "Renovación y luminosidad", image: productImage("Exfoliante AHA 10%", "exfoliantes"), category: "exfoliantes", skinTypes: "normal,mixta,madura", ingredients: "Ácido Glicólico, Ácido Láctico, Aloe Vera, Vitamina E, Glicerina", isActive: true },
    { name: "Mascarilla de Arcilla Purificante", slug: "mascarilla-arcilla-purificante", description: "Mascarilla con caolín y bentonita que absorbe el exceso de grasa y purifica los poros.", shortDesc: "Purifica y minimiza poros", image: productImage("Mascarilla Arcilla", "mascarillas"), category: "mascarillas", skinTypes: "grasa,mixta", ingredients: "Caolín, Bentonita, Extracto de Té Verde, Aloe Vera, Aceite de Árbol de Té", isActive: true },
    { name: "Aceite Facial Noche con Retinol", slug: "aceite-facial-noche-retinol", description: "Aceite nocturno con retinol encapsulado y escualano. Regenera la piel mientras duermes.", shortDesc: "Regeneración nocturna", image: productImage("Aceite Noche Retinol", "aceites"), category: "aceites", skinTypes: "normal,seca,madura", ingredients: "Escualano, Retinol Encapsulado, Vitamina E, Aceite de Jojoba, Aceite de Rosa Mosqueta", isActive: true },
    { name: "Sérum Niacinamida 10%", slug: "serum-niacinamida-10", description: "Sérum con niacinamida al 10% y zinc. Regula sebo, minimiza poros y fortalece la barrera.", shortDesc: "Regula sebo y fortalece la barrera", image: productImage("Sérum Niacinamida", "serums"), category: "serums", skinTypes: "grasa,mixta", ingredients: "Niacinamida, Zinc PCA, Glicerina, Ácido Hialurónico", isActive: true },
    { name: "Limpiador en Espuma para Piel Grasa", slug: "limpiador-espuma-piel-grasa", description: "Limpiador en espuma con ácido salicílico y zinc. Elimina grasa sin resecar.", shortDesc: "Limpieza profunda sin resecar", image: productImage("Limpiador Espuma", "limpiadores"), category: "limpiadores", skinTypes: "grasa,mixta", ingredients: "Ácido Salicílico, Zinc PCA, Glicerina, Aloe Vera, Vitamina B5", isActive: true },
    { name: "Tónico Equilibrante con Niacinamida", slug: "tonico-equilibrante-niacinamida", description: "Tónico con niacinamida y ácido hialurónico que equilibra el pH y cierra poros.", shortDesc: "Equilibra y prepara la piel", image: productImage("Tónico Niacinamida", "hidratantes"), category: "hidratantes", skinTypes: "normal,mixta,grasa", ingredients: "Niacinamida, Ácido Hialurónico, Aloe Vera, Panthenol, Allantoin", isActive: true },
    { name: "Mascarilla Hidratante Overnight", slug: "mascarilla-hidratante-overnight", description: "Mascarilla de noche con ceramidas y escualano que repara la barrera cutánea mientras duermes.", shortDesc: "Reparación nocturna intensiva", image: productImage("Mascarilla Overnight", "mascarillas"), category: "mascarillas", skinTypes: "seca,madura,normal", ingredients: "Ceramidas, Escualano, Ácido Hialurónico, Vitamina E, Manteca de Karité", isActive: true },
    { name: "Sérum Retinol 0.5%", slug: "serum-retinol-05", description: "Sérum con retinol encapsulado al 0.5%. Anti-edad suave para principiantes en retinoides.", shortDesc: "Anti-edad suave para empezar", image: productImage("Sérum Retinol 0.5%", "serums"), category: "serums", skinTypes: "normal,mixta,madura", ingredients: "Retinol Encapsulado, Vitamina E, Escualano, Aceite de Jojoba", isActive: true },
    { name: "Aceite de Rosa Mosqueta Puro", slug: "aceite-rosa-mosqueta", description: "Aceite puro de rosa mosqueta orgánico. Regenera, hidrata y reduce manchas e cicatrices.", shortDesc: "Regeneración y reparación natural", image: productImage("Aceite Rosa Mosqueta", "aceites"), category: "aceites", skinTypes: "seca,madura,normal", ingredients: "Aceite de Rosa Mosqueta (100% puro, orgánico)", isActive: true },
    { name: "Protector Solar Mineral SPF 50", slug: "protector-solar-mineral-spf50", description: "Protector mineral (físico) SPF 50 para pieles sensibles. Sin químicos, sin fragancia.", shortDesc: "Protección mineral, pieles sensibles", image: productImage("Protector Mineral SPF50", "proteccion-solar"), category: "proteccion-solar", skinTypes: "sensible,todos", ingredients: "Óxido de Zinc, Dióxido de Titanio, Vitamina E, Aloe Vera", isActive: true },
    { name: "Mascarilla de Carbón Activado", slug: "mascarilla-carbon-activado", description: "Mascarilla con carbón activado que absorbe toxinas y impurezas profundas de los poros.", shortDesc: "Limpieza profunda de poros", image: productImage("Mascarilla Carbón", "mascarillas"), category: "mascarillas", skinTypes: "grasa,mixta", ingredients: "Carbón Activado, Caolín, Extracto de Té Verde, Aloe Vera", isActive: true },
    { name: "Contorno de Ojos Antiojeras", slug: "contorno-ojos-antiojeras", description: "Contorno de ojos con vitamina K y péptidos que reduce ojeras oscuras y bolsas.", shortDesc: "Reduce ojeras y bolsas", image: productImage("Contorno Antiojeras", "contornos"), category: "contornos", skinTypes: "all", ingredients: "Vitamina K, Péptidos, Cafeína, Ácido Hialurónico, Vitamina C", isActive: true },
    { name: "Tónico Exfoliante con Ácido Salicílico", slug: "tonico-exfoliante-acido-salicilico", description: "Tónico exfoliante con BHA al 2% para piel grasa y con tendencia acnéica.", shortDesc: "Exfoliación y control de grasa", image: productImage("Tónico BHA", "hidratantes"), category: "hidratantes", skinTypes: "grasa,mixta", ingredients: "Ácido Salicílico 2%, Glicerina, Aloe Vera, Niacinamida", isActive: true },
    { name: "Sérum Ácido Hialurónico + B5", slug: "serum-acido-hialuronico-b5", description: "Sérum hidratante con ácido hialurónico de bajo y alto peso molecular más pantenol (B5).", shortDesc: "Hidratación molecular profunda", image: productImage("Sérum AH + B5", "serums"), category: "serums", skinTypes: "all", ingredients: "Ácido Hialurónico, Pantenol (Vitamina B5), Glicerina", isActive: true },
    { name: "Crema Anti-edad con Péptidos", slug: "crema-anti-edad-peptidos", description: "Crema anti-edad con péptidos de cobre, retinol y ceramidas. Firmeza y elasticidad.", shortDesc: "Firmeza y elasticidad", image: productImage("Crema Anti-edad", "hidratantes"), category: "hidratantes", skinTypes: "madura,seca", ingredients: "Péptidos de Cobre, Retinol, Ceramidas, Escualano, Vitamina E", isActive: true },
    { name: "Agua Micelar Limpiadora", slug: "agua-micelar-limpiadora", description: "Agua micelar que limpia, desmaquilla y tonifica en un solo paso. Sin enjuague.", shortDesc: "Limpieza rápida sin enjuague", image: productImage("Agua Micelar", "limpiadores"), category: "limpiadores", skinTypes: "all", ingredients: "Micelas, Glicerina, Aloe Vera, Pantenol, Extracto de Manzanilla", isActive: true },
    { name: "Mascarilla Vitaminada SOS", slug: "mascarilla-vitaminada-sos", description: "Mascarilla exprés con vitaminas C, E y B5 para piel apagada y fatigada.", shortDesc: "Energía y luminosidad inmediata", image: productImage("Mascarilla Vitaminada", "mascarillas"), category: "mascarillas", skinTypes: "all", ingredients: "Vitamina C, Vitamina E, Vitamina B5, Aloe Vera, Ácido Hialurónico", isActive: true },
    { name: "Aceite Multifunción Dry Oil", slug: "aceite-multifuncion-dry-oil", description: "Aceite seco multifunción para cara, cuerpo y cabello. Absorción rápida, sin sensación grasa.", shortDesc: "Triple用途, absorción rápida", image: productImage("Aceite Multifunción", "aceites"), category: "aceites", skinTypes: "all", ingredients: "Aceite de Jojoba, Aceite de Argán, Aceite de Rosa Mosqueta, Vitamina E", isActive: true },
    { name: "Sérum Depigmentante con Arbutina", slug: "serum-depigmentante-arbutina", description: "Sérum despigmentante con alfa-arbutina y vitamina C para manchas oscuras e hiperpigmentación.", shortDesc: "Reduce manchas y unifica tono", image: productImage("Sérum Arbutina", "serums"), category: "serums", skinTypes: "normal,mixta,madura", ingredients: "Alfa-Arbutina, Vitamina C, Niacinamida, Ácido Hialurónico", isActive: true },
    { name: "Protector Solar Tintado FPS 50", slug: "protector-solar-tintado-fps50", description: "Protector solar mineral tintado SPF 50 con cobertura ligera. Ideal como base.", shortDesc: "Protección + maquillaje en uno", image: productImage("Solar Tintado FPS50", "proteccion-solar"), category: "proteccion-solar", skinTypes: "all", ingredients: "Óxido de Zinc, Dióxido de Titanio, Pigminos Minerales, Vitamina E", isActive: true },
    { name: "Crema Hidratante Oil-Free", slug: "crema-hidratante-oil-free", description: "Hidratante sin aceite para piel grasa. Textura gel que no obstruye poros.", shortDesc: "Hidratación sin brillo", image: productImage("Crema Oil-Free", "hidratantes"), category: "hidratantes", skinTypes: "grasa,mixta", ingredients: "Ácido Hialurónico, Niacinamida, Aloe Vera, Glicerina", isActive: true },
    { name: "Limpiador Exfoliante en Polvo", slug: "limpiador-exfoliante-polvo", description: "Limpiador exfoliante en polvo que se activa con agua. Micro-granos naturales.", shortDesc: "Exfoliación suave y profunda", image: productImage("Limpiador Polvo", "limpiadores"), category: "limpiadores", skinTypes: "normal,mixta", ingredients: "Enzima de Papaya, Ácido Salicílico, Glicerina, Aloe Vera", isActive: true },
    { name: "Mascarilla Colágeno Marino", slug: "mascarilla-colageno-marino", description: "Mascarilla con colágeno marino y ácido hialurónico para piel madura y sin firmeza.", shortDesc: "Firmeza y elasticidad", image: productImage("Mascarilla Colágeno", "mascarillas"), category: "mascarillas", skinTypes: "madura,seca", ingredients: "Colágeno Marino, Ácido Hialurónico, Vitamina E, Escualano", isActive: true },
    { name: "Sérum Vitamina C + Ferulic", slug: "serum-vitamina-c-ferulic", description: "Sérum avanzado con Vitamina C al 20% y ácido ferúlico para máxima estabilidad y efectividad.", shortDesc: "Antioxidante máximo", image: productImage("Sérum Vitamina C+", "serums"), category: "serums", skinTypes: "normal,mixta,madura", ingredients: "Ácido Ascórbico 20%, Ácido Ferúlico, Vitamina E, Ácido Hialurónico", isActive: true },
    { name: "Bálsamo Labial Reparador con SPF 30", slug: "balsamo-labial-reparador-spf30", description: "Bálsamo labial reparador con protección SPF 30. Hidrata y protege los labios del sol.", shortDesc: "Hidratación y protección solar", image: productImage("Bálsamo Labial", "contornos"), category: "contornos", skinTypes: "all", ingredients: "Manteca de Karité, Cera de Abeja, Vitamina E, FPS 30", isActive: true },
    { name: "Aceite de Argán Puro Orgánico", slug: "aceite-argan-puro-organico", description: "Aceite de argán puro orgánico certificado. Nutre, hidrata y repara piel y cabello.", shortDesc: "Nutrición pura y natural", image: productImage("Aceite Argán", "aceites"), category: "aceites", skinTypes: "seca,normal,madura", ingredients: "Aceite de Argán (100% puro, orgánico certificado)", isActive: true },
    { name: "Tónico Calmante con Manzanilla", slug: "tonico-calmante-manzanilla", description: "Tónico suave con extracto de manzanilla y aloe vera para calmar la piel irritada.", shortDesc: "Calma y reduce enrojecimiento", image: productImage("Tónico Manzanilla", "hidratantes"), category: "hidratantes", skinTypes: "sensible,normal", ingredients: "Extracto de Manzanilla, Aloe Vera, Pantenol, Allantoin", isActive: true },
    { name: "Mascarilla Enzimática de Frutas", slug: "mascarilla-enzimatica-frutas", description: "Mascarilla exfoliante enzimática con extractos de papaya y piña. Renueva suavemente.", shortDesc: "Exfoliación enzimática suave", image: productImage("Mascarilla Frutas", "mascarillas"), category: "mascarillas", skinTypes: "normal,mixta", ingredients: "Papaina, Bromelina, Aloe Vera, Vitamina E, Glicerina", isActive: true },
    { name: "Sérum Anti-acné con Azufre", slug: "serum-anti-acne-azufre", description: "Sérum localizado con azufre, zinc y niacinamida para tratar brotes de acné.", shortDesc: "Tratamiento puntual para brotes", image: productImage("Sérum Anti-acné", "serums"), category: "serums", skinTypes: "grasa,mixta", ingredients: "Azufre 10%, Zinc PCA, Niacinamida, Aloe Vera", isActive: true },
    { name: "Crema de Manos Reparadora", slug: "crema-manos-reparadora", description: "Crema de manos intensiva con urea y manteca de karité para manos muy secas y agrietadas.", shortDesc: "Reparación intensiva para manos", image: productImage("Crema Manos", "hidratantes"), category: "hidratantes", skinTypes: "all", ingredients: "Urea 10%, Manteca de Karité, Glicerina, Aloe Vera, Vitamina E", isActive: true },
    { name: "Protector Solar Capilar SPF 30", slug: "protector-solar-capilar-spf30", description: "Spray protector solar para cabello con SPF 30. Protege del sol, cloro y sal.", shortDesc: "Protección capilar solar", image: productImage("Solar Capilar SPF30", "proteccion-solar"), category: "proteccion-solar", skinTypes: "all", ingredients: "FPS 30, Vitamina E, Aceite de Argán, Filtros Solares", isActive: true },
    { name: "Aceite Desmaquillante Botánico", slug: "aceite-desmaquillante-botanico", description: "Aceite desmaquillante con 8 aceites botánicos que disuelve maquillaje sin fricción.", shortDesc: "Desmaquillado suave sin irritar", image: productImage("Aceite Desmaquillante", "aceites"), category: "aceites", skinTypes: "all", ingredients: "Aceite de Jojoba, Aceite de Argán, Aceite de Rosa Mosqueta, Vitamina E", isActive: true },
    { name: "Mascarilla de Oro 24K", slug: "mascarilla-oro-24k", description: "Mascarilla lujosa con partículas de oro 24K y ácido hialurónico. Efecto tensor inmediato.", shortDesc: "Lujo y efecto tensor", image: productImage("Mascarilla Oro 24K", "mascarillas"), category: "mascarillas", skinTypes: "madura,normal", ingredients: "Oro 24K, Ácido Hialurónico, Colágeno, Vitamina E, Escualano", isActive: true },
    { name: "Sérum Púrpura de Corea", slug: "serum-purpura-corea", description: "Sérum coreano con extracto de camelia púrpura y niacinamida. Iluminación y poros refinados.", shortDesc: "K-beauty: luminosidad coreana", image: productImage("Sérum Corea", "serums"), category: "serums", skinTypes: "normal,mixta", ingredients: "Extracto de Camelia Púrpura, Niacinamida, Ácido Hialurónico, Centella Asiática", isActive: true },
    { name: "Crema Solar con Tinte Invisible", slug: "crema-solar-tinte-invisible", description: "Protector solar con tinte invisible que se adapta a todos los tonos de piel.", shortDesc: "Protección invisible para todos", image: productImage("Solar Invisible", "proteccion-solar"), category: "proteccion-solar", skinTypes: "all", ingredients: "Filtros Solares Avanzados, Vitamina E, Aloe Vera, Ácido Hialurónico", isActive: true },
    { name: "Mascarilla de Bambú Purificante", slug: "mascarilla-bambu-purificante", description: "Mascarilla con extracto de bambú y caolín que purifica sin resecar la piel.", shortDesc: "Purificación suave con bambú", image: productImage("Mascarilla Bambú", "mascarillas"), category: "mascarillas", skinTypes: "normal,mixta", ingredients: "Extracto de Bambú, Caolín, Aloe Vera, Glicerina, Pantenol", isActive: true },
    { name: "Protector Solar en Barra SPF 50+", slug: "protector-solar-barra-spf50", description: "Protector solar en barra transparente SPF 50+. Ideal para reaplicar sobre el maquillaje sin esfuerzo.", shortDesc: "Reaplicación fácil sobre maquillaje", image: productImage("Solar Barra", "proteccion-solar"), category: "proteccion-solar", skinTypes: "all", ingredients: "Óxido de Zinc, Manteca de Karité, Vitamina E, Cera de Candelilla", isActive: true },
    { name: "Niebla Hidratante Refrescante", slug: "niebla-hidratante-refrescante", description: "Spray facial con agua de rosas, aloe vera y glicerina. Refresca e hidrata al instante en cualquier momento.", shortDesc: "Refrescante instantáneo para el calor", image: productImage("Niebla Hidratante", "hidratantes"), category: "hidratantes", skinTypes: "all", ingredients: "Agua de Rosas, Aloe Vera, Glicerina, Pantenol, Ácido Hialurónico", isActive: true },
    { name: "Gel Post-Solar con Aloe y Pepino", slug: "gel-post-solar-aloe-pepino", description: "Gel refrescante post-exposición con aloe vera, pepino y vitamina E. Calma y repara la piel después del sol.", shortDesc: "Calma y repara después del sol", image: productImage("Gel Post-Solar", "hidratantes"), category: "hidratantes", skinTypes: "all", ingredients: "Aloe Vera, Extracto de Pepino, Vitamina E, Alantoína, Glicerina", isActive: true },
    { name: "Sérum Iluminador con Vitamina C y Ácido Tranexámico", slug: "serum-iluminador-vitamina-c-tranexamico", description: "Sérum avanzado con Vitamina C 15% y ácido tranexámico para iluminar, unificar tono y reducir manchas persistentes.", shortDesc: "Iluminación avanzada anti-manchas", image: productImage("Sérum Iluminador", "serums"), category: "serums", skinTypes: "normal,mixta,madura", ingredients: "Ácido Ascórbico 15%, Ácido Tranexámico, Niacinamida, Ácido Hialurónico", isActive: true },
    { name: "Kit de Viaje Skincare Esencial", slug: "kit-viaje-skincare-esencial", description: "Set de viaje con versión mini de limpiador, sérum de vitamina C, crema hidratante y protector solar. Perfecto para llevar tu rutina a cualquier parte.,", shortDesc: "Tu rutina completa para llevar", image: productImage("Kit Viaje", "kits"), category: "kits", skinTypes: "all", ingredients: "Ver productos individuales", isActive: true },
  ]

  for (const product of products) {
    await db.product.upsert({
      where: { slug: product.slug },
      update: {
        name: product.name,
        description: product.description,
        shortDesc: product.shortDesc,
        image: product.image,
        category: product.category,
        skinTypes: product.skinTypes,
        ingredients: product.ingredients,
        isActive: product.isActive,
      },
      create: product,
    })
  }
  console.log(`${products.length} products created`)

  const challenges = [
    { title: "Limpia tu cara 2 veces hoy", description: "Lava tu rostro por la mañana y por la noche con un limpiador suave.", points: 10, frequency: "daily" },
    { title: "Aplica protector solar", description: "Aplica protector solar SPF 30+ antes de salir de casa.", points: 15, frequency: "daily" },
    { title: "Toma 8 vasos de agua", description: "Mantente hidratado bebiendo al menos 8 vasos de agua hoy.", points: 10, frequency: "daily" },
    { title: "Doble limpieza nocturna", description: "Realiza doble limpieza por la noche: desmaquillante + limpiador.", points: 15, frequency: "daily" },
    { title: "No toques tu cara", description: "Evita tocarte la cara durante todo el día para prevenir brotes.", points: 20, frequency: "daily" },
    { title: "Aplica sérum por la mañana", description: "Aplica un sérum después del tónico y antes del hidratante.", points: 10, frequency: "daily" },
    { title: "Masajea tu rostro 2 minutos", description: "Dedica 2 minutos a masajear tu rostro con movimientos ascendentes.", points: 10, frequency: "daily" },
    { title: "Come 3 porciones de fruta", description: "Incluye al menos 3 porciones de fruta rica en antioxidantes.", points: 10, frequency: "daily" },
    { title: "Aplica contorno de ojos", description: "No olvides el contorno de ojos en tu rutina de la noche.", points: 10, frequency: "daily" },
    { title: "Duerme 7-8 horas", description: "Duerme al menos 7 horas para que tu piel se regenere adecuadamente.", points: 15, frequency: "daily" },
    { title: "7 días de consistencia", description: "Mantén tu rutina de cuidado facial por 7 días seguidos.", points: 50, frequency: "weekly" },
    { title: "Exfoliación semanal", description: "Realiza una exfoliación suave (química o física) esta semana.", points: 20, frequency: "weekly" },
    { title: "Mascarilla hidratante", description: "Aplica una mascarilla hidratante o de arcilla esta semana.", points: 15, frequency: "weekly" },
    { title: "Lee la etiqueta de un producto", description: "Lee y analiza el INCI de al menos un producto que uses.", points: 10, frequency: "weekly" },
    { title: "Registra tu piel en el diario", description: "Escribe al menos 3 entradas en tu diario de piel esta semana.", points: 25, frequency: "weekly" },
    { title: "Prueba un producto nuevo", description: "Incorpora un producto nuevo a tu rutina esta semana.", points: 15, frequency: "weekly" },
    { title: "Toma una selfie de progreso", description: "Toma una foto con buena luz para comparar tu piel en el tiempo.", points: 10, frequency: "weekly" },
    { title: "Investiga un ingrediente", description: "Busca información sobre un ingrediente que nunca hayas usado.", points: 15, frequency: "weekly" },
    { title: "Reorganiza tu rutina", description: "Revisa tu rutina actual y ajusta según las necesidades de tu piel.", points: 20, frequency: "monthly" },
    { title: "Compra un producto nuevo consciente", description: "Elige un producto basándote en sus ingredientes, no solo en el marketing.", points: 30, frequency: "monthly" },
    { title: "Visita un dermatólogo", description: "Agenda una consulta profesional para evaluación de tu piel.", points: 40, frequency: "monthly" },
    { title: "Revisa tu protector solar", description: "Verifica que tu protector solar no esté vencido y reemplázalo si es necesario.", points: 15, frequency: "monthly" },
    { title: "Limpia tus brochas de maquillaje", description: "Limpia y desinfecta todas tus brochas y herramientas de maquillaje.", points: 15, frequency: "weekly" },
    { title: "Cambia tu funda de almohada", description: "Cambia la funda de tu almohada para evitar acumulación de bacterias.", points: 10, frequency: "weekly" },
    { title: "Aplica protector solar cada 2 horas", description: "Si pasas tiempo al sol, reaplica protector solar cada 2 horas.", points: 20, frequency: "daily" },
    { title: "Reduce el azúcar hoy", description: "Evita alimentos con alto índice glucémico que pueden desencadenar brotes.", points: 15, frequency: "daily" },
    { title: "Haz ejercicio 30 minutos", description: "El ejercicio mejora la circulación sanguínea y la salud de tu piel.", points: 15, frequency: "daily" },
    { title: "Medita 10 minutos", description: "Reduce el estrés con 10 minutos de meditación o respiración profunda.", points: 10, frequency: "daily" },
    { title: "Revisa tu rutina completa", description: "Evalúa si cada paso de tu rutina es necesario y está funcionando.", points: 25, frequency: "monthly" },
    { title: "Documenta tu rutina favorita", description: "Escribe tu rutina ideal paso a paso y guárdala como referencia.", points: 15, frequency: "monthly" },
    { title: "Compra un producto con SPF", description: "Añade un protector solar a tu rutina si aún no lo usas diariamente.", points: 20, frequency: "monthly" },
  ]

  for (const challenge of challenges) {
    const existing = await db.challenge.findFirst({ where: { title: challenge.title } })
    if (!existing) {
      await db.challenge.create({ data: challenge })
    }
  }
  console.log(`${challenges.length} challenges seeded`)

  const communityPosts = [
    {
      userId: demo.id,
      title: "Mi rutina de skincare para piel grasa en verano",
      content: "Hola a todos! Estoy buscando recomendaciones para mi rutina de verano. Tengo la piel grasa y en verano se me duplica el brillo. ¿Alguna recomendación de productos ligeros no comedogénicos?",
      category: "rutinas",
    },
    {
      userId: demo.id,
      title: "¿La niacinamida realmente minimiza los poros?",
      content: "He leído mucho sobre la niacinamida y sus beneficios para los poros. ¿Alguien ha visto resultados reales? Llevo 3 meses usándola y noto mi piel más uniforme.",
      category: "ingredientes",
    },
    {
      userId: demo.id,
      title: "Consejo: cómo aplicar protector solar correctamente",
      content: "Mucha gente no aplica suficiente protector solar. La cantidad recomendada es un dedo completo para la cara y el cuello. No olvides las orejas! Y reaplica cada 2 horas.",
      category: "consejos",
    },
    {
      userId: demo.id,
      title: "Mi experiencia con el acné hormonal",
      content: "Después de años luchando con acné hormonal, finalmente encontré una rutina que funciona. Niacinamida + zinc por la mañana, retinol por la noche y protector solar siempre.",
      category: "general",
    },
    {
      userId: demo.id,
      title: "¿Cuál es su paso favorito de la rutina?",
      content: "Para mí es el sérum de vitamina C por la mañana. Es como un chute de energía para la piel. Me encanta ver cómo mi piel se va iluminando. ¿Cuál es la vuestra?",
      category: "general",
    },
  ]

  for (const post of communityPosts) {
    const existing = await db.communityPost.findFirst({ where: { title: post.title } })
    if (!existing) {
      await db.communityPost.create({ data: post })
    }
  }
  console.log(`${communityPosts.length} community posts seeded`)

  const BASE_GUIDE_URL = `${process.env.NEXT_PUBLIC_APP_URL || "https://the-serene-lens-nuevo.onrender.com"}/guides`

  const digitalProducts = [
    {
      title: "Guía definitiva para piel grasa",
      slug: "guia-piel-grasa",
      description: "Aprende a controlar el exceso de grasa, minimizar poros y conseguir una piel mate sin resecar. Incluye rutinas, ingredientes recomendados y errores comunes.",
      shortDesc: "Controla la grasa y consigue piel mate",
      image: "/guides-covers/pexels-3735781.jpg",
      category: "piel-grasa",
      price: 6.99,
      fileUrl: `${BASE_GUIDE_URL}/guia-piel-grasa.pdf`,
    },
    {
      title: "Cómo eliminar manchas en 30 días",
      slug: "eliminar-manchas-30-dias",
      description: "Plan de 30 días para reducir manchas e hiperpigmentación con ingredientes activos, protección solar y rutina consistente.",
      shortDesc: "Plan de 30 días para manchas",
      image: "/guides-covers/pexels-7654090.jpg",
      category: "manchas",
      price: 8.99,
      fileUrl: `${BASE_GUIDE_URL}/eliminar-manchas-30-dias.pdf`,
    },
    {
      title: "Rutina antiedad para 40+",
      slug: "rutina-antiedad-40",
      description: "Rutina completa anti-edad para pieles maduras: retinol, péptidos, antioxidantes y protección solar. Incluye guía de ingredientes.",
      shortDesc: "Cuidado anti-edad para pieles maduras",
      image: "/guides-covers/pexels-3735778.jpg",
      category: "antiedad",
      price: 7.99,
      fileUrl: `${BASE_GUIDE_URL}/rutina-antiedad-40.pdf`,
    },
    {
      title: "Ingredientes que debes evitar",
      slug: "ingredientes-evitar",
      description: "Lista completa de ingredientes cosméticos que deberías evitar según tu tipo de piel. Sin alarmismo, solo ciencia.",
      shortDesc: "Guía objetiva de ingredientes",
      image: "/guides-covers/pexels-7654094.jpg",
      category: "ingredientes",
      price: 5.99,
      fileUrl: `${BASE_GUIDE_URL}/ingredientes-evitar.pdf`,
    },
    {
      title: "Guía de protección solar todo el año",
      slug: "proteccion-solar-anual",
      description: "Cómo proteger tu piel del sol en cada estación: tipos de filtro, SPF recomendado, reaplicación y errores comunes.",
      shortDesc: "Protección solar en todas las estaciones",
      image: "/guides-covers/pexels-7654117.jpg",
      category: "proteccion-solar",
      price: 6.99,
      fileUrl: `${BASE_GUIDE_URL}/proteccion-solar-anual.pdf`,
    },
    {
      title: "Rutina de skincare para principiantes",
      slug: "rutina-principiantes",
      description: "Todo lo que necesitas saber para empezar tu rutina de cuidado de la piel desde cero. Paso a paso, sin complicaciones.",
      shortDesc: "Tu primera rutina explicada fácil",
      image: "/guides-covers/pexels-6948175.jpg",
      category: "rutinas",
      price: 4.99,
      fileUrl: `${BASE_GUIDE_URL}/rutina-principiantes.pdf`,
    },
    {
      title: "Acné: causas, tratamientos y mitos",
      slug: "guia-acne-completa",
      description: "Entiende por qué aparece el acné, qué tratamientos funcionan y qué mitos debes dejar de creer. Basado en evidencia científica.",
      shortDesc: "Guía completa contra el acné",
      image: "/guides-covers/pexels-7654129.jpg",
      category: "acne",
      price: 7.99,
      fileUrl: `${BASE_GUIDE_URL}/guia-acne-completa.pdf`,
    },
    {
      title: "Ingredientes activos: retinol, vitamina C, niacinamida",
      slug: "ingredientes-activos",
      description: "Los 3 ingredientes más poderosos en skincare: cómo usarlos, en qué orden, y con qué combinarlos. Incluye guía de concentraciones.",
      shortDesc: "Domina los ingredientes clave",
      image: "/guides-covers/pexels-6620597.jpg",
      category: "ingredientes",
      price: 8.99,
      fileUrl: `${BASE_GUIDE_URL}/ingredientes-activos.pdf`,
    },
    {
      title: "Cuidado de la piel en el clima tropical",
      slug: "skincare-tropical",
      description: "Adapta tu rutina al calor, humedad y sol intenso. Productos recomendados, errores comunes y protección específica para climas cálidos.",
      shortDesc: "Skincare para clima cálido y húmedo",
      image: "/guides-covers/pexels-7623581.jpg",
      category: "clima",
      price: 5.99,
      fileUrl: `${BASE_GUIDE_URL}/skincare-tropical.pdf`,
    },
    {
      title: "Guía de exfoliación: ácidos y peelings",
      slug: "guia-exfoliacion",
      description: "AHA, BHA, PHA: qué son, cuál usar para cada tipo de piel, frecuencia recomendada y cómo evitar irritaciones. Con tabla de compatibilidades.",
      shortDesc: "Exfoliación segura con ácidos",
      image: "/guides-covers/pexels-6634440.jpg",
      category: "ingredientes",
      price: 7.99,
      fileUrl: `${BASE_GUIDE_URL}/guia-exfoliacion.pdf`,
    },
    {
      title: "Skincare masculino: guía completa",
      slug: "skincare-masculino",
      description: "Rutina específica para piel masculina: afeitado, poros, grasa extra. Sin complicaciones, con productos accesibles.",
      shortDesc: "Cuidado de la piel para hombres",
      image: "/images/products/pexels-8076226.jpg",
      category: "rutinas",
      price: 5.99,
      fileUrl: `${BASE_GUIDE_URL}/skincare-masculino.pdf`,
    },
    {
      title: "Skincare tropical: rutina completa para Cuba",
      slug: "skincare-tropical-cuba",
      description: "Guía completa de cuidado facial adaptada al clima cubano. Rutinas para temporada seca y lluviosa, ingredientes que funcionan en el trópico y protección solar extrema.",
      shortDesc: "Rutina facial para el clima cubano",
      image: "/guides-covers/pexels-3735781.jpg",
      category: "cuidado-basico",
      price: 7.99,
      fileUrl: `${BASE_GUIDE_URL}/guia-piel-grasa.pdf`,
    },
    {
      title: "Cómo tratar el melasma y las manchas",
      slug: "tratar-melasma-manchas",
      description: "Guía especializada para tratar la hiperpigmentación en pieles latinas. Ingredientes activos, rutinas y prevención para el melasma y manchas solares.",
      shortDesc: "Tratamiento de manchas para piel latina",
      image: "/guides-covers/pexels-7654090.jpg",
      category: "manchas",
      price: 8.99,
      fileUrl: `${BASE_GUIDE_URL}/eliminar-manchas-30-dias.pdf`,
    },
    {
      title: "Protector solar en el trópico: guía avanzada",
      slug: "protector-solar-tropico",
      description: "Todo sobre protección solar en climas extremos. Filtros, texturas, reaplicación y mitos del protector solar en condiciones de radiación UV 11+.",
      shortDesc: "Protección solar para radiación extrema",
      image: "/guides-covers/pexels-3735778.jpg",
      category: "proteccion-solar",
      price: 6.99,
      fileUrl: `${BASE_GUIDE_URL}/proteccion-solar-anual.pdf`,
    },
    {
      title: "Rutina de 28 días para renovar tu piel",
      slug: "rutina-28-dias-renovar",
      description: "Plan intensivo de 28 días para renovar la textura, luminosidad y salud de tu piel. Con guía de productos, ingredientes y seguimiento semanal.",
      shortDesc: "Plan intensivo de renovación facial",
      image: "/guides-covers/pexels-7654090.jpg",
      category: "rutinas",
      price: 9.99,
      fileUrl: `${BASE_GUIDE_URL}/guia-exfoliacion.pdf`,
    },
  ]

  for (const product of digitalProducts) {
    await db.digitalProduct.upsert({
      where: { slug: product.slug },
      update: {
        title: product.title,
        description: product.description,
        shortDesc: product.shortDesc,
        image: product.image,
        category: product.category,
        price: product.price,
        fileUrl: product.fileUrl,
      },
      create: product,
    })
  }
  console.log(`${digitalProducts.length} digital products seeded`)
}

main()
  .catch((e) => {
    console.error("Seed error:", e)
    process.exit(1)
  })
  .finally(() => db.$disconnect())
