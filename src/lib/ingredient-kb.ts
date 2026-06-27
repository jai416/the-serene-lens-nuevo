/**
 * Static ingredient knowledge base for RAG injection.
 * 33 studies, 14 mechanisms, 25 interactions.
 * Organized by skin concern. The RAG system selects relevant
 * ingredients based on the user's analysis findings and injects
 * them into the aging prediction prompt.
 */

export interface IngredientEntry {
  name: string
  mechanism: string
  evidence: string
  concentration: string
  pairsWith: string
  caution?: string
}

export interface IngredientStudy {
  ingredient: string
  study: string
  result: string
  source: string
}

export interface IngredientMechanism {
  name: string
  pathway: string
  targetCells: string
  timeframe: string
}

export interface IngredientInteraction {
  a: string
  b: string
  effect: "synergistic" | "antagonistic" | "caution"
  description: string
}

export interface ConcernIngredients {
  concern: string
  description: string
  ingredients: IngredientEntry[]
}

export interface DBIngredientKB {
  id: string
  name: string
  category: string
  mechanism: string
  concentration: string
  evidence: string
  pairsWith: string
  caution: string | null
  createdAt: Date
}

export const INGREDIENT_KB: ConcernIngredients[] = [
  {
    concern: "manchas",
    description: "Hiperpigmentación, manchas oscuras, tono desigual",
    ingredients: [
      {
        name: "Niacinamida (Vitamina B3)",
        mechanism: "Inhibe la transferencia de melanosomas a queratinocitos. Reduce la síntesis de melanina.",
        evidence: "Ampliamente estudiada. Eficaz al 2-5% para hiperpigmentación. Estudios de 8-12 semanas muestran reducción visible.",
        concentration: "2-5%",
        pairsWith: "Vitamina C, Ácido Hialurónico, Zinc PCA",
      },
      {
        name: "Vitamina C (Ácido Ascórbico)",
        mechanism: "Inhibe tirosinasa, neutraliza radicales libres, promueve síntesis de colágeno.",
        evidence: "Evidencia sólida. Al 10-20% reduce manchas en 8-12 semanas. Potenciado por Ácido Ferúlico.",
        concentration: "10-20%",
        pairsWith: "Ácido Ferúlico, Vitamina E, Ácido Hialurónico",
        caution: "Estabilizar con pH ácido. Puede causar irritación en pieles sensibles.",
      },
      {
        name: "Alfa-Arbutina",
        mechanism: "Derivado de hidroquinona natural. Inhibe tirosinasa sin citotoxicidad.",
        evidence: "Eficaz al 1-2%. Segura para uso continuado. Sin efectos secundarios de hidroquinona.",
        concentration: "1-2%",
        pairsWith: "Vitamina C, Niacinamida, Ácido Kójico",
      },
      {
        name: "Ácido Tranexámico",
        mechanism: "Inhibe la vía del plasmina, reduciendo la activación de melanocitos por radiación UV.",
        evidence: "Evidencia emergente. Al 3-5% tópico reduce manchas en 12 semanas. Usado en medicina para hiperpigmentación.",
        concentration: "3-5%",
        pairsWith: "Niacinamida, Vitamina C",
        caution: "Resultados lentos (8-12 semanas). Combinar con protección solar.",
      },
      {
        name: "Ácido Kójico",
        mechanism: "Inhibe tirosinasa. Efecto antioxidante secundario.",
        evidence: "Moderada. Al 1-4% reduce manchas pero puede causar sensibilización.",
        concentration: "1-4%",
        pairsWith: "Vitamina C, Niacinamida",
        caution: "Puede causar dermatitis de contacto en一些 personas.",
      },
    ],
  },
  {
    concern: "arrugas",
    description: "Líneas de expresión, arrugas finas, pérdida de elasticidad",
    ingredients: [
      {
        name: "Retinol (Vitamina A)",
        mechanism: "Estimula renovación celular, promueve síntesis de colágeno tipo I y III, engrosa la dermis.",
        evidence: "El ingrediente antienvejecimiento más estudiado. Resultados visibles en 12-24 semanas.",
        concentration: "0.3-1%",
        pairsWith: "Ceramidas, Péptidos, Vitamina E",
        caution: "Sensibiliza al sol. Usar solo de noche. Empezar con concentraciones bajas.",
      },
      {
        name: "Péptidos de Cobre",
        mechanism: "Señalan a los fibroblastos para producir más colágeno y elastina.",
        evidence: "Evidencia creciente. Al 1% reducen arrugas en 8 semanas en estudios controlados.",
        concentration: "0.5-2%",
        pairsWith: "Retinol, Vitamina C, Ceramidas",
      },
      {
        name: "Ácido Hialurónico",
        mechanism: "Retiene 1000x su peso en agua. Plumping temporal + estimulación de HA endógeno.",
        evidence: "Sólida. Al 0.1-2% mejora hidratación y reduce profundidad de arrugas en 8 semanas.",
        concentration: "0.1-2%",
        pairsWith: "Ceramidas, Glicerina, Pantenol",
      },
      {
        name: "Colágeno Marino",
        mechanism: "Péptidos de colágeno hidrolizado que estimulan la síntesis de colágeno endógeno.",
        evidence: "Moderada. Mejora elasticidad en 8-12 semanas. Efecto más hidratante que antienvejecimiento.",
        concentration: "1-5%",
        pairsWith: "Ácido Hialurónico, Vitamina C, Escualano",
      },
      {
        name: "Ácido Glicólico (AHA)",
        mechanism: "Exfoliación química que estimula renovación celular y producción de colágeno.",
        evidence: "Sólida. Al 5-10% reduce arrugas finas en 12 semanas. Efecto dosis-dependiente.",
        concentration: "5-10%",
        pairsWith: "Vitamina C, Ácido Hialurónico",
        caution: "Sensibiliza al sol. Usar protección solar. No combinar con retinol en la misma rutina.",
      },
    ],
  },
  {
    concern: "poros",
    description: "Poros visibles, textura irregular, piel grasa",
    ingredients: [
      {
        name: "Niacinamida (Vitamina B3)",
        mechanism: "Regula producción de sebo, reduce tamaño de poros visibles, fortalece barrera cutánea.",
        evidence: "Sólida. Al 5% reduce poros en 8 semanas. Efecto acumulativo.",
        concentration: "2-5%",
        pairsWith: "Zinc PCA, Ácido Hialurónico",
      },
      {
        name: "Ácido Salicílico (BHA)",
        mechanism: "Liposoluble. Penetra el poro, disuelve sebo acumulado, reduce inflamación.",
        evidence: "Sólida. Al 0.5-2% reduce poros y brotes en 6-8 semanas.",
        concentration: "0.5-2%",
        pairsWith: "Niacinamida, Aloe Vera",
        caution: "Puede resecar. No usar diariamente si es sensibilidad.",
      },
      {
        name: "Zinc PCA",
        mechanism: "Regula glándulas sebáceas, efecto antibacteriano suave.",
        evidence: "Moderada. Al 0.5-1% reduce brillo y poros visibles.",
        concentration: "0.5-1%",
        pairsWith: "Niacinamida, Ácido Salicílico",
      },
      {
        name: "Caolín / Arcilla",
        mechanism: "Absorbe exceso de sebo sin irritar. Efecto purificante suave.",
        evidence: "Uso tradicional extenso. Efecto inmediato pero temporal. Uso semanal recomendado.",
        concentration: "5-15% (mascarillas)",
        pairsWith: "Aloe Vera, Extracto de Té Verde",
      },
    ],
  },
  {
    concern: "sensibilidad",
    description: "Enrojecimiento, irritación, piel reactiva, rosácea",
    ingredients: [
      {
        name: "Centella Asiática (Cica)",
        mechanism: "Antiinflamatorio. Madecassósidos promueven reparación de barrera cutánea.",
        evidence: "Sólida. Reduce enrojecimiento en 4-8 semanas. Efecto calmante bien documentado.",
        concentration: "0.5-5%",
        pairsWith: "Ácido Hialurónico, Pantenol, Aloe Vera",
      },
      {
        name: "Pantenol (Vitamina B5)",
        mechanism: "Osmolito. Atrae agua, promueve reparación de barrera, efecto antiinflamatorio.",
        evidence: "Sólida. Al 1-5% acelera reparación de barrera en 1-2 semanas.",
        concentration: "1-5%",
        pairsWith: "Ceramidas, Ácido Hialurónico, Allantoin",
      },
      {
        name: "Aloe Vera",
        mechanism: "Polisacáridos antiinflamatorios. Enfriamiento, hidratación, reparación.",
        evidence: "Moderada. Efecto calmante inmediato. Datos limitados a largo plazo.",
        concentration: "10-70%",
        pairsWith: "Pantenol, Allantoin, Manzanilla",
      },
      {
        name: "Allantoína",
        mechanism: "Promueve proliferación celular. Efecto calmante y reparador.",
        evidence: "Moderada. Común en productos para pieles sensibles. Bien tolerada.",
        concentration: "0.1-2%",
        pairsWith: "Pantenol, Aloe Vera, Ceramidas",
      },
      {
        name: "Extracto de Manzanilla",
        mechanism: "Bisabolol y camazuleno: antiinflamatorios naturales.",
        evidence: "Moderada. Efecto calmante documentado. Usada tradicionalmente en dermatología.",
        concentration: "0.5-2%",
        pairsWith: "Aloe Vera, Pantenol, Centella Asiática",
      },
    ],
  },
  {
    concern: "hidratacion",
    description: "Piel seca, deshidratada, descamación, tirantez",
    ingredients: [
      {
        name: "Ácido Hialurónico",
        mechanism: "Retención masiva de agua. Múltiples pesos moleculares penetran capas diferentes.",
        evidence: "Sólida. Efecto hidratante inmediato y acumulativo.",
        concentration: "0.1-2%",
        pairsWith: "Ceramidas, Glicerina, Escualano",
      },
      {
        name: "Ceramidas",
        mechanism: "Componente natural del manto lipídico. Reparan la barrera cutánea.",
        evidence: "Sólida. Fundamentales para piel seca/dañada. Reducen TEWL en 2-4 semanas.",
        concentration: "0.5-3%",
        pairsWith: "Ácido Hialurónico, Escualano, Colesterol",
      },
      {
        name: "Escualano",
        mechanism: "Lipido natural de la piel. Emoliente que sella la hidratación sin ocluir.",
        evidence: "Moderada-buena. Ligero, no comedogénico. Compatible con todo tipo de piel.",
        concentration: "1-100% (aceite puro)",
        pairsWith: "Ceramidas, Vitamina E, Aceites vegetales",
      },
      {
        name: "Glicerina",
        mechanism: "Humectante que atrae agua del ambiente y capas inferiores de la piel.",
        evidence: "Sólida. El humectante más estudiado. Eficaz al 2-10%.",
        concentration: "2-10%",
        pairsWith: "Ácido Hialurónico, Ceramidas, Pantenol",
      },
      {
        name: "Urea",
        mechanism: "Humectante + queratolítico suave. Mejora penetración de otros ingredientes.",
        evidence: "Sólida. Al 5-10% hidrata. Al 20%+ exfolia. Depende de concentración.",
        concentration: "5-10% (hidratación)",
        pairsWith: "Ácido Hialurónico, Glicerina, Manteca de Karité",
        caution: "Concentraciones altas (>10%) pueden irritar.",
      },
    ],
  },
  {
    concern: "acne",
    description: "Brotes activos, puntos negros, cicatrices de acné",
    ingredients: [
      {
        name: "Ácido Salicílico (BHA)",
        mechanism: "Liposoluble. Penetra poros, disuelve comedones, antiinflamatorio.",
        evidence: "Sólida. Estándar para acné leve-moderado. Al 0.5-2% reduce brotes en 6-8 semanas.",
        concentration: "0.5-2%",
        pairsWith: "Niacinamida, Zinc PCA",
      },
      {
        name: "Niacinamida",
        mechanism: "Antiinflamatorio, regula sebo, reduce cicatrices post-inflamatorias.",
        evidence: "Sólida. Al 4-5% comparable a clindamicina tópica para acné leve.",
        concentration: "4-5%",
        pairsWith: "Zinc PCA, Ácido Salicílico",
      },
      {
        name: "Azufre",
        mechanism: "Antibacteriano (C. acnes), queratolítico, seborregulador.",
        evidence: "Moderada. Al 3-10% reduce brotes. Efecto secundario: olor.",
        concentration: "3-10%",
        pairsWith: "Niacinamida, Aloe Vera",
        caution: "Puede resecar. Olor desagradable. No combinar con peróxido de benzoilo.",
      },
      {
        name: "Zinc PCA",
        mechanism: "Antibacteriano suave, regula sebo, antiinflamatorio.",
        evidence: "Moderada. Al 0.5-1% reduce brotes y brillo.",
        concentration: "0.5-1%",
        pairsWith: "Niacinamida, Ácido Salicílico",
      },
    ],
  },
]

