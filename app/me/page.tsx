import { redirect } from "next/navigation";
import Link from "next/link";
import { getSessionUser } from "@/server/profile";
import { getPostsByAuthor } from "@/server/posts";
import { PostType, PostTypeLabels } from "@/constants/enums";
import DeleteButton from "@/components/posts/DeleteButton";

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

        {slots.map((type) => {
          const post = byType.get(type);
          return (
            <div
              key={type}
              className="flex items-center justify-between rounded-xl bg-gray-900 p-4 ring-1 ring-gray-800"
            >
              <div className="flex items-center gap-3">
                <span className="rounded-full bg-indigo-600/20 px-2.5 py-0.5 text-xs text-indigo-300">
                  {PostTypeLabels[type]}
                </span>
                {post ? (
                  <span className="text-sm text-gray-400">
                    {post.fileName ? `📎 ${post.fileName}` : ""}
                    {post.linkUrl ? " 🔗 링크" : ""}
                  </span>
                ) : (
                  <span className="text-sm text-gray-600">아직 올리지 않음</span>
                )}
              </div>

              <div className="flex items-center gap-2">
                {post ? (
                  <>
                    <Link href={`/posts/${post.id}`} className="rounded-lg bg-gray-800 px-3 py-1 text-xs hover:bg-gray-700">
                      보기
                    </Link>
                    <Link href={`/posts/${post.id}/edit`} className="rounded-lg bg-gray-800 px-3 py-1 text-xs hover:bg-gray-700">
                      교체
                    </Link>
                    <DeleteButton id={post.id} />
                  </>
                ) : (
                  <Link
                    href={`/posts/new?type=${type}`}
                    className="rounded-lg bg-indigo-600 px-3 py-1 text-xs font-semibold hover:bg-indigo-500"
                  >
                    올리기
                  </Link>
                )}
              </div>
            </div>
          );
        })}
      </section>
    </main>
  );
}
