import { prisma } from "@/lib/prisma";
import { PostType } from "@/constants/enums";

export async function listPosts(opts: { type?: PostType; q?: string } = {}) {
  return prisma.post.findMany({
    where: {
      ...(opts.type ? { type: opts.type } : {}),
      ...(opts.q
        ? {
            OR: [
              { description: { contains: opts.q } },
              { author: { is: { name: { contains: opts.q } } } },
              { author: { is: { studentNo: { contains: opts.q } } } },
            ],
          }
        : {}),
    },
    orderBy: { createdAt: "desc" },
    include: { author: { select: { name: true, studentNo: true } } },
  });
}

export async function getPost(id: string) {
  return prisma.post.findUnique({
    where: { id },
    include: { author: { select: { id: true, name: true, studentNo: true } } },
  });
}

/** 한 학생이 올린 모든 슬롯(카테고리별 1개) */
export async function getPostsByAuthor(authorId: string) {
  return prisma.post.findMany({
    where: { authorId },
    orderBy: { createdAt: "desc" },
  });
}
