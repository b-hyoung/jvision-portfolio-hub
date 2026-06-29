"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PostType, PostTypeLabels } from "@/constants/enums";

export type SlotPost = {
  id: string;
  fileName: string | null;
  linkUrl: string | null;
  description: string | null;
} | null;

export default function SlotUploader({
  type,
  post,
}: {
  type: PostType;
  post: SlotPost;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false); // 업로드/교체 폼 열림
  const [file, setFile] = useState<File | null>(null);
  const [linkUrl, setLinkUrl] = useState(post?.linkUrl ?? "");
  const [description, setDescription] = useState(post?.description ?? "");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const fd = new FormData();
    fd.set("type", type);
    fd.set("description", description ?? "");
    fd.set("linkUrl", linkUrl ?? "");
    if (file) fd.set("file", file);

    const res = await fetch("/api/posts", { method: "POST", body: fd });
    setLoading(false);
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setError(d.error ?? "저장에 실패했습니다.");
      return;
    }
    setOpen(false);
    setFile(null);
    router.refresh();
  }

  async function onDelete() {
    if (!post) return;
    if (!confirm(`${PostTypeLabels[type]}를 삭제할까요?`)) return;
    const res = await fetch(`/api/posts/${post.id}`, { method: "DELETE" });
    if (res.ok) router.refresh();
    else alert("삭제에 실패했습니다.");
  }

  const filled = Boolean(post);

  return (
    <div className="flex flex-col gap-3 rounded-2xl bg-gray-900 p-5 ring-1 ring-gray-800">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-indigo-600/20 px-2.5 py-0.5 text-xs text-indigo-300">
            {PostTypeLabels[type]}
          </span>
          {filled ? (
            <span className="text-sm text-gray-400">
              {post!.fileName ? `📎 ${post!.fileName}` : ""}
              {post!.linkUrl ? " 🔗 링크" : ""}
            </span>
          ) : (
            <span className="text-sm text-gray-600">아직 올리지 않음</span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {filled && (
            <Link
              href={`/posts/${post!.id}`}
              className="rounded-lg bg-gray-800 px-3 py-1 text-xs hover:bg-gray-700"
            >
              보기
            </Link>
          )}
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="rounded-lg bg-gray-800 px-3 py-1 text-xs hover:bg-gray-700"
          >
            {open ? "취소" : filled ? "교체" : "올리기"}
          </button>
          {filled && (
            <button
              type="button"
              onClick={onDelete}
              className="rounded-lg bg-red-600/20 px-3 py-1 text-xs text-red-300 hover:bg-red-600/30"
            >
              삭제
            </button>
          )}
        </div>
      </div>

      {open && (
        <form onSubmit={onSubmit} className="flex flex-col gap-3 border-t border-gray-800 pt-3">
          <label className="text-sm text-gray-400">
            파일 (PDF / HWP, 최대 20MB)
            <input
              type="file"
              accept=".pdf,.hwp,.hwpx,application/pdf"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="mt-1 block w-full text-sm text-gray-300 file:mr-3 file:rounded-lg file:border-0 file:bg-gray-700 file:px-3 file:py-1.5 file:text-white"
            />
          </label>
          <input
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            placeholder="외부 링크 (노션/GitHub 등, 선택)"
            className="rounded-xl bg-gray-800 px-4 py-2 text-sm outline-none ring-1 ring-gray-700 focus:ring-indigo-500"
          />
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="한 줄 메모 (선택)"
            maxLength={200}
            className="rounded-xl bg-gray-800 px-4 py-2 text-sm outline-none ring-1 ring-gray-700 focus:ring-indigo-500"
          />
          {error && <p className="text-sm text-red-400">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="rounded-xl bg-indigo-600 py-2 text-sm font-semibold hover:bg-indigo-500 disabled:opacity-50"
          >
            {loading ? "저장 중..." : filled ? "교체하기" : "올리기"}
          </button>
        </form>
      )}
    </div>
  );
}
