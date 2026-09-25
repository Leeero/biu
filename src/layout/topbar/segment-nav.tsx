import { useLocation } from "react-router";

import type { TopbarSegment } from "@/layout/route-shell";

import { SegmentedControl, type SegmentItem } from "@/ui/primitives/segmented-control";

interface SegmentNavProps {
  segments: TopbarSegment[];
}

/**
 * 顶栏中部的分段组 —— 路由契约（`TopbarSegment[]`）到 `SegmentedControl` 的适配层。
 *
 * 这个文件只剩下「翻译」，视觉与语义全部由 `SegmentedControl` 承担。此前的
 * 内联实现与组件层是同一份设计的两个副本，而那份副本里有三处取值是**临时收敛**：
 *
 *   位置             原型（app.css）          内联曾用        现在
 *   .tabgroup 底     白 9%    第 104 行       surface-hover   veil-9
 *   .tab:hover       白 8%    第 122 行       surface-hover   veil-8
 *   .tab 文字        顶栏标签色 第 116 行     text-secondary  text-chrome-label
 *
 * 当时收敛的理由写在旧注释里：那些一次性的白色叠层**没有登记进色板**，
 * 只能挑一个最接近的已有档位（白 10%）顶上。P2 已把 4 / 5.5 / 8 / 9 / 12 /
 * 14 / 18 / 20 / 22 / 28% 十档按实际不透明度登记进 palette.css，收敛的理由
 * 随之消失，所以这里改回原型值。三处差值分别是 1% / 2% / 通道差 4，
 * 都落在 L3 整屏亮度差的容差之内。
 *
 * `window-no-drag` 必须由本层给出：整条顶栏是可拖动窗口区域，分段组要挡住拖动
 * 才能被点到。组件层不该知道 Electron 的窗口拖动，那是壳层的事。
 */
const SegmentNav = ({ segments }: SegmentNavProps) => {
  const location = useLocation();

  const items: SegmentItem[] = segments.map(segment => ({
    // 导航型的稳定键就是目标路径；没有 href 的分段用它自己的标签。
    key: segment.href ?? segment.label,
    label: segment.label,
    href: segment.href,
    // 没有 href 表示「标签已声明、子视图切换还没接线」，如实渲染为不可交互，
    // 而不是渲染一个点了没反应的按钮。详见 SegmentItem.pending 的说明。
    pending: !segment.href,
  }));

  return (
    <SegmentedControl label="顶栏分段导航" activeKey={location.pathname} items={items} className="window-no-drag" />
  );
};

export default SegmentNav;
