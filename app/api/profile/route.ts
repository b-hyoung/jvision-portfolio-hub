import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { profileSchema } from "@/validations/post";
import { getCurrentUser } from "@/server/current-user";

export async function POST(req: Request) {
  const me = await getCurrentUser();
  if (!me) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = profileSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400 }
    );

  // me.id는 getCurrentUser가 학번으로 확정한 유효한 id
  const user = await prisma.user.update({
    where: { id: me.id },
    data: { name: parsed.data.name },
  });
  return NextResponse.json({ ok: true, name: user.name });
}
