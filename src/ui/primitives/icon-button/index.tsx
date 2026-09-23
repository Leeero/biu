import type { ReactNode } from "react";

import { Button, Tooltip, type ButtonProps, type TooltipProps } from "@heroui/react";
import { twMerge } from "tailwind-merge";

interface IconButtonProps extends Omit<ButtonProps, "aria-label" | "children" | "isIconOnly"> {
  label: string;
  children: ReactNode;
  tooltipProps?: Omit<TooltipProps, "children" | "content">;
}

export const IconButton = ({ label, children, className, tooltipProps, ...props }: IconButtonProps) => (
  <Tooltip content={label} closeDelay={0} {...tooltipProps}>
    <Button
      isIconOnly
      aria-label={label}
      radius="full"
      variant="light"
      className={twMerge(
        "text-foreground-600 hover:bg-foreground/8 hover:text-foreground data-[pressed=true]:scale-95",
        "transition-[color,background-color,transform] duration-[var(--biu-duration-fast)]",
        className,
      )}
      {...props}
    >
      {children}
    </Button>
  </Tooltip>
);
