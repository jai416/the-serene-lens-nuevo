import fs from "fs/promises"
import path from "path"

const PUBLIC = path.resolve(process.cwd(), "public")

const PRODUCTS_DIR = path.join(PUBLIC, "images", "products")
const GUIDES_COVERS_DIR = path.join(PUBLIC, "guides-covers")
const GUIDES_DIR = path.join(PUBLIC, "guides")

async function ensureDir(dir: string) {
  await fs.mkdir(dir, { recursive: true })
}

async function download(url: string, filepath: string): Promise<boolean> {
  try {
    await fs.access(filepath)
    return false
  } catch {
    // file doesn't exist, proceed
  }
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(15000) })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const buffer = Buffer.from(await res.arrayBuffer())
    await fs.writeFile(filepath, buffer)
    console.log(`  ✔ ${path.basename(filepath)} (${(buffer.length / 1024).toFixed(1)} KB)`)
    return true
  } catch (err) {
    console.error(`  ✘ ${path.basename(filepath)}: ${err instanceof Error ? err.message : "unknown error"}`)
    return false
  }
}

async function downloadProductImages() {
  console.log("\n📦 Product images → public/images/products/")
  await ensureDir(PRODUCTS_DIR)

  const filenames = new Set<string>()

  // All product image filenames from seed.ts CATEGORY_IMAGES
  const categoryImages: Record<string, string[]> = {
    limpiadores: ["product-01.jpg", "product-02.jpg", "pexels-7691100.jpg", "pexels-7691101.jpg", "pexels-7691102.jpg", "pexels-7691103.jpg", "pexels-7691095.jpg"],
    serums: ["product-03.jpg", "product-04.jpg", "pexels-7321646.jpg", "pexels-7321647.jpg", "pexels-7321648.jpg", "pexels-7321650.jpg", "pexels-7691096.jpg", "pexels-7691097.jpg"],
    hidratantes: ["product-05.jpg", "product-06.jpg", "pexels-7691104.jpg", "pexels-7691105.jpg", "pexels-7691106.jpg", "pexels-7691107.jpg"],
    "proteccion-solar": ["product-07.jpg", "product-08.jpg", "pexels-7691165.jpg", "pexels-7691166.jpg", "pexels-7691167.jpg"],
    contornos: ["product-09.jpg", "product-10.jpg", "pexels-8076225.jpg"],
    exfoliantes: ["product-11.jpg"],
    mascarillas: ["product-12.jpg", "product-13.jpg", "product-14.jpg", "pexels-4760317.jpg", "pexels-4760318.jpg", "pexels-6167865.jpg", "pexels-6167866.jpg"],
    aceites: ["product-15.jpg", "product-16.jpg", "product-17.jpg", "pexels-7321507.jpg", "pexels-7321508.jpg"],
  }

  // Skincare-themed Unsplash keywords for generic product images
  const genericKeywords: Record<string, string> = {
    "product-01.jpg": "cleanser+bottle",
    "product-02.jpg": "facial+wash",
    "product-03.jpg": "serum+dropper",
    "product-04.jpg": "vitamin+c+serum",
    "product-05.jpg": "moisturizer+cream",
    "product-06.jpg": "face+cream+jar",
    "product-07.jpg": "sunscreen+bottle",
    "product-08.jpg": "spf+protection",
    "product-09.jpg": "eye+cream",
    "product-10.jpg": "eye+contour",
    "product-11.jpg": "exfoliator+product",
    "product-12.jpg": "face+mask+sheet",
    "product-13.jpg": "clay+mask",
    "product-14.jpg": "sheet+mask",
    "product-15.jpg": "facial+oil+bottle",
    "product-16.jpg": "argan+oil",
    "product-17.jpg": "skincare+bottle",
  }

  for (const images of Object.values(categoryImages)) {
    for (const img of images) {
      filenames.add(img)
    }
  }

  let downloaded = 0
  let skipped = 0

  for (const filename of filenames) {
    const filepath = path.join(PRODUCTS_DIR, filename)
    try {
      await fs.access(filepath)
      skipped++
      continue
    } catch {}

    const pexelMatch = filename.match(/pexels-(\d+)\./) 

    if (pexelMatch) {
      const photoId = pexelMatch[1]
      const url = `https://images.pexels.com/photos/${photoId}/pexels-photo-${photoId}.jpeg?auto=compress&cs=tinysrgb&w=600`
      const ok = await download(url, filepath)
      if (ok) downloaded++
      else skipped++
    } else {
      const keyword = genericKeywords[filename]
      if (keyword) {
        const url = `https://images.unsplash.com/photo?w=600&h=600&fit=crop&query=${keyword}`
        const ok = await download(url, filepath)
        if (ok) downloaded++
        else skipped++
      } else {
        skipped++
      }
    }
  }

  console.log(`  → ${downloaded} downloaded, ${skipped} already exist or failed`)
}

