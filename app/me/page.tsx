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
    <main className="mx-auto max-w-3xl p-6 flex flex-col gap-6">
      <section className="rounded-2xl bg-gray-900 p-5 ring-1 ring-gray-800">
        <h2 className="text-lg font-bold">내 프로필</h2>
        <p className="mt-1 text-sm text-gray-400">
          {user.name} · {user.studentNo}
        </p>
        <Link href="/onboarding" className="mt-3 inline-block rounded-lg bg-gray-800 px-3 py-1.5 text-sm hover:bg-gray-700">
          이름 수정
        </Link>
      </section>

      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold">내 자료</h2>
          <span className="text-sm text-gray-400">{filled} / 3 완료</span>
        </div>
        <p className="text-sm text-gray-500">이력서·자소서·포트폴리오를 각각 올려주세요.</p>

        {slots.map((type) => {
          const p = byType.get(type);
          const slotPost: SlotPost = p
            ? { id: p.id, fileName: p.fileName, linkUrl: p.linkUrl, description: p.description }
            : null;
          return <SlotUploader key={type} type={type} post={slotPost} />;
        })}
      </section>
    </main>
  );
}
