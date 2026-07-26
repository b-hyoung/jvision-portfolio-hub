import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { prisma } from "@/lib/prisma";

export type CurrentUser = {
  id: string;
  studentNo: string;
  name: string | null;
};

/**
 * 앱 전역 단일 소스 — 현재 로그인 사용자의 "실제 DB User"를 돌려준다.
 *
 * 세션(JWT)의 user.id는 옛 DB 값으로 남아 있을 수 있으므로 신뢰하지 않고,
 * 안정적인 학번(studentNo)으로 현재 DB의 User를 확정한다(없으면 생성 = 자동 치유).
 * 저장·조회·소유자 판정·프로필이 모두 이 함수를 통해 "같은 User"를 바라보게 된다.
 *
 * 로그인(포털 인증)만 되어 있으면 항상 유효한 User를 반환한다.
 */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const session = await getServerSession(authOptions);
  const studentNo = session?.user?.studentNo;
  if (!studentNo) return null;
  return prisma.user.upsert({
    where: { studentNo },
    update: {},
    create: { studentNo },
    select: { id: true, studentNo: true, name: true },
  });
}
