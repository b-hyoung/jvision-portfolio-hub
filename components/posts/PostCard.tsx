import Link from "next/link";
import { PostType, PostTypeLabels } from "@/constants/enums";

type CardPost = {
  id: string;
  type: string;
  title: string;
  description: string | null;
  linkUrl: string | null;
  fileName: string | null;
  author: { name: string | null; studentNo: string; department: string | null };
};

export default function PostCard({ post }: { post: CardPost }) {
  const label = PostTypeLabels[post.type as PostType] ?? post.type;
  return (
    <Link
      href={`/posts/${post.id}`}
      className="flex flex-col gap-2 rounded-2xl bg-gray-900 p-5 ring-1 ring-gray-800 hover:ring-indigo-500 transition"
    >
      <span className="w-fit rounded-full bg-indigo-600/20 px-2.5 py-0.5 text-xs text-indigo-300">
        {label}
      </span>
      <h3 className="font-semibold text-lg line-clamp-1">{post.title}</h3>
      {post.description && (
        <p className="text-sm text-gray-400 line-clamp-2">{post.description}</p>
      )}
      <div className="mt-auto flex items-center gap-2 pt-2 text-xs text-gray-500">
        <span>{post.author.name ?? post.author.studentNo}</span>
        {post.author.department && <span>· {post.author.department}</span>}
        {post.fileName && <span>· 📎 파일</span>}
        {post.linkUrl && <span>· 🔗 링크</span>}
      </div>
    </Link>
  );
}
