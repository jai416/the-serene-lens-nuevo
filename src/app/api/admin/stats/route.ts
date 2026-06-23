import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { ok, unauthorized, serverError } from "@/lib/api-response"

async function requireAdmin() {
  const session = await getServerSession(authOptions)
  if (!session?.user || session.user.role !== "ADMIN") return null
  return session.user
}

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const admin = await requireAdmin()
    if (!admin) return unauthorized()

    const [users, analyses, payments, messages, posts, products] = await Promise.all([
      db.user.count(),
      db.skinAnalysis.count(),
      db.payment.count(),
      db.contactMessage.count(),
      db.blogPost.count(),
      db.product.count(),
    ])

    const [completedPayments, unreadMessages] = await Promise.all([
      db.payment.count({ where: { status: "completed" } }),
      db.contactMessage.count({ where: { read: false } }),
    ])

    const revenue = await db.payment.aggregate({
      where: { status: "completed" },
      _sum: { amount: true },
    })

    const recentUsers = await db.user.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, name: true, email: true, plan: true, createdAt: true },
    })

    return ok({
      stats: {
        users,
        analyses,
        payments,
        completedPayments,
        pendingPayments: payments - completedPayments,
        messages,
        unreadMessages,
        posts,
        products,
        revenue: revenue._sum.amount || 0,
        revenueStripe: 0,
        revenueQvaPay: revenue._sum.amount || 0,
      },
      recentUsers,
    })
  } catch (e) {
    return serverError(e)
  }
}
