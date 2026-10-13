import type { ReactNode } from "react";

import { FilterBar } from "@/ui/patterns/filter-bar";
import { PageHeader } from "@/ui/patterns/page-header";
import { Button } from "@/ui/primitives/button";
import { Pill } from "@/ui/primitives/pill";

import type { DiscoverFilter } from "./discover-view";

/**
 * 「发现音乐」两个展示分支（卡片 / 列表）**共用**的页头几何。
 *
 * 为什么只留一组值，而不是让两屏各管一套：
 *
 * 展示模式决定的是**内容区怎么画**（卡片网格还是曲目表），不该顺带改变页头 ——
 * 同一次切换里 H1 字号差 20px、副标题上下挪 10px、筛选控件跟着换宽，用户会以为
 * 自己跳去了别的页面。此前两分支各自持有一套页头（卡片是 `.discover4188-heading`
 * 的 36px/18px，列表是 `PageHeader` 的 56px/8px），就是这个症状的成因。
 *
 * 取值与来路：
 *   `h1Top` **121 两屏一致**（spec-lock `screens[06/07].anchors.h1Top`），所以 H1
 *   这一层两屏本来就没分歧，统一不产生任何位移 —— 这也是统一可行的前提。
 *   `leadMarginTop` 18 / `filterMarginTop` 13 取**卡片屏**那一组；列表屏原为
 *   8 / 20（锚点 lead 192 / filter 236，卡片是 202 / 239）。差异落在 10px 与 3px
 *   两处，且只影响页头内部的疏密，不动首屏内容带的任何 y（列表屏首 cover 仍是
 *   380 —— 由 `DISCOVER_LIST_RHYTHM.sectionGap` 独立闭合）。
 *
 * 代价写在前面：列表屏的导语会比设计稿低 10px、筛选条低 3px。要让两屏在设计稿
 * 里也逐像素一致，得改的是**同一屏的两种静态稿**，而这是产品上的同一个页面的
 * 两个模式 —— 用户会在它们之间来回切，形式上的稳定比两稿各差几像素更重要。
 * 这条取舍同时落进了 spec-lock（`screens[07].rhythmImplementation` 改为取值同
 * 屏 07），不要让实现与那里悄悄漂移。
 */
export const DISCOVER_HEAD_RHYTHM = {
  /** 导语上边距。两屏统一取卡片屏的值（原列表屏为 8）。 */
  leadMarginTop: 18,
  /** 筛选条上边距。两屏统一取卡片屏的值（原列表屏为 20）。 */
  filterMarginTop: 13,
} as const;

interface DiscoverHeadingProps {
  title: string;
  lead: ReactNode;
  filters: DiscoverFilter[];
  onPillPress: (filter: DiscoverFilter) => void;
}

/**
 * 页头（两个展示分支共用）。
 *
 * 用 `PageHeader` 而不是自研容器：机体的 11px 错位基线（`aligned`）是两屏共有的，
 * spec-lock 也明确要求取 `aligned` 而非原型类名里的 `flat` —— `PageHeader` 缺省
 * 就是这个，不必再发明一遍。屏级像素靠 `leadOffsetPx` / `gapPx` 两个显式入参下发。
 *
 * **`filterControl` / `viewSwitcher` 两个槽位已随 2026-10-12 的产品决策移除**：
 * 数据源收敛为单一的「音乐分区」后，页头没有互斥二选一可表达；视图切换也一并砍掉
 * （本页永久卡片模式）。两处都别再以「真实路径要传」为由接回 —— 现在没有任何调用方
 * 需要它们，`filters` 是页头唯一的筛选渲染源。
 */
export const DiscoverHeading = ({ title, lead, filters, onPillPress }: DiscoverHeadingProps) => (
  <PageHeader title={title} lead={lead} leadOffsetPx={DISCOVER_HEAD_RHYTHM.leadMarginTop}>
    <FilterBar label="发现音乐筛选" gapPx={DISCOVER_HEAD_RHYTHM.filterMarginTop}>
      {filters.map(item =>
        item.onPress ? (
          <Button
            key={item.key}
            variant={item.variant}
            icon={item.icon}
            trailing={item.trailing}
            disabled={item.disabled}
            onClick={() => onPillPress(item)}
          >
            {item.label}
          </Button>
        ) : (
          <Pill key={item.key} variant={item.variant} icon={item.icon} trailing={item.trailing}>
            {item.label}
          </Pill>
        ),
      )}
    </FilterBar>
  </PageHeader>
);
