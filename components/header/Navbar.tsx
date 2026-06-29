/** 네비게이션 메뉴 목록 */
"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";

const Navbar = () => {
  const { data: session } = useSession();
  if (!session?.user) return null;

  return (
    <nav className="flex items-center gap-4 text-sm text-gray-300">
      <Link href="/" className="hover:text-white">둘러보기</Link>
      <Link href="/posts/new" className="hover:text-white">새 글</Link>
      <Link href="/me" className="hover:text-white">내 보관함</Link>
    </nav>
  );
};

export default Navbar;
