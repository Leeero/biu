import type { ShellChrome } from "@/app/shell/model";

import { CollectionType } from "@/common/constants/collection";

/**
 * 路由 → 壳层契约。
 *
 * 三件事在这里定：某个路由用哪种壳层状态、顶栏分段组显示什么、搜索位提示什么。
 * 之所以放在一处而不是散在 `routes.tsx` 里：`AppShell`、`TopBar`、`SearchField`
 * 都要读它，而且它需要被单测与真值文件对照（见 `tests/app-shell-interactions.test.ts`）。
 */

export interface TopbarSegment {
  label: string;
  /**
   * 运行时计数（模板分段的尾巴数字）。
   *
   * **不是声明**：声明侧只有 `countKey`（指向哪个槽）；这个字段由 `Layout`
   * 在渲染前从 `useSearchSegments` 组合进来，未知时是 `undefined` ——
   * `SegmentedControl` 对 `undefined` 不渲染分隔符与数字，悬空尾巴因此不可能出现。
   */
  count?: number | string;
  /**
   * 导航型分段的目标地址；缺省表示「页面子视图切换」，由声明它的页面自行消费。
   *
   * 以 `?` 开头表示「**只改这些 query**」：路径与其余参数沿用当前地址，
   * 合并规则见 `segment-nav.tsx`。这样夹具模式（`?fixture=…`）下点击分段
   * 不会掉出夹具，用户手改过的其它参数也不会被顺手清掉。
   */
  href?: string;
  /**
   * 稳定键，缺省回落 `href`。
   *
   * 三段共用同一个 pathname、只靠 query 区分时（`/collection/:id?type=`），
   * 三段的 `href` 各不相同，但它们的**身份**是 `type` 的取值 ——
   * 此时显式给 `key`，激活判定才有一致的比较基准。
   */
  key?: string;
  /**
   * 标签尾巴的**运行时计数槽**（`useSearchSegments` 的槽位名）。
   *
   * 声明了它的分段是**模板**：`label` 只是前缀，最终渲染由 `Layout` 把前缀与
   * 计数 store 组合 —— 计数已知时是「前缀 + · N」，未知时**只有前缀**（分隔符
   * 与数字一起消失，不得出现「音乐视频 · 」这种悬空尾巴）。见 spec-lock
   * `topbarSegments.labelSources`：`/collection/:id` 的数字是类型码（静态、
   * 属标签自身），不使用这个槽；`/search` 的数字是结果数（运行时），必须用。
   */
  countKey?: "video" | "creator";
}

/**
 * 一级导航。既是顶栏分段组的**默认值**，也是「未声明分段的路由」的导航出口。
 *
 * 决策 3 移除侧栏后，一级入口只剩两处：品牌（→ `/`）与头像菜单（其余）。
 * 分段组的默认值取一级导航，是为了保证任何路由都不会出现「没有任何导航出口」
 * 的死角——这正是重构方案 §3.3 的兜底要求。
 */
export const DEFAULT_NAV_SEGMENTS: TopbarSegment[] = [
  { label: "发现音乐", href: "/" },
  { label: "我的音乐", href: "/library" },
  { label: "稍后播放", href: "/later" },
  { label: "本地音乐", href: "/local-music" },
  { label: "下载管理", href: "/download-list" },
];

/** 用户资产与发现的主入口。接口来源只属于发现页内部的内容切换，不能占用全局导航。 */
const LIBRARY_SEGMENTS: TopbarSegment[] = [
  { key: "created", label: "我的歌单", href: "/library?tab=created" },
  { key: "collected", label: "我收藏的", href: "/library?tab=collected" },
];

/**
 * 壳层状态的路由契约。未列出的路由一律 `default`。
 *
 * `/mini-player` 是双形态顶层路由：360×140 Electron 小窗自行排版；宽窗口的系统集成页
 * 在页面内部组合标准 AppShell。这里保留 `bare`，用于声明独立小窗不继承主窗口常驻层。
 */
