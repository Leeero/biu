import { describe, expect, it } from "vitest";

import { getSocialTab, getSocialTabHref } from "@/features/social/model";

describe("social page model", () => {
  it("defaults invalid or missing values to the following list", () => {
    expect(getSocialTab(null)).toBe("following");
    expect(getSocialTab("unknown")).toBe("following");
  });

  it("keeps the updates tab addressable for legacy navigation", () => {
    expect(getSocialTab("updates")).toBe("updates");
    expect(getSocialTabHref("updates")).toBe("/follow?tab=updates");
  });
});
