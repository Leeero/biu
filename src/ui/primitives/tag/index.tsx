import type { ReactNode } from "react";

import { twMerge } from "tailwind-merge";

export type TagVariant = "quality" | "accent" | "plain" | "danger";

/**
 * 尺寸两档。
 *
 * `sm` 是原型的 `.tag`（高 22 / 左右内边距 8），全站标准档。
 * `lg` 只出现在**发现音乐大卡**内：设计稿第 8 页实测 25 高、内边距 12 ——
 * 同一页的专辑卡标签量到 22.0，即同页两档、不是测量噪声（spec-lock
 * `geometry.heroCard.tagHeight`，1.3.17 用「无墨迹的干净列」单列 50% 交叉定值）。
 * 内边距 12 由最长那条纯中文标签反解：(156 − 11×12)/2。
 */
export type TagSize = "sm" | "lg";

/**
 * 属性标签（`.tag` 各变体）。
 *
 * 几何（`sm` 档）：高 22、左右内边距 8、圆角 **6px**（`--biu-radius-tag`）、字号 12、字重 500。
 * 发现音乐大卡内的 `lg` 档高 25、内边距 12（见 `TagSize`）。
 *
 * 关于圆角，这里有一个容易搞混的地方：P0 只登记了 chip = 8px（给 `.badge` 用），
 * `.tag` 的 6px 当时没进真值。P2 建本组件时把它补录为 `--biu-radius-tag`
 * 并写进 spec-lock —— 否则只能二选一：把 6 写死在组件里（真值出现未收录的视觉值），
 * 或改用 8px（与原型的静默背离）。两个都不该接受。
 *
 * **描边是透明的（1.3.20，见 `material.tag`）。** 设计稿第 8 页 5 枚芯片逐列
 * 剖面的上下缘亮度与填充同档（44–46 / 38–42，无过冲），而按变体表画的
 * `accent/26%` 叠在填充上应当是 **72.9** —— 渲染侧实测正是 71.7 / 74.0 的那两条
 * 1px 亮线。也就是说**原型 `.tag` 的 `border: 1px solid transparent` 才是对的**，
 * 是各变体后加的 `border-color` 在稿面上不成立。填充经默认 `background-clip:
 * border-box` 会铺到边框之下，所以透明边框与「无边框」在视觉上等价 —— 保留 1px
 * 是为了盒尺寸不变（`h-[22px]` 是 border-box）。这与 `material.badge` 的
 * `defaultBorder: "none"` 是同一结论，那边已立过先例。
 * **取证范围**：只在屏 07 的 5 枚芯片上逐点验证过，其余屏未逐屏复核。
 *
 * 变体映射：
 *   `quality` 音质（无损 / 高解析）  → `--biu-quality`
 *   `accent`  运营标签（独家首发 / 畅销）→ `--biu-accent` + `--biu-accent-ink`
 *   `plain`   中性属性（杜比全景声 / 本地 · M4A）→ 白 10% 底
 *   `danger`  失败态（下载出错）    → `--biu-danger-soft`
 *
 * **有意未实现 `.tag--ok`**：原型定义了它，但 12 屏无一使用，且 C+ 色板没有
 * success 语义色（其取值在色板里的身份是「WAV 格式色」，借来当成功色
 * 会让「改格式色」顺带改掉成功提示）。为一个不存在的用法发明颜色是错的 ——
 * 若将来真需要，先补 spec-lock 再实现。
 */
const VARIANTS: Record<TagVariant, string> = {
  quality: "bg-[rgb(var(--biu-quality)/14%)] text-[rgb(var(--biu-quality))]",
  accent: "bg-[rgb(var(--biu-accent)/18%)] text-[rgb(var(--biu-accent-ink))]",
  plain: "bg-[var(--biu-surface-hover)] text-[rgb(var(--biu-text-secondary))]",
  danger: "bg-[var(--biu-danger-soft)] text-[rgb(var(--biu-danger))]",
};

const SIZES: Record<TagSize, string> = {
  sm: "h-[22px] px-2",
  lg: "h-[var(--biu-layout-hero-tag-h)] px-[var(--biu-layout-hero-tag-x)]",
};

interface TagProps {
  variant?: TagVariant;
  size?: TagSize;
  children: ReactNode;
  className?: string;
}

export const Tag = ({ variant = "plain", size = "sm", children, className }: TagProps) => (
  <span
    className={twMerge(
      // `border-transparent` 不能省：Tailwind v4 的 preflight 把默认边框色定为
      // `currentColor`，省掉它就会描出一圈与文字同色的边（比设计稿亮得多）。
      "inline-flex flex-none items-center rounded-[var(--biu-radius-tag)] border border-transparent",
      "text-[length:var(--biu-type-micro-size)] font-medium whitespace-nowrap",
      SIZES[size],
      VARIANTS[variant],
      className,
    )}
  >
    {children}
  </span>
);
