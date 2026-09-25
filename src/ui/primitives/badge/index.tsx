import type { ReactNode } from "react";

import { twMerge } from "tailwind-merge";

import { Icon, type IconName } from "@/ui/primitives/icon";

export type BadgeVariant = "default" | "dir";

/**
 * 来源徽标（`.badge` / `.badge--dir`）。
 *
 * 几何：高 24、左右内边距 9、圆角 8（`--biu-radius-sm`，即色板里的 chip 档）、
 * 字号 12、底色白 14% + 描边白 12%。
 *
 * **不含定位**。原型把 `.badge` 写成 `position: absolute; left: 12; top: 12`，
 * 但它在各屏的落点并不一致（瓦片左上 12、格式卡右上 16、专辑封面左上 10）。
 * 把某一处的位置写进组件，另外两处就得靠 `!important` 覆盖 ——
 * 因此这里只画徽标本身，位置由容器决定（容器加 `absolute` 与偏移即可）。
 */
const VARIANTS: Record<BadgeVariant, string> = {
  default: "border-[var(--biu-veil-12)] bg-[var(--biu-veil-14)] text-[rgb(var(--biu-text-primary))]",
  dir: "border-[rgb(var(--biu-dir)/24%)] bg-[rgb(var(--biu-dir)/16%)] text-[rgb(var(--biu-dir))]",
};

interface BadgeProps {
  variant?: BadgeVariant;
  icon?: IconName;
  children: ReactNode;
  className?: string;
}

export const Badge = ({ variant = "default", icon, children, className }: BadgeProps) => (
  <span
    className={twMerge(
      "inline-flex h-6 flex-none items-center gap-[5px] rounded-[var(--biu-radius-sm)] border px-[9px]",
      "text-[length:var(--biu-type-micro-size)] whitespace-nowrap",
      VARIANTS[variant],
      className,
    )}
  >
    {icon && <Icon name={icon} size={12} />}
    {children}
  </span>
);
