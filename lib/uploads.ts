import { writeFile, mkdtemp, rm, readFile } from "fs/promises";
import os from "os";
import path from "path";
import { putObject, deleteObject } from "@/lib/storage";
import { convertToPdf } from "@/lib/convert";

const ALLOWED_EXT = new Set([".pdf", ".hwp", ".hwpx"]);
const MAX_BYTES = 20 * 1024 * 1024; // 20MB
// HWP→PDF 변환 사용 여부 (LibreOffice 설치된 서버에서만). 기본 비활성.
const CONVERT = process.env.ENABLE_HWP_CONVERT === "1";

export type SavedUpload = {
  filePath: string; // 스토리지 객체 키
  fileName: string;
  previewPath: string | null; // 미리보기용 PDF 키 (없으면 다운로드만)
};

export async function saveUpload(file: File): Promise<SavedUpload> {
  const ext = path.extname(file.name).toLowerCase();
  if (!ALLOWED_EXT.has(ext))
    throw new Error("PDF 또는 HWP 파일만 업로드할 수 있습니다.");
  if (file.size > MAX_BYTES) throw new Error("파일 크기는 20MB를 넘을 수 없습니다.");

  const buf = Buffer.from(await file.arrayBuffer());
  const base = `${Date.now()}-${buf.length}`;
  const key = `${base}${ext}`;

  // 원본을 스토리지에 업로드
  await putObject(key, buf, file.type || "application/octet-stream");

  let previewPath: string | null = null;
  if (ext === ".pdf") {
    previewPath = key; // PDF는 그대로 미리보기
  } else if (CONVERT) {
    // HWP 등 — LibreOffice가 있는 환경에서만 변환 시도 (임시 파일 경유)
    let tmp: string | null = null;
    try {
      tmp = await mkdtemp(path.join(os.tmpdir(), "conv-"));
      const inAbs = path.join(tmp, key);
      await writeFile(inAbs, buf);
      const pdfAbs = await convertToPdf(inAbs, tmp);
      const pdfBuf = await readFile(pdfAbs);
      const pdfKey = `${base}.pdf`;
      await putObject(pdfKey, pdfBuf, "application/pdf");
      previewPath = pdfKey;
    } catch (e) {
      console.error("미리보기 변환 실패:", (e as Error).message);
      previewPath = null;
    } finally {
      if (tmp) await rm(tmp, { recursive: true, force: true });
    }
  }

  return { filePath: key, fileName: file.name, previewPath };
}

export async function deleteUpload(key: string | null) {
  await deleteObject(key);
}
