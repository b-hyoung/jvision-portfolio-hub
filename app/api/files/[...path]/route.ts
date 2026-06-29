import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { signedUrl } from "@/lib/storage";

type Ctx = { params: Promise<{ path: string[] }> };

export async function GET(_req: Request, { params }: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { path: parts } = await params;
  const key = parts.join("/");
  // 경로 조작 방지: 단일 세그먼트만 허용
  if (key.includes("..") || key.includes("/"))
    return NextResponse.json({ error: "bad path" }, { status: 400 });

  // 로그인한 사용자에게만 잠깐 동안 유효한 서명 URL로 리다이렉트
  const url = await signedUrl(key, 3600);
  if (!url) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.redirect(url);
}
