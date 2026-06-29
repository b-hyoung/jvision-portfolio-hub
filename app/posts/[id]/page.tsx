import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { getSessionUser } from "@/server/profile";
import { getPost } from "@/server/posts";
import { PostType, PostTypeLabels } from "@/constants/enums";
import LinkPreviewCard from "@/components/posts/LinkPreviewCard";

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
  const fileUrl = post.filePath ? `/api/files/${post.filePath}` : null;
  const previewUrl = post.previewPath ? `/api/files/${post.previewPath}` : null;

  return (
    <main className="mx-auto max-w-3xl p-6 flex flex-col gap-5">
      <Link href="/" className="text-sm text-gray-400 hover:text-white">← 둘러보기</Link>

      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-2">
          <span className="w-fit rounded-full bg-indigo-600/20 px-2.5 py-0.5 text-xs text-indigo-300">
            {PostTypeLabels[post.type as PostType] ?? post.type}
          </span>
          <h1 className="text-2xl font-bold">
            {post.author.name ?? post.author.studentNo}
            <span className="ml-2 text-base font-normal text-gray-400">
              {PostTypeLabels[post.type as PostType] ?? post.type}
            </span>
          </h1>
        </div>
        {isOwner && (
          <Link href={`/posts/${post.id}/edit`} className="rounded-lg bg-gray-800 px-3 py-1.5 text-sm hover:bg-gray-700">
            수정/삭제
          </Link>
        )}
      </div>

      {post.description && (
        <p className="whitespace-pre-wrap text-gray-200">{post.description}</p>
      )}

      {post.linkUrl && <LinkPreviewCard url={post.linkUrl} />}

      {fileUrl && (
        <div className="flex flex-col gap-3">
          <a href={fileUrl} download={post.fileName ?? undefined} className="w-fit rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold hover:bg-indigo-500">
            📎 {post.fileName} 다운로드
          </a>
          {previewUrl ? (
            <iframe src={previewUrl} className="h-[80vh] w-full rounded-xl ring-1 ring-gray-800" />
          ) : (
            <p className="text-sm text-gray-500">
              이 형식은 미리보기를 제공하지 않습니다. 다운로드해 확인하세요.
            </p>
          )}
        </div>
      )}
    </main>
  );
}
