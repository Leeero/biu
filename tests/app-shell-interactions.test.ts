/**
 * 外壳交互与路由契约测试。
 *
 * 覆盖三件事：
 *   1. `resolveShellLayout` —— 三种壳层状态各自渲染哪些槽位、用哪张背景。
 *   2. `resolveRouteShell` —— 路由 → 壳层状态的映射，以及分段的兜底行为。
 *   3. 顶栏分段与 `cplus-spec-lock.json` 的对齐 —— 保证「待声明清单」不会漏掉任何一屏。
 *
 * 上一轮的侧栏宽度边界用例已随决策 3（移除侧栏）删除：那套逻辑本身没有了，
 * 留着测一个不存在的功能比不测更糟。
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, test } from "vitest";

import { resolveShellLayout, type ShellChrome } from "@/app/shell/model";
import { DEFAULT_NAV_SEGMENTS, DEFERRED_SEGMENTS, ROUTE_SEGMENTS, resolveRouteShell } from "@/layout/route-shell";
import {
  isSearchShortcut,
  isTypingTarget,
  normalizeSearchKeyword,
  shouldSubmitSearch,
} from "@/layout/topbar/search-model";

const spec = JSON.parse(readFileSync(path.resolve(process.cwd(), "docs/design/cplus-spec-lock.json"), "utf8")) as {
  topbarSegments: { byRoute: Record<string, string[]> };
};

describe("壳层状态", () => {
  const cases: { chrome: ShellChrome; hasTopbar: boolean; hasPlayer: boolean; background: string }[] = [
    { chrome: "default", hasTopbar: true, hasPlayer: true, background: "app" },
    { chrome: "immersive", hasTopbar: false, hasPlayer: false, background: "immersive" },
    { chrome: "bare", hasTopbar: false, hasPlayer: false, background: "none" },
  ];

  test.each(cases)("$chrome：顶栏 $hasTopbar / 播放栏 $hasPlayer", ({ chrome, hasTopbar, hasPlayer, background }) => {
    const layout = resolveShellLayout(chrome);
    expect(layout.hasTopbar).toBe(hasTopbar);
    expect(layout.hasPlayer).toBe(hasPlayer);
    expect(layout.background).toBe(background);
  });

  test("沉浸态仍然保留内容留白：底部控制带是页面内嵌的，不是播放栏", () => {
    // 这一条是防回归的：如果哪天为了「沉浸」把留白也去掉，
    // 页面里的进度条 y=700 / 控制带 752–808 这些硬锚点会全部失准。
    expect(resolveShellLayout("immersive").contentInset).toBe(true);
    expect(resolveShellLayout("bare").contentInset).toBe(false);
  });

  test("缺省即 default，不需要调用方先归一化", () => {
    expect(resolveShellLayout()).toEqual(resolveShellLayout("default"));
  });
});

describe("路由壳层契约", () => {
  test("沉浸态与迷你窗口由路由决定，不在组件内部推断", () => {
    expect(resolveRouteShell("/now-playing").chrome).toBe("immersive");
    expect(resolveRouteShell("/mini-player").chrome).toBe("bare");
  });

  test("其余路由一律 default", () => {
    for (const pathname of [
      "/",
      "/library",
      "/later",
      "/local-music",
      "/download-list",
      "/search",
      "/settings",
      "/queue",
      "/collection/123",
    ]) {
      expect(resolveRouteShell(pathname).chrome, pathname).toBe("default");
    }
  });

  test("未知路由回落到 default，而不是抛错", () => {
    expect(resolveRouteShell("/does-not-exist").chrome).toBe("default");
  });

  test("未声明分段的路由回落到可导航的一级导航", () => {
    const { segments } = resolveRouteShell("/library");
    expect(segments).toEqual(DEFAULT_NAV_SEGMENTS);
    // 兜底值必须是**真的能点**的：每个分段都要有 href，
    // 否则回落到一级导航就只是换了一种没有出口的显示方式。
    for (const segment of segments) {
      expect(segment.href, `${segment.label} 缺少 href`).toBeTruthy();
    }
  });

  test("一级导航覆盖五处一级入口，且互相不重复", () => {
    const hrefs = DEFAULT_NAV_SEGMENTS.map(segment => segment.href);
    expect(hrefs).toEqual(["/library", "/", "/history", "/follow", "/settings"]);
    expect(new Set(hrefs).size).toBe(hrefs.length);
  });
});

describe("顶栏分段与真值对齐", () => {
  const truthRoutes = Object.keys(spec.topbarSegments.byRoute);
  const declared = Object.keys(ROUTE_SEGMENTS);
  const deferred = Object.keys(DEFERRED_SEGMENTS);

  test("真值的每一屏都被「已声明」或「待声明」接住", () => {
    const covered = new Set([...declared, ...deferred]);
    const uncovered = truthRoutes.filter(route => !covered.has(route));
    expect(uncovered, "这些路由的分段组既没声明也没登记待办，会被静默遗忘").toEqual([]);
  });

  test("两边不能重复登记", () => {
    expect(declared.filter(route => deferred.includes(route))).toEqual([]);
  });

  test("已声明的分段必须与真值逐字一致", () => {
    for (const [pattern, labels] of Object.entries(ROUTE_SEGMENTS)) {
      expect(labels, `${pattern} 与真值不一致`).toEqual(spec.topbarSegments.byRoute[pattern]);
    }
  });

  test("待声明清单必须写明承接阶段与原因", () => {
    for (const [pattern, entry] of Object.entries(DEFERRED_SEGMENTS)) {
      expect(entry.phase, `${pattern} 缺阶段`).toMatch(/^P\d$/);
      expect(entry.reason.length, `${pattern} 的理由太短，等于没写`).toBeGreaterThan(10);
    }
  });
});

describe("顶栏搜索", () => {
  test("normalizes keyboard search submissions and rejects blank values", () => {
    expect(normalizeSearchKeyword("  周杰伦  ")).toBe("周杰伦");
    expect(shouldSubmitSearch("  周杰伦  ")).toBe(true);
    expect(shouldSubmitSearch("   ")).toBe(false);
  });

  test("Ctrl K 提示可见就必须可用：Ctrl 与 ⌘ 都接", () => {
    expect(isSearchShortcut({ key: "k", ctrlKey: true, metaKey: false })).toBe(true);
    expect(isSearchShortcut({ key: "K", ctrlKey: true, metaKey: false })).toBe(true);
    expect(isSearchShortcut({ key: "k", ctrlKey: false, metaKey: true })).toBe(true);
    expect(isSearchShortcut({ key: "j", ctrlKey: true, metaKey: false })).toBe(false);
    expect(isSearchShortcut({ key: "k", ctrlKey: false, metaKey: false })).toBe(false);
  });

  test("已经在输入类元素里时不抢焦点", () => {
    const target = (tagName: string, isContentEditable = false) =>
      ({ tagName, isContentEditable }) as unknown as EventTarget;

    expect(isTypingTarget(target("INPUT"))).toBe(true);
    expect(isTypingTarget(target("TEXTAREA"))).toBe(true);
    expect(isTypingTarget(target("DIV", true))).toBe(true);
    expect(isTypingTarget(target("DIV"))).toBe(false);
    expect(isTypingTarget(null)).toBe(false);
  });
});
