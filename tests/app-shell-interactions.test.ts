import { describe, expect, test } from "vitest";

import { normalizeSearchKeyword, shouldSubmitSearch } from "@/layout/navbar/search/model";
import {
  getSidebarResizeResult,
  getSidebarWidth,
  SIDEBAR_COLLAPSED_WIDTH,
  SIDEBAR_MAX_WIDTH,
  SIDEBAR_MIN_WIDTH,
} from "@/layout/side/model";

describe("app shell interactions", () => {
  test("restores sidebar width inside supported boundaries", () => {
    expect(getSidebarWidth(true, 320)).toBe(SIDEBAR_COLLAPSED_WIDTH);
    expect(getSidebarWidth(false, 80)).toBe(SIDEBAR_MIN_WIDTH);
    expect(getSidebarWidth(false, 720)).toBe(SIDEBAR_MAX_WIDTH);
    expect(getSidebarWidth(false, 236)).toBe(236);
  });

  test("collapses below threshold without losing a valid persisted width", () => {
    expect(getSidebarResizeResult(200, -60)).toEqual({
      isCollapsed: true,
      renderWidth: SIDEBAR_COLLAPSED_WIDTH,
      savedWidth: SIDEBAR_MIN_WIDTH,
    });
  });

  test("caps sidebar drag at its maximum width", () => {
    expect(getSidebarResizeResult(300, 400)).toEqual({
      isCollapsed: false,
      renderWidth: SIDEBAR_MAX_WIDTH,
      savedWidth: SIDEBAR_MAX_WIDTH,
    });
  });

  test("normalizes keyboard search submissions and rejects blank values", () => {
    expect(normalizeSearchKeyword("  周杰伦  ")).toBe("周杰伦");
    expect(shouldSubmitSearch("  周杰伦  ")).toBe(true);
    expect(shouldSubmitSearch("   ")).toBe(false);
  });
});
