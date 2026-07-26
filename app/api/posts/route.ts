import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { saveUpload, deleteUpload } from "@/lib/uploads";
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

  const form = await req.formData();
  const file = form.get("file");
  const hasFile = file instanceof File && file.size > 0;

  const parsed = postInputSchema.safeParse({
    type: form.get("type"),
    description: form.get("description") ?? "",
    linkUrl: form.get("linkUrl") ?? "",
    deployUrl: form.get("deployUrl") ?? "",
    hasFile,
  });
  if (!parsed.success)
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });

  let filePath: string | null = null;
  let fileName: string | null = null;
  let previewPath: string | null = null;
  if (hasFile) {
    try {
      const saved = await saveUpload(file as File);
      filePath = saved.filePath;
      fileName = saved.fileName;
      previewPath = saved.previewPath;
    } catch (e) {
      return NextResponse.json({ error: (e as Error).message }, { status: 400 });
    }
  }

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
