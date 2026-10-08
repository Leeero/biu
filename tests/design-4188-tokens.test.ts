import { execFileSync } from "node:child_process";
import { describe, expect, test } from "vitest";

describe("4188 design tokens", () => {
  test("scoped token contract stays valid", () => {
    const output = execFileSync(process.execPath, ["tools/design-4188/verify-tokens.mjs"], {
      cwd: process.cwd(),
      encoding: "utf8",
    });
    expect(JSON.parse(output)).toMatchObject({ ok: true, checkedFiles: 5, failures: [] });
  });
});
