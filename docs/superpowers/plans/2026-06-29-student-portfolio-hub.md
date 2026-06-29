# 학생 이력서/자소서/포트폴리오 공유 사이트 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 비전대학교 학생들이 이력서/자소서/포트폴리오를 파일·링크로 올리고 서로 열람하는, 포털 계정으로 로그인하는 Next.js 웹 사이트를 만든다.

**Architecture:** [b-hyoung/Nextjs_setup](https://github.com/b-hyoung/Nextjs_setup) 골격(Next.js 16 App Router + TS + Tailwind v4 + NextAuth v4 + Redux + shadcn) 위에 구현. 인증은 NextAuth Credentials Provider가 포털 `loginAuth.face`를 서버사이드 검증(비번 미저장). 데이터는 Prisma + SQLite, 업로드 파일은 로컬 `uploads/` 디렉터리. 세 영역(인증/데이터/파일)을 분리.

**Tech Stack:** Next.js 16, TypeScript, Tailwind CSS v4, NextAuth v4, Prisma + SQLite, zod, vitest.

---

## 프로젝트 위치

앱 루트: `/Users/bobs/Desktop/bobs_project/jvision-portfolio-hub`
이 플랜의 모든 상대 경로는 이 앱 루트 기준이다.

## 파일 구조 (생성/수정 대상)

```
jvision-portfolio-hub/
├── prisma/
│   └── schema.prisma            # User, Post 모델
├── lib/
│   ├── prisma.ts                # PrismaClient 싱글톤
│   ├── vision-auth.ts           # 포털 검증 함수 verifyVisionLogin()
│   └── uploads.ts               # 파일 저장/경로 유틸
├── auth.ts                      # NextAuth 설정 (authOptions)
├── types/next-auth.d.ts         # 세션 타입 확장 (studentNo, name)
├── middleware.ts                # 보호 경로 가드
├── validations/
│   ├── auth.ts                  # (기존) 로그인 스키마 조정
│   └── post.ts                  # 게시물/프로필 zod 스키마
├── constants/enums.ts           # (기존) PostType 등 추가
├── server/
│   ├── posts.ts                 # 게시물 조회 서버 함수
│   └── profile.ts               # 프로필 조회/수정 서버 함수
├── app/
│   ├── api/auth/[...nextauth]/route.ts
│   ├── api/profile/route.ts
│   ├── api/posts/route.ts
│   ├── api/posts/[id]/route.ts
│   ├── api/files/[...path]/route.ts
│   ├── login/page.tsx
│   ├── onboarding/page.tsx
│   ├── page.tsx                 # 둘러보기(목록) — 기존 교체
│   ├── posts/new/page.tsx
│   ├── posts/[id]/page.tsx
│   ├── posts/[id]/edit/page.tsx
│   ├── me/page.tsx
│   └── layout.tsx               # Provider 래핑 — 기존 수정
├── components/
│   ├── header/index.tsx         # 네비 — 기존 수정
│   ├── header/auth-button.tsx   # 로그인/로그아웃 — 기존 수정
│   ├── posts/PostCard.tsx
│   ├── posts/PostForm.tsx
│   └── posts/TypeTabs.tsx
└── (테스트) *.test.ts
```

---

## Task 0: 셋업 레포 가져오기 + 의존성

**Files:**
- Create: 앱 전체 (`jvision-portfolio-hub/`)

- [ ] **Step 1: 셋업 레포를 앱 폴더로 복사 (.git 제외)**

```bash
cd /Users/bobs/Desktop/bobs_project
rm -rf jvision-portfolio-hub
git clone --depth 1 https://github.com/b-hyoung/Nextjs_setup jvision-portfolio-hub
rm -rf jvision-portfolio-hub/.git
cd jvision-portfolio-hub
git init
```

- [ ] **Step 2: 의존성 설치 + 추가 패키지**

```bash
cd /Users/bobs/Desktop/bobs_project/jvision-portfolio-hub
npm install
npm install @prisma/client
npm install -D prisma vitest @vitejs/plugin-react
```

- [ ] **Step 3: dev 서버가 뜨는지 확인**

Run: `npm run dev` (백그라운드로 띄운 뒤 `curl -s -o /dev/null -w "%{http_code}" http://localhost:3000` 확인 후 종료)
Expected: `200`

- [ ] **Step 4: vitest 설정 파일 생성**

Create `vitest.config.ts`:

```typescript
import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: { environment: "node" },
  resolve: { alias: { "@": path.resolve(__dirname, "./") } },
});
```

`package.json` 의 `scripts` 에 추가:

```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "chore: bootstrap from Nextjs_setup, add prisma + vitest"
```

---

## Task 1: 환경변수 + Prisma 스키마

**Files:**
- Create: `.env`, `.env.example`, `prisma/schema.prisma`, `lib/prisma.ts`

- [ ] **Step 1: `.env.example` 작성 (커밋 대상)**

```
VISION_AUTH_URL=https://portal.jvision.ac.kr/user/loginAuth.face
NEXTAUTH_SECRET=replace-me-with-openssl-rand-base64-32
NEXTAUTH_URL=http://localhost:3000
DATABASE_URL=file:./dev.db
UPLOAD_DIR=./uploads
```

- [ ] **Step 2: 실제 `.env` 생성 (gitignore 됨)**

```bash
cp .env.example .env
# NEXTAUTH_SECRET 채우기
node -e "console.log('NEXTAUTH_SECRET='+require('crypto').randomBytes(32).toString('base64'))"
```

생성된 값으로 `.env` 의 `NEXTAUTH_SECRET` 을 교체한다.

- [ ] **Step 3: `prisma/schema.prisma` 작성**

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

model User {
  id         String   @id @default(cuid())
  studentNo  String   @unique
  name       String?
  department String?
  createdAt  DateTime @default(now())
  posts      Post[]
}

model Post {
  id          String   @id @default(cuid())
  type        String   // RESUME | COVER_LETTER | PORTFOLIO
  title       String
  description String?
  filePath    String?
  fileName    String?
  linkUrl     String?
  createdAt   DateTime @default(now())
  author      User     @relation(fields: [authorId], references: [id], onDelete: Cascade)
  authorId    String
}
```

> 주: SQLite는 enum 미지원 → `type`은 String, 값은 코드의 `PostType` enum으로 강제한다.

- [ ] **Step 4: 마이그레이션 실행**

Run: `npx prisma migrate dev --name init`
Expected: `prisma/migrations/` 생성, `dev.db` 생성, "Your database is now in sync" 출력.

- [ ] **Step 5: `lib/prisma.ts` (PrismaClient 싱글톤) 작성**

```typescript
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
```

- [ ] **Step 6: `.gitignore`에 uploads/dev.db 추가**

`.gitignore` 끝에 append:

```
# app data
/uploads
/prisma/dev.db
/prisma/dev.db-journal
```

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: add prisma schema (User, Post) and env config"
```

---

## Task 2: 포털 인증 함수 `verifyVisionLogin`

**Files:**
- Create: `lib/vision-auth.ts`, `lib/vision-auth.test.ts`

- [ ] **Step 1: 실패 테스트 작성**

Create `lib/vision-auth.test.ts`:

```typescript
import { describe, it, expect, vi, afterEach } from "vitest";
import { verifyVisionLogin } from "@/lib/vision-auth";

const mockFetch = (json: unknown) =>
  vi.spyOn(globalThis, "fetch").mockResolvedValue(
    new Response(JSON.stringify(json), { status: 200 }) as Response
  );

afterEach(() => vi.restoreAllMocks());

describe("verifyVisionLogin", () => {
  it("returns ok for SUCCESS + PASS", async () => {
    mockFetch({ status: "SUCCESS", code: "PASS" });
    const r = await verifyVisionLogin("202518017", "pw");
    expect(r.ok).toBe(true);
  });

  it("returns not ok for ERROR status", async () => {
    mockFetch({ status: "ERROR", errorMessage: "유효하지 않은 사용자명입니다." });
    const r = await verifyVisionLogin("nope", "pw");
    expect(r.ok).toBe(false);
    expect(r.message).toContain("유효하지");
  });

  it("returns not ok when 2-factor required (code != PASS)", async () => {
    mockFetch({ status: "SUCCESS", code: "2FACTOR" });
    const r = await verifyVisionLogin("202518017", "pw");
    expect(r.ok).toBe(false);
  });
});
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `npm test -- vision-auth`
Expected: FAIL — "verifyVisionLogin is not defined" / 모듈 없음.

- [ ] **Step 3: `lib/vision-auth.ts` 구현**

```typescript
const AUTH_URL =
  process.env.VISION_AUTH_URL ??
  "https://portal.jvision.ac.kr/user/loginAuth.face";

export type VisionResult = { ok: true } | { ok: false; message: string };

/**
 * 비전대학교 포털에 학번/비번을 보내 검증한다.
 * status=SUCCESS && code=PASS 일 때만 성공.
 * 비밀번호는 어디에도 저장하지 않고 검증 호출에만 사용한다.
 */
export async function verifyVisionLogin(
  studentNo: string,
  password: string
): Promise<VisionResult> {
  const body = new URLSearchParams({
    userId: studentNo,
    username: studentNo,
    password,
    langKnd: "ko",
  });

  let res: Response;
  try {
    res = await fetch(AUTH_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "X-Requested-With": "XMLHttpRequest",
        "User-Agent": "Mozilla/5.0",
      },
      body,
    });
  } catch {
    return { ok: false, message: "포털 서버에 연결할 수 없습니다." };
  }

  if (!res.ok) return { ok: false, message: "포털 응답 오류가 발생했습니다." };

  let data: { status?: string; code?: string; errorMessage?: string };
  try {
    data = await res.json();
  } catch {
    return { ok: false, message: "포털 응답을 해석할 수 없습니다." };
  }

  if (data.status === "SUCCESS" && data.code === "PASS") return { ok: true };
  if (data.status === "SUCCESS")
    return { ok: false, message: "2단계 인증이 설정된 계정은 현재 지원하지 않습니다." };
  return { ok: false, message: data.errorMessage ?? "로그인에 실패했습니다." };
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `npm test -- vision-auth`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: add verifyVisionLogin portal auth helper with tests"
```

---

## Task 3: NextAuth 설정 + 세션 타입

**Files:**
- Create: `auth.ts`, `app/api/auth/[...nextauth]/route.ts`, `types/next-auth.d.ts`
- Modify: `validations/auth.ts`

- [ ] **Step 1: `validations/auth.ts` 를 학번 로그인용으로 교체**

기존 email 스키마를 다음으로 교체:

```typescript
import * as z from "zod";

