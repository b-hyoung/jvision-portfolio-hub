import Link from "next/link";
import { PostType, PostTypeLabels, PostTypeColors } from "@/constants/enums";

type StudentPost = { id: string; type: string };
type Student = {
  id: string;
  name: string | null;
  studentNo: string;
  posts: StudentPost[];
};

export default function StudentCard({ student }: { student: Student }) {
  const byType = new Map(student.posts.map((p) => [p.type, p.id]));
  const done = student.posts.length;
  // 첫 클릭(카드 본문) 시 열 기본 게시물
  const firstId = student.posts[0]?.id;

  return (
    <div className="flex flex-col gap-3 rounded-2xl bg-gray-900 p-5 ring-1 ring-gray-800 hover:ring-gray-700 transition">
      <div className="flex items-baseline justify-between gap-2">
        {firstId ? (
          <Link href={`/posts/${firstId}`} className="font-semibold text-lg hover:text-indigo-300">
            {student.name ?? student.studentNo}
          </Link>
        ) : (
          <span className="font-semibold text-lg">{student.name ?? student.studentNo}</span>
        )}
        <span className="text-xs text-gray-500">{done} / 3</span>
      </div>

      {/* 카테고리별 색상 표시 — 올린 건 컬러, 안 올린 건 흐리게 */}
      <div className="flex flex-wrap gap-1.5">
        {Object.values(PostType).map((t) => {
          const pid = byType.get(t);
          const color = PostTypeColors[t];
          if (pid) {
            return (
              <Link
                key={t}
                href={`/posts/${pid}`}
                className="rounded-full px-2.5 py-1 text-xs font-semibold transition hover:brightness-110"
                style={{ backgroundColor: `${color}26`, color }}
              >
                ● {PostTypeLabels[t]}
              </Link>
            );
          }
          return (
            <span
              key={t}
              className="rounded-full px-2.5 py-1 text-xs font-medium text-gray-600 ring-1 ring-gray-800"
            >
              ○ {PostTypeLabels[t]}
            </span>
          );
        })}
      </div>
    </div>
  );
}