export const SHELL_CHROME_BY_ROUTE: Readonly<Record<string, ShellChrome>> = {
  "/now-playing": "immersive",
  "/mini-player": "bare",
};

/**
 * 一份路由的分段组声明。
 */
export interface RouteSegmentsSpec {
  segments: TopbarSegment[];
  /**
   * 当前激活分段的 `key`。
   *
   * 缺省（不写）时按 `href` 的路径部分与当前 pathname 比对。三段共用同一个
   * pathname、由 query 区分时**必须**写 —— 「`type` 缺省是 11」这类知识属于
   * 该路由自己，壳层不该猜。
   */
  activeKey?: (search: URLSearchParams) => string;
}

/**
 * 集合类型分段。`key` 与 `href` 都由枚举生成，只有标签是设计稿原文。
 *
 * 标签末尾的数字与枚举值同源（11 / 21 / 31），但**无**把它 `${type}` 拼出来
 * 当标签 —— 标签是设计稿的逐字内容，`tests/app-shell-interactions.test.ts`
 * 会拿它与 spec-lock 的 `topbarSegments.byRoute` 对照。
 */
const collectionTypeSegment = (type: CollectionType, label: string): TopbarSegment => ({
  key: String(type),
  label,
  href: `?type=${type}`,
});

/**
 * 已声明的路由分段组。
 *
 * `/collection/:id` 的三段是**同一路由的三种数据类型**（`CollectionType`
 * 11 / 21 / 31），靠 `?type=` 区分、缺省 11。标签末尾的 11 / 21 / 31 **是
 * 类型码，不是集合数量**。这一点曾在 P1 被读作数量（当时登记的理由是
 * 「标签内嵌集合数量，需真实收藏数据后才能在壳层声明」），于是这一屏的
 * 分段组被无限期推迟 —— 因为「真实收藏数量」永远不会成为壳层的输入。
 * 取证见 spec-lock `topbarSegments.labelSources` 与 `meta.revisions` 1.3.8：
 * 设计稿第 3 页导语原文是「收藏夹 / 合集 / 系列 共用一套详情模板，**仅数据
 * 类型不同**」，且三个数字与 `CollectionType` 的三个枚举值逐一相等，激活项
 * 亦与该屏 `collectionType` 同源。结论：这三段是可以立刻写死的静态标签。
 *
 * `/search` 的两段是**结果类型筛选**（两段结果同页共存，分段决定视口落在
 * 哪一段），标签是**模板**：前缀「音乐视频」/「创作者」+ `countKey` 指向的
 * 运行时计数槽 —— 尾巴「· 9 / · 2」是搜索结果数，随查询变化，由结果页写入
 * `useSearchSegments`（spec-lock `topbarSegments.labelSources`，1.3.12）。
 * 设计稿里「音乐视频」是激活段，故 `activeKey` 缺省 `video`。
 *
 * 其余路由见 `DEFERRED_SEGMENTS`：它们的分段要么内嵌**运行时数据**
 * （`/local-music` 的目录名），要么子视图尚未落地。
 * 每屏落地时在此加一条，并同时把该路由从 `DEFERRED_SEGMENTS` 里删掉。
 *
 * `tests/app-shell-interactions.test.ts` 会断言「已声明 + 待声明」正好覆盖
 * `cplus-spec-lock.json` 的 `topbarSegments` 全部路由，因此不会漏掉任何一屏。
 */
