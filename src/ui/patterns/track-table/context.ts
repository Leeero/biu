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
