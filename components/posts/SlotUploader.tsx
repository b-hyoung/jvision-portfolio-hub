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
    try {
      let filePath: string | null = null;
      let uploadedName: string | null = null;

      if (file) {
        if (file.size > 20 * 1024 * 1024)
          throw new Error("파일 크기는 20MB를 넘을 수 없습니다.");

        // 1) 서명 업로드 URL 발급 (작은 요청)
        const signRes = await fetch("/api/uploads", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fileName: file.name, size: file.size }),
        });
        if (!signRes.ok) {
          const d = await signRes.json().catch(() => ({}));
          throw new Error(d.error ?? "업로드 준비에 실패했습니다.");
        }
        const { signedUrl, path } = await signRes.json();

        // 2) Supabase로 파일 직접 PUT (Vercel 함수 우회 → 20MB까지 가능)
        const putRes = await fetch(signedUrl, {
          method: "PUT",
          headers: { "Content-Type": file.type || "application/octet-stream" },
          body: file,
        });
        if (!putRes.ok) throw new Error("파일 업로드에 실패했습니다.");

        filePath = path;
        uploadedName = file.name;
      }

      // 3) 메타데이터만 저장 (작은 JSON)
      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          description: description ?? "",
          linkUrl: linkUrl ?? "",
          deployUrl: isAiProject ? deployUrl ?? "" : "",
          filePath,
          fileName: uploadedName,
        }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error ?? "저장에 실패했습니다.");
      }

      setOpen(false);
      setFile(null);
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function onDelete() {
    if (!post) return;
    if (!confirm(`${PostTypeLabels[type]} 전체를 삭제할까요?`)) return;
    const res = await fetch(`/api/posts/${post.id}`, { method: "DELETE" });
    if (res.ok) router.refresh();
    else alert("삭제에 실패했습니다.");
  }

  // 구분별 삭제: 파일 / 링크 / 배포 링크를 각각 제거 (다 비면 서버가 슬롯을 지움)
  async function onClear(part: "file" | "link" | "deploy", label: string) {
    if (!post) return;
    if (!confirm(`${label}을(를) 삭제할까요?`)) return;
    const res = await fetch(`/api/posts/${post.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clear: part }),
    });
    if (res.ok) router.refresh();
    else {
      const d = await res.json().catch(() => ({}));
      alert(d.error ?? "삭제에 실패했습니다.");
    }
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

      {/* 올린 항목 — 파일/링크/배포를 각각 × 로 삭제 (파일만 내리고 링크만 남기기 등) */}
      {filled && (post!.fileName || post!.linkUrl || post!.deployUrl) && (
        <div className="flex flex-wrap items-center gap-2 border-t border-gray-200 dark:border-gray-800 px-4 py-3 sm:px-5">
          <span className="text-xs text-gray-500 dark:text-gray-400">올린 항목</span>
          {post!.fileName && (
            <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 dark:bg-gray-800 px-3 py-1 text-xs">
              <span className="max-w-[40vw] truncate sm:max-w-xs">📎 {post!.fileName}</span>
              <button
                type="button"
                onClick={() => onClear("file", "파일")}
                aria-label="파일 삭제"
                className="ml-0.5 rounded-full px-1.5 py-0.5 text-gray-500 hover:text-red-600 dark:hover:text-red-400"
              >
                ×
              </button>
            </span>
          )}
          {post!.linkUrl && (
            <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 dark:bg-gray-800 px-3 py-1 text-xs">
              🔗 링크
              <button
                type="button"
                onClick={() => onClear("link", "링크")}
                aria-label="링크 삭제"
                className="ml-0.5 rounded-full px-1.5 py-0.5 text-gray-500 hover:text-red-600 dark:hover:text-red-400"
              >
                ×
              </button>
            </span>
          )}
          {post!.deployUrl && (
            <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 dark:bg-gray-800 px-3 py-1 text-xs">
              🚀 배포
              <button
                type="button"
                onClick={() => onClear("deploy", "배포 링크")}
                aria-label="배포 링크 삭제"
                className="ml-0.5 rounded-full px-1.5 py-0.5 text-gray-500 hover:text-red-600 dark:hover:text-red-400"
              >
                ×
              </button>
            </span>
          )}
        </div>
      )}

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
