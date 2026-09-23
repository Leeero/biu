import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, test } from "vitest";

const css = readFileSync(path.resolve(process.cwd(), "src/ui/tokens/index.css"), "utf8");

const readRgb = (scope: "light" | "dark", token: string) => {
  const blockPattern = scope === "light" ? /:root,\s*\.light\s*{([^}]*)}/s : /\.dark\s*{([^}]*)}/s;
  const block = css.match(blockPattern)?.[1] ?? "";
  const value = block.match(new RegExp(`--${token}:\\s*(\\d+)\\s+(\\d+)\\s+(\\d+)`));
  if (!value) throw new Error(`Missing ${scope} token: ${token}`);
  return [Number(value[1]), Number(value[2]), Number(value[3])] as const;
};

const luminance = ([red, green, blue]: readonly number[]) => {
  const [r, g, b] = [red, green, blue].map(value => {
    const channel = value / 255;
    return channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

const contrast = (foreground: readonly number[], background: readonly number[]) => {
  const light = Math.max(luminance(foreground), luminance(background));
  const dark = Math.min(luminance(foreground), luminance(background));
  return (light + 0.05) / (dark + 0.05);
};

describe.each(["light", "dark"] as const)("%s design tokens", theme => {
  test("primary text exceeds WCAG AA contrast", () => {
    expect(
      contrast(readRgb(theme, "biu-color-text-primary"), readRgb(theme, "biu-color-canvas")),
    ).toBeGreaterThanOrEqual(4.5);
  });

  test("secondary text exceeds WCAG AA contrast", () => {
    expect(
      contrast(readRgb(theme, "biu-color-text-secondary"), readRgb(theme, "biu-color-canvas")),
    ).toBeGreaterThanOrEqual(4.5);
  });

  test("surface text remains readable", () => {
    expect(
      contrast(readRgb(theme, "biu-color-text-primary"), readRgb(theme, "biu-color-surface")),
    ).toBeGreaterThanOrEqual(4.5);
  });
});

test("motion tokens honor reduced-motion preferences", () => {
  expect(css).toContain("@media (prefers-reduced-motion: reduce)");
  expect(css).toContain("--biu-duration-normal: 0ms");
});
