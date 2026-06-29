"use client";

import Link from "next/link";
import { PostType, PostTypeLabels } from "@/constants/enums";

const TABS: { key: string; label: string }[] = [
  { key: "", label: "전체" },
  ...Object.values(PostType).map((t) => ({ key: t, label: PostTypeLabels[t] })),
];

export default function TypeTabs({ active }: { active: string }) {
  return (
    <div className="flex gap-2">
      {TABS.map((t) => (
        <Link
          key={t.key}
          href={t.key ? `/?type=${t.key}` : "/"}
          className={`rounded-full px-4 py-1.5 text-sm transition-colors ${
            active === t.key
              ? "bg-indigo-600 text-white"
              : "bg-gray-800 text-gray-300 hover:bg-gray-700"
          }`}
        >
          {t.label}
        </Link>
      ))}
    </div>
  );
}
