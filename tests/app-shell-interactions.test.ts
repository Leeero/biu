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
import { CollectionType } from "@/common/constants/collection";
import {
  DEFAULT_NAV_SEGMENTS,
  DEFAULT_SEARCH_PLACEHOLDER,
  DEFERRED_SEGMENTS,
  ROUTE_SEGMENTS,
  SEARCH_PLACEHOLDER_BY_ROUTE,
  TOPBAR_NOTE_BY_ROUTE,
  composeSegmentCount,
  resolveRouteShell,
  resolveSearchPlaceholder,
  resolveTopbarNote,
} from "@/layout/route-shell";
import {
  isSearchShortcut,
  isTypingTarget,
  normalizeSearchKeyword,
  shouldSubmitSearch,
} from "@/layout/topbar/search-model";

const spec = JSON.parse(readFileSync(path.resolve(process.cwd(), "docs/design/cplus-spec-lock.json"), "utf8")) as {
  topbarSegments: { byRoute: Record<string, string[]> };
  globalChrome: {
    search: {
      placeholder: string;
      placeholderByRoute: Record<string, string>;
    };
    topbarNote: { text: string; routes: string[] };
  };
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

  test("已声明的分段标签必须与真值逐字一致（模板分段除外，见 /search 一节）", () => {
    for (const [pattern, entry] of Object.entries(ROUTE_SEGMENTS)) {
      // /search 的标签是「前缀 + 运行时计数」模板，字面标签里那个数字不是
      // 壳层能写死的 —— 见 spec-lock topbarSegments.labelSources 与下面的
      // 专属 describe。其余路由仍逐字比对。
      if (pattern === "/search") continue;
      expect(
        entry.segments.map(segment => segment.label),
        `${pattern} 与真值不一致`,
      ).toEqual(spec.topbarSegments.byRoute[pattern]);
    }
  });

  test("待声明清单必须写明承接阶段与原因", () => {
    for (const [pattern, entry] of Object.entries(DEFERRED_SEGMENTS)) {
      expect(entry.phase, `${pattern} 缺阶段`).toMatch(/^P\d$/);
      expect(entry.reason.length, `${pattern} 的理由太短，等于没写`).toBeGreaterThan(10);
    }
  });
});

describe("/collection/:id 顶栏分段组", () => {
  const segmentsOf = () => resolveRouteShell("/collection/123").segments;

  test("三段链到同一路由的三种数据类型", () => {
    expect(segmentsOf().map(segment => segment.label)).toEqual(["收藏夹 · 11", "合集 · 21", "系列 · 31"]);
    // query-only 的 href：路径与其余参数由顶栏沿用当前地址（见 segment-nav.tsx）。
    expect(segmentsOf().map(segment => segment.href)).toEqual(["?type=11", "?type=21", "?type=31"]);
  });

  test("三段都是可点的：设计稿画的是切换器，不是坏掉的开关", () => {
    for (const segment of segmentsOf()) {
      expect(segment.href, `${segment.label} 缺少 href`).toBeTruthy();
    }
  });

  /**
   * 这条把「标签是静态类型码」这个勘定结论钉在枚举上。
   *
   * 标签尾的 11 / 21 / 31 曾被读作**集合数量**（理由写作「需真实收藏数据后
   * 才能在壳层声明」），于是这一屏的分段组被无限期推迟。取证见 spec-lock
   * `topbarSegments.labelSources` 与 1.3.8：设计稿导语原文「仅数据类型不同」，
   * 且三个数字与 `CollectionType` 逐一相等。若哪天有人把标签改成真数量，
   * 这条会红 —— 那时必须同时改 spec-lock 并给出新取证。
   */
  test("标签尾的数字与 CollectionType 枚举同源，不是集合数量", () => {
    expect(segmentsOf().map(segment => segment.key)).toEqual([
      String(CollectionType.Favorite),
      String(CollectionType.VideoCollections),
      String(CollectionType.VideoSeries),
    ]);
  });

  test("激活段由 ?type 决定，缺省 11（与页面缺省 CollectionType.Favorite 一致）", () => {
    expect(resolveRouteShell("/collection/123").activeSegmentKey).toBe("11");
    expect(resolveRouteShell("/collection/123", "?type=21").activeSegmentKey).toBe("21");
    // 夹具地址不带 type —— 此时仍须激活「收藏夹 · 11」，否则与设计稿不符。
    expect(resolveRouteShell("/collection/123", "?fixture=02-playlist-detail").activeSegmentKey).toBe("11");
  });

  test("其它路由仍回落到一级导航，激活段是当前路径", () => {
    const shell = resolveRouteShell("/library");
    expect(shell.segments).toEqual(DEFAULT_NAV_SEGMENTS);
    expect(shell.activeSegmentKey).toBe("/library");
  });
});