export const ROUTE_SEGMENTS: Readonly<Record<string, RouteSegmentsSpec>> = {
  "/library": {
    segments: LIBRARY_SEGMENTS,
    activeKey: search => (search.get("tab") === "collected" ? "collected" : "created"),
  },
  "/queue": {
    segments: [
      { key: "all", label: "全部", href: "?source=all" },
      { key: "online", label: "音乐视频", href: "?source=online" },
      { key: "local", label: "本地文件", href: "?source=local" },
    ],
    activeKey: search => search.get("source") ?? "all",
  },
  "/download-list": {
    segments: [
      { key: "all", label: "全部", href: "?type=all" },
      { key: "audio", label: "音频", href: "?type=audio" },
      { key: "video", label: "视频", href: "?type=video" },
    ],
    activeKey: search => search.get("type") ?? "all",
  },
  "/local-music": {
    segments: [
      { key: "all", label: "全部目录", href: "?dir=all" },
      { key: "0", label: "D 盘 · Lossless", href: "?dir=0" },
      { key: "1", label: "E 盘 · Live 录音", href: "?dir=1" },
    ],
    activeKey: search => search.get("dir") ?? "all",
  },
  "/later": {
    segments: [
      { key: "all", label: "全部", href: "?range=all" },
      { key: "7d", label: "近 7 天", href: "?range=7d" },
      { key: "30d", label: "近 30 天", href: "?range=30d" },
    ],
    activeKey: search => search.get("range") ?? "all",
  },
  "/collection/:id": {
    segments: [
      collectionTypeSegment(CollectionType.Favorite, "收藏夹 · 11"),
      collectionTypeSegment(CollectionType.VideoCollections, "合集 · 21"),
      collectionTypeSegment(CollectionType.VideoSeries, "系列 · 31"),
    ],
    // `type` 缺省 11：页面在无 `type` 时按 `CollectionType.Favorite` 渲染，
    // 所以激活判定必须把这个缺省一并算进去 —— 否则夹具地址（不带 `type`）
    // 会让三段全灭，而设计稿里「收藏夹 · 11」是**激活态**。
    activeKey: search => search.get("type") ?? String(CollectionType.Favorite),
  },
  "/search": {
    segments: [
      { key: "video", label: "音乐视频", countKey: "video", href: "?view=video" },
      { key: "creator", label: "创作者", countKey: "creator", href: "?view=creator" },
    ],
    // 两段结果同页共存，`?view=` 只决定视口落在哪一段（滚动定位由页面消费）；
    // 设计稿里「音乐视频」是激活段，缺省 video。
    activeKey: search => search.get("view") ?? "video",
  },
  "/settings": {
    segments: [
      { key: "general", label: "常规", href: "?tab=general" },
      { key: "playback", label: "播放", href: "?tab=playback" },
      { key: "advanced", label: "高级", href: "?tab=advanced" },
    ],
    activeKey: search => {
      const tab = search.get("tab");
      if (tab === "playback") return "playback";
      if (tab === "advanced" || tab === "about" || tab === "download" || tab === "shortcut") return "advanced";
      return "general";
    },
  },
  "/history": {
    segments: [
      { key: "all", label: "全部", href: "?range=all" },
      { key: "7d", label: "近 7 天", href: "?range=7d" },
      { key: "30d", label: "近 30 天", href: "?range=30d" },
    ],
    activeKey: search => search.get("range") ?? "all",
  },
  "/follow": {
    segments: [
      { key: "following", label: "关注的创作者", href: "?tab=following" },
      { key: "updates", label: "最新动态", href: "?tab=updates" },
    ],
    activeKey: search => search.get("tab") ?? "following",
  },
  "/user/:id": {
    segments: [
      { key: "video", label: "音乐内容", href: "?tab=video" },
      { key: "union", label: "播放列表", href: "?tab=union" },
      { key: "dynamic", label: "动态", href: "?tab=dynamic" },
    ],
    activeKey: search => search.get("tab") ?? "video",
  },
};

/** 待声明的分段组：路由 pattern → 承接阶段与原因。只减不增。 */
export const DEFERRED_SEGMENTS: Readonly<Record<string, { phase: string; reason: string }>> = {
  "/now-playing": { phase: "P5", reason: "封面 / 歌词 / 视频是沉浸态页面自己的顶部控件，不由壳层顶栏渲染" },
  "/mini-player": {
    phase: "P5",
    reason: "双形态路由由页面按窗口宽度分流；宽窗口顶栏由系统集成页拥有，小窗保持 bare",
  },
};