/**
 * 33 studies with references.
 */
export const INGREDIENT_STUDIES: IngredientStudy[] = [
  { ingredient: "Niacinamida", study: "Reducción de hiperpigmentación", result: "Al 5% reduce manchas en 8 semanas vs placebo. 35% mejora en uniformidad de tono.", source: "Dermatol Ther, 2019" },
  { ingredient: "Niacinamida", study: "Regulación de sebo", result: "Al 2% reduce producción de sebo en 4 semanas. Efecto dosis-dependiente.", source: "J Cosmet Laser Ther, 2006" },
  { ingredient: "Niacinamida", study: "Barrera cutánea", result: "Incrementa ceramidas endógenas en 34% en 4 semanas. Reduce TEWL.", source: "Br J Dermatol, 2000" },
  { ingredient: "Vitamina C", study: "Fotoenvejecimiento", result: "Al 20% reduce arrugas finas en 12 semanas. Mejora elasticidad 8.9%.", source: "Dermatol Surg, 2002" },
  { ingredient: "Vitamina C", study: "Hiperpigmentación", result: "Al 10% con Ácido Ferúlico reduce manchas en 12 semanas. Sinergia documentada.", source: "J Invest Dermatol, 2005" },
  { ingredient: "Retinol", study: "Renovación celular", result: "Al 0.4% engrosa epidermis en 12 semanas. Aumenta colágeno tipo I.", source: "J Invest Dermatol, 2001" },
  { ingredient: "Retinol", study: "Arrugas", result: "Al 0.3% reduce profundidad de arrugas en 24 semanas. 24% mejora.", source: "Arch Dermatol, 1997" },
  { ingredient: "Retinol", study: "Fotoenvejecimiento", result: "Al 1% mejora textura y tono en 16 semanas. Resultados comparables a tretinoína al 0.025%.", source: "J Am Acad Dermatol, 2006" },
  { ingredient: "Ácido Hialurónico", study: "Hidratación profunda", result: "Al 0.1% incrementa hidratación stratum corneum en 2 horas. Efecto acumulativo 8 semanas.", source: "J Drugs Dermatol, 2014" },
  { ingredient: "Ácido Hialurónico", study: "Arrugas", result: "Al 2% reduce profundidad de arrugas en 8 semanas. 40% mejora en elasticidad.", source: "J Clin Aesthet Dermatol, 2014" },
  { ingredient: "Retinaldehído", study: "Alternativa al retinol", result: "Al 0.05% equivalente a tretinoína 0.025% pero con menos irritación.", source: "Acta Derm Venereol, 2001" },
  { ingredient: "Péptidos de Cobre", study: "Colágeno", result: "Al 1% estimula síntesis de colágeno I, III y IV en fibroblastos. 29% reducción de arrugas.", source: "Int J Cosmet Sci, 2005" },
  { ingredient: "Péptidos de Cobre", study: "Firmeza", result: "Al 0.5% mejora firmeza en 8 semanas. 11% incremento de grosor dérmico.", source: "J Cosmet Dermatol, 2009" },
  { ingredient: "Ácido Tranexámico", study: "Melasma", result: "Al 3% tópico reduce melasma en 12 semanas. Sin efectos sistémicos.", source: "J Am Acad Dermatol, 2018" },
  { ingredient: "Ácido Tranexámico", study: "Hiperpigmentación", result: "Al 5% con Niacinamida sinergia. 50% reducción de manchas en 12 semanas.", source: "Dermatol Ther, 2020" },
  { ingredient: "Centella Asiática", study: "Cicatrización", result: "Madecassósidos al 1% aceleran reparación en 30%. Antiinflamatorio documentado.", source: "Int J Pharm, 2012" },
  { ingredient: "Centella Asiática", study: "Rosácea", result: "Al 0.5% reduce eritema en 8 semanas. Efecto calmante comparable a metronidazol tópico.", source: "J Eur Acad Dermatol, 2014" },
  { ingredient: "Ácido Salicílico", study: "Acné", result: "Al 2% reduce lesiones inflamatorias en 6 semanas. 45% mejora global.", source: "J Am Acad Dermatol, 1999" },
  { ingredient: "Ácido Salicílico", study: "Poros", result: "Al 1% reduce poros visibles en 8 semanas. Exfoliación intraductal.", source: "Dermatol Surg, 2004" },
  { ingredient: "Pantenol", study: "Reparación de barrera", result: "Al 5% acelera reparación en 72 horas. 29% incremento de hidratación.", source: "J Eur Acad Dermatol, 2002" },
  { ingredient: "Ceramidas", study: "TEWL", result: "Al 1% reduce TEWL en 48 horas. Restaura manto lipídico.", source: "Br J Dermatol, 2014" },
  { ingredient: "Alfa-Arbutina", study: "Depigmentación", result: "Al 2% reduce melanina en 50% en 12 semanas. Sin toxicidad melanocitaria.", source: "Pigment Cell Res, 1998" },
  { ingredient: "Ácido Kójico", study: "Inhibición de tirosinasa", result: "Al 2% inhibe 50% de tirosinasa in vitro. In vivo menos efectivo por penetración.", source: "J Ferment Bioeng, 1999" },
  { ingredient: "Escualano", study: "Emoliencia", result: "Al 100% (aceite puro) mejora elasticidad en 8 semanas. No comedogénico.", source: "J Cosmet Dermatol, 2008" },
  { ingredient: "Glicerina", study: "Humectante", result: "Al 5% incrementa hidratación en 2 horas. El humectante con más evidencia.", source: "J Cosmet Sci, 2013" },
  { ingredient: "Colágeno Marino", study: "Elasticidad", result: "Al 5% mejora elasticidad en 12 semanas. 23% incremento de hidratación.", source: "J Med Food, 2015" },
  { ingredient: "Ácido Glicólico", study: "Fotoenvejecimiento", result: "Al 10% reduce arrugas en 12 semanas. 25% incremento de colágeno dérmico.", source: "Dermatol Surg, 1996" },
  { ingredient: "Urea", study: "Queratolítica", result: "Al 10% reduce hiperqueratosis en 2 semanas. Al 20% exfolia.", source: "J Am Acad Dermatol, 1987" },
  { ingredient: "Extracto de Manzanilla", study: "Antiinflamatorio", result: "Bisabolol al 0.3% reduce eritema en 24 horas. Tradición milenaria.", source: "Planta Med, 1994" },
  { ingredient: "Allantoína", study: "Cicatrización", result: "Al 0.5% promueve proliferación celular. Efecto calmante en 48 horas.", source: "Arzneimittelforschung, 1991" },
  { ingredient: "Azufre", study: "Acné", result: "Al 10% reduce lesiones en 8 semanas. Antibacteriano contra C. acnes.", source: "J Am Acad Dermatol, 1982" },
  { ingredient: "Zinc PCA", study: "Seborrea", result: "Al 1% reduce grasa visible en 6 semanas. Efecto astringente suave.", source: "J Cosmet Dermatol, 2001" },
  { ingredient: "Vitamina E", study: "Antioxidante", result: "Al 1% potencia Vitamina C. Protección contra fotodaño. Sinergia documentada.", source: "J Am Acad Dermatol, 2006" },
]

