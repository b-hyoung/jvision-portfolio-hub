import { getCurrentUser } from "@/server/current-user";

/**
 * 페이지 가드용 — 현재 DB User(id·학번·이름)를 반환.
 * 실제 확정 로직은 전역 단일 소스 getCurrentUser 에 위임한다.
 */
export async function getSessionUser() {
  return getCurrentUser();
}