export const loginFormSchema = z.object({
  studentNo: z.string().min(1, "학번을 입력하세요."),
  password: z.string().min(1, "비밀번호를 입력하세요."),
});

export type LoginFormValues = z.infer<typeof loginFormSchema>;
```

(기존 register/validationErrors 스키마는 사용하지 않으므로 삭제한다.)

- [ ] **Step 2: `auth.ts` (authOptions) 작성**

```typescript
import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { verifyVisionLogin } from "@/lib/vision-auth";
import { prisma } from "@/lib/prisma";

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    CredentialsProvider({
      name: "vision",
      credentials: {
        studentNo: { label: "학번", type: "text" },
        password: { label: "비밀번호", type: "password" },
      },
      async authorize(credentials) {
        const studentNo = credentials?.studentNo?.trim();
        const password = credentials?.password;
        if (!studentNo || !password) return null;

        const result = await verifyVisionLogin(studentNo, password);
        if (!result.ok) throw new Error(result.message);

        const user = await prisma.user.upsert({
          where: { studentNo },
          update: {},
          create: { studentNo },
        });

        return { id: user.id, studentNo: user.studentNo, name: user.name ?? null };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.uid = (user as { id: string }).id;
        token.studentNo = (user as { studentNo: string }).studentNo;
      }
      // 매 요청마다 최신 name 반영 (온보딩 직후 갱신용)
      if (token.uid) {
        const db = await prisma.user.findUnique({ where: { id: token.uid as string } });
        token.name = db?.name ?? null;
      }
      return token;
    },
    async session({ session, token }) {
      session.user = {
        id: token.uid as string,
        studentNo: token.studentNo as string,
        name: (token.name as string | null) ?? null,
      };
      return session;
    },
  },
};
```

- [ ] **Step 3: route handler 작성**

Create `app/api/auth/[...nextauth]/route.ts`:

```typescript
import NextAuth from "next-auth";
import { authOptions } from "@/auth";

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
```

- [ ] **Step 4: 세션 타입 확장**

Create `types/next-auth.d.ts`:

```typescript
import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: { id: string; studentNo: string; name: string | null };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    uid?: string;
    studentNo?: string;
    name?: string | null;
  }
}
```

`tsconfig.json` 의 `include` 에 `"types/**/*.ts"` 가 포함되는지 확인 (기본 `**/*.ts` 면 OK).

- [ ] **Step 5: 타입체크 통과 확인**

Run: `npx tsc --noEmit`
Expected: 에러 없음.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: wire NextAuth credentials provider to portal auth"
```

---

## Task 4: Provider 래핑 + 미들웨어 보호

**Files:**
- Modify: `app/layout.tsx`, `providers/NextAuthSessionProvider.tsx`
- Create: `middleware.ts`

- [ ] **Step 1: `app/layout.tsx` 에 세션 Provider + 헤더 적용**

`app/layout.tsx` 의 `metadata` 와 `body` 를 다음으로 교체:

```tsx
export const metadata: Metadata = {
  title: "JVision 포트폴리오 허브",
  description: "비전대 학생들의 이력서·자소서·포트폴리오 모음",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="ko"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-gray-950 text-white">
        <NextAuthSessionProvider>
          <Header />
          <div className="flex-1">{children}</div>
        </NextAuthSessionProvider>
      </body>
    </html>
  );
}
```

상단 import 추가:

```tsx
import NextAuthSessionProvider from "@/providers/NextAuthSessionProvider";
import Header from "@/components/header";
```

- [ ] **Step 2: `middleware.ts` 작성 (보호 경로 가드)**

Create `middleware.ts`:

```typescript
export { default } from "next-auth/middleware";

export const config = {
  matcher: [
    "/",
    "/me",
    "/onboarding",
    "/posts/:path*",
  ],
};
```

> NextAuth 미들웨어는 미인증 시 `pages.signIn`(`/login`)로 리다이렉트한다.

- [ ] **Step 3: dev 서버에서 비로그인 접근 확인**

Run: dev 서버 띄우고 `curl -s -o /dev/null -w "%{http_code}\n" -L "http://localhost:3000/"` (리다이렉트 따라감) → 로그인 페이지(아직 없으면 다음 Task 후 재확인). 우선 `curl -s -o /dev/null -w "%{http_code}\n" "http://localhost:3000/"` 가 307/302인지 확인.
Expected: 307 (→ /login).

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: wrap app with session provider, guard routes via middleware"
```

---

## Task 5: 로그인 페이지

**Files:**
- Create: `app/login/page.tsx`

- [ ] **Step 1: 로그인 페이지 작성**

Create `app/login/page.tsx`:

```tsx
"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Input from "@/components/ui/input";
import { loginFormSchema } from "@/validations/auth";

export default function LoginPage() {
  const router = useRouter();
  const [studentNo, setStudentNo] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const parsed = loginFormSchema.safeParse({ studentNo, password });
    if (!parsed.success) {
      setError(parsed.error.issues[0].message);
      return;
    }

    setLoading(true);
    const res = await signIn("credentials", {
      redirect: false,
      studentNo,
      password,
    });
    setLoading(false);

    if (res?.error) {
      setError(res.error);
      return;
    }
    router.push("/");
    router.refresh();
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-sm flex flex-col gap-4 rounded-2xl bg-gray-900 p-8 ring-1 ring-gray-800"
      >
        <div className="flex flex-col gap-1">
          <span className="text-xs font-semibold tracking-widest text-indigo-400 uppercase">
            JVision Hub
          </span>
          <h1 className="text-2xl font-bold">로그인</h1>
          <p className="text-sm text-gray-400">비전대 포털 학번/비밀번호로 로그인</p>
        </div>

        <Input
          placeholder="학번"
          value={studentNo}
          onChange={(e) => setStudentNo(e.target.value)}
        />
        <Input
          type="password"
          placeholder="비밀번호"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        {error && <p className="text-sm text-red-400">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="mt-2 rounded-xl bg-indigo-600 py-2.5 font-semibold hover:bg-indigo-500 disabled:opacity-50 transition-colors"
        >
          {loading ? "확인 중..." : "로그인"}
        </button>
        <p className="text-xs text-gray-500 text-center">
          비밀번호는 저장되지 않으며 포털 인증에만 사용됩니다.
        </p>
      </form>
    </main>
  );
}
```

- [ ] **Step 2: 수동 검증**

Run: dev 서버에서 `http://localhost:3000/login` 접속. 잘못된 학번 입력 → 에러 메시지 표시. (실계정으로 정상 로그인 시 `/` 또는 `/onboarding` 이동은 Task 7 이후 최종 확인.)
Expected: 페이지 렌더, 잘못된 입력 시 빨간 에러 텍스트.

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat: add login page with portal credentials sign-in"
```

---

## Task 6: 상수 + 검증 스키마 (PostType, 게시물/프로필)

**Files:**
- Modify: `constants/enums.ts`
- Create: `validations/post.ts`, `validations/post.test.ts`

- [ ] **Step 1: `constants/enums.ts` 에 PostType 추가 (파일 끝에 append)**

```typescript
// 게시물 유형
export enum PostType {
  RESUME = "RESUME",
  COVER_LETTER = "COVER_LETTER",
  PORTFOLIO = "PORTFOLIO",
}

export const PostTypeLabels: Record<PostType, string> = {
  [PostType.RESUME]: "이력서",
  [PostType.COVER_LETTER]: "자소서",
  [PostType.PORTFOLIO]: "포트폴리오",
};
```

- [ ] **Step 2: 실패 테스트 작성**

Create `validations/post.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { postInputSchema, profileSchema } from "@/validations/post";

describe("postInputSchema", () => {
  it("accepts a post with a link and no file", () => {
    const r = postInputSchema.safeParse({
      type: "RESUME",
      title: "내 이력서",
      linkUrl: "https://github.com/me",
      hasFile: false,
    });
    expect(r.success).toBe(true);
  });

  it("accepts a post with a file and no link", () => {
    const r = postInputSchema.safeParse({
      type: "PORTFOLIO",
      title: "포폴",
      hasFile: true,
    });
    expect(r.success).toBe(true);
  });

  it("rejects a post with neither file nor link", () => {
    const r = postInputSchema.safeParse({
      type: "PORTFOLIO",
      title: "빈 글",
      hasFile: false,
    });
    expect(r.success).toBe(false);
  });

  it("rejects invalid type", () => {
    const r = postInputSchema.safeParse({ type: "X", title: "t", hasFile: true });
    expect(r.success).toBe(false);
  });
});

describe("profileSchema", () => {
  it("requires a non-empty name", () => {
    expect(profileSchema.safeParse({ name: "" }).success).toBe(false);
    expect(profileSchema.safeParse({ name: "홍길동" }).success).toBe(true);
  });
});
```

- [ ] **Step 3: 테스트 실패 확인**

Run: `npm test -- validations/post`
Expected: FAIL — 모듈 없음.

- [ ] **Step 4: `validations/post.ts` 구현**

```typescript
import * as z from "zod";
import { PostType } from "@/constants/enums";

export const postInputSchema = z
  .object({
    type: z.nativeEnum(PostType),
    title: z.string().min(1, "제목을 입력하세요.").max(100),
    description: z.string().max(2000).optional().or(z.literal("")),
    linkUrl: z
      .string()
      .url("올바른 URL을 입력하세요.")
      .optional()
      .or(z.literal("")),
    hasFile: z.boolean(),
  })
  .refine((v) => v.hasFile || (v.linkUrl && v.linkUrl.length > 0), {
    message: "파일 또는 링크 중 하나는 반드시 입력해야 합니다.",
    path: ["linkUrl"],
  });

export type PostInput = z.infer<typeof postInputSchema>;

export const profileSchema = z.object({
  name: z.string().min(1, "이름을 입력하세요.").max(30),
  department: z.string().max(50).optional().or(z.literal("")),
});

export type ProfileInput = z.infer<typeof profileSchema>;
```

- [ ] **Step 5: 테스트 통과 확인**

Run: `npm test -- validations/post`
Expected: PASS (5 tests).

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: add PostType enum and post/profile zod schemas with tests"
```

---

## Task 7: 프로필 API + 온보딩 페이지

**Files:**
- Create: `app/api/profile/route.ts`, `app/onboarding/page.tsx`, `server/profile.ts`

- [ ] **Step 1: `server/profile.ts` (세션 헬퍼) 작성**

```typescript
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function getSessionUser() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;
  return prisma.user.findUnique({ where: { id: session.user.id } });
}
```

- [ ] **Step 2: `app/api/profile/route.ts` 작성**

```typescript
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { prisma } from "@/lib/prisma";
import { profileSchema } from "@/validations/post";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = profileSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400 }
    );

  const user = await prisma.user.update({
    where: { id: session.user.id },
    data: {
      name: parsed.data.name,
      department: parsed.data.department || null,
    },
  });
  return NextResponse.json({ ok: true, name: user.name });
}
```

- [ ] **Step 3: `app/onboarding/page.tsx` 작성**

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Input from "@/components/ui/input";

export default function OnboardingPage() {
  const router = useRouter();
  const { update } = useSession();
  const [name, setName] = useState("");
  const [department, setDepartment] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const res = await fetch("/api/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, department }),
    });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setError(d.error ?? "저장에 실패했습니다.");
      return;
    }
    await update();
    router.push("/");
    router.refresh();
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-sm flex flex-col gap-4 rounded-2xl bg-gray-900 p-8 ring-1 ring-gray-800"
      >
        <h1 className="text-2xl font-bold">프로필 설정</h1>
        <p className="text-sm text-gray-400">다른 학생에게 보일 이름을 입력하세요.</p>
        <Input placeholder="이름 (필수)" value={name} onChange={(e) => setName(e.target.value)} />
        <Input placeholder="학과 (선택)" value={department} onChange={(e) => setDepartment(e.target.value)} />
        {error && <p className="text-sm text-red-400">{error}</p>}
        <button type="submit" className="mt-2 rounded-xl bg-indigo-600 py-2.5 font-semibold hover:bg-indigo-500 transition-colors">
          저장하고 시작하기
        </button>
      </form>
    </main>
  );
}
```

- [ ] **Step 4: 둘러보기 페이지에서 이름 없으면 온보딩으로 보내는 가드 추가 준비**

(실제 가드는 Task 9의 `app/page.tsx` 서버 컴포넌트에서 `getSessionUser()` 의 `name` 검사로 구현한다. 여기서는 API/페이지만 확인.)

- [ ] **Step 5: 수동 검증**

Run: 로그인된 상태에서 `http://localhost:3000/onboarding` 접속, 이름 입력 후 저장 → `/` 이동. DB 확인: `npx prisma studio` 또는 `npx prisma db execute --stdin <<< "select studentNo,name from User;"`.
Expected: 해당 유저 `name` 채워짐.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: add profile API and onboarding page"
```

---

## Task 8: 파일 업로드 유틸 + 게시물 API

**Files:**
- Create: `lib/uploads.ts`, `app/api/posts/route.ts`, `app/api/posts/[id]/route.ts`, `app/api/files/[...path]/route.ts`, `server/posts.ts`

- [ ] **Step 1: `lib/uploads.ts` 작성**

```typescript
import { writeFile, mkdir, unlink } from "fs/promises";
import path from "path";

const UPLOAD_DIR = process.env.UPLOAD_DIR ?? "./uploads";
const ALLOWED = new Set(["application/pdf", "image/png", "image/jpeg"]);
const MAX_BYTES = 10 * 1024 * 1024; // 10MB

export async function saveUpload(
  file: File
): Promise<{ filePath: string; fileName: string }> {
  if (!ALLOWED.has(file.type)) throw new Error("PDF 또는 이미지(PNG/JPG)만 업로드할 수 있습니다.");
  if (file.size > MAX_BYTES) throw new Error("파일 크기는 10MB를 넘을 수 없습니다.");

  const buf = Buffer.from(await file.arrayBuffer());
  const safeBase = `${Date.now()}-${Math.round(buf.length)}`;
  const ext = path.extname(file.name).slice(0, 10) || "";
  const rel = `${safeBase}${ext}`;
  const abs = path.join(UPLOAD_DIR, rel);

  await mkdir(UPLOAD_DIR, { recursive: true });
  await writeFile(abs, buf);
  return { filePath: rel, fileName: file.name };
}

export async function deleteUpload(filePath: string | null) {
  if (!filePath) return;
  try {
    await unlink(path.join(UPLOAD_DIR, filePath));
  } catch {
    /* 이미 없으면 무시 */
  }
}

