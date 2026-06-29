import { redirect, notFound } from "next/navigation";
import { getSessionUser } from "@/server/profile";
import { getPost } from "@/server/posts";
import PostForm from "@/components/posts/PostForm";

export default async function EditPostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  const { id } = await params;
  const post = await getPost(id);
  if (!post) notFound();
  if (post.author.id !== user.id) redirect(`/posts/${id}`);

  return (
    <main className="mx-auto max-w-xl p-6 flex flex-col gap-6">
      <h1 className="text-2xl font-bold">게시물 수정</h1>
      <PostForm
        initial={{
          id: post.id,
          type: post.type,
          description: post.description,
          linkUrl: post.linkUrl,
          fileName: post.fileName,
        }}
      />
    </main>
  );
}
