import { Prisma } from "@/generated/prisma/client"
import { error, unauthorized } from "@/lib/api-response"
import { NextResponse } from "next/server"

export function handlePrismaError(e: unknown): NextResponse | null {
  if (e instanceof Prisma.PrismaClientKnownRequestError) {
    if (e.code === "P2003") {
      return unauthorized("Tu sesión expiró. Cierra sesión y vuelve a iniciarla.")
    }
    if (e.code === "P2025") {
      return error("Registro no encontrado", 404)
    }
    if (e.code === "P2002") {
      return error("Ya existe un registro con esos datos", 409)
    }
  }
  return null
}
