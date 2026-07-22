import { db } from "@/lib/db"
import { Prisma } from "@/generated/prisma/client"

export const AnalysisRepository = {
  async findById(id: string) {
    return db.skinAnalysis.findUnique({ where: { id } })
  },

  async findByUserId(userId: string, take = 50) {
    return db.skinAnalysis.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take,
      select: {
        id: true,
        skinType: true,
        concerns: true,
        observations: true,
        recommendations: true,
        createdAt: true,
      },
    })
  },

  async findEvolution(userId: string) {
    return db.skinAnalysis.findMany({
      where: { userId },
      orderBy: { createdAt: "asc" },
      select: { createdAt: true, observations: true },
    })
  },

  async create(data: {
    userId: string
    clientId?: string | null
    skinType?: string | null
    concerns?: string | null
    observations: string
    recommendations: string
    routine?: string | null
  }) {
    return db.skinAnalysis.create({
      data: {
        user: { connect: { id: data.userId } },
        ...(data.clientId ? { client: { connect: { id: data.clientId } } } : {}),
        skinType: data.skinType,
        concerns: data.concerns,
        observations: data.observations,
        recommendations: data.recommendations,
        routine: data.routine,
      },
    })
  },

  async countByUser(userId: string) {
    return db.skinAnalysis.count({ where: { userId } })
  },
}

export const UserRepository = {
  async findById(id: string) {
    return db.user.findUnique({ where: { id } })
  },

  async findByEmail(email: string) {
    return db.user.findUnique({ where: { email } })
  },

  async updateProfile(id: string, data: { name?: string; image?: string }) {
    return db.user.update({ where: { id }, data })
  },

  async deleteCascade(id: string) {
    await db.$transaction([
      db.feedback.deleteMany({ where: { analysis: { userId: id } } }),
      db.skinAnalysis.deleteMany({ where: { userId: id } }),
      db.payment.deleteMany({ where: { userId: id } }),
      db.subscription.deleteMany({ where: { userId: id } }),
      db.purchasePack.deleteMany({ where: { userId: id } }),
      db.usageTracking.deleteMany({ where: { userId: id } }),
      db.session.deleteMany({ where: { userId: id } }),
      db.account.deleteMany({ where: { userId: id } }),
      db.clinic.deleteMany({ where: { ownerId: id } }),
      db.user.delete({ where: { id } }),
    ])
  },

  async getUsage(id: string) {
    return db.user.findUnique({
      where: { id },
      select: {
        plan: true,
        analysisLimit: true,
        analysisUsed: true,
        analysisResetAt: true,
      },
    })
  },
}

export const PaymentRepository = {
  async findByUser(userId: string) {
    return db.payment.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    })
  },

  async createPayPal(data: {
    userId: string
    plan: string
    amount: number
    paypalOrderId: string
  }) {
    return db.payment.create({
      data: {
        userId: data.userId,
        provider: "paypal",
        plan: data.plan,
        amount: data.amount,
        currency: "USD",
        paypalOrderId: data.paypalOrderId,
      },
    })
  },
}

export const BlogRepository = {
  async findPublished(take = 50, category?: string) {
    const where: Prisma.BlogPostWhereInput = { published: true }
    if (category) where.category = category
    return db.blogPost.findMany({
      where,
      orderBy: { publishedAt: "desc" },
      take,
      select: {
        id: true,
        title: true,
        slug: true,
        excerpt: true,
        image: true,
        category: true,
        readTime: true,
        views: true,
        publishedAt: true,
      },
    })
  },

  async findBySlug(slug: string) {
    return db.blogPost.findUnique({ where: { slug } })
  },

  async incrementViews(id: string) {
    return db.blogPost.update({ where: { id }, data: { views: { increment: 1 } } })
  },
}

export const ProductRepository = {
  async findActive(take = 50, category?: string) {
    const where: Prisma.ProductWhereInput = { isActive: true }
    if (category) where.category = category
    return db.product.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take,
    })
  },

  async findBySlug(slug: string) {
    return db.product.findUnique({ where: { slug } })
  },
}

export const FeedbackRepository = {
  async upsert(analysisId: string, data: { rating: number; comment?: string; wouldRecommend: boolean }) {
    return db.feedback.upsert({
      where: { analysisId },
      update: data,
      create: { analysisId, ...data },
    })
  },

  async findByAnalysis(analysisId: string) {
    return db.feedback.findUnique({ where: { analysisId } })
  },
}
