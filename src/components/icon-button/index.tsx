import { Button, Tooltip, type ButtonProps, type TooltipProps } from "@heroui/react";
import { twMerge } from "tailwind-merge";

interface Props extends Omit<ButtonProps, "startContent"> {
  tooltip?: React.ReactNode;
  tooltipProps?: TooltipProps;
}

const IconButton = ({ tooltip, tooltipProps, children, className, ...props }: Props) => {
  const button = (
    <Button
      isIconOnly
      radius="md"
      size="sm"
      variant="light"
      className={twMerge(
        "hover:text-primary text-inherit transition-[background-color,color,transform] duration-[var(--biu-duration-fast)] hover:bg-[rgb(var(--biu-color-surface-hover))]",
        className,
      )}
      {...props}
    >
      {children}
    </Button>
  );

  if (tooltip) {
    return (
      <Tooltip closeDelay={0} content={tooltip} {...tooltipProps}>
        {button}
      </Tooltip>
    );
  }

  return button;
};

export default IconButton;
