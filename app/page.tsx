import { redirect } from "next/navigation";
import Link from "next/link";
import { getSessionUser } from "@/server/profile";
import { listPosts } from "@/server/posts";
import { PostType } from "@/constants/enums";
import PostCard from "@/components/posts/PostCard";
import TypeTabs from "@/components/posts/TypeTabs";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; q?: string }>;
}) {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (!user.name) redirect("/onboarding");

  const { type: typeParam, q } = await searchParams;
  const type =
    typeParam && Object.values(PostType).includes(typeParam as PostType)
      ? (typeParam as PostType)
      : undefined;

  const posts = await listPosts({ type, q });

  return (
    <main className="mx-auto max-w-5xl p-6 flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">둘러보기</h1>
        <Link href="/me" className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold hover:bg-indigo-500 transition-colors">
          내 자료 올리기
        </Link>
      </div>

      <form className="flex gap-2">
        <input
          name="q"
          defaultValue={q ?? ""}
          placeholder="이름·학번 검색"
          className="flex-1 rounded-xl bg-gray-800 px-4 py-2 text-sm outline-none ring-1 ring-gray-700 focus:ring-indigo-500"
        />
        <button className="rounded-xl bg-gray-700 px-4 text-sm hover:bg-gray-600">검색</button>
      </form>

      <TypeTabs active={typeParam ?? ""} />

      {posts.length === 0 ? (
        <p className="py-20 text-center text-gray-500">아직 게시물이 없습니다.</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((p) => (
            <PostCard key={p.id} post={p} />
          ))}
        </div>
      )}
    </main>
  );
}
