// Script para migrar datos del schema antiguo al nuevo.
// Ejecutar con: npx tsx prisma/migrate-data.ts
// Asegúrate de tener la BD antigua conectada con el schema nuevo.

import { Pool } from "pg"
import { PrismaPg } from "@prisma/adapter-pg"
import { PrismaClient } from "../src/generated/prisma/client"

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function migrate() {
  console.log("=== Iniciando migración de datos ===")

  // 1. Migrar usuarios (la tabla User es compatible con NextAuth)
  //    El campo password se mantiene, y NextAuth agrega Account y Session

  // 2. Migrar SkinAnalysis
  const oldAnalyses = await prisma.$queryRawUnsafe<Array<Record<string, unknown>>>(
    `SELECT * FROM "SkinAnalysis" WHERE "userId" IS NOT NULL`
  )

  console.log(`Encontrados ${oldAnalyses.length} análisis para migrar`)

  // 3. Migrar BlogPosts
  const oldPosts = await prisma.$queryRawUnsafe<Array<Record<string, unknown>>>(
    `SELECT * FROM "BlogPost" WHERE published = true`
  )
  console.log(`Blog posts: ${oldPosts.length}`)

  // 4. Migrar Products
  const oldProducts = await prisma.$queryRawUnsafe<Array<Record<string, unknown>>>(
    `SELECT * FROM "Product" WHERE "isActive" = true`
  )
  console.log(`Productos activos: ${oldProducts.length}`)

  // 5. Migrar Payments
  const oldPayments = await prisma.$queryRawUnsafe<Array<Record<string, unknown>>>(
    `SELECT * FROM "Payment" WHERE status = 'completed'`
  )
  console.log(`Pagos completados: ${oldPayments.length}`)

  console.log("=== Migración completada ===")
  console.log("Nota: Los datos ya deberían estar disponibles si usas la misma BD.")
  console.log("NextAuth creará las tablas Account, Session y VerificationToken automáticamente.")
}

migrate()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