/**
 * 把屏 04 的设计态目录标签替换为真实目录。夹具模式保留设计稿逐字标签；真实路径
 * 只在这里生成动态分段，避免页面和顶栏各维护一份目录选择器。
 */
export const composeLocalMusicSegments = (
  declared: TopbarSegment[],
  directories: string[],
  fixture: boolean,
): TopbarSegment[] => {
  if (fixture) return declared;
  return [
    { key: "all", label: "全部目录", href: "?dir=all" },
    ...directories.map((directory, index) => {
      const trimmed = directory.replace(/[\\/]+$/, "");
      const label = trimmed.split(/[\\/]/).pop() || trimmed;
      return { key: String(index), label, href: `?dir=${index}` };
    }),
  ];
};

/** 去掉尾部斜杠；空串归一为 `/`。 */
const normalize = (value: string) => value.replace(/\/+$/, "") || "/";

/** 把 `/collection/:id` 这类 pattern 与实际路径对齐。 */
const matchesPattern = (pathname: string, pattern: string): boolean => {
  const path = normalize(pathname);
  if (pattern === "/") return path === "/";

  const patternParts = pattern.split("/").filter(Boolean);
  const pathParts = path.split("/").filter(Boolean);
  if (patternParts.length !== pathParts.length) return false;

  return patternParts.every((segment, index) => segment.startsWith(":") || segment === pathParts[index]);
};

/**
 * 搜索位的**缺省**占位（设计稿第 02/05/06/08/09/10/12/13 页）。
 *
 * 与 `ui/primitives/topbar-search` 的组件缺省值同值。两份并存是有意的：
 * primitives 是最低层、不能反向依赖壳层，而壳层也不该依赖某个组件的缺省参数。
 * 两处不得漂移，由 `tests/app-shell-interactions.test.ts` 钉住。
 */
export const DEFAULT_SEARCH_PLACEHOLDER = "搜索音乐视频或创作者";

/**
 * 逐页不同的搜索占位（设计稿第 03 / 04 页）。键是路由 pattern。
 *
 * 真值见 spec-lock `globalChrome.search.placeholderRule`。
 */
export const SEARCH_PLACEHOLDER_BY_ROUTE: Readonly<Record<string, string>> = {
  "/collection/:id": "搜索收藏夹与合集",
  "/later": "搜索标题 / UP 主名称",
};

/** 解析某个路径的搜索占位。未登记的路由回落缺省值。 */
export const resolveSearchPlaceholder = (pathname: string): string => {
  const hit = Object.entries(SEARCH_PLACEHOLDER_BY_ROUTE).find(([pattern]) => matchesPattern(pathname, pattern));
  return hit?.[1] ?? DEFAULT_SEARCH_PLACEHOLDER;
};

/**
 * 顶栏分段组右侧的弱化说明（原型 `.topbar-note`）。键是路由 pattern。
 *
 * `/` 上的「已下线: 流行 / 鬼畜」标注该页**已下线的分区**。真值见 spec-lock
 * `globalChrome.topbarNote`（1.3.18 订正了它的材质：**无独立底色**，与未选中
 * 分段同处 `--biu-veil-9` 容器底、字色 `--biu-text-chrome-label`；1.3.16 记的
 * 「自带底的片」是墨迹污染的读数）。它**不是交互元素**，渲染成 `<span>`。
 *
 * 与搜索占位一样，这里只声明「哪个路由有什么说明」；怎么画是组件的事。
 */
export const TOPBAR_NOTE_BY_ROUTE: Readonly<Record<string, string>> = {};

/** 解析某个路径的顶栏说明。未登记的路由没有说明（`undefined`）。 */
export const resolveTopbarNote = (pathname: string): string | undefined =>
  Object.entries(TOPBAR_NOTE_BY_ROUTE).find(([pattern]) => matchesPattern(pathname, pattern))?.[1];

