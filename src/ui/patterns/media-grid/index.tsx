import type { ReactNode } from "react";

import { twMerge } from "tailwind-merge";

/**
 * 列数。原型 `.grid`（4 列）/ `.grid--2` / `.grid--3` 三个类，
 * 专辑栅格另有一套 `.album-grid`（3 列 / 23px 间距）在 `AlbumGrid` 里。
 */
export type MediaGridColumns = 2 | 3 | 4;

/** 瓦片是内容，列数不是可调项 —— 原型 12 屏里出现了三种，调用方按屏选。 */
const COLUMNS: Record<MediaGridColumns, string> = {
  2: "grid-cols-2",
  3: "grid-cols-3",
  4: "grid-cols-4",
};

interface MediaGridProps {
  columns?: MediaGridColumns;
  children: ReactNode;
  className?: string;
}

/**
 * 瓦片栅格（原型 `.grid`）。
 *
 * `repeat(N, minmax(0, 1fr))` 原样照搬 —— 这已经是弹性布局：列宽随容器收缩，
 * 只是**列数固定**。特意**不**改成 `repeat(auto-fill, minmax(206px, 1fr))`：
 * 真值里确实有 `grid.tileMinWidth = 206px`，但在 1440 基准画布下
 * （内容宽 1440 − 2×64 = 1312）auto-fill 会算出 6 列而不是 4 列，
 * 与设计稿不符。列数是设计决策，容器宽度不该改变它。
 *
 * `minmax(0, 1fr)` 里的 `0` 不是可省的：默认 `minmax(auto, 1fr)` 下，
 * 长标题会把列撑宽、把栅格挤变形。这是 grid 最常见的坑。
 */
export const MediaGrid = ({ columns = 4, children, className }: MediaGridProps) => (
  <div className={twMerge("grid gap-[var(--biu-layout-grid-gap)]", COLUMNS[columns], className)}>{children}</div>
);
