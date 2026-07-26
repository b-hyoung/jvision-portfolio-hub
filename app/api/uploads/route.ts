import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { getCurrentUser } from "@/server/current-user";
import { validateUploadMeta } from "@/lib/uploads";
import { createSignedUpload } from "@/lib/storage";

/**
 * 파일을 Supabase에 "직접" 올릴 수 있는 서명 URL을 발급한다.
 * 클라이언트: 이 URL로 파일을 PUT → 그 결과 path를 /api/posts 로 전달.
 * 파일 바이트가 Vercel 함수를 거치지 않으므로 4.5MB 제한 없이 20MB까지 가능.
 */
export async function POST(req: Request) {
  const me = await getCurrentUser();
  if (!me) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const fileName = typeof body.fileName === "string" ? body.fileName : "";
  const size = typeof body.size === "number" ? body.size : 0;
  if (!fileName)
    return NextResponse.json({ error: "fileName이 필요합니다." }, { status: 400 });

  let ext: string;
  try {
    ext = validateUploadMeta(fileName, size);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }

  const key = `${randomUUID()}${ext}`;
  try {
    const { signedUrl, path } = await createSignedUpload(key);
    return NextResponse.json({ signedUrl, path });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
