import { PrismaClient } from "@/generated/prisma/client"

const db = new PrismaClient()

const CATEGORY_IMAGES: Record<string, string[]> = {
  limpiadores: ["/images/products/product-01.jpg", "/images/products/product-02.jpg"],
  serums: ["/images/products/product-03.jpg", "/images/products/product-04.jpg"],
  hidratantes: ["/images/products/product-05.jpg", "/images/products/product-06.jpg"],
  "proteccion-solar": ["/images/products/product-07.jpg", "/images/products/product-08.jpg"],
  contornos: ["/images/products/product-09.jpg", "/images/products/product-10.jpg"],
  exfoliantes: ["/images/products/product-11.jpg", "/images/products/product-12.jpg"],
  mascarillas: ["/images/products/product-13.jpg", "/images/products/product-14.jpg"],
  aceites: ["/images/products/product-15.jpg", "/images/products/product-16.jpg"],
}

async function main() {
  const catCounters: Record<string, number> = {}
  const products = await db.product.findMany()
  console.log(`Found ${products.length} products`)

  let updated = 0
  for (const product of products) {
    const images = CATEGORY_IMAGES[product.category]
    if (!images || images.length === 0) continue
    if (!catCounters[product.category]) catCounters[product.category] = 0
    const idx = catCounters[product.category] % images.length
    catCounters[product.category]++
    const newImage = images[idx]

    if (product.image !== newImage) {
      await db.product.update({
        where: { id: product.id },
        data: { image: newImage },
      })
      updated++
      console.log(`  [${product.category}] ${product.slug} -> ${newImage}`)
    }
  }
  console.log(`\nUpdated ${updated} products`)
  await db.$disconnect()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
