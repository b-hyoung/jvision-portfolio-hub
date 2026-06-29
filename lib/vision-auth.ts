const AUTH_URL =
  process.env.VISION_AUTH_URL ??
  "https://portal.jvision.ac.kr/user/loginAuth.face";

export type VisionResult = { ok: true } | { ok: false; message: string };

/**
 * 비전대학교 포털에 학번/비번을 보내 검증한다.
 * status=SUCCESS && code=PASS 일 때만 성공.
 * 비밀번호는 어디에도 저장하지 않고 검증 호출에만 사용한다.
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

  let res: Response;
  try {
    res = await fetch(AUTH_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "X-Requested-With": "XMLHttpRequest",
        "User-Agent": "Mozilla/5.0",
      },
      body,
    });
  } catch {
    return { ok: false, message: "포털 서버에 연결할 수 없습니다." };
  }

  if (!res.ok) return { ok: false, message: "포털 응답 오류가 발생했습니다." };

  let data: { status?: string; code?: string; errorMessage?: string };
  try {
    data = await res.json();
  } catch {
    return { ok: false, message: "포털 응답을 해석할 수 없습니다." };
  }

  if (data.status === "SUCCESS" && data.code === "PASS") return { ok: true };
  if (data.status === "SUCCESS")
    return { ok: false, message: "2단계 인증이 설정된 계정은 현재 지원하지 않습니다." };
  return { ok: false, message: data.errorMessage ?? "로그인에 실패했습니다." };
}
