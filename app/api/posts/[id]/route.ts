import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { prisma } from "@/lib/prisma";
import { deleteUpload, saveUpload } from "@/lib/uploads";
import { postInputSchema } from "@/validations/post";
import { getPost } from "@/server/posts";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Ctx) {
  const { id } = await params;
  const post = await getPost(id);
  if (!post) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json({ post });
}

async function requireOwner(id: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return { error: "unauthorized" as const, status: 401 };
  const post = await prisma.post.findUnique({ where: { id } });
  if (!post) return { error: "not found" as const, status: 404 };
  if (post.authorId !== session.user.id)
    return { error: "forbidden" as const, status: 403 };
  return { post };
}

export async function PATCH(req: Request, { params }: Ctx) {
  const { id } = await params;
  const guard = await requireOwner(id);
  if ("error" in guard) return NextResponse.json({ error: guard.error }, { status: guard.status });

  const form = await req.formData();
  const file = form.get("file");
  const newFile = file instanceof File && file.size > 0;
  const hasFile = newFile || Boolean(guard.post.filePath);

  const parsed = postInputSchema.safeParse({
    type: form.get("type"),
    title: form.get("title"),
    description: form.get("description") ?? "",
    linkUrl: form.get("linkUrl") ?? "",
    hasFile,
  });
  if (!parsed.success)
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });

  let { filePath, fileName } = guard.post;
  if (newFile) {
    try {
      await deleteUpload(guard.post.filePath);
      const saved = await saveUpload(file as File);
      filePath = saved.filePath;
      fileName = saved.fileName;
    } catch (e) {
      return NextResponse.json({ error: (e as Error).message }, { status: 400 });
    }
  }

  await prisma.post.update({
    where: { id },
    data: {
      type: parsed.data.type,
      title: parsed.data.title,
      description: parsed.data.description || null,
      linkUrl: parsed.data.linkUrl || null,
      filePath,
      fileName,
    },
  });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: Ctx) {
  const { id } = await params;
  const guard = await requireOwner(id);
  if ("error" in guard) return NextResponse.json({ error: guard.error }, { status: guard.status });
  await deleteUpload(guard.post.filePath);
  await prisma.post.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
