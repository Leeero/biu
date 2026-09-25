/**
 * 壳层状态模型。
 *
 * 这里是**纯函数**：由 `chrome` 推导出「哪些槽位要渲染」，不碰 DOM、不读 store，
 * 因此可以被单测直接覆盖。组件只负责把结论翻译成类名。
 *
 * 为什么把状态做成受控属性而不是在组件里 `useLocation()` 推断：
 * `/mini-player` 是独立窗口、`/now-playing` 是沉浸态，两者的差异属于**路由契约**，
 * 不属于壳层实现细节。壳层自己推断会让「为什么这个路由没有顶栏」散落在两处。
 * 见 `docs/design/biu-cplus-refactor-plan.md` §3.2。
 */

/** 壳层状态。 */
export type ShellChrome = "default" | "immersive" | "bare";

/** 背景来源。`none` 表示由调用方自行决定（迷你窗口）。 */
export type ShellBackground = "app" | "immersive" | "none";

export interface ShellLayout {
  /** 渲染顶栏槽位 */
  hasTopbar: boolean;
  /** 渲染播放栏槽位 */
  hasPlayer: boolean;
  background: ShellBackground;
  /** 主内容区是否套用 C+ 留白（左右 64 / 顶部 33） */
  contentInset: boolean;
}

const LAYOUTS: Record<ShellChrome, ShellLayout> = {
  default: { hasTopbar: true, hasPlayer: true, background: "app", contentInset: true },
  // 沉浸态：顶栏与播放栏都不渲染，节奏由页面自己嵌在内容里
  // （进度条 y=700、控制带 752–808），因此留白仍然适用。
  immersive: { hasTopbar: false, hasPlayer: false, background: "immersive", contentInset: true },
  // 迷你窗口：壳层不提供任何常驻件与留白，整窗交给页面。
  bare: { hasTopbar: false, hasPlayer: false, background: "none", contentInset: false },
};

export const resolveShellLayout = (chrome: ShellChrome = "default"): ShellLayout => LAYOUTS[chrome];
