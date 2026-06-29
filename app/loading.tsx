// 페이지 이동 시 즉시 표시되는 스켈레톤 (클릭 직후 반응 피드백)
export default function Loading() {
  return (
    <main className="mx-auto max-w-5xl p-6 flex flex-col gap-6 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="h-7 w-28 rounded bg-gray-800" />
        <div className="h-9 w-28 rounded-xl bg-gray-800" />
      </div>
      <div className="h-9 w-full rounded-xl bg-gray-800" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex flex-col gap-3 rounded-2xl bg-gray-900 p-5 ring-1 ring-gray-800">
            <div className="h-5 w-24 rounded bg-gray-800" />
            <div className="flex gap-1.5">
              <div className="h-6 w-16 rounded-full bg-gray-800" />
              <div className="h-6 w-16 rounded-full bg-gray-800" />
              <div className="h-6 w-20 rounded-full bg-gray-800" />
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
