#!/usr/bin/env node
/**
 * C+ 字面色值护栏。
 *
 * 规则（见 docs/design/cplus-token-bridge.md §7）：
 *   1. 字面色值（#hex / rgb() / hsl() / oklch()）只允许出现在 src/ui/tokens/palette.css
 *   2. 原始色板引用 var(--c-*) 只允许出现在 palette.css 与 semantic.css
 *   3. 业务代码禁止回退 HeroUI 主题色 var(--heroui-*)
 *   4. 唯一例外：src/ui/fixtures/placeholder-art.ts（占位素材是**数据**，不是设计令牌）。
 *      该文件反过来要接受更严的检查：字面值不得与 palette.css 里的任何颜色重合。
 *      例外精确到文件，不写成前缀白名单。
 *
 * 用法：
 *   node tools/design-fidelity/check-literals.mjs            # 全量检查
 *   node tools/design-fidelity/check-literals.mjs --staged   # 仅检查 git 暂存文件
 *   node tools/design-fidelity/check-literals.mjs --list     # 查看存量违规清单
 */
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "../..");

/** 第 1 层：唯一允许出现字面色值的文件 */
const PALETTE_FILE = "src/ui/tokens/palette.css";
/** 第 2 层：唯一允许引用原始色板的文件（与 palette.css 同一层内的引用） */
const SEMANTIC_FILE = "src/ui/tokens/semantic.css";
/** 令牌层整体：允许桥接 HeroUI 主题变量 */
const TOKEN_LAYER_PREFIX = "src/ui/tokens/";
/**
 * 数据豁免：唯一允许出现字面色值的**非令牌层**文件。
 *
 * 这不是「遗留违规」，而是另一类东西：占位封面渐变是**数据**（真实封面来自数据源），
 * 设计上就不该进色板 —— 把数据混进色板会让「这个颜色代表什么设计意图」无法回答。
 * 见 tools/design-fidelity/fixtures/README.md。
 *
 * 豁免范围必须精确到单个文件，且该文件要接受**更严的**检查：它的字面值不得与
 * palette.css 里的任何颜色重合（重合即说明有人把设计决策混进了数据）。
 * 不允许写成前缀白名单 —— 那样等于把整个目录都放行了。
 */
const DATA_ART_FILE = "src/ui/fixtures/placeholder-art.ts";

/**
 * 存量违规白名单：{ 路径前缀: 计划清理阶段 } —— 只减不增。
 * 每条都是「本轮之前就存在的字面色值」，登记目的是让护栏立刻可以开门，
 * 同时保证**任何新增**的字面色值都会被拦下。清理阶段与该文件的处置一致。
 */
const LEGACY_ALLOWLIST = new Map([
  ["src/app.css", "P1 · os-scrollbar 颜色迁入令牌层"],
  [
    "src/common/constants/theme.ts",
    "P6 · HeroUI 主题桥接：第三方库要真实色值（吃不了 var()），值须与色板同源，暂由单测钉住",
  ],
  ["src/components/audio-waveform/index.tsx", "P5 · 频谱改用令牌"],
  ["src/components/color-picker/index.tsx", "P6 · 随自定义外观入口一并移除"],
  ["src/components/confirm-modal/index.tsx", "P2 · Dialog 包装层重绘"],
  ["src/components/full-screen-player/", "P5 · 由 /now-playing 沉浸态替代后删除"],
  ["src/components/lyrics/index.tsx", "P2 · LyricsPanel 重绘"],
  ["src/components/music-list-item/", "P2 · 收敛进 TrackTable 后删除"],
  ["src/components/music-page-list/", "P2 · 收敛进 TrackTable 后删除"],
  ["src/components/music-playlist-drawer/", "P5 · 提升为 /queue 路由页后删除"],
  ["src/pages/dynamic-feed/", "P6 · 延展屏迁移"],
  ["src/pages/search/user-list/", "P3 · 第 06 屏重写"],
  ["src/pages/user-profile/", "P6 · 延展屏迁移"],
  ["src/store/full-screen-player-settings.ts", "P5 · 沉浸态设置迁移"],
]);

