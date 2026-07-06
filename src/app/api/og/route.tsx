import { ImageResponse } from "next/og"
import { db } from "@/lib/db"

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const skinType = searchParams.get("skinType") || null
    const analysisId = searchParams.get("analysisId") || null
    const productName = searchParams.get("product") || null
    const summary = searchParams.get("summary") || null

    let title = "The Serene Lens"
    let subtitle = "Observación cosmética de tu piel"

    if (skinType) {
      title = skinType.charAt(0).toUpperCase() + skinType.slice(1)
      subtitle = "Tipo de piel detectado por IA"
    } else if (productName) {
      title = productName
      subtitle = summary || "Ingredientes analizados"
    } else if (analysisId) {
      try {
        const analysis = await db.skinAnalysis.findUnique({
          where: { id: analysisId },
          select: { skinType: true },
        })
        if (analysis?.skinType) {
          title = analysis.skinType
          subtitle = "Tipo de piel detectado por IA"
        }
      } catch {}
    }

    const observations = searchParams.get("observations") || ""

    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            background: "#F8F9FA",
            fontFamily: "sans-serif",
            padding: 48,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 64,
              height: 64,
              borderRadius: 16,
              background: "#88B078",
              marginBottom: 24,
            }}
          >
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#1A1A1A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2C12 2 8 6 8 10C8 13.3 10.7 16 14 16C17.3 16 20 13.3 20 10C20 6 16 4 12 2Z"/>
              <path d="M12 2C12 2 16 6 16 10C16 13.3 13.3 16 10 16C6.7 16 4 13.3 4 10C4 6 8 4 12 2Z"/>
            </svg>
          </div>
          <div
            style={{
              fontSize: 40,
              fontWeight: 700,
              color: "#1A1A1A",
              textAlign: "center",
              marginBottom: 12,
              lineHeight: 1.2,
            }}
          >
            {title}
          </div>
          <div
            style={{
              fontSize: 20,
              color: "#666666",
              textAlign: "center",
              maxWidth: 480,
              lineHeight: 1.5,
            }}
          >
            {subtitle}
          </div>
          {observations && (
            <div
              style={{
                marginTop: 16,
                fontSize: 14,
                color: "#999999",
                textAlign: "center",
                maxWidth: 400,
              }}
            >
              {observations}
            </div>
          )}
          <div
            style={{
              marginTop: 32,
              fontSize: 14,
              color: "#999999",
            }}
          >
            Analiza tu piel gratis → theserenelens.com
          </div>
        </div>
      ),
      { width: 800, height: 418 }
    )
  } catch {
    return new Response("Failed", { status: 500 })
  }
}
