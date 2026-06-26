import { generateAndSaveArticle } from "@/lib/services/seo-generator"
import { verifyCronSecret } from "@/lib/cron-auth"
import { ok, error, serverError } from "@/lib/api-response"

export const dynamic = "force-dynamic"

export async function POST(req: Request) {
  try {
    if (!verifyCronSecret(req)) {
      return error("Unauthorized", 401)
    }

    const article = await generateAndSaveArticle()
    if (!article) {
      return ok({ message: "All keywords used", created: 0 })
    }

    return ok({ message: "Article generated", slug: article.slug, created: 1 })
  } catch {
    return serverError()
  }
}

export async function GET() {
  return ok({ message: "SEO generator endpoint. Use POST to generate." })
}
