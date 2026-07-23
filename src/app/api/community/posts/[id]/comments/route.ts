import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { ok, error, serverError } from "@/lib/api-response";
import { z } from "zod";
import { validateCsrf } from "@/lib/csrf-middleware";
import { logger } from "@/lib/logger";

const stripHtml = (s: string) => s.replace(/<[^>]*>/g, "").trim()

const commentSchema = z.object({
  content: z.string().min(1).max(2000).transform(stripHtml),
})

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const post = await db.communityPost.findUnique({ where: { id } });
    if (!post) {
      return error("Publicación no encontrada", 404);
    }

    const cursor = request.nextUrl.searchParams.get("cursor");

    const comments = await db.comment.findMany({
      where: { postId: id },
      include: { user: { select: { name: true } } },
      orderBy: { createdAt: "asc" },
      take: 51,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
    });

    const hasMore = comments.length > 50
    const items = hasMore ? comments.slice(0, 50) : comments

    return ok({ comments: items, nextCursor: hasMore ? items[items.length - 1]?.id : null });
  } catch (err) {
    return serverError(err);
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return error("No autorizado", 401);
    }
    if (!validateCsrf(request)) return error("CSRF token inválido", 403);

    const user = await db.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return error("Usuario no encontrado", 404);
    }

    const { id } = await params;

    const post = await db.communityPost.findUnique({ where: { id } });
    if (!post) {
      return error("Publicación no encontrada", 404);
    }

    const body = await request.json();
    const parsed = commentSchema.safeParse(body);
    if (!parsed.success) {
      return error(parsed.error.issues.map((i) => i.message).join(", "), 400);
    }

    const comment = await db.comment.create({
      data: {
        postId: id,
        userId: user.id,
        content: parsed.data.content,
        approved: !/https?:\/\/|\.com\b|\.net\b|casino|bets?|gambl|click here|buy now/i.test(parsed.data.content),
      },
      include: { user: { select: { name: true } } },
    });

    if (!comment.approved) {
      const { sendTelegramMessage } = await import("@/lib/telegram");
      const adminChats = await db.telegramAuth.findMany({ where: { role: "ADMIN" }, select: { chatId: true } });
      for (const ac of adminChats) {
        sendTelegramMessage(ac.chatId, `🚨 Nuevo comentario retenido por spam en "${post.title}".\n\n"${parsed.data.content.slice(0, 200)}"`).catch((e) => logger.error("Telegram alert failed", { error: e }))
      }
    }

    return ok(comment, 201);
  } catch (err) {
    return serverError(err);
  }
}
