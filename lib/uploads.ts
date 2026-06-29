import { writeFile, mkdir, unlink } from "fs/promises";
import path from "path";
import { convertToPdf } from "@/lib/convert";

const UPLOAD_DIR = process.env.UPLOAD_DIR ?? "./uploads";
const ALLOWED_EXT = new Set([".pdf", ".hwp", ".hwpx"]);
const MAX_BYTES = 20 * 1024 * 1024; // 20MB

export type SavedUpload = {
  filePath: string;
  fileName: string;
  previewPath: string | null; // 미리보기용 PDF (없으면 다운로드만)
};

export async function saveUpload(file: File): Promise<SavedUpload> {
  const ext = path.extname(file.name).toLowerCase();
  if (!ALLOWED_EXT.has(ext))
    throw new Error("PDF 또는 HWP 파일만 업로드할 수 있습니다.");
  if (file.size > MAX_BYTES) throw new Error("파일 크기는 20MB를 넘을 수 없습니다.");

  const buf = Buffer.from(await file.arrayBuffer());
  const rel = `${Date.now()}-${buf.length}${ext}`;

  await mkdir(UPLOAD_DIR, { recursive: true });
  await writeFile(uploadAbsPath(rel), buf);

  let previewPath: string | null = null;
  if (ext === ".pdf") {
    previewPath = rel; // PDF는 그대로 미리보기
  } else {
    // HWP 등은 PDF로 변환 시도. 실패해도 원본은 보존하고 다운로드만 제공.
    try {
      const pdfAbs = await convertToPdf(path.resolve(uploadAbsPath(rel)), UPLOAD_DIR);
      previewPath = path.basename(pdfAbs);
    } catch (e) {
      console.error("미리보기 변환 실패:", (e as Error).message);
      previewPath = null;
    }
  }

  return { filePath: rel, fileName: file.name, previewPath };
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
