import { redirect } from "next/navigation";
import { getSessionUser } from "@/server/profile";
import PostForm from "@/components/posts/PostForm";
import { PostType } from "@/constants/enums";

export default async function NewPostPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (!user.name) redirect("/onboarding");

  const { type } = await searchParams;
  const preset =
    type && Object.values(PostType).includes(type as PostType)
      ? (type as PostType)
      : undefined;

  return (
    <main className="mx-auto max-w-xl p-6 flex flex-col gap-6">
      <h1 className="text-2xl font-bold">자료 올리기</h1>
      <PostForm initial={preset ? { type: preset } : undefined} />
    </main>
  );
}