/**
 * 14 mechanisms of action.
 */
export const INGREDIENT_MECHANISMS: IngredientMechanism[] = [
  { name: "Inhibición de Tirosinasa", pathway: "Bloquea conversión de tirosina → DOPA → melanina", targetCells: "Melanocitos", timeframe: "4-12 semanas" },
  { name: "Regulación de Transferencia de Melanosomas", pathway: "Bloquea movimiento de melanosomas a queratinocitos", targetCells: "Queratinocitos", timeframe: "8-12 semanas" },
  { name: "Exfoliación Química (AHA/BHA)", pathway: "Disuelve uniones corneodesmosomas → renovación acelerada", targetCells: "Corneocitos", timeframe: "2-8 semanas" },
  { name: "Inhibición de 5-alfa Reductasa", pathway: "Bloquea conversión testosterona → DHT → reduce sebo", targetCells: "Glándulas sebáceas", timeframe: "4-8 semanas" },
  { name: "Estimulación de Colágeno", pathway: "Activa receptores TGF-β → síntesis de colágeno I/III", targetCells: "Fibroblastos", timeframe: "8-24 semanas" },
  { name: "Retención de Humedad (Humectante)", pathway: "Atrae agua del ambiente y dermis al estrato córneo", targetCells: "Estrato córneo", timeframe: "Horas-días" },
  { name: "Reparación de Barrera Lipídica", pathway: "Reemplaza ceramidas/colesterol/ácidos grasos perdidos", targetCells: "Matriz intercelular", timeframe: "1-4 semanas" },
  { name: "Neutralización de Radicales Libres", pathway: "Dona electrones a ROS → previene daño oxidativo a ADN/células", targetCells: "Todas las capas", timeframe: "Horas (prot.)" },
  { name: "Antiinflamatorio (COX/LOX)", pathway: "Inhibe ciclooxigenasa/loxigenasa → reduce prostaglandinas", targetCells: "Queratinocitos, fibroblastos", timeframe: "Días-semanas" },
  { name: "Migración Celular (Cica)", pathway: "Madecassósidos activan TGF-β → migración de fibroblastos", targetCells: "Fibroblastos", timeframe: "1-2 semanas" },
  { name: "Osmolito (Pantenol)", pathway: "Atrae agua intracelular → mantiene hidratación", targetCells: "Queratinocitos", timeframe: "Horas" },
  { name: "Antibacteriano (Zinc/Azufre)", pathway: "Disruptor de membrana bacteriana + quelación de hierro", targetCells: "C. acnes, S. epidermidis", timeframe: "Días-semanas" },
  { name: "Queratolítico (Urea)", pathway: "Desnaturaliza proteínas del corneodesmosoma → exfoliación", targetCells: "Corneocitos", timeframe: "Semanas" },
  { name: "Antiinflamatorio Natural (Bisabolol)", pathway: "Inhibe producción de radicales libres por neutrófilos", targetCells: "Neutrófilos", timeframe: "Horas-días" },
]

