import { PDFDocument, StandardFonts, rgb, PageSizes } from "pdf-lib"
import { writeFileSync } from "fs"
import { fileURLToPath } from "url"
import { dirname, resolve } from "path"

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const guides = [
  {
    slug: "guia-piel-grasa",
    title: "Guía Definitiva para Piel Grasa",
    sections: [
      {
        heading: "¿Qué es la piel grasa?",
        body: [
          "La piel grasa se caracteriza por una producción excesiva de sebo por parte de las glándulas sebáceas.",
          "Esto puede deberse a factores genéticos, hormonales, ambientales o al uso de productos inadecuados.",
          "Aunque puede ser frustrante, la piel grasa tiene ventajas: tiende a envejecer más lentamente y muestra menos arrugas finas.",
        ],
      },
      {
        heading: "Limpieza adecuada",
        body: [
          "Usa un limpiador suave con ácido salicílico o niacinamida por la mañana y por la noche.",
          "Evita limpiadores agresivos que eliminan completamente el sebo, ya que pueden causar efecto rebote.",
          "El doble lavado (aceite + agua) por la noche ayuda a disolver el exceso de grasa sin irritar.",
        ],
      },
      {
        heading: "Ingredientes clave",
        body: [
          "Niacinamida: regula la producción de sebo y mejora la textura de la piel.",
          "Ácido salicílico: exfoliante liposoluble que penetra en los poros y los limpia desde adentro.",
          "Zinc: propiedades astringentes y antiinflamatorias que calman la piel grasa.",
          "Arcilla: absorbe el exceso de grasa sin resecar. Úsala 1-2 veces por semana como mascarilla.",
        ],
      },
      {
        heading: "Hidratación esencial",
        body: [
          "La piel grasa también necesita hidratación. Usa un gel hidratante ligero sin aceites (oil-free).",
          "El ácido hialurónico es ideal porque hidrata sin aportar grasa.",
          "Evita las cremas pesadas con manteca de karité o aceites comedogénicos.",
        ],
      },
      {
        heading: "Protección solar",
        body: [
          "Usa protector solar oil-free con SPF 50+ todos los días.",
          "Los protectores solares en gel o bruma son ideales para piel grasa.",
          "No saltar el protector solar por miedo a más grasa: existen opciones matificantes.",
        ],
      },
      {
        heading: "Errores comunes",
        body: [
          "Lavarse la cara más de 2 veces al día: elimina la barrera protectora y empeora la grasa.",
          "Usar alcohol en la piel: reseca temporalmente pero causa irritación y más sebo después.",
          "Omitir la hidratación: la piel deshidratada produce más sebo para compensar.",
          "Exfoliar en exceso: daña la barrera cutánea y aumenta la sensibilidad.",
        ],
      },
      {
        heading: "Rutina diaria recomendada",
        body: [
          "Mañana: limpiador suave, tónico con niacinamida, gel hidratante, protector solar.",
          "Noche: doble limpieza, exfoliante químico (2-3 veces/semana), sérum de zinc, crema hidratante ligera.",
          "Semanal: mascarilla de arcilla 1-2 veces, exfoliación con AHA/BHA según tolerancia.",
        ],
      },
    ],
  },
  {
    slug: "eliminar-manchas-30-dias",
    title: "Cómo Eliminar Manchas en 30 Días",
    sections: [
      {
        heading: "Tipos de manchas",
        body: [
          "Hiperpigmentación postinflamatoria: aparece después de un grano o lesión. Es la más fácil de tratar.",
          "Melasma: manchas hormonales, comunes en el embarazo o por anticonceptivos. Requiere constancia.",
          "Lentigos solares: manchas por daño solar acumulado. Aparecen con la edad en zonas expuestas.",
        ],
      },
      {
        heading: "Semana 1: Preparación",
        body: [
          "Inicia con una rutina básica: limpiador suave, hidratante y protector solar SPF 50+.",
          "Introduce vitamina C por la mañana para protección antioxidante y luminosidad.",
          "Deja que tu piel se adapte. No agregues múltiples activos nuevos a la vez.",
        ],
      },
      {
        heading: "Semana 2: Exfoliación",
        body: [
          "Comienza con ácido glicólico al 5-7% cada 2-3 noches para renovación celular.",
          "Alterna con niacinamida al 4% para reducir la transferencia de melanina.",
          "Mantén protección solar estricta: los ácidos aumentan la fotosensibilidad.",
        ],
      },
      {
        heading: "Semana 3: Intensificación",
        body: [
          "Agrega ácido tranexámico o arbutin para atacar la melanina desde múltiples vías.",
          "Si tu piel tolera, aumenta el ácido glicólico a cada noche alterna.",
          "Considera una mascarilla iluminadora 1 vez por semana.",
        ],
      },
      {
        heading: "Semana 4: Mantenimiento",
        body: [
          "Evalúa los resultados. Las manchas superficiales deberían haber reducido visiblemente.",
          "Continúa con la rutina. Las manchas más profundas necesitan 2-3 meses de tratamiento.",
          "Programa una cita con un dermatólogo si no ves mejoría significativa.",
        ],
      },
      {
        heading: "Ingredientes que funcionan",
        body: [
          "Vitamina C (L-ascorbic acid): potente antioxidante que ilumina y previene manchas.",
          "Niacinamida: reduce la transferencia de melanina a las células superficiales.",
          "Ácido kójico: inhibe la tirosinasa, la enzima responsable de la producción de melanina.",
          "Retinoides: aceleran la renovación celular y ayudan a desvanecer manchas profundas.",
        ],
      },
    ],
  },
  {
    slug: "rutina-antiedad-40",
    title: "Rutina Antiedad para 40+",
    sections: [
      {
        heading: "Cambios en la piel a partir de los 40",
        body: [
          "Disminución de colágeno: la piel pierde firmeza y elasticidad gradualmente.",
          "Reducción de ácido hialurónico: aparecen líneas finas y arrugas más marcadas.",
          "Ralentización de la renovación celular: la piel se ve más opaca y desigual.",
          "Sequedad: las glándulas sebáceas producen menos grasa natural.",
        ],
      },
      {
        heading: "Ingredientes estrella",
        body: [
          "Retinol: el ingrediente antiedad más estudiado. Estimula colágeno y renovación celular.",
          "Péptidos: señalizan a la piel que produzca más colágeno y elastina.",
          "Ácido hialurónico: hidrata en profundidad y rellena las arrugas desde adentro.",
          "Vitamina C: antioxidante que protege del daño ambiental y potencia la luminosidad.",
          "Ceramidas: reparan la barrera cutánea y previenen la pérdida de agua.",
        ],
      },
      {
        heading: "Rutina matutina",
        body: [
          "Limpieza suave con limpiador cremoso o hidratante.",
          "Sérum de vitamina C para protección antioxidante.",
          "Contorno de ojos con péptidos y cafeína.",
          "Hidratante con ácido hialurónico y ceramidas.",
          "Protector solar SPF 50+ esencial todos los días.",
        ],
      },
      {
        heading: "Rutina nocturna",
        body: [
          "Doble limpieza: aceite desmaquillante + limpiador suave.",
          "Sérum de retinol (0.3-0.5%) empezando 2-3 veces por semana.",
          "Crema hidratante rica con péptidos y niacinamida.",
          "Contorno de ojos más nutritivo.",
        ],
      },
      {
        heading: "Consejos adicionales",
        body: [
          "Bebe suficiente agua: la hidratación interna se refleja en la piel.",
          "Duerme 7-8 horas: el sueño es cuando la piel se repara.",
          "Reduce el estrés: el cortisol acelera el envejecimiento cutáneo.",
          "Alimentación rica en antioxidantes: frutas, verduras, omega-3.",
        ],
      },
    ],
  },
  {
    slug: "ingredientes-evitar",
    title: "Ingredientes que Debes Evitar",
    sections: [
      {
        heading: "Parabenos",
        body: [
          "Los parabenos (methylparaben, propylparaben, butylparaben) son conservantes cuestionados.",
          "Aunque la evidencia científica no es concluyente, muchas personas prefieren evitarlos.",
          "Busca productos etiquetados como 'paraben-free' si te preocupa su efecto.",
        ],
      },
      {
        heading: "Sulfatos agresivos",
        body: [
          "Sodium Lauryl Sulfate (SLS) y Sodium Laureth Sulfate (SLES) son detergentes fuertes.",
          "Eliminan la barrera protectora de la piel, causando sequedad e irritación.",
          "Opta por limpiadores con surfactantes suaves como coco-glucoside o decyl glucoside.",
        ],
      },
      {
        heading: "Ftalatos",
        body: [
          "Usados para que las fragancias duren más. Se ha relacionado con alteraciones hormonales.",
          "Aparecen en la lista de ingredientes simplemente como 'fragrance' o 'parfum'.",
          "Elige productos sin fragancia o con aceites esenciales naturales.",
        ],
      },
      {
        heading: "Alcohol desnaturalizado",
        body: [
          "El alcohol denat. o SD alcohol se usa para dar sensación de frescor y absorción rápida.",
          "En concentraciones altas reseca la piel, irrita y daña la barrera cutánea.",
          "No todos los alcoholes son malos: los alcohol grasos (cetyl, stearyl) son emolientes beneficiosos.",
        ],
      },
      {
        heading: "Aceites esenciales irritantes",
        body: [
          "Aceite de menta, eucalipto, clavo, canela y limón pueden ser muy irritantes.",
          "Las personas con piel sensible deben evitarlos, especialmente en concentraciones altas.",
          "Aunque son naturales, pueden causar dermatitis de contacto y fotosensibilidad.",
        ],
      },
      {
        heading: "Ingredientes comedogénicos",
        body: [
          "Algunos ingredientes obstruyen los poros: manteca de cacao, aceite de coco, lanolina.",
          "La piel grasa y con acné debe evitar estos ingredientes en productos leave-in.",
          "Revisa las etiquetas: busca 'non-comedogenic' o 'oil-free'.",
        ],
      },
    ],
  },
  {
    slug: "proteccion-solar-anual",
    title: "Guía de Protección Solar Todo el Año",
    sections: [
      {
        heading: "Mitos sobre la protección solar",
        body: [
          "Mito: 'No necesito protector solar en días nublados'. Realidad: hasta el 80% de los rayos UV atraviesan las nubes.",
          "Mito: 'Mi maquillaje tiene SPF, es suficiente'. Realidad: necesitas 1/4 cucharadita solo para la cara.",
          "Mito: 'Las personas de piel oscura no necesitan protección'. Realidad: todos los tipos de piel necesitan protección solar.",
        ],
      },
      {
        heading: "Tipos de filtro solar",
        body: [
          "Filtros químicos: absorben los rayos UV y los convierten en calor. Textura ligera, invisible.",
          "Filtros físicos (minerales): crean una barrera que refleja los rayos. Ideales para piel sensible.",
          "Filtros híbridos: combinan ambos tipos para mejor protección y textura agradable.",
        ],
      },
      {
        heading: "SPF y espectro",
        body: [
          "SPF 30 bloquea el 97% de rayos UVB. SPF 50 bloquea el 98%. La diferencia es pequeña pero importante.",
          "Busca 'broad spectrum' o 'espectro completo' para protección contra UVA y UVB.",
          "Los rayos UVA penetran más profundo y causan envejecimiento prematuro. Los UVB causan quemaduras.",
        ],
      },
      {
        heading: "Cómo aplicar correctamente",
        body: [
          "Cantidad: 1/4 cucharadita para la cara, 1/2 cucharadita para cara + cuello.",
          "Orden: aplica después de la hidratación y antes del maquillaje.",
          "Espera 15 minutos antes de exponerte al sol para que se forme la película protectora.",
          "Reaplica cada 2 horas, o después de nadar, sudar o secarte con toalla.",
        ],
      },
      {
        heading: "Protección solar en cada estación",
        body: [
          "Primavera: comienza a aumentar la protección. Los días se alargan y la exposición es mayor.",
          "Verano: usa SPF 50+, evita el sol entre 10am y 4pm, usa sombrero y gafas de sol.",
          "Otoño: no bajes la guardia. Los rayos UV siguen siendo dañinos incluso con temperaturas más frescas.",
          "Invierno: la nieve refleja hasta el 80% de los rayos UV. Usa protección igual que en verano.",
        ],
      },
    ],
  },
  {
    slug: "rutina-principiantes",
    title: "Rutina de Skincare para Principiantes",
    sections: [
      {
        heading: "¿Por dónde empezar?",
        body: [
          "El skincare no tiene por qué ser complicado. Con solo 3 pasos puedes tener una rutina efectiva.",
          "Lo más importante es la constancia: una rutina simple que hagas todos los días es mejor que una rutina compleja que abandones.",
          "Escucha a tu piel: si un producto te irrita, suspéndelo. No todo funciona para todos.",
        ],
      },
      {
        heading: "Los 3 pasos básicos",
        body: [
          "Paso 1 - Limpieza: lava tu cara mañana y noche con un limpiador suave adecuado a tu tipo de piel.",
          "Paso 2 - Hidratación: aplica una crema hidratante que mantenga la barrera cutánea saludable.",
          "Paso 3 - Protección: usa protector solar SPF 30+ cada mañana (el paso más importante).",
        ],
      },
      {
        heading: "Identifica tu tipo de piel",
        body: [
          "Piel seca: tirantez, descamación, sensación áspera. Necesita hidratación rica y ingredientes nutritivos.",
          "Piel grasa: brillo, poros dilatados, tendencia a imperfecciones. Necesita hidratación ligera oil-free.",
          "Piel mixta: zona T grasa, mejillas secas. Rutina equilibrada con productos específicos por zona.",
          "Piel sensible: enrojecimiento, picor, reacción a productos. Rutina minimalista con ingredientes calmantes.",
        ],
      },
      {
        heading: "Siguientes pasos (cuando estés lista)",
        body: [
          "Exfoliación química suave 1-2 veces por semana con ácido láctico o PHA.",
          "Sérum de vitamina C por la mañana para antioxidante y luminosidad.",
          "Contorno de ojos para hidratar y prevenir líneas finas.",
          "Mascarilla semanal según tu tipo de piel.",
        ],
      },
      {
        heading: "Errores de principiante",
        body: [
          "Introducir demasiados productos a la vez: agrega uno nuevo cada 2-3 semanas.",
          "Usar productos muy fuertes: empieza con concentraciones bajas y aumenta gradualmente.",
          "Esperar resultados inmediatos: el skincare necesita 4-6 semanas para mostrar cambios visibles.",
        ],
      },
    ],
  },
  {
    slug: "guia-acne-completa",
    title: "Acné: Causas, Tratamientos y Mitos",
    sections: [
      {
        heading: "¿Qué causa el acné?",
        body: [
          "El acné ocurre cuando los folículos pilosos se obstruyen con sebo y células muertas.",
          "La bacteria Cutibacterium acnes prolifera en este ambiente, causando inflamación.",
          "Factores contribuyentes: hormonas, genética, estrés, dieta, medicamentos.",
        ],
      },
      {
        heading: "Tipos de acné",
        body: [
          "Comedones cerrados (puntos blancos) y abiertos (puntos negros): lesiones no inflamatorias.",
          "Pápulas: lesiones rojas e inflamadas sin pus. Indican irritación del folículo.",
          "Pústulas: pápulas con pus en la punta. Es la lesión clásica del acné inflamatorio.",
          "Nódulos y quistes: lesiones profundas, dolorosas, con alto riesgo de cicatriz.",
        ],
      },
      {
        heading: "Ingredientes que funcionan",
        body: [
          "Peróxido de benzoílo: mata la bacteria del acné y reduce la inflamación.",
          "Ácido salicílico: exfolia dentro del poro y previene obstrucciones.",
          "Retinoides (adapaleno, tretinoína): regulan la renovación celular y previenen nuevos brotes.",
          "Niacinamida: antiinflamatoria, regula el sebo y mejora la textura.",
          "Azelaico: antibacteriano y antiinflamatorio, excelente para piel sensible con acné.",
        ],
      },
      {
        heading: "Mitos y verdades",
        body: [
          "Mito: 'El acné es por falta de limpieza'. Verdad: limpiar en exceso empeora el acné.",
          "Mito: 'El chocolate causa acné'. Verdad: el azúcar y los lácteos pueden influir en algunas personas.",
          "Mito: 'La pasta de dientes seca los granos'. Verdad: irrita la piel y puede empeorar la inflamación.",
          "Mito: 'El sol mejora el acné'. Verdad: el sol reduce temporalmente la inflamación pero empeora a largo plazo.",
        ],
      },
      {
        heading: "Cuándo ver a un dermatólogo",
        body: [
          "Si el acné es severo (nódulos, quistes) o deja cicatrices.",
          "Si no ves mejoría después de 3 meses con productos de venta libre.",
          "Si el acné afecta tu autoestima o salud mental.",
          "Si tienes acné adulto que aparece repentinamente (puede indicar un problema hormonal).",
        ],
      },
    ],
  },
  {
    slug: "ingredientes-activos",
    title: "Retinol, Vitamina C y Niacinamida",
    sections: [
      {
        heading: "Vitamina C (Ácido L-ascórbico)",
        body: [
          "Es el antioxidante más estudiado y efectivo para la piel.",
          "Protege contra el daño ambiental, estimula colágeno y unifica el tono.",
          "Se usa por la mañana, antes del protector solar, para potenciar su efecto.",
          "Concentraciones efectivas: 10-20%. Empieza con 10% si eres principiante.",
          "Se oxida con el contacto con el aire: busca envases opacos y con gotero.",
        ],
      },
      {
        heading: "Retinol (Vitamina A)",
        body: [
          "El gold standard antiedad: estimula colágeno y acelera la renovación celular.",
          "Reduce arrugas, manchas, acné y mejora la textura general de la piel.",
          "Se usa solo por la noche. Nunca mezclar con ácidos exfoliantes en la misma rutina.",
          "Concentraciones: 0.25% (principiante), 0.5% (intermedio), 1% (avanzado).",
          "Efectos secundarios: descamación, enrojecimiento, sensibilidad (retinización).",
        ],
      },
      {
        heading: "Niacinamida (Vitamina B3)",
        body: [
          "Ingrediente multi-tasking: regula sebo, reduce poros, unifica tono, fortalece barrera.",
          "Es ideal para todo tipo de piel, incluso las más sensibles.",
          "Concentraciones: 2-10%. El 4-5% es el punto dulce para la mayoría.",
          "Se combina bien con casi todos los ingredientes: vitamina C, retinol, ácidos.",
          "Efecto sinérgico con zinc para control de grasa y acné.",
        ],
      },
      {
        heading: "Cómo combinarlos en rutina",
        body: [
          "Mañana: Vitamina C (+ Niacinamida si tu piel tolera ambas) + hidratante + SPF.",
          "Noche: Niacinamida + Retinol (aplica primero niacinamida, espera, luego retinol).",
          "Alternativa: Niacinamida mañana y noche, Vitamina C solo mañana, Retinol solo noche.",
          "No combines Vitamina C y Retinol en la misma aplicación (diferente pH óptimo).",
          "No combines Retinol con AHA/BHA en la misma noche. Alterna noches.",
        ],
      },
      {
        heading: "Tabla de compatibilidades",
        body: [
          "Vitamina C + Niacinamida: COMPATIBLES (el mito de que se cancelan ha sido desmentido).",
          "Vitamina C + Retinol: NO en misma aplicación. Usa uno mañana y otro noche.",
          "Retinol + Niacinamida: COMPATIBLES y sinérgicos. La niacinamida reduce la irritación del retinol.",
          "Vitamina C + Ácidos AHA/BHA: NO en misma aplicación. Alterna mañanas o usa AHA en noche.",
          "Retinol + Ácidos: NO en misma noche. Alterna noches: una noche retinol, otra ácidos.",
        ],
      },
    ],
  },
  {
    slug: "skincare-tropical",
    title: "Cuidado de la Piel en Clima Tropical",
    sections: [
      {
        heading: "El desafío del clima tropical",
        body: [
          "Calor y humedad constantes: la piel produce más sebo y suda más.",
          "Radiación solar intensa durante todo el año: mayor riesgo de daño solar.",
          "Los poros se dilatan con el calor, facilitando obstrucciones y brotes.",
          "Hongos y bacterias prosperan en ambientes húmedos, aumentando el riesgo de infecciones.",
        ],
      },
      {
        heading: "Rutina ligera pero efectiva",
        body: [
          "Limpieza en gel o espuma: elimina el exceso de grasa sin resecar.",
          "Tónico equilibrador: ayuda a cerrar poros y mantener el pH saludable.",
          "Hidratación en gel o loción: texturas acuosas que no aportan grasa extra.",
          "Protector solar SPF 50+ en gel o bruma: protection sin sensación pegajosa.",
        ],
      },
      {
        heading: "Productos recomendados",
        body: [
          "Limpiadores con ácido salicílico o té verde para controlar la grasa.",
          "Sérums hidratantes con ácido hialurónico en gel.",
          "Protectores solares con acabado matte y resistencia al agua.",
          "Mascarillas refrescantes con aloe vera o pepino para calmar la piel.",
        ],
      },
      {
        heading: "Errores comunes en clima tropical",
        body: [
          "Usar cremas demasiado pesadas pensando que más es mejor: obstruyen los poros.",
          "No limpiar la cara después de sudar: el sudor mezclado con sebo obstruye los poros.",
          "Exponerse al sol sin protección en días nublados o en interiores cerca de ventanas.",
          "Usar demasiados polvos matificantes: pueden obstruir poros y crear un efecto pastoso.",
        ],
      },
      {
        heading: "Cuidado adicional",
        body: [
          "Bebe más agua de lo normal: la deshidratación por calor afecta la piel rápidamente.",
          "Usa ropa ligera y sombrero de ala ancha para protección física adicional.",
          "Dúchate después de nadar en el mar o piscina para eliminar sal y cloro.",
          "Considera usar un humidificador en espacios con aire acondicionado.",
        ],
      },
    ],
  },
  {
    slug: "guia-exfoliacion",
    title: "Guía de Exfoliación: Ácidos y Peelings",
    sections: [
      {
        heading: "¿Por qué exfoliar?",
        body: [
          "La exfoliación elimina células muertas de la superficie de la piel.",
          "Previene poros obstruidos, mejora la textura y luminosidad.",
          "Permite que los productos activos penetren mejor en la piel.",
          "Estimula la renovación celular natural que se ralentiza con la edad.",
        ],
      },
      {
        heading: "AHA (Alfa Hidroxiácidos)",
        body: [
          "Ácido glicólico: el más potente. Deriva de la caña de azúcar. Excelente para textura y manchas.",
          "Ácido láctico: más suave que el glicólico. Hidrata mientras exfolia. Ideal para piel seca.",
          "Ácido mandélico: el más suave de los AHA. Excelente para piel sensible y melasma.",
          "Los AHA son hidrosolubles: actúan en la superficie de la piel.",
          "Concentraciones: 5-10% para uso doméstico, 20-70% para peelings profesionales.",
        ],
      },
      {
        heading: "BHA (Beta Hidroxiácido)",
        body: [
          "Ácido salicílico: el único BHA. Es liposoluble: penetra dentro del poro.",
          "Ideal para piel grasa, con puntos negros y acné.",
          "También tiene propiedades antiinflamatorias y calmantes.",
          "Concentraciones: 0.5-2% para uso doméstico.",
        ],
      },
      {
        heading: "PHA (Polihidroxiácidos)",
        body: [
          "Gluconolactona, ácido láctobiónico: moléculas más grandes que no penetran tan profundo.",
          "Exfoliación muy suave, ideal para piel sensible, rosácea o eczema.",
          "También tienen propiedades humectantes y antioxidantes.",
          "Perfectos para principiantes o para mantener resultados entre exfoliaciones más fuertes.",
        ],
      },
      {
        heading: "Tabla de compatibilidades",
        body: [
          "Piel grasa/acuosa: BHA (ácido salicílico) 2-3 veces por semana.",
          "Piel seca/madura: AHA (glicólico o láctico) 2-3 veces por semana.",
          "Piel sensible: PHA 3-4 veces por semana o AHA suave (mandélico) 1-2 veces.",
          "Piel mixta: BHA en zona T, AHA en mejillas, o alterna según necesidad.",
        ],
      },
      {
        heading: "Reglas de oro de la exfoliación",
        body: [
          "Empieza con 1 vez por semana y aumenta gradualmente según tolerancia.",
          "Nunca combines dos exfoliantes químicos en la misma aplicación.",
          "Usa siempre protector solar: los ácidos aumentan la fotosensibilidad.",
          "Si sientes ardor, picor o descamación excesiva, reduce la frecuencia.",
          "No exfolies piel irritada, con heridas, quemada por el sol o después de procedimientos.",
        ],
      },
    ],
  },
  {
    slug: "skincare-masculino",
    title: "Skincare Masculino: Guía Completa",
    sections: [
      {
        heading: "La piel masculina es diferente",
        body: [
          "La piel masculina es 20-25% más gruesa que la femenina.",
          "Produce más sebo debido a niveles más altos de testosterona.",
          "Los poros son naturalmente más grandes y visibles.",
          "El afeitado diario irrita la piel y puede causar foliculitis y vellos encarnados.",
        ],
      },
      {
        heading: "Rutina básica para hombres",
        body: [
          "Limpieza: usa un limpiador facial específico, no jabón de cuerpo. Mañana y noche.",
          "Hidratación: incluso las pieles grasas necesitan hidratación. Usa textura ligera en gel.",
          "Protección solar: SPF 30+ mínimo. Las arrugas y manchas también afectan a los hombres.",
          "Post-afeitado: bálsamo calmante con aloe o niacinamida para reducir irritación.",
        ],
      },
      {
        heading: "Cómo tratar la grasa y los poros",
        body: [
          "Limpieza con ácido salicílico 2% para mantener poros desobstruidos.",
          "Sérum de niacinamida para regular la producción de sebo.",
          "Mascarilla de arcilla 1-2 veces por semana para absorber exceso de grasa.",
          "Evita lavarte la cara más de 2 veces al día: reseca y empeora la grasa.",
        ],
      },
      {
        heading: "Cuidado del afeitado",
        body: [
          "Pre-afeitado: lava con agua tibia para abrir poros y suavizar el vello.",
          "Durante: usa crema de afeitar lubricante, afeita en dirección del vello.",
          "Post-afeitado: aplica bálsamo sin alcohol para calmar y desinfectar.",
          "Cambia las cuchillas regularmente: las cuchillas desafiladas irritan más.",
        ],
      },
      {
        heading: "Ingredientes recomendados",
        body: [
          "Niacinamida: regula el sebo, reduce poros, calma la irritación del afeitado.",
          "Cafeína: estimula la circulación, reduce bolsas y ojeras.",
          "Ácido salicílico: previene puntos negros y vellos encarnados.",
          "Aloe vera: calma la irritación post-afeitado.",
          "Vitamina C: protección antioxidante, unifica el tono, luminosidad.",
        ],
      },
    ],
  },
]

