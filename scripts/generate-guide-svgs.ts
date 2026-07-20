import * as fs from "fs"
import * as path from "path"

const guides = [
  { slug: "guia-basica-cuidado-facial", category: "cuidado-basico", title: "Guía Básica de Cuidado Facial" },
  { slug: "como-identificar-tipo-piel", category: "cuidado-basico", title: "Identifica tu Tipo de Piel" },
  { slug: "rutina-3-pasos-empezar", category: "rutinas", title: "Rutina de 3 Pasos" },
  { slug: "limpieza-facial-base-cuidado", category: "cuidado-basico", title: "Limpieza Facial" },
  { slug: "importancia-hidratacion-diaria", category: "cuidado-basico", title: "Hidratación Diaria" },
  { slug: "proteccion-solar-mitos-realidades", category: "proteccion-solar", title: "Protección Solar" },
  { slug: "como-leer-etiquetas-productos", category: "ingredientes", title: "Lee Etiquetas" },
  { slug: "botiquin-skincare-esencial", category: "cuidado-basico", title: "Botiquín Esencial" },
  { slug: "errores-comunes-principiantes", category: "cuidado-basico", title: "Errores Comunes" },
  { slug: "como-elegir-limpiador-facial", category: "cuidado-basico", title: "Elige tu Limpiador" },
  { slug: "acidos-exfoliantes-guia-completa", category: "ingredientes", title: "Ácidos y Exfoliantes" },
  { slug: "ingredientes-activos-explicados", category: "ingredientes", title: "Ingredientes Activos" },
  { slug: "rutina-antiedad-40", category: "rutinas", title: "Rutina Anti-Edad 40+" },
  { slug: "vitamina-c-beneficios-aplicacion", category: "ingredientes", title: "Vitamina C" },
  { slug: "acido-hialuronico-hidratacion-profunda", category: "ingredientes", title: "Ácido Hialurónico" },
  { slug: "niacinamida-ingrediente-multiproposito", category: "ingredientes", title: "Niacinamida" },
  { slug: "retinoides-introduccion-segura", category: "ingredientes", title: "Retinoides" },
  { slug: "peptidos-ceramidas-barrera-cutanea", category: "ingredientes", title: "Péptidos y Ceramidas" },
  { slug: "antioxidantes-skincare", category: "ingredientes", title: "Antioxidantes" },
  { slug: "como-tratar-manchas-oscuras", category: "problemas-de-piel", title: "Trata Manchas Oscuras" },
  { slug: "guia-serums-tipo-piel", category: "rutinas", title: "Sérums por Tipo de Piel" },
  { slug: "aceites-faciales-cual-elegir", category: "ingredientes", title: "Aceites Faciales" },
  { slug: "contorno-ojos-cuidados-especificos", category: "rutinas", title: "Contorno de Ojos" },
  { slug: "como-prevenir-tratar-acne", category: "problemas-de-piel", title: "Prevén y Trata el Acné" },
  { slug: "exfoliacion-quimica-vs-fisica", category: "rutinas", title: "Exfoliación Química vs Física" },
  { slug: "retinoides-guia-definitiva", category: "ingredientes", title: "Retinoides: Guía Definitiva" },
  { slug: "peeling-quimicos-en-casa", category: "avanzado", title: "Peeling Químicos en Casa" },
  { slug: "microbiota-de-la-piel", category: "avanzado", title: "Microbiota de la Piel" },
  { slug: "como-tratar-cicatrices-acne", category: "problemas-de-piel", title: "Cicatrices de Acné" },
  { slug: "skin-cycling-rutina-avanzada", category: "rutinas", title: "Skin Cycling" },
  { slug: "guia-completa-acido-glicolico", category: "ingredientes", title: "Ácido Glicólico" },
  { slug: "acido-salicilico-usos-avanzados", category: "ingredientes", title: "Ácido Salicílico" },
  { slug: "como-combatir-flacidez-facial", category: "avanzado", title: "Flacidez Facial" },
  { slug: "tratamiento-hiperpigmentacion", category: "problemas-de-piel", title: "Hiperpigmentación" },
  { slug: "multiples-activos-sin-irritar", category: "avanzado", title: "Múltiples Activos" },
  { slug: "guia-ph-formulacion", category: "avanzado", title: "pH y Formulación" },
  { slug: "como-elegir-protector-solar-ideal", category: "proteccion-solar", title: "Protector Solar Ideal" },
  { slug: "guia-mascarillas-faciales", category: "rutinas", title: "Mascarillas Faciales" },
  { slug: "como-tratar-rosacea", category: "problemas-de-piel", title: "Rosácea" },
  { slug: "barrera-cutanea-como-repararla", category: "avanzado", title: "Repara tu Barrera Cutánea" },
  { slug: "dermatologia-cosmetica-avanzada", category: "avanzado", title: "Dermatología Cosmética" },
  { slug: "prescripcion-activos-fototipo", category: "avanzado", title: "Activos por Fototipo" },
  { slug: "protocolos-tratamiento-avanzados", category: "avanzado", title: "Protocolos Avanzados" },
  { slug: "guia-completa-acido-tranexamico", category: "ingredientes", title: "Ácido Tranexámico" },
  { slug: "disenar-protocolos-profesionales", category: "avanzado", title: "Protocolos Profesionales" },
  { slug: "fitoterapia-aplicada-skincare", category: "ingredientes", title: "Fitoterapia Skincare" },
  { slug: "guia-avanzada-proteccion-solar", category: "proteccion-solar", title: "Protección Solar Avanzada" },
  { slug: "tratar-melasma-manchas-resistentes", category: "problemas-de-piel", title: "Melasma" },
  { slug: "estrategias-rejuvenecimiento-facial", category: "avanzado", title: "Rejuvenecimiento Facial" },
  { slug: "guia-completa-laser-luz-pulsada", category: "avanzado", title: "Láser y Luz Pulsada" },
]

