"use client";

import { useRouter } from "next/navigation";

export default function DeleteButton({ id }: { id: string }) {
  const router = useRouter();
  async function onDelete() {
    if (!confirm("정말 삭제하시겠습니까?")) return;
    const res = await fetch(`/api/posts/${id}`, { method: "DELETE" });
    if (res.ok) router.refresh();
    else alert("삭제에 실패했습니다.");
  }
  return (
    <button onClick={onDelete} className="rounded-lg bg-red-600/20 px-3 py-1 text-xs text-red-300 hover:bg-red-600/30">
      삭제
    </button>
  );
}
