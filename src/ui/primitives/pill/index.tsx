import type { ReactNode } from "react";

import { twMerge } from "tailwind-merge";

import { Icon, type IconName } from "@/ui/primitives/icon";

export type PillVariant = "default" | "primary" | "secondary" | "neutral" | "outline" | "accent" | "danger" | "ghost";

/**
 * 药丸的视觉契约。
 *
 * `Pill`（不可交互）与 `Button`（可交互）共用这一份定义 —— 同一个样子只允许有一处描述，
 * 否则「筛选条里的药丸」和「按钮」迟早会漂成两种样子。
 *
 * 几何取自原型 `.pill`：高 36（`--biu-layout-pill-h`）、999 圆角、左右内边距 18、
 * 图标与文字间隔 7、字号 13、默认描边透明（占位，避免加描边时尺寸跳动）。
 *
 * 变体映射（原型 → C+ 令牌）：
 *   `.pill--primary`   近白底 + 近黑字   → `--biu-inverse-surface` / `--biu-inverse-ink`
 *   `.pill--secondary` 白 24% 底        → `--biu-surface-glass-strong`（同值同角色）
 *   `.pill--neutral`   白 17% 底 + 14% 描边 → `--biu-surface-field` / `--biu-veil-14`
 *   `.pill--accent`    强调色 22% 底 + 强调文字色 → `--biu-accent` / `--biu-accent-ink`
 *   `.pill--danger`    危险色 16% / 32% → `--biu-danger-soft` / `--biu-danger-line`
 *   `.pill--ghost`     白 10% 底        → `--biu-surface-hover`
 */
const VARIANTS: Record<PillVariant, string> = {
  /** 原型 `.pill` 不带底色，只有几何与文字色 */
  default: "text-[rgb(var(--biu-text-primary))]",
  primary: "bg-[rgb(var(--biu-inverse-surface))] font-semibold text-[rgb(var(--biu-inverse-ink))]",
  secondary: "bg-[var(--biu-surface-glass-strong)] font-medium text-[rgb(var(--biu-text-primary))]",
  neutral: "border-[var(--biu-veil-14)] bg-[var(--biu-surface-field)] text-[rgb(var(--biu-text-secondary))]",
  /**
   * 白 14% 底 + 12% 描边。原型 `.local-link`：搜索页的本地入口。
   *
   * **播放栏的队列入口不在此列**（1.3.9 订正）：设计稿实测该药丸是白 10% 底、
   * 无可见描边，对应的是下面的 `ghost`；原型 `.pb-queue` 的 14% 底 + 12% 描边
   * 是原型档。此前这里把 `.pb-queue` 写成 `outline` 的用例，与稿面不符。
   */
  outline: "border-[var(--biu-veil-12)] bg-[var(--biu-veil-14)] text-[rgb(var(--biu-text-secondary))]",
  accent: "bg-[rgb(var(--biu-accent)/22%)] font-medium text-[rgb(var(--biu-accent-ink))]",
  danger: "border-[var(--biu-danger-line)] bg-[var(--biu-danger-soft)] text-[rgb(var(--biu-danger))]",
  ghost: "bg-[var(--biu-surface-hover)] text-[rgb(var(--biu-text-secondary))]",
};

/** 图标在药丸里的字号，原型 `.pill .i` 为 15px。 */
export const PILL_ICON_SIZE = 15;

export const pillClass = (variant: PillVariant = "default", className?: string) =>
  twMerge(
    "inline-flex h-[var(--biu-layout-pill-h)] flex-none items-center gap-[7px]",
    "rounded-[var(--biu-radius-pill)] border border-transparent px-[18px]",
    "text-[length:var(--biu-type-label-size)] whitespace-nowrap",
    VARIANTS[variant],
    className,
  );

interface PillProps {
  variant?: PillVariant;
  icon?: IconName;
  children?: ReactNode;
  trailing?: ReactNode;
  className?: string;
  title?: string;
}

/**
 * 静态药丸。
 *
 * 用于「看起来像按钮、但不是按钮」的场合 —— 筛选条里已生效的条件、列表里的属性标记。
 * 需要点击的一律用 `Button`：`<span>` 加 onClick 既不可聚焦，也无法用键盘触发，
 * 是常见的无障碍返工点。
 */
export const Pill = ({ variant = "default", icon, children, trailing, className, title }: PillProps) => (
  <span className={pillClass(variant, className)} title={title}>
    {icon && <Icon name={icon} size={PILL_ICON_SIZE} />}
    {children}
    {trailing}
  </span>
);
