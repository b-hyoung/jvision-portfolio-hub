import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { getSessionUser } from "@/server/profile";
import { getPost, getPostsByAuthor } from "@/server/posts";
import { getLinkPreview } from "@/lib/link-preview";
import { PostType } from "@/constants/enums";
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

  // AI 프로젝트와 문서(이력서/자소서/포트폴리오)는 상세 뷰도 분리 — 연 자료와 같은 그룹만 보여준다
  const DOC_TYPES: PostType[] = [PostType.RESUME, PostType.COVER_LETTER, PostType.PORTFOLIO];
  const scopeTypes: PostType[] =
    post.type === PostType.AI_PROJECT ? [PostType.AI_PROJECT] : DOC_TYPES;
  const scopedPosts = authorPosts.filter((p) => scopeTypes.includes(p.type as PostType));

  const docs: ViewerDoc[] = await Promise.all(
    scopedPosts.map(async (p) => ({
      type: p.type,
      fileUrl: p.filePath ? `/api/files/${p.filePath}` : null,
      previewUrl: p.previewPath ? `/api/files/${p.previewPath}` : null,
      fileName: p.fileName,
      description: p.description,
      linkUrl: p.linkUrl,
      deployUrl: p.deployUrl,
      linkPreview: p.linkUrl ? await getLinkPreview(p.linkUrl) : null,
    }))
  );

  return (
    <main className="mx-auto max-w-6xl p-6 flex flex-col gap-5">
      <Link href="/" className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-50">← 둘러보기</Link>

      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">
          {post.author.name ?? post.author.studentNo}
          <span className="ml-2 text-base font-normal text-gray-600 dark:text-gray-400">의 자료</span>
        </h1>
        {isOwner && (
          <Link href="/me" className="rounded-lg bg-gray-100 dark:bg-gray-800 px-3 py-1.5 text-sm hover:bg-gray-200 dark:hover:bg-gray-700">
            내 자료 관리
          </Link>
        )}
      </div>

      <StudentDocViewer docs={docs} initialType={post.type} types={scopeTypes} />
    </main>
  );
}
