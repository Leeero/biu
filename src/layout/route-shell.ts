import type { ShellChrome } from "@/app/shell/model";

/**
 * 路由 → 壳层契约。
 *
 * 两件事在这里定：某个路由用哪种壳层状态、顶栏分段组显示什么。
 * 之所以放在一处而不是散在 `routes.tsx` 里：`AppShell` 与 `TopBar` 都要读它，
 * 而且它需要被单测与真值文件对照（见 `tests/app-shell-interactions.test.ts`）。
 */

export interface TopbarSegment {
  label: string;
  /** 导航型分段：点击即跳转。缺省表示「页面子视图切换」，由声明它的页面自行消费。 */
  href?: string;
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
 * 已声明的路由分段组。
 *
 * **P1 有意为空。** 机制（`TopBar` 渲染路由声明的分段）已经建好并接入，
 * 但逐屏的分段标签要到各屏自己的阶段才声明，原因有二：
 *
 * 1. 真值里 11 组分段中有 3 组（`/collection/:id`、`/local-music`、`/search`）
 *    的标签内嵌了**数据**（`收藏夹 · 11`、`D 盘 · Lossless`、`音乐视频 · 9`）。
 *    在页面还没有真实数据源时先把它们写进壳层，等于把设计稿的示意内容当成了产品文案。
 * 2. 其余 8 组虽是纯标签，但都是**该页的子视图切换**。P1 的页面还是旧界面，
 *    没有可切换的子视图——此刻渲染出来就是一个点了没反应的控件。
 *    壳层宁可显示能导航的一级导航，也不要显示一个坏掉的开关。
 *
 * 每屏落地时在此加一条，并同时把该路由从 `DEFERRED_SEGMENTS` 里删掉。
 * `tests/app-shell-interactions.test.ts` 会断言「已声明 + 待声明」正好覆盖
 * `cplus-spec-lock.json` 的 `topbarSegments` 全部路由，因此不会漏掉任何一屏。
 */
export const ROUTE_SEGMENTS: Readonly<Record<string, string[]>> = {};

/** 待声明的分段组：路由 pattern → 承接阶段与原因。只减不增。 */
export const DEFERRED_SEGMENTS: Readonly<Record<string, { phase: string; reason: string }>> = {
  "/": { phase: "P3", reason: "发现音乐的卡片/列表子视图（音乐分区 / 单一模块）随第 07-08 屏落地" },
  "/library": { phase: "P3", reason: "我的歌单 / 我收藏的 / 发现音乐三个子视图随第 01 屏落地" },
  "/collection/:id": { phase: "P3", reason: "标签内嵌集合数量，需真实收藏数据后才能在壳层声明" },
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

/** 把 `/collection/:id` 这类 pattern 与实际路径对齐。 */
const matchesPattern = (pathname: string, pattern: string): boolean => {
  const normalize = (value: string) => value.replace(/\/+$/, "") || "/";
  const path = normalize(pathname);
  if (pattern === "/") return path === "/";

  const patternParts = pattern.split("/").filter(Boolean);
  const pathParts = path.split("/").filter(Boolean);
  if (patternParts.length !== pathParts.length) return false;

  return patternParts.every((segment, index) => segment.startsWith(":") || segment === pathParts[index]);
};

export interface RouteShell {
  chrome: ShellChrome;
  segments: TopbarSegment[];
}

/**
 * 解析某个路径的壳层契约。纯函数，无副作用——路由一变就能直接断言结果。
 *
 * 未声明分段的路由回落到一级导航，而不是「什么都不显示」。
 */
export const resolveRouteShell = (pathname: string): RouteShell => {
  const chrome = SHELL_CHROME_BY_ROUTE[pathname] ?? "default";

  const declared = Object.entries(ROUTE_SEGMENTS).find(([pattern]) => matchesPattern(pathname, pattern));
  if (!declared) return { chrome, segments: DEFAULT_NAV_SEGMENTS };

  return {
    chrome,
    segments: declared[1].map(label => ({ label })),
  };
};
