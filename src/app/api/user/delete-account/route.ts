import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { ok, unauthorized, serverError } from "@/lib/api-response"

export async function DELETE() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return unauthorized()
    }

    const userId = session.user.id

    const analyses = await db.skinAnalysis.findMany({
      where: { userId },
      select: { imageUrl: true },
    })

    const imageUrls = analyses
      .map((a) => a.imageUrl)
      .filter((url): url is string => !!url && url.startsWith("http"))

    if (imageUrls.length > 0) {
      const supabaseUrl = process.env.SUPABASE_URL
      const supabaseKey = process.env.SUPABASE_SERVICE_KEY
      if (supabaseUrl && supabaseKey) {
        try {
          const { createClient } = await import("@supabase/supabase-js")
          const supabase = createClient(supabaseUrl, supabaseKey)
          const paths = imageUrls.map((url) => {
            const m = url.match(/\/storage\/v1\/object\/public\/[^/]+\/(.+)/)
            return m ? m[1] : null
          }).filter((p): p is string => !!p)
          if (paths.length > 0) {
            await supabase.storage.from("user-photos").remove(paths)
          }
        } catch {
          // storage cleanup is best-effort
        }
      }
    }

    await db.skinDiary.deleteMany({ where: { userId } })
    await db.userChallenge.deleteMany({ where: { userId } })
    await db.communityPost.deleteMany({ where: { userId } })
    await db.comment.deleteMany({ where: { userId } })
    await db.skinAnalysis.deleteMany({ where: { userId } })
    await db.purchasePack.deleteMany({ where: { userId } })
    await db.payment.deleteMany({ where: { userId } })
    await db.subscription.deleteMany({ where: { userId } })
    await db.account.deleteMany({ where: { userId } })
    await db.session.deleteMany({ where: { userId } })
    await db.usageTracking.deleteMany({ where: { userId } })
    await db.userEvolution.deleteMany({ where: { userId } })
    await db.user.delete({ where: { id: userId } })

    return ok({ deleted: true })
  } catch (e) {
    return serverError(e)
  }
}
