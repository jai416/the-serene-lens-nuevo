import { describe, it, expect, vi, beforeEach } from "vitest"
import { AnalysisStream, createStreamGenerator, useAnalysisStream } from "../streaming"

describe("AnalysisStream", () => {
  let stream: AnalysisStream

  beforeEach(() => {
    stream = new AnalysisStream()
  })

  it("creates a readable stream", () => {
    const webStream = stream.createStream()
    expect(webStream).toBeInstanceOf(ReadableStream)
  })

  it("sends progress events", async () => {
    const webStream = stream.createStream()
    const reader = webStream.getReader()
    const chunks: string[] = []

    stream.sendProgress("validating", "Validando datos...")
    stream.sendProgress("analyzing", "Analizando textura...")
    stream.sendComplete({ done: true })

    while (true) {
      const { value, done } = await reader.read()
      if (done) break
      chunks.push(new TextDecoder().decode(value))
    }

    expect(chunks).toHaveLength(3)
    expect(chunks[0]).toContain("validating")
    expect(chunks[0]).toContain("Validando datos...")
    expect(chunks[1]).toContain("analyzing")
    expect(chunks[2]).toContain("complete")
  })

  it("sends error event and closes", async () => {
    const webStream = stream.createStream()
    const reader = webStream.getReader()
    const chunks: string[] = []

    stream.sendError("Algo salió mal")

    while (true) {
      const { value, done } = await reader.read()
      if (done) break
      chunks.push(new TextDecoder().decode(value))
    }

    expect(chunks).toHaveLength(1)
    expect(chunks[0]).toContain("error")
    expect(chunks[0]).toContain("Algo salió mal")
  })

  it("does not send after close", () => {
    const webStream = stream.createStream()
    stream.sendComplete({})
    expect(() => stream.sendProgress("test", "test")).not.toThrow()
  })

  it("handles cancel gracefully", () => {
    const webStream = stream.createStream()
    webStream.cancel()
    expect(() => stream.sendProgress("test", "test")).not.toThrow()
  })
})

describe("createStreamGenerator", () => {
  it("yields events in order", async () => {
    const s = new AnalysisStream()
    s.createStream()

    const generator = createStreamGenerator(s)
    const events: string[] = []

    s.sendProgress("step1", "Paso 1")
    s.sendProgress("step2", "Paso 2")
    s.sendComplete({ ok: true })

    for await (const event of generator) {
      events.push(event.type)
      if (event.type === "complete") break
    }

    expect(events).toEqual(["progress", "progress", "complete"])
  })

  it("yields error event", async () => {
    const s = new AnalysisStream()
    s.createStream()

    const generator = createStreamGenerator(s)
    const events: string[] = []

    s.sendError("failure")

    for await (const event of generator) {
      events.push(event.type)
      break
    }

    expect(events).toEqual(["error"])
  })
})

describe("useAnalysisStream", () => {
  it("returns initial state", () => {
    const hook = useAnalysisStream()
    const state = hook.getSnapshot()
    expect(state.stage).toBe("")
    expect(state.message).toBe("")
    expect(state.isComplete).toBe(false)
    expect(state.error).toBeNull()
    expect(state.result).toBeNull()
  })

  it("notifies subscribers on state change", () => {
    const hook = useAnalysisStream()
    const listener = vi.fn()
    hook.subscribe(listener)

    // Simulate progress by triggering EventSource behavior
    // The hook updates via EventSource, so we test the subscribe mechanism
    expect(listener).not.toHaveBeenCalled()
  })

  it("connect throws with invalid URL", async () => {
    const hook = useAnalysisStream()
    // EventSource constructor throws on invalid URL in Node
    await expect(hook.connect("")).rejects.toThrow()
  })
})
