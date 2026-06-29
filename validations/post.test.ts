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
