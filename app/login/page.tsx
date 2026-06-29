"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Input from "@/components/ui/input";
import { loginFormSchema } from "@/validations/auth";

export default function LoginPage() {
  const router = useRouter();
  const [studentNo, setStudentNo] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const parsed = loginFormSchema.safeParse({ studentNo, password });
    if (!parsed.success) {
      setError(parsed.error.issues[0].message);
      return;
    }

    setLoading(true);
    const res = await signIn("credentials", {
      redirect: false,
      studentNo,
      password,
    });
    setLoading(false);

    if (res?.error) {
      setError(res.error);
      return;
    }
    router.push("/");
    router.refresh();
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-sm flex flex-col gap-4 rounded-2xl bg-gray-900 p-8 ring-1 ring-gray-800"
      >
        <div className="flex flex-col gap-1">
          <span className="text-xs font-semibold tracking-widest text-indigo-400 uppercase">
            JVision Hub
          </span>
          <h1 className="text-2xl font-bold">로그인</h1>
          <p className="text-sm text-gray-400">비전대 포털 학번/비밀번호로 로그인</p>
        </div>

        <Input
          placeholder="학번"
          value={studentNo}
          onChange={(e) => setStudentNo(e.target.value)}
        />
        <Input
          type="password"
          placeholder="비밀번호"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        {error && <p className="text-sm text-red-400">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="mt-2 rounded-xl bg-indigo-600 py-2.5 font-semibold hover:bg-indigo-500 disabled:opacity-50 transition-colors"
        >
          {loading ? "확인 중..." : "로그인"}
        </button>
        <p className="text-xs text-gray-500 text-center">
          비밀번호는 저장되지 않으며 포털 인증에만 사용됩니다.
        </p>
      </form>
    </main>
  );
}