const SCAN_EXTENSIONS = new Set([".ts", ".tsx", ".css", ".js", ".jsx", ".mjs"]);
const SKIP_DIRS = new Set(["node_modules", "dist", ".git", "prototypes", "tools", "docs"]);

const HEX = /#[0-9a-fA-F]{3,8}\b/;
const FUNC_COLOR = /\b(?:rgba?|hsla?|oklch|oklab|lab|lch|color)\s*\(/i;
const PALETTE_REF = /var\(\s*--c-/;
const HERUI_THEME = /var\(\s*--heroui-/;

/**
 * 合法写法：令牌引用，如 rgb(var(--biu-surface-canvas)) / rgb(var(--biu-x) / 0.88)
 * 这类调用不含字面数值，不构成违规。
 */
const TOKEN_CHANNEL_CALL = /\b(?:rgba?|hsla?)\(\s*var\(--[\w-]+\)(?:\s*\/\s*[\d.]+%?)?\s*\)/gi;

/** 允许的例外：完全透明与无彩色关键字不构成视觉令牌违规 */
const ALLOWED_PATTERNS = [
  /rgba?\(\s*(?:255\s*,\s*255\s*,\s*255|0\s*,\s*0\s*,\s*0)\s*,\s*0\s*\)/gi,
  /rgba?\(\s*0\s+0\s+0\s*\/\s*0\s*\)/gi,
  /\btransparent\b/gi,
  /\bcurrentColor\b/gi,
  /\binherit\b/gi,
];

function listFiles({ staged }) {
  if (staged) {
    const out = execFileSync("git", ["diff", "--cached", "--name-only", "--diff-filter=ACMR"], {
      cwd: ROOT,
      encoding: "utf8",
    });
    return out
      .split("\n")
      .filter(Boolean)
      .map(f => path.resolve(ROOT, f))
      .filter(f => SCAN_EXTENSIONS.has(path.extname(f)) && f.includes("/src/"));
  }
  const out = execFileSync("git", ["ls-files", "--cached", "--others", "--exclude-standard"], {
    cwd: ROOT,
    encoding: "utf8",
  });
  return out
    .split("\n")
    .filter(Boolean)
    .map(f => path.join(ROOT, f))
    .filter(f => {
      const rel = path.relative(ROOT, f);
      if (!rel.startsWith("src/")) return false;
      if (!SCAN_EXTENSIONS.has(path.extname(f))) return false;
      return !rel.split("/").some(part => SKIP_DIRS.has(part));
    })
    .filter(f => existsSync(f));
}

function stripAllowed(text) {
  let out = text;
  for (const pattern of ALLOWED_PATTERNS) out = out.replace(pattern, " ");
  // 合法的令牌引用整体抹掉，避免 rgb(var(--biu-*)) 被误判为字面颜色函数
  out = out.replace(TOKEN_CHANNEL_CALL, " ");
  return out;
}

/**
 * 把文本里出现的颜色字面值统一归一化成 `r,g,b`（忽略 alpha），用于**跨文件比对**。
 * 只支持本项目实际出现的写法：`#rrggbb` / `#rgb` / `rgb(r g b / a)` / `rgba(r, g, b, a)`。
 * 认不出来的一律跳过 —— 这个函数的用途是发现「数据文件撞上了设计令牌色」，
 * 不是做完整的 CSS 颜色解析器，宁可漏报也不要误报。
 */
function colorTriples(text) {
  const found = new Set();
  for (const match of text.matchAll(/#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})\b/g)) {
    const hex = match[1];
    const full =
      hex.length === 3
        ? hex
            .split("")
            .map(c => c + c)
            .join("")
        : hex;
    const [r, g, b] = [0, 2, 4].map(i => parseInt(full.slice(i, i + 2), 16));
    found.add(`${r},${g},${b}`);
  }
  for (const match of text.matchAll(/\brgba?\(\s*(\d+)[\s,]+(\d+)[\s,]+(\d+)/g)) {
    found.add(`${Number(match[1])},${Number(match[2])},${Number(match[3])}`);
  }
  return found;
}

/** palette.css 里登记的全部颜色，归一化后的集合。 */
function paletteTriples() {
  // 必须先去掉注释：palette.css 的说明性注释里会举出夹具渐变的例子
  // （例如「占位封面渐变，如 linear-gradient(150deg, #3a3a46, #1c1c22)」），
  // 那些是**文档引用**不是登记值。把注释算进去会让这条检查误报自己写的注释。
  const body = readFileSync(path.join(ROOT, PALETTE_FILE), "utf8").replace(/\/\*[\s\S]*?\*\//g, " ");
  return colorTriples(body);
}

function checkFile(absPath) {
  const rel = path.relative(ROOT, absPath);
  const isPalette = rel === PALETTE_FILE;
  const isSemantic = rel === SEMANTIC_FILE;
  const inTokenLayer = rel.startsWith(TOKEN_LAYER_PREFIX);
  const raw = readFileSync(absPath, "utf8");
  const lines = raw.split("\n");
  const issues = [];

  if (rel === DATA_ART_FILE) {
    const forbidden = paletteTriples();
    for (const triple of colorTriples(raw)) {
      if (forbidden.has(triple)) {
        issues.push([0, "数据文件里出现了设计令牌色", `rgb(${triple.split(",").join(" ")})`]);
      }
    }
    return issues.length ? { file: rel, issues, allowlisted: false } : null;
  }

  lines.forEach((line, index) => {
    const cleaned = stripAllowed(line);
    if (!isPalette) {
      if (HEX.test(cleaned)) issues.push([index + 1, "字面十六进制色值", line.trim()]);
      else if (FUNC_COLOR.test(cleaned)) issues.push([index + 1, "字面颜色函数", line.trim()]);
    }
    if (!isPalette && !isSemantic && PALETTE_REF.test(line)) {
      issues.push([index + 1, "直接引用原始色板 --c-", line.trim()]);
    }
    if (!inTokenLayer && HERUI_THEME.test(line)) {
      issues.push([index + 1, "回退 HeroUI 主题色 --heroui-", line.trim()]);
    }
  });

  if (!issues.length) return null;
  for (const [key] of LEGACY_ALLOWLIST) {
    if (rel.startsWith(key)) return { file: rel, issues, allowlisted: true };
  }
  return { file: rel, issues, allowlisted: false };
}

const staged = process.argv.includes("--staged");
const listOnly = process.argv.includes("--list");
const files = listFiles({ staged });
let violations = 0;
let scanned = 0;
let allowlistedFiles = 0;

for (const file of files) {
  const result = checkFile(file);
  scanned += 1;
  if (!result) continue;

  if (result.allowlisted) {
    allowlistedFiles += 1;
    if (listOnly) {
      const stage = [...LEGACY_ALLOWLIST].find(([key]) => result.file.startsWith(key))?.[1] ?? "?";
      console.log(`${result.file}  ·  ${result.issues.length} 处  ·  ${stage}`);
    }
    continue;
  }

  violations += result.issues.length;
  console.error(`\n${result.file}`);
  for (const [line, kind, source] of result.issues) {
    console.error(`  ${String(line).padStart(4)}  ${kind}`);
    console.error(`        ${source.length > 120 ? `${source.slice(0, 117)}…` : source}`);
  }
}

if (listOnly) {
  console.log(`\n存量白名单：${allowlistedFiles} 个文件，${LEGACY_ALLOWLIST.size} 条登记（只减不增）。`);
  process.exit(0);
}

if (violations) {
  console.error(`\n发现 ${violations} 处令牌违规，涉及 ${scanned} 个已扫描文件。`);
  console.error("视觉令牌唯一来源见 docs/design/cplus-token-bridge.md。");
  process.exit(1);
}
console.log(
  `令牌检查通过：扫描 ${scanned} 个文件（其中 ${allowlistedFiles} 个文件命中存量白名单）。` +
    "无新增字面色值、无越层引用原始色板、无 HeroUI 主题回退。",
);
