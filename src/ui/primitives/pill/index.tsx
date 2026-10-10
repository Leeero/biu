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
 * 几何取自原型 `.pill`：高 36（`--lili-layout-pill-h`）、999 圆角、左右内边距 18、
 * 图标与文字间隔 7、字号 13、默认描边透明（占位，避免加描边时尺寸跳动）。
 *
 * 变体映射（原型 → C+ 令牌）：
 *   `.pill--primary`   近白底 + 近黑字   → `--lili-inverse-surface` / `--lili-inverse-ink`
 *   `.pill--secondary` 白 24% 底        → `--lili-surface-glass-strong`（同值同角色）
 *   `.pill--neutral`   白 17% 底 + 14% 描边 → `--lili-surface-field` / `--lili-veil-14`
 *   `.pill--accent`    强调色 22% 底 + 强调文字色 → `--lili-accent` / `--lili-accent-ink`
 *   `.pill--danger`    危险色 16% / 32% → `--lili-danger-soft` / `--lili-danger-line`
 *   `.pill--ghost`     白 10% 底        → `--lili-surface-hover`
 */
const VARIANTS: Record<PillVariant, string> = {
  /** 原型 `.pill` 不带底色，只有几何与文字色 */
  default: "text-[rgb(var(--lili-text-primary))]",
  primary: "bg-[rgb(var(--lili-inverse-surface))] font-semibold text-[rgb(var(--lili-inverse-ink))]",
  secondary: "bg-[var(--lili-surface-glass-strong)] font-medium text-[rgb(var(--lili-text-primary))]",
  neutral: "border-[var(--lili-veil-14)] bg-[var(--lili-surface-field)] text-[rgb(var(--lili-text-secondary))]",
  /**
   * 白 14% 底 + 12% 描边。原型 `.local-link`：搜索页的本地入口。
   *
   * **播放栏的队列入口不在此列**（1.3.9 订正）：设计稿实测该药丸是白 10% 底、
   * 无可见描边，对应的是下面的 `ghost`；原型 `.pb-queue` 的 14% 底 + 12% 描边
   * 是原型档。此前这里把 `.pb-queue` 写成 `outline` 的用例，与稿面不符。
   */
  outline: "border-[var(--lili-veil-12)] bg-[var(--lili-veil-14)] text-[rgb(var(--lili-text-secondary))]",
  accent: "bg-[rgb(var(--lili-accent)/22%)] font-medium text-[rgb(var(--lili-accent-ink))]",
  danger: "border-[var(--lili-danger-line)] bg-[var(--lili-danger-soft)] text-[rgb(var(--lili-danger))]",
  ghost: "bg-[var(--lili-surface-hover)] text-[rgb(var(--lili-text-secondary))]",
};

const VARIANTS_4188: Record<PillVariant, string> = {
  default: "text-[var(--lili-4188-text-primary)]",
  primary: "bg-[var(--lili-4188-action)] font-semibold text-[var(--lili-4188-text-primary)]",
  secondary: "bg-[var(--lili-4188-surface-hover)] font-medium text-[var(--lili-4188-text-primary)]",
  neutral:
    "border-[var(--lili-4188-border)] bg-[var(--lili-4188-surface-elevated)] text-[var(--lili-4188-text-secondary)]",
  outline: "border-[var(--lili-4188-border)] bg-transparent text-[var(--lili-4188-text-secondary)]",
  accent: "bg-[var(--lili-4188-action-soft)] font-medium text-[var(--lili-4188-action)]",
  danger:
    "border-[color-mix(in_srgb,var(--lili-4188-error)_40%,transparent)] bg-[color-mix(in_srgb,var(--lili-4188-error)_12%,transparent)] text-[var(--lili-4188-error)]",
  ghost: "bg-[var(--lili-4188-surface-hover)] text-[var(--lili-4188-text-secondary)]",
};

/** 图标在药丸里的字号，原型 `.pill .i` 为 15px。 */
export const PILL_ICON_SIZE = 15;

export const pillClass = (variant: PillVariant = "default", className?: string) =>
  twMerge(
    "inline-flex h-[var(--lili-layout-pill-h)] flex-none items-center gap-[7px]",
    "rounded-[var(--lili-radius-pill)] border border-transparent px-[18px]",
    "text-[length:var(--lili-type-label-size)] whitespace-nowrap",
    VARIANTS[variant],
    VARIANTS_4188[variant],
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
