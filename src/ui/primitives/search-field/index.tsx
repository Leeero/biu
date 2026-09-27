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
 * 几何取设计稿第 7 页实测（spec-lock `geometry.searchField`，1.3.13），
 * **不是原型的值**：高 72（原型 70）、圆角 18（`--biu-radius-field-lg`）、
 * 左右内边距 22 / 16、图标墨迹 16（`iconSize` 记 18，原型 23）、输入字号 30、
 * 字重 600、字距 -0.4、底色**白 8%**（`--biu-veil-8`，原型 10%）+
 * **白 14% 描边**（`--biu-veil-14`，原型 10%）。
 *
 * 与顶栏搜索（`TopBarSearch`，40 高、999 圆角）是**两个不同的控件**，
 * 只是名字都叫「搜索」。设计稿在搜索结果页把搜索框放大到 72px，
 * 是为了让「当前在搜什么」成为这一屏的视觉主体。
 *
 * 右端 `trailing` 是 local-link 药丸：它**不贴盒右缘**，右侧留 158px 空白
 * （spec-lock `geometry.searchField.localLink.rightInset`）—— 那个留白由传入的
 * trailing 节点自己带 `mr-[var(--biu-layout-searchfield-link-right-inset)]`，
 * 本组件不替它决定，因为它只对「本地音乐搜索」这一个 trailing 成立。
 *
 * 这里用原生 `<input>` 而不是 HeroUI `Input`：它是**受控的大字号输入**，
 * 需要精确控制 30px 字号与 72px 高度的行内对齐，而 HeroUI 的输入内部
 * 有一层固定尺寸的 wrapper，覆写成本高于自己写。焦点环由 app.css 的全局
 * `:focus-visible` 规则提供，不需要组件自己处理。
 *
 * 输入框的 `pt-[11px]` 是设计稿的**基线摆放**（spec-lock
 * `geometry.searchField.queryBaseline`，1.3.14）：第 7 页查询词墨迹重心
 * 比盒几何中心低 5.5px（图标才是居中的），flex 居中下 `pt/2` 即下移量。
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
      "flex h-[var(--biu-layout-searchfield-h)] items-center gap-[18px] rounded-[var(--biu-radius-field-lg)]",
      "border border-[var(--biu-veil-14)] bg-[var(--biu-veil-8)] pr-4 pl-[22px]",
      className,
    )}
  >
    <Icon name="search" size="var(--biu-layout-searchfield-icon)" className="text-[rgb(var(--biu-text-secondary))]" />
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
        "min-w-0 flex-1 border-0 bg-transparent pt-[11px] font-semibold tracking-[-0.4px] outline-none",
        "text-[30px] text-[rgb(var(--biu-text-primary))] placeholder:text-[var(--biu-text-placeholder)]",
      )}
    />
    {trailing}
  </div>
);