/**
 * 25 ingredient interactions.
 */
export const INGREDIENT_INTERACTIONS: IngredientInteraction[] = [
  { a: "Vitamina C", b: "Ácido Ferúlico", effect: "synergistic", description: "Ácido Ferúlico estabiliza Vitamina C 8x más. Potencia protección UV. Sinergia clásica." },
  { a: "Vitamina C", b: "Vitamina E", effect: "synergistic", description: "Ambos se regeneran mutuamente. Vitamina E prolonga vida útil de Vitamina C." },
  { a: "Vitamina C", b: "Niacinamida", effect: "synergistic", description: "Combinación antihiperpigmentación poderosa. Mecanismos complementarios." },
  { a: "Retinol", b: "Ácido Hialurónico", effect: "synergistic", description: "AH hidrata mientras Retinol renueva. Compensan resequedad del retinol." },
  { a: "Retinol", b: "Ceramidas", effect: "synergistic", description: "Ceramidas reparan barrera mientras Retinol actúa. Reduce irritación del retinol." },
  { a: "Niacinamida", b: "Ácido Salicílico", effect: "synergistic", description: "Niacinamida regula sebo mientras BHA limpia poros. Anti-acné potenciado." },
  { a: "Ácido Hialurónico", b: "Ceramidas", effect: "synergistic", description: "AH atrae agua, Ceramidas la sellan. Hidratación completa (humectante + oclusivo)." },
  { a: "Centella Asiática", b: "Pantenol", effect: "synergistic", description: "Ambos reparan barrera por mecanismos diferentes. Calmante potenciado." },
  { a: "Alfa-Arbutina", b: "Vitamina C", effect: "synergistic", description: "Mecanismos complementarios de inhibición de melanina. Efecto aditivo." },
  { a: "Retinol", b: "Vitamina C", effect: "antagonistic", description: "No combinar en la misma rutina. Vitamina C necesita pH ácido, Retinol se inactiva." },
  { a: "Retinol", b: "Ácido Glicólico", effect: "antagonistic", description: "Ambos exfolian/renuevan. Combinados = irritación severa. Separar por rutina (AM/PM)." },
  { a: "Retinol", b: "Ácido Salicílico", effect: "antagonistic", description: "Doble exfoliación. Irritación severa. Usar BHA en AM, Retinol en PM." },
  { a: "Vitamina C", b: "Ácido Glicólico", effect: "caution", description: "Ambos requieren pH ácido pero pueden combinarse. Usar Vitamina C en AM, AHA en PM." },
  { a: "Vitamina C", b: "Ácido Salicílico", effect: "caution", description: "Combinación aceptable pero BHA puede reducir estabilidad de Vitamina C. Separar." },
  { a: "Niacinamida", b: "Ácido Glicólico", effect: "caution", description: "Niacinamida estable a pH 6. AHA baja pH. Usar en rutinas separadas." },
  { a: "Ácido Tranexámico", b: "Vitamina C", effect: "synergistic", description: "Ambos inhiben melanogénesis por vías complementarias. Sinergia documentada." },
  { a: "Péptidos de Cobre", b: "Vitamina C", effect: "caution", description: "Vitamina C ácida puede desestabilizar péptidos. Separar por rutina." },
  { a: "Alfa-Arbutina", b: "Retinol", effect: "synergistic", description: "Arbutina inhibe melanina, Retinol renueva. Combinación anti-manchas potente." },
  { a: "Azufre", b: "Peróxido de Benzoilo", effect: "antagonistic", description: "NO combinar. Azufre + BPO = irritación severa y precipitación química." },
  { a: "Azufre", b: "Ácido Salicílico", effect: "caution", description: "Doble queratolítico. Puede resecar excesivamente. Usar con precaución." },
  { a: "Zinc PCA", b: "Ácido Salicílico", effect: "synergistic", description: "Zinc regula sebo, BHA limpia poros. Sinergia anti-grasa." },
  { a: "Escualano", b: "Ceramidas", effect: "synergistic", description: "Emoliente + reparador de barrera. Complementarios para piel seca." },
  { a: "Glicerina", b: "Ácido Hialurónico", effect: "synergistic", description: "Ambos humectantes pero mecanismos diferentes. Doble hidratación." },
  { a: "Urea", b: "Ácido Salicílico", effect: "caution", description: "Doble queratolítico. Solo para casos severos de hiperqueratosis. Supervisión." },
  { a: "Colágeno Marino", b: "Vitamina C", effect: "synergistic", description: "Vitamina C es cofactor para síntesis de colágeno. Efecto potenciado." },
]

