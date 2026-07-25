"use client";

import { useEffect, useRef, useState } from "react";
import { PostType } from "@/constants/enums";
import SlotUploader, { type SlotPost } from "./SlotUploader";

type Slot = { type: PostType; post: SlotPost };

export default function UploadModalButton({
  slots,
  scopeLabel,
}: {
  slots: Slot[];
  scopeLabel: string; // 예: "내 자료", "AI 프로젝트"
}) {
  const [open, setOpen] = useState(false);
  const hasAny = slots.some((s) => s.post);
  const single = slots.length === 1;

  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // ESC 닫기 + 배경 스크롤 잠금 + 포커스 트랩 + 닫을 때 트리거로 포커스 복귀
  useEffect(() => {
    if (!open) return;
    const panel = panelRef.current;
    const focusables = () =>
      panel
        ? Array.from(
            panel.querySelectorAll<HTMLElement>(
              'a[href],button:not([disabled]),input:not([disabled]),textarea,select,[tabindex]:not([tabindex="-1"])'
            )
          ).filter((el) => el.offsetParent !== null)
        : [];

    // 열릴 때 첫 포커스 요소로 이동
    focusables()[0]?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        return;
      }
      if (e.key === "Tab") {
        const items = focusables();
        if (items.length === 0) return;
        const first = items[0];
        const last = items[items.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
      triggerRef.current?.focus(); // 닫히면 트리거로 복귀
    };
  }, [open]);

  const label = `${scopeLabel} ${hasAny ? "수정" : "올리기"}`;

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-xl bg-indigo-600 text-white px-4 py-2.5 text-sm font-semibold hover:bg-indigo-500 transition-colors"
      >
        {label}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/70 p-4 sm:p-6"
          onClick={() => setOpen(false)}
        >
          <div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="upload-modal-title"
            className="mt-8 w-full max-w-2xl rounded-2xl bg-gray-50 dark:bg-gray-950 p-5 ring-1 ring-gray-200 dark:ring-gray-800 sm:p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 id="upload-modal-title" className="text-xl font-bold">
                {label}
              </h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="닫기"
                className="inline-flex min-h-11 items-center rounded-lg bg-gray-100 dark:bg-gray-800 px-4 text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-700"
              >
                ✕ 닫기
              </button>
            </div>

            <div className="flex flex-col gap-3">
              {slots.map((s) => (
                <SlotUploader
                  key={s.type}
                  type={s.type}
                  post={s.post}
                  defaultOpen={single}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