const categoryColors: Record<string, { bg: string; accent: string; icon: string }> = {
  "cuidado-basico": { bg: "#E2ECE0", accent: "#88B078", icon: "M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" },
  "rutinas": { bg: "#FFF9E6", accent: "#D4A843", icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" },
  "ingredientes": { bg: "#F0E6F6", accent: "#9B59B6", icon: "M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" },
  "proteccion-solar": { bg: "#FFF3E0", accent: "#F39C12", icon: "M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" },
  "problemas-de-piel": { bg: "#FDE8E8", accent: "#E74C3C", icon: "M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" },
  "avanzado": { bg: "#E8F4FD", accent: "#3498DB", icon: "M13 10V3L4 14h7v7l9-11h-7z" },
}

function generateSVG(slug: string, title: string, category: string): string {
  const colors = categoryColors[category] || categoryColors["cuidado-basico"]
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="1600" viewBox="0 0 1200 1600">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${colors.bg};stop-opacity:1"/>
      <stop offset="100%" style="stop-color:#ffffff;stop-opacity:1"/>
    </linearGradient>
    <linearGradient id="accent" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${colors.accent};stop-opacity:1"/>
      <stop offset="100%" style="stop-color:${colors.accent}cc;stop-opacity:1"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="1600" fill="url(#bg)"/>
  <rect x="100" y="100" width="1000" height="400" rx="40" fill="url(#accent)" opacity="0.15"/>
  <g transform="translate(600, 300)" fill="none" stroke="${colors.accent}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round">
    <path d="${colors.icon}"/>
  </g>
  <text x="600" y="650" text-anchor="middle" font-family="'Inter', 'SF Pro Display', sans-serif" font-size="52" fill="#1A1A1A" font-weight="bold">${title}</text>
  <rect x="450" y="700" width="300" height="4" rx="2" fill="${colors.accent}" opacity="0.3"/>
  <text x="600" y="780" text-anchor="middle" font-family="'Inter', sans-serif" font-size="24" fill="#666666">The Serene Lens</text>
  <text x="600" y="820" text-anchor="middle" font-family="'Inter', sans-serif" font-size="18" fill="#999999">Guía Digital</text>
  <rect x="400" y="950" width="400" height="400" rx="30" fill="white" opacity="0.5" stroke="${colors.bg}" stroke-width="2"/>
  <text x="600" y="1060" text-anchor="middle" font-family="'Inter', sans-serif" font-size="20" fill="#1A1A1A" font-weight="500">${slug.replace(/-/g, ' ')}</text>
  <text x="600" y="1110" text-anchor="middle" font-family="'Inter', sans-serif" font-size="16" fill="#666666">Categoría: ${category}</text>
  <rect x="500" y="1180" width="200" height="50" rx="25" fill="${colors.accent}" opacity="0.2"/>
  <text x="600" y="1212" text-anchor="middle" font-family="'Inter', sans-serif" font-size="16" fill="${colors.accent}" font-weight="600">DESCARGABLE</text>
</svg>`
}

const outputDir = path.join(__dirname, "..", "public", "guides")
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true })
}

for (const guide of guides) {
  const svg = generateSVG(guide.slug, guide.title, guide.category)
  const filePath = path.join(outputDir, `${guide.slug}.svg`)
  fs.writeFileSync(filePath, svg, "utf-8")
  console.log(`✓ ${guide.slug}.svg`)
}

console.log(`\n✅ ${guides.length} SVGs generados en ${outputDir}`)
