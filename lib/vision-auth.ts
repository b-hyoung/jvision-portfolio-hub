import https from "node:https";
import tls from "node:tls";
import { readFileSync } from "node:fs";
import path from "node:path";

const AUTH_URL =
  process.env.VISION_AUTH_URL ??
  "https://portal.jvision.ac.kr/user/loginAuth.face";

export type VisionResult = { ok: true } | { ok: false; message: string };

type PortalData = { status?: string; code?: string; errorMessage?: string };

/**
 * 포털 응답(JSON)을 로그인 결과로 해석한다.
 * status=SUCCESS && code=PASS 일 때만 성공으로 본다.
 */
export function interpretPortalResponse(data: PortalData): VisionResult {
  if (data.status === "SUCCESS" && data.code === "PASS") return { ok: true };
  if (data.status === "SUCCESS")
    return { ok: false, message: "2단계 인증이 설정된 계정은 현재 지원하지 않습니다." };
  return { ok: false, message: data.errorMessage ?? "로그인에 실패했습니다." };
}

/**
 * 포털 서버는 TLS 중간 인증서(GlobalSign RSA OV SSL CA 2018)를 함께 보내지 않아
 * Node 기본 CA만으로는 체인 검증에 실패한다(UNABLE_TO_VERIFY_LEAF_SIGNATURE).
 * 빠진 중간 인증서를 기본 루트 목록에 더해 공급함으로써, 검증을 끄지 않고 연결한다.
 */
let caBundle: (string | Buffer)[] | undefined;
function getCa() {
  if (!caBundle) {
    const pem = readFileSync(
      path.join(process.cwd(), "certs", "jvision-intermediate.pem"),
      "utf8"
    );
    caBundle = [pem, ...tls.rootCertificates];
  }
  return caBundle;
}

function postForm(body: URLSearchParams): Promise<PortalData> {
  const payload = body.toString();
  const u = new URL(AUTH_URL);
  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        hostname: u.hostname,
        port: u.port || 443,
        path: u.pathname + u.search,
        method: "POST",
        ca: getCa(),
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "X-Requested-With": "XMLHttpRequest",
          "User-Agent": "Mozilla/5.0",
          "Content-Length": Buffer.byteLength(payload),
        },
      },
      (res) => {
        let chunks = "";
        res.on("data", (d) => (chunks += d));
        res.on("end", () => {
          if (!res.statusCode || res.statusCode >= 400) {
            reject(new Error(`portal status ${res.statusCode}`));
            return;
          }
          try {
            resolve(JSON.parse(chunks) as PortalData);
          } catch {
            reject(new Error("invalid portal response"));
          }
        });
      }
    );
    req.on("error", reject);
    req.write(payload);
    req.end();
  });
}

/**
 * 비전대학교 포털에 학번/비번을 보내 검증한다.
 * 비밀번호는 어디에도 저장하지 않고 이 검증 호출에만 사용한다.
 */
export async function verifyVisionLogin(
  studentNo: string,
  password: string
): Promise<VisionResult> {
  const body = new URLSearchParams({
    userId: studentNo,
    username: studentNo,
    password,
    langKnd: "ko",
  });

  let data: PortalData;
  try {
    data = await postForm(body);
  } catch {
    return { ok: false, message: "포털 서버에 연결할 수 없습니다." };
  }
  return interpretPortalResponse(data);
}
