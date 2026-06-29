import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";

/**
 * 세션에서 사용자 정보를 가져온다(id·학번·이름).
 * 토큰에 이미 들어있어 DB 조회 없이 반환 → 페이지 가드가 빠르다.
 */
export async function getSessionUser() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;
  return session.user;
}
