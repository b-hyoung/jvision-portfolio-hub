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
});

export type ProfileInput = z.infer<typeof profileSchema>;
