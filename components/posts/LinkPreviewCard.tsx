import { getLinkPreview } from "@/lib/link-preview";

export default async function LinkPreviewCard({ url }: { url: string }) {
  const preview = await getLinkPreview(url);
  let host = url;
  try {
    host = new URL(url).host;
  } catch {
    /* keep raw */
  }

  // 미리보기 정보를 못 가져오면 단순 열기 버튼만
  if (!preview) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="w-fit rounded-xl bg-gray-800 px-4 py-2 text-sm hover:bg-gray-700"
      >
        🔗 링크 열기 ({host})
      </a>
    );
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex overflow-hidden rounded-2xl ring-1 ring-gray-800 hover:ring-indigo-500 transition"
    >
      {preview.image && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={preview.image}
          alt=""
          className="h-32 w-44 shrink-0 object-cover"
        />
      )}
      <div className="flex flex-col gap-1 p-4">
        <span className="text-xs text-gray-500">{preview.siteName ?? host}</span>
        <span className="font-semibold line-clamp-1">{preview.title ?? url}</span>
        {preview.description && (
          <span className="text-sm text-gray-400 line-clamp-2">
            {preview.description}
          </span>
        )}
        <span className="mt-1 text-xs text-indigo-400">🔗 열기 →</span>
      </div>
    </a>
  );
}
