import { logger } from "@/lib/logger"
import { db } from "@/lib/db"
import type { Prisma } from "@/generated/prisma/client"

const DEFAULT_FROM_NAME = "The Serene Lens"
const DEFAULT_FROM_EMAIL = "noreply@theserenelens.com"

type EmailProvider = "mailjet" | "sendgrid" | "brevo" | "resend" | null

function getProvider(): EmailProvider {
  if (process.env.MAILJET_API_KEY && process.env.MAILJET_API_SECRET) return "mailjet"
  if (process.env.SENDGRID_API_KEY) return "sendgrid"
  if (process.env.BREVO_API_KEY) return "brevo"
  if (process.env.RESEND_API_KEY) return "resend"
  return null
}

function getMailjetCreds(): { apiKey: string; apiSecret: string } | null {
  const apiKey = process.env.MAILJET_API_KEY
  const apiSecret = process.env.MAILJET_API_SECRET
  if (apiKey && apiSecret) return { apiKey, apiSecret }
  return null
}

function getFromAddress(): string {
  const provider = getProvider()
  if (provider === "resend" && process.env.RESEND_DOMAIN_VERIFIED !== "true") {
    return "The Serene Lens <onboarding@resend.dev>"
  }
  return `${DEFAULT_FROM_NAME} <${DEFAULT_FROM_EMAIL}>`
}

export interface SendEmailOptions {
  to: string | string[]
  subject: string
  html: string
}

export async function sendEmail(options: SendEmailOptions): Promise<{ id?: string; error?: string }> {
  const provider = getProvider()

  if (!provider) {
    logger.warn("No email provider configured", { to: options.to, subject: options.subject })
    return { error: "No hay proveedor de email configurado. Agrega MAILJET_API_KEY y MAILJET_API_SECRET." }
  }

  if (provider === "mailjet") return sendViaMailjet(options)
  if (provider === "sendgrid") return sendViaSendGrid(options)
  if (provider === "brevo") return sendViaBrevo(options)
  return sendViaResend(options)
}

async function sendViaMailjet(options: SendEmailOptions): Promise<{ id?: string; error?: string }> {
  const creds = getMailjetCreds()
  if (!creds) return { error: "Mailjet credentials missing" }

  const to = Array.isArray(options.to) ? options.to : [options.to]
  try {
    const res = await fetch("https://api.mailjet.com/v3.1/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${Buffer.from(`${creds.apiKey}:${creds.apiSecret}`).toString("base64")}`,
      },
      body: JSON.stringify({
        Messages: [
          {
            From: { Email: DEFAULT_FROM_EMAIL, Name: DEFAULT_FROM_NAME },
            To: to.map((email) => ({ Email: email })),
            Subject: options.subject,
            HTMLPart: options.html,
          },
        ],
      }),
    })

    const data = await res.json()
    if (!res.ok) {
      const msg = data?.Messages?.[0]?.Errors?.[0]?.ErrorMessage || JSON.stringify(data)
      logger.error("Mailjet send error", { status: res.status, error: msg })
      return { error: msg }
    }

    const messageId = data?.Messages?.[0]?.Status === "sent" ? data.Messages[0].To?.[0]?.MessageID : undefined
    return { id: messageId || `mj-${Date.now()}` }
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error"
    logger.error("Mailjet send exception", { error: msg })
    return { error: msg }
  }
}

async function sendViaSendGrid(options: SendEmailOptions): Promise<{ id?: string; error?: string }> {
  const apiKey = process.env.SENDGRID_API_KEY
  if (!apiKey) return { error: "SendGrid API key missing" }

  const to = Array.isArray(options.to) ? options.to : [options.to]
  try {
    const res = await fetch("https://api.sendgrid.com/v3/mail/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        personalizations: [{ to: to.map((email) => ({ email })) }],
        from: { email: DEFAULT_FROM_EMAIL, name: DEFAULT_FROM_NAME },
        subject: options.subject,
        content: [{ type: "text/html", value: options.html }],
      }),
    })

    if (!res.ok) {
      const body = await res.text()
      logger.error("SendGrid send error", { status: res.status, error: body })
      return { error: `SendGrid error ${res.status}` }
    }

    const messageId = res.headers.get("x-message-id") || `sg-${Date.now()}`
    return { id: messageId }
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error"
    logger.error("SendGrid send exception", { error: msg })
    return { error: msg }
  }
}

