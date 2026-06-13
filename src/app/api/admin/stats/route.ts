import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { ok, unauthorized, serverError } from "@/lib/api-response"

async function requireAdmin() {
  const session = await getServerSession(authOptions)
  if (!session?.user || session.user.role !== "ADMIN") return null
  return session.user
}

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

    const [completedPayments, pendingPayments, unreadMessages] = await Promise.all([
      db.payment.count({ where: { status: "completed" } }),
      db.payment.count({ where: { status: "pending" } }),
      db.contactMessage.count({ where: { read: false } }),
    ])

    const [revenue, revenueStripe, revenueQvaPay] = await Promise.all([
      db.payment.aggregate({
        where: { status: "completed" },
        _sum: { amount: true },
      }),
      db.payment.aggregate({
        where: { status: "completed", provider: "stripe" },
        _sum: { amount: true },
      }),
      db.payment.aggregate({
        where: { status: "completed", provider: "qvapay" },
        _sum: { amount: true },
      }),
    ])

    const recentUsers = await db.user.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, name: true, email: true, plan: true, createdAt: true },
    })

    const recentPayments = await db.payment.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { user: { select: { name: true, email: true } } },
    })

    return ok({
      stats: {
        users,
        analyses,
        payments,
        completedPayments,
        pendingPayments,
        messages,
        unreadMessages,
        posts,
        products,
        revenue: revenue._sum.amount || 0,
        revenueStripe: revenueStripe._sum.amount || 0,
        revenueQvaPay: revenueQvaPay._sum.amount || 0,
      },
      recentUsers,
      recentPayments,
    })
  } catch (e) {
    return serverError(e)
  }
}
