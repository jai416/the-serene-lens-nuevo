"use client"

import Script from "next/script"
import { useEffect } from "react"

const CLARITY_ID = process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID || process.env.CLARITY_PROJECT_ID

export function ClarityAnalytics() {
  useEffect(() => {
    if (!CLARITY_ID) return
    try {
      (window as any).clarity = (window as any).clarity || function() {
        ((window as any).clarity.q = (window as any).clarity.q || []).push(arguments)
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
