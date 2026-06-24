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
      image: "/blog/skin-type.svg",
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
      image: "/blog/routine.svg",
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
      image: "/blog/ingredients.svg",
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
      image: "/blog/sunscreen.svg",
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
      image: "/blog/acne.svg",
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
      image: "/blog/minimalist.svg",
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
      image: "/blog/vitamin-c.svg",
      category: "ingredientes",
      tags: "vitamina C,antioxidante,iluminador,COLOR",
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

## tipos de retinoides
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
      image: "/blog/retinoids.svg",
      category: "ingredientes",
      tags: "retinoides,retinol,antienvejecimiento,renovación",
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
      image: "/blog/hydration.svg",
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
      image: "/blog/labels.svg",
      category: "ingredientes",
      tags: "INCI,etiquetas,ingredientes,cósmetica",
      published: true,
      readTime: 7,
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

  const products = [
    {
      name: "Limpiador Facial Suave",
      slug: "limpiador-facial-suave",
      description: "Limpiador suave que remueve impurezas sin resecar. Ideal para uso diario mañana y noche. Formulado con glicerina y extracto de manzanilla para calmar la piel mientras limpia.",
      shortDesc: "Limpieza suave para todo tipo de piel",
      image: "/products/cleanser.svg",
      category: "limpiadores",
      skinTypes: "normal,mixta,seca",
      price: 12.99,
      ingredients: "Agua, Glicerina, Extracto de Manzanilla, Cocamidopropil Betaína, Ácido Cítrico",
      isActive: true,
    },
    {
      name: "Protector Solar SPF 50+",
      slug: "protector-solar-spf-50",
      description: "Protección solar de amplio espectro SPF 50+. Textura ligera que no deja residuo blanco. Resistente al agua por 40 minutos. Ideal para uso diario.",
      shortDesc: "Protección solar alta, textura ligera",
      image: "/products/sunscreen.svg",
      category: "proteccion-solar",
      skinTypes: "all",
      price: 18.99,
      ingredients: "Óxido de Zinc, Dióxido de Titanio, Vitamina E, Aloe Vera, Ácido Hialurónico",
      isActive: true,
    },
    {
      name: "Sérum Vitamina C 15%",
      slug: "serum-vitamina-c-15",
      description: "Sérum con Vitamina C estabilizada al 15% para iluminar y unificar el tono de la piel. Con vitamina E y ácido ferúlico para potenciar sus efectos antioxidantes.",
      shortDesc: "Ilumina y unifica el tono",
      image: "/products/vitamin-c.svg",
      category: "serums",
      skinTypes: "normal,mixta,seca,madura",
      price: 24.99,
      ingredients: "Ácido Ascórbico (Vitamina C), Vitamina E, Ácido Ferúlico, Ácido Hialurónico",
      isActive: true,
    },
    {
      name: "Crema Hidratante con Ácido Hialurónico",
      slug: "crema-hidratante-acido-hialuronico",
      description: "Crema hidratante ligera con ácido hialurónico de triple peso molecular. Hidratación profunda sin sensación grasa. Ideal para uso diario bajo el maquillaje.",
      shortDesc: "Hidratación profunda, textura ligera",
      image: "/products/moisturizer.svg",
      category: "hidratantes",
      skinTypes: "normal,mixta,grasa",
      price: 16.99,
      ingredients: "Ácido Hialurónico, Glicerina, Escualano, Ceramidas, Pantenol",
      isActive: true,
    },
    {
      name: "Contorno de Ojos con Cafeína",
      slug: "contorno-ojos-cafeina",
      description: "Contorno de ojos revitalizante con cafeína y péptidos. Reduce bolsas y ojeras, ilumina la mirada. Textura fresca de rápida absorción.",
      shortDesc: "Revitaliza y reduce ojeras",
      image: "/products/eye-contour.svg",
      category: "contornos",
      skinTypes: "all",
      price: 19.99,
      ingredients: "Cafeína, Péptidos, Ácido Hialurónico, Vitamina C, Alantoína",
      isActive: true,
    },
    {
      name: "Exfoliante Químico AHA 10%",
      slug: "exfoliante-quimico-aha-10",
      description: "Exfoliante químico con AHA al 10% (ácido glicólico + láctico). Renueva la textura de la piel, reduce manchas y unifica el tono. Uso nocturno, 2-3 veces por semana.",
      shortDesc: "Renovación y luminosidad",
      image: "/products/exfoliant.svg",
      category: "exfoliantes",
      skinTypes: "normal,mixta,madura",
      price: 22.99,
      ingredients: "Ácido Glicólico, Ácido Láctico, Aloe Vera, Vitamina E, Glicerina",
      isActive: true,
    },
    {
      name: "Mascarilla de Arcilla Purificante",
      slug: "mascarilla-arcilla-purificante",
      description: "Mascarilla facial con caolín y bentonita que absorbe el exceso de grasa y purifica los poros. Con extracto de té verde para calmar. Uso semanal.",
      shortDesc: "Purifica y minimiza poros",
      image: "/products/clay-mask.svg",
      category: "mascarillas",
      skinTypes: "grasa,mixta",
      price: 14.99,
      ingredients: "Caolín, Bentonita, Extracto de Té Verde, Aloe Vera, Aceite de Árbol de Té",
      isActive: true,
    },
    {
      name: "Aceite Facial Noche con Retinol",
      slug: "aceite-facial-noche-retinol",
      description: "Aceite facial nocturno con retinol encapsulado y escualano. Regenera la piel mientras duermes, reduce líneas de expresión y mejora la textura.",
      shortDesc: "Regeneración nocturna",
      image: "/products/night-oil.svg",
      category: "aceites",
      skinTypes: "normal,seca,madura",
      price: 28.99,
      ingredients: "Escualano, Retinol Encapsulado, Vitamina E, Aceite de Jojoba, Aceite de Rosa Mosqueta",
      isActive: true,
    },
    {
      name: "Sérum Niacinamida 10%",
      slug: "serum-niacinamida-10",
      description: "Sérum con niacinamida al 10% y zinc. Regula la producción de sebo, minimiza poros y fortalece la barrera cutánea. Ideal para piel grasa y con imperfecciones.",
      shortDesc: "Regula sebo y fortalece la barrera",
      image: "/products/niacinamide.svg",
      category: "serums",
      skinTypes: "grasa,mixta",
      price: 20.99,
      ingredients: "Niacinamida, Zinc PCA, Glicerina, Ácido Hialurónico",
      isActive: true,
    },
    {
      name: "Limpiador en Espuma para Piel Grasa",
      slug: "limpiador-espuma-piel-grasa",
      description: "Limpiador en espuma suave con ácido salicílico y zinc. Elimina el exceso de grasa sin resecar. Ideal para piel grasa y con tendencia acnéica.",
      shortDesc: "Limpieza profunda sin resecar",
      image: "/products/foaming-cleanser.svg",
      category: "limpiadores",
      skinTypes: "grasa,mixta",
      price: 13.99,
      ingredients: "Ácido Salicílico, Zinc PCA, Glicerina, Aloe Vera, Vitamina B5",
      isActive: true,
    },
  ]

  for (const product of products) {
    await db.product.upsert({
      where: { slug: product.slug },
      update: {},
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
    { title: "7 días de consistencia", description: "Mantén tu rutina de cuidado facial por 7 días seguidos.", points: 50, frequency: "weekly" },
    { title: "Exfoliación semanal", description: "Realiza una exfoliación suave (química o física) esta semana.", points: 20, frequency: "weekly" },
    { title: "Mascarilla hidratante", description: "Aplica una mascarilla hidratante o de arcilla esta semana.", points: 15, frequency: "weekly" },
    { title: "Lee la etiqueta de un producto", description: "Lee y analiza el INCI de al menos un producto que uses.", points: 10, frequency: "weekly" },
    { title: "Registra tu piel en el diario", description: "Escribe al menos 3 entradas en tu diario de piel esta semana.", points: 25, frequency: "weekly" },
    { title: "Reorganiza tu rutina", description: "Revisa tu rutina actual y ajusta según las necesidades de tu piel.", points: 20, frequency: "monthly" },
    { title: "Compra un producto nuevo consciente", description: "Elige un producto basándote en sus ingredientes, no solo en el marketing.", points: 30, frequency: "monthly" },
  ]

  for (const challenge of challenges) {
    const existing = await db.challenge.findFirst({ where: { title: challenge.title } })
    if (!existing) {
      await db.challenge.create({ data: challenge })
    }
  }
  console.log(`${challenges.length} challenges seeded`)
}

main()
  .catch((e) => {
    console.error("Seed error:", e)
    process.exit(1)
  })
  .finally(() => db.$disconnect())