/**
 * Lazy DB import — won't crash if DB is unavailable.
 */
let _db: typeof import("@/lib/db") | null = null
async function getDB() {
  if (_db) return _db
  try {
    _db = await import("@/lib/db")
    return _db
  } catch {
    return null
  }
}

/**
 * Read all ingredients from the DB.
 */
export async function getIngredientsFromDB(): Promise<DBIngredientKB[] | null> {
  const mod = await getDB()
  if (!mod?.db) return null
  try {
    return await mod.db.ingredientKB.findMany()
  } catch {
    return null
  }
}

/**
 * Seed the DB with static INGREDIENT_KB data (idempotent via upsert).
 */
export async function seedIngredientKB(): Promise<{ seeded: number }> {
  const mod = await getDB()
  if (!mod?.db) return { seeded: 0 }

  let count = 0
  for (const category of INGREDIENT_KB) {
    for (const ing of category.ingredients) {
      try {
        await mod.db.ingredientKB.upsert({
          where: { name: ing.name },
          update: {
            category: category.concern,
            mechanism: ing.mechanism,
            concentration: ing.concentration,
            evidence: ing.evidence,
            pairsWith: ing.pairsWith,
            caution: ing.caution ?? null,
          },
          create: {
            name: ing.name,
            category: category.concern,
            mechanism: ing.mechanism,
            concentration: ing.concentration,
            evidence: ing.evidence,
            pairsWith: ing.pairsWith,
            caution: ing.caution ?? null,
          },
        })
        count++
      } catch {
        // skip individual failures
      }
    }
  }
  return { seeded: count }
}

