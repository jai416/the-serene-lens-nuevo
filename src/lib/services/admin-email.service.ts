import { z } from "zod"
import { logger } from "@/lib/logger"
import { db } from "@/lib/db"
import type { Prisma } from "@/generated/prisma/client"

const FALLBACK_FROM = "The Serene Lens <onboarding@resend.dev>"
const CUSTOM_FROM = "The Serene Lens <noreply@theserenelens.com>"

let resendClient: any = null

async function getResend() {
  if (!process.env.RESEND_API_KEY) {
    if (resendClient) {
      logger.warn("RESEND_API_KEY removed, clearing cached client")
      resendClient = null
    }
    return null
  }
  if (resendClient) return resendClient
  try {
    const { Resend } = await import("resend")
    resendClient = new Resend(process.env.RESEND_API_KEY)
  } catch {
    logger.error("Failed to import resend module")
    return null
  }
  return resendClient
}

function getFromAddress(): string {
  return process.env.RESEND_DOMAIN_VERIFIED === "true" ? CUSTOM_FROM : FALLBACK_FROM
}

export interface SendEmailOptions {
  to: string | string[]
  subject: string
  html: string
}

export async function sendEmail(options: SendEmailOptions): Promise<{ id?: string; error?: string }> {
  const resend = await getResend()

  if (!resend) {
    logger.warn("Email skipped - RESEND_API_KEY not set", { to: options.to, subject: options.subject })
    return { error: "RESEND_API_KEY no está configurado. Agrega RESEND_API_KEY en las variables de entorno de Render." }
  }

  try {
    const result = await resend.emails.send({
      from: getFromAddress(),
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
    logger.warn("Bulk email skipped - RESEND_API_KEY not set", {
      subject: options.subject,
      recipientCount: options.recipients.length,
    })
    return { sent: 0, failed: options.recipients.length, errors: ["RESEND_API_KEY no está configurado. Los emails no se envían. Agrega RESEND_API_KEY en las variables de entorno de Render."] }
  }

  // Resend batch limit: 100 per call
  const BATCH_SIZE = 100
  const batches: { email: string; name?: string }[][] = []
  for (let i = 0; i < options.recipients.length; i += BATCH_SIZE) {
    batches.push(options.recipients.slice(i, i + BATCH_SIZE))
  }

  for (const batch of batches) {
    const emails = batch.map((r) => ({
      from: getFromAddress(),
      to: r.email,
      subject: options.subject,
      html: options.html.replace(/\{name\}/g, r.name || "usuario"),
    }))

    try {
      const result = await resend.batch.send(emails)

      if (result.error) {
        const msg = result.error.message || JSON.stringify(result.error)
        errors.push(msg)
        logger.error("Resend batch error", { error: msg, batchSize: batch.length })
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
      logger.error("Resend batch exception", { error: message, batchSize: batch.length })
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

  let where: Prisma.UserWhereInput = {}

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
    case "proPlus":
      where = { plan: "PRO_PLUS" }
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
    .filter((u) => u.email && !unsubscribedSet.has(u.email))
    .map((u) => ({ email: u.email!, name: u.name ?? undefined }))
}

export async function getRecipientCounts(): Promise<Record<string, number>> {
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const [all, free, premium, pro, proPlus, active, inactive, newUsers] = await Promise.all([
    db.user.count(),
    db.user.count({ where: { plan: "FREE" } }),
    db.user.count({ where: { plan: "PREMIUM" } }),
    db.user.count({ where: { plan: "PRO" } }),
    db.user.count({ where: { plan: "PRO_PLUS" } }),
    db.user.count({ where: { analysisUsed: { gt: 0 } } }),
    db.user.count({ where: { analysisUsed: 0 } }),
    db.user.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
  ])

  return {
    all,
    free,
    premium,
    pro,
    proPlus,
    active,
    inactive,
    new: newUsers,
  }
}
