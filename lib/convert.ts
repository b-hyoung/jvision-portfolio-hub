import { spawn } from "node:child_process";
import { mkdtemp, rm, access } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

const SOFFICE = process.env.SOFFICE_PATH || "soffice";
const TIMEOUT_MS = 60_000;

/**
 * LibreOffice headless로 입력 파일(HWP 등)을 PDF로 변환한다.
 * 변환된 PDF의 절대 경로를 반환하고, 실패하면 reject한다.
 * 동시 실행 시 프로필 락을 피하려 호출마다 임시 UserInstallation 프로필을 쓴다.
 */
export async function convertToPdf(
  absInput: string,
  outDir: string
): Promise<string> {
  const profile = await mkdtemp(path.join(os.tmpdir(), "lo-profile-"));
  const outAbs = path.resolve(outDir);
  const pdfPath = path.join(
    outAbs,
    path.basename(absInput).replace(/\.[^.]+$/, "") + ".pdf"
  );

  return new Promise<string>((resolve, reject) => {
    const proc = spawn(SOFFICE, [
      "--headless",
      `-env:UserInstallation=file://${profile}`,
      "--convert-to",
      "pdf",
      "--outdir",
      outAbs,
      absInput,
    ]);

    let stderr = "";
    proc.stderr.on("data", (d) => (stderr += d.toString()));

    const timer = setTimeout(() => proc.kill("SIGKILL"), TIMEOUT_MS);

    const cleanup = () => {
      clearTimeout(timer);
      void rm(profile, { recursive: true, force: true });
    };

    proc.on("error", (e) => {
      cleanup();
      reject(e);
    });

    proc.on("close", async () => {
      cleanup();
      try {
        await access(pdfPath);
        resolve(pdfPath);
      } catch {
        reject(new Error(`PDF 변환 실패: ${stderr.trim() || "출력 없음"}`));
      }
    });
  });
}