export function uploadAbsPath(filePath: string) {
  return path.join(UPLOAD_DIR, filePath);
}
```

> 파일명은 타임스탬프+길이로 생성해 경로 조작/충돌을 방지한다. `Math.round(buf.length)`는 인덱스용 단순 접미사다.

- [ ] **Step 2: `server/posts.ts` (조회 함수) 작성**

```typescript
import { prisma } from "@/lib/prisma";
import { PostType } from "@/constants/enums";

export async function listPosts(opts: { type?: PostType; q?: string } = {}) {
  return prisma.post.findMany({
    where: {
      ...(opts.type ? { type: opts.type } : {}),
      ...(opts.q
        ? {
            OR: [
              { title: { contains: opts.q } },
              { author: { is: { name: { contains: opts.q } } } },
              { author: { is: { studentNo: { contains: opts.q } } } },
            ],
          }
        : {}),
    },
    orderBy: { createdAt: "desc" },
    include: { author: { select: { name: true, studentNo: true, department: true } } },
  });
}

export async function getPost(id: string) {
  return prisma.post.findUnique({
    where: { id },
    include: { author: { select: { id: true, name: true, studentNo: true, department: true } } },
  });
}
```

- [ ] **Step 3: `app/api/posts/route.ts` (목록 GET + 생성 POST) 작성**

```typescript
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { prisma } from "@/lib/prisma";
import { saveUpload } from "@/lib/uploads";
import { postInputSchema } from "@/validations/post";
import { listPosts } from "@/server/posts";
import { PostType } from "@/constants/enums";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const typeParam = searchParams.get("type") as PostType | null;
  const q = searchParams.get("q") ?? undefined;
  const type =
    typeParam && Object.values(PostType).includes(typeParam) ? typeParam : undefined;
  const posts = await listPosts({ type, q });
  return NextResponse.json({ posts });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const form = await req.formData();
  const file = form.get("file");
  const hasFile = file instanceof File && file.size > 0;

  const parsed = postInputSchema.safeParse({
    type: form.get("type"),
    title: form.get("title"),
    description: form.get("description") ?? "",
    linkUrl: form.get("linkUrl") ?? "",
    hasFile,
  });
  if (!parsed.success)
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });

  let filePath: string | null = null;
  let fileName: string | null = null;
  if (hasFile) {
    try {
      const saved = await saveUpload(file as File);
      filePath = saved.filePath;
      fileName = saved.fileName;
    } catch (e) {
      return NextResponse.json({ error: (e as Error).message }, { status: 400 });
    }
  }

  const post = await prisma.post.create({
    data: {
      type: parsed.data.type,
      title: parsed.data.title,
      description: parsed.data.description || null,
      linkUrl: parsed.data.linkUrl || null,
      filePath,
      fileName,
      authorId: session.user.id,
    },
  });
  return NextResponse.json({ ok: true, id: post.id });
}
```

- [ ] **Step 4: `app/api/posts/[id]/route.ts` (GET/PATCH/DELETE) 작성**

```typescript
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { prisma } from "@/lib/prisma";
import { deleteUpload, saveUpload } from "@/lib/uploads";
import { postInputSchema } from "@/validations/post";
import { getPost } from "@/server/posts";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Ctx) {
  const { id } = await params;
  const post = await getPost(id);
  if (!post) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json({ post });
}

