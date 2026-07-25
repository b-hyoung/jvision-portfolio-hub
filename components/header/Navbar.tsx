/** 네비게이션 메뉴 목록 */
"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { Suspense, useLayoutEffect, useRef, useState } from "react";

const ITEMS = [
  { key: "home", href: "/", label: "이력서 둘러보기" },
  { key: "ai", href: "/?type=AI_PROJECT", label: "AI Project" },
  { key: "me", href: "/me", label: "내 자료" },
] as const;

/** 현재 경로/쿼리로 활성 메뉴 키를 계산 (해당 없으면 null → 인디케이터 숨김) */
function activeKey(pathname: string, type: string | null): string | null {
  if (pathname.startsWith("/me")) return "me";
  if (pathname === "/") return type === "AI_PROJECT" ? "ai" : "home";
  return null;
}

function NavLinks() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const type = searchParams.get("type");

  const linkRefs = useRef<Record<string, HTMLAnchorElement | null>>({});
  const [indicator, setIndicator] = useState({ left: 0, width: 0, visible: false });

  useLayoutEffect(() => {
    const key = activeKey(pathname, type);
    const el = key ? linkRefs.current[key] : null;
    if (el) {
      setIndicator({ left: el.offsetLeft, width: el.offsetWidth, visible: true });
    } else {
      setIndicator((prev) => ({ ...prev, visible: false }));
    }
  }, [pathname, type]);

  const active = activeKey(pathname, type);

  return (
    <nav className="relative flex items-center gap-4 pb-1 text-sm text-gray-700 dark:text-gray-300">
      {ITEMS.map((item) => (
        <Link
          key={item.key}
          href={item.href}
          ref={(el) => {
            linkRefs.current[item.key] = el;
          }}
          className={`inline-flex min-h-11 items-center transition-colors hover:text-gray-900 dark:hover:text-gray-50 ${
            active === item.key ? "text-gray-900 dark:text-gray-50" : ""
          }`}
        >
          {item.label}
        </Link>
      ))}

      {/* 현재 페이지로 슬라이드되는 밑줄 인디케이터 */}
      <span
        aria-hidden
        className="pointer-events-none absolute bottom-0 h-0.5 rounded-full bg-indigo-600 transition-all duration-300 ease-out"
        style={{
          left: indicator.left,
          width: indicator.width,
          opacity: indicator.visible ? 1 : 0,
        }}
      />
    </nav>
  );
}

const Navbar = () => {
  const { data: session } = useSession();
  if (!session?.user) return null;

  return (
    <Suspense fallback={<nav className="h-6" />}>
      <NavLinks />
    </Suspense>
  );
};

export default Navbar;
