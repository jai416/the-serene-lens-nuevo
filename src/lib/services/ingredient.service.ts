import { db } from "@/lib/db"

interface Conflict {
  type: "warning" | "caution"
  ingredients: [string, string]
  description: string
  suggestion: string
}

interface IngredientInfo {
  name: string
  category: string
  caution: string | null
}

const KNOWN_CONFLICTS: Array<{
  a: string
  b: string
  description: string
  suggestion: string
  severity: "warning" | "caution"
}> = [
  { a: "retinol", b: "ácido salicílico", description: "Retinol y ácido salicílico juntos pueden causar irritación y descamación.", suggestion: "Usa retinol solo por la noche y ácido salicílico solo por la mañana, o en días alternos.", severity: "warning" },
  { a: "retinol", b: "peróxido de benzoilo", description: "Retinol y peróxido de benzoilo se neutralizan mutuamente y aumentan la irritación.", suggestion: "Usa retinol por la noche y peróxido de benzoilo por la mañana, nunca juntos.", severity: "warning" },
  { a: "retinol", b: "vitamina c", description: "Vitamina C (L-ascórbico) y retinol tienen pH incompatible y pueden irritar si se usan juntos.", suggestion: "Usa vitamina C por la mañana y retinol por la noche.", severity: "caution" },
  { a: "niacinamida", b: "vitamina c", description: "Niacinamida y vitamina C pura pueden causar enrojecimiento si se usan juntas en concentraciones altas.", suggestion: "Usa vitamina C por la mañana y niacinamida por la noche, o separa por 15 minutos.", severity: "caution" },
  { a: "ácido salicílico", b: "ácido glicólico", description: "Dos ácidos exfoliantes juntos pueden sobreexfoliar y dañar la barrera cutánea.", suggestion: "Alterna días: usa ácido salicílico un día y glicólico al siguiente.", severity: "warning" },
  { a: "ácido salicílico", b: "ácido láctico", description: "Combinar múltiples AHAs/BHAs puede sobreexfoliar la piel.", suggestion: "Usa solo un exfoliante por rutina, alternando días entre ellos.", severity: "caution" },
  { a: "retinol", b: "ácido glicólico", description: "Retinol y AHA juntos pueden causar irritación severa y sensibilidad.", suggestion: "Usa AHA por la mañana y retinol por la noche, nunca en la misma rutina.", severity: "warning" },
  { a: "retinol", b: "ácido láctico", description: "Retinol y AHA juntos aumentan el riesgo de irritación.", suggestion: "Alterna noches: una noche retinol, otra noche AHA.", severity: "caution" },
  { a: "benzoyl peroxide", b: "vitamina c", description: "Peróxido de benzoilo oxida la vitamina C, haciéndola inefectiva.", suggestion: "Usa peróxido de benzoilo por la mañana y vitamina C por la noche, o viceversa.", severity: "caution" },
  { a: "aceites", b: "protector solar", description: "Aceites pesados pueden interferir con la absorción del protector solar químico.", suggestion: "Aplica protector solar primero, espera 15 minutos, luego los aceites.", severity: "caution" },
]

function extractIngredientNames(ingredientsString: string): string[] {
  if (!ingredientsString) return []
  const cleaned = ingredientsString
    .replace(/\([^)]*\)/g, "")
    .replace(/\b(?:INCI|and|&|,|\.)\b/g, " ")
  const words = cleaned.toLowerCase().split(/[,;\n]+/).map((s) => s.trim()).filter(Boolean)
  const names = words.map((w) => w.replace(/^\d+[%]?\s*/, "").replace(/\s*\(.*\)$/, "").trim()).filter(Boolean)
  return [...new Set(names)]
}

export const IngredientService = {
  parseIngredients(ingredientsString: string): string[] {
    return extractIngredientNames(ingredientsString)
  },

  async detectConflicts(
    scannedIngredients: string,
    savedProductIngredients: string[],
  ): Promise<Conflict[]> {
    const scannedNames = this.parseIngredients(scannedIngredients)
    const conflicts: Conflict[] = []

    // Combine all ingredients to check
    const allProductNames = savedProductIngredients.map((ing) => this.parseIngredients(ing)).flat()
    const allNames = [...new Set([...scannedNames, ...allProductNames])]

    const knownIngredients = await db.ingredientKB.findMany({
      where: { name: { in: allNames.map((n) => n.toLowerCase()) } },
    })
    const knownMap = new Map(knownIngredients.map((i) => [i.name.toLowerCase(), i]))

    for (const conflict of KNOWN_CONFLICTS) {
      const hasA = scannedNames.some((n) => n.includes(conflict.a) || conflict.a.includes(n))
      const savedHasB = allProductNames.some((n) => n.includes(conflict.b) || conflict.b.includes(n))
      const scannedHasB = scannedNames.some((n) => n.includes(conflict.b) || conflict.b.includes(n))
      const savedHasA = allProductNames.some((n) => n.includes(conflict.a) || conflict.a.includes(n))

      if ((hasA && (savedHasB || scannedHasB)) || (savedHasA && scannedHasB)) {
        conflicts.push({
          type: conflict.severity,
          ingredients: [conflict.a, conflict.b],
          description: conflict.description,
          suggestion: conflict.suggestion,
        })
      }
    }

    return conflicts
  },

  async getIngredientInfo(name: string): Promise<IngredientInfo | null> {
    const record = await db.ingredientKB.findFirst({
      where: { name: { contains: name, mode: "insensitive" } },
    })
    if (!record) return null
    return { name: record.name, category: record.category, caution: record.caution }
  },
}
