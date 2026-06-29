import { redirect } from "next/navigation";
import { getSessionUser } from "@/server/profile";
import PostForm from "@/components/posts/PostForm";
import { PostType, PostTypeLabels } from "@/constants/enums";

export default async function NewPostPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (!user.name) redirect("/onboarding");

  const { type } = await searchParams;
  // 카테고리는 반드시 슬롯에서 지정. 없으면 내 자료로 보내 슬롯을 고르게 한다.
  if (!type || !Object.values(PostType).includes(type as PostType)) {
    redirect("/me");
  }
  const category = type as PostType;

  return (
    <main className="mx-auto max-w-xl p-6 flex flex-col gap-6">
      <h1 className="text-2xl font-bold">{PostTypeLabels[category]} 올리기</h1>
      <PostForm initial={{ type: category }} />
    </main>
  );
}
