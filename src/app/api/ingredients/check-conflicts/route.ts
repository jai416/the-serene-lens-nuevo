import { NextRequest } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { IngredientService } from "@/lib/services/ingredient.service"
import { ok, unauthorized, error, serverError } from "@/lib/api-response"
import { validateCsrf } from "@/lib/csrf-middleware"

export async function POST(req: NextRequest) {
  try {
    if (!validateCsrf(req)) return error("CSRF token inválido", 403)
    const session = await getServerSession(authOptions)
    if (!session?.user) return unauthorized()

    const { ingredients, savedProductIngredients } = await req.json()
    if (!ingredients) return error("ingredients es requerido")

    const conflicts = await IngredientService.detectConflicts(
      ingredients,
      Array.isArray(savedProductIngredients) ? savedProductIngredients : []
    )

    return ok({ conflicts })
  } catch (e) {
    return serverError(e)
  }
}
