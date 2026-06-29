import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { verifyVisionLogin } from "@/lib/vision-auth";
import { prisma } from "@/lib/prisma";

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
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
    async jwt({ token, user, trigger, session }) {
      // 로그인 시점에만 토큰 채움 (매 요청 DB 조회 제거 → 속도 개선)
      if (user) {
        token.uid = user.id;
        token.studentNo = user.studentNo;
        token.name = user.name ?? null;
      }
      // 온보딩에서 update({name}) 호출 시 토큰의 이름 갱신
      if (trigger === "update" && session?.name !== undefined) {
        token.name = session.name;
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
