/** 인증 관련 로직
 * 로그인, 로그아웃 버튼과 관련된 컴포넌트
 */
"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";

const AuthButtons = () => {
  const { data: session, status } = useSession();

  if (status === "loading") return null;

  if (!session?.user) {
    return (
      <Link href="/login" className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-semibold hover:bg-indigo-500">
        로그인
      </Link>
    );
  }

  return (
    <div className="flex items-center gap-3 text-sm">
      <span className="text-gray-400">{session.user.name ?? session.user.studentNo}</span>
      <button
        onClick={() => signOut({ callbackUrl: "/login" })}
        className="rounded-lg bg-gray-800 px-3 py-1.5 hover:bg-gray-700"
      >
        로그아웃
      </button>
    </div>
  );
};

export default AuthButtons;
