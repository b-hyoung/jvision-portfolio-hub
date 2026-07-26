import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { deleteUpload } from "@/lib/uploads";
import { getPost } from "@/server/posts";
import { getCurrentUser } from "@/server/current-user";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Ctx) {
  const { id } = await params;
  const post = await getPost(id);
  if (!post) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json({ post });
}

async function requireOwner(id: string) {
  const me = await getCurrentUser();
  if (!me) return { error: "unauthorized" as const, status: 401 };
  const post = await prisma.post.findUnique({ where: { id } });
  if (!post) return { error: "not found" as const, status: 404 };
  // 소유자 판정은 세션 id(옛 DB 값일 수 있음)가 아니라 전역 getCurrentUser 기준
  if (post.authorId !== me.id)
    return { error: "forbidden" as const, status: 403 };
  return { post };
}

/**
 * 구분별 부분 삭제 — 파일 / 링크 / 배포 링크를 각각 지운다.
 * body: { clear: "file" | "link" | "deploy" }
 * 지운 뒤 남는 콘텐츠(파일·링크·배포)가 하나도 없으면 슬롯(게시물)을 통째로 삭제한다.
 */
export async function PATCH(req: Request, { params }: Ctx) {
  const { id } = await params;
  const guard = await requireOwner(id);
  if ("error" in guard) return NextResponse.json({ error: guard.error }, { status: guard.status });

  const body = await req.json().catch(() => ({}));
  const clear = body?.clear as "file" | "link" | "deploy" | undefined;
  if (clear !== "file" && clear !== "link" && clear !== "deploy")
    return NextResponse.json(
      { error: "clear는 file | link | deploy 중 하나여야 합니다." },
      { status: 400 }
    );

  const post = guard.post;
  const data: Record<string, null> = {};
  if (clear === "file") {
    await deleteUpload(post.filePath);
    await deleteUpload(post.previewPath);
    data.filePath = null;
    data.fileName = null;
    data.previewPath = null;
  } else if (clear === "link") {
    data.linkUrl = null;
  } else {
    data.deployUrl = null;
  }

  // 지운 뒤 남는 콘텐츠 판단
  const remaining = {
    filePath: clear === "file" ? null : post.filePath,
    linkUrl: clear === "link" ? null : post.linkUrl,
    deployUrl: clear === "deploy" ? null : post.deployUrl,
  };
  if (!remaining.filePath && !remaining.linkUrl && !remaining.deployUrl) {
    await prisma.post.delete({ where: { id } });
    return NextResponse.json({ ok: true, deleted: true });
  }

  await prisma.post.update({ where: { id }, data });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: Ctx) {
  const { id } = await params;
  const guard = await requireOwner(id);
  if ("error" in guard) return NextResponse.json({ error: guard.error }, { status: guard.status });
  await deleteUpload(guard.post.filePath);
  await deleteUpload(guard.post.previewPath);
  await prisma.post.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
