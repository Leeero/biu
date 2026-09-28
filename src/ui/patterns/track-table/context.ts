import { createContext, use, type ReactNode } from "react";

/**
 * `TrackTable` 的共享层：变体、列模板与上下文。
 *
 * 单独成文件是为了避免循环引用 —— `index.tsx` 要 re-export 行组件，
 * 行组件又需要读上下文，走 barrel 就会形成 `index → row → index` 的环。
 */

export type TrackTableVariant = "base" | "download" | "settings" | "mini" | "search";

/**
 * 变体 → 列模板。与原型 app.css 逐条对应：
 *
 *   .tracklist             --cols: 56px minmax(0,1fr) var(--col4) var(--col5)
 *   .tracklist--download   --cols: 56px minmax(0,1fr) 220px     var(--col5)
 *   .tracklist--settings   --cols: 56px 121px minmax(0,1fr) var(--col4) var(--col5)
 *   .tracklist--mini       --cols: 56px minmax(0,1fr) 300px     var(--col5)
 *   .tracklist--search     --cols: minmax(0,1fr) var(--col4) var(--col5)
 *
 * 三条有意为之的取舍：
 *
 * 1. `.tracklist--stats`（原型第三列 240px）**不实现**。14 屏原型样本里没有
 *    任何一屏用到它 —— 它只出现在 app.css 里，是没有落地的死样式。
 *    等真有屏需要时再补，避免发明一条没有出处的列宽。
 * 2. `220 / 121 / 300` 三个宽度**保持字面量**。原型自己也没有把它们令牌化
 *    （它只令牌化了 col4 / col5），所以字面量才是忠实还原。这里特意**不**复用
 *    `--biu-layout-col-4`（同为 220px）：两个 220px 的角色不同（收藏列 vs
 *    下载状态列），同值不同角色必须分开写 —— 与色板里「格式色 mp3」和
 *    「顶栏标签色」同值却按角色登记两次，是同一条规则。
 *    共用会让「改下载列宽」顺带改掉收藏列。
 * 3. `--biu-layout-col-4 / -5` 用令牌：它们是设计稿点名的两根固定列，
 *    也是验收时的比对锚点。
 */
export const COLUMN_TEMPLATES: Record<TrackTableVariant, string> = {
  base: "56px minmax(0, 1fr) var(--biu-layout-col-4) var(--biu-layout-col-5)",
  download: "56px minmax(0, 1fr) 220px var(--biu-layout-col-5)",
  settings: "56px 121px minmax(0, 1fr) var(--biu-layout-col-4) var(--biu-layout-col-5)",
  mini: "56px minmax(0, 1fr) 300px var(--biu-layout-col-5)",
  search: "minmax(0, 1fr) var(--biu-layout-col-4) var(--biu-layout-col-5)",
};

export interface TrackTableColumn {
  key: string;
  label: ReactNode;
  /** 原型 `.track-cell--end`：列尾（时长 / 大小 / 项数）一律右对齐。 */
  align?: "start" | "end";
  /**
   * 表头单元格的**左内边距**（任意合法 CSS 长度，通常给 `var(…)`）。
   *
   * 存在的唯一理由：设计稿把「标题」这一列的表头标签对齐到**行内文字列**
   * （缩略图 + 图文间距之后），而不是列起点。列起点是 x120，文字列是 x241 ——
   * 差 121px。测得的五页（第 03 / 04 / 09 / 10 / 13 页）一致，故不是某一屏的
   * 特例，而是 `.track-head` 的性质（真值 `geometry.listHead`，spec-lock 1.3.22）。
   *
   * 值**不给数字、给令牌**（`var(--biu-layout-head-title-inset)`）：121 是
   * 「封面宽 100 + 图文间距 21」的派生量，令牌与派生的两个令牌同处
   * `geometry.css`，由 `tests/design-tokens.test.ts` 断言三者相等。
   * 在调用方写死 121 会让这条推导关系无从检查。
   *
   * 为什么不做成自动：表头只拿到一组列名，无从知道哪一列的行内是「图 + 文」。
   * 按列序猜（第 2 列）在 `settings` 变体（`56px 121px minmax(0,1fr) …`）上就错了
   * —— 那一列本身就是 121px 的窄列。所以由调用方指名，与 `align` 同一处置。
   */
  inset?: string;
}

export interface TrackTableContextValue {
  /** 已解析的 `grid-template-columns`。表头与行都用它，保证列必然对齐。 */
  gridTemplate: string;
  currentId?: string;
  onReorder?: (from: number, to: number) => void;
}

/**
 * 上下文就是 React 里的层叠继承 —— 对应原型的 `--cols` 自定义属性。
 * 用变量传递模板的失败模式是**静默退化成单列**（CSS 变量未定义时
 * `grid-template-columns` 计算值无效），既不报错也很难查；
 * 用 context 则脱离表格渲染行时拿到的仍是一个合法模板。
 */
export const TrackTableContext = createContext<TrackTableContextValue>({
  gridTemplate: COLUMN_TEMPLATES.base,
});

export const useTrackTable = () => use(TrackTableContext);