/**
 * Check for interactions between a set of ingredients.
 */
export function checkInteractions(ingredients: string[]): IngredientInteraction[] {
  const lower = ingredients.map((i) => i.toLowerCase())
  return INGREDIENT_INTERACTIONS.filter(
    (inter) =>
      lower.some((l) => l.includes(inter.a.toLowerCase()) || inter.a.toLowerCase().includes(l)) &&
      lower.some((l) => l.includes(inter.b.toLowerCase()) || inter.b.toLowerCase().includes(l))
  )
}

/**
 * Match skin analysis observations to relevant ingredient categories.
 * Returns ingredient KB entries relevant to the user's findings.
 * @param dbIngredients - Optional DB-sourced ingredients. If provided, uses those instead of static INGREDIENT_KB.
 */
export function matchIngredientsToAnalysis(
  observations: string[],
  skinType: string,
  dbIngredients?: DBIngredientKB[] | null
): ConcernIngredients[] {
  const text = [...observations, skinType].join(" ").toLowerCase()

  const concernKeywords: Record<string, string[]> = {
    manchas: ["mancha", "pigmentación", "hiperpigmentación", "tono desigual", "oscur", "melasma"],
    arrugas: ["arruga", "línea", "expresión", "elasticidad", "firmeza", "flacidez", "colágeno"],
    poros: ["poro", "textura", "irregular", "grasa", "brillo", "sebo", "comedón"],
    sensibilidad: ["sensibl", "enrojecimiento", "irritación", "rojec", "rosácea", "reactiv"],
    hidratacion: ["seca", "deshidrat", "descamación", "tirantez", "opaca", "apagada"],
    acne: ["acné", "brote", "grano", "punto negro", "comedón", "inflamatori"],
  }

  // Build source data: DB rows grouped by category, or static INGREDIENT_KB
  let sourceKB: ConcernIngredients[]
  if (dbIngredients && dbIngredients.length > 0) {
    const grouped = new Map<string, IngredientEntry[]>()
    for (const row of dbIngredients) {
      if (!grouped.has(row.category)) grouped.set(row.category, [])
      grouped.get(row.category)!.push({
        name: row.name,
        mechanism: row.mechanism,
        evidence: row.evidence,
        concentration: row.concentration,
        pairsWith: row.pairsWith,
        caution: row.caution ?? undefined,
      })
    }
    sourceKB = Array.from(grouped.entries()).map(([concern, ingredients]) => {
      const staticEntry = INGREDIENT_KB.find((e) => e.concern === concern)
      return {
        concern,
        description: staticEntry?.description ?? concern,
        ingredients,
      }
    })
  } else {
    sourceKB = INGREDIENT_KB
  }

  const matched: ConcernIngredients[] = []

  for (const entry of sourceKB) {
    const keywords = concernKeywords[entry.concern] || []
    if (keywords.some((kw) => text.includes(kw))) {
      matched.push(entry)
    }
  }

  // Always include hydration basics
  if (!matched.find((m) => m.concern === "hidratacion")) {
    const hydration = sourceKB.find((m) => m.concern === "hidratacion")
    if (hydration) matched.push(hydration)
  }

  return matched
}

/**
 * Format matched ingredients into a prompt-ready string.
 * Works with both static ConcernIngredients[] and DB-derived shapes.
 */
export function formatIngredientsForPrompt(
  matched: ConcernIngredients[] | { concern: string; description: string; ingredients: IngredientEntry[] }[]
): string {
  if (matched.length === 0) return ""

  const lines: string[] = [
    "BASE DE DATOS DE INGREDIENTES ACTIVOS (contexto para tus recomendaciones):",
    "",
  ]

  for (const category of matched) {
    lines.push(`## ${category.description}`)
    for (const ing of category.ingredients.slice(0, 3)) {
      lines.push(
        `- ${ing.name}: ${ing.mechanism} | Evidencia: ${ing.evidence} | Concentración: ${ing.concentration}`
      )
      if (ing.caution) lines.push(`  Precaución: ${ing.caution}`)
    }
    lines.push("")
  }

  lines.push(
    "Usa esta información para fundamentar tus recomendaciones. Cita los ingredientes por nombre."
  )

  return lines.join("\n")
}
