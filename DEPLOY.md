# 배포 가이드 — Node 호스팅 + 앞단 Cloudflare

이 앱은 **Node 서버 + 파일시스템 + LibreOffice**에 의존하므로(서버리스 X),
Docker를 지원하는 Node 호스트에 배포하고 Cloudflare는 도메인/CDN으로 앞에 둡니다.

> 모든 기능(HWP→PDF 변환, 파일 업로드, 포털 인증)이 그대로 동작합니다.

---

## A. Fly.io 에 배포 (추천)

### 1) flyctl 설치 & 로그인
```bash
brew install flyctl       # 또는: curl -L https://fly.io/install.sh | sh
fly auth login
```

### 2) 앱 생성 (배포는 아직)
```bash
cd jvision-portfolio-hub
fly launch --no-deploy --copy-config --name jvision-portfolio-hub --region nrt
```
- `fly.toml`이 이미 있으니 그대로 사용. 앱 이름이 겹치면 다른 이름으로 바꾸고 `fly.toml`의 `app`도 맞춤.

### 3) 영구 볼륨 생성 (SQLite DB + 업로드 파일 보관)
```bash
fly volumes create data --region nrt --size 3   # 3GB
```

### 4) 시크릿 등록 (NEXTAUTH_SECRET — 절대 커밋 X)
```bash
fly secrets set NEXTAUTH_SECRET="$(node -e "console.log(require('crypto').randomBytes(32).toString('base64'))")"
```

### 5) 배포 + 단일 인스턴스 고정
```bash
fly deploy
fly scale count 1          # ⚠️ SQLite는 반드시 1개 머신만 (다중 = DB 충돌)
```

배포되면 `https://jvision-portfolio-hub.fly.dev` 로 접속 가능.

---

## B. Cloudflare 로 도메인 연결

### 1) Fly에 커스텀 도메인 인증서 발급
```bash
fly certs add jvision.<원하는도메인>.com
```
출력되는 CNAME/A 값을 확인.

### 2) Cloudflare 대시보드 → DNS
- `jvision` 레코드를 **CNAME → jvision-portfolio-hub.fly.dev** (또는 Fly가 알려준 값)으로 추가
- 프록시(주황 구름) **ON** → Cloudflare CDN/보호 적용
- SSL/TLS 모드는 **Full (strict)** 권장 (Fly가 인증서 제공)

### 3) NEXTAUTH_URL 을 실제 도메인으로
`fly.toml`의 `NEXTAUTH_URL`을 `https://jvision.<도메인>.com` 으로 바꾸고 다시 `fly deploy`.
(로그인 콜백이 도메인과 일치해야 함)

---

## 주의사항

- **SQLite = 단일 인스턴스 전용.** 트래픽이 커져 여러 대로 확장해야 하면 외부 Postgres(Neon 등)로 전환 — Prisma `provider`만 바꾸면 됨.
- 업로드 파일·DB는 `/data` 볼륨에 저장 → 재배포해도 유지. **볼륨은 백업 권장** (`fly volumes snapshots`).
- HWP→PDF 변환은 컨테이너의 LibreOffice + 한글폰트로 동작. `.hwpx`(신포맷)는 미리보기 대신 다운로드로 제공.
- 첫 배포 후 회원가입은 비전대 포털 계정으로 로그인하면 자동 생성됨.

---

## 대안 호스트 (같은 Dockerfile 사용)

| 호스트 | 볼륨 | 메모 |
|---|---|---|
| **Railway** | Volume 지원 | GitHub 연동 자동배포, Dockerfile 자동 감지. `DATABASE_URL`·`UPLOAD_DIR`·시크릿만 설정 |
| **Render** | Disk 애드온 | Docker 환경, 디스크 마운트 `/data` |
| **VPS(예: Hetzner)** | 로컬 디스크 | `docker build` 후 직접 실행, Cloudflare로 프록시 |

세 곳 모두 이 저장소의 `Dockerfile`을 그대로 쓰고, 환경변수만 동일하게 맞추면 됩니다.
