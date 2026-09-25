import type { ButtonHTMLAttributes, ReactNode } from "react";

import { twMerge } from "tailwind-merge";

import { Icon, type IconName } from "@/ui/primitives/icon";
import { PILL_ICON_SIZE, pillClass, type PillVariant } from "@/ui/primitives/pill";

/**
 * 状态补充说明（§5.3 要求每组件覆盖 default / hover / pressed / focus-visible /
 * disabled / loading，但原型的 `.pill` 只写了几何与 `transition`，没有定义任何交互态）。
 * 因此除「悬停 = 白 8% 叠层」这一步取自 `.tab:hover` 的同一个档位外，其余都是**新增**，
 * 在这里显式声明，而不是悄悄发明：
 *
 *   hover      白 8% 叠层（`--biu-veil-8`）。用叠层而不是换底色，是为了让七个变体
 *              共用同一条规则 —— 替每个变体各定一个 hover 底色，等于凭空发明六种颜色。
 *              `primary` 例外：它底色近白，再叠白看不出变化，改用色板里已有的
 *              `--biu-inverse-surface-hover`（按下更暗，方向正确）。
 *   pressed    白 14% 叠层（`--biu-veil-14`），比 hover 深一档。
 *   focus-visible 不自带描边，交给 app.css 里的全局 `:focus-visible` 规则统一处理 ——
 *              每个组件各画一套焦点环，迟早会出现五颜六色的焦点样式。
 *   disabled   40% 不透明度 + 禁用光标。原型未定义，属新增。
 *   loading    内联转圈并 `aria-busy`，同时禁止重复触发。原型未定义，属新增。
 */
const HOVER_OVERLAY =
  "after:pointer-events-none after:absolute after:inset-0 after:rounded-[inherit] after:content-[''] after:transition-colors";

interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children" | "disabled"> {
  variant?: PillVariant;
  icon?: IconName;
  trailing?: ReactNode;
  children?: ReactNode;
  /** 展示加载态；同时把按钮置为不可重复触发。 */
  loading?: boolean;
  disabled?: boolean;
  /** 铺满可用宽度。用于弹层的底部主操作。 */
  block?: boolean;
}

export const Button = ({
  variant = "default",
  icon,
  trailing,
  children,
  loading = false,
  disabled = false,
  block = false,
  className,
  type = "button",
  ...props
}: ButtonProps) => {
  const isInert = disabled || loading;

  return (
    <button
      {...props}
      type={type}
      disabled={isInert}
      aria-busy={loading || undefined}
      className={pillClass(
        variant,
        twMerge(
          "relative cursor-pointer transition-colors duration-[var(--biu-duration-fast)] ease-[var(--biu-ease-standard)]",
          HOVER_OVERLAY,
          variant === "primary"
            ? "hover:bg-[rgb(var(--biu-inverse-surface-hover))]"
            : "hover:after:bg-[var(--biu-veil-8)]",
          "active:after:bg-[var(--biu-veil-14)]",
          "disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:after:bg-transparent",
          block && "w-full justify-center",
          className,
        ),
      )}
    >
      {loading ? (
        <span
          aria-hidden="true"
          className="size-[15px] flex-none animate-spin rounded-full border-2 border-current border-t-transparent"
        />
      ) : (
        icon && <Icon name={icon} size={PILL_ICON_SIZE} />
      )}
      {children}
      {trailing}
    </button>
  );
};
