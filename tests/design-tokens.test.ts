/**
 * C+ 令牌真值对照测试。
 *
 * 这是「闸门 1 · 冻结的真值」的强制执行点：把 docs/design/cplus-spec-lock.json
 * 的每条值断言到 CSS 令牌，任一侧漂移即失败。
 *
 * 之所以要通用断言而不是手写常量：手写常量等于把真值抄第二遍，
 * 抄的那一份迟早与真值分叉 —— P0 落地时就在沉浸态背景渐变上发生过一次。
 *
 * 约定见 cplus-spec-lock.json 的 meta.tokenConventions。
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, test } from "vitest";

const ROOT = process.cwd();
const TOKENS_DIR = path.resolve(ROOT, "src/ui/tokens");
const LAYERS = ["palette.css", "semantic.css", "geometry.css", "index.css"] as const;

type Spec = {
  meta: { version: string; tokenConventions: Record<string, string> };
  palette: Record<string, unknown>;
  material: {
    glass: { fill: string; border: string; blur: string; token: string; borderToken: string };
    modal: {
      surface: string;
      surfaceToken: string;
      border: string;
      borderToken: string;
      blur: string;
      blurToken: string;
      shadow: string;
      shadowToken: string;
    };
    badge: {
      defaultChip: string;
      defaultChipToken: string;
      defaultTextToken: string;
      dirChip: string;
      dirChipToken: string;
      dirTextToken: string;
    };
    radius: { tokens: Record<string, string>; [key: string]: unknown };
    scrim: { value: string; token: string };
    scrimVeil: { token: string; stops: string[] };
    /** 播放栏材质（1.3.9 补录）。 */
    playbar: {
      surface: string;
      surfaceToken: string;
      progressTrack: string;
      progressTrackToken: string;
      queuePillSurface: string;
      queuePillSurfaceToken: string;
    };
  };
  typography: {
    scale: Record<
      string,
      {
        token: string;
        size: string;
        weight: number;
        lineHeight: number;
        letterSpacing?: string;
      }
    >;
  };
  globalChrome: {
    search: {
      /** 顶栏搜索位底色（1.3.8 起是独立一格，不复用输入框档位）。 */
      field: { fill: string; token: string };
      /** 快捷键键帽底。 */
      keycap: { token: string };
    };
  };
  tokenMap: Record<string, string>;
  immersiveGeometry: Record<string, unknown>;
  tolerances: { contrastDeltaMax: number; [key: string]: unknown };
};

const spec: Spec = JSON.parse(readFileSync(path.resolve(ROOT, "docs/design/cplus-spec-lock.json"), "utf8")) as Spec;

/* ------------------------------------------------------------------ 解析层 */

