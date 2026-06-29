import { describe, it, expect, vi, afterEach } from "vitest";
import { verifyVisionLogin } from "@/lib/vision-auth";

const mockFetch = (json: unknown) =>
  vi.spyOn(globalThis, "fetch").mockResolvedValue(
    new Response(JSON.stringify(json), { status: 200 }) as Response
  );

afterEach(() => vi.restoreAllMocks());

describe("verifyVisionLogin", () => {
  it("returns ok for SUCCESS + PASS", async () => {
    mockFetch({ status: "SUCCESS", code: "PASS" });
    const r = await verifyVisionLogin("202518017", "pw");
    expect(r.ok).toBe(true);
  });

  it("returns not ok for ERROR status", async () => {
    mockFetch({ status: "ERROR", errorMessage: "유효하지 않은 사용자명입니다." });
    const r = await verifyVisionLogin("nope", "pw");
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.message).toContain("유효하지");
  });

  it("returns not ok when 2-factor required (code != PASS)", async () => {
    mockFetch({ status: "SUCCESS", code: "2FACTOR" });
    const r = await verifyVisionLogin("202518017", "pw");
    expect(r.ok).toBe(false);
  });
});
