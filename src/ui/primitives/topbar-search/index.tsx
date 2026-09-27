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
   * 根节点 ref。
   *
   * 本组件把业务留在调用方（顶栏才知道路由与用户态），而「点输入框外面关掉
   * 建议浮层」这件事必须由调用方做 —— 它需要能观察到整个搜索位的边界，
   * 而不是只拿到输入框。没有这个 ref，调用方只能在外层再包一个 div，
   * 那会让定位基准（`top-full` 相对谁）与宽度约束都多绕一层。
   */
  rootRef?: Ref<HTMLDivElement>;
  /**
   * 右侧快捷键提示。默认渲染 `Ctrl K`。
   * 传 `null` 可关掉——**但关掉前请确认没有注册该快捷键**：
   * 显示一个按不动的提示比不显示更糟（P1 已按「提示可见就必须可用」实现）。
   * 输入框有值时提示自动隐去，把位置让给 HeroUI 的清除按钮。
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

/** 默认快捷键提示文字。设计稿在每一屏的搜索位右侧都画了这枚键帽。 */
const DEFAULT_SHORTCUT_HINT = "Ctrl K";

/**
 * 缺省占位。
 *
 * **顶栏总是显式传入** —— 占位逐页不同（设计稿第 03 页「搜索收藏夹与合集」、
 * 第 04 页「搜索标题 / UP 主名称」，其余页为本值），真值在 spec-lock 的
 * `globalChrome.search.placeholderByRoute`，契约在 `layout/route-shell` 的
 * `resolveSearchPlaceholder`。这里留一份是为**无契约的调用方**（设计系统展位、
 * 单测）。两处同值、不得漂移：primitives 不能反向依赖 `layout/`，
 * 所以无法收敛成一处，改由 `tests/app-shell-interactions.test.ts` 钉住。
 */
const DEFAULT_PLACEHOLDER = "搜索音乐视频或创作者";

/**
 * 输入框右侧为提示留出的固定空间（键帽 54.5 + 与文字之间约 7）。
 *
 * 恒定预留而不是「有提示才预留」：否则输入 / 清空时输入区宽度会跳变。
 * 有值时这块空间归 HeroUI 的清除按钮，两者不会同时出现。
 */
const HINT_GUTTER = "pe-[62px]";

/**
 * 顶栏搜索位（原型 `.search`）。
 *
 * 几何：高 40、圆角 999、左内边距 16、右 8、图标 20、字号 15、底色白 10%
 * （`--biu-surface-search`，设计稿实测 9.9%）。**不要**改用 `--biu-surface-field`：
 * 那一格是白 17%，同时喂 `.pill--neutral`，而药丸设计实测 17.8% —— 两个消费者
 * 需要不同的值，见 spec-lock `globalChrome.search.field.rule`。
 * 宽度是**弹性**的（`min(32vw, 400px)`，下限 240）：设计稿在 1440 宽下是 400，
 * 但窗口收窄时若写死 400，右侧的头像与窗口按钮会被挤出去。
 *
 * 本组件只负责「样子 + 输入框」，不含任何业务：搜索建议、历史、快捷键注册
 * 都留在顶栏（那里才知道路由与用户态）。这样 `/search` 页也能复用同一外壳。
 *
 * 底座沿用 HeroUI `Input`（方案 §4.3）：键盘、焦点环、清除按钮都由它保证，
 * 只把外观换成 C+ 令牌 —— 自己重写一套焦点管理是这类组件最常见的返工来源。
 *
 * ⚠️ 快捷键键帽**不能**走 `Input` 的 `endContent` 口。`Input` 在 `isClearable`
 * 下会把 `endContent` 嵌进清除按钮（`<button class="… opacity-0 …">`），而清除
 * 按钮在输入框为空时正是 `opacity: 0` —— 于是键帽进了 DOM 却整块不可见。
 * 这个坑 jsdom 抓不到（`textContent` 里有字）、像素闸门也只会看到「键帽没画」，
 * 只能靠 DOM 探针里「kbd 的父节点是个 opacity 0 的 button」才看得出来。
 * 所以键帽由本组件自己绝对定位在根容器上，与 `Input` 平级。
 */
export const TopBarSearch = ({
  value,
  onValueChange,
  label = "搜索音乐视频或创作者",
  placeholder = DEFAULT_PLACEHOLDER,
  inputRef,
  rootRef,
  shortcutHint,
  onFocus,
  onBlur,
  onKeyDown,
  onClick,
  className,
  children,
}: TopBarSearchProps) => {
  // `undefined` → 用默认键帽；`null` → 明确关掉；其余按调用方给的节点渲染。
  const hint = shortcutHint === undefined ? DEFAULT_SHORTCUT_HINT : shortcutHint;
  const showHint = hint !== null && value.length === 0;

  return (
    <div ref={rootRef} className={twMerge("relative w-[min(32vw,400px)] min-w-[240px]", className)}>
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
        className="window-no-drag w-full"
        classNames={{
          input: twMerge(
            "text-[length:var(--biu-type-body-size)] outline-none focus-visible:outline-none placeholder:text-[var(--biu-text-placeholder)]",
            HINT_GUTTER,
          ),
          inputWrapper:
            "h-10 rounded-[var(--biu-radius-pill)] border border-transparent bg-[var(--biu-surface-search)] px-4 text-[rgb(var(--biu-text-primary))] shadow-none outline-none transition-[background-color,border-color,box-shadow] group-data-[focus=true]:border-[var(--biu-glass-border)] group-data-[focus=true]:bg-[var(--biu-surface-search)] group-data-[focus=true]:shadow-[0_0_0_3px_var(--biu-accent-soft)] group-data-[focus-visible=true]:ring-0 group-data-[focus-visible=true]:outline-none",
        }}
      />
      {showHint && (
        <kbd
          aria-hidden="true"
          className="pointer-events-none absolute end-2 top-1/2 z-10 flex h-6 -translate-y-1/2 items-center rounded-[7px] bg-[var(--biu-veil-12)] px-2 text-[length:var(--biu-type-micro-size)] tracking-[0.2px] text-[rgb(var(--biu-text-chrome-label))]"
        >
          {hint}
        </kbd>
      )}
      {children}
    </div>
  );
};