describe("/search 顶栏分段组（模板 + 运行时计数）", () => {
  /**
   * 真值 byRoute 的「音乐视频 · 9」= 模板前缀「音乐视频」+ 计数槽 video 的
   * 「· 9」。计数是运行时结果数（spec-lock topbarSegments.labelSources），
   * 壳层只声明前缀与槽位，数字由结果页写入 useSearchSegments、Layout 组合。
   * 若哪天真值的前缀变了，这条会红 —— 那时必须同时改真值并给出新取证。
   */
  test("分段前缀与计数槽对齐真值的字面标签", () => {
    const truth = spec.topbarSegments.byRoute["/search"];
    expect(truth).toEqual(["音乐视频 · 9", "创作者 · 2"]);

    const segments = resolveRouteShell("/search").segments;
    expect(segments.map(segment => segment.label)).toEqual(["音乐视频", "创作者"]);
    expect(segments.map(segment => segment.countKey)).toEqual(["video", "creator"]);
  });

  test("两段都是可点的：分段决定视口落在哪一段（两段结果同页共存）", () => {
    const segments = resolveRouteShell("/search").segments;
    expect(segments.map(segment => segment.href)).toEqual(["?view=video", "?view=creator"]);
  });

  test("激活段由 ?view 决定，缺省 video（设计稿里「音乐视频」是激活段）", () => {
    expect(resolveRouteShell("/search").activeSegmentKey).toBe("video");
    expect(resolveRouteShell("/search", "?view=creator").activeSegmentKey).toBe("creator");
    // 夹具地址不带 view —— 与缺省一致，两段全灭就是退化。
    expect(resolveRouteShell("/search", "?fixture=06-search").activeSegmentKey).toBe("video");
  });

  test("计数未知 → count 缺省（无悬空分隔符）；0 是合法计数必须保留", () => {
    const segment = resolveRouteShell("/search").segments[0]!;
    expect(composeSegmentCount(segment, { videoCount: null, creatorCount: null }).count).toBeUndefined();
    expect(composeSegmentCount(segment, { videoCount: 0, creatorCount: 0 }).count).toBe(0);
    expect(composeSegmentCount(segment, { videoCount: 9, creatorCount: 2 }).count).toBe(9);
    // 静态分段原样返回 —— 不引入多余的字段。
    const nav = DEFAULT_NAV_SEGMENTS[0]!;
    expect(composeSegmentCount(nav, { videoCount: null, creatorCount: null })).toBe(nav);
  });
});

describe("顶栏搜索占位与真值对齐", () => {
  test("缺省占位与真值一致", () => {
    expect(DEFAULT_SEARCH_PLACEHOLDER).toBe(spec.globalChrome.search.placeholder);
  });

  test("逐页占位表与真值逐字一致", () => {
    expect(SEARCH_PLACEHOLDER_BY_ROUTE).toEqual(spec.globalChrome.search.placeholderByRoute);
  });

  test("按路由解析占位，未登记的路由回落缺省值", () => {
    expect(resolveSearchPlaceholder("/collection/123")).toBe("搜索收藏夹与合集");
    expect(resolveSearchPlaceholder("/later")).toBe("搜索标题 / UP 主名称");
    expect(resolveSearchPlaceholder("/library")).toBe(DEFAULT_SEARCH_PLACEHOLDER);
    expect(resolveSearchPlaceholder("/")).toBe(DEFAULT_SEARCH_PLACEHOLDER);
  });
});

describe("顶栏说明与真值对齐", () => {
  /**
   * `/` 上那句「已下线: 流行 / 鬼畜」是**路由级 chrome**（不是页面内容），
   * 真值登记在 `globalChrome.topbarNote`。它与分段组同机制：声明在
   * `route-shell.ts`、由 `TopBar` 渲染，所以也在这里钉住。
   */
  test("说明表与真值逐字一致，且真值声明的每条路由都在表里", () => {
    expect(new Set(Object.keys(TOPBAR_NOTE_BY_ROUTE))).toEqual(new Set(spec.globalChrome.topbarNote.routes));
    for (const route of spec.globalChrome.topbarNote.routes) {
      expect(TOPBAR_NOTE_BY_ROUTE[route]).toBe(spec.globalChrome.topbarNote.text);
    }
  });

  test("只有登记过的路由带说明，其余路由没有这一段", () => {
    expect(resolveTopbarNote("/")).toBe("已下线: 流行 / 鬼畜");
    expect(resolveTopbarNote("/library")).toBeUndefined();
    expect(resolveTopbarNote("/search")).toBeUndefined();
  });

  test("它随路由契约一起下发，不是页面自己塞的", () => {
    expect(resolveRouteShell("/").topbarNote).toBe("已下线: 流行 / 鬼畜");
    expect(resolveRouteShell("/library").topbarNote).toBeUndefined();
  });

  test("末尾斜杠归一后再匹配（/ 的说明不能因为多一个斜杠就消失）", () => {
    // `matchesPattern` 会把尾部斜杠去掉，所以 `/` 与 `//` 都要命中。
    // 这条防的是「有人把说明的查找换成按 pathname 直接取键」。
    expect(resolveTopbarNote("//")).toBe(resolveTopbarNote("/"));
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
