"use client";

import { useState } from "react";
import { PostType, PostTypeLabels } from "@/constants/enums";

export type ViewerDoc = {
  type: string;
  fileUrl: string | null;
  previewUrl: string | null;
  fileName: string | null;
  description: string | null;
  linkUrl: string | null;
  deployUrl: string | null;
  linkPreview: {
    title: string | null;
    description: string | null;
    image: string | null;
    siteName: string | null;
  } | null;
};

export default function StudentDocViewer({
  docs,
  initialType,
  types,
}: {
  docs: ViewerDoc[];
  initialType: string;
  types?: PostType[];
}) {
  const tabs = types ?? Object.values(PostType);
  const byType = new Map(docs.map((d) => [d.type, d]));
  const [active, setActive] = useState(initialType);
  const doc = byType.get(active);

  return (
    <div className="flex flex-col gap-4">
      {/* 카테고리 탭 — 한 화면에서 바꿔가며 보기 */}
      <div className="flex gap-2">
        {tabs.map((t) => {
          const has = byType.has(t);
          return (
            <button
              key={t}
              type="button"
              disabled={!has}
              onClick={() => has && setActive(t)}
              className={`rounded-full px-4 py-1.5 text-sm transition ${
                active === t
                  ? "bg-indigo-600 text-white"
                  : has
                    ? "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                    : "bg-gray-50 dark:bg-gray-950 text-gray-500 dark:text-gray-500 cursor-not-allowed"
              }`}
            >
              {PostTypeLabels[t]}
              {!has && " · 없음"}
            </button>
          );
        })}
      </div>

      {!doc ? (
        <p className="py-20 text-center text-gray-600 dark:text-gray-400">이 카테고리는 아직 자료가 없습니다.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {doc.description && (
            <p className="whitespace-pre-wrap text-gray-800 dark:text-gray-200">{doc.description}</p>
          )}

          {doc.linkUrl && (
            <a
              href={doc.linkUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex overflow-hidden rounded-2xl ring-1 ring-gray-200 dark:ring-gray-800 hover:ring-indigo-500 transition"
            >
              {doc.linkPreview?.image && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={doc.linkPreview.image} alt="" className="h-32 w-44 shrink-0 object-cover" />
              )}
              <div className="flex flex-col gap-1 p-4">
                <span className="text-xs text-gray-600 dark:text-gray-400">
                  {doc.linkPreview?.siteName ?? new URL(doc.linkUrl).host}
                </span>
                <span className="font-semibold line-clamp-1">
                  {doc.linkPreview?.title ?? doc.linkUrl}
                </span>
                {doc.linkPreview?.description && (
                  <span className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                    {doc.linkPreview.description}
                  </span>
                )}
                <span className="mt-1 text-xs text-indigo-600 dark:text-indigo-400">🔗 열기 →</span>
              </div>
            </a>
          )}

          {/* AI 프로젝트 HTML 링크는 바로 볼 수 있게 인라인 임베드 (차단 시 위 '열기'로 폴백) */}
          {doc.type === PostType.AI_PROJECT && doc.linkUrl && (
            <div className="flex flex-col gap-1">
              <iframe
                src={doc.linkUrl}
                title="발표자료 미리보기"
                loading="lazy"
                className="h-[88vh] w-full rounded-xl ring-1 ring-gray-200 dark:ring-gray-800 bg-white dark:bg-gray-900"
                sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
              />
              <p className="text-xs text-gray-600 dark:text-gray-400">
                화면이 비어 있으면 이 사이트가 임베드를 차단한 것입니다. 위 “🔗 열기”로 새 탭에서 확인하세요.
              </p>
            </div>
          )}

          {/* AI 프로젝트 배포 링크 — 열기 버튼 + 인라인 임베드 */}
          {doc.type === PostType.AI_PROJECT && doc.deployUrl && (
            <div className="flex flex-col gap-1">
              <a
                href={doc.deployUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="self-start rounded-xl bg-emerald-600 text-white px-4 py-2 text-sm font-semibold hover:bg-emerald-500"
              >
                🚀 배포 사이트 열기 →
              </a>
              <iframe
                src={doc.deployUrl}
                title="배포 사이트 미리보기"
                loading="lazy"
                className="h-[88vh] w-full rounded-xl ring-1 ring-gray-200 dark:ring-gray-800 bg-white dark:bg-gray-900"
                sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
              />
              <p className="text-xs text-gray-600 dark:text-gray-400">
                화면이 비어 있으면 이 사이트가 임베드를 차단한 것입니다. 위 “배포 사이트 열기”로 새 탭에서 확인하세요.
              </p>
            </div>
          )}

          {doc.fileUrl && (
            <div className="flex items-center gap-2">
              <a
                href={doc.fileUrl}
                download={doc.fileName ?? undefined}
                className="rounded-xl bg-indigo-600 text-white px-4 py-2 text-sm font-semibold hover:bg-indigo-500"
              >
                📎 {doc.fileName} 다운로드
              </a>
              {doc.previewUrl && (
                <a
                  href={doc.previewUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-xl bg-gray-100 dark:bg-gray-800 px-4 py-2 text-sm hover:bg-gray-200 dark:hover:bg-gray-700"
                >
                  ⤢ 새 탭에서 크게 보기
                </a>
              )}
            </div>
          )}

          {doc.previewUrl ? (
            <iframe
              src={`${doc.previewUrl}#view=FitH`}
              title="문서 미리보기"
              loading="lazy"
              className="h-[88vh] w-full rounded-xl ring-1 ring-gray-200 dark:ring-gray-800 bg-white dark:bg-gray-900"
            />
          ) : (
            doc.fileUrl && (
              <p className="text-sm text-gray-600 dark:text-gray-400">
                이 형식은 미리보기를 제공하지 않습니다. 다운로드해 확인하세요.
              </p>
            )
          )}
        </div>
      )}
    </div>
  );
}
