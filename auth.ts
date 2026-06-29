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
    async jwt({ token, user }) {
      if (user) {
        token.uid = user.id;
        token.studentNo = user.studentNo;
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
