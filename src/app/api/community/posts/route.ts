import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { db } from "@/lib/db";
import { ok, error, serverError } from "@/lib/api-response";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const category = searchParams.get("category");
    const limit = 10;
    const skip = (page - 1) * limit;

    const where = category && category !== "all" ? { category } : {};

    const [posts, total] = await Promise.all([
      db.communityPost.findMany({
        where,
        include: { user: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      db.communityPost.count({ where }),
    ]);

    return ok({
      posts,
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
    const session = await getServerSession();
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
    const { title, content, category } = body;

    if (!title || !content || !category) {
      return error("Título, contenido y categoría son requeridos", 400);
    }

    const post = await db.communityPost.create({
      data: {
        userId: user.id,
        title,
        content,
        category,
      },
      include: { user: { select: { name: true } } },
    });

    return ok(post, 201);
  } catch (err) {
    return serverError(err);
  }
}
