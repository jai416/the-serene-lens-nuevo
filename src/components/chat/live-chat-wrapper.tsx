"use client"

import dynamic from "next/dynamic"

const LiveChatWidget = dynamic(() => import("@/components/chat/live-chat-widget"), { ssr: false })

export function LiveChatWrapper() {
  return <LiveChatWidget />
}
