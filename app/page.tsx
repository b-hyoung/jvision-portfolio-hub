import { redirect } from "next/navigation";
import Link from "next/link";
import { getSessionUser } from "@/server/profile";
import { listPosts } from "@/server/posts";
import { PostType, PostTypeLabels } from "@/constants/enums";
import PostCard from "@/components/posts/PostCard";
import TypeTabs from "@/components/posts/TypeTabs";

type ListedPost = Awaited<ReturnType<typeof listPosts>>[number];

function PostGrid({ posts }: { posts: ListedPost[] }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {posts.map((p) => (
        <PostCard key={p.id} post={p} />
      ))}
    </div>
  );
}

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
      ) : type ? (
        // 특정 카테고리 탭: 해당 카테고리만
        <PostGrid posts={posts} />
      ) : (
        // 전체 보기: 카테고리별 섹션으로 나눠서 표시
        <div className="flex flex-col gap-8">
          {Object.values(PostType).map((t) => {
            const group = posts.filter((p) => p.type === t);
            return (
              <section key={t} className="flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold">{PostTypeLabels[t]}</h2>
                  <span className="text-sm text-gray-500">{group.length}</span>
                </div>
                {group.length === 0 ? (
                  <p className="text-sm text-gray-600">아직 없습니다.</p>
                ) : (
                  <PostGrid posts={group} />
                )}
              </section>
            );
          })}
        </div>
      )}
    </main>
  );
}