const stripComments = (css: string) => css.replace(/\/\*[\s\S]*?\*\//g, "");

const squash = (value: string) => value.replace(/\s+/g, " ").trim();

/**
 * 只收集**不处于 @media / @supports 等 at-rule 内**的自定义属性声明。
 * 这样 `@media (prefers-reduced-motion: reduce)` 里的归零值不会覆盖真值。
 */
const parseDeclarations = (css: string): Map<string, string> => {
  const out = new Map<string, string>();
  const stack: boolean[] = [];
  let buffer = "";

  for (const char of stripComments(css)) {
    if (char === "{") {
      const opener = buffer.trim().startsWith("@") || stack.at(-1) === true;
      stack.push(opener);
      buffer = "";
      continue;
    }
    if (char === "}") {
      stack.pop();
      buffer = "";
      continue;
    }
    if (char === ";") {
      if (stack.at(-1) !== true) {
        const matched = buffer.trim().match(/^(--[\w-]+)\s*:\s*([\s\S]+)$/);
        if (matched) out.set(matched[1], squash(matched[2]));
      }
      buffer = "";
      continue;
    }
    buffer += char;
  }
  return out;
};

const files = new Map(LAYERS.map(name => [name, readFileSync(path.join(TOKENS_DIR, name), "utf8")]));
const tokens = new Map<string, string>();
for (const name of LAYERS) {
  for (const [key, value] of parseDeclarations(files.get(name) ?? "")) tokens.set(key, value);
}

const resolve = (name: string, chain: string[] = []): string => {
  if (chain.includes(name)) throw new Error(`令牌循环引用：${[...chain, name].join(" → ")}`);
  const raw = tokens.get(name);
  if (raw === undefined) throw new Error(`令牌未定义：${name}（引用链 ${chain.join(" → ") || "起点"}）`);
  return raw.replace(/var\(\s*(--[\w-]+)\s*\)/g, (_all, ref: string) => resolve(ref, [...chain, name]));
};

/* -------------------------------------------------------------- 归一化层 */

const hexToTriple = (hex: string): string => {
  let body = hex.replace("#", "");
  if (body.length === 3) body = [...body].map(char => char + char).join("");
  return (body.match(/../g) ?? []).map(pair => String(parseInt(pair, 16))).join(" ");
};

/**
 * 把 `16%` 与 `0.16` 两种透明度写法归一到同一个数字表示，
 * 否则真值写 `rgba(255,255,255,0.16)`、CSS 被 stylelint 改成
 * `rgb(255 255 255 / 16%)` 时会被判成两回事。
 */
const canonAlpha = (raw: string): string => {
  const trimmed = raw.trim();
  const scaled = trimmed.endsWith("%") ? Number(trimmed.slice(0, -1)) / 100 : Number(trimmed);
  return String(Number(scaled.toFixed(4)));
};

const canonRgb = (_all: string, r: string, g: string, b: string, alpha?: string): string =>
  alpha === undefined ? `${r} ${g} ${b}` : `rgba(${r},${g},${b},${canonAlpha(alpha)})`;

const canonRgba = (_all: string, r: string, g: string, b: string, alpha: string): string =>
  `rgba(${r},${g},${b},${canonAlpha(alpha)})`;

/**
 * 把色值归一成可比形式：
 *   #08080A                     → "8 8 10"
 *   rgb(8 8 10)                 → "8 8 10"
 *   rgb(255 255 255 / 16%)      → "rgba(255,255,255,0.16)"   ← stylelint 的现代写法
 *   rgba(255, 255, 255, 0.16)   → "rgba(255,255,255,0.16)"
 *
 * 之所以要接受两种写法：样式表在 stylelint 下统一用空格 + 斜杠，真值表按
 * 设计稿原文用逗号 + 小数，两侧都不能改，只能在比较前归一。
 */
const canon = (value: string): string =>
  squash(value)
    .replace(/#[0-9a-fA-F]{6}\b/g, hexToTriple)
    .replace(/#[0-9a-fA-F]{3}\b/g, hexToTriple)
    .replace(/\brgb\(\s*(\d+)\s+(\d+)\s+(\d+)\s*(?:\/\s*([\d.]+%?)\s*)?\)/gi, canonRgb)
    .replace(/\brgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/gi, "$1 $2 $3")
    .replace(/\brgba\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*([\d.]+%?)\s*\)/gi, canonRgba)
    .replace(/\brgba\(\s*(\d+)\s+(\d+)\s+(\d+)\s*\/\s*([\d.]+%?)\s*\)/gi, canonRgba);

/** 真值里 `700` 这类纯数字视为 px，与 CSS 的 `700px` 对齐。 */
const canonLength = (value: unknown): string => (typeof value === "number" ? `${value}px` : squash(String(value)));

const triple = (name: string): [number, number, number] => {
  const parts = canon(resolve(name)).split(" ");
  if (parts.length !== 3) throw new Error(`${name} 不是三通道令牌：${resolve(name)}`);
  return parts.map(Number) as [number, number, number];
};

const luminance = ([r, g, b]: readonly number[]): number => {
  const [red, green, blue] = [r, g, b].map(value => {
    const channel = value / 255;
    return channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
};

const contrast = (foreground: readonly number[], background: readonly number[]): number => {
  const [light, dark] = [luminance(foreground), luminance(background)].sort((a, b) => b - a);
  return ((light ?? 0) + 0.05) / ((dark ?? 0) + 0.05);
};

const pick = (dottedPath: string): unknown =>
  dottedPath
    .split(".")
    .reduce<unknown>(
      (node, key) => (typeof node === "object" && node !== null ? (node as Record<string, unknown>)[key] : undefined),
      spec as unknown,
    );

/* -------------------------------------------------------------- 覆盖账本 */

/**
 * 被断言覆盖的令牌集合。
 *
 * 存在的理由：真值「登记了令牌」与测试「断言了令牌」是两件事，两者一旦脱钩，
 * 漂移就不会报警 —— P0 收尾时就是这样漏掉了 --biu-radius-image /
 * --biu-radius-window / --biu-scrim / --biu-scrim-veil 四个。
 *
 * 末位的「登记即断言」用例消费本集合，所以每个 describe 在构造用例时
 * 必须把令牌登记进来；文件顺序即账本累积顺序。
 */
const ASSERTED = new Set<string>();

/** 递归收集真值里所有「声明了令牌名」的位置：token / borderToken / tokens.*。 */
const collectDeclared = (node: unknown, found = new Set<string>()): Set<string> => {
  if (Array.isArray(node)) {
    for (const item of node) collectDeclared(item, found);
    return found;
  }
  if (typeof node !== "object" || node === null) return found;
  for (const [key, value] of Object.entries(node)) {
    if ((key === "token" || key === "borderToken") && typeof value === "string") {
      found.add(value);
    } else if (key === "tokens" && typeof value === "object" && value !== null) {
      for (const name of Object.values(value)) if (typeof name === "string") found.add(name);
    }
    collectDeclared(value, found);
  }
  return found;
};

/* ------------------------------------------------------------------ 结构 */

describe("令牌层结构", () => {
  test("index.css 是纯聚合器，按 palette → semantic → geometry 顺序引入", () => {
    const index = files.get("index.css") ?? "";
    const imports = [...index.matchAll(/@import\s+"\.\/([\w-]+\.css)"/g)].map(match => match[1]);
    expect(imports).toEqual(["palette.css", "semantic.css", "geometry.css"]);
  });

  test("字面色值只出现在 palette.css", () => {
    const hex = /#[0-9a-fA-F]{3,8}\b/;
    const colorFunction = /\b(?:rgba?|hsla?|oklch|oklab|lab|lch)\s*\(/i;
    for (const name of ["semantic.css", "geometry.css", "index.css"] as const) {
      const body = stripComments(files.get(name) ?? "").replace(
        /\b(?:rgba?|hsla?)\(\s*var\(--[\w-]+\)(?:\s*\/\s*[\d.]+%?)?\s*\)/gi,
        " ",
      );
      expect(hex.test(body), `${name} 出现字面十六进制色值`).toBe(false);
      expect(colorFunction.test(body), `${name} 出现字面颜色函数`).toBe(false);
    }
  });

  test("原始色板引用只出现在 palette.css 与 semantic.css", () => {
    for (const name of ["geometry.css", "index.css"] as const) {
      expect(/var\(\s*--c-/.test(files.get(name) ?? ""), `${name} 越层引用原始色板`).toBe(false);
    }
  });

  test("所有 var(--c-*) 与 var(--biu-*) 引用都能解析到终点", () => {
    const seen = new Set<string>();
    for (const name of LAYERS) {
      // 必须先去掉注释：文档里会出现 `var(--c-x-rgb)` 这类占位写法，不是真实引用
      const body = stripComments(files.get(name) ?? "");
      for (const match of body.matchAll(/var\(\s*(--(?:c|biu)-[\w-]+)\s*\)/g)) {
        seen.add(match[1] as string);
      }
    }
    // 声明总量与原位引用量都要有下限：防止某次改动把整段令牌静默删掉
    expect(tokens.size).toBeGreaterThanOrEqual(200);
    expect(seen.size).toBeGreaterThanOrEqual(70);
    const dangling: string[] = [];
    for (const name of seen) {
      try {
        const resolved = resolve(name);
        if (/var\(/.test(resolved)) dangling.push(`${name} → ${resolved}`);
      } catch (error) {
        dangling.push((error as Error).message);
      }
    }
    expect(dangling).toEqual([]);
  });
});

/* ------------------------------------------------------------------ 色板 */

describe("色板与真值一致", () => {
  // 用对象数组而非 [key, entry] 元组：元组会被 vitest 展开成多个实参，
  // 导致 $token 之类的用例名插值失效。
  const scalarCases = Object.entries(spec.palette)
    .filter(
      ([key, entry]) =>
        key !== "composite" &&
        key !== "format" &&
        typeof entry === "object" &&
        entry !== null &&
        typeof (entry as { token?: unknown }).token === "string",
    )
    .map(([key, entry]) => ({ key, ...(entry as { value: string; token: string; use: string }) }));

  test("palette 条目数量与真值一致（防止静默漏项）", () => {
    expect(scalarCases.length).toBeGreaterThanOrEqual(16);
  });

  test.each(scalarCases)("$key · $token = $value", ({ token, value }) => {
    expect(canon(resolve(token))).toBe(canon(value));
  });

  const formatCases = Object.entries(
    (spec.palette.format ?? {}) as Record<string, { value: string; token: string }>,
  ).map(([key, entry]) => ({ key, ...entry }));

  test.each(formatCases)("本地格式色 $key · $token = $value", ({ token, value }) => {
    expect(canon(resolve(token))).toBe(canon(value));
  });

  const compositeCases = Object.entries(
    (spec.palette.composite ?? {}) as Record<string, { token: string; parts: string[] }>,
  ).map(([key, entry]) => ({ key, ...entry }));

  // 白色叠加梯度与弹层/影像底板。真值里每档都登记了实际不透明度，
  // 因此这里可以逐档比对：名字里的数字与取值必须一致，对不上就是有人改了值忘了改名。
  const overlayCases = Object.entries((spec.palette as { overlay?: Record<string, unknown> }).overlay ?? {})
    .filter(([, entry]) => typeof (entry as { token?: unknown })?.token === "string")
    .map(([key, entry]) => ({ key, ...(entry as { value: string; token: string; use: string }) }));

  for (const { token } of [...scalarCases, ...formatCases, ...compositeCases, ...overlayCases]) {
    ASSERTED.add(token);
  }

  test.each(overlayCases)("叠加层 $key · $token = $value", ({ token, value }) => {
    expect(canon(resolve(token))).toBe(canon(value));
  });

  test("叠加层令牌名里的数字与取值一致（防改名不改值）", () => {
    for (const { key, token, value } of overlayCases) {
      const nameStep = Number(key.replace(/^veil/, "").replace(/_/g, "."));
      if (!Number.isFinite(nameStep)) continue; // modalSurface / artBed 等非数值名不参与

      // 真值沿用逗号十进制写法（与 textPlaceholder 一致），CSS 侧是百分比写法，两种都要认。
      const percent = value.match(/\/\s*([\d.]+)%\s*\)/)?.[1];
      const decimal = value.match(/,\s*(0?\.\d+|1)\s*\)/)?.[1];
      const alpha = percent !== undefined ? Number(percent) : decimal !== undefined ? Number(decimal) * 100 : undefined;

      expect(alpha, `${token} 的取值里读不出透明度：${value}`).toBeDefined();
      expect(alpha, `${token} 命名为 ${nameStep}% 但取值是 ${alpha}%`).toBeCloseTo(nameStep, 3);
    }
  });

  test.each(compositeCases)("复合背景 $key · $token 含全部成分", ({ token, parts }) => {
    const resolved = canon(resolve(token));
    for (const part of parts) {
      expect(resolved, `${token} 缺少成分 ${part}`).toContain(canon(part));
    }
  });

  /**
   * 顶栏搜索位底色（1.3.8 起独立成格）。
   *
   * 它**不能**复用 `--biu-surface-field`：那一格是白 17%，同时喂
   * `.pill--neutral`，而药丸的设计实测是 17.8% —— 两个消费者要不同的值，
   * 合流必然把其中一个改错。取值本身有独立取证（设计稿白 9.9%）。
   *
   * 本条断言的是「独立且取值正确」。只断言「令牌存在」是不够的：
   * 有人把它指回 `--biu-surface-field` 时，存在性依然成立。
   */
  test("顶栏搜索位底色是独立一格，取值与真值一致", () => {
    const { fill, token } = spec.globalChrome.search.field;

    expect(token).toBe("--biu-surface-search");
    expect(canon(resolve(token))).toBe(canon(fill));
    // 与键帽底不同格：两者是顶栏里相邻的两个面，合流会让「框底 vs 键帽」的
    // 递进消失 —— 而那正是 1.3.6 勘定键帽时用的判据。
    expect(token, "搜索位底色与键帽底合流了").not.toBe(spec.globalChrome.search.keycap.token);

    ASSERTED.add(token);
  });
});

/* ------------------------------------------------------------------ 排版 */

describe("排版与真值一致", () => {
  const roles = Object.entries(spec.typography.scale);
  for (const [, entry] of roles) ASSERTED.add(entry.token);

  test.each(roles)("$token 的四个原子令牌", (_role, entry) => {
    expect(canon(resolve(`${entry.token}-size`))).toBe(canon(entry.size));
    expect(canon(resolve(`${entry.token}-weight`))).toBe(String(entry.weight));
    expect(canon(resolve(`${entry.token}-leading`))).toBe(String(entry.lineHeight));
    expect(canon(resolve(`${entry.token}-tracking`))).toBe(entry.letterSpacing ? canon(entry.letterSpacing) : "normal");
  });

  test.each(roles)("$token 的 font 简写由原子令牌拼出", (_role, entry) => {
    const shorthand = canon(resolve(entry.token));
    expect(shorthand).toContain(canon(entry.size));
    expect(shorthand).toContain(String(entry.weight));
    expect(shorthand).toContain(String(entry.lineHeight));
  });

  test("字体族令牌存在", () => {
    expect(resolve("--biu-font-sans")).toContain("PingFang SC");
    expect(resolve("--biu-font-numeric")).toContain("SF Pro Display");
  });
});

/* ------------------------------------------------------------------ 几何 */

describe("几何与真值一致", () => {
  const mapped = Object.entries(spec.tokenMap);
  const radius = spec.material.radius;
  const radiusCases = Object.entries(radius.tokens).map(([role, token]) => ({
    role,
    token,
    value: radius[role],
  }));

  for (const token of mapped.map(([, name]) => name)) ASSERTED.add(token);
  for (const { token } of radiusCases) ASSERTED.add(token);
  ASSERTED.add(spec.material.glass.token);
  ASSERTED.add(spec.material.glass.borderToken);
  ASSERTED.add(spec.material.scrim.token);
  ASSERTED.add(spec.material.scrimVeil.token);
  // 弹层的四个令牌不走 tokenMap：投影是复合值（0 24px 60px rgba(...)），
  // canonLength 只做空白归一，比不出颜色的两种写法，必须在下面显式断言。
  for (const token of [
    spec.material.modal.surfaceToken,
    spec.material.modal.borderToken,
    spec.material.modal.blurToken,
    spec.material.modal.shadowToken,
    // 徽标芯片的两个令牌同样不走 tokenMap：真值沿用 rgba(0,0,0,0.45) 写法，
    // CSS 侧是 rgb(0 0 0 / 45%)，canonLength 比不出这种写法差。
    spec.material.badge.defaultChipToken,
    spec.material.badge.dirChipToken,
    // 播放栏材质（1.3.9）：底板走组合式（`rgb(var(--biu-surface-player) / 86%)`），
    // 与进度槽 / 药丸底一样不是新色，故三者的令牌都显式登记。
    spec.material.playbar.surfaceToken,
    spec.material.playbar.progressTrackToken,
    spec.material.playbar.queuePillSurfaceToken,
  ]) {
    ASSERTED.add(token);
  }

  test("tokenMap 覆盖全部硬锚点", () => {
    const anchors = spec.tolerances.hardAnchors as unknown as string[];
    expect(anchors.length).toBeGreaterThanOrEqual(11);
    expect(mapped.length).toBeGreaterThanOrEqual(24);
  });

  test.each(mapped)("%s → %s", (dottedPath, token) => {
    const expected = pick(dottedPath);
    expect(expected, `真值缺少 ${dottedPath}`).toBeDefined();
    expect(canonLength(resolve(token))).toBe(canonLength(expected));
  });

  test("沉浸态封面尺寸与底部控制带", () => {
    const art = String(pick("geometry.immersive.art"));
    const [, width, height] = art.match(/(\d+)\s*×\s*(\d+)/) ?? [];
    expect(canonLength(resolve("--biu-layout-immersive-art-w"))).toBe(`${width}px`);
    expect(canonLength(resolve("--biu-layout-immersive-art-h"))).toBe(`${height}px`);

    const top = parseFloat(resolve("--biu-layout-immersive-controls-top"));
    const bottom = parseFloat(resolve("--biu-layout-immersive-controls-bottom"));
    const band = pick("geometry.immersive.controlsBand") as number[];
    expect(top).toBe(band[0]);
    expect(bottom).toBe(band[1]);
    expect(parseFloat(resolve("--biu-layout-immersive-controls-h"))).toBe(band[1]! - band[0]!);
  });

  /**
   * 播放栏构成（1.3.9 补录）。
   *
   * 补录前播放栏在真值里只有 `height: 88px`，内部构成既无处断言、也就从未被
   * 闸门看过 —— 比对的 `playbar` 探针是 `(64, 200, 795, 900, 12)`，只在 x64–200
   * 那条窄带里读上缘 y，判的是「存在且高 88」，栏内一律看不见。
   *
   * 三个「`A × B`」形态的值（封面、播放键）与沉浸态封面同理：真值写的是
   * 人读的尺寸串，令牌是两个独立的长度，故在这里按串解析后分别断言 ——
   * 比在真值里再抄一遍 `coverWidth` / `coverHeight` 少一次漂移机会。
   */
  test("播放栏封面与播放键尺寸", () => {
    const cover = String(pick("geometry.playbar.left.cover"));
    const [, coverW, coverH] = cover.match(/(\d+)\s*×\s*(\d+)/) ?? [];
    expect(canonLength(resolve("--biu-playbar-cover-w"))).toBe(`${coverW}px`);
    expect(canonLength(resolve("--biu-playbar-cover-h"))).toBe(`${coverH}px`);

    const play = String(pick("geometry.playbar.mid.playButton"));
    const [, playW] = play.match(/(\d+)\s*×\s*(\d+)/) ?? [];
    expect(canonLength(resolve("--biu-playbar-play-size"))).toBe(`${playW}px`);
  });

  test("播放栏进度槽与队列药丸底的材质与真值一致", () => {
    const { progressTrack, progressTrackToken, queuePillSurface, queuePillSurfaceToken } = spec.material.playbar;
    expect(canon(resolve(progressTrackToken))).toBe(canon(progressTrack));
    expect(canon(resolve(queuePillSurfaceToken))).toBe(canon(queuePillSurface));
  });

  /**
   * 播放栏底板：真值登记的是**组合式**声明而不是新色，因此断言点是
   * `src/app.css` 里那条唯一的实现（`@utility playbar-bg`）逐字与真值一致。
   * 只断言「令牌存在」在这里是不够的 —— 底板的不透明度（86%）与色相来源
   * 都写在那一条声明里，令牌本身只是色相。
   */
  test("播放栏底板声明与真值逐字一致", () => {
    const { surface } = spec.material.playbar;
    const appCss = readFileSync(path.resolve(ROOT, "src/app.css"), "utf8");
    const utility = appCss.match(/@utility\s+playbar-bg\s*\{([^}]*)\}/)?.[1] ?? "";
    expect(utility.replace(/\s+/g, " ").trim(), "src/app.css 的 playbar-bg 与真值不一致").toBe(
      `background: ${surface};`,
    );
  });

  /**
   * 播放栏过渡控件簇的预算恒等式（1.3.10）。
   *
   * 设计稿的播放栏里**没有**这 5 枚控件（播放模式 / 下载 / 抽屉入口 / 音量 / 倍速），
   * 但能力此刻不能丢（方案 §5.4「保留能力、只改外观」、§6 要求能力不退化），于是只能
   * 放进设计**唯一**未被占用的横向区带：左段与中段之间。这段的宽度不是拍出来的，是三个
   * 已登记量的差 —— 而「差」最容易在某次调整后悄悄变负，所以把恒等式本身钉住。
   *
   * 恒等式只由令牌构成，不含字体宽度、不含业务数据，故可以精确断言（是 `=`，不是 `≤`）：
   *   左段最右可达 + gutter + 簇宽 + gutter ≡ 中段原点
   *   32 + 100 + 21 + 300 + 12 + (5 × 22 + 4 × 4) + 12 = 603
   *
   * 为什么不是「≤ 中段原点」就够：`metaMaxWidth` 的成文用途正是「防长标题撞进中段」，
   * 若簇只是不越中段、却盖住左段的最右可达，长标题就会钻到图标底下。两侧各留 12
   * 才是这条恒等式的实际内容。
   */
  test("播放栏过渡控件簇恰好填满设计预留的缓冲，两侧各余 gutter", () => {
    const px = (token: string) => parseFloat(resolve(token));
    const midOrigin = px("--biu-layout-stage-w") / 2 - px("--biu-playbar-mid-offset");
    const leftMax =
      px("--biu-playbar-inset-l") +
      px("--biu-playbar-cover-w") +
      px("--biu-playbar-meta-gap") +
      px("--biu-playbar-meta-max-w");
    const gutter = px("--biu-playbar-deferred-gutter");
    const gap = px("--biu-playbar-deferred-gap");
    // 5 枚，尺寸复用中段传输按钮的档位（不是新造值）
    const clusterW = 5 * px("--biu-playbar-transport-icon") + 4 * gap;

    expect(String(pick("geometry.playbar.deferred.width"))).toContain(String(clusterW));
    expect(leftMax + gutter + clusterW + gutter, "簇没有恰好填满设计预留的缓冲").toBe(midOrigin);
    expect(midOrigin - gutter - clusterW - leftMax, "左侧余量与右侧不对称").toBe(gutter);
  });

  /**
   * 上面那条恒等式只证明「预算算得对」，不证明**实现落在了那个位置**。
   * 这一条读源码钉住两件事：
   *   1. 簇的锚点是「中段原点 − gutter」（不是右段、也不是左段自身宽度）；
   *   2. 那 5 枚**不得再回到右段** —— 1.3.9 正是把它们留在右段，右段左缘被推到
   *      x1080.8 而压住了中段的尾随时间（x1088.5–1172），且当时没有任何探针覆盖
   *      x1080–1194，所以全绿通过。
   */
  test("过渡控件簇锚在中段原点左侧，右段只留药丸", () => {
    const playbarSrc = readFileSync(path.resolve(ROOT, "src/layout/playbar/index.tsx"), "utf8");
    expect(playbarSrc, "簇的锚点不再是「中段原点 − gutter」").toContain(
      "right-[calc(50%_+_var(--biu-playbar-mid-offset)_+_var(--biu-playbar-deferred-gutter))]",
    );

    const deferredSrc = readFileSync(path.resolve(ROOT, "src/layout/playbar/deferred/index.tsx"), "utf8");
    expect(deferredSrc, "簇没有用登记过的间隔令牌").toContain("gap-[var(--biu-playbar-deferred-gap)]");
    expect(deferredSrc, "簇没有把按钮收到传输按钮档位").toContain(
      "[&>button]:size-[var(--biu-playbar-transport-icon)]",
    );

    const rightSrc = readFileSync(path.resolve(ROOT, "src/layout/playbar/right/index.tsx"), "utf8");
    expect(rightSrc).toContain("QueueButton");
    for (const stray of [
      "MusicPlayMode",
      "MusicVolume",
      "MusicRate",
      "MusicDownloadButton",
      "OpenPlaylistDrawerButton",
    ]) {
      expect(rightSrc, `右段又混进了 ${stray}（设计稿右段只有一枚药丸）`).not.toContain(stray);
    }
  });

  test("圆角是固定值，不由 HeroUI 圆角派生", () => {
    for (const { token } of radiusCases) {
      expect(resolve(token), `${token} 仍由 --heroui-radius-* 派生`).not.toMatch(/var\(--heroui-/);
    }
  });

  // 逐个角色与 material.radius 的几何值比对，而不是只抽查四个：
  // 抽查过的令牌会漂移，没抽查的（image / window）当时就漂了没人知道。
  test.each(radiusCases)("圆角 $role · $token = $value", ({ token, value }) => {
    expect(canonLength(resolve(token))).toBe(canonLength(value));
  });

  test("玻璃材质：填充、描边、模糊", () => {
    const { fill, border, blur, token, borderToken } = spec.material.glass;
    expect(canon(resolve(token))).toBe(canon(fill));
    expect(canon(resolve(borderToken))).toBe(canon(border));
    expect(canonLength(resolve("--biu-blur-glass"))).toBe(canonLength(blur));
  });

  test("弹层材质：底、描边、模糊、投影都与玻璃材质不同", () => {
    const { surface, surfaceToken, border, borderToken, blur, blurToken, shadow, shadowToken } = spec.material.modal;

    expect(canon(resolve(surfaceToken))).toBe(canon(surface));
    expect(canon(resolve(borderToken))).toBe(canon(border));
    expect(canonLength(resolve(blurToken))).toBe(canonLength(blur));
    expect(canon(resolve(shadowToken))).toBe(canon(shadow));

    // 「弹层 ≠ 玻璃」是本组登记的全部理由。若哪天有人把弹层改成复用玻璃的值，
    // 上面四条会同时通过（因为改成什么就登记成什么），只有这条能拦住。
    expect(canon(resolve(blurToken)), "弹层模糊被改成了玻璃的 20px").not.toBe(canon(resolve("--biu-blur-glass")));
    expect(canon(resolve(surfaceToken)), "弹层底色被改成了玻璃的白 16%").not.toBe(
      canon(resolve(spec.material.glass.token)),
    );
    expect(canon(resolve(borderToken)), "弹层描边被改成了玻璃的 18%").not.toBe(
      canon(resolve(spec.material.glass.borderToken)),
    );
  });

  test("遮罩：统一 26% 且不作为装饰", () => {
    const { token, value } = spec.material.scrim;
    expect(canon(resolve(token))).toBe(canon(value));
  });

  test("遮罩底部渐隐含全部停止点", () => {
    const { token, stops } = spec.material.scrimVeil;
    const resolved = canon(resolve(token));
    for (const stop of stops) {
      expect(resolved, `${token} 缺少停止点 ${stop}`).toContain(canon(stop));
    }
  });

  test("瓦片来源徽标芯片：黑 45% / 蓝 84%，且都不是白 14% 那档", () => {
    const { defaultChip, defaultChipToken, dirChip, dirChipToken, dirTextToken } = spec.material.badge;

    expect(canon(resolve(defaultChipToken))).toBe(canon(defaultChip));
    expect(canon(resolve(dirChipToken))).toBe(canon(dirChip));

    // 徽标芯片与 veil-14 是两个值 —— 这条断言的唯一用途是拦住
    // 「有人把徽标改回原型的白 14% 芯片」。芯片变亮会让影像上的来源标注
    // 读作高亮块，与设计稿「压暗的口」相反。
    expect(canon(resolve(defaultChipToken)), "默认徽标被改回了原型的白 14% 底").not.toBe(
      canon(resolve("--biu-veil-14")),
    );
    // 本地目录徽标的文字是反色墨（深字压亮芯片），不是强调蓝 ——
    // 蓝字压蓝底会读不出字。
    expect(resolve(dirTextToken)).toBe(resolve("--biu-inverse-ink"));
  });
});

/* ---------------------------------------------------------------- 完备性 */

describe("真值完备性：登记即断言", () => {
  test("真值里声明的每个令牌都被某个断言覆盖", () => {
    const declared = [...collectDeclared(spec)].sort();
    const uncovered = declared.filter(name => !ASSERTED.has(name));

    expect(uncovered, `这些令牌在真值里登记了、却没有任何断言，漂移不会报警：${uncovered.join(", ")}`).toEqual([]);

    // 账本本身也要有量级下限，否则上游 describe 被重排/清空时会静默通过。
    // 门槛取 40 而不是「当前现值」：现值随每次补录都会变（1.3.9 加播放栏时
    // tokenMap 就从 30 涨到 47），写成数字必然过期。这里要防的是**归零**，
    // 不是「差一两条」。注：declared 只统计 `token` / `borderToken` / `tokens.*`
    // 三处，tokenMap 的键名不在此列（它由上面的 test.each 直接断言）。
    expect(declared.length, "真值声明的令牌数异常偏少").toBeGreaterThanOrEqual(40);
    expect(ASSERTED.size, "断言账本为空或严重偏少").toBeGreaterThanOrEqual(40);
  });
});

/* ---------------------------------------------------------------- 无障碍 */

describe("文字对比度", () => {
  const canvas = triple("--biu-surface-canvas");

  const ramp = [
    ["--biu-text-primary", "textPrimary"],
    ["--biu-text-secondary", "textSecondary"],
    ["--biu-text-tertiary", "textTertiary"],
    ["--biu-text-quaternary", "textQuaternary"],
    ["--biu-text-disabled", "textDisabled"],
  ] as const;

  test("底板是实测值 #08080A，不是纯黑", () => {
    expect(canvas).toEqual([8, 8, 10]);
  });

  test.each(ramp)("%s 的实测对比度与真值一致", (token, key) => {
    const entry = spec.palette[key] as { contrastOnCanvas: number };
    expect(contrast(triple(token), canvas)).toBeCloseTo(entry.contrastOnCanvas, 1);
    expect(Math.abs(contrast(triple(token), canvas) - entry.contrastOnCanvas)).toBeLessThanOrEqual(
      spec.tolerances.contrastDeltaMax,
    );
  });

  test("前四档达到 WCAG AA（≥ 4.5）", () => {
    for (const [token] of ramp.slice(0, 4)) {
      expect(contrast(triple(token), canvas), token).toBeGreaterThanOrEqual(4.5);
    }
  });

  test("disabled 档低于 AA，但仍在 3:1 以上（仅限非正文标注）", () => {
    const ratio = contrast(triple("--biu-text-disabled"), canvas);
    expect(ratio).toBeLessThan(4.5);
    expect(ratio).toBeGreaterThan(3);
  });

  test("反色对在其自身底色上达到 AA", () => {
    expect(contrast(triple("--biu-inverse-ink"), triple("--biu-inverse-surface"))).toBeGreaterThanOrEqual(4.5);
  });
});

/* ---------------------------------------------------------------- 动效与层级 */

test("减少动效时三档时长归零，且覆盖规则排在令牌层之后", () => {
  const index = files.get("index.css") ?? "";
  expect(index).toContain("@media (prefers-reduced-motion: reduce)");
  expect(index).toContain("--biu-duration-normal: 0ms");
  expect(index.indexOf("@media (prefers-reduced-motion")).toBeGreaterThan(index.indexOf('@import "./geometry.css"'));
});
