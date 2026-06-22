import { NextResponse } from "next/server"
import { generateAndSaveArticle } from "@/lib/services/seo-generator"
import { verifyCronSecret } from "@/lib/cron-auth"

export const dynamic = "force-dynamic"

export async function POST(req: Request) {
  try {
    if (!verifyCronSecret(req)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const article = await generateAndSaveArticle()
    if (!article) {
      return NextResponse.json({ message: "All keywords used", created: 0 })
    }

    return NextResponse.json({ message: "Article generated", slug: article.slug, created: 1 })
  } catch (error) {
    return NextResponse.json({ error: "Failed to generate article" }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({ message: "SEO generator endpoint. Use POST to generate." })
}
