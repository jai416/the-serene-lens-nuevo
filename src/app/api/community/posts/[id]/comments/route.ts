import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { db } from "@/lib/db";
import { ok, error, serverError } from "@/lib/api-response";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const post = await db.communityPost.findUnique({ where: { id } });
    if (!post) {
      return error("Publicación no encontrada", 404);
    }

    const comments = await db.comment.findMany({
      where: { postId: id },
      include: { user: { select: { name: true } } },
      orderBy: { createdAt: "asc" },
    });

    return ok(comments);
  } catch (err) {
    return serverError(err);
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const { id } = params;

    const post = await db.communityPost.findUnique({ where: { id } });
    if (!post) {
      return error("Publicación no encontrada", 404);
    }

    const body = await request.json();
    const { content } = body;

    if (!content) {
      return error("El contenido es requerido", 400);
    }

    const comment = await db.comment.create({
      data: {
        postId: id,
        userId: user.id,
        content,
      },
      include: { user: { select: { name: true } } },
    });

    return ok(comment, 201);
  } catch (err) {
    return serverError(err);
  }
}
