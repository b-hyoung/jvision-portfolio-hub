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

  // 세션 id가 아니라 안정적인 학번으로 확정(오래된 세션/DB 교체 대비)
  const user = await prisma.user.upsert({
    where: { studentNo: session.user.studentNo },
    update: { name: parsed.data.name },
    create: { studentNo: session.user.studentNo, name: parsed.data.name },
  });
  return NextResponse.json({ ok: true, name: user.name });
}