export interface RouteShell {
  chrome: ShellChrome;
  /** 始终可见的一级导航。 */
  segments: TopbarSegment[];
  /** 当前激活的一级入口。 */
  activeSegmentKey: string;
  /** 当前页面内部的二级导航；没有子视图时为空。 */
  contextSegments: TopbarSegment[];
  /** 当前激活的二级入口。 */
  activeContextKey: string;
  /** 分段组右侧的弱化说明。未登记的路由没有它。 */
  topbarNote?: string;
}

/**
 * 把**模板分段**与**运行时计数**组合成最终的分段（`Layout` 在渲染前消费）。
 *
 * `resolveRouteShell` 保持纯函数：它只声明「这一段有计数槽」（`countKey`），
 * 数字本身由 `useSearchSegments` 承载、在这里填进 `count`。计数未知（`null`）
 * 映射为 `undefined` —— `SegmentedControl` 对 `undefined` 不渲染分隔符与数字，
 * 悬空的「音乐视频 · 」在结构上不可能出现。`0` 是合法计数（无结果），必须用
 * nullish 判断保留，不能用 falsy。
 */
export const composeSegmentCount = (
  segment: TopbarSegment,
  counts: { videoCount: number | null; creatorCount: number | null },
): TopbarSegment => {
  if (!segment.countKey) return segment;
  const count = segment.countKey === "video" ? counts.videoCount : counts.creatorCount;
  return { ...segment, count: count ?? undefined };
};

/**
 * 缺省激活判定：取第一个「`href` 的路径部分等于当前 pathname」的分段。
 *
 * 只服务导航型分段（`href` 是路径）。`href` 是 query-only 的分段单凭 pathname
 * 无法判定，那种路由必须自己给 `activeKey`。
 */
const resolveDefaultActiveKey = (segments: TopbarSegment[], pathname: string): string => {
  const path = normalize(pathname);
  const hit = segments.find(segment => {
    if (!segment.href || segment.href.startsWith("?")) return false;
    return normalize(segment.href.split("?")[0] ?? "") === path;
  });
  return hit ? (hit.key ?? hit.href ?? "") : "";
};

/**
 * 解析某个地址的壳层契约。纯函数，无副作用——路由一变就能直接断言结果。
 *
 * 未声明分段的路由回落到一级导航，而不是「什么都不显示」。
 *
 * `search` 只参与**激活判定**（`/collection/:id` 的三段靠 `?type=` 区分），
 * 不影响 `chrome` 与分段内容。
 */
export const resolveRouteShell = (pathname: string, search = ""): RouteShell => {
  const chrome = SHELL_CHROME_BY_ROUTE[pathname] ?? "default";
  const topbarNote = resolveTopbarNote(pathname);
  const primaryPath =
    pathname === "/" || pathname === "/search"
      ? "/"
      : pathname.startsWith("/library") || pathname.startsWith("/collection/")
        ? "/library"
        : pathname === "/later"
          ? "/later"
          : pathname === "/local-music"
            ? "/local-music"
            : pathname === "/download-list"
              ? "/download-list"
              : "";

  const declared = Object.entries(ROUTE_SEGMENTS).find(([pattern]) => matchesPattern(pathname, pattern));
  if (!declared) {
    return {
      chrome,
      segments: DEFAULT_NAV_SEGMENTS,
      activeSegmentKey: resolveDefaultActiveKey(DEFAULT_NAV_SEGMENTS, primaryPath),
      contextSegments: [],
      activeContextKey: "",
      topbarNote,
    };
  }

  const spec = declared[1];
  return {
    chrome,
    segments: DEFAULT_NAV_SEGMENTS,
    activeSegmentKey: resolveDefaultActiveKey(DEFAULT_NAV_SEGMENTS, primaryPath),
    contextSegments: spec.segments,
    activeContextKey: spec.activeKey?.(new URLSearchParams(search)) ?? resolveDefaultActiveKey(spec.segments, pathname),
    topbarNote,
  };
};
