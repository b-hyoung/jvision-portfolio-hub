# 배포 가이드 — Render(무료) + Supabase + UptimeRobot

데이터(DB·파일)를 **Supabase**로 빼서 앱을 상태 없는(stateless) 컨테이너로 만들고,
**Render 무료**에 배포한 뒤 **UptimeRobot**으로 잠들지 않게 합니다. 전부 카드 없이 가능.

- 미리보기: **PDF·링크는 미리보기 O**, HWP 파일은 다운로드(원하면 PDF로 올리면 미리보기됨)
- DB: Supabase Postgres · 파일: Supabase Storage(비공개 버킷, 서명 URL로 열람)

---

## 1. Supabase 준비

1. **연결 문자열** (Dashboard → 우상단 **Connect** → ORM/Prisma 탭)
   - `DATABASE_URL` (Transaction pooler, 6543, `?pgbouncer=true`)
   - `DIRECT_URL` (Session/Direct, 5432)
   - 비밀번호 자리(`[YOUR-PASSWORD]`)를 실제 DB 비밀번호로 채움
2. **service_role 키** (Settings → API → Project API keys → `service_role`) — 비공개 키
3. **Storage 버킷 생성** (Storage → New bucket): 이름 `uploads`, **Public 끄기(비공개)**

> 위 값들은 `.env`(로컬, 커밋 안 됨)와 Render 환경변수에 넣습니다. 코드에는 안 들어갑니다.

## 2. 로컬에서 마이그레이션 생성 (1회)

`.env`에 `DATABASE_URL`·`DIRECT_URL`을 채운 뒤:

```bash
npx prisma migrate dev --name init   # Postgres용 마이그레이션 생성 + Supabase에 적용
git add prisma/migrations && git commit -m "db: postgres 초기 마이그레이션"
git push
```

## 3. Render 배포

1. https://render.com → 가입(카드 X) → **New → Web Service** → GitHub 레포 연결
2. 환경: **Docker** 자동 감지 (`render.yaml` 있으면 Blueprint로 한 번에)
3. **Environment** 에 비밀값 입력:
   - `NEXTAUTH_SECRET` = `openssl rand -base64 32` 결과
   - `DATABASE_URL`, `DIRECT_URL` = Supabase 연결 문자열
   - `SUPABASE_SERVICE_KEY` = service_role 키
   - (`SUPABASE_URL`, `SUPABASE_BUCKET`, `VISION_AUTH_URL`는 render.yaml에 기본값 있음)
4. 첫 배포 후 주소(`https://jvision-portfolio-hub.onrender.com`) 확인 →
   `NEXTAUTH_URL`을 그 주소로 설정하고 **재배포**

## 4. UptimeRobot 으로 안 잠들게

Render 무료는 15분 무요청 시 잠듭니다. https://uptimerobot.com (무료):
- New Monitor → **HTTP(s)** → URL `https://<당신앱>.onrender.com/login` → 간격 **5분**
- 5분마다 핑이 가서 깨어 있음

## 5. (선택) Cloudflare 도메인

Render에서 커스텀 도메인 추가 → Cloudflare DNS에 CNAME(→ onrender.com 주소, 프록시 ON) →
`NEXTAUTH_URL`을 그 도메인으로 변경 후 재배포.

---

## 주의

- **무료 512MB**: 동시 사용자 많으면 느릴 수 있음. 커지면 Render 유료 또는 다른 호스트로.
- HWP 자동 미리보기를 원하면: LibreOffice 가능한 서버에서 이미지에 LibreOffice 추가 + `ENABLE_HWP_CONVERT=1`.
- Supabase 무료: DB 500MB / Storage 1GB. 학과 규모엔 충분.