async function sendViaBrevo(options: SendEmailOptions): Promise<{ id?: string; error?: string }> {
  const apiKey = process.env.BREVO_API_KEY
  if (!apiKey) return { error: "Brevo API key missing" }

  const to = Array.isArray(options.to) ? options.to : [options.to]
  try {
    const res = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": apiKey,
        accept: "application/json",
      },
      body: JSON.stringify({
        sender: { name: DEFAULT_FROM_NAME, email: DEFAULT_FROM_EMAIL },
        to: to.map((email) => ({ email })),
        subject: options.subject,
        htmlContent: options.html,
      }),
    })

    const data = await res.json()
    if (!res.ok) {
      const msg = data.message || JSON.stringify(data)
      logger.error("Brevo send error", { status: res.status, error: msg })
      return { error: msg }
    }
    return { id: data.messageId }
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error"
    logger.error("Brevo send exception", { error: msg })
    return { error: msg }
  }
}

async function sendViaResend(options: SendEmailOptions): Promise<{ id?: string; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) return { error: "Resend API key missing" }

  try {
    const { Resend } = await import("resend")
    const resend = new Resend(apiKey)
    const result = await resend.emails.send({
      from: getFromAddress(),
      to: options.to,
      subject: options.subject,
      html: options.html,
    })
    if (result.error) {
      logger.error("Resend send error", { error: result.error })
      return { error: result.error.message }
    }
    return { id: result.data?.id }
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error"
    logger.error("Resend send exception", { error: msg })
    return { error: msg }
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
  const provider = getProvider()
  const errors: string[] = []

  if (!provider) {
    logger.warn("Bulk email skipped - no provider configured", {
      subject: options.subject,
      recipientCount: options.recipients.length,
    })
    return { sent: 0, failed: options.recipients.length, errors: ["No hay proveedor de email configurado. Agrega MAILJET_API_KEY y MAILJET_API_SECRET."] }
  }

  if (provider === "mailjet") return sendBulkViaMailjet(options, errors)
  if (provider === "sendgrid") return sendBulkViaSendGrid(options, errors)
  if (provider === "brevo") return sendBulkViaBrevo(options, errors)
  return sendBulkViaResend(options, errors)
}

async function sendBulkViaMailjet(options: SendBulkEmailOptions, errors: string[]): Promise<{
  sent: number
  failed: number
  errors: string[]
}> {
  const creds = getMailjetCreds()
  if (!creds) return { sent: 0, failed: options.recipients.length, errors: ["Mailjet credentials missing"] }

  let sent = 0
  let failed = 0

  const BATCH_SIZE = 50
  const batches = []
  for (let i = 0; i < options.recipients.length; i += BATCH_SIZE) {
    batches.push(options.recipients.slice(i, i + BATCH_SIZE))
  }

  for (const batch of batches) {
    try {
      const messages = batch.map((r) => ({
        From: { Email: DEFAULT_FROM_EMAIL, Name: DEFAULT_FROM_NAME },
        To: [{ Email: r.email, Name: r.name || "usuario" }],
        Subject: options.subject,
        HTMLPart: options.html.replace(/\{name\}/g, r.name || "usuario"),
      }))

      const res = await fetch("https://api.mailjet.com/v3.1/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Basic ${Buffer.from(`${creds.apiKey}:${creds.apiSecret}`).toString("base64")}`,
        },
        body: JSON.stringify({ Messages: messages }),
      })

      const data = await res.json()
      if (!res.ok) {
        const errMsg = data?.Messages?.[0]?.Errors?.[0]?.ErrorMessage || JSON.stringify(data)
        errors.push(errMsg)
        logger.error("Mailjet batch error", { error: errMsg, batchSize: batch.length })
        failed += batch.length
      } else {
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
      const msg = error instanceof Error ? error.message : "Unknown error"
      logger.error("Mailjet batch exception", { error: msg, batchSize: batch.length })
      errors.push(msg)
      failed += batch.length
    }
  }

  logger.info("Mailjet bulk email completed", { sent, failed, subject: options.subject })
  return { sent, failed, errors }
}

