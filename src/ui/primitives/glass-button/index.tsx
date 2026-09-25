import type { ButtonHTMLAttributes } from "react";

import { twMerge } from "tailwind-merge";

import { Icon, type IconName } from "@/ui/primitives/icon";

export type GlassTone = "glass" | "plain" | "bare" | "inverse";

/**
 * 四种底色。这里有一处必须说清楚的对应关系：
 *
 * 原型里 `白 16% + 描边白 + 模糊 20` 这组玻璃材质写在**容器**上
 * （`.actionband` / `.track-actions`），而容器内的 `.round` 本身是**透明的**。
 * 重构方案 §5.1 把玻璃材质记在了 `GlassButton` 上，那是摘要层面的合并。
 * 两者不冲突，但实现必须区分开，否则会出现「按钮自己一层玻璃 + 容器又一层玻璃」
 * 的双层叠加，比设计稿亮一档：
 *
 *   `glass`   自带玻璃材质。用于**独立出现**的圆片按钮（§5.1 描述的形态）。
 *   `plain`   透明，悬停 18% 白。用于 `.actionband`（瓦片操作带）内部 ——
 *             材质由带子提供，悬停反馈由 `.actionband .round:hover` 给出。
 *   `bare`    透明，**无悬停反馈**。用于 `.track-actions`（列表行内操作带）内部。
 *   `inverse` 近白底 + 近黑字。原型 `.round--lead`，即主操作（播放）。
 *
 * `plain` 与 `bare` 的区分不是洁癖：原型里只有 `.actionband .round:hover`
 * 一条悬停规则（app.css:480），`.track-actions .round` **没有** `:hover` 规则。
 * 若图省事都走 `plain`，列表行内的按钮会比设计稿多一层悬停底色 —— 那属于改设计。
 * 行内操作带的反馈由「整条带子随行悬停/选中而出现」承担。
 * 这是原型的如实还原，不是遗漏；若要补悬停反馈，须先改 spec-lock。
 */
const TONES: Record<GlassTone, string> = {
  glass:
    "border border-[var(--biu-glass-border)] bg-[var(--biu-surface-glass)] backdrop-blur-[var(--biu-blur-glass)] text-[rgb(var(--biu-text-primary))] hover:bg-[var(--biu-veil-18)]",
  plain: "text-[rgb(var(--biu-text-primary))] hover:bg-[var(--biu-veil-18)]",
  bare: "text-[rgb(var(--biu-text-primary))]",
  inverse:
    "bg-[rgb(var(--biu-inverse-surface))] text-[rgb(var(--biu-inverse-ink))] hover:bg-[rgb(var(--biu-inverse-surface-hover))]",
};

interface GlassButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children" | "disabled"> {
  /** 无障碍名称。圆片按钮没有可见文字，这个必填。 */
  label: string;
  icon: IconName;
  tone?: GlassTone;
  /**
   * 直径像素。原型出现的档位：30（行内操作带）、34（瓦片操作带）、
   * 38（行内操作带的主操作）、48（播放栏播放键）、56（沉浸态与发现音乐大卡的播放键）。
   */
  size?: number;
  /** 图标字号。原型：30 → 15px（比例 0.5，是唯一的例外）、34 → 17px、38 → 17px、48 → 22px、56 → 26px；其余约为直径 × 0.45。 */
  iconSize?: number;
  disabled?: boolean;
  className?: string;
}

/** 图标字号的经验比例，原型各档实测约为直径的 0.45。 */
const defaultIconSize = (diameter: number) => Math.round(diameter * 0.45);

export const GlassButton = ({
  label,
  icon,
  tone = "glass",
  size = 34,
  iconSize,
  disabled = false,
  className,
  type = "button",
  ...props
}: GlassButtonProps) => (
  <button
    {...props}
    type={type}
    aria-label={label}
    title={label}
    disabled={disabled}
    className={twMerge(
      "grid flex-none cursor-pointer place-items-center rounded-[var(--biu-radius-round)]",
      "transition-colors duration-[var(--biu-duration-fast)] ease-[var(--biu-ease-standard)]",
      "disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent",
      TONES[tone],
      className,
    )}
    style={{ width: size, height: size }}
  >
    <Icon name={icon} size={iconSize ?? defaultIconSize(size)} />
  </button>
);
