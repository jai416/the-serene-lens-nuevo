"use client"

import Script from "next/script"
import { useEffect } from "react"

const CLARITY_ID = process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID || process.env.CLARITY_PROJECT_ID

export function ClarityAnalytics() {
  useEffect(() => {
    if (!CLARITY_ID) return
    try {
      const clarity = (window as unknown as Record<string, unknown>).clarity as unknown as (...args: unknown[]) => void
      if (!clarity) {
        const q: unknown[] = []
        const f = (...args: unknown[]) => q.push(args)
        ;(window as unknown as Record<string, unknown>).clarity = f
        ;(f as unknown as Record<string, unknown>).q = q
      }
    } catch {}
  }, [])

  if (!CLARITY_ID) return null

  return (
    <Script
      id="microsoft-clarity"
      strategy="afterInteractive"
      dangerouslySetInnerHTML={{
        __html: `
          (function(c,l,a,r,i,t,y){
            c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
            t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
            y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
          })(window, document, "clarity", "script", "${CLARITY_ID}");
        `,
      }}
    />
  )
}
