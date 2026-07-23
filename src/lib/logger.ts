const isDev = process.env.NODE_ENV === "development"
const MIN_LEVEL = isDev ? 0 : 1

type LogLevel = "debug" | "info" | "warn" | "error"

const LEVEL_ORDER: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
}

const g = globalThis as { __correlationStore?: { id: string } }

export function getCorrelationId(): string {
  if (typeof globalThis !== "undefined") {
    const store = g.__correlationStore
    if (store?.id) return store.id
  }
  return ""
}

export function setCorrelationId(id: string): void {
  if (typeof globalThis !== "undefined") {
    g.__correlationStore = { id }
  }
}

export function generateCorrelationId(): string {
  return globalThis.crypto.randomUUID()
}

function formatLog(level: LogLevel, msg: string, meta?: Record<string, unknown>) {
  if (LEVEL_ORDER[level] < MIN_LEVEL) return

  const timestamp = new Date().toISOString()
  const correlationId = getCorrelationId()

  const logEntry: Record<string, unknown> = {
    timestamp,
    level: level.toUpperCase(),
    message: msg,
    service: "the-serene-lens",
    correlationId: correlationId || undefined,
    ...meta,
  }

  const output = JSON.stringify(logEntry)

  switch (level) {
    case "error":
      console.error(output)
      break
    case "warn":
      console.warn(output)
      break
    case "debug":
      console.debug(output)
      break
    default:
      console.log(output)
  }
}

export const logger = {
  debug: (msg: string, meta?: Record<string, unknown>) => formatLog("debug", msg, meta),
  info: (msg: string, meta?: Record<string, unknown>) => formatLog("info", msg, meta),
  warn: (msg: string, meta?: Record<string, unknown>) => formatLog("warn", msg, meta),
  error: (msg: string, meta?: Record<string, unknown>) => formatLog("error", msg, meta),

  child: (context: Record<string, unknown>) => ({
    debug: (msg: string, meta?: Record<string, unknown>) => formatLog("debug", msg, { ...context, ...meta }),
    info: (msg: string, meta?: Record<string, unknown>) => formatLog("info", msg, { ...context, ...meta }),
    warn: (msg: string, meta?: Record<string, unknown>) => formatLog("warn", msg, { ...context, ...meta }),
    error: (msg: string, meta?: Record<string, unknown>) => formatLog("error", msg, { ...context, ...meta }),
  }),

  http: (method: string, path: string, statusCode: number, durationMs: number, meta?: Record<string, unknown>) => {
    formatLog(statusCode >= 500 ? "error" : statusCode >= 400 ? "warn" : "info", "HTTP request", {
      method,
      path,
      statusCode,
      durationMs,
      ...meta,
    })
  },

  db: (operation: string, durationMs: number, meta?: Record<string, unknown>) => {
    formatLog(durationMs > 1000 ? "warn" : "debug", "DB query", {
      operation,
      durationMs,
      ...meta,
    })
  },

  auth: (event: string, meta?: Record<string, unknown>) => {
    formatLog("info", "Auth event", { event, ...meta })
  },

  payment: (event: string, meta?: Record<string, unknown>) => {
    formatLog("info", "Payment event", { event, ...meta })
  },
}

export function createRequestLogger(correlationId: string) {
  setCorrelationId(correlationId)
  return logger
}
