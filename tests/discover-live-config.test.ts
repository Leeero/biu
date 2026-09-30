import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, test } from "vitest";

describe("发现音乐真实数据源契约", () => {
  test("B站音乐分区接口保持服务端允许的 15 条分页大小", () => {
    const source = readFileSync(path.resolve(process.cwd(), "src/pages/music-recommend/index.tsx"), "utf8");
    expect(source).toContain("request_cnt: 15");
    expect(source).not.toContain("request_cnt: 24");
  });
});
