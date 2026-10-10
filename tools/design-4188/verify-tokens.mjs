#!/usr/bin/env node
import { readFileSync } from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "../..");
const tokenRoot = path.join(root, "src/ui/tokens/4188");
const contract = JSON.parse(readFileSync(path.join(root, "docs/design-4188/phase1/tokens.json"), "utf8"));
const files = ["palette.css", "semantic.css", "geometry.css", "motion.css", "index.css"];
const css = Object.fromEntries(files.map(file => [file, readFileSync(path.join(tokenRoot, file), "utf8")]));
const failures = [];

for (const file of files) {
  if (file !== "index.css" && !css[file].includes(contract.scope))
    failures.push(`${file}: 缺少 ${contract.scope} 作用域`);
}

const requiredSemantic = [
  "canvas",
  "surface",
  "surface-elevated",
  "surface-hover",
  "surface-pressed",
  "border",
  "text-primary",
  "text-secondary",
  "text-muted",
  "text-disabled",
  "action",
  "action-hover",
  "action-soft",
  "selection-bg",
  "playback",
  "playback-hover",
  "playback-soft",
  "favorite",
  "success",
  "warning",
  "error",
  "focus",
  "scrim",
];
for (const name of requiredSemantic) {
  if (!css["semantic.css"].includes(`--lili-4188-${name}:`)) failures.push(`缺少语义令牌 --lili-4188-${name}`);
}

const nonPalette = [css["semantic.css"], css["geometry.css"], css["motion.css"]].join("\n");
if (/#[0-9a-f]{3,8}\b/i.test(nonPalette) || /\b(?:rgb|rgba|hsl|oklch)\s*\(/i.test(nonPalette)) {
  failures.push("非 palette 层出现字面色值");
}
if (/var\(\s*--c-4188-/.test(css["geometry.css"] + css["motion.css"])) {
  failures.push("geometry/motion 越层引用原始色板");
}

const luminance = hex => {
  const channels = hex
    .slice(1)
    .match(/../g)
    .map(value => Number.parseInt(value, 16) / 255);
  const linear = channels.map(value => (value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4));
  return linear[0] * 0.2126 + linear[1] * 0.7152 + linear[2] * 0.0722;
};
const contrast = (a, b) => {
  const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (light + 0.05) / (dark + 0.05);
};
const contrastPairs = [
  ["textPrimary", "canvas", 4.5],
  ["textSecondary", "canvas", 4.5],
  ["textPrimary", "surface", 4.5],
  ["textSecondary", "surface", 4.5],
  ["focus", "canvas", 3],
  ["focus", "surface", 3],
];
const contrasts = {};
for (const [foreground, background, minimum] of contrastPairs) {
  const ratio = contrast(contract.colors[foreground], contract.colors[background]);
  contrasts[`${foreground}/${background}`] = Number(ratio.toFixed(2));
  if (ratio < minimum) failures.push(`${foreground}/${background} 对比度 ${ratio.toFixed(2)} < ${minimum}`);
}

if (!css["index.css"].includes("prefers-reduced-motion: reduce")) failures.push("缺少 reduced-motion 覆盖");
if (!css["index.css"].includes("--lili-4188-duration-fast: 0ms")) failures.push("reduced-motion 未归零动效");

const result = { ok: failures.length === 0, checkedFiles: files.length, contrasts, failures };
console.log(JSON.stringify(result, null, 2));
if (failures.length) process.exitCode = 1;
