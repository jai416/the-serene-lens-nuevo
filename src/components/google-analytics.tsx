"use client"

import Script from "next/script"

const GA_ID = process.env.NEXT_PUBLIC_GA_ID || process.env.GA_ID
const GA_STREAM_ID = process.env.NEXT_PUBLIC_GA_STREAM_ID || process.env.GA_STREAM_ID || ""

export function GoogleAnalytics() {
  if (!GA_ID) return null

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
        strategy="afterInteractive"
      />
      <Script id="google-analytics-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA_ID}'${GA_STREAM_ID ? `, { stream_id: '${GA_STREAM_ID}' }` : ""});
        `}
      </Script>
    </>
  )
}
