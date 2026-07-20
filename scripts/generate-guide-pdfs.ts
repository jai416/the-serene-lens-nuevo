import * as fs from "fs"
import * as path from "path"

const guides = [
  "guia-basica-cuidado-facial", "como-identificar-tipo-piel", "rutina-3-pasos-empezar",
  "limpieza-facial-base-cuidado", "importancia-hidratacion-diaria", "proteccion-solar-mitos-realidades",
  "como-leer-etiquetas-productos", "botiquin-skincare-esencial", "errores-comunes-principiantes",
  "como-elegir-limpiador-facial", "acidos-exfoliantes-guia-completa", "ingredientes-activos-explicados",
  "rutina-antiedad-40", "vitamina-c-beneficios-aplicacion", "acido-hialuronico-hidratacion-profunda",
  "niacinamida-ingrediente-multiproposito", "retinoides-introduccion-segura", "peptidos-ceramidas-barrera-cutanea",
  "antioxidantes-skincare", "como-tratar-manchas-oscuras", "guia-serums-tipo-piel",
  "aceites-faciales-cual-elegir", "contorno-ojos-cuidados-especificos", "como-prevenir-tratar-acne",
  "exfoliacion-quimica-vs-fisica", "retinoides-guia-definitiva", "peeling-quimicos-en-casa",
  "microbiota-de-la-piel", "como-tratar-cicatrices-acne", "skin-cycling-rutina-avanzada",
  "guia-completa-acido-glicolico", "acido-salicilico-usos-avanzados", "como-combatir-flacidez-facial",
  "tratamiento-hiperpigmentacion", "multiples-activos-sin-irritar", "guia-ph-formulacion",
  "como-elegir-protector-solar-ideal", "guia-mascarillas-faciales", "como-tratar-rosacea",
  "barrera-cutanea-como-repararla", "dermatologia-cosmetica-avanzada", "prescripcion-activos-fototipo",
  "protocolos-tratamiento-avanzados", "guia-completa-acido-tranexamico", "disenar-protocolos-profesionales",
  "fitoterapia-aplicada-skincare", "guia-avanzada-proteccion-solar", "tratar-melasma-manchas-resistentes",
  "estrategias-rejuvenecimiento-facial", "guia-completa-laser-luz-pulsada",
]

const outputDir = path.join(__dirname, "..", "public", "guides")
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true })
}

for (const slug of guides) {
  const filePath = path.join(outputDir, `${slug}.pdf`)
  if (fs.existsSync(filePath)) continue
  const title = slug.replace(/-/g, " ")
  const pdfContent = `%PDF-1.4
1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj
2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj
3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 612 792]/Contents 4 0 R/Resources<</Font<</F1 5 0 R>>>>>>endobj
4 0 obj<</Length 207>>stream
BT
/F1 24 Tf
100 700 Td
(The Serene Lens) Tj
/F1 14 Tf
50 650 Td
(${title}) Tj
/F1 10 Tf
50 600 Td
(Esta guia estara disponible proximamente.) Tj
ET
endstream
endobj
5 0 obj<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>endobj
xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000266 00000 n 
0000000525 00000 n 
trailer<</Size 6/Root 1 0 R>>
startxref
595
%%EOF`
  fs.writeFileSync(filePath, pdfContent, "utf-8")
  console.log(`✓ ${slug}.pdf`)
}

console.log(`\n✅ ${guides.length} PDFs generados en ${outputDir}`)
