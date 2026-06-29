import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { readFile } from "fs/promises";
import { uploadAbsPath } from "@/lib/uploads";
import path from "path";

type Ctx = { params: Promise<{ path: string[] }> };

export async function GET(_req: Request, { params }: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { path: parts } = await params;
  const rel = parts.join("/");
  // 경로 조작 방지: 정규화 후 단일 세그먼트만 허용
  if (rel.includes("..") || rel.includes("/"))
    return NextResponse.json({ error: "bad path" }, { status: 400 });

  try {
    const buf = await readFile(uploadAbsPath(rel));
    const ext = path.extname(rel).toLowerCase();
    const ctype =
      ext === ".pdf" ? "application/pdf" : ext === ".png" ? "image/png" : "image/jpeg";
    return new NextResponse(new Uint8Array(buf), { headers: { "Content-Type": ctype } });
  } catch {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
}
