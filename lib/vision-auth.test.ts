import { describe, it, expect } from "vitest";
import { interpretPortalResponse } from "@/lib/vision-auth";

describe("interpretPortalResponse", () => {
  it("returns ok for SUCCESS + PASS", () => {
    const r = interpretPortalResponse({ status: "SUCCESS", code: "PASS" });
    expect(r.ok).toBe(true);
  });

  it("returns not ok for ERROR status, surfacing the portal message", () => {
    const r = interpretPortalResponse({
      status: "ERROR",
      errorMessage: "유효하지 않은 사용자명입니다.",
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.message).toContain("유효하지");
  });

  it("returns not ok when 2-factor required (code != PASS)", () => {
    const r = interpretPortalResponse({ status: "SUCCESS", code: "2FACTOR" });
    expect(r.ok).toBe(false);
  });
});
