import { redirect } from "next/navigation";
import Link from "next/link";
import { getSessionUser } from "@/server/profile";
import { getPostsByAuthor } from "@/server/posts";
import { PostType } from "@/constants/enums";
import SlotUploader, { type SlotPost } from "@/components/posts/SlotUploader";

export default async function MePage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (!user.name) redirect("/onboarding");

  const posts = await getPostsByAuthor(user.id);
  const byType = new Map(posts.map((p) => [p.type, p]));
  const slots = Object.values(PostType);
  const filled = slots.filter((t) => byType.has(t)).length;

  return (
    <main className="mx-auto max-w-3xl p-6 flex flex-col gap-8">
      <h1 className="text-3xl font-bold">내 자료 올리기</h1>

      <section className="rounded-2xl bg-white dark:bg-gray-900 p-6 ring-1 ring-gray-200 dark:ring-gray-800">
        <h2 className="text-xl font-bold">내 프로필</h2>
        <p className="mt-2 text-base text-gray-700 dark:text-gray-300">
          {user.name} · {user.studentNo}
        </p>
        <Link href="/onboarding" className="mt-4 inline-block rounded-lg bg-gray-100 dark:bg-gray-800 px-4 py-2 text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-700">
          이름 수정
        </Link>
      </section>

      <section className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-xl font-bold">내 자료</h2>
          <span className="rounded-full bg-indigo-100 dark:bg-indigo-600/20 px-3 py-1 text-sm font-semibold text-indigo-700 dark:text-indigo-300">
            {filled} / {slots.length} 완료
          </span>
        </div>
        <p className="text-base text-gray-600 dark:text-gray-400">이력서·자소서·포트폴리오·AI 프로젝트를 각각 올려주세요.</p>

        {slots.map((type) => {
          const p = byType.get(type);
          const slotPost: SlotPost = p
            ? { id: p.id, fileName: p.fileName, linkUrl: p.linkUrl, deployUrl: p.deployUrl, description: p.description }
            : null;
          return <SlotUploader key={type} type={type} post={slotPost} />;
        })}
      </section>
    </main>
  );
}
