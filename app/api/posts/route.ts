import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { deleteUpload, previewPathFor } from "@/lib/uploads";
import { postInputSchema } from "@/validations/post";
import { listPosts } from "@/server/posts";
import { getCurrentUser } from "@/server/current-user";
import { PostType } from "@/constants/enums";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const typeParam = searchParams.get("type") as PostType | null;
  const q = searchParams.get("q") ?? undefined;
  const type =
    typeParam && Object.values(PostType).includes(typeParam) ? typeParam : undefined;
  const posts = await listPosts({ type, q });
  return NextResponse.json({ posts });
}

export async function POST(req: Request) {
  const me = await getCurrentUser();
  if (!me) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  // 파일 바이트가 아니라, 클라이언트가 Supabase에 직접 올린 결과 경로를 받는다.
  const body = await req.json().catch(() => ({}));
  const filePath =
    typeof body.filePath === "string" && body.filePath ? body.filePath : null;
  const fileName =
    typeof body.fileName === "string" && body.fileName ? body.fileName : null;
  const hasFile = Boolean(filePath);

  const parsed = postInputSchema.safeParse({
    type: body.type,
    description: body.description ?? "",
    linkUrl: body.linkUrl ?? "",
    deployUrl: body.deployUrl ?? "",
    hasFile,
  });
  if (!parsed.success)
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });

  const previewPath = filePath ? previewPathFor(filePath) : null;

  try {
    const authorId = me.id;

    // 학생당 카테고리별 1개 슬롯: 이미 있으면 교체(기존 파일 정리)
    const existing = await prisma.post.findUnique({
      where: { authorId_type: { authorId, type: parsed.data.type } },
    });
    if (existing && hasFile) {
      await deleteUpload(existing.filePath);
      await deleteUpload(existing.previewPath);
    }

    const data = {
      description: parsed.data.description || null,
      linkUrl: parsed.data.linkUrl || null,
      deployUrl: parsed.data.deployUrl || null,
      ...(hasFile ? { filePath, fileName, previewPath } : {}),
    };

    const post = await prisma.post.upsert({
      where: { authorId_type: { authorId, type: parsed.data.type } },
      update: data,
      create: {
        type: parsed.data.type,
        authorId,
        filePath,
        fileName,
        previewPath,
        ...data,
      },
    });
    return NextResponse.json({ ok: true, id: post.id });
  } catch (e) {
    console.error("POST /api/posts 실패:", e);
    return NextResponse.json({ error: "저장에 실패했습니다." }, { status: 500 });
  }
}
