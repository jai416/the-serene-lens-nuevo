import { db } from "@/lib/db"
import { buildEmailSequence, sendEmail } from "./email-sequence"
import { sanitizeHtml } from "@/lib/sanitize"

const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://the-serene-lens-nuevo.onrender.com"

type UserProfile = {
  id: string
  name: string | null
  email: string
  plan: string
  createdAt: Date
  analysisUsed: number
  analysisLimit: number
}

/**
 * Processes email sequences for users with behavior-based segmentation.
 * - FREE users with 0 analyses: send day 0,1,3 (onboarding)
 * - FREE users with 1+ analyses: send day 7,14,21 (conversion)
 * - FREE users inactive 14+ days: send day 21 (re-engagement)
 * - PREMIUM/PRO: skip all emails (already converted)
 */
export async function processEmailSequences(): Promise<{ sent: number; failed: number }> {
  const now = new Date()
  let sent = 0
  let failed = 0

  const users = await db.user.findMany({
    where: {
      role: "USER",
      plan: "FREE",
      createdAt: { gte: new Date(now.getTime() - 30 * 86400000) },
    },
    select: {
      id: true,
      name: true,
      email: true,
      createdAt: true,
      analysisUsed: true,
      analysisLimit: true,
    },
  })

  for (const user of users) {
    const daysSinceRegister = Math.floor(
      (now.getTime() - user.createdAt.getTime()) / 86400000
    )

    const hasAnalyses = user.analysisUsed > 0

    const lastAnalysis = await db.skinAnalysis.findFirst({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      select: { createdAt: true },
    })

    const daysSinceLastActivity = lastAnalysis
      ? Math.floor((now.getTime() - lastAnalysis.createdAt.getTime()) / 86400000)
      : daysSinceRegister

    const sequence = buildEmailSequence(sanitizeHtml(user.name || "usuario"), appUrl)

    const targetEmails = sequence.filter((e) => {
      if (e.day === 0) return true
      if (e.day === 1) return !hasAnalyses
      if (e.day === 3) return !hasAnalyses
      if (e.day === 7) return hasAnalyses
      if (e.day === 14) return hasAnalyses
      if (e.day === 21) return daysSinceLastActivity >= 20
      return false
    }).filter((e) => e.day === daysSinceRegister)

    for (const email of targetEmails) {
      const result = await sendEmail({
        to: user.email,
        subject: email.subject,
        html: email.html,
      })
      if (result) sent++
      else failed++
    }
  }

  return { sent, failed }
}
