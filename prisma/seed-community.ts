import "dotenv/config"
import { Pool } from "pg"
import { PrismaPg } from "@prisma/adapter-pg"
import { PrismaClient } from "../src/generated/prisma/client"

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const db = new PrismaClient({ adapter })

const GROUPS = [
  { name: "Piel Grasa", slug: "grasa", description: "Tips, productos y rutinas para controlar el brillo y los poros. Comparte tu experiencia con piel grasa." },
  { name: "Piel Seca", slug: "seca", description: "Hidratación profunda y nutrición para pieles secas. Descubre productos y rutinas que funcionan." },
  { name: "Piel Mixta", slug: "mixta", description: "El equilibrio perfecto entre zona T grasa y mejillas secas. Rutinas para piel mixta." },
  { name: "Piel Sensible", slug: "sensible", description: "Cuidado suave para pieles que reaccionan fácilmente. Ingredientes calmantes y rutinas seguras." },
  { name: "Piel Normal", slug: "normal", description: "Mantenimiento y prevención para piel equilibrada. Conserva tu piel saludable." },
  { name: "General", slug: "general", description: "Conversaciones generales sobre cuidado facial, tendencias y novedades." },
]

const BADGES = [
  { slug: "first-analysis", name: "Primer Análisis", description: "Completaste tu primer análisis de piel", icon: "🔬", criteria: { type: "first_analysis", threshold: 1 } },
  { slug: "streak-3", name: "Racha Inicial", description: "3 días seguidos de registro en tu diario", icon: "⭐", criteria: { type: "diary_days", threshold: 3 } },
  { slug: "streak-7", name: "Constante", description: "7 días seguidos registrando en tu diario de piel", icon: "🔥", criteria: { type: "diary_days", threshold: 7 } },
  { slug: "streak-30", name: "Dedicado", description: "30 días seguidos registrando en tu diario de piel", icon: "💪", criteria: { type: "diary_days", threshold: 30 } },
  { slug: "analyses-5", name: "Explorador", description: "Realizaste 5 análisis de piel", icon: "📊", criteria: { type: "analyses", threshold: 5 } },
  { slug: "analyses-10", name: "Experto", description: "Realizaste 10 análisis de piel", icon: "🏅", criteria: { type: "analyses", threshold: 10 } },
  { slug: "analyses-25", name: "Maestro", description: "Realizaste 25 análisis de piel", icon: "👑", criteria: { type: "analyses", threshold: 25 } },
  { slug: "hydration-improvement", name: "Hidratación Mejorada", description: "Mejoraste tu hidratación en 2 análisis consecutivos", icon: "💧", criteria: { type: "hydration_improvement", threshold: 1 } },
]

async function main() {
  console.log("Seeding community groups and badges...")

  // Get an admin user to be the creator of the groups
  const admin = await db.user.findFirst({ where: { role: "ADMIN" } })
  if (!admin) {
    console.log("No admin found — creating groups without creator reference")
  }

  for (const group of GROUPS) {
    const existing = await db.communityGroup.findUnique({ where: { slug: group.slug } })
    if (existing) {
      await db.communityGroup.update({
        where: { slug: group.slug },
        data: { name: group.name, description: group.description },
      })
      console.log(`  Updated group: ${group.slug}`)
    } else {
      await db.communityGroup.create({
        data: {
          name: group.name,
          slug: group.slug,
          description: group.description,
          createdById: admin?.id || "seed",
        },
      })
      console.log(`  Created group: ${group.slug}`)
    }
  }

  for (const badge of BADGES) {
    await db.badge.upsert({
      where: { slug: badge.slug },
      update: { name: badge.name, description: badge.description, icon: badge.icon, criteria: JSON.stringify(badge.criteria) },
      create: { slug: badge.slug, name: badge.name, description: badge.description, icon: badge.icon, criteria: JSON.stringify(badge.criteria) },
    })
    console.log(`  Upserted badge: ${badge.slug}`)
  }

  console.log("Done! Community groups and badges seeded.")
}

main()
  .catch((e) => {
    console.error("Seed error:", e)
    process.exit(1)
  })
  .finally(() => db.$disconnect())
