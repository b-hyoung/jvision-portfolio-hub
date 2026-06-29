import { redirect } from "next/navigation";
import Link from "next/link";
import { getSessionUser } from "@/server/profile";
import { prisma } from "@/lib/prisma";
import { PostType, PostTypeLabels } from "@/constants/enums";
import DeleteButton from "@/components/posts/DeleteButton";

export default async function MePage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (!user.name) redirect("/onboarding");

  const posts = await prisma.post.findMany({
    where: { authorId: user.id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <main className="mx-auto max-w-3xl p-6 flex flex-col gap-6">
      <section className="rounded-2xl bg-gray-900 p-5 ring-1 ring-gray-800">
        <h2 className="text-lg font-bold">내 프로필</h2>
        <p className="mt-1 text-sm text-gray-400">
          {user.name} · {user.studentNo}
          {user.department && ` · ${user.department}`}
        </p>
        <Link href="/onboarding" className="mt-3 inline-block rounded-lg bg-gray-800 px-3 py-1.5 text-sm hover:bg-gray-700">
          이름/학과 수정
        </Link>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-bold">내 게시물 ({posts.length})</h2>
        {posts.length === 0 ? (
          <p className="text-gray-500">아직 올린 게시물이 없습니다.</p>
        ) : (
          posts.map((p) => (
            <div key={p.id} className="flex items-center justify-between rounded-xl bg-gray-900 p-4 ring-1 ring-gray-800">
              <Link href={`/posts/${p.id}`} className="flex flex-col">
                <span className="text-xs text-indigo-300">
                  {PostTypeLabels[p.type as PostType] ?? p.type}
                </span>
                <span className="font-medium">{p.title}</span>
              </Link>
              <div className="flex items-center gap-2">
                <Link href={`/posts/${p.id}/edit`} className="rounded-lg bg-gray-800 px-3 py-1 text-xs hover:bg-gray-700">
                  수정
                </Link>
                <DeleteButton id={p.id} />
              </div>
            </div>
          ))
        )}
      </section>
    </main>
  );
}
