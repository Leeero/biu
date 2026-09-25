import type { ReactNode } from "react";

import { twMerge } from "tailwind-merge";

import { Icon, type IconName } from "@/ui/primitives/icon";

export type BadgeVariant = "default" | "dir";

/**
 * 来源徽标（`.badge` / `.badge--dir`）。
 *
 * 几何：高 24、左右内边距 9、圆角 8（`--biu-radius-sm`，即色板里的 chip 档）、
 * 字号 12。材质来自设计稿实测（spec-lock material.badge），**不是**原型 app.css
 * 的白 14% —— 白芯片在影像上读作「浅色块」，设计稿读作「压暗的口」：
 *
 *   default  黑 45% 芯片（--biu-scrim-badge）+ 白字，无描边
 *   dir      强调蓝 84% 芯片（--biu-dir-chip）+ 反色墨，无描边
 *
 * 芯片材质与 veil 档位的对应关系由 design-tokens.test.ts 钉住
 * （「默认徽标被改回了原型的白 14% 底」那条就是为这个回退准备的）。
 *
 * **不含定位**。原型把 `.badge` 写成 `position: absolute; left: 12; top: 12`，
 * 但它在各屏的落点并不一致（瓦片左上 12、格式卡右上 16、专辑封面左上 10）。
 * 把某一处的位置写进组件，另外两处就得靠 `!important` 覆盖 ——
 * 因此这里只画徽标本身，位置由容器决定（容器加 `absolute` 与偏移即可）。
 */
const VARIANTS: Record<BadgeVariant, string> = {
  default: "bg-[var(--biu-scrim-badge)] text-[rgb(var(--biu-text-primary))]",
  dir: "bg-[var(--biu-dir-chip)] text-[rgb(var(--biu-inverse-ink))]",
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
      "inline-flex h-6 flex-none items-center gap-[5px] rounded-[var(--biu-radius-sm)] px-[9px]",
      "text-[length:var(--biu-type-micro-size)] whitespace-nowrap",
      VARIANTS[variant],
      className,
    )}
  >
    {icon && <Icon name={icon} size={12} />}
    {children}
  </span>
);
