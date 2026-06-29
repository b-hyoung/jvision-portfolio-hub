/** 서버 보내기전 유효성 검사 */

import * as z from "zod";

export const loginFormSchema = z.object({
  studentNo: z.string().min(1, "학번을 입력하세요."),
  password: z.string().min(1, "비밀번호를 입력하세요."),
});

export type LoginFormValues = z.infer<typeof loginFormSchema>;
