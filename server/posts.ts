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
