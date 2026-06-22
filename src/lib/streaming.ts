type StreamEvent = {
  type: "progress" | "complete" | "error"
  stage?: string
  message?: string
  data?: unknown
}

type StreamCallback = (event: StreamEvent) => void

/**
 * AnalysisStream manages Server-Sent Events for real-time analysis progress.
 * Emits progress events as the analysis moves through stages:
 * validating → compressing → analyzing-texture → analyzing-pores → analyzing-tone → building-results → complete
 */
export class AnalysisStream {
  private encoder = new TextEncoder()
  private controller: ReadableStreamDefaultController<Uint8Array> | null = null
  private closed = false
  private heartbeatInterval: ReturnType<typeof setInterval> | null = null

  createStream(): ReadableStream<Uint8Array> {
    return new ReadableStream({
      start: (controller) => {
        this.controller = controller
        this.heartbeatInterval = setInterval(() => {
          if (this.closed || !this.controller) return
          try {
            this.controller.enqueue(this.encoder.encode(": keepalive\n\n"))
          } catch {
            this.stopHeartbeat()
          }
        }, 4000)
      },
      cancel: () => {
        this.closed = true
        this.stopHeartbeat()
        this.controller = null
      },
    })
  }

  sendProgress(stage: string, message: string): void {
    this.send({ type: "progress", stage, message })
  }

  sendComplete(data: unknown): void {
    this.send({ type: "complete", message: "Análisis completado", data })
    this.close()
  }

  sendError(error: string): void {
    this.send({ type: "error", message: error })
    this.close()
  }

  private send(event: StreamEvent): void {
    if (this.closed || !this.controller) return
    try {
      this.controller.enqueue(this.encoder.encode(`data: ${JSON.stringify(event)}\n\n`))
    } catch {
      this.closed = true
    }
  }

  private close(): void {
    if (this.closed) return
    this.closed = true
    this.stopHeartbeat()
    try {
      this.controller?.close()
    } catch {
      // stream already closed
    }
    this.controller = null
  }

  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval)
      this.heartbeatInterval = null
    }
  }
}

/**
 * Creates an async generator that wraps an AnalysisStream for use in API routes.
 * Yields StreamEvents as they are emitted.
 */
export function createStreamGenerator(stream: AnalysisStream): AsyncGenerator<StreamEvent, void, unknown> {
  const events: StreamEvent[] = []
  let resolve: ((value: StreamEvent) => void) | null = null
  let done = false

  const originalSendProgress = stream.sendProgress.bind(stream)
  const originalSendComplete = stream.sendComplete.bind(stream)
  const originalSendError = stream.sendError.bind(stream)

  function emit(event: StreamEvent) {
    if (resolve) {
      resolve(event)
      resolve = null
    } else {
      events.push(event)
    }
  }

  stream.sendProgress = (stage, message) => {
    originalSendProgress(stage, message)
    emit({ type: "progress", stage, message })
  }

  stream.sendComplete = (data) => {
    originalSendComplete(data)
    done = true
    emit({ type: "complete", data })
  }

  stream.sendError = (error) => {
    originalSendError(error)
    done = true
    emit({ type: "error", message: error })
  }

  async function* generate(): AsyncGenerator<StreamEvent, void, unknown> {
    while (!done || events.length > 0) {
      if (events.length > 0) {
        yield events.shift()!
      } else {
        yield await new Promise<StreamEvent>((r) => {
          resolve = r
        })
      }
    }
  }

  return generate()
}

/**
 * React hook for consuming an AnalysisStream on the client side.
 * Returns current progress state and helper methods.
 */
export function useAnalysisStream() {
  let currentStage = ""
  let currentMessage = ""
  let isComplete = false
  let error: string | null = null
  let result: unknown = null
  const listeners = new Set<() => void>()

  function notify() {
    listeners.forEach((fn) => fn())
  }

  function subscribe(fn: () => void) {
    listeners.add(fn)
    return () => listeners.delete(fn)
  }

  function getSnapshot() {
    return { stage: currentStage, message: currentMessage, isComplete, error, result }
  }

  async function connect(url: string): Promise<void> {
    const eventSource = new EventSource(url)

    eventSource.onmessage = (event) => {
      try {
        const data: StreamEvent = JSON.parse(event.data)

        switch (data.type) {
          case "progress":
            currentStage = data.stage || ""
            currentMessage = data.message || ""
            break
          case "complete":
            isComplete = true
            result = data.data
            eventSource.close()
            break
          case "error":
            error = data.message || "Error desconocido"
            eventSource.close()
            break
        }
        notify()
      } catch {
        // ignore parse errors
      }
    }

    eventSource.onerror = () => {
      if (!isComplete) {
        error = "Error de conexión con el servidor"
        notify()
      }
      eventSource.close()
    }
  }

  return { subscribe, getSnapshot, connect, get currentState() { return getSnapshot() } }
}

export type { StreamEvent, StreamCallback }
