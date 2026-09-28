import { useMemo, type ReactNode } from "react";

import { twMerge } from "tailwind-merge";

import { COLUMN_TEMPLATES, TrackTableContext, type TrackTableColumn, type TrackTableVariant } from "./context";

// `COLUMN_TEMPLATES` 有意**不**从 barrel 导出：列模板是这张表的实现细节，
// 调用方通过 `variant` 选择即可。把常量漏出去会让「谁在改列宽」难以回答。
//
// 这里会留下一处 `react-refresh/only-export-components` 警告：本模块除组件外
// 还导出了 `useTrackTable`（hook）与 `TrackTableContext`。hook 必须与组件同源
// —— `TrackTableRow` 读的就是这条 context，拆到别的文件只会让「行怎么拿到列模板」
// 多绕一层。代价仅是组件热更新退化为整页刷新（开发期），与
// `pill` 导出 `pillClass` 是同一种取舍，故保留。
export { TrackTableContext, useTrackTable } from "./context";
export type { TrackTableColumn, TrackTableContextValue, TrackTableVariant } from "./context";
export { TrackArt, TrackCell, TrackIndex, TrackMain, TrackTableActions, TrackTableRow, TrackText } from "./row";
export type { TrackActionSpec, TrackTableRowProps } from "./row";

/**
 * 轨道表 —— 原型 `.tracklist` / `.track-head` / `.track-row` 及其全部变体。
 *
 * 这是 P2 里最吃重的一个模式件：它是 6 屏列表（收藏夹 / 稍后再看 / 下载 /
 * 搜索 / 发现 / 队列 / 设置 / 迷你预览）共同的骨架。上一轮的
 * `components/music-list-item` + `components/music-page-list` 两个组件，
 * 以及 `patterns/track-row` 这个薄壳，最终都收敛到这里（方案 §5.4）。
 *
 * 容器只做一件事：**下发列模板**。表头与行各自把模板套到自己的
 * `grid-template-columns` 上 —— 原型用 CSS 变量 `--cols` 做这件事，
 * 这里用 context（见 context.ts 里的取舍说明）。
 *
 * 导出是**逐个列出**而不是 `export *`：`export *` 会让 React Fast Refresh
 * 无法判断模块是否只导出组件，也会让「这个模式件对外提供什么」变模糊。
 */

interface TrackTableProps {
  variant?: TrackTableVariant;
  /**
   * 表头各列。**不传则不渲染表头** —— 原型 06 屏（搜索结果）就是这个形态：
   * 只有行、没有 `.track-head`，行首也没有序号列。
   */
  columns?: readonly TrackTableColumn[];
  /** 当前播放 / 选中行。与行的 `trackId` 比对，命中即加当前行高亮。 */
  currentId?: string;
  /**
   * 拖拽重排。**原型没有任何重排交互**，这是重构方案 §5.2 冻结的 API 占位，
   * 供 P5 队列页使用。详见 `row.tsx` 里 `TrackTableRow` 的说明。
   */
  onReorder?: (from: number, to: number) => void;
  className?: string;
  children: ReactNode;
}

/**
 * 语义上这是一份「多列对齐的列表」，不是 `<table>`：原型是 `div` + grid，
 * 行内每一条都是可点击内容而非数据格。挂 `role="table"` 只会给读屏软件
 * 一套无法兑现的行列承诺（没有列头关联、没有单元格语义），所以这里保持
 * 无语义容器，行的可访问名称交给行内标题文本。
 */
export const TrackTable = ({
  variant = "base",
  columns,
  currentId,
  onReorder,
  className,
  children,
}: TrackTableProps) => {
  const gridTemplate = COLUMN_TEMPLATES[variant];

  // 必须 memo：context 的 value 若是每次渲染新建的对象，`onReorder` 的引用
  // 也会跟着变，于是整张表的每一行都会重渲染。列表动辄 200 行，
  // 这个开销不是理论问题。
  const value = useMemo(() => ({ gridTemplate, currentId, onReorder }), [gridTemplate, currentId, onReorder]);

  const hasHead = Boolean(columns && columns.length > 0);

  return (
    <TrackTableContext value={value}>
      <div className={twMerge("flex flex-col", className)}>
        {hasHead && (
          <div
            className={twMerge(
              // 原型 .track-head：右缩进同列表、12px 四级文字。
              // 文字**上对齐 + 7px 上内边距**而不是垂直居中：设计稿第 3 页实测
              // 表头墨迹在 346，居中会落在 351（低 5px）。
              // 盒高取 `--biu-layout-head-h` = 38，**不是原型的 44**：设计稿由
              // 「首行封面顶缘 380 − 居中偏移 6 − 分组标题盒下沿 328 − marginBottom 8」
              // 解出行顶 374，故表头盒高 = 374 − 336 = 38。改的是盒底，
              // 文字位置不变 —— 才能只抬下面的行（行顶是硬锚点）。
              "grid h-[var(--biu-layout-head-h)] items-start pt-[7px] pr-[var(--biu-layout-list-pad-r)]",
              "text-[length:var(--biu-type-micro-size)] text-[rgb(var(--biu-text-quaternary))]",
            )}
            style={{ gridTemplateColumns: gridTemplate }}
          >
            {columns?.map(column => (
              <span
                key={column.key}
                className={column.align === "end" ? "text-right" : undefined}
                // 表头标签的列内缩（见 `TrackTableColumn.inset`）。设计稿第 03 / 04 /
                // 09 / 10 / 13 页的「标题」都比列起点右 121px —— 它对齐的是行内的
                // **文字列**，不是列起点。此前表头只走行网格，于是整整错 120px
                // 却没有任何闸门发现（`verify.py` 的纵向带对 x 完全不敏感，1.3.22）。
                style={column.inset === undefined ? undefined : { paddingLeft: column.inset }}
              >
                {column.label}
              </span>
            ))}
          </div>
        )}
        {children}
      </div>
    </TrackTableContext>
  );
};
