import type { ReactNode } from "react";

import { twMerge } from "tailwind-merge";

export type TagVariant = "quality" | "accent" | "plain" | "danger";

/**
 * 属性标签（`.tag` 各变体）。
 *
 * 几何：高 22、左右内边距 8、圆角 **6px**（`--biu-radius-tag`）、字号 12、字重 500。
 *
 * 关于圆角，这里有一个容易搞混的地方：P0 只登记了 chip = 8px（给 `.badge` 用），
 * `.tag` 的 6px 当时没进真值。P2 建本组件时把它补录为 `--biu-radius-tag`
 * 并写进 spec-lock —— 否则只能二选一：把 6 写死在组件里（真值出现未收录的视觉值），
 * 或改用 8px（与原型的静默背离）。两个都不该接受。
 *
 * 变体映射：
 *   `quality` 音质（无损 / 高解析）  → `--biu-quality`
 *   `accent`  运营标签（独家首发 / 畅销）→ `--biu-accent` + `--biu-accent-ink`
 *   `plain`   中性属性（杜比全景声 / 本地 · M4A）→ 白 10% 底 + 12% 描边
 *   `danger`  失败态（下载出错）    → `--biu-danger-soft` / `--biu-danger-line`
 *
 * **有意未实现 `.tag--ok`**：原型定义了它，但 12 屏无一使用，且 C+ 色板没有
 * success 语义色（其取值在色板里的身份是「WAV 格式色」，借来当成功色
 * 会让「改格式色」顺带改掉成功提示）。为一个不存在的用法发明颜色是错的 ——
 * 若将来真需要，先补 spec-lock 再实现。
 */
const VARIANTS: Record<TagVariant, string> = {
  quality: "border-[rgb(var(--biu-quality)/24%)] bg-[rgb(var(--biu-quality)/14%)] text-[rgb(var(--biu-quality))]",
  accent: "border-[rgb(var(--biu-accent)/26%)] bg-[rgb(var(--biu-accent)/18%)] text-[rgb(var(--biu-accent-ink))]",
  plain: "border-[var(--biu-veil-12)] bg-[var(--biu-surface-hover)] text-[rgb(var(--biu-text-secondary))]",
  danger: "border-[var(--biu-danger-line)] bg-[var(--biu-danger-soft)] text-[rgb(var(--biu-danger))]",
};

interface TagProps {
  variant?: TagVariant;
  children: ReactNode;
  className?: string;
}

export const Tag = ({ variant = "plain", children, className }: TagProps) => (
  <span
    className={twMerge(
      "inline-flex h-[22px] flex-none items-center rounded-[var(--biu-radius-tag)] border px-2",
      "text-[length:var(--biu-type-micro-size)] font-medium whitespace-nowrap",
      VARIANTS[variant],
      className,
    )}
  >
    {children}
  </span>
);
