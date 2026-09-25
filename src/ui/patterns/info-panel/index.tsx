import type { ReactNode } from "react";

import { twMerge } from "tailwind-merge";

interface InfoPanelProps {
  /** 面板顶部的小标题（原型 `.panel-eyebrow`），字号 17、色为二级文字。 */
  eyebrow?: ReactNode;
  /** 条目列表。字符串会自动带上 `<b>` 的高亮规则由调用方决定，数组元素原样渲染。 */
  items?: ReactNode[];
  children?: ReactNode;
  className?: string;
}

/**
 * 信息面板（原型 `.panel` / `.panel-eyebrow` / `.panel-list`）。
 *
 * 材质：圆角 20、白 16% 底、白 18% 描边、背景模糊 20 —— 与 `--biu-surface-glass` /
 * `--biu-glass-border` 是同一组值，即设计稿里唯一的「玻璃」材质，不要另起一套。
 *
 * 它是 `PageHeader` 右侧那一栏的标准内容（`<PageHeader aside={<InfoPanel …/>}>`）。
 * 用 `<aside>`：面板里的信息是主内容的旁注，语义上不属于主阅读流。
 */
export const InfoPanel = ({ eyebrow, items, children, className }: InfoPanelProps) => (
  <aside
    className={twMerge(
      "rounded-[var(--biu-radius-lg)] border border-[var(--biu-glass-border)] bg-[var(--biu-surface-glass)]",
      "px-[22px] py-5 backdrop-blur-[var(--biu-blur-glass)]",
      className,
    )}
  >
    {eyebrow && (
      <p className="m-0 mb-1 text-[length:var(--biu-type-small-size)] leading-6 text-[rgb(var(--biu-text-secondary))]">
        {eyebrow}
      </p>
    )}
    {items && items.length > 0 && (
      <ul className="m-0 list-none p-0 text-[length:var(--biu-type-small-size)] leading-[27px] text-[rgb(var(--biu-text-primary))]">
        {items.map((item, index) => (
          // 面板条目是静态说明文字，顺序固定且不重排，用下标作 key 是安全的
          <li key={index}>{item}</li>
        ))}
      </ul>
    )}
    {children}
  </aside>
);
