import { NextResponse } from "next/server"

export async function GET(req: Request) {
  const auth = req.headers.get("authorization")
  const CRON_SECRET = process.env.CRON_SECRET
  if (auth !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const model = searchParams.get("model")
  const type = searchParams.get("type") || "chat"

  if (!model) {
    return NextResponse.json({ error: "model param required" }, { status: 400 })
  }

  const GROQ_API_KEY = process.env.GROQ_API_KEY
  if (!GROQ_API_KEY) {
    return NextResponse.json({ error: "No GROQ_API_KEY" }, { status: 500 })
  }

  const results: Record<string, unknown>[] = []

  for (const m of model.split(",")) {
    try {
      const body: Record<string, unknown> = {
        model: m.trim(),
        messages: [{ role: "user", content: type === "vision" ? [
          { type: "text", text: "describe this" },
          { type: "image_url", image_url: { url: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==" } }
        ] : "hi" }],
        max_tokens: 5,
      }

      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${GROQ_API_KEY}`,
        },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(10000),
      })

      const text = await res.text()
      results.push({ model: m.trim(), status: res.status, ok: res.ok, body: text.slice(0, 300) })
    } catch (e) {
      results.push({ model: m.trim(), error: String(e).slice(0, 300) })
    }
  }

  return NextResponse.json({ results })
}
