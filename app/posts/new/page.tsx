import { redirect } from "next/navigation";
import { getSessionUser } from "@/server/profile";
import PostForm from "@/components/posts/PostForm";

export default async function NewPostPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (!user.name) redirect("/onboarding");

  return (
    <main className="mx-auto max-w-xl p-6 flex flex-col gap-6">
      <h1 className="text-2xl font-bold">새 게시물</h1>
      <PostForm />
    </main>
  );
}
