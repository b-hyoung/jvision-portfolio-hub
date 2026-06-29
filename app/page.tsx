import { redirect } from "next/navigation";
import Link from "next/link";
import { getSessionUser } from "@/server/profile";
import { listStudents } from "@/server/posts";
import { PostType, PostTypeLabels, PostTypeColors } from "@/constants/enums";
import StudentCard from "@/components/posts/StudentCard";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (!user.name) redirect("/onboarding");

  const { q } = await searchParams;
  const students = await listStudents(q);

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

      {/* 색상 범례 */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-gray-400">
        <span className="text-gray-500">색상 =</span>
        {Object.values(PostType).map((t) => (
          <span key={t} className="flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: PostTypeColors[t] }} />
            {PostTypeLabels[t]}
          </span>
        ))}
        <span className="text-gray-600">· 카드를 누르면 그 학생의 자료를 탭으로 둘러볼 수 있어요</span>
      </div>

      {students.length === 0 ? (
        <p className="py-20 text-center text-gray-500">아직 올린 학생이 없습니다.</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {students.map((s) => (
            <StudentCard key={s.id} student={s} />
          ))}
        </div>
      )}
    </main>
  );
}
