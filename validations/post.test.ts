import { describe, it, expect } from "vitest";
import { postInputSchema, profileSchema } from "@/validations/post";

describe("postInputSchema", () => {
  it("accepts a post with a link and no file", () => {
    const r = postInputSchema.safeParse({
      type: "RESUME",
      linkUrl: "https://github.com/me",
      hasFile: false,
    });
    expect(r.success).toBe(true);
  });

  it("accepts a post with a file and no link", () => {
    const r = postInputSchema.safeParse({
      type: "PORTFOLIO",
      hasFile: true,
    });
    expect(r.success).toBe(true);
  });

  it("rejects a post with neither file nor link", () => {
    const r = postInputSchema.safeParse({
      type: "PORTFOLIO",
      hasFile: false,
    });
    expect(r.success).toBe(false);
  });

  it("rejects invalid type", () => {
    const r = postInputSchema.safeParse({ type: "X", hasFile: true });
    expect(r.success).toBe(false);
  });
});

describe("profileSchema", () => {
  it("requires a non-empty name", () => {
    expect(profileSchema.safeParse({ name: "" }).success).toBe(false);
    expect(profileSchema.safeParse({ name: "홍길동" }).success).toBe(true);
  });
});
