import { z } from "zod"
import { logger } from "@/lib/logger"
import { db } from "@/lib/db"

const FROM = "The Serene Lens <noreply@theserenelens.com>"

let resendClient: any = null

async function getResend() {
  if (resendClient) return resendClient
  if (!process.env.RESEND_API_KEY) {
    logger.warn("RESEND_API_KEY not set, emails will be logged to console")
    return null
  }
  const { Resend } = await import("resend")
  resendClient = new Resend(process.env.RESEND_API_KEY)
  return resendClient
}

export interface SendEmailOptions {
  to: string | string[]
  subject: string
  html: string
}

export async function sendEmail(options: SendEmailOptions): Promise<{ id?: string; error?: string }> {
  const resend = await getResend()

  if (!resend) {
    logger.info("Email (no API key)", { to: options.to, subject: options.subject })
    return { id: "console-log" }
  }

  try {
    const result = await resend.emails.send({
      from: FROM,
      to: options.to,
      subject: options.subject,
      html: options.html,
    })

    if (result.error) {
      logger.error("Email send error", { error: result.error })
      return { error: result.error.message }
    }

    return { id: result.data?.id }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error"
    logger.error("Email send exception", { error: message })
    return { error: message }
  }
}

export interface SendBulkEmailOptions {
  subject: string
  html: string
  segment: string
  recipients: { email: string; name?: string }[]
}

export async function sendBulkEmail(options: SendBulkEmailOptions): Promise<{
  sent: number
  failed: number
  errors: string[]
}> {
  const resend = await getResend()
  const errors: string[] = []
  let sent = 0
  let failed = 0

  if (!resend) {
    logger.info("Bulk email (no API key)", {
      subject: options.subject,
      recipientCount: options.recipients.length,
    })
    return { sent: options.recipients.length, failed: 0, errors: [] }
  }

  // Resend batch limit: 100 per call
  const BATCH_SIZE = 100
  const batches: { email: string; name?: string }[][] = []
  for (let i = 0; i < options.recipients.length; i += BATCH_SIZE) {
    batches.push(options.recipients.slice(i, i + BATCH_SIZE))
  }

  for (const batch of batches) {
    const emails = batch.map((r) => ({
      from: FROM,
      to: r.email,
      subject: options.subject,
      html: options.html,
    }))

    try {
      const result = await resend.batch.send(emails)

      if (result.error) {
        errors.push(result.error.message)
        failed += batch.length
      } else {
        // Log each email
        for (const r of batch) {
          await db.emailLog.create({
            data: {
              subject: options.subject,
              body: options.html,
              recipient: r.email,
              segment: options.segment,
              status: "sent",
            },
          })
        }
        sent += batch.length
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error"
      errors.push(message)
      failed += batch.length
    }
  }

  logger.info("Bulk email completed", { sent, failed, subject: options.subject })
  return { sent, failed, errors }
}

export async function getRecipients(segment: string): Promise<{ email: string; name?: string }[]> {
  // Get unsubscribed emails
  const unsubscribed = await db.unsubscribe.findMany({
    select: { email: true },
  })
  const unsubscribedSet = new Set(unsubscribed.map((u) => u.email))

  let where: any = {}

  switch (segment) {
    case "all":
      where = {}
      break
    case "free":
      where = { plan: "FREE" }
      break
    case "premium":
      where = { plan: "PREMIUM" }
      break
    case "pro":
      where = { plan: "PRO" }
      break
    case "active":
      where = { analysisUsed: { gt: 0 } }
      break
    case "inactive":
      where = { analysisUsed: 0 }
      break
    case "new":
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      where = { createdAt: { gte: thirtyDaysAgo } }
      break
    default:
      where = {}
  }

  const users = await db.user.findMany({
    where,
    select: { email: true, name: true },
  })

  return users
    .filter((u) => !unsubscribedSet.has(u.email))
    .map((u) => ({ email: u.email, name: u.name ?? undefined }))
}

export async function getRecipientCounts(): Promise<Record<string, number>> {
  const unsubscribed = await db.unsubscribe.findMany({
    select: { email: true },
  })
  const unsubscribedSet = new Set(unsubscribed.map((u) => u.email))

  const allUsers = await db.user.findMany({
    select: { email: true, plan: true, analysisUsed: true, createdAt: true },
  })

  const activeUsers = allUsers.filter((u) => !unsubscribedSet.has(u.email))
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  return {
    all: activeUsers.length,
    free: activeUsers.filter((u) => u.plan === "FREE").length,
    premium: activeUsers.filter((u) => u.plan === "PREMIUM").length,
    pro: activeUsers.filter((u) => u.plan === "PRO").length,
    active: activeUsers.filter((u) => u.analysisUsed > 0).length,
    inactive: activeUsers.filter((u) => u.analysisUsed === 0).length,
    new: activeUsers.filter((u) => u.createdAt >= thirtyDaysAgo).length,
  }
}
