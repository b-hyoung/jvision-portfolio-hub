# JVision 포트폴리오 허브

비전대학교 학생들이 **이력서·자기소개서·포트폴리오**를 올리고, 로그인한 다른 학생들의 자료도 자유롭게 둘러볼 수 있는 웹 사이트입니다.

> 이 저장소는 **AI(Claude)와 협업**하여 설계·구현한 결과물입니다.
> 브레인스토밍 → 명세 작성 → 구현 계획 → TDD 기반 단계별 구현의 전 과정을 커밋 히스토리로 남겼으며,
> 각 커밋의 `Co-Authored-By` 트레일러에 AI 협업 내역이 기록되어 있습니다.

---

## 주요 기능

- **포털 연동 로그인** — 비전대 포털(학번/비밀번호) 계정으로 인증. 별도 회원가입 없음.
- **첫 로그인 온보딩** — 다른 학생에게 보일 이름·학과를 직접 설정.
- **자료 올리기** — 이력서/자소서/포트폴리오 3가지 유형. **PDF · HWP 파일 + 외부 링크(GitHub·노션 등)** 등록.
- **둘러보기** — 전체 게시물을 카드 그리드로 열람, 유형 탭 필터 + 제목·이름·학번 검색.
- **바로 보기** — 클릭해서 나가지 않아도 사이트 안에서 확인:
  - **PDF** → 브라우저 내 전체 미리보기
  - **HWP** → 업로드 시 PDF로 자동 변환(LibreOffice) 후 미리보기. 변환 불가 시 다운로드 제공
  - **링크** → 대상의 OpenGraph 정보를 가져와 **미리보기 카드**(썸네일·제목·요약) 표시 + 원본 열기
- **내 보관함** — 내가 올린 글 목록 관리(수정·삭제)와 프로필 수정.
- **권한 분리** — 게시물 수정·삭제는 작성자 본인만 가능.

## 보안 설계

- 비밀번호는 **DB에 저장하지 않습니다.** 매 로그인마다 포털 인증 엔드포인트로 검증만 수행하고, 우리 서버에는 학번·이름만 남습니다.
- 업로드 파일은 인증된 사용자에게만 서빙되며, 경로 조작(`..`)을 차단합니다.

---

## 기술 스택

| 항목 | 기술 |
|---|---|
| 프레임워크 | Next.js 16 (App Router) |
| 언어 | TypeScript |
| 스타일 | Tailwind CSS v4 |
| 인증 | NextAuth.js v4 (Credentials Provider) |
| 데이터베이스 | Prisma + SQLite |
| 유효성 검사 | zod |
| 테스트 | Vitest |

기반 골격은 [b-hyoung/Nextjs_setup](https://github.com/b-hyoung/Nextjs_setup) 구조를 가져와 시작했습니다.

## 아키텍처

세 영역을 독립적으로 분리했습니다.

```
[브라우저] ──학번/비번──► NextAuth Credentials Provider (서버)
                              │  포털 loginAuth.face 호출 (검증만, 비번 미저장)
                              ▼
                        SUCCESS/PASS ? ─► 세션 발급 + DB에 학번 upsert
                              │
   [페이지/API] ◄── 세션 ─────┘
        ├─ /api/posts        게시물 CRUD  ──► Prisma ──► SQLite
        ├─ /api/profile      이름·학과 설정
        └─ /api/files/[…]    업로드 파일 서빙 ──► 로컬 uploads/
```

## 실행 방법

> **사전 요구:** HWP→PDF 변환에 **LibreOffice**가 필요합니다. (PDF·링크만 쓸 경우 없어도 동작)
> macOS: `brew install --cask libreoffice` · 설치 경로가 다르면 `SOFFICE_PATH` 환경변수로 지정.

```bash
# 1. 의존성 설치
npm install

# 2. 환경변수 설정 (.env.example 복사 후 값 채우기)
cp .env.example .env
#   - NEXTAUTH_SECRET 은 아래 명령으로 생성한 값을 사용
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# 3. 데이터베이스 마이그레이션
npx prisma migrate dev

# 4. 개발 서버 실행
npm run dev      # http://localhost:3000
```

### 환경변수 (.env)

| 변수 | 설명 |
|---|---|
| `VISION_AUTH_URL` | 포털 인증 엔드포인트 |
| `NEXTAUTH_SECRET` | NextAuth 세션 서명 키 |
| `NEXTAUTH_URL` | 앱 기본 URL |
| `DATABASE_URL` | SQLite 파일 경로 |
| `UPLOAD_DIR` | 업로드 파일 저장 디렉터리 |
| `SOFFICE_PATH` | (선택) LibreOffice 실행 파일 경로. 미지정 시 `soffice` 사용 |

## 테스트

```bash
npm test          # 포털 검증 로직 + 게시물/프로필 스키마 단위 테스트
```

## 프로젝트 구조

```
app/                  # 라우팅·페이지 (App Router)
  api/                #   NextAuth·게시물·프로필·파일 서빙 라우트
  login, onboarding,  #   화면
  posts/[id], me, …
components/
  header/             # 세션 인식 헤더·네비
  posts/              # 카드·폼·탭·삭제 버튼
lib/
  vision-auth.ts      # 포털 로그인 검증
  prisma.ts           # PrismaClient 싱글톤
  uploads.ts          # 파일 저장·삭제·경로 유틸
server/               # 서버 전용 조회 함수 (posts, profile)
validations/          # zod 스키마 (auth, post)
constants/enums.ts    # PostType 등 상수
prisma/schema.prisma  # User, Post 모델
docs/superpowers/     # 설계 명세 + 구현 계획 문서
```

## 개발 문서

AI와의 협업 과정에서 작성한 산출물입니다.

- 설계 명세: `docs/superpowers/specs/2026-06-29-student-portfolio-hub-design.md`
- 구현 계획: `docs/superpowers/plans/2026-06-29-student-portfolio-hub.md`
