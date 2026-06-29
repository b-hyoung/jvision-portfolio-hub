# 학생 이력서/자소서/포트폴리오 공유 사이트 — 설계 문서

- 작성일: 2026-06-29
- 상태: 승인됨 (구현 계획 대기)

## 1. 목적

비전대학교 학생들이 자신의 **이력서 / 자기소개서 / 포트폴리오**를 올리고,
로그인한 다른 학생들의 자료도 자유롭게 둘러볼 수 있는 웹 사이트.

핵심 요구:
- 자기 것을 올릴 수 있다 (파일 + 외부 링크)
- 남의 것도 볼 수 있다 (로그인 학생 전체 공개)
- 로그인은 비전대학교 포털 계정으로 검증한다 (학번/비번)

## 2. 기반 (셋업 레포)

[b-hyoung/Nextjs_setup](https://github.com/b-hyoung/Nextjs_setup) 구조를 그대로 가져와 시작한다.

| 항목 | 기술 |
|---|---|
| 프레임워크 | Next.js 16 (App Router) |
| 언어 | TypeScript |
| 스타일 | Tailwind CSS v4 |
| 상태관리 | Redux Toolkit |
| 인증 | NextAuth.js v4 (Credentials Provider) |
| UI | shadcn/ui |
| 유효성 | zod |

기존 폴더 규약(`app/`, `components/`, `lib/`, `server/`, `constants/`, `validations/`, `store/`, `providers/`)을 따른다.
스타일은 셋업의 기존 다크 테마를 유지한다.

## 3. 인증 설계

### 포털 검증 방식 (조사 결과)

- 로그인 폼: `userId`, `password` 를 받음 (학번 = `userId`)
- 검증 엔드포인트: `POST https://portal.jvision.ac.kr/user/loginAuth.face`
  - 본문(form-urlencoded): `userId`, `password`, `username=<학번>`, `langKnd=ko`
  - 응답(JSON):
    - 성공: `{"status":"SUCCESS","code":"PASS"}`
    - 2단계 인증 필요: `status=SUCCESS` 이지만 `code != "PASS"`
    - 실패: `{"status":"ERROR","errorMessage":"..."}`
- 비밀번호는 평문으로 전송되며(클라이언트 암호화 모듈 결과는 실제로 사용되지 않음) 서버에서 재현 가능.

### 우리 앱의 처리

- NextAuth **Credentials Provider**의 `authorize()`에서 서버사이드로 `loginAuth.face` 호출.
- `status == "SUCCESS" && code == "PASS"` 인 경우에만 로그인 성공으로 간주.
- 포털 URL은 환경변수 `VISION_AUTH_URL`로 분리.
- **비밀번호는 절대 저장하지 않는다.** 매 로그인마다 포털로 검증만 하고, DB/세션에 비번을 남기지 않는다.
- 로그인 성공 시 학번(`studentNo`) 기준으로 `User` 레코드를 upsert.
- 세션에는 `studentNo` 와 `name` 만 담는다.

### 이름 처리

- 포털에서 이름을 자동으로 가져오지 않는다 (2단계 인증/HTML 스크래핑 취약성 회피).
- 첫 로그인 후 **본인이 온보딩 화면에서 이름을 직접 입력**한다.

## 4. 데이터 저장 (A안: SQLite + 로컬 디스크)

- DB: Prisma + SQLite (파일 1개, 외부 의존성 없음)
- 파일: 서버 `uploads/` 폴더에 저장, `/api` 라우트로 서빙/다운로드
- 추후 운영 시 Prisma 스키마는 유지하고 DB/스토리지만 Postgres + 클라우드 Blob으로 교체 가능

### Prisma 스키마

```prisma
model User {
  id          String   @id @default(cuid())
  studentNo   String   @unique          // 학번 = 포털 userId
  name        String?                   // 첫 로그인 후 본인이 입력
  department  String?                   // 학과 (선택)
  createdAt   DateTime @default(now())
  posts       Post[]
}

model Post {
  id          String   @id @default(cuid())
  type        PostType                  // RESUME | COVER_LETTER | PORTFOLIO
  title       String
  description String?
  filePath    String?                   // 업로드 파일 경로 (uploads/..)
  fileName    String?                   // 원본 파일명
  linkUrl     String?                   // 노션/GitHub 등 외부 링크
  createdAt   DateTime @default(now())
  author      User     @relation(fields: [authorId], references: [id])
  authorId    String
}

enum PostType { RESUME COVER_LETTER PORTFOLIO }
```

규칙:
- 비밀번호 컬럼 없음.
- 한 학생이 타입별로 여러 개 올릴 수 있다.
- 게시물은 파일/링크 중 최소 하나만 있으면 된다 (zod로 검증).

## 5. 화면 구성

| 경로 | 화면 | 접근 | 내용 |
|---|---|---|---|
| `/login` | 로그인 | 비로그인 | 학번/비번 입력 → 포털 검증 |
| `/onboarding` | 이름 설정 | 로그인 | 이름(필수)·학과(선택). 이름 없으면 강제 이동 |
| `/` | 둘러보기(목록) | 로그인 | 전체 게시물 카드 그리드. 타입 탭 + 작성자 검색 |
| `/posts/[id]` | 게시물 상세 | 로그인 | 제목·설명·작성자, PDF 미리보기/다운로드, 링크 버튼 |
| `/me` | 내 보관함 | 로그인 | 내 글 목록 + 이름 수정 |
| `/posts/new` | 새 게시물 작성 | 로그인 | 타입 + 제목/설명 + 파일 업로드 + 링크 |
| `/posts/[id]/edit` | 게시물 수정 | 본인만 | 내 글 수정/삭제 |

공통 헤더(셋업 `components/header` 활용): 로고 / 둘러보기 / 새 글 / 내 보관함 / 로그아웃.
비로그인 상태로 보호 경로 접근 시 `/login` 으로 리다이렉트 (미들웨어).

## 6. 사용자 플로우

```
[로그인] 학번·비번 입력
   └─ 포털 검증 실패 → 에러 메시지
   └─ 성공 → 세션 발급, DB upsert
        └─ 이름 없음? → [온보딩] 이름 입력 → /
        └─ 이름 있음? → [둘러보기 /]

[둘러보기 /] 카드 그리드
   ├─ 타입 탭 필터 / 작성자 검색
   ├─ 카드 클릭 → [상세 /posts/[id]]
   └─ 헤더 '새 글' → [작성 /posts/new]
        └─ 타입·제목·설명 + (파일 or 링크) → 저장 → [상세]

[내 보관함 /me]
   ├─ 내 글 목록 → 각 글 [수정/삭제]
   └─ 이름 수정
```

## 7. API 라우트 (서버)

| 메서드 | 경로 | 역할 |
|---|---|---|
| (NextAuth) | `/api/auth/[...nextauth]` | 포털 검증 기반 Credentials 로그인 |
| POST | `/api/profile` | 이름/학과 설정·수정 |
| GET | `/api/posts` | 목록 조회 (타입·작성자 필터) |
| POST | `/api/posts` | 새 게시물 생성 (multipart: 파일+필드) |
| GET | `/api/posts/[id]` | 상세 조회 |
| PATCH/DELETE | `/api/posts/[id]` | 본인 글 수정/삭제 |
| GET | `/api/files/[...path]` | 업로드 파일 서빙/다운로드 |

권한: 수정/삭제는 세션 학번 == 글 작성자만 허용.

## 8. 범위에서 제외 (YAGNI)

MVP에서 의도적으로 제외:
- 댓글 / 좋아요 / 북마크 / 팔로우
- 관리자 페이지
- 알림
- 포털 이름 자동 스크래핑

핵심("올린다 / 남의 것 본다")에만 집중. 추후 `Post`에 관계 테이블만 추가하면 확장 가능.

## 9. 환경변수

```
VISION_AUTH_URL=https://portal.jvision.ac.kr/user/loginAuth.face
NEXTAUTH_SECRET=<생성>
NEXTAUTH_URL=http://localhost:3000
DATABASE_URL=file:./dev.db
UPLOAD_DIR=./uploads
```

## 10. 성공 기준

- 유효한 학번/비번으로 로그인 → 세션 생성, 잘못된 비번/학번 → 에러.
- 첫 로그인 사용자는 온보딩에서 이름 입력 후에만 둘러보기 진입.
- 게시물을 파일 또는 링크로 작성 → 목록·상세에서 보임.
- 다른 학생이 올린 게시물을 목록/상세에서 볼 수 있음.
- 본인 글만 수정/삭제 가능, 타인 글은 불가.
- DB에 비밀번호가 저장되지 않음.
