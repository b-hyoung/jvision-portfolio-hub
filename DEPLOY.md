# 배포 가이드 — Vercel + Supabase (추천)

DB·파일을 **Supabase**로 빼서 앱이 상태 없는(stateless) 구조가 됐으므로,
Next.js 전용 호스팅인 **Vercel**에 그대로 올릴 수 있습니다. 무료(Hobby)·카드 불필요·잠들지 않음.

- 미리보기: **PDF·링크 미리보기 O**, HWP 파일은 다운로드(원하면 PDF로 올리면 미리보기됨)
- DB: Supabase Postgres · 파일: Supabase Storage(비공개 버킷, 서명 URL)
- 포털 인증의 TLS 중간 인증서는 코드에 내장 → 서버리스에서도 동작

---

## 1. Vercel 배포

1. https://vercel.com → **GitHub로 로그인**(카드 X)
2. **Add New → Project** → `b-hyoung/jvision-portfolio-hub` 임포트
3. Framework: **Next.js** 자동 감지 → 빌드 설정 기본값 그대로
4. **Environment Variables** 에 아래 입력 후 **Deploy**:

```
NEXTAUTH_SECRET      = (openssl rand -base64 32 결과)
NEXTAUTH_URL         = https://<프로젝트>.vercel.app   ← 첫 배포 후 실제 주소로 갱신
DATABASE_URL         = postgresql://postgres.lzclvjdjemfkyskvtbyn:비번@aws-1-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true
DIRECT_URL           = postgresql://postgres.lzclvjdjemfkyskvtbyn:비번@aws-1-ap-south-1.pooler.supabase.com:5432/postgres
SUPABASE_URL         = https://lzclvjdjemfkyskvtbyn.supabase.co
SUPABASE_SERVICE_KEY = (service_role 키)
SUPABASE_BUCKET      = uploads
VISION_AUTH_URL      = https://portal.jvision.ac.kr/user/loginAuth.face
```

5. 첫 배포 후 주소 확인 → `NEXTAUTH_URL`을 그 주소로 바꾸고 **Redeploy** (로그인 콜백 일치 필요)

> DB 마이그레이션은 이미 Supabase에 적용돼 있어, Vercel은 빌드 시 `prisma generate`(postinstall)만 하면 됩니다.
> 런타임 DB 연결은 풀러(6543, `?pgbouncer=true`)를 사용 — 서버리스에 적합.

## 2. (선택) Cloudflare 도메인
Vercel 프로젝트 → Settings → Domains 에 커스텀 도메인 추가 →
Cloudflare DNS에 Vercel이 안내하는 레코드 등록 → `NEXTAUTH_URL`을 그 도메인으로.

---

## 참고

- **Vercel Hobby 무료**: 개인/포트폴리오용 충분. 함수 타임아웃 등 한도 내에서 동작(현재 요청은 가볍습니다).
- HWP 자동 미리보기가 꼭 필요하면 서버리스로는 어려움 → 그땐 LibreOffice 가능한 Node 호스트 필요(아래 대안).

### 대안 — Node 호스트(Render 등)
저장소에 `Dockerfile`/`render.yaml`도 포함돼 있어, Render 같은 Docker 호스트로도 배포 가능.
(LibreOffice를 이미지에 추가하고 `ENABLE_HWP_CONVERT=1` 하면 HWP 미리보기까지 가능)
