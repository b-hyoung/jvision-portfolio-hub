import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { prisma } from "@/lib/prisma";

/**
 * 세션의 학번으로 실제 DB User를 확정해서 반환한다(없으면 생성).
 * JWT의 user.id가 옛 DB 값으로 남아 있어도(예: DB 교체) 항상 현재 DB의
 * 올바른 id를 돌려주므로, 저장/조회가 같은 User를 바라보게 된다.
 */
export async function getSessionUser() {
  const session = await getServerSession(authOptions);
  const studentNo = session?.user?.studentNo;
  if (!studentNo) return null;
  const user = await prisma.user.upsert({
    where: { studentNo },
    update: {},
    create: { studentNo },
    select: { id: true, studentNo: true, name: true },
  });
  return user;
}
