import Link from "next/link";
import { PostType, PostTypeLabels, PostTypeColors } from "@/constants/enums";

type StudentPost = { id: string; type: string };
type Student = {
  id: string;
  name: string | null;
  studentNo: string;
  posts: StudentPost[];
};

export default function StudentCard({
  student,
  types,
}: {
  student: Student;
  types?: PostType[];
}) {
  const shown = types ?? Object.values(PostType);
  const byType = new Map(student.posts.map((p) => [p.type, p.id]));
  const done = shown.filter((t) => byType.has(t)).length;
  // '자료 보기'는 이 화면에 해당하는 카테고리 자료를 먼저 연다
  const firstId = shown.map((t) => byType.get(t)).find(Boolean) ?? student.posts[0]?.id;

  return (
    <div className="flex flex-col gap-3 rounded-2xl bg-white dark:bg-gray-900 p-5 ring-1 ring-gray-200 dark:ring-gray-800 hover:ring-gray-300 dark:hover:ring-gray-700 transition">
      <div className="flex items-baseline justify-between gap-2">
        <span className="font-semibold text-lg">{student.name ?? student.studentNo}</span>
        <span className="text-xs text-gray-600 dark:text-gray-400">{done} / {shown.length}</span>
      </div>

      {/* 카테고리별 색상 — 올린 건 컬러(눌러서 해당 자료로), 안 올린 건 흐리게 */}
      <div className="flex flex-wrap gap-1.5">
        {shown.map((t) => {
          const pid = byType.get(t);
          const color = PostTypeColors[t];
          if (pid) {
            return (
              <Link
                key={t}
                href={`/posts/${pid}`}
                className="rounded-full px-2.5 py-1 text-xs font-semibold transition hover:brightness-110 active:scale-95"
                style={{ backgroundColor: `${color}26`, color }}
              >
                ● {PostTypeLabels[t]}
              </Link>
            );
          }
          return (
            <span
              key={t}
              className="rounded-full px-2.5 py-1 text-xs font-medium text-gray-600 dark:text-gray-400 ring-1 ring-gray-200 dark:ring-gray-800"
            >
              ○ {PostTypeLabels[t]}
            </span>
          );
        })}
      </div>

      {/* 명확한 보기 버튼 — 누르면 이 학생의 자료를 탭으로 둘러봄 */}
      {firstId && (
        <Link
          href={`/posts/${firstId}`}
          className="mt-1 inline-flex min-h-11 items-center justify-center rounded-xl bg-indigo-600 text-sm font-semibold text-white transition hover:bg-indigo-500 active:scale-[0.98]"
        >
          자료 보기 →
        </Link>
      )}
    </div>
  );
}