async function requireOwner(id: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return { error: "unauthorized" as const, status: 401 };
  const post = await prisma.post.findUnique({ where: { id } });
  if (!post) return { error: "not found" as const, status: 404 };
  if (post.authorId !== session.user.id)
    return { error: "forbidden" as const, status: 403 };
  return { post };
}

export async function PATCH(req: Request, { params }: Ctx) {
  const { id } = await params;
  const guard = await requireOwner(id);
  if ("error" in guard) return NextResponse.json({ error: guard.error }, { status: guard.status });

  const form = await req.formData();
  const file = form.get("file");
  const newFile = file instanceof File && file.size > 0;
  const hasFile = newFile || Boolean(guard.post.filePath);

  const parsed = postInputSchema.safeParse({
    type: form.get("type"),
    title: form.get("title"),
    description: form.get("description") ?? "",
    linkUrl: form.get("linkUrl") ?? "",
    hasFile,
  });
  if (!parsed.success)
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });

  let { filePath, fileName } = guard.post;
  if (newFile) {
    try {
      await deleteUpload(guard.post.filePath);
      const saved = await saveUpload(file as File);
      filePath = saved.filePath;
      fileName = saved.fileName;
    } catch (e) {
      return NextResponse.json({ error: (e as Error).message }, { status: 400 });
    }
  }

  await prisma.post.update({
    where: { id },
    data: {
      type: parsed.data.type,
      title: parsed.data.title,
      description: parsed.data.description || null,
      linkUrl: parsed.data.linkUrl || null,
      filePath,
      fileName,
    },
  });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: Ctx) {
  const { id } = await params;
  const guard = await requireOwner(id);
  if ("error" in guard) return NextResponse.json({ error: guard.error }, { status: guard.status });
  await deleteUpload(guard.post.filePath);
  await prisma.post.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 5: `app/api/files/[...path]/route.ts` (파일 서빙) 작성**

```typescript
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { readFile } from "fs/promises";
import { uploadAbsPath } from "@/lib/uploads";
import path from "path";

type Ctx = { params: Promise<{ path: string[] }> };

export async function GET(_req: Request, { params }: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { path: parts } = await params;
  const rel = parts.join("/");
  // 경로 조작 방지: 정규화 후 단일 세그먼트만 허용
  if (rel.includes("..") || rel.includes("/"))
    return NextResponse.json({ error: "bad path" }, { status: 400 });

  try {
    const buf = await readFile(uploadAbsPath(rel));
    const ext = path.extname(rel).toLowerCase();
    const ctype =
      ext === ".pdf" ? "application/pdf" : ext === ".png" ? "image/png" : "image/jpeg";
    return new NextResponse(buf, { headers: { "Content-Type": ctype } });
  } catch {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
}
```

- [ ] **Step 6: 타입체크 + 빌드 확인**

Run: `npx tsc --noEmit`
Expected: 에러 없음.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: add post CRUD API, file upload util, and file serving route"
```

---

## Task 9: 둘러보기(목록) + 카드/탭 컴포넌트

**Files:**
- Create: `components/posts/PostCard.tsx`, `components/posts/TypeTabs.tsx`
- Modify: `app/page.tsx`

- [ ] **Step 1: `components/posts/TypeTabs.tsx` 작성**

```tsx
"use client";

import Link from "next/link";
import { PostType, PostTypeLabels } from "@/constants/enums";

const TABS: { key: string; label: string }[] = [
  { key: "", label: "전체" },
  ...Object.values(PostType).map((t) => ({ key: t, label: PostTypeLabels[t] })),
];

export default function TypeTabs({ active }: { active: string }) {
  return (
    <div className="flex gap-2">
      {TABS.map((t) => (
        <Link
          key={t.key}
          href={t.key ? `/?type=${t.key}` : "/"}
          className={`rounded-full px-4 py-1.5 text-sm transition-colors ${
            active === t.key
              ? "bg-indigo-600 text-white"
              : "bg-gray-800 text-gray-300 hover:bg-gray-700"
          }`}
        >
          {t.label}
        </Link>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: `components/posts/PostCard.tsx` 작성**

```tsx
import Link from "next/link";
import { PostType, PostTypeLabels } from "@/constants/enums";

type CardPost = {
  id: string;
  type: string;
  title: string;
  description: string | null;
  linkUrl: string | null;
  fileName: string | null;
  author: { name: string | null; studentNo: string; department: string | null };
};

export default function PostCard({ post }: { post: CardPost }) {
  const label = PostTypeLabels[post.type as PostType] ?? post.type;
  return (
    <Link
      href={`/posts/${post.id}`}
      className="flex flex-col gap-2 rounded-2xl bg-gray-900 p-5 ring-1 ring-gray-800 hover:ring-indigo-500 transition"
    >
      <span className="w-fit rounded-full bg-indigo-600/20 px-2.5 py-0.5 text-xs text-indigo-300">
        {label}
      </span>
      <h3 className="font-semibold text-lg line-clamp-1">{post.title}</h3>
      {post.description && (
        <p className="text-sm text-gray-400 line-clamp-2">{post.description}</p>
      )}
      <div className="mt-auto flex items-center gap-2 pt-2 text-xs text-gray-500">
        <span>{post.author.name ?? post.author.studentNo}</span>
        {post.author.department && <span>· {post.author.department}</span>}
        {post.fileName && <span>· 📎 파일</span>}
        {post.linkUrl && <span>· 🔗 링크</span>}
      </div>
    </Link>
  );
}
```

- [ ] **Step 3: `app/page.tsx` 를 서버 컴포넌트 목록으로 교체**

```tsx
import { redirect } from "next/navigation";
import Link from "next/link";
import { getSessionUser } from "@/server/profile";
import { listPosts } from "@/server/posts";
import { PostType } from "@/constants/enums";
import PostCard from "@/components/posts/PostCard";
import TypeTabs from "@/components/posts/TypeTabs";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; q?: string }>;
}) {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (!user.name) redirect("/onboarding");

  const { type: typeParam, q } = await searchParams;
  const type =
    typeParam && Object.values(PostType).includes(typeParam as PostType)
      ? (typeParam as PostType)
      : undefined;

  const posts = await listPosts({ type, q });

  return (
    <main className="mx-auto max-w-5xl p-6 flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">둘러보기</h1>
        <Link href="/posts/new" className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold hover:bg-indigo-500 transition-colors">
          + 새 글
        </Link>
      </div>

      <form className="flex gap-2">
        <input
          name="q"
          defaultValue={q ?? ""}
          placeholder="제목·이름·학번 검색"
          className="flex-1 rounded-xl bg-gray-800 px-4 py-2 text-sm outline-none ring-1 ring-gray-700 focus:ring-indigo-500"
        />
        <button className="rounded-xl bg-gray-700 px-4 text-sm hover:bg-gray-600">검색</button>
      </form>

      <TypeTabs active={typeParam ?? ""} />

      {posts.length === 0 ? (
        <p className="py-20 text-center text-gray-500">아직 게시물이 없습니다.</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((p) => (
            <PostCard key={p.id} post={p} />
          ))}
        </div>
      )}
    </main>
  );
}
```

- [ ] **Step 4: 수동 검증**

Run: 로그인+이름설정 상태에서 `http://localhost:3000/` 접속.
Expected: 헤더 + 탭 + (빈 상태 문구 또는 카드 그리드). 탭 클릭 시 `?type=` 쿼리로 필터.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: add browse page with type tabs, search, and post cards"
```

---

## Task 10: 게시물 작성/수정 폼 + 페이지

**Files:**
- Create: `components/posts/PostForm.tsx`, `app/posts/new/page.tsx`, `app/posts/[id]/edit/page.tsx`

- [ ] **Step 1: `components/posts/PostForm.tsx` 작성**

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PostType, PostTypeLabels } from "@/constants/enums";

type Initial = {
  id?: string;
  type?: string;
  title?: string;
  description?: string | null;
  linkUrl?: string | null;
  fileName?: string | null;
};

export default function PostForm({ initial }: { initial?: Initial }) {
  const router = useRouter();
  const editing = Boolean(initial?.id);
  const [type, setType] = useState(initial?.type ?? PostType.RESUME);
  const [title, setTitle] = useState(initial?.title ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [linkUrl, setLinkUrl] = useState(initial?.linkUrl ?? "");
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const fd = new FormData();
    fd.set("type", type);
    fd.set("title", title);
    fd.set("description", description ?? "");
    fd.set("linkUrl", linkUrl ?? "");
    if (file) fd.set("file", file);

    const url = editing ? `/api/posts/${initial!.id}` : "/api/posts";
    const res = await fetch(url, { method: editing ? "PATCH" : "POST", body: fd });
    setLoading(false);

    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setError(d.error ?? "저장에 실패했습니다.");
      return;
    }
    const data = await res.json().catch(() => ({}));
    router.push(editing ? `/posts/${initial!.id}` : `/posts/${data.id}`);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <div className="flex gap-2">
        {Object.values(PostType).map((t) => (
          <button
            type="button"
            key={t}
            onClick={() => setType(t)}
            className={`rounded-full px-4 py-1.5 text-sm ${
              type === t ? "bg-indigo-600" : "bg-gray-800 text-gray-300"
            }`}
          >
            {PostTypeLabels[t]}
          </button>
        ))}
      </div>

      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="제목"
        className="rounded-xl bg-gray-800 px-4 py-2.5 text-sm outline-none ring-1 ring-gray-700 focus:ring-indigo-500"
      />
      <textarea
        value={description ?? ""}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="설명 (선택)"
        rows={4}
        className="rounded-xl bg-gray-800 px-4 py-2.5 text-sm outline-none ring-1 ring-gray-700 focus:ring-indigo-500"
      />
      <input
        value={linkUrl ?? ""}
        onChange={(e) => setLinkUrl(e.target.value)}
        placeholder="외부 링크 (노션/GitHub 등, 선택)"
        className="rounded-xl bg-gray-800 px-4 py-2.5 text-sm outline-none ring-1 ring-gray-700 focus:ring-indigo-500"
      />
      <label className="text-sm text-gray-400">
        파일 (PDF/PNG/JPG, 최대 10MB)
        {initial?.fileName && <span className="ml-2 text-gray-500">현재: {initial.fileName}</span>}
        <input
          type="file"
          accept="application/pdf,image/png,image/jpeg"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          className="mt-1 block w-full text-sm text-gray-300 file:mr-3 file:rounded-lg file:border-0 file:bg-gray-700 file:px-3 file:py-1.5 file:text-white"
        />
      </label>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="rounded-xl bg-indigo-600 py-2.5 font-semibold hover:bg-indigo-500 disabled:opacity-50 transition-colors"
      >
        {loading ? "저장 중..." : editing ? "수정하기" : "올리기"}
      </button>
    </form>
  );
}
```

- [ ] **Step 2: `app/posts/new/page.tsx` 작성**

```tsx
import { redirect } from "next/navigation";
import { getSessionUser } from "@/server/profile";
import PostForm from "@/components/posts/PostForm";

export default async function NewPostPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (!user.name) redirect("/onboarding");

  return (
    <main className="mx-auto max-w-xl p-6 flex flex-col gap-6">
      <h1 className="text-2xl font-bold">새 게시물</h1>
      <PostForm />
    </main>
  );
}
```

- [ ] **Step 3: `app/posts/[id]/edit/page.tsx` 작성**

```tsx
import { redirect, notFound } from "next/navigation";
import { getSessionUser } from "@/server/profile";
import { getPost } from "@/server/posts";
import PostForm from "@/components/posts/PostForm";

export default async function EditPostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  const { id } = await params;
  const post = await getPost(id);
  if (!post) notFound();
  if (post.author.id !== user.id) redirect(`/posts/${id}`);

  return (
    <main className="mx-auto max-w-xl p-6 flex flex-col gap-6">
      <h1 className="text-2xl font-bold">게시물 수정</h1>
      <PostForm
        initial={{
          id: post.id,
          type: post.type,
          title: post.title,
          description: post.description,
          linkUrl: post.linkUrl,
          fileName: post.fileName,
        }}
      />
    </main>
  );
}
```

- [ ] **Step 4: 수동 검증**

Run: `/posts/new` 에서 제목 없이 제출 → 에러. 제목 + 링크 입력 후 제출 → 상세로 이동. 파일만 첨부 후 제출 → 정상. 둘 다 없이 → "파일 또는 링크 중 하나" 에러.
Expected: 위 동작.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: add post create/edit form and pages"
```

---

## Task 11: 게시물 상세 페이지

**Files:**
- Create: `app/posts/[id]/page.tsx`

- [ ] **Step 1: 상세 페이지 작성**

```tsx
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { getSessionUser } from "@/server/profile";
import { getPost } from "@/server/posts";
import { PostType, PostTypeLabels } from "@/constants/enums";

export default async function PostDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const { id } = await params;
  const post = await getPost(id);
  if (!post) notFound();

  const isOwner = post.author.id === user.id;
  const isPdf = post.fileName?.toLowerCase().endsWith(".pdf");
  const fileUrl = post.filePath ? `/api/files/${post.filePath}` : null;

  return (
    <main className="mx-auto max-w-3xl p-6 flex flex-col gap-5">
      <Link href="/" className="text-sm text-gray-400 hover:text-white">← 둘러보기</Link>

      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-2">
          <span className="w-fit rounded-full bg-indigo-600/20 px-2.5 py-0.5 text-xs text-indigo-300">
            {PostTypeLabels[post.type as PostType] ?? post.type}
          </span>
          <h1 className="text-2xl font-bold">{post.title}</h1>
          <p className="text-sm text-gray-400">
            {post.author.name ?? post.author.studentNo}
            {post.author.department && ` · ${post.author.department}`}
          </p>
        </div>
        {isOwner && (
          <Link href={`/posts/${post.id}/edit`} className="rounded-lg bg-gray-800 px-3 py-1.5 text-sm hover:bg-gray-700">
            수정/삭제
          </Link>
        )}
      </div>

      {post.description && (
        <p className="whitespace-pre-wrap text-gray-200">{post.description}</p>
      )}

      {post.linkUrl && (
        <a href={post.linkUrl} target="_blank" rel="noopener noreferrer" className="w-fit rounded-xl bg-gray-800 px-4 py-2 text-sm hover:bg-gray-700">
          🔗 외부 링크 열기
        </a>
      )}

      {fileUrl && (
        <div className="flex flex-col gap-3">
          <a href={fileUrl} download={post.fileName ?? undefined} className="w-fit rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold hover:bg-indigo-500">
            📎 {post.fileName} 다운로드
          </a>
          {isPdf && (
            <iframe src={fileUrl} className="h-[80vh] w-full rounded-xl ring-1 ring-gray-800" />
          )}
          {!isPdf && (
            <img src={fileUrl} alt={post.fileName ?? "첨부 이미지"} className="rounded-xl ring-1 ring-gray-800" />
          )}
        </div>
      )}
    </main>
  );
}
```

- [ ] **Step 2: 수동 검증**

Run: 작성한 게시물의 `/posts/[id]` 접속. PDF면 미리보기 iframe, 이미지면 `<img>`, 링크면 버튼. 본인 글이면 "수정/삭제" 버튼 노출.
Expected: 위 동작.

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat: add post detail page with file preview and download"
```

---

## Task 12: 내 보관함(삭제 포함) + 이름 수정

**Files:**
- Create: `app/me/page.tsx`, `components/posts/DeleteButton.tsx`

- [ ] **Step 1: `components/posts/DeleteButton.tsx` 작성 (클라이언트)**

```tsx
"use client";

import { useRouter } from "next/navigation";

export default function DeleteButton({ id }: { id: string }) {
  const router = useRouter();
  async function onDelete() {
    if (!confirm("정말 삭제하시겠습니까?")) return;
    const res = await fetch(`/api/posts/${id}`, { method: "DELETE" });
    if (res.ok) router.refresh();
    else alert("삭제에 실패했습니다.");
  }
  return (
    <button onClick={onDelete} className="rounded-lg bg-red-600/20 px-3 py-1 text-xs text-red-300 hover:bg-red-600/30">
      삭제
    </button>
  );
}
```

- [ ] **Step 2: `app/me/page.tsx` 작성**

```tsx
import { redirect } from "next/navigation";
import Link from "next/link";
import { getSessionUser } from "@/server/profile";
import { prisma } from "@/lib/prisma";
import { PostType, PostTypeLabels } from "@/constants/enums";
import DeleteButton from "@/components/posts/DeleteButton";

export default async function MePage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (!user.name) redirect("/onboarding");

  const posts = await prisma.post.findMany({
    where: { authorId: user.id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <main className="mx-auto max-w-3xl p-6 flex flex-col gap-6">
      <section className="rounded-2xl bg-gray-900 p-5 ring-1 ring-gray-800">
        <h2 className="text-lg font-bold">내 프로필</h2>
        <p className="mt-1 text-sm text-gray-400">
          {user.name} · {user.studentNo}
          {user.department && ` · ${user.department}`}
        </p>
        <Link href="/onboarding" className="mt-3 inline-block rounded-lg bg-gray-800 px-3 py-1.5 text-sm hover:bg-gray-700">
          이름/학과 수정
        </Link>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-bold">내 게시물 ({posts.length})</h2>
        {posts.length === 0 ? (
          <p className="text-gray-500">아직 올린 게시물이 없습니다.</p>
        ) : (
          posts.map((p) => (
            <div key={p.id} className="flex items-center justify-between rounded-xl bg-gray-900 p-4 ring-1 ring-gray-800">
              <Link href={`/posts/${p.id}`} className="flex flex-col">
                <span className="text-xs text-indigo-300">
                  {PostTypeLabels[p.type as PostType] ?? p.type}
                </span>
                <span className="font-medium">{p.title}</span>
              </Link>
              <div className="flex items-center gap-2">
                <Link href={`/posts/${p.id}/edit`} className="rounded-lg bg-gray-800 px-3 py-1 text-xs hover:bg-gray-700">
                  수정
                </Link>
                <DeleteButton id={p.id} />
              </div>
            </div>
          ))
        )}
      </section>
    </main>
  );
}
```

> 이름 수정은 별도 페이지 대신 온보딩 페이지를 재사용한다(동일 폼). YAGNI.

- [ ] **Step 3: 수동 검증**

Run: `/me` 접속 → 프로필 + 내 글 목록. 삭제 버튼 → 확인 후 목록에서 사라짐. 다른 사람 글의 `/posts/[id]/edit` 직접 접근 → 상세로 리다이렉트(권한 차단).
Expected: 위 동작.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: add my-archive page with delete and profile edit"
```

---

## Task 13: 헤더 네비 + 로그인/로그아웃 버튼

**Files:**
- Modify: `components/header/index.tsx`, `components/header/auth-button.tsx`, `components/header/Navbar.tsx`

- [ ] **Step 1: `components/header/auth-button.tsx` 구현**

```tsx
"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";

export default function AuthButtons() {
  const { data: session, status } = useSession();

  if (status === "loading") return null;

  if (!session?.user) {
    return (
      <Link href="/login" className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-semibold hover:bg-indigo-500">
        로그인
      </Link>
    );
  }

  return (
    <div className="flex items-center gap-3 text-sm">
      <span className="text-gray-400">{session.user.name ?? session.user.studentNo}</span>
      <button
        onClick={() => signOut({ callbackUrl: "/login" })}
        className="rounded-lg bg-gray-800 px-3 py-1.5 hover:bg-gray-700"
      >
        로그아웃
      </button>
    </div>
  );
}
```

> 기존 파일은 `export default AuthButtons` (named const) 형태였다. default export 이름은 동일하게 유지한다.

- [ ] **Step 2: `components/header/Navbar.tsx` 작성/교체**

```tsx
"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";

export default function Navbar() {
  const { data: session } = useSession();
  if (!session?.user) return null;

  return (
    <nav className="flex items-center gap-4 text-sm text-gray-300">
      <Link href="/" className="hover:text-white">둘러보기</Link>
      <Link href="/posts/new" className="hover:text-white">새 글</Link>
      <Link href="/me" className="hover:text-white">내 보관함</Link>
    </nav>
  );
}
```

- [ ] **Step 3: `components/header/index.tsx` 작성/교체**

```tsx
import Link from "next/link";
import Navbar from "@/components/header/Navbar";
import AuthButtons from "@/components/header/auth-button";

export default function Header() {
  return (
    <header className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-800 bg-gray-950/80 px-6 py-3 backdrop-blur">
      <Link href="/" className="font-bold tracking-tight">
        <span className="text-indigo-400">JVision</span> Hub
      </Link>
      <Navbar />
      <AuthButtons />
    </header>
  );
}
```

- [ ] **Step 4: 로그인 페이지에서는 헤더가 비도록 확인**

`AuthButtons`/`Navbar`가 세션 없을 때 로그인 링크만/숨김 처리하므로 `/login`에서도 깨지지 않는다. (별도 작업 불필요 — 확인만.)

- [ ] **Step 5: 수동 검증**

Run: 로그인 전/후로 헤더 비교. 로그인 후 둘러보기/새 글/내 보관함 링크 + 이름 + 로그아웃 노출. 로그아웃 → `/login`.
Expected: 위 동작.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: implement header nav with session-aware auth buttons"
```

---

## Task 14: 전체 점검 (E2E 수동 + 빌드)

**Files:** 없음 (검증만)

- [ ] **Step 1: 전체 테스트 통과**

Run: `npm test`
Expected: PASS (vision-auth 3 + post validations 5 = 8 tests).

- [ ] **Step 2: 타입체크 + 프로덕션 빌드**

Run: `npx tsc --noEmit && npm run build`
Expected: 빌드 성공, 타입 에러 없음.

- [ ] **Step 3: 실계정 E2E 시나리오 (수동)**

다음을 순서대로 확인:
1. 비로그인으로 `/` 접근 → `/login` 리다이렉트
2. 실제 비전대 학번/비번 로그인 → 성공
3. 첫 로그인이면 `/onboarding` 강제 → 이름 저장 → `/`
4. `/posts/new` 에서 (a) 링크만 (b) 파일(PDF)만 (c) 둘 다 없음(에러) 케이스
5. 다른 학생 글 상세 열람 (다계정 또는 시드 데이터)
6. 본인 글 수정/삭제
7. 타인 글 `/edit` 직접 URL → 차단
8. 로그아웃 → `/login`
9. Prisma Studio(`npx prisma studio`)로 User 테이블에 **password 컬럼이 없음** 확인

Expected: 전 항목 통과, DB에 비밀번호 흔적 없음.

- [ ] **Step 4: README 갱신**

`README.md` 상단에 프로젝트 설명·실행법(`.env` 설정 → `npx prisma migrate dev` → `npm run dev`)을 추가한다.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "docs: update README; verify full E2E flow and build"
```

---

## Self-Review 결과

**Spec coverage:** 인증(Task 2,3,5) · 비번 미저장(Task 2,3 + Task14 확인) · 이름 온보딩(Task 7,9 가드) · A안 저장(Task 1) · 데이터 모델(Task 1) · 파일+링크(Task 6,8,10) · 7개 화면(Task 5,7,9,10,11,12) · API 라우트(Task 7,8) · 본인만 수정/삭제(Task 8,10,12) · YAGNI 제외 항목 미구현 — 모두 매핑됨.

**Placeholder scan:** 모든 코드 스텝에 실제 코드 포함. "적절한 에러 처리" 류 추상 표현 없음.

**Type consistency:** `verifyVisionLogin(studentNo, password)`, `VisionResult.ok/message`, `getSessionUser()`, `listPosts({type,q})`, `getPost(id)`, `saveUpload/deleteUpload/uploadAbsPath`, `postInputSchema(hasFile)`, `profileSchema(name)`, `PostType`/`PostTypeLabels`, 세션 `user.{id,studentNo,name}` — 정의와 사용처 일치 확인.
