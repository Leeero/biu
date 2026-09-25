import { Link, useLocation } from "react-router";

import clx from "classnames";

import type { TopbarSegment } from "@/layout/route-shell";

interface SegmentNavProps {
  segments: TopbarSegment[];
}

/**
 * 顶栏中部的分段控件。
 *
 * 几何取自设计稿实测：容器高 40、内边距 8、药丸 999、项间距 2；项高 40、
 * 左右内边距 22、字号 13。激活项是**反色药丸**（近白底 + 近黑字），
 * 用的是色板里登记好的 `--biu-inverse-surface` / `--biu-inverse-ink` 那一对。
 *
 * 两处有意收敛（原型里的临时值不在色板登记范围内，收敛到已登记的透明表面梯度）：
 *   · 容器底：原型为 9% 白色叠层 → `--biu-surface-hover`（10%）
 *   · 悬停底：原型为 8% 白色叠层 → `--biu-surface-hover`（10%）
 * 差额 ≤2%，远低于 L3 整屏亮度差的容差；把一次性取值收敛进梯度是色板存在的意义。
 *
 * 分段有两种形态，由 `href` 决定：
 *   · 有 `href`：导航型（当前只有默认一级导航），激活态由当前路径决定；
 *   · 无 `href`：页面子视图切换，只有声明该分段的路由才会产出这种形态，
 *     在页面接上切换逻辑之前渲染为不可交互，避免出现「点了没反应」的假控件。
 */
const SegmentNav = ({ segments }: SegmentNavProps) => {
  const location = useLocation();

  const itemClass = (isActive: boolean) =>
    clx(
      "flex h-10 flex-none items-center rounded-[var(--biu-radius-pill)] px-[22px]",
      "text-[length:var(--biu-type-label-size)] whitespace-nowrap",
      "transition-colors duration-[var(--biu-duration-fast)]",
      isActive
        ? "bg-[rgb(var(--biu-inverse-surface))] font-semibold text-[rgb(var(--biu-inverse-ink))]"
        : "text-[rgb(var(--biu-text-secondary))] hover:bg-[var(--biu-surface-hover)]",
    );

  return (
    <nav
      aria-label="顶栏分段导航"
      className="window-no-drag flex h-10 flex-none items-center gap-0.5 rounded-[var(--biu-radius-pill)] bg-[var(--biu-surface-hover)] px-2"
    >
      {segments.map(segment => {
        if (!segment.href) {
          return (
            <span key={segment.label} aria-disabled="true" className={itemClass(false)}>
              {segment.label}
            </span>
          );
        }

        const isActive = location.pathname === segment.href;
        return (
          <Link
            key={segment.label}
            to={segment.href}
            aria-current={isActive ? "page" : undefined}
            className={itemClass(isActive)}
          >
            {segment.label}
          </Link>
        );
      })}
    </nav>
  );
};

export default SegmentNav;
