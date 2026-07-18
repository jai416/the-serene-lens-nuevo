import { NextRequest } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { ok, unauthorized, forbidden, serverError } from "@/lib/api-response"

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return unauthorized()
    if (session.user.plan !== "ESTHETICIAN") return forbidden()

    const clinic = await db.clinic.findUnique({ where: { ownerId: session.user.id } })
    if (!clinic) return ok({ clients: [] })

    const clients = await db.client.findMany({
      where: { clinicId: clinic.id },
      orderBy: { createdAt: "desc" },
    })

    const csvHeader = "Name,Email,Phone,Notes,Created At\n"
    const csvRows = clients
      .map((c: any) =>
        `"${(c.name || "").replace(/"/g, '""')}","${(c.email || "").replace(/"/g, '""')}","${(c.phone || "").replace(/"/g, '""')}","${(c.notes || "").replace(/"/g, '""')}","${c.createdAt?.toISOString() || ""}"`
      )
      .join("\n")

    const csv = csvHeader + csvRows
    const filename = `clientes-${clinic.name?.replace(/[^a-zA-Z0-9]/g, "-") || "export"}.csv`

    return new Response(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    })
  } catch (e) {
    return serverError(e)
  }
}