async function sendBulkViaSendGrid(options: SendBulkEmailOptions, errors: string[]): Promise<{
  sent: number
  failed: number
  errors: string[]
}> {
  const apiKey = process.env.SENDGRID_API_KEY
  if (!apiKey) return { sent: 0, failed: options.recipients.length, errors: ["SendGrid API key missing"] }

  let sent = 0
  let failed = 0

  const BATCH_SIZE = 100
  const batches = []
  for (let i = 0; i < options.recipients.length; i += BATCH_SIZE) {
    batches.push(options.recipients.slice(i, i + BATCH_SIZE))
  }

  for (const batch of batches) {
    try {
      const personalizations = batch.map((r) => ({
        to: [{ email: r.email }],
        substitutions: { name: r.name || "usuario" },
      }))

      const htmlContent = options.html.replace(/\{name\}/g, "{{name}}")

      const res = await fetch("https://api.sendgrid.com/v3/mail/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          personalizations,
          from: { email: DEFAULT_FROM_EMAIL, name: DEFAULT_FROM_NAME },
          subject: options.subject,
          content: [{ type: "text/html", value: htmlContent }],
        }),
      })

      if (!res.ok) {
        const body = await res.text()
        errors.push(`SendGrid ${res.status}: ${body}`)
        logger.error("SendGrid batch error", { status: res.status, error: body, batchSize: batch.length })
        failed += batch.length
      } else {
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
      const msg = error instanceof Error ? error.message : "Unknown error"
      logger.error("SendGrid batch exception", { error: msg, batchSize: batch.length })
      errors.push(msg)
      failed += batch.length
    }
  }

  logger.info("SendGrid bulk email completed", { sent, failed, subject: options.subject })
  return { sent, failed, errors }
}

async function sendBulkViaBrevo(options: SendBulkEmailOptions, errors: string[]): Promise<{
  sent: number
  failed: number
  errors: string[]
}> {
  const apiKey = process.env.BREVO_API_KEY
  if (!apiKey) return { sent: 0, failed: options.recipients.length, errors: ["Brevo API key missing"] }

  let sent = 0
  let failed = 0

  const BATCH_SIZE = 50
  const batches = []
  for (let i = 0; i < options.recipients.length; i += BATCH_SIZE) {
    batches.push(options.recipients.slice(i, i + BATCH_SIZE))
  }

  for (const batch of batches) {
    try {
      const res = await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "api-key": apiKey,
          accept: "application/json",
        },
        body: JSON.stringify({
          sender: { name: DEFAULT_FROM_NAME, email: DEFAULT_FROM_EMAIL },
          to: batch.map((r) => ({ email: r.email, name: r.name || "usuario" })),
          subject: options.subject,
          htmlContent: options.html.replace(/\{name\}/g, "{NAME}"),
          params: Object.fromEntries(batch.map((r, i) => [`NAME_${i}`, r.name || "usuario"])),
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        const msg = data.message || JSON.stringify(data)
        errors.push(msg)
        logger.error("Brevo batch error", { error: msg, batchSize: batch.length })
        failed += batch.length
      } else {
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
      const msg = error instanceof Error ? error.message : "Unknown error"
      logger.error("Brevo batch exception", { error: msg, batchSize: batch.length })
      errors.push(msg)
      failed += batch.length
    }
  }

  logger.info("Brevo bulk email completed", { sent, failed, subject: options.subject })
  return { sent, failed, errors }
}

async function sendBulkViaResend(options: SendBulkEmailOptions, errors: string[]): Promise<{
  sent: number
  failed: number
  errors: string[]
}> {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) return { sent: 0, failed: options.recipients.length, errors: ["Resend API key missing"] }

  let sent = 0
  let failed = 0

  const { Resend } = await import("resend")
  const resend = new Resend(apiKey)

  const BATCH_SIZE = 100
  const batches = []
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
      const msg = error instanceof Error ? error.message : "Unknown error"
      logger.error("Resend batch exception", { error: msg, batchSize: batch.length })
      errors.push(msg)
      failed += batch.length
    }
  }

  logger.info("Resend bulk email completed", { sent, failed, subject: options.subject })
  return { sent, failed, errors }
}

export async function getRecipients(segment: string): Promise<{ email: string; name?: string }[]> {
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
    case "new": {
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      where = { createdAt: { gte: thirtyDaysAgo } }
      break
    }
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
