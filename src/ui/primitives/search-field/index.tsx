import type { ReactNode, Ref } from "react";

import { twMerge } from "tailwind-merge";

import { Icon } from "@/ui/primitives/icon";

interface SearchFieldProps {
  value: string;
  onValueChange: (value: string) => void;
  /** 回车提交。 */
  onSubmit?: (value: string) => void;
  /** 无障碍名称。默认「搜索」。 */
  label?: string;
  placeholder?: string;
  inputRef?: Ref<HTMLInputElement>;
  /** 右侧动作位（原型 `.local-link`：跳到本地音乐搜索）。用 `<Button variant="outline">`。 */
  trailing?: ReactNode;
  /** 自动聚焦。搜索结果页希望一进来就能输入。 */
  autoFocus?: boolean;
  className?: string;
}

/**
 * 大搜索框（原型 `.searchfield`）。
 *
 * 几何：高 70、圆角 **18px**（`--biu-radius-field-lg`）、左右内边距 22 / 16、
 * 图标与输入间隔 18、输入字号 **30**、字重 600、字距 -0.4、底色白 10% + 10% 描边。
 *
 * 与顶栏搜索（`TopBarSearch`，40 高、999 圆角）是**两个不同的控件**，
 * 只是名字都叫「搜索」。设计稿在搜索结果页把搜索框放大到 70px，
 * 是为了让「当前在搜什么」成为这一屏的视觉主体。
 *
 * 这里用原生 `<input>` 而不是 HeroUI `Input`：它是**受控的大字号输入**，
 * 需要精确控制 30px 字号与 70px 高度的行内对齐，而 HeroUI 的输入内部
 * 有一层固定尺寸的 wrapper，覆写成本高于自己写。焦点环由 app.css 的全局
 * `:focus-visible` 规则提供，不需要组件自己处理。
 */
export const SearchField = ({
  value,
  onValueChange,
  onSubmit,
  label = "搜索",
  placeholder,
  inputRef,
  trailing,
  autoFocus = false,
  className,
}: SearchFieldProps) => (
  <div
    className={twMerge(
      "flex h-[70px] items-center gap-[18px] rounded-[var(--biu-radius-field-lg)]",
      "border border-[var(--biu-border)] bg-[var(--biu-surface-hover)] pr-4 pl-[22px]",
      className,
    )}
  >
    <Icon name="search" size={30} className="text-[rgb(var(--biu-text-secondary))]" />
    <input
      ref={inputRef}
      type="search"
      value={value}
      // eslint-disable-next-line jsx-a11y/no-autofocus -- 搜索页的主输入框，自动聚焦是设计意图
      autoFocus={autoFocus}
      aria-label={label}
      placeholder={placeholder}
      onChange={event => onValueChange(event.currentTarget.value)}
      onKeyDown={event => {
        if (event.key === "Enter") onSubmit?.(event.currentTarget.value);
      }}
      className={twMerge(
        "min-w-0 flex-1 border-0 bg-transparent font-semibold tracking-[-0.4px] outline-none",
        "text-[30px] text-[rgb(var(--biu-text-primary))] placeholder:text-[var(--biu-text-placeholder)]",
      )}
    />
    {trailing}
  </div>
);
