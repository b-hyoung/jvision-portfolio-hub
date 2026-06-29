import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const BUCKET = process.env.SUPABASE_BUCKET ?? "uploads";

// 빌드 시점엔 env가 없을 수 있으므로 첫 사용 시 지연 생성한다.
let _admin: SupabaseClient | null = null;
function admin(): SupabaseClient {
  if (!_admin) {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_KEY;
    if (!url || !key)
      throw new Error("SUPABASE_URL / SUPABASE_SERVICE_KEY 환경변수가 필요합니다.");
    _admin = createClient(url, key, { auth: { persistSession: false } });
  }
  return _admin;
}

export async function putObject(key: string, bytes: Buffer, contentType: string) {
  const { error } = await admin()
    .storage.from(BUCKET)
    .upload(key, bytes, { contentType, upsert: true });
  if (error) throw new Error(`스토리지 업로드 실패: ${error.message}`);
}

export async function deleteObject(key: string | null) {
  if (!key) return;
  await admin().storage.from(BUCKET).remove([key]);
}

/** 비공개 객체를 일정 시간 동안 볼 수 있는 서명 URL 생성 */
export async function signedUrl(key: string, expiresInSec = 3600): Promise<string | null> {
  const { data, error } = await admin()
    .storage.from(BUCKET)
    .createSignedUrl(key, expiresInSec);
  if (error) return null;
  return data?.signedUrl ?? null;
}
