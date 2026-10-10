import type { ReactNode } from "react";

import { Button, Tooltip, type ButtonProps, type TooltipProps } from "@heroui/react";
import { twMerge } from "tailwind-merge";

interface IconButtonProps extends Omit<ButtonProps, "aria-label" | "children" | "isIconOnly"> {
  label: string;
  children: ReactNode;
  tooltipProps?: Omit<TooltipProps, "children" | "content">;
}

/**
 * 图标按钮。
 *
 * 保留 HeroUI `Button` 作为底座（方案 §5.4：`icon-button` 保留、接入 C+ 玻璃态变体）：
 * 它提供了 pressed 态、键盘触发与 Tooltip 的联动，自己重写收益很低。
 *
 * P2 只做一件事：把上一轮的 HeroUI 主题色（`text-foreground-600` /
 * `hover:bg-foreground/8`）换成 C+ 令牌。此前那套写法既绕过了色板，
 * 又会在主题收敛后失去对比度依据。
 */
export const IconButton = ({ label, children, className, tooltipProps, ...props }: IconButtonProps) => (
  <Tooltip content={label} closeDelay={0} {...tooltipProps}>
    <Button
      isIconOnly
      aria-label={label}
      radius="full"
      variant="light"
      className={twMerge(
        "text-[rgb(var(--lili-text-tertiary))] hover:bg-[var(--lili-surface-hover)] hover:text-[rgb(var(--lili-text-primary))]",
        "data-[pressed=true]:scale-95",
        "transition-[color,background-color,transform] duration-[var(--lili-duration-fast)]",
        "lili-theme-4188:text-[var(--lili-4188-text-muted)] lili-theme-4188:hover:bg-[var(--lili-4188-surface-hover)] lili-theme-4188:hover:text-[var(--lili-4188-text-primary)]",
        "lili-theme-4188:data-[pressed=true]:bg-[var(--lili-4188-surface-pressed)] lili-theme-4188:data-[pressed=true]:scale-[var(--lili-4188-press-scale)]",
        "lili-theme-4188:duration-[var(--lili-4188-duration-fast)]",
        "aria-[pressed=true]:border aria-[pressed=true]:border-[var(--lili-4188-action)] aria-[pressed=true]:bg-[var(--lili-4188-action-soft)] aria-[pressed=true]:text-[var(--lili-4188-action)]",
        className,
      )}
      {...props}
    >
      {children}
    </Button>
  </Tooltip>
);
