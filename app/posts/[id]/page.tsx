import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { getSessionUser } from "@/server/profile";
import { getPost, getPostsByAuthor } from "@/server/posts";
import { getLinkPreview } from "@/lib/link-preview";
import StudentDocViewer, { type ViewerDoc } from "@/components/posts/StudentDocViewer";

export default async function PostDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const { id } = await params;
  const post = await getPost(id);
  if (!post) notFound();

  const isOwner = post.author.id === user.id;
  const authorPosts = await getPostsByAuthor(post.author.id);

  const docs: ViewerDoc[] = await Promise.all(
    authorPosts.map(async (p) => ({
      type: p.type,
      fileUrl: p.filePath ? `/api/files/${p.filePath}` : null,
      previewUrl: p.previewPath ? `/api/files/${p.previewPath}` : null,
      fileName: p.fileName,
      description: p.description,
      linkUrl: p.linkUrl,
      linkPreview: p.linkUrl ? await getLinkPreview(p.linkUrl) : null,
    }))
  );

  return (
    <main className="mx-auto max-w-6xl p-6 flex flex-col gap-5">
      <Link href="/" className="text-sm text-gray-400 hover:text-white">← 둘러보기</Link>

      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">
          {post.author.name ?? post.author.studentNo}
          <span className="ml-2 text-base font-normal text-gray-400">의 자료</span>
        </h1>
        {isOwner && (
          <Link href="/me" className="rounded-lg bg-gray-800 px-3 py-1.5 text-sm hover:bg-gray-700">
            내 자료 관리
          </Link>
        )}
      </div>

      <StudentDocViewer docs={docs} initialType={post.type} />
    </main>
  );
}
