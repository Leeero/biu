import type { ReactNode } from "react";

import { twMerge } from "tailwind-merge";

/**
 * 分组间距。原型 `.section` 默认 20，逐屏校正给出 12 / 23 两档：
 *   `tight` 12（第 06 屏搜索结果：结果分组贴得更近）
 *   `base`  20（默认）
 *   `push`  23（第 07 屏发现音乐：首屏分组整体低 9px）
 */
export type SectionGap = "tight" | "base" | "push";

const GAPS: Record<SectionGap, string> = {
  tight: "mt-3",
  base: "mt-5",
  push: "mt-[23px]",
};

interface SectionProps {
  title?: ReactNode;
  /** 标题右侧的注释（原型 `.section-note`）。 */
  note?: ReactNode;
  gap?: SectionGap;
  children: ReactNode;
  className?: string;
}

/**
 * 分组（原型 `.section` / `.section-head` / `.section-title` / `.section-note`）。
 *
 * 标题是 `<h2>` 而不是 `<div>`：页面已有 `<h1>`（PageHeader），分组用 h2
 * 才能让读屏的标题大纲成立 —— 全是 div 时，用标题跳转的导航方式就失效了。
 *
 * 标题与栅格的间距 8px 来自设计稿第 2 页实测（`--biu-layout-section-head-mb`，
 * spec-lock geometry.sectionHead）：标题墨迹下缘 → 瓦片顶缘两处一致 12px，
 * 扣墨迹—盒缘偏移 4px 即 margin 8。原型 .section-head 的 4px 是原型—设计稿
 * 第 4 处分歧，实现按设计稿。
 *
 * 注意 `.section + .section` 的 27px 是用 `[&+&]` 复刻的，它比 `gap` 的
 * 单类选择器特异性更高，会覆盖首段的间距。这是有意为之：原型里
 * 「第一段到标题」与「段与段之间」本来就是两个值，`gap` 只管前者。
 */
export const Section = ({ title, note, gap = "base", children, className }: SectionProps) => (
  <section className={twMerge(GAPS[gap], "[&+&]:mt-[27px]", className)}>
    {title && (
      <header className="mb-[var(--biu-layout-section-head-mb)] flex items-baseline justify-between gap-4">
        <h2 className="m-0 text-[length:var(--biu-type-small-size)] leading-6 font-semibold text-[rgb(var(--biu-text-primary))]">
          {title}
        </h2>
        {note && (
          <span className="text-[length:var(--biu-type-label-size)] text-[rgb(var(--biu-text-quaternary))]">
            {note}
          </span>
        )}
      </header>
    )}
    {children}
  </section>
);
