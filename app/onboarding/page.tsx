"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Input from "@/components/ui/input";

export default function OnboardingPage() {
  const router = useRouter();
  const { update } = useSession();
  const [name, setName] = useState("");
  const [department, setDepartment] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const res = await fetch("/api/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, department }),
    });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setError(d.error ?? "저장에 실패했습니다.");
      return;
    }
    await update();
    router.push("/");
    router.refresh();
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-sm flex flex-col gap-4 rounded-2xl bg-gray-900 p-8 ring-1 ring-gray-800"
      >
        <h1 className="text-2xl font-bold">프로필 설정</h1>
        <p className="text-sm text-gray-400">다른 학생에게 보일 이름을 입력하세요.</p>
        <Input placeholder="이름 (필수)" value={name} onChange={(e) => setName(e.target.value)} />
        <Input placeholder="학과 (선택)" value={department} onChange={(e) => setDepartment(e.target.value)} />
        {error && <p className="text-sm text-red-400">{error}</p>}
        <button type="submit" className="mt-2 rounded-xl bg-indigo-600 py-2.5 font-semibold hover:bg-indigo-500 transition-colors">
          저장하고 시작하기
        </button>
      </form>
    </main>
  );
}
