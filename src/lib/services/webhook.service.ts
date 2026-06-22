import { db } from "@/lib/db"

export async function recordWebhookEvent(provider: string, eventType: string, payload: unknown): Promise<string> {
  const event = await db.webhookEvent.create({
    data: {
      provider,
      eventType,
      payload: JSON.stringify(payload),
    },
  })
  return event.id
}

export async function markWebhookProcessed(id: string): Promise<void> {
  await db.webhookEvent.update({
    where: { id },
    data: { processedAt: new Date() },
  })
}

export async function markWebhookFailed(id: string, error: string): Promise<void> {
  const event = await db.webhookEvent.findUnique({ where: { id } })
  if (!event) return
  await db.webhookEvent.update({
    where: { id },
    data: {
      attempts: event.attempts + 1,
      lastAttempt: new Date(),
      error,
    },
  })
}

export async function retryFailedWebhooks(maxAttempts = 5): Promise<number> {
  const pendingEvents = await db.webhookEvent.findMany({
    where: {
      processedAt: null,
      attempts: { lt: maxAttempts },
    },
  })

  let retried = 0
  for (const event of pendingEvents) {
    try {
      const { processWebhookByProvider } = await import("./webhook-processor")
      await processWebhookByProvider(event)
      await markWebhookProcessed(event.id)
      retried++
    } catch (err) {
      await markWebhookFailed(event.id, err instanceof Error ? err.message : "Unknown error")
    }
  }
  return retried
}
