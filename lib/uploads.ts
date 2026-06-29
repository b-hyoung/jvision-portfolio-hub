import { writeFile, mkdir, unlink } from "fs/promises";
import path from "path";

const UPLOAD_DIR = process.env.UPLOAD_DIR ?? "./uploads";
const ALLOWED = new Set(["application/pdf", "image/png", "image/jpeg"]);
const MAX_BYTES = 10 * 1024 * 1024; // 10MB

export async function saveUpload(
  file: File
): Promise<{ filePath: string; fileName: string }> {
  if (!ALLOWED.has(file.type)) throw new Error("PDF 또는 이미지(PNG/JPG)만 업로드할 수 있습니다.");
  if (file.size > MAX_BYTES) throw new Error("파일 크기는 10MB를 넘을 수 없습니다.");

  const buf = Buffer.from(await file.arrayBuffer());
  const safeBase = `${Date.now()}-${Math.round(buf.length)}`;
  const ext = path.extname(file.name).slice(0, 10) || "";
  const rel = `${safeBase}${ext}`;
  const abs = path.join(UPLOAD_DIR, rel);

  await mkdir(UPLOAD_DIR, { recursive: true });
  await writeFile(abs, buf);
  return { filePath: rel, fileName: file.name };
}

export async function deleteUpload(filePath: string | null) {
  if (!filePath) return;
  try {
    await unlink(path.join(UPLOAD_DIR, filePath));
  } catch {
    /* 이미 없으면 무시 */
  }
}

export function uploadAbsPath(filePath: string) {
  return path.join(UPLOAD_DIR, filePath);
}
