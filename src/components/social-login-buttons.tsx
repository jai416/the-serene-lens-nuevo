"use client"

import { signIn } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Github, Chrome } from "lucide-react"
import { useState } from "react"

export function SocialLoginButtons() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const rawCallback = searchParams.get("callbackUrl") || "/dashboard"
  const callbackUrl =
    rawCallback.startsWith("/") && !rawCallback.startsWith("//") ? rawCallback : "/dashboard"
  const [loading, setLoading] = useState<string | null>(null)

  const handleSocialLogin = async (provider: string) => {
    try {
      setLoading(provider)
      const result = await signIn(provider, { callbackUrl, redirect: false })
      if (result?.ok) {
        router.push(callbackUrl)
      }
    } catch {
      // error handled by login page
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="grid grid-cols-2 gap-3">
      <Button
        variant="secondary"
        onClick={() => handleSocialLogin("google")}
        className="py-5 h-auto"
        disabled={loading !== null}
      >
        {loading === "google" ? (
          <span className="w-4 h-4 border-2 border-[#2F3A2D]/30 border-t-[#2F3A2D] rounded-full animate-spin mr-2" />
        ) : (
          <Chrome className="w-4 h-4 mr-2" />
        )}
        Google
      </Button>
      <Button
        variant="secondary"
        onClick={() => handleSocialLogin("github")}
        className="py-5 h-auto"
        disabled={loading !== null}
      >
        {loading === "github" ? (
          <span className="w-4 h-4 border-2 border-[#2F3A2D]/30 border-t-[#2F3A2D] rounded-full animate-spin mr-2" />
        ) : (
          <Github className="w-4 h-4 mr-2" />
        )}
        GitHub
      </Button>
    </div>
  )
}
