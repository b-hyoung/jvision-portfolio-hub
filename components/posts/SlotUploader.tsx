"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PostType, PostTypeLabels, PostTypeColors } from "@/constants/enums";

export type SlotPost = {
  id: string;
  fileName: string | null;
  linkUrl: string | null;
  deployUrl: string | null;
  description: string | null;
} | null;

export default function SlotUploader({
  type,
  post,
  defaultOpen = false,
}: {
  type: PostType;
  post: SlotPost;
  defaultOpen?: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(defaultOpen);
  const [file, setFile] = useState<File | null>(null);
  const [linkUrl, setLinkUrl] = useState(post?.linkUrl ?? "");
  const [deployUrl, setDeployUrl] = useState(post?.deployUrl ?? "");
  const [description, setDescription] = useState(post?.description ?? "");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const filled = Boolean(post);
  const isAiProject = type === PostType.AI_PROJECT;
  const color = PostTypeColors[type];
  const fileAccept = isAiProject
    ? ".pdf,.pptx,.ppt,application/pdf,application/vnd.openxmlformats-officedocument.presentationml.presentation"
    : ".pdf,.hwp,.hwpx,application/pdf";
  const fileHelp = isAiProject ? "PDF · PPTX · 최대 20MB" : "PDF · HWP · 최대 20MB";
  const linkHelp = isAiProject
    ? "발표자료 HTML 링크 (배포 슬라이드 등)"
    : "노션 · GitHub 등 외부 링크";

  const inputClass =
    "rounded-xl bg-gray-100 dark:bg-gray-800 px-4 py-2.5 text-base text-gray-900 dark:text-gray-50 placeholder:text-gray-600 dark:placeholder:text-gray-400 outline-none ring-1 ring-gray-300 dark:ring-gray-700 focus:ring-2 focus:ring-indigo-500";
  const labelClass = "text-base font-semibold text-gray-900 dark:text-gray-50";
  // 같은 페이지에 슬롯이 여러 개이므로 타입별로 고유한 input id 부여 (라벨 연결용)
  const fid = (name: string) => `${type}-${name}`;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const fd = new FormData();
    fd.set("type", type);
    fd.set("description", description ?? "");
    fd.set("linkUrl", linkUrl ?? "");
    fd.set("deployUrl", isAiProject ? deployUrl ?? "" : "");
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

  return (
    <div className="overflow-hidden rounded-2xl bg-white dark:bg-gray-900 ring-1 ring-gray-200 dark:ring-gray-800">
      {/* 아코디언 헤더 — 좌측 전체가 펼침 토글 */}
      <div className="flex items-center gap-3 p-4 sm:p-5">
        <button
          type="button"
          onClick={() => setOpen(!open)}
          aria-expanded={open}
          className="flex min-w-0 flex-1 items-center gap-3 text-left"
        >
          <span
            className="inline-flex h-2.5 w-2.5 shrink-0 rounded-full"
            style={{ backgroundColor: color }}
          />
          <span className="shrink-0 text-base font-bold text-gray-900 dark:text-gray-50">{PostTypeLabels[type]}</span>

          {filled ? (
            <span className="flex min-w-0 items-center gap-x-2 text-sm text-gray-600 dark:text-gray-400">
              {post!.fileName && (
                <span className="min-w-0 truncate text-gray-700 dark:text-gray-300">📎 {post!.fileName}</span>
              )}
              {post!.linkUrl && <span className="shrink-0">🔗 링크</span>}
              {post!.deployUrl && <span className="shrink-0 text-emerald-600 dark:text-emerald-400">🚀 배포</span>}
            </span>
          ) : (
            <span className="truncate text-sm text-gray-600 dark:text-gray-400">아직 올리지 않음 · 눌러서 올리기</span>
          )}

          <svg
            className={`ml-auto h-5 w-5 shrink-0 text-gray-600 dark:text-gray-400 transition-transform duration-300 ${
              open ? "rotate-180" : ""
            }`}
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden
          >
            <path
              fillRule="evenodd"
              d="M5.23 7.21a.75.75 0 011.06.02L10 11.17l3.71-3.94a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
              clipRule="evenodd"
            />
          </svg>
        </button>

        {filled && (
          <div className="flex shrink-0 items-center gap-2">
            <Link
              href={`/posts/${post!.id}`}
              className="inline-flex min-h-11 items-center rounded-lg bg-gray-100 dark:bg-gray-800 px-3.5 text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-700"
            >
              보기
            </Link>
            <button
              type="button"
              onClick={onDelete}
              className="inline-flex min-h-11 items-center rounded-lg bg-red-50 dark:bg-red-600/15 px-3.5 text-sm font-medium text-red-600 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-600/25"
            >
              삭제
            </button>
          </div>
        )}
      </div>

      {/* 아코디언 본문 — grid-rows 로 부드럽게 열고닫기 */}
      <div
        className={`grid transition-[grid-template-rows] duration-300 ease-out ${
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        }`}
      >
        <div className="overflow-hidden">
          <form onSubmit={onSubmit} className="flex flex-col gap-5 border-t border-gray-200 dark:border-gray-800 p-4 sm:p-5">
            <div className="flex flex-col gap-1.5">
              <label htmlFor={fid("file")} className={labelClass}>파일</label>
              <p className="text-sm text-gray-600 dark:text-gray-400">{fileHelp}</p>
              <input
                id={fid("file")}
                type="file"
                accept={fileAccept}
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                className="mt-1 block w-full text-sm text-gray-700 dark:text-gray-300 file:mr-3 file:rounded-lg file:border-0 file:bg-indigo-600 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-indigo-500"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor={fid("link")} className={labelClass}>
                링크 <span className="text-sm font-normal text-gray-600 dark:text-gray-400">(선택)</span>
              </label>
              <p className="text-sm text-gray-600 dark:text-gray-400">{linkHelp}</p>
              <input
                id={fid("link")}
                type="url"
                inputMode="url"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="https://..."
                className={inputClass}
              />
            </div>

            {isAiProject && (
              <div className="flex flex-col gap-1.5">
                <label htmlFor={fid("deploy")} className={labelClass}>
                  🚀 배포 링크 <span className="text-sm font-normal text-gray-600 dark:text-gray-400">(선택)</span>
                </label>
                <p className="text-sm text-gray-600 dark:text-gray-400">실제 배포된 사이트 주소</p>
                <input
                  id={fid("deploy")}
                  type="url"
                  inputMode="url"
                  value={deployUrl}
                  onChange={(e) => setDeployUrl(e.target.value)}
                  placeholder="https://..."
                  className={inputClass}
                />
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <label htmlFor={fid("desc")} className={labelClass}>
                한 줄 메모 <span className="text-sm font-normal text-gray-600 dark:text-gray-400">(선택)</span>
              </label>
              <input
                id={fid("desc")}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="예: 2024 하반기 백엔드 지원용"
                maxLength={200}
                className={inputClass}
              />
            </div>

            {error && (
              <p className="rounded-lg bg-red-50 dark:bg-red-600/15 px-4 py-2.5 text-sm font-medium text-red-600 dark:text-red-300">
                {error}
              </p>
            )}

            <div className="flex items-center gap-2">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 rounded-xl bg-indigo-600 text-white py-3 text-base font-bold hover:bg-indigo-500 disabled:opacity-50"
              >
                {loading ? "저장 중..." : filled ? "교체하기" : "올리기"}
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-xl bg-gray-100 dark:bg-gray-800 px-5 py-3 text-base font-medium hover:bg-gray-200 dark:hover:bg-gray-700"
              >
                닫기
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
