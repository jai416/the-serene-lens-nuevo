import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { NextResponse } from "next/server"
import { trackPdfGenerated } from "@/lib/tracking"
import { sanitizeHtml } from "@/lib/sanitize"
import { error, unauthorized, forbidden, serverError } from "@/lib/api-response"

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return unauthorized()
    }

    const { searchParams } = new URL(req.url)
    const analysisId = searchParams.get("analysisId")
    if (!analysisId) {
      return error("analysisId requerido", 400)
    }

    const analysis = await db.skinAnalysis.findUnique({
      where: { id: analysisId },
      include: { user: true },
    })

    if (!analysis || analysis.userId !== session.user.id) {
      return forbidden()
    }

    const clinic = await db.clinic.findUnique({ where: { ownerId: session.user.id } })

    trackPdfGenerated(session.user.role || "USER")

    const logoBase64 = clinic?.logo || null
    const skinType = analysis.skinType || "No determinado"
    const date = new Date(analysis.createdAt).toLocaleDateString("es-ES", {
      year: "numeric", month: "long", day: "numeric",
    })

    const observations = (() => {
      try { return JSON.parse(analysis.observations) } catch { return {} }
    })()

    const recommendations = (() => {
      try { return JSON.parse(analysis.recommendations) } catch { return [] }
    })()

    const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><style>
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; margin: 0; padding: 40px; color: #1A1A1A; }
  .header { text-align: center; margin-bottom: 32px; border-bottom: 1px solid #E8E8E8; padding-bottom: 24px; }
  ${logoBase64 ? `.logo { width: 80px; height: 80px; object-fit: contain; margin-bottom: 12px; }` : ""}
  .clinic-name { font-size: 20px; font-weight: 600; color: #1A1A1A; margin-bottom: 4px; }
  .report-title { font-size: 14px; color: #666666; }
  .section { margin-bottom: 24px; }
  .section-title { font-size: 16px; font-weight: 600; margin-bottom: 8px; color: #1A1A1A; border-left: 3px solid #88B078; padding-left: 12px; }
  .info-grid { display: flex; gap: 16px; margin-bottom: 16px; }
  .info-item { background: #F8F9FA; padding: 12px 16px; border-radius: 12px; flex: 1; }
  .info-label { font-size: 11px; color: #666666; margin-bottom: 2px; }
  .info-value { font-size: 14px; font-weight: 500; color: #1A1A1A; }
  .obs-list { list-style: none; padding: 0; margin: 0; }
  .obs-list li { padding: 8px 12px; margin-bottom: 6px; background: #F8F9FA; border-radius: 8px; font-size: 13px; color: #666666; }
  .footer { margin-top: 32px; padding-top: 16px; border-top: 1px solid #E8E8E8; text-align: center; font-size: 11px; color: #999999; }
  .disclaimer { margin-top: 24px; padding: 12px; background: #FEF2F2; border-radius: 8px; font-size: 11px; color: #E07070; }
</style></head><body>
  <div class="header">
    ${logoBase64 ? `<img src="${logoBase64}" class="logo" />` : ""}
    <div class="clinic-name">${sanitizeHtml(clinic?.name || "The Serene Lens")}</div>
    <div class="report-title">Reporte de Observación Cosmética · ${date}</div>
  </div>

  <div class="section">
    <div class="info-grid">
      <div class="info-item"><div class="info-label">Tipo de Piel</div><div class="info-value">${sanitizeHtml(skinType)}</div></div>
      <div class="info-item"><div class="info-label">Fecha</div><div class="info-value">${date}</div></div>
    </div>
  </div>

  ${observations.observations?.length ? `
  <div class="section">
    <div class="section-title">Factores Observados</div>
    <ul class="obs-list">${observations.observations.map((o: string) => `<li>${sanitizeHtml(o)}</li>`).join("")}</ul>
  </div>` : ""}

  ${recommendations.length ? `
  <div class="section">
    <div class="section-title">Recomendaciones Cosméticas</div>
    <ul class="obs-list">${recommendations.map((r: string) => `<li>${sanitizeHtml(r)}</li>`).join("")}</ul>
  </div>` : ""}

  <div class="disclaimer">
    Este reporte ofrece observaciones cosméticas orientativas basadas en fotografías. No constituye diagnóstico médico.
  </div>

  <div class="footer">
    Generado por The Serene Lens · theserenelens.com
  </div>
</body></html>`

    return new NextResponse(html, {
      headers: { "Content-Type": "text/html" },
    })
  } catch {
    return serverError()
  }
}
