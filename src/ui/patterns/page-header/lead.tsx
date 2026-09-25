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
 * 字号 22、行高 28、字距 -0.2、色为二级文字。
 */
export const PageLead = ({ offset = "base", children, className }: PageLeadProps) => (
  <p
    className={twMerge(
      OFFSETS[offset],
      "text-[length:var(--biu-type-lead-size)] leading-7 tracking-[-0.2px] text-[rgb(var(--biu-text-secondary))]",
      className,
    )}
  >
    {children}
  </p>
);
