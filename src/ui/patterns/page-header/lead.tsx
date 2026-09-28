import type { ReactNode } from "react";

import { twMerge } from "tailwind-merge";

/**
 * 导语的三种上边距。原型分别来自三条规则：
 *   `base` 8（`.page-lead` 默认）
 *   `low`  14（`.page-lead--low`，第 01 / 04 屏：导语比常规低 6px）
 *   `flat` 13（`.head-main--flat .page-lead`，第 07 屏：标题列去掉错位基线后的补偿）
 */
export type LeadOffset = "base" | "low" | "flat";

const OFFSETS: Record<LeadOffset, string> = {
  base: "mt-2",
  low: "mt-[14px]",
  flat: "mt-[13px]",
};

interface PageLeadProps {
  offset?: LeadOffset;
  /**
   * **屏级**上边距覆写（像素）。给了它即压过 `offset` 档位。
   *
   * 与 `Section.gapPx` 同一个理由：导语上边距逐屏不同（第 07 屏 18，档位表里
   * 最接近的 `low` 是 14），且 `flat` 那一档本身就是「第 07 屏」的特例命名 ——
   * 再按屏加档会一路加上去。第 07 屏的出处：
   * spec-lock `screens[06].rhythmImplementation.leadMarginTop`。
   */
  offsetPx?: number;
  children: ReactNode;
  className?: string;
}

/**
 * 页面导语（原型 `.page-lead`）。
 *
 * 单独成件而不是只作为 `PageHeader` 的 prop，是因为第 06 屏搜索结果里
 * 它**不属于头部网格**：那一屏没有 h1（大搜索框本身就是标题带），
 * 导语直接接在搜索框下面。若把它埋在 PageHeader 内部，那一屏就只能
 * 另抄一份同样的样式 —— 抄出来的那份迟早会与这份漂移。
 *
 * 字号 **20**（spec-lock 1.3.24 订正：原型 `--fs-lead` 的 22 是「按 1.15 阶梯收敛」推出来的
 * 派生值，设计稿实测跨十页一致为 20）、行高 28（`leading-7`，**像素给定、与字号解耦** ——
 * 所以改字号不会挪任何 y）、字距 -0.2、色为二级文字。
 */
export const PageLead = ({ offset = "base", offsetPx, children, className }: PageLeadProps) => (
  <p
    className={twMerge(
      offsetPx === undefined && OFFSETS[offset],
      "text-[length:var(--biu-type-lead-size)] leading-7 tracking-[-0.2px] text-[rgb(var(--biu-text-secondary))]",
      className,
    )}
    style={offsetPx === undefined ? undefined : { marginTop: offsetPx }}
  >
    {children}
  </p>
);