const FONT_SIZE_TITLE = 24
const FONT_SIZE_HEADING = 16
const FONT_SIZE_BODY = 11
const FONT_SIZE_FOOTER = 8
const MARGIN = 50
const PAGE_WIDTH = PageSizes.A4[0]
const PAGE_HEIGHT = PageSizes.A4[1]
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2
const LINE_HEIGHT = FONT_SIZE_BODY * 1.4
const HEADING_LINE_HEIGHT = FONT_SIZE_HEADING * 1.6
const TITLE_LINE_HEIGHT = FONT_SIZE_TITLE * 2

async function generateGuidePdf(guide) {
  const doc = await PDFDocument.create()
  const font = await doc.embedFont(StandardFonts.Helvetica)
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold)

  let page = doc.addPage(PageSizes.A4)
  let y = PAGE_HEIGHT - MARGIN

  function wrapText(text, maxWidth) {
    const words = text.split(" ")
    const lines = []
    let current = ""
    for (const word of words) {
      const test = current ? `${current} ${word}` : word
      const width = font.widthOfTextAtSize(test, FONT_SIZE_BODY)
      if (width > maxWidth && current) {
        lines.push(current)
        current = word
      } else {
        current = test
      }
    }
    if (current) lines.push(current)
    return lines.length ? lines : [text]
  }

  function checkPageBreak(needed) {
    if (y - needed < MARGIN) {
      page = doc.addPage(PageSizes.A4)
      y = PAGE_HEIGHT - MARGIN
    }
  }

  function drawFooter() {
    const footerText = "The Serene Lens — Todos los derechos reservados"
    const footerWidth = font.widthOfTextAtSize(footerText, FONT_SIZE_FOOTER)
    page.drawText(footerText, {
      x: (PAGE_WIDTH - footerWidth) / 2,
      y: FONT_SIZE_FOOTER + 10,
      size: FONT_SIZE_FOOTER,
      font,
      color: rgb(0.4, 0.4, 0.4),
    })
  }

  function drawTitle() {
    checkPageBreak(80)
    const titleWidth = fontBold.widthOfTextAtSize(guide.title, FONT_SIZE_TITLE)
    page.drawText(guide.title, {
      x: (PAGE_WIDTH - titleWidth) / 2,
      y: y - FONT_SIZE_TITLE,
      size: FONT_SIZE_TITLE,
      font: fontBold,
      color: rgb(0.18, 0.23, 0.18),
    })
    y -= TITLE_LINE_HEIGHT + 10
    page.drawLine({
      start: { x: MARGIN + 40, y },
      end: { x: PAGE_WIDTH - MARGIN - 40, y },
      thickness: 1.5,
      color: rgb(0.76, 0.88, 0.62),
    })
    y -= 20
    drawFooter()
  }

  function drawSection(heading, body) {
    checkPageBreak(HEADING_LINE_HEIGHT + 10)
    page.drawText(heading, {
      x: MARGIN,
      y: y - FONT_SIZE_HEADING,
      size: FONT_SIZE_HEADING,
      font: fontBold,
      color: rgb(0.18, 0.23, 0.18),
    })
    y -= HEADING_LINE_HEIGHT

    for (const paragraph of body) {
      const lines = wrapText(paragraph, CONTENT_WIDTH)
      const paraHeight = lines.length * LINE_HEIGHT + 8
      checkPageBreak(paraHeight)
      for (const line of lines) {
        page.drawText(line, {
          x: MARGIN,
          y: y - FONT_SIZE_BODY,
          size: FONT_SIZE_BODY,
          font,
          color: rgb(0.2, 0.2, 0.2),
        })
        y -= LINE_HEIGHT
      }
      y -= 8
    }
  }

  drawTitle()
  for (const section of guide.sections) {
    drawSection(section.heading, section.body)
  }

  const pages = doc.getPages()
  for (let i = 0; i < pages.length; i++) {
    const p = pages[i]
    const pageNumText = `${i + 1} / ${pages.length}`
    const numWidth = font.widthOfTextAtSize(pageNumText, FONT_SIZE_FOOTER)
    p.drawText(pageNumText, {
      x: PAGE_WIDTH - MARGIN - numWidth,
      y: FONT_SIZE_FOOTER + 10,
      size: FONT_SIZE_FOOTER,
      font,
      color: rgb(0.4, 0.4, 0.4),
    })
  }

  return await doc.save()
}

async function main() {
  console.log(`Generating ${guides.length} guide PDFs...`)
  const outDir = resolve(__dirname, "..", "public", "guides")

  for (const guide of guides) {
    const pdfBytes = await generateGuidePdf(guide)
    const filePath = resolve(outDir, `${guide.slug}.pdf`)
    writeFileSync(filePath, pdfBytes)
    console.log(`  ✓ ${guide.slug}.pdf (${(pdfBytes.length / 1024).toFixed(0)} KB)`)
  }
  console.log("\nDone! All guides generated in public/guides/")
}

main().catch(console.error)