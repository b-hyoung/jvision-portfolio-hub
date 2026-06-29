"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PostType, PostTypeLabels } from "@/constants/enums";

type Initial = {
  id?: string;
  type: string; // 카테고리는 슬롯에서 고정 (이력서/자소서/포트폴리오)
  description?: string | null;
  linkUrl?: string | null;
  fileName?: string | null;
};

export default function PostForm({ initial }: { initial: Initial }) {
  const router = useRouter();
  const editing = Boolean(initial.id);
  const type = initial.type;
  const [description, setDescription] = useState(initial.description ?? "");
  const [linkUrl, setLinkUrl] = useState(initial.linkUrl ?? "");
  const [file, setFile] = useState<File | null>(null);
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

    const url = editing ? `/api/posts/${initial.id}` : "/api/posts";
    const res = await fetch(url, { method: editing ? "PATCH" : "POST", body: fd });
    setLoading(false);

    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setError(d.error ?? "저장에 실패했습니다.");
      return;
    }
    const data = await res.json().catch(() => ({}));
    router.push(editing ? `/posts/${initial.id}` : `/posts/${data.id}`);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      {/* 카테고리는 고정 (이 슬롯 전용 업로드) */}
      <span className="w-fit rounded-full bg-indigo-600 px-4 py-1.5 text-sm font-semibold">
        {PostTypeLabels[type as PostType] ?? type}
      </span>

      <input
        value={description ?? ""}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="한 줄 메모 (선택)"
        maxLength={200}
        className="rounded-xl bg-gray-800 px-4 py-2.5 text-sm outline-none ring-1 ring-gray-700 focus:ring-indigo-500"
      />
      <input
        value={linkUrl ?? ""}
        onChange={(e) => setLinkUrl(e.target.value)}
        placeholder="외부 링크 (노션/GitHub 등, 선택)"
        className="rounded-xl bg-gray-800 px-4 py-2.5 text-sm outline-none ring-1 ring-gray-700 focus:ring-indigo-500"
      />
      <label className="text-sm text-gray-400">
        파일 (PDF / HWP, 최대 20MB)
        {initial?.fileName && <span className="ml-2 text-gray-500">현재: {initial.fileName}</span>}
        <input
          type="file"
          accept=".pdf,.hwp,.hwpx,application/pdf"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          className="mt-1 block w-full text-sm text-gray-300 file:mr-3 file:rounded-lg file:border-0 file:bg-gray-700 file:px-3 file:py-1.5 file:text-white"
        />
      </label>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="rounded-xl bg-indigo-600 py-2.5 font-semibold hover:bg-indigo-500 disabled:opacity-50 transition-colors"
      >
        {loading ? "저장 중..." : editing ? "수정하기" : "올리기"}
      </button>
    </form>
  );
}
