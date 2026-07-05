'use client'

import { useState, useEffect, useRef } from "react"

interface Message {
  id: string
  content: string
  role: "user" | "admin"
  createdAt: string
}

export default function LiveChatWidget() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [sending, setSending] = useState(false)
  const listRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const stored = localStorage.getItem("chat_session_id")
    if (stored) {
      setSessionId(stored)
      setLoading(false)
    } else {
      fetch("/api/chat/session", { method: "POST" })
        .then((r) => r.json())
        .then((data) => {
          const id = data?.sessionId || data?.data?.sessionId
          if (!id) { setError(true); return }
          localStorage.setItem("chat_session_id", id)
          setSessionId(id)
        })
        .catch(() => setError(true))
        .finally(() => setLoading(false))
    }
  }, [])

  useEffect(() => {
    if (!sessionId || !open) return
    const fetchMessages = async () => {
      try {
        const res = await fetch(`/api/chat/messages?sessionId=${sessionId}`)
        const data = await res.json()
        setMessages(data.messages ?? data)
        setError(false)
      } catch {
        setError(true)
      }
    }
    fetchMessages()
    const interval = setInterval(fetchMessages, 5000)
    return () => clearInterval(interval)
  }, [sessionId, open])

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight
    }
  }, [messages.length])

  const handleSend = async () => {
    if (!input.trim() || !sessionId || sending) return
    setSending(true)
    const temp: Message = {
      id: Date.now().toString(),
      content: input.trim(),
      role: "user",
      createdAt: new Date().toISOString(),
    }
    setMessages((prev) => [...prev, temp])
    setInput("")
    try {
      const res = await fetch("/api/chat/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, content: temp.content }),
      })
      if (!res.ok) throw new Error()
    } catch {
      setError(true)
    } finally {
      setSending(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(!open)}
        className="fixed bottom-4 right-4 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#C2E09D] text-2xl shadow-lg hover:bg-[#B0CF8D] transition-colors"
      >
        💬
      </button>

      {open && (
        <div className="fixed bottom-20 right-4 z-50 flex h-[520px] w-[360px] flex-col rounded-2xl border border-gray-200 bg-white shadow-2xl dark:border-gray-700 dark:bg-gray-900">
          <div className="flex items-center justify-between rounded-t-2xl bg-[#C2E09D] p-3 font-semibold">
            <span>💬 Chat en vivo</span>
            <button onClick={() => setOpen(false)} className="text-lg leading-none">✕</button>
          </div>

          {loading ? (
            <div className="flex flex-1 items-center justify-center">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#C2E09D] border-t-transparent" />
            </div>
          ) : error && messages.length === 0 ? (
            <div className="flex flex-1 items-center justify-center p-4 text-center">
              <p className="text-gray-500">😅 Hubo un error. Intenta de nuevo.</p>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-1 items-center justify-center p-4 text-center">
              <p className="text-gray-500">¡Hola! ¿En qué podemos ayudarte? Estamos aquí para ti 🌿</p>
            </div>
          ) : (
            <div ref={listRef} className="flex-1 space-y-3 overflow-y-auto p-4">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`max-w-[80%] rounded-2xl p-3 ${
                    msg.role === "user"
                      ? "ml-auto rounded-br-sm bg-[#C2E09D] text-gray-900"
                      : "rounded-bl-sm bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-white"
                  }`}
                >
                  {msg.content}
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-2 border-t p-3 dark:border-gray-700">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder="Escribe un mensaje..."
              className="flex-1 rounded-xl border border-gray-300 bg-transparent p-2 dark:border-gray-600"
            />
            <button
              onClick={handleSend}
              disabled={sending || !input.trim()}
              className="rounded-xl bg-[#C2E09D] px-4 py-2 font-medium disabled:opacity-50"
            >
              Enviar
            </button>
          </div>
        </div>
      )}
    </>
  )
}
