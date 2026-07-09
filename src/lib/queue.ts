import { db } from "@/lib/db"
import { logger } from "@/lib/logger"
import { analyzeSkinWithGroq } from "@/lib/groq"

const THROTTLE_MS = 2500
const POLL_INTERVAL_MS = 3000

class AnalysisQueue {
  private processing = false
  private interval: ReturnType<typeof setInterval> | null = null

  async add(userId: string, files: File[], body: Record<string, string>): Promise<{ jobId: string; position: number }> {
    const photosBase64 = await Promise.all(
      files.map(async (f) => {
        const buf = Buffer.from(await f.arrayBuffer())
        return buf.toString("base64")
      })
    )

    const job = await db.analysisJob.create({
      data: {
        userId,
        status: "PENDING",
        photos: JSON.stringify(photosBase64),
        body: JSON.stringify(body),
      },
    })

    const pendingBefore = await db.analysisJob.count({
      where: { status: { in: ["PENDING", "PROCESSING"] }, createdAt: { lt: job.createdAt } },
    })

    logger.info("Analysis job queued", { jobId: job.id, userId, position: pendingBefore + 1 })

    return { jobId: job.id, position: pendingBefore + 1 }
  }

  async getStatus(jobId: string): Promise<{ status: string; position: number; result?: unknown }> {
    const job = await db.analysisJob.findUnique({ where: { id: jobId } })
    if (!job) return { status: "NOT_FOUND", position: 0 }

    const pendingBefore = await db.analysisJob.count({
      where: { status: { in: ["PENDING", "PROCESSING"] }, createdAt: { lt: job.createdAt } },
    })

    return {
      status: job.status,
      position: pendingBefore + 1,
      result: job.result ? JSON.parse(job.result) : undefined,
    }
  }

  private async processNext() {
    if (this.processing) return
    this.processing = true

    try {
      const job = await db.analysisJob.findFirst({
        where: { status: "PENDING" },
        orderBy: [{ priority: "desc" }, { createdAt: "asc" }],
      })
      if (!job) return

      await db.analysisJob.update({
        where: { id: job.id },
        data: { status: "PROCESSING", updatedAt: new Date() },
      })

      try {
        const photosBase64: string[] = JSON.parse(job.photos)
        const body: Record<string, string> = job.body ? JSON.parse(job.body) : {}

        const files = await Promise.all(
          photosBase64.map((b64, i) => {
            const buf = Buffer.from(b64, "base64")
            return new File([buf], `photo_${i}.jpg`, { type: "image/jpeg" })
          })
        )

        const result = await analyzeSkinWithGroq(files)

        await db.analysisJob.update({
          where: { id: job.id },
          data: {
            status: "COMPLETED",
            result: JSON.stringify(result),
            updatedAt: new Date(),
          },
        })

        logger.info("Queue job completed", { jobId: job.id, userId: job.userId })
      } catch (e) {
        const errorMsg = e instanceof Error ? e.message : String(e)
        logger.error("Queue job failed", { jobId: job.id, error: errorMsg })

        await db.analysisJob.update({
          where: { id: job.id },
          data: {
            status: "FAILED",
            error: errorMsg,
            updatedAt: new Date(),
          },
        })
      }

      setTimeout(() => this.processNext(), THROTTLE_MS)
    } finally {
      this.processing = false
    }
  }

  startPolling() {
    if (this.interval) return
    this.interval = setInterval(() => this.processNext(), POLL_INTERVAL_MS)
    logger.info("Analysis queue polling started", { intervalMs: POLL_INTERVAL_MS })
  }

  stopPolling() {
    if (this.interval) {
      clearInterval(this.interval)
      this.interval = null
    }
  }

  async getStats() {
    const [pending, processing, completed, failed] = await Promise.all([
      db.analysisJob.count({ where: { status: "PENDING" } }),
      db.analysisJob.count({ where: { status: "PROCESSING" } }),
      db.analysisJob.count({ where: { status: "COMPLETED" } }),
      db.analysisJob.count({ where: { status: "FAILED" } }),
    ])
    return { pending, processing, completed, failed }
  }
}

export const analysisQueue = new AnalysisQueue()

if (process.env.NODE_ENV === "production") {
  analysisQueue.startPolling()
}
