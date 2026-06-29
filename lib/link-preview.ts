export type LinkPreview = {
  url: string;
  title: string | null;
  description: string | null;
  image: string | null;
  siteName: string | null;
};

function pickMeta(html: string, keys: string[]): string | null {
  for (const key of keys) {
    // <meta property="og:title" content="..."> (속성 순서 무관)
    const re = new RegExp(
      `<meta[^>]+(?:property|name)=["']${key}["'][^>]*content=["']([^"']*)["']`,
      "i"
    );
    const alt = new RegExp(
      `<meta[^>]+content=["']([^"']*)["'][^>]*(?:property|name)=["']${key}["']`,
      "i"
    );
    const m = html.match(re) || html.match(alt);
    if (m?.[1]) return decode(m[1]);
  }
  return null;
}

function decode(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();
}

/**
 * 링크의 OpenGraph/메타 정보를 서버에서 가져와 미리보기 카드용 데이터를 만든다.
 * 실패하면 null을 반환한다(카드 없이 링크 버튼만 표시).
 */
export async function getLinkPreview(url: string): Promise<LinkPreview | null> {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return null;

  let html: string;
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; JVisionHub/1.0)" },
      signal: AbortSignal.timeout(8000),
      // 미리보기는 자주 안 바뀌므로 하루 캐시
      next: { revalidate: 86400 },
    });
    if (!res.ok) return null;
    const type = res.headers.get("content-type") ?? "";
    if (!type.includes("text/html")) return null;
    html = (await res.text()).slice(0, 500_000);
  } catch {
    return null;
  }

  const title =
    pickMeta(html, ["og:title", "twitter:title"]) ??
    html.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1]?.trim() ??
    null;
  const description = pickMeta(html, ["og:description", "twitter:description", "description"]);
  let image = pickMeta(html, ["og:image", "twitter:image", "twitter:image:src"]);
  const siteName = pickMeta(html, ["og:site_name"]);

  // 상대경로 이미지를 절대경로로 보정
  if (image && !/^https?:\/\//i.test(image)) {
    try {
      image = new URL(image, parsed.origin).href;
    } catch {
      image = null;
    }
  }

  if (!title && !description && !image) return null;
  return { url, title: title ? decode(title) : null, description, image, siteName };
}
