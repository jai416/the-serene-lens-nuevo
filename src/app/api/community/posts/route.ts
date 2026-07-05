import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { ok, error, serverError } from "@/lib/api-response";
import { checkRateLimit } from "@/lib/rate-limit";
import { z } from "zod";

const stripHtml = (s: string) => s.replace(/<[^>]*>/g, "").trim()

const communityPostSchema = z.object({
  title: z.string().min(1).max(200).transform(stripHtml),
  content: z.string().min(1).max(5000).transform(stripHtml),
  category: z.enum(["general", "rutinas", "ingredientes", "consejos", "skin-care", "makeup", "lifestyle", "questions"]),
  groupId: z.string().optional(),
})

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = Math.min(Math.max(1, parseInt(searchParams.get("page") || "1")), 100);
    const category = searchParams.get("category");
    const groupId = searchParams.get("groupId");
    const limit = 10;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (category && category !== "all") where.category = category;
    if (groupId) where.groupId = groupId;

    const [posts, total] = await Promise.all([
      db.communityPost.findMany({
        where,
        include: {
          user: { select: { name: true } },
          group: { select: { id: true, name: true, slug: true } },
          _count: { select: { comments: true } },
          reactions: {
            select: { type: true, userId: true },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      db.communityPost.count({ where }),
    ]);

    const postsWithReactions = posts.map((post) => {
      const reactionCounts: Record<string, number> = {}
      for (const r of post.reactions) {
        reactionCounts[r.type] = (reactionCounts[r.type] || 0) + 1
      }
      const { reactions, ...rest } = post
      return { ...rest, reactions: reactionCounts }
    })

    return ok({
      posts: postsWithReactions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    return serverError(err);
  }
}

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown"
    const { allowed } = await checkRateLimit(`community:post:${ip}`, 10, 60000)
    if (!allowed) return error("Demasiadas solicitudes. Intenta de nuevo en un minuto.", 429)

    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return error("No autorizado", 401);
    }

    const user = await db.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return error("Usuario no encontrado", 404);
    }

    const body = await request.json();
    const parsed = communityPostSchema.safeParse(body);
    if (!parsed.success) {
      return error(parsed.error.issues.map((i) => i.message).join(", "), 400);
    }

    const { title, content, category, groupId } = parsed.data;

    if (groupId) {
      const member = await db.communityMember.findUnique({
        where: { groupId_userId: { groupId, userId: user.id } },
      })
      if (!member) return error("No eres miembro de esta comunidad", 403)
    }

    const post = await db.communityPost.create({
      data: {
        userId: user.id,
        title,
        content,
        category,
        groupId: groupId || null,
      },
      include: {
        user: { select: { name: true } },
        group: { select: { id: true, name: true, slug: true } },
      },
    });

    return ok(post, 201);
  } catch (err) {
    return serverError(err);
  }
}
