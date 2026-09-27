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
}

/**
 * 一级导航。既是顶栏分段组的**默认值**，也是「未声明分段的路由」的导航出口。
 *
 * 决策 3 移除侧栏后，一级入口只剩两处：品牌（→ `/`）与头像菜单（其余）。
 * 分段组的默认值取一级导航，是为了保证任何路由都不会出现「没有任何导航出口」
 * 的死角——这正是重构方案 §3.3 的兜底要求。
 */
export const DEFAULT_NAV_SEGMENTS: TopbarSegment[] = [
  { label: "我的音乐库", href: "/library" },
  { label: "发现音乐", href: "/" },
  { label: "B站历史", href: "/history" },
  { label: "我的关注", href: "/follow" },
  { label: "设置", href: "/settings" },
];

/**
 * 壳层状态的路由契约。未列出的路由一律 `default`。
 *
 * ⚠️ 已知落差（P5 处理）：`/mini-player` 在 `routes.tsx` 里是 `<Layout />` **之外**的
 * 顶层路由，而 `resolveRouteShell` 只被 `<Layout />` 调用——所以这一条 `bare` 现在
 * **取不到**，迷你播放器窗口实际由 `pages/mini-player` 自己独立排版。保留它是为了
 * 声明目标形态：P5 重做迷你播放器时把它纳入 `<Layout />`，由 `AppShell chrome="bare"`
 * 提供「只给容器、不给顶栏与播放栏」的布局。走查已验证：本页此刻无 `#main-content`。
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
 * 目前只有一屏：`/collection/:id` 的三段是**同一路由的三种数据类型**
 * （`CollectionType` 11 / 21 / 31），靠 `?type=` 区分、缺省 11。
 *
 * 标签末尾的 11 / 21 / 31 **是类型码，不是集合数量**。这一点曾在 P1 被读作数量
 * （当时登记的理由是「标签内嵌集合数量，需真实收藏数据后才能在壳层声明」），
 * 于是这一屏的分段组被无限期推迟 —— 因为「真实收藏数量」永远不会成为壳层的
 * 输入。取证见 spec-lock `topbarSegments.labelSources` 与 `meta.revisions` 1.3.8：
 * 设计稿第 3 页导语原文是「收藏夹 / 合集 / 系列 共用一套详情模板，**仅数据类型
 * 不同**」，且三个数字与 `CollectionType` 的三个枚举值逐一相等，激活项亦与该屏
 * `collectionType` 同源。结论：这三段是可以立刻写死的静态标签。
 *
 * 其余路由见 `DEFERRED_SEGMENTS`：它们的分段要么内嵌**运行时数据**
 * （`/search` 的结果数、`/local-music` 的目录名），要么子视图尚未落地。
 * 每屏落地时在此加一条，并同时把该路由从 `DEFERRED_SEGMENTS` 里删掉。
 *
 * `tests/app-shell-interactions.test.ts` 会断言「已声明 + 待声明」正好覆盖
 * `cplus-spec-lock.json` 的 `topbarSegments` 全部路由，因此不会漏掉任何一屏。
 */
export const ROUTE_SEGMENTS: Readonly<Record<string, RouteSegmentsSpec>> = {
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
};

/** 待声明的分段组：路由 pattern → 承接阶段与原因。只减不增。 */
export const DEFERRED_SEGMENTS: Readonly<Record<string, { phase: string; reason: string }>> = {
  "/": { phase: "P3", reason: "发现音乐的卡片/列表子视图（音乐分区 / 单一模块）随第 07-08 屏落地" },
  "/library": { phase: "P3", reason: "我的歌单 / 我收藏的 / 发现音乐三个子视图随第 01 屏落地" },
  "/later": { phase: "P4", reason: "时间范围筛选随第 03 屏落地" },
  "/local-music": { phase: "P4", reason: "标签内嵌本地目录名，需真实目录列表后才能在壳层声明" },
  "/download-list": { phase: "P4", reason: "类型筛选随第 05 屏落地" },
  "/search": { phase: "P3", reason: "标签内嵌结果数量，需真实结果集后才能在壳层声明" },
  "/settings": { phase: "P6", reason: "常规 / 播放 / 高级需与设置页自身的分区导航合并，避免两处开关互相打架" },
  "/queue": { phase: "P5", reason: "队列筛选随第 09 屏落地" },
  "/now-playing": { phase: "P5", reason: "封面 / 歌词 / 视频是沉浸态页面自己的顶部控件，不由壳层顶栏渲染" },
  "/mini-player": {
    phase: "P5",
    reason: "`bare` 壳层根本不渲染顶栏；迷你播放器 / 托盘 / 全局快捷键是独立迷你窗口自身的模式切换",
  },
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

export interface RouteShell {
  chrome: ShellChrome;
  segments: TopbarSegment[];
  /** 当前激活分段的 key。分段组回落到一级导航且都不匹配时为空串。 */
  activeSegmentKey: string;
}

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

  const declared = Object.entries(ROUTE_SEGMENTS).find(([pattern]) => matchesPattern(pathname, pattern));
  if (!declared) {
    return {
      chrome,
      segments: DEFAULT_NAV_SEGMENTS,
      activeSegmentKey: resolveDefaultActiveKey(DEFAULT_NAV_SEGMENTS, pathname),
    };
  }

  const spec = declared[1];
  return {
    chrome,
    segments: spec.segments,
    activeSegmentKey: spec.activeKey?.(new URLSearchParams(search)) ?? resolveDefaultActiveKey(spec.segments, pathname),
  };
};