async function downloadGuideCovers() {
  console.log("\n📖 Guide covers → public/guides-covers/")
  await ensureDir(GUIDES_COVERS_DIR)

  // All unique cover filenames from seed.ts digitalProducts array
  const coverFilenames = [
    "pexels-3735781.jpg",
    "pexels-7654090.jpg",
    "pexels-3735778.jpg",
    "pexels-7654094.jpg",
    "pexels-7654117.jpg",
    "pexels-6948175.jpg",
    "pexels-7654129.jpg",
    "pexels-6620597.jpg",
    "pexels-7623581.jpg",
    "pexels-6634440.jpg",
  ]

  let downloaded = 0
  let skipped = 0

  for (const filename of coverFilenames) {
    const filepath = path.join(GUIDES_COVERS_DIR, filename)
    try {
      await fs.access(filepath)
      skipped++
      continue
    } catch {}

    const pexelMatch = filename.match(/pexels-(\d+)\./)
    if (pexelMatch) {
      const photoId = pexelMatch[1]
      const url = `https://images.pexels.com/photos/${photoId}/pexels-photo-${photoId}.jpeg?auto=compress&cs=tinysrgb&w=600`
      const ok = await download(url, filepath)
      if (ok) downloaded++
      else skipped++
    } else {
      skipped++
    }
  }

  console.log(`  → ${downloaded} downloaded, ${skipped} already exist or failed`)
}

async function downloadPlaceholderGuides() {
  console.log("\n📄 Guide placeholders → public/guides/")
  await ensureDir(GUIDES_DIR)

  // Guide slugs from seed-guides.ts — each needs a simple placeholder SVG
  const guideSlugs = [
    "guia-basica-cuidado-facial",
    "como-identificar-tipo-piel",
    "rutina-3-pasos-empezar",
    "limpieza-facial-base-cuidado",
    "importancia-hidratacion-diaria",
    "proteccion-solar-mitos-realidades",
    "como-leer-etiquetas-productos",
    "botiquin-skincare-esencial",
    "errores-comunes-principiantes",
    "como-elegir-limpiador-facial",
    "acidos-exfoliantes-guia-completa",
    "ingredientes-activos-explicados",
    "rutina-antiedad-40",
    "vitamina-c-beneficios-aplicacion",
    "acido-hialuronico-hidratacion-profunda",
    "niacinamida-ingrediente-multiproposito",
    "retinoides-introduccion-segura",
    "peptidos-ceramidas-barrera-cutanea",
    "antioxidantes-skincare",
    "como-tratar-manchas-oscuras",
    "guia-serums-tipo-piel",
    "aceites-faciales-cual-elegir",
    "contorno-ojos-cuidados-especificos",
    "como-prevenir-tratar-acne",
    "exfoliacion-quimica-vs-fisica",
    "retinoides-guia-definitiva",
    "peeling-quimicos-en-casa",
    "microbiota-de-la-piel",
    "como-tratar-cicatrices-acne",
    "skin-cycling-rutina-avanzada",
    "guia-completa-acido-glicolico",
    "acido-salicilico-usos-avanzados",
    "como-combatir-flacidez-facial",
    "tratamiento-hiperpigmentacion",
    "multiples-activos-sin-irritar",
    "guia-ph-formulacion",
    "como-elegir-protector-solar-ideal",
    "guia-mascarillas-faciales",
    "como-tratar-rosacea",
    "barrera-cutanea-como-repararla",
    "dermatologia-cosmetica-avanzada",
    "prescripcion-activos-fototipo",
    "protocolos-tratamiento-avanzados",
    "guia-completa-acido-tranexamico",
    "disenar-protocolos-profesionales",
    "fitoterapia-aplicada-skincare",
    "guia-avanzada-proteccion-solar",
    "tratar-melasma-manchas-resistentes",
    "estrategias-rejuvenecimiento-facial",
    "guia-completa-laser-luz-pulsada",
  ]

  const placeholderSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="1600" viewBox="0 0 1200 1600">
  <rect width="1200" height="1600" fill="#F8F9FA"/>
  <rect x="450" y="500" width="300" height="300" rx="40" fill="#E2ECE0"/>
  <text x="600" y="900" text-anchor="middle" font-family="Inter, sans-serif" font-size="40" fill="#1A1A1A" font-weight="bold">The Serene Lens</text>
  <text x="600" y="960" text-anchor="middle" font-family="Inter, sans-serif" font-size="24" fill="#666666">Guía Digital</text>
</svg>`

  let created = 0
  let skipped = 0

  for (const slug of guideSlugs) {
    const filepath = path.join(GUIDES_DIR, `${slug}.svg`)
    try {
      await fs.access(filepath)
      skipped++
      continue
    } catch {}

    await fs.writeFile(filepath, placeholderSvg)
    created++
    console.log(`  ✔ ${slug}.svg`)
  }

  console.log(`  → ${created} created, ${skipped} already exist`)
}

async function main() {
  console.log("🎯 The Serene Lens — Asset Downloader")
  console.log("=".repeat(50))

  await downloadProductImages()
  await downloadGuideCovers()
  await downloadPlaceholderGuides()

  console.log("\n✨ Done!")
}

main().catch((err) => {
  console.error("Fatal:", err)
  process.exit(1)
})
