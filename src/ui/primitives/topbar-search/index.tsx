import type { KeyboardEvent, ReactNode, Ref } from "react";

import { Input } from "@heroui/react";
import { twMerge } from "tailwind-merge";

import { Icon } from "@/ui/primitives/icon";

interface TopBarSearchProps {
  value: string;
  onValueChange: (value: string) => void;
  /** 无障碍名称。默认「搜索音乐视频或创作者」。 */
  label?: string;
  placeholder?: string;
  inputRef?: Ref<HTMLInputElement>;
  /**
   * 右侧快捷键提示。默认渲染 `Ctrl K`。
   * 传 `null` 可关掉——**但关掉前请确认没有注册该快捷键**：
   * 显示一个按不动的提示比不显示更糟（P1 已按「提示可见就必须可用」实现）。
   */
  shortcutHint?: ReactNode;
  onFocus?: () => void;
  onBlur?: (event: React.FocusEvent<HTMLInputElement>) => void;
  onKeyDown?: (event: KeyboardEvent<HTMLInputElement>) => void;
  onClick?: () => void;
  className?: string;
  /** 建议 / 历史浮层。相对本组件绝对定位在输入框下方。 */
  children?: ReactNode;
}

/**
 * 顶栏搜索位（原型 `.search`）。
 *
 * 几何：高 40、圆角 999、左内边距 16、右 8、图标 20、字号 15、底色白 17%。
 * 宽度是**弹性**的（`min(32vw, 400px)`，下限 240）：设计稿在 1440 宽下是 400，
 * 但窗口收窄时若写死 400，右侧的头像与窗口按钮会被挤出去。
 *
 * 本组件只负责「样子 + 输入框」，不含任何业务：搜索建议、历史、快捷键注册
 * 都留在顶栏（那里才知道路由与用户态）。这样 `/search` 页也能复用同一外壳。
 *
 * 底座沿用 HeroUI `Input`（方案 §4.3）：键盘、焦点环、清除按钮都由它保证，
 * 只把外观换成 C+ 令牌 —— 自己重写一套焦点管理是这类组件最常见的返工来源。
 */
export const TopBarSearch = ({
  value,
  onValueChange,
  label = "搜索音乐视频或创作者",
  placeholder = "搜索音乐视频或创作者",
  inputRef,
  shortcutHint,
  onFocus,
  onBlur,
  onKeyDown,
  onClick,
  className,
  children,
}: TopBarSearchProps) => (
  <div className={twMerge("relative w-[min(32vw,400px)] min-w-[240px]", className)}>
    <Input
      ref={inputRef}
      value={value}
      onValueChange={onValueChange}
      onFocus={onFocus}
      onBlur={onBlur}
      onKeyDown={onKeyDown}
      onClick={onClick}
      aria-label={label}
      placeholder={placeholder}
      isClearable
      startContent={<Icon name="search" size={20} className="text-[rgb(var(--biu-text-quaternary))]" />}
      endContent={
        shortcutHint === null
          ? undefined
          : (shortcutHint ?? (
              <kbd
                aria-hidden="true"
                className="flex h-6 flex-none items-center rounded-[7px] bg-[var(--biu-veil-28)] px-2 text-[length:var(--biu-type-micro-size)] tracking-[0.2px] text-[rgb(var(--biu-text-chrome-label))]"
              >
                Ctrl K
              </kbd>
            ))
      }
      className="window-no-drag w-full"
      classNames={{
        input:
          "text-[length:var(--biu-type-body-size)] outline-none focus-visible:outline-none placeholder:text-[var(--biu-text-placeholder)]",
        inputWrapper:
          "h-10 rounded-[var(--biu-radius-pill)] border border-transparent bg-[var(--biu-surface-field)] px-4 text-[rgb(var(--biu-text-primary))] shadow-none outline-none transition-[background-color,border-color,box-shadow] group-data-[focus=true]:border-[var(--biu-glass-border)] group-data-[focus=true]:bg-[var(--biu-surface-field)] group-data-[focus=true]:shadow-[0_0_0_3px_var(--biu-accent-soft)] group-data-[focus-visible=true]:ring-0 group-data-[focus-visible=true]:outline-none",
      }}
    />
    {children}
  </div>
);
