import { logger } from "@/lib/logger"

export interface QueueJob<T = unknown> {
  id: string
  data: T
  status: "pending" | "processing" | "completed" | "failed"
  attempts: number
  maxAttempts: number
  createdAt: Date
  processedAt?: Date
  completedAt?: Date
  error?: string
}

type QueueHandler<T> = (data: T) => Promise<void>

class AnalysisQueue {
  private jobs: Map<string, QueueJob> = new Map()
  private handlers: Map<string, QueueHandler<unknown>> = new Map()
  private processing = false
  private interval: ReturnType<typeof setInterval> | null = null

  registerHandler<T>(name: string, handler: QueueHandler<T>) {
    this.handlers.set(name, handler as QueueHandler<unknown>)
  }

  async add<T>(name: string, data: T, options?: { maxAttempts?: number }): Promise<string> {
    const id = `job_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
    const job: QueueJob<T> = {
      id,
      data,
      status: "pending",
      attempts: 0,
      maxAttempts: options?.maxAttempts ?? 3,
      createdAt: new Date(),
    }
    this.jobs.set(id, job)
    logger.info("Job queued", { jobId: id, name })

    this.processNext(name)
    return id
  }

  getJob(id: string): QueueJob | undefined {
    return this.jobs.get(id)
  }

  private async processNext(name: string) {
    if (this.processing) return
    this.processing = true

    try {
      const handler = this.handlers.get(name)
      if (!handler) return

      const job = Array.from(this.jobs.values()).find(
        (j) => j.status === "pending" && j.attempts < j.maxAttempts
      )
      if (!job) return

      job.status = "processing"
      job.attempts++
      job.processedAt = new Date()

      try {
        await handler(job.data)
        job.status = "completed"
        job.completedAt = new Date()
        logger.info("Job completed", { jobId: job.id, duration: Date.now() - job.processedAt.getTime() })
      } catch (e) {
        job.error = e instanceof Error ? e.message : "Unknown error"
        if (job.attempts >= job.maxAttempts) {
          job.status = "failed"
          logger.error("Job failed permanently", { jobId: job.id, error: job.error, attempts: job.attempts })
        } else {
          job.status = "pending"
          logger.warn("Job failed, will retry", { jobId: job.id, error: job.error, attempt: job.attempts })
          setTimeout(() => this.processNext(name), 1000 * Math.pow(2, job.attempts - 1))
        }
      }
    } finally {
      this.processing = false
    }
  }

  startPolling(name: string, intervalMs = 5000) {
    if (this.interval) return
    this.interval = setInterval(() => this.processNext(name), intervalMs)
  }

  stopPolling() {
    if (this.interval) {
      clearInterval(this.interval)
      this.interval = null
    }
  }

  getStats() {
    const jobs = Array.from(this.jobs.values())
    return {
      total: jobs.length,
      pending: jobs.filter((j) => j.status === "pending").length,
      processing: jobs.filter((j) => j.status === "processing").length,
      completed: jobs.filter((j) => j.status === "completed").length,
      failed: jobs.filter((j) => j.status === "failed").length,
    }
  }

  cleanup(maxAgeMs = 60 * 60 * 1000) {
    const cutoff = new Date(Date.now() - maxAgeMs)
    for (const [id, job] of this.jobs) {
      if (
        (job.status === "completed" || job.status === "failed") &&
        job.createdAt < cutoff
      ) {
        this.jobs.delete(id)
      }
    }
  }
}

export const analysisQueue = new AnalysisQueue()

if (process.env.NODE_ENV === "production") {
  analysisQueue.startPolling("analysis", 5000)
  setInterval(() => analysisQueue.cleanup(), 60 * 60 * 1000)
}
